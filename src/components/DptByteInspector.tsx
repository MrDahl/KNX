import React,{useState} from 'react';
import {useTranslation} from 'react-i18next';
import {tr} from '../i18n';
import type {Values} from '../knx/dptCodec';
import {inspectDpt,overlaps} from '../knx/dptInspection';
/** Selection is local and read-only: inspecting bytes never edits a value. */
export function DptByteInspector({id,bits,values}:{id:string;bits:string;values:Values}) {
 useTranslation();
 const [selection,setSelection]=useState<{start:number;end:number}|null>(null);
 const {padded,padding,fields}=inspectDpt(id,bits,values);
 const active=selection?fields.filter(f=>overlaps(f,selection.start,selection.end)):[];
 const selected=(start:number,end:number)=>active.some(f=>overlaps(f,start,end));
 const choose=(start:number,end:number)=>setSelection(old=>old?.start===start&&old.end===end?null:{start,end});
 const style='rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ';
 return <div className="space-y-3" aria-label={tr('DPT value inspection')}>
  <h4 className="font-bold">{tr('Encoded value ·')} {bits.length} bits</h4>
  <div className="flex flex-wrap gap-2">{padded.match(/.{8}/g)!.map((byte,i)=><div key={i} className="border border-green-200 rounded-lg p-2 text-center">
   <button type="button" className={style+'w-full px-2 py-1 '+(selected(i*8,i*8+8)?'bg-green-100 text-green-950':'bg-green-50 text-green-900')} aria-label={`${tr('Inspect octet')} ${i+1}`} aria-pressed={!!selection&&selection.start===i*8&&selection.end===i*8+8} onClick={()=>choose(i*8,i*8+8)}>
    <span className="block text-xs">{tr('Octet')} {i+1}</span><span className="font-mono text-lg font-bold">{parseInt(byte,2).toString(16).toUpperCase().padStart(2,'0')}</span>
   </button>
   <div className="flex mt-1">{[...byte].map((bit,b)=>{const index=i*8+b;return <button key={b} type="button" disabled={index<padding} title={`${tr('Octet')} ${i+1} · ${tr('Bit')} ${7-b}`} aria-label={`${tr('Octet')} ${i+1}, ${tr('Bit')} ${7-b}: ${bit}${index<padding?' · '+tr('Display padding'):''}`} aria-pressed={!!selection&&selection.start===index&&selection.end===index+1} className={style+'font-mono text-xs w-6 min-h-8 '+(index<padding?'text-slate-300':selected(index,index+1)?'bg-green-100 font-bold text-green-950':'text-slate-600 hover:bg-slate-100')} onClick={()=>choose(index,index+1)}>{bit}</button>;})}</div>
  </div>)}</div>
  <p className="text-xs text-slate-500">{tr('Select a byte, bit or field to inspect it. Bit numbers run from 7 to 0 within each octet.')}</p>
  <p className="text-xs text-slate-600">{tr(bits.length<=6?'This is a padded view of the value. In a group-value telegram the value occupies the low bits of the APCI/data octet; it is not an extra data octet.':'These are the DPT value octets, without telegram framing.')}</p>
  {selection&&<div role="status" className="border-l-2 border-green-600 bg-green-50 p-3 text-xs space-y-2">
   {active.map(f=><p key={f.start}><strong>{tr(f.name)}</strong> · {tr('Raw unsigned value')}: <span className="font-mono">{f.raw}</span>{f.meaning&&<span className="block mt-1">{f.meaning.split(' · ').map(trPart=>tr(trPart)).join(' · ')}</span>}</p>)}
   <button type="button" onClick={()=>setSelection(null)} className="underline text-green-800">{tr('Clear selection')}</button>
  </div>}
  <div className="overflow-x-auto"><table className="w-full text-xs text-left"><caption className="text-left font-semibold pb-2">{tr('Field layout · logical MSB → LSB')}</caption><thead><tr className="border-b"><th className="p-2">{tr('Field')}</th><th className="p-2">{tr('Width')}</th><th className="p-2">{tr('Bits')}</th></tr></thead><tbody>{fields.map(f=><tr key={f.start} className={'border-b border-slate-100 '+(active.includes(f)?'bg-green-50':'')}><td className="p-2"><button type="button" className={style+'text-left underline decoration-dotted underline-offset-4'} aria-pressed={active.includes(f)} onClick={()=>choose(f.start,f.end)}>{tr(f.name)}</button></td><td className="p-2">{f.bits.length}</td><td className="p-2 font-mono break-all">{f.bits}</td></tr>)}</tbody></table></div>
 </div>;
}
