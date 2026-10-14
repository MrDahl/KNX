import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {create,act} from 'react-test-renderer';
import {DatapointTypesList} from './DatapointTypesList';
import {TelegramVisualizer} from './TelegramVisualizer';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const text=(n:any):string=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.children?text(n.children):'';
test('Search, decoding and handoff preserve the selected DPT and value',async()=>{
 let r:any,scenario:any;await act(()=>{r=create(<DatapointTypesList onUseTelegram={s=>scenario=s}/>);});
 await act(()=>r.root.findByProps({'aria-label':'DPT hexadecimal value'}).props.onChange({target:{value:'8A 24'}}));
 await act(()=>r.root.findAllByType('button').find((n:any)=>text(n)==='Decode value').props.onClick());
 assert.equal(r.root.findByProps({'aria-label':'Temperature (°C)'}).props.value,'-30');
 await act(()=>r.root.findAllByType('button').find((n:any)=>text(n).includes('Use value in Telegram Visualiser')).props.onClick());
 assert.deepEqual(scenario,{id:'9.001',values:{value:'-30'}});
 await act(()=>r.root.findByProps({'aria-label':'Search DPT catalogue'}).props.onChange({target:{value:'243.600'}}));
 await act(()=>r.root.findByProps({'aria-label':'Inspect DPT 243.600'}).props.onClick());
 assert.match(text(r.toJSON()),/Source clarification pending/);assert.match(text(r.toJSON()),/8 bytes/);
 assert.equal(r.root.findAllByProps({'aria-label':'DPT hexadecimal value'}).length,0);
 await act(()=>r.unmount());await act(()=>{r=create(<TelegramVisualizer scenario={scenario}/>);});
 assert.equal(r.root.findByProps({'aria-label':'Datapoint type'}).props.value,'9.001');assert.equal(r.root.findByProps({'aria-label':'Temperature (°C)'}).props.value,'-30');
 await act(()=>r.unmount());
});
test('Explanation and reviewed layouts are visible without level tabs',async()=>{
 let r:any;await act(()=>{r=create(<DatapointTypesList/>);});
 assert.equal(r.root.findAllByProps({'aria-label':'Explanation level'}).length,0);
 assert.match(text(r.toJSON()),/least-significant bit first/);
 await act(()=>r.root.findByProps({'aria-label':'Search DPT catalogue'}).props.onChange({target:{value:'200.101'}}));
 await act(()=>r.root.findByProps({'aria-label':'Inspect DPT 200.101'}).props.onClick());
 assert.match(text(r.root.findByProps({'aria-label':'Reviewed DPT description'})),/0 = low; 1 = high/);
 assert.match(text(r.root.findByProps({'aria-label':'Z8 status and command'})),/not applicable to ordinary/);
 assert.equal(r.root.findAllByProps({'aria-label':'DPT hexadecimal value'}).length,0);
 await act(()=>r.unmount());
});
test('Sparse enum values transfer correctly; LTE and parameter editors cannot transfer to telegrams',async()=>{
 let r:any,scenario:any;await act(()=>{r=create(<DatapointTypesList onUseTelegram={s=>scenario=s}/>);});
 const choose=async(id:string)=>{
  await act(()=>r.root.findByProps({'aria-label':'Search DPT catalogue'}).props.onChange({target:{value:id}}));
  await act(()=>r.root.findByProps({'aria-label':`Inspect DPT ${id}`}).props.onClick());
 };
 await choose('20.105');
 const select=r.root.findByProps({'aria-label':'Value'});assert.ok(select.findAllByType('option').some((n:any)=>n.props.value===20));
 await act(()=>select.props.onChange({target:{value:'20'}}));
 await act(()=>r.root.findAllByType('button').find((n:any)=>text(n).includes('Use value in Telegram Visualiser')).props.onClick());
 assert.deepEqual(scenario,{id:'20.105',values:{value:'20'}});
 for(const id of ['20.004','206.102']){
  await choose(id);assert.equal(r.root.findAllByProps({'aria-label':'DPT hexadecimal value'}).length,1);
  assert.equal(r.root.findAllByType('button').filter((n:any)=>text(n).includes('Use value in Telegram Visualiser')).length,0);
 }
 await act(()=>r.unmount());
 await act(()=>{r=create(<TelegramVisualizer scenario={scenario}/>);});
 const choices=r.root.findByProps({'aria-label':'Datapoint type'}).findAllByType('option').map((n:any)=>n.props.value);
 assert.ok(choices.includes('20.105'));assert.ok(!choices.includes('20.004'));assert.ok(!choices.includes('206.102'));
 assert.equal(r.root.findByProps({'aria-label':'Value'}).props.value,'20');await act(()=>r.unmount());
});
