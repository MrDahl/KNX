import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {parseCaptureRecord,candidateDpts,decodeCapture,captureScenario,parseCaptureXml} from './capture';
import {APCICode} from '../types';
// Synthetic cEMI vectors: no installation metadata or uploaded capture is bundled.
const frame=(tail='0300800637',service='29')=>`${service}00BCE012030A04${tail}`;
test('cEMI facts and alternative DPT interpretations stay separate',()=>{
 const r=parseCaptureRecord(frame());assert.equal(r.error,undefined);assert.equal(r.source,'1.2.3');assert.equal(r.destination,'1/2/4');assert.equal(r.hopCount,6);assert.equal(r.payload,'06 37');
 assert.equal(decodeCapture(r,'7.001').values.value,'1591');assert.equal(Number(decodeCapture(r,'9.001').values.value),15.91);
 assert.ok(candidateDpts(r).some(d=>d.id==='8.001'));assert.ok(!candidateDpts(r).some(d=>d.id==='1.001'));
 const s=captureScenario(r,'9.001');assert.equal(s.captureParams.command,APCICode.GroupValueWrite);assert.deepEqual(s.captureParams.source,{area:1,line:2,device:3});assert.match(s.origin,/reconstructed/);
});
test('compact widths are ambiguous and high unused bits exclude narrower candidates',()=>{
 const r=parseCaptureRecord(frame('010081'));for(const id of ['1.001','2.001','3.007'])assert.ok(candidateDpts(r).some(d=>d.id===id));
 const large=parseCaptureRecord(frame('010089'));assert.ok(!candidateDpts(large).some(d=>d.id==='1.001'));assert.ok(candidateDpts(large).some(d=>d.id==='3.007'));
});
test('read has no DPT evidence; response and confirmation retain their services',()=>{
 const r=parseCaptureRecord(frame('010000','2E'));assert.equal(r.service,'L_Data.con');assert.equal(r.payload,'');assert.deepEqual(candidateDpts(r),[]);assert.equal(captureScenario(r,'1.001').captureParams.command,APCICode.GroupValueRead);
 const response=parseCaptureRecord(frame('02004082'));assert.equal(response.operation,'GroupValueResponse');assert.equal(captureScenario(response,'5.010').captureParams.command,APCICode.GroupValueResponse);
});
test('invalid or unsupported records cannot enter the generator',()=>{
 for(const raw of ['XYZ','2900','2900BCE012030A04050080FF',frame('020081FF'),'100000']){const r=parseCaptureRecord(raw);assert.ok(r.error);assert.deepEqual(candidateDpts(r),[]);assert.throws(()=>captureScenario(r,'1.001'));}
 assert.ok(parseCaptureRecord(frame(),'','L_Data.con').error);
 const individual=parseCaptureRecord(frame().replace('BCE0','BC60'));assert.equal(individual.group,false);assert.deepEqual(candidateDpts(individual),[]);
 const extended=parseCaptureRecord(frame().replace('BCE0','3CE0'));assert.throws(()=>captureScenario(extended,'9.001'));
});
test('additional-info offsets and captured priority / repeat / hop are preserved',()=>{
 const r=parseCaptureRecord('2903010100'+'94B012030A04010081');assert.equal(r.error,undefined);assert.equal(r.source,'1.2.3');assert.equal(r.bytes[5].label,'Control 1');
 const p=captureScenario(r,'1.001').captureParams;assert.equal(p.hopCount,3);assert.equal(p.priority,'01');assert.equal(p.repeatFlag,'0');
});
test('XML parser rejects entities and oversized uploads before constructing DOM',()=>{
 class Never {constructor(){throw Error('DOM should not run');}}
 assert.throws(()=>parseCaptureXml('<!DOCTYPE x>',Never as any),/entities/);
 assert.throws(()=>parseCaptureXml(' '.repeat(5000001),Never as any),/5 MB/);
});

test('repeat control is service-specific and requests reconstruct as original frames',async()=>{
 const {captureRepeatDescription}=await import('./capture');
 for(const bit of [0,1]){
  const raw=frame().replace('BCE0',bit?'BCE0':'9CE0');
  const ind=parseCaptureRecord(raw);assert.match(captureRepeatDescription(ind),bit?/original/:/repeated/);
  const req=parseCaptureRecord('11'+raw.slice(2));assert.match(captureRepeatDescription(req),bit?/do not repeat/:/repeat permitted/);
  assert.equal(captureScenario(req,'9.001').captureParams.repeatFlag,'1');
  assert.match(captureScenario(req,'9.001').origin,/not an observed TP repetition/);
  const con=parseCaptureRecord('2E'+raw.slice(2));assert.match(captureRepeatDescription(con),/does not establish/);
 }
});
