import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {DPT_DATABASE,DPT_BY_ID,filterDpts} from '../components/dptDatabase';
import {DPT_INPUTS,defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {dptLayout} from './dptLayout';
test('454 unique versioned DPT identities, corrected additions/removals and pending provenance',()=>{
 assert.equal(DPT_DATABASE.length,454);assert.equal(new Set(DPT_DATABASE.map(r=>r.id)).size,454);
 for(const id of ['20.010','201.101','203.016','207.103'])assert.equal(DPT_BY_ID[id],undefined);
 for(const id of ['200.101','209.101','222.101','269.1200'])assert.ok(DPT_BY_ID[id]);
 assert.equal(DPT_DATABASE.filter(r=>r.layoutPending).length,2);
 assert.equal(DPT_BY_ID['14.052'].name,'DPT_Value_MassFlux');assert.equal(DPT_BY_ID['14.052'].unit,'kg s-1');
 for(const [id,size] of [['256.001','16 bytes'],['271.1200','7 bytes'],['277.1200','36 bytes'],['284.1200','86 bytes'],['206.102','3 bytes']])assert.equal(DPT_BY_ID[id].size,size);
 assert.ok(DPT_BY_ID['240.800'].sourceNotes.length);assert.ok(DPT_BY_ID['14.053'].sourceNotes.length);
 for(const r of DPT_DATABASE){assert.ok(r.format);assert.ok(r.overviewPage>=17&&r.overviewPage<=26);}
});
test('All 316 interactive defaults round-trip through hex with matching field widths and catalogue sizes',()=>{
 for(const [id,spec] of Object.entries(DPT_INPUTS)){
  const bits=encodeDpt(id,defaults(id));const decoded=decodeDptHex(id,payloadHex(bits));
  assert.equal(encodeDpt(id,decoded.values),bits,id);
  assert.equal(dptLayout(id,spec.size).reduce((n,f)=>n+f.bits,0),spec.size,id);
  const row=DPT_BY_ID[id],n=parseInt(row.size);assert.equal(row.size.includes('byte')?n*8:n,spec.size,id);
 }
});
test('Decoding known values and invalid/reserved payloads',()=>{
 assert.equal(decodeDptHex('9.001','0C 97').values.value,'23.5');assert.equal(decodeDptHex('9.001','8A24').values.value,'-30');
 assert.deepEqual(decodeDptHex('18.001','BF').values,{scene:'64',action:'1'});
 assert.equal(decodeDptHex('5.001','FF').values.value,'100');assert.equal(decodeDptHex('13.001','FF FF FF FF').values.value,'-1');
 for(const [id,hex] of [['9.001','7FFF'],['18.001','40'],['17.001','80'],['1.001','02'],['20.102','05'],['10.001','004000'],['11.001','1F0264'],['14.000','7F800000'],['232.600','GG0000']])assert.throws(()=>decodeDptHex(id,hex),id);
});
test('Search combines words and supports exact IDs, family, type and pending filters',()=>{
 assert.equal(filterDpts('DPT 269.1200')[0].id,'269.1200');assert.equal(filterDpts('massflux')[0].id,'14.052');
 assert.equal(filterDpts('','all','all','interactive').length,316);assert.equal(filterDpts('','all','all','pending').length,2);
 assert.ok(filterDpts('','9','Float').every(r=>r.family==='9'&&r.dataType==='Float'));
 assert.equal(filterDpts('not-a-datapoint').length,0);
});
test('Prioritised pending layouts and all size-corrected descriptions are reviewed',()=>{
 const priorities=DPT_DATABASE.filter(r=>['20','21','200','201','202','203','204','205','206'].includes(r.family));
 assert.equal(priorities.filter(r=>r.layoutPending).length,0);
 for(const row of DPT_DATABASE.filter(r=>r.changes.some(c=>c.action.includes('Size corrected')))) {
  assert.equal(row.descriptionReviewed,true,row.id);
  assert.doesNotMatch(row.range,/to be filled in/,row.id);
 }
 for(const row of DPT_DATABASE.filter(r=>r.fields.length)) {
  let width=0; for(const field of row.fields) width+=field.bits;
  assert.equal(width,parseInt(row.size)*(row.size.includes('byte')?8:1),row.id);
 }
 assert.match(DPT_BY_ID['256.001'].range,/start date\/time followed by eight-byte stop/);
 assert.match(DPT_BY_ID['206.102'].range,/delay in minutes/);
 assert.equal(DPT_BY_ID['206.102'].dataType,'Composite');
 assert.match(DPT_BY_ID['20.007'].range,/0 and 4–255 are reserved/);
 assert.match(DPT_BY_ID['21.1000'].fields.find(f=>f.name.includes('Asynchronous'))!.meaning,/Must be 1/);
});
test('Former placeholder notes are replaced and unresolved source contradictions stay explicit',()=>{
 assert.equal(DPT_DATABASE.filter(r=>r.descriptionReviewed).length,351);
 assert.ok(DPT_DATABASE.every(r=>!r.range.includes('to be filled in')));
 assert.deepEqual(DPT_DATABASE.filter(r=>r.layoutPending).map(r=>r.id),['243.600','248.600']);
 assert.match(DPT_BY_ID['269.1200'].fields.find(f=>f.name==='Energy invalid')!.meaning,/1 = energy invalid; 0 = valid/);
 assert.match(DPT_BY_ID['245.600'].layoutNotes.join(' '),/reserved nibble/);
});
