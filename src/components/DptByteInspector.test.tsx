import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {act,create} from 'react-test-renderer';
import {DptByteInspector} from './DptByteInspector';
import {defaults,encodeDpt} from '../knx/dptCodec';
import {setLanguage} from '../i18n';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const text=(n:any):string=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.children?text(n.children):'';
test('inline inspection starts silent, highlights a whole field, survives language changes and clears',async()=>{
 const values=defaults('217.001'),bits=encodeDpt('217.001',values);let r:any;
 try{
  await act(()=>{r=create(<DptByteInspector id="217.001" bits={bits} values={values}/>);});
  assert.equal(r.root.findAllByProps({role:'status'}).length,0);
  await act(()=>r.root.findByProps({'aria-label':'Octet 2, Bit 7: 0'}).props.onClick());
  assert.match(text(r.root.findByProps({role:'status'})),/Version number/);
  assert.equal(r.root.findAllByType('tr').filter((n:any)=>n.props.className?.includes('bg-green-50')).length,1);
  await act(()=>setLanguage('da'));assert.match(text(r.root.findByProps({role:'status'})),/Versionsnummer/);
  await act(()=>r.root.findAllByType('button').find((n:any)=>text(n)==='Fjern markering').props.onClick());
  assert.equal(r.root.findAllByProps({role:'status'}).length,0);assert.equal(encodeDpt('217.001',values),bits);
 }finally{await act(()=>r.unmount());await setLanguage('en');}
});
test('padding bits are disabled and a byte can select multiple fields',async()=>{
 let r:any;const v=defaults('3.007');await act(()=>{r=create(<DptByteInspector id="3.007" bits={encodeDpt('3.007',v)} values={v}/>);});
 assert.equal(r.root.findAllByType('button').filter((n:any)=>n.props.disabled).length,4);
 await act(()=>r.root.findByProps({'aria-label':'Inspect octet 1'}).props.onClick());
 assert.match(text(r.root.findByProps({role:'status'})),/Direction/);assert.match(text(r.root.findByProps({role:'status'})),/Step code/);
 await act(()=>r.unmount());
});
