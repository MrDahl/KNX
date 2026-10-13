import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {parseIndividualAddress, receiveSwitchWrite, calculatePowerBudget, traceRoute} from './teachingModels';
import {routingExample} from './routingExample';

test('individual-address parser rejects partial, signed, fractional and out-of-range fields',()=>{
  for (const input of ['1.1.10abc','-1.1.1','1.-1.1','1.1.-1','1.1.1.5','1.1','1..1','16.1.1','1.16.1','1.1.256','1e1.1.1','+1.1.1',' 1.1.1','1.1.1\n']) assert.equal(parseIndividualAddress(input),null,input);
  assert.deepEqual(parseIndividualAddress('15.15.255'),[15,15,255]);
  assert.deepEqual(parseIndividualAddress('0.0.0'),[0,0,0]); // syntax-valid; placement handled separately
});
test('group writes change only linked, enabled receivers and support OFF writes',()=>{
  assert.equal(receiveSwitchWrite(true,false,false,true,true).state,true);
  assert.equal(receiveSwitchWrite(false,true,false,true,true).state,false);
  assert.equal(receiveSwitchWrite(true,false,true,false,true).state,true);
  assert.equal(receiveSwitchWrite(true,false,true,true,false).state,true);
  assert.equal(receiveSwitchWrite(true,false,true,true,true).state,false);
  assert.equal(receiveSwitchWrite(false,true,true,true,true).state,true);
});
test('power budget keeps current and interface loading independent',()=>{
  const item={id:1,name:'example',quantity:64,current:5,tp:'TP1-64' as const};
  assert.deepEqual(calculatePowerBudget(320,[item]),{valid:true,current:320,loads:256,remaining:0,currentOK:true,loadOK:true});
  assert.equal(calculatePowerBudget(1280,[{...item,quantity:65}]).loadOK,false);
  assert.equal(calculatePowerBudget(160,[{...item,tp:'TP1-256'}]).currentOK,false);
  for (const patch of [{quantity:-1},{quantity:1.5},{current:NaN},{current:-1}]) assert.equal(calculatePowerBudget(640,[{...item,...patch}]).valid,false);
});
test('routing follows the actual path, accepts final HC 0, rejects the next crossing',()=>{
  const parallel=traceRoute(routingExample('parallel'),6);
  assert.equal(parallel.at(-1)?.id,'destination');
  assert.equal(parallel.at(-1)?.after,0);
  assert.equal(parallel.filter(e=>e.forwarded).length,6);
  const series=traceRoute(routingExample('series'),6);
  assert.equal(series.at(-1)?.id,'15.15.0');
  assert.equal(series.at(-1)?.blocked,true);
  assert.equal(series.find(e=>e.id==='15.0.0')?.forwarded,true);
  assert.equal(traceRoute(routingExample('parallel'),0).at(-1)?.id,'1.1.192');
  assert.equal(traceRoute(routingExample('parallel'),5).at(-1)?.id,'15.15.192');
  assert.throws(()=>traceRoute(routingExample('parallel'),7));
});
test('filter rejection and HC exhaustion are independent; repeater has no filter',()=>{
  const nodes=routingExample('parallel');
  const filtered=traceRoute(nodes,6,'1.1.0');
  assert.equal(filtered.at(-1)?.before,5);
  assert.match(filtered.at(-1)!.reason,/filter table/);
  assert.equal(traceRoute(nodes,6,'1.1.192').at(-1)?.id,'destination');
  const local=traceRoute([nodes[0],nodes.at(-1)!],0);
  assert.equal(local.at(-1)?.id,'destination');
  assert.equal(local.at(-1)?.blocked,false);
});
