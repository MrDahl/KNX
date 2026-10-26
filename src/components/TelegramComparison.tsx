import React,{useState} from 'react';
import {tr} from '../i18n';
import {compareBytes,frameFacts,type FrameSnapshot} from '../knx/telegramComparison';
export function TelegramComparison({before,after,onClear,onSelect}:{before:FrameSnapshot;after:FrameSnapshot;onClear:()=>void;onSelect:(index:number)=>void}) {
 const rows=compareBytes(before.bytes,after.bytes),[selected,setSelected]=useState<number|null>(null);
 const a=frameFacts(before),b=frameFacts(after),active=selected===null?undefined:rows[selected];
 return <section className="comparison-panel" aria-label={tr('Telegram comparison')}>
  <div className="flex justify-between items-center gap-2"><h3 className="font-bold">{tr('Telegram comparison')}</h3><button className="lesson-button" onClick={onClear}>{tr('Clear comparison')}</button></div>
  <p className="text-xs mt-2">{tr('Pinned → current. Select a column to inspect changed bits. Check bytes are aligned separately when lengths differ.')}</p>
  <div className="comparison-scroll" tabIndex={0} role="region" aria-label={tr('Aligned telegram bytes')}><div className="comparison-columns">
   <div className="comparison-labels"><span>{tr('Byte')}</span><strong>{tr('Pinned')}</strong><strong>{tr('Current')}</strong></div>
   {rows.map((r,i)=><button key={i} className={`comparison-column ${r.changed?'comparison-changed':''}`} aria-pressed={selected===i} aria-label={`${tr(r.check?'Check byte':'Byte')} ${r.check?'':i+1}: ${r.before?.hex??'—'} → ${r.after?.hex??'—'}`} onClick={()=>{setSelected(i);if(r.after)onSelect(r.after.index);}}><span>{r.check?tr('Check'):i+1}</span><strong>{r.before?.hex??'—'}</strong><strong>{r.after?.hex??'—'}</strong><small>{r.changed?tr('Changed'):tr('Same')}</small></button>)}
  </div></div>
  <div aria-live="polite" className="text-xs space-y-2">
   {!rows.some(r=>r.changed)&&<p>{tr('The telegram bytes are identical.')}</p>}
   {Object.keys(a).filter(k=>a[k as keyof typeof a]!==b[k as keyof typeof b]).map(k=><p key={k}><strong>{tr(k)}:</strong> {tr(a[k as keyof typeof a])} → {tr(b[k as keyof typeof b])}</p>)}
   {a['Datapoint type']!==b['Datapoint type']&&<p>{tr('The DPT is interpretation metadata; its identifier is not transmitted.')}</p>}
   {active&&<div className="comparison-bit-detail"><strong>{tr(active.check?'Check byte':'Selected byte')}</strong>{[active.before,active.after].map((byte,i)=><div key={i}><span>{tr(i?'Current':'Pinned')}: </span>{byte?byte.logicalBinary.split('').map((bit,j)=><span key={j} className={active.before?.logicalBinary[j]!==active.after?.logicalBinary[j]?'changed-bit':''}>{bit}</span>):tr('Not present')}</div>)}<p>{tr(active.after?.details??active.before?.details)}</p></div>}
   <p>{tr('The check byte is recalculated from all preceding bytes using inverted XOR. Different telegrams can have the same check byte.')}</p>
  </div>
 </section>;
}
