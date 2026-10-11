import React,{useEffect,useRef} from 'react';
import {TelegramByte} from '../types';
import {TELEGRAM_FIELDS,telegramField,fieldStyle} from '../knx/telegramFields';
import {TelegramFieldDetails} from './TelegramFieldDetails';
import {WaveformRenderer} from './WaveformRenderer';
import {NextAccess} from '../knx/tp1Timing';
export function TelegramMonitor({bytes,stream,selected,onSelect,dirty,response,ackBits,nextAccess,timingDetails,prediction,origin}: {
 bytes:TelegramByte[];stream:string;selected:number;onSelect:(index:number)=>void;dirty:boolean;response:'CC'|'0C'|'C0'|'NONE';ackBits:string;nextAccess:NextAccess;timingDetails:React.ReactNode;prediction?:string;origin?:string;
}) {
 const bitBox=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(bitBox.current)bitBox.current.scrollLeft=selected*158;},[selected]);
 const active=telegramField(selected,bytes.length);
 return <div className="space-y-4 min-w-0">
  <p role="status" className={`rounded-xl p-3 text-xs ${dirty?'bg-amber-50 text-amber-900':'bg-slate-50 text-slate-700'}`}>{!bytes.length?'Open the Telegram lesson, predict what will happen, then Generate.':dirty?'Previous telegram — regenerate to apply edited settings.':'Generated telegram matches the current settings.'}</p>
  {origin&&bytes.length>0&&<p className="text-xs text-slate-500">Frame source: {origin}. ACK selection is a separate demonstration, not a measured response.</p>}
  {!bytes.length?<div className="monitor-empty"><span className="text-3xl font-mono text-green-700">01 →</span><h3 className="font-bold text-slate-900 mt-3">One telegram. Every layer.</h3><p className="text-sm text-slate-600 mt-2">The same field colours connect the bytes, bits, explanation and waveform. Your generated telegram stays here as you explore other lessons.</p></div>:<>
   {prediction&&<p className="text-xs rounded-lg border border-blue-200 bg-blue-50 p-3"><strong>Your prediction:</strong> {prediction}<br/>Compare it with the bytes below.</p>}
   <div className="flex flex-wrap gap-2 text-[11px]" aria-label="Telegram field colour legend">{Object.entries(TELEGRAM_FIELDS).map(([id,f])=><span key={id} className="rounded-full border px-2 py-1 font-semibold" style={{color:f.color,backgroundColor:f.background,borderColor:f.border}}>{f.label}</span>)}</div>
   <p className="text-xs text-slate-500">Hover, tap or focus a byte to link its field across all views.</p>
   <div className="byte-card-grid" aria-label="Telegram byte cards">{bytes.map((byte,i)=><button key={i} type="button" aria-label={`Inspect byte ${i+1}: ${byte.name}`} aria-pressed={selected===i} onClick={()=>onSelect(i)} onMouseEnter={()=>onSelect(i)} onFocus={()=>onSelect(i)} className={`byte-card ${active===telegramField(i,bytes.length)?'field-active':''}`} style={fieldStyle(i,bytes.length)}>
     <span className="text-[10px] font-semibold">{i+1} · {TELEGRAM_FIELDS[telegramField(i,bytes.length)].label}</span><strong className="block text-xl font-mono">{byte.hex}</strong><span className="text-[10px] font-mono">{byte.logicalBinary}</span>
   </button>)}</div>
   <div className="overflow-x-auto rounded-lg bg-slate-50 p-2 text-[11px] font-mono whitespace-nowrap" tabIndex={0} aria-label="Generated hexadecimal telegram">Hex Dump: {bytes.map(b=>b.hex).join(' ')}</div>
   <div><h3 className="text-sm font-bold mb-2">On the wire · least-significant data bit first</h3><div ref={bitBox} className="overflow-x-auto flex gap-2 p-1 rounded-lg border border-slate-200" tabIndex={0} role="region" aria-label="Scrollable physical bit stream">{bytes.map((b,i)=><button key={i} className={`serial-character ${active===telegramField(i,bytes.length)?'field-active':''}`} style={fieldStyle(i,bytes.length)} onFocus={()=>onSelect(i)} onClick={()=>onSelect(i)} aria-label={`Inspect serial character ${i+1}`} aria-pressed={selected===i}><span className="block text-[10px]">Byte {i+1} · S / D0…D7 / P / Stop</span><span className="font-mono text-xs">{b.physicalBits.start} {b.physicalBits.dataReversed} {b.physicalBits.parity} {b.physicalBits.stop}</span></button>)}</div><p className="text-[10px] text-slate-500 mt-1">Two idle bit periods separate characters; no extra gap is appended after the check character.</p></div>
   <div className="p-3 rounded-xl border text-sm" style={fieldStyle(selected,bytes.length)} aria-label="Selected field summary"><strong>{TELEGRAM_FIELDS[active].label} · byte {selected+1}</strong><p className="mt-1 text-xs">{bytes[selected]?.details}</p></div>
   <details className="detail-box"><summary>Show details · selected byte fields</summary><TelegramFieldDetails byte={bytes[selected]} count={bytes.length}/></details>
   <WaveformRenderer compact bitStream={stream} ackBits={ackBits} ackType={response} nextAccess={nextAccess} bytes={bytes} selectedByte={selected} onSelectByte={onSelect}/>
  </>}
  <details className="detail-box"><summary>Show details · timing and acknowledgement</summary>{timingDetails}</details>
 </div>;
}
