import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {act,create} from 'react-test-renderer';
import App from '../App';
import {DptValueEditor} from './DptValueEditor';
import {i18n,tr,setLanguage,normalizeDecimalInput,LANGUAGE_STORAGE_KEY} from '../i18n';
import {defaults,encodeDpt} from '../knx/dptCodec';
import en from '../locales/en.json';
import da from '../locales/da.json';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
(globalThis as any).requestAnimationFrame=(fn:()=>void)=>{fn();return 0;};
(globalThis as any).window={scrollTo(){}};
const text=(n:any):string=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.children?text(n.children):'';
const button=(r:any,label:string)=>r.root.findAllByType('button').find((b:any)=>text(b)===label);
const label=(r:any,name:string)=>r.root.findAllByProps({'aria-label':name}).find((n:any)=>typeof n.type==='string');
test('translation resources have matching keys and interpolation variables',()=>{
 assert.deepEqual(Object.keys(en).sort(),Object.keys(da).sort());
 for(const key of Object.keys(en)){
  const e=en[key as keyof typeof en],d=da[key as keyof typeof da];
  assert.ok(d.trim(),key);
  assert.deepEqual(e.match(/\{\{[^}]+\}\}/g)?.sort()??[],d.match(/\{\{[^}]+\}\}/g)?.sort()??[],key);
 }
});
test('language switch preserves generated telegram, active page, route progress and stored choice',async()=>{
 const oldStorage=globalThis.localStorage,oldDocument=globalThis.document;
 const saved=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>saved.get(key),setItem:(key:string,value:string)=>saved.set(key,value)}});
 (globalThis as any).document={documentElement:{lang:''}};
 let r:any;
 try{
  await setLanguage('en');await act(()=>{r=create(<App/>);});
  await act(()=>label(r,'Source device').props.onChange({target:{value:'42'}}));
  await act(()=>button(r,'Generate Telegram').props.onClick());
  const bytes=text(label(r,'Generated hexadecimal telegram')).replace('Hex Dump:','').trim();
  await act(()=>setLanguage('da'));
  assert.equal(text(label(r,'Genereret hexadecimalt telegram')).replace('Hexvisning:','').trim(),bytes);
  assert.equal(label(r,'Afsenderenhed').props.value,42);
  assert.equal(document.documentElement.lang,'da');assert.equal(saved.get(LANGUAGE_STORAGE_KEY),'da');
  assert.equal(tr('Choke'),'Drosselspole');assert.equal(tr('BCU (Bus Coupling Unit)'),'BCU (Buskoblings enhed)');
  await act(()=>r.root.findByProps({'aria-label':'Navigation'}).findAllByType('button').find((b:any)=>text(b).includes('Hop tæller')).props.onClick());
  await act(()=>button(r,'Næste hændelse').props.onClick());
  assert.match(text(label(r,'Hændelseslog for videresendelse')),/HC 6/);
  await act(()=>setLanguage('en'));
  assert.equal(text(r.root.findAllByType('h1')[0]),'Hop Count');
  assert.match(text(label(r,'Routing event log')),/HC 6/);
  assert.equal(text(label(r,'Generated hexadecimal telegram')).replace('Hex Dump:','').trim(),bytes);
  assert.equal(tr('Untranslated technical reference'),'Untranslated technical reference');
 }finally{if(r)await act(()=>r.unmount());await setLanguage('en');Object.defineProperty(globalThis,'localStorage',{configurable:true,value:oldStorage});(globalThis as any).document=oldDocument;}
});
test('Danish numeric editing produces the same bytes and rejects mixed decimal separators',async()=>{
 let r:any;let values=defaults('9.001');
 try{
  await setLanguage('da');await act(()=>{r=create(<DptValueEditor id="9.001" values={values} onChange={v=>{values=v;}}/>);});
  const input=r.root.findAllByType('input')[0];
  assert.equal(input.props.type,'text');assert.equal(input.props.inputMode,'decimal');
  await act(()=>input.props.onChange({target:{value:'23,5'}}));
  const key=Object.keys(values)[0];
  assert.equal(values[key],'23.5');assert.equal(encodeDpt('9.001',values),encodeDpt('9.001',{...values,[key]:'23.5'}));
  assert.equal(normalizeDecimalInput('1.234,5','da'),'1.234,5');
  assert.throws(()=>encodeDpt('9.001',{...values,[key]:normalizeDecimalInput('1.234,5','da')}));
  assert.equal(normalizeDecimalInput('1,5','en'),'1,5');
 }finally{if(r)await act(()=>r.unmount());await setLanguage('en');}
});
test('Danish CAD search and categories use translated labels with stable underlying values',async()=>{
 let r:any;
 try{
  await setLanguage('da');await act(()=>{r=create(<App/>);});
  await act(()=>r.root.findByProps({'aria-label':'Navigation'}).findAllByType('button').find((b:any)=>text(b).includes('CAD-symboler')).props.onClick());
  await act(()=>label(r,'Søg efter CAD-symboler').props.onChange({target:{value:'drosselspole'}}));
  assert.match(text(r.toJSON()),/Strømforsyning med integreret drosselspole/);
  await act(()=>label(r,'Kategori for CAD-symboler').props.onChange({target:{value:'System devices'}}));
  assert.match(text(r.toJSON()),/Strømforsyning med integreret drosselspole/);
  const option=r.root.findAllByType('option').find((o:any)=>text(o)==='Systemenheder');
  assert.equal(option.props.value,'System devices');
 }finally{if(r)await act(()=>r.unmount());await setLanguage('en');}
});

test('Danish reference search and data-type filters keep their original machine values',async()=>{
 const {filterDpts}=await import('./dptDatabase');
 const {DatapointTypesList}=await import('./DatapointTypesList');
 let r:any;
 try{
  await setLanguage('da');
  assert.ok(filterDpts('bygningsbeskyttelse').some(d=>d.id==='20.102'));
  assert.ok(filterDpts('9.001').some(d=>d.id==='9.001'));
  await act(()=>{r=create(<DatapointTypesList/>);});
  const types=label(r,tr('DPT data type'));
  const booleanOption=types.findAllByType('option').find((o:any)=>o.props.value==='Boolean');
  assert.equal(text(booleanOption),'Boolesk');
  await act(()=>types.props.onChange({target:{value:'Boolean'}}));
  await act(()=>setLanguage('en'));
  assert.equal(label(r,'DPT data type').props.value,'Boolean');
 }finally{if(r)await act(()=>r.unmount());await setLanguage('en');}
});

test('stored errors and composite summaries translate while literal text and bytes stay intact',async()=>{
 const {dptSummary}=await import('../dptPresentation');
 const {decodeDptHex,payloadHex}=await import('../knx/dptDecode');
 let message='';
 try{decodeDptHex('9.001','00');}catch(e){message=(e as Error).message;}
 try{
  await setLanguage('da');
  assert.equal(tr(message),'Indtast præcis 2 hexadecimale oktetter.');
  assert.equal(tr('Repetition flag (bit 5 = 0): repeated'),'Gentagelsesflag (bit 5 = 0): gentaget');
  assert.equal(tr('Source 1.2.3'),'Afsender 1.2.3');
  const textBits=encodeDpt('16.001',{text:'Monday'});
  assert.match(dptSummary('16.001',textBits),/Monday/);
  assert.doesNotMatch(dptSummary('16.001',textBits),/Mandag/);
  const colour=decodeDptHex('251.600','FF 00 00 00 00 0F');
  const hex=payloadHex(encodeDpt('251.600',colour.values));
  assert.match(dptSummary('251.600',colour.bits),/Rød/);
  await setLanguage('en');
  assert.equal(tr(message),message);
  assert.equal(payloadHex(encodeDpt('251.600',colour.values)),hex);
 }finally{await setLanguage('en');}
});

test('all registered dynamic translations preserve their interpolation slots',async()=>{
 const {default:templates}=await import('../locales/templates.json');
 for(const [source,key]of Object.entries(templates)){
  assert.equal(en[key as keyof typeof en],source);
  assert.deepEqual(source.match(/\{\{\d+\}\}/g)?.sort(),da[key as keyof typeof da].match(/\{\{\d+\}\}/g)?.sort());
 }
});
test('243.600 confirmation and field descriptions are translated',async()=>{
 const {DPT_BY_ID}=await import('./dptDatabase');
 const {DPT_INPUTS}=await import('../knx/dptCodec');
 try{
  await setLanguage('da');
  const row=DPT_BY_ID['243.600'];
  for(const s of [row.range,...row.sourceNotes,...row.layoutNotes,DPT_INPUTS['243.600'].note!])assert.notEqual(tr(s),s);
  assert.match(tr(row.sourceNotes[0]),/bekræftet/);
 }finally{await setLanguage('en');}
});
