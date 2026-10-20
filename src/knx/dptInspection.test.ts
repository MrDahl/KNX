import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {inspectDpt,overlaps} from './dptInspection';
import {defaults,encodeDpt,DPT_INPUTS} from './dptCodec';
const inspect=(id:string,v:Record<string,string>={})=>{const values={...defaults(id),...v};return inspectDpt(id,encodeDpt(id,values),values);};
test('inspection accounts for display padding and cross-octet fields',()=>{
 const compact=inspect('3.007');assert.equal(compact.padding,4);assert.equal(compact.fields[0].start,4);assert.equal(compact.fields[1].end,8);
 const version=inspect('217.001');assert.deepEqual(version.fields.map(f=>[f.start,f.end]),[[0,5],[5,10],[10,16]]);
 assert.equal(version.fields.filter(f=>overlaps(f,0,8)).length,2);
 assert.equal(version.fields.filter(f=>overlaps(f,8,16)).length,2);
 assert.equal(version.fields.filter(f=>overlaps(f,8,9))[0].name,'Version number');
});
test('Z8 inspection follows selected service and main-field validity',()=>{
 assert.equal(inspect('205.100',{z8Status:'2',faultCode:'2'}).fields[0].meaning,'Short circuit');
 assert.match(inspect('205.100',{z8Status:'6'}).fields[0].meaning,/Overridden/);
 assert.match(inspect('205.100',{z8Status:'1',rawMain:'65535'}).fields[0].meaning,/not a measurement/);
 const command=inspect('205.100',{z8Mode:'1',z8Command:'2',rawMain:'65535'});
 assert.match(command.fields[0].meaning,/Ignored/);assert.equal(command.fields[1].meaning,'Release');
});
test('all supported layouts cover the value exactly without precision loss',()=>{
 for(const id of Object.keys(DPT_INPUTS)){
  const m=inspect(id);assert.equal(m.fields[0].start,m.padding,id);assert.equal(m.fields.at(-1)!.end,m.padded.length,id);
  assert.equal(m.fields.map(f=>f.bits).join(''),m.padded.slice(m.padding),id);
 }
});
