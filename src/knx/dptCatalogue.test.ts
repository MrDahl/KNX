import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {DPT_DATABASE,DPT_BY_ID,filterDpts} from '../components/dptDatabase';
import {DPT_INPUTS,defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {dptLayout} from './dptLayout';
test('453 unique versioned DPT identities, corrected additions/removals and pending provenance',()=>{
 assert.equal(DPT_DATABASE.length,453);assert.equal(new Set(DPT_DATABASE.map(r=>r.id)).size,453);
 for(const id of ['20.010','201.101','203.016','207.103'])assert.equal(DPT_BY_ID[id],undefined);
 for(const id of ['200.101','209.101','222.101','269.1200'])assert.ok(DPT_BY_ID[id]);
 assert.equal(DPT_DATABASE.filter(r=>r.layoutPending).length,69);
 assert.equal(DPT_BY_ID['14.052'].name,'DPT_Value_MassFlux');assert.equal(DPT_BY_ID['14.052'].unit,'kg s-1');
 for(const [id,size] of [['256.001','16 bytes'],['271.1200','7 bytes'],['277.1200','36 bytes'],['284.1200','86 bytes'],['206.102','3 bytes']])assert.equal(DPT_BY_ID[id].size,size);
 assert.ok(DPT_BY_ID['240.800'].sourceNotes.length);assert.ok(DPT_BY_ID['14.053'].sourceNotes.length);
 for(const r of DPT_DATABASE){assert.ok(r.format);assert.ok(r.overviewPage>=17&&r.overviewPage<=26);}
});
test('All 24 interactive defaults round-trip through hex with matching field widths and catalogue sizes',()=>{
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
 assert.equal(filterDpts('','all','all','interactive').length,24);assert.equal(filterDpts('','all','all','pending').length,69);
 assert.ok(filterDpts('','9','Float').every(r=>r.family==='9'&&r.dataType==='Float'));
 assert.equal(filterDpts('not-a-datapoint').length,0);
});
