import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {act,create} from 'react-test-renderer';
import {SendingSimulator} from './SendingSimulator';
import {RoutingCounterExplorer} from './RoutingCounterExplorer';
import {TopologyExplorer} from './TopologyExplorer';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const text=(n:any):string=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.children?text(n.children):'';
test('Sending-address exercise retains Lamp A when sending to B, then writes OFF only to A',async()=>{
  let r:any;await act(()=>{r=create(<SendingSimulator/>);});
  const input=(label:string)=>r.root.findByProps({'aria-label':label});
  const toggle=async(label:string)=>act(()=>input(label).props.onChange());
  const send=async()=>act(()=>r.root.findAllByType('button').find((n:any)=>text(n)==='Press Push Button (Sensor 1)').props.onClick());
  await toggle('sensor1 1/1/1');await toggle('actuator1 1/1/1');await send();
  assert.equal(text(input('Lamp A state')),'ON');
  await toggle('sensor1 1/1/2');await toggle('sensor1 1/1/1');await toggle('actuator2 1/1/2');await send();
  assert.equal(text(input('Lamp A state')),'ON');assert.equal(text(input('Lamp B state')),'ON');
  await toggle('sensor1 1/1/1');await toggle('sensor1 1/1/2');
  await act(()=>input('Switch value').props.onChange({target:{value:'0'}}));
  await act(()=>input('Lamp A write').props.onChange({target:{checked:false}}));await send();
  assert.equal(text(input('Lamp A state')),'ON');
  await act(()=>input('Lamp A write').props.onChange({target:{checked:true}}));await send();
  assert.equal(text(input('Lamp A state')),'OFF');assert.equal(text(input('Lamp B state')),'ON');
  await act(()=>r.unmount());
});
test('routing UI shows final RC 0 delivery and resets after filter changes',async()=>{
  let r:any;await act(()=>{r=create(<RoutingCounterExplorer/>);});
  const next=()=>r.root.findAllByType('button').find((n:any)=>text(n)==='Next event');
  for(let i=0;i<8;i++) await act(()=>next().props.onClick());
  assert.match(text(r.toJSON()),/Receiver reached/);
  assert.match(text(r.root.findByProps({'aria-label':'Routing event log'})),/segment with RC 0/);
  await act(()=>r.root.findByProps({'aria-label':'Routing filter'}).props.onChange({target:{value:'1.1.0'}}));
  assert.match(text(r.toJSON()),/No telegram sent yet/);
  for(let i=0;i<3;i++) await act(()=>next().props.onClick());
  assert.match(text(r.toJSON()),/Trace stopped/);assert.match(text(r.toJSON()),/absent from this coupler/);
  await act(()=>r.unmount());
});
test('topology rejects malformed and unrepresented addresses without claiming a match',async()=>{
 let r:any;await act(()=>{r=create(<TopologyExplorer/>);});
 for(const value of ['1.1.10abc','-1.1.1','0.0.0','0.1.2']) {
   await act(()=>r.root.findByProps({'aria-label':'Individual address search'}).props.onChange({target:{value}}));
   await act(()=>r.root.findByType('form').props.onSubmit({preventDefault(){}}));
   assert.doesNotMatch(text(r.toJSON()),/Successfully located|Found address/);
   assert.match(text(r.toJSON()),/Enter exactly|outside this example/);
 }
 assert.match(text(r.toJSON()),/61,695/);assert.match(text(r.toJSON()),/60,780/);
 assert.doesNotMatch(text(r.toJSON()),/573.7|257 Nodes/);
 await act(()=>r.unmount());
});
