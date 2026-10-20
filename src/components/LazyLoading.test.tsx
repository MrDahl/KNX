import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {act,create} from 'react-test-renderer';
import App from '../App';
import {setLanguage} from '../i18n';
import {lessonLoaders} from './LazyLessons';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
(globalThis as any).requestAnimationFrame=(fn:()=>void)=>{fn();return 0;};
(globalThis as any).window={scrollTo(){}};
const text=(n:any):string=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.children?text(n.children):'';
test('capture mounts on first visit and stays mounted across navigation and language changes',async()=>{
 await setLanguage('en');let r:any;
 await act(()=>{r=create(<App/>);});
 const nav=(label:string)=>r.root.findByProps({'aria-label':'Learning path'}).findAllByType('button').find((n:any)=>text(n).includes(label));
 try{
  assert.equal(r.root.findAllByProps({'aria-label':'Open ETS monitor XML'}).length,0);
  await act(async()=>{nav('Capture analyser').props.onClick();await lessonLoaders.CaptureAnalyser();});
  const input=r.root.findByProps({'aria-label':'Open ETS monitor XML'});
  // A native input stays mounted: its identity is a direct check against remounting the analyser.
  await act(()=>nav('Telegram').props.onClick());
  await act(()=>setLanguage('da'));
  assert.equal(r.root.findByProps({'aria-label':'Åbn XML fra ETS-monitor'}),input);
  await act(()=>setLanguage('en'));
  await act(()=>nav('Capture analyser').props.onClick());
  assert.equal(r.root.findByProps({'aria-label':'Open ETS monitor XML'}),input);
 }finally{await act(()=>r.unmount());await setLanguage('en');}
});
