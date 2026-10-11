import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {act,create} from 'react-test-renderer';
import App from '../App';
import {TelegramVisualizer} from './TelegramVisualizer';
import {PredictionExercises} from './PredictionExercises';
import {MonitorDock} from './MonitorDock';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
(globalThis as any).requestAnimationFrame=(fn:()=>void)=>{fn();return 0;};
(globalThis as any).window={scrollTo(){}};
const text=(n:any):string=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.children?text(n.children):'';
const button=(r:any,label:string)=>r.root.findAllByType('button').find((b:any)=>text(b)===label);
const label=(r:any,name:string)=>r.root.findAllByProps({'aria-label':name}).find((n:any)=>typeof n.type==='string');
test('shared telegram survives lesson navigation and field focus links the bit stream and waveform',async()=>{
 let r:any;await act(()=>{r=create(<App/>);});
 const nav=(name:string)=>r.root.findByProps({'aria-label':'Learning path'}).findAllByType('button').find((b:any)=>text(b).includes(name));
 await act(()=>nav('Telegram').props.onClick());await act(()=>button(r,'Generate Telegram').props.onClick());
 const before=text(label(r,'Generated hexadecimal telegram'));
 await act(()=>nav('Basics').props.onClick());assert.equal(text(label(r,'Generated hexadecimal telegram')),before);
 await act(()=>label(r,'Inspect byte 4: Destination address high').props.onFocus());
 assert.match(text(label(r,'Selected field summary')),/Destination · byte 4/);
 assert.equal(label(r,'Inspect serial character 4').props['aria-pressed'],true);
 const bands=r.root.findAllByType('rect').filter((n:any)=>n.props['data-field']);
 assert.equal(bands.filter((n:any)=>n.props.stroke!=='none').length,2);
 await act(()=>r.unmount());
});
test('Objects transmission generates its own valid source, destination and value in the shared monitor',async()=>{
 let r:any;await act(()=>{r=create(<App/>);});
 await act(()=>r.root.findByProps({'aria-label':'Learning path'}).findAllByType('button').find((b:any)=>text(b).includes('Objects')).props.onClick());
 await act(()=>label(r,'sensor1 1/1/2').props.onChange());
 await act(()=>button(r,'Press Push Button (Sensor 1)').props.onClick());
 assert.match(text(label(r,'Generated hexadecimal telegram')),/BC 11 01 09 02 E1 00 81 38/);
 assert.match(text(r.toJSON()),/Frame source: Objects exercise/);
 await act(()=>r.unmount());
});
test('prediction exercises gate the result and reset when switching scenario',async()=>{
 let r:any,calls:string[]=[];await act(()=>{r=create(<PredictionExercises onTelegram={v=>calls.push(v)}/>);});
 assert.equal(button(r,'2 · Run scenario').props.disabled,true);assert.doesNotMatch(text(r.toJSON()),/3 · Explain the result/);
 await act(()=>label(r,'Exercise scenario').props.onChange({target:{value:'2'}}));
 await act(()=>r.root.findAllByType('input')[1].props.onChange());
 await act(()=>button(r,'2 · Run scenario').props.onClick());assert.deepEqual(calls,['0']);assert.match(text(r.toJSON()),/Your prediction matches/);
 await act(()=>label(r,'Exercise scenario').props.onChange({target:{value:'0'}}));assert.equal(button(r,'2 · Run scenario').props.disabled,true);
 await act(()=>r.unmount());
});
test('automatic exercise generation does not inherit invalid builder addresses',async()=>{
 let r:any;await act(()=>{r=create(<TelegramVisualizer/>);});
 await act(()=>label(r,'Source area').props.onChange({target:{value:'16'}}));
 await act(()=>r.update(<TelegramVisualizer scenario={{id:'1.001',values:{value:'0'},generate:true,origin:'Exercise'}}/>));
 assert.match(text(label(r,'Generated hexadecimal telegram')),/BC 11 0A 08 01 E1 00 80 30/);
 await act(()=>button(r,'Generate Telegram').props.onClick());assert.doesNotMatch(text(r.toJSON()),/Frame source: Exercise/);
 await act(()=>r.unmount());
});
test('monitor changes between nonmodal pane and modal drawer, restores scroll and accepts Escape',async()=>{
 let r:any,resize:(entries:any[])=>void=()=>{};
 const dialog={open:false,modal:false,close(){this.open=false;this.modal=false;},show(){this.open=true;this.modal=false;},showModal(){this.open=true;this.modal=true;}};
 const oldDocument=(globalThis as any).document,oldRO=(globalThis as any).ResizeObserver;
 (globalThis as any).document={body:{style:{overflow:'auto'}}};
 (globalThis as any).ResizeObserver=class {constructor(fn:any){resize=fn;}observe(){}disconnect(){}};
 try{
  await act(()=>{r=create(<MonitorDock controls={<p>Controls</p>}><p>Frame</p></MonitorDock>,{createNodeMock:element=>element.type==='dialog'?dialog:element.type==='div'?{}:null});});
  assert.equal(dialog.open,true);assert.equal(dialog.modal,false);
  await act(()=>resize([{contentRect:{width:390}}]));assert.equal(dialog.open,false);
  await act(()=>r.update(<MonitorDock openRevision={1} controls={<p>Controls</p>}><p>Frame</p></MonitorDock>));
  assert.equal(dialog.modal,true);assert.equal(document.body.style.overflow,'hidden');
  await act(()=>r.root.findByType('dialog').props.onCancel({preventDefault(){}}));assert.equal(dialog.open,false);assert.equal(document.body.style.overflow,'auto');
  await act(()=>resize([{contentRect:{width:1100}}]));assert.equal(dialog.open,true);assert.equal(dialog.modal,false);
  await act(()=>r.unmount());
 }finally{(globalThis as any).document=oldDocument;(globalThis as any).ResizeObserver=oldRO;}
});
