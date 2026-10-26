import {tr,msg} from '../i18n';
import {useTranslation} from 'react-i18next';
import React,{useEffect,useRef,useState} from 'react';
import {TelegramComparison} from './TelegramComparison';
import {frameFacts,compareBytes,type FrameSnapshot} from '../knx/telegramComparison';
import {TelegramByte} from '../types';
import {TELEGRAM_FIELDS,telegramField,fieldStyle} from '../knx/telegramFields';
import {TelegramFieldDetails} from './TelegramFieldDetails';
import {WaveformRenderer} from './WaveformRenderer';
import {NextAccess} from '../knx/tp1Timing';
export function TelegramMonitor({bytes,stream,selected,onSelect,dirty,response,ackBits,nextAccess,timingDetails,origin,frame,pinned,onPin,onClear,revision}: {
 frame:FrameSnapshot|null;pinned:FrameSnapshot|null;onPin:()=>void;onClear:()=>void;revision:number;
 bytes:TelegramByte[];stream:string;selected:number;onSelect:(index:number)=>void;dirty:boolean;response:'CC'|'0C'|'C0'|'NONE';ackBits:string;nextAccess:NextAccess;timingDetails:React.ReactNode;origin?:string;
}) {
 useTranslation();
 const previous=useRef<TelegramByte[]>([]);
 const [changed,setChanged]=useState<number[]>([]);
 useEffect(()=>{
  if(previous.current.length)setChanged(compareBytes(previous.current,bytes).filter(r=>r.changed&&r.after).map(r=>r.after!.index));
  previous.current=bytes;
  const timer=setTimeout(()=>setChanged([]),1800);return ()=>clearTimeout(timer);
 },[bytes]);
 const facts=frame?frameFacts(frame):null;
 const bitBox=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(bitBox.current)bitBox.current.scrollLeft=selected*158;},[selected]);
 const active=telegramField(selected,bytes.length);
 return <div className="space-y-4 min-w-0">
  <p role="status" className={`rounded-xl p-3 text-xs ${dirty?'bg-amber-50 text-amber-900':'bg-slate-50 text-slate-700'}`}>{!bytes.length?tr("Select Generate Telegram on the Telegram page to display a frame."):dirty?tr("Previous telegram — regenerate to apply edited settings."):tr("Generated telegram matches the current settings.")}</p>
  {origin&&bytes.length>0&&<p className="text-xs text-slate-500">{tr("Frame source:")} {tr(origin)}{tr(". ACK selection is a separate demonstration, not a measured response.")}</p>}
  {!bytes.length?<div className="monitor-empty"><h3 className="font-bold text-slate-900 mt-3">{tr("No telegram generated")}</h3><p className="text-sm text-slate-600 mt-2">{tr("The monitor displays logical bytes, serial bits, field descriptions and an illustrative TP1 waveform. Generated frames remain available when switching pages.")}</p></div>:<>
   {facts&&<div className="frame-summary"><strong>{facts.Source} → {facts.Destination}</strong><span>{facts.Service} · {tr(facts.Value)}</span>{frame?.params.command!=='0000'&&<small>DPT {frame?.params.dptType}</small>}</div>}
   <div className="flex flex-wrap items-center gap-2"><button className="lesson-button" onClick={onPin}>{tr(pinned?'Replace pinned telegram':'Pin for comparison')}</button><span className="text-xs text-slate-500">{tr('Pin this frame, then change settings and generate another.')}</span></div>
   {pinned&&frame&&<TelegramComparison before={pinned} after={frame} onClear={onClear} onSelect={onSelect}/>}
   <div className="flex flex-wrap gap-2 text-[11px]" aria-label={tr("Telegram field colour legend")}>{Object.entries(TELEGRAM_FIELDS).map(([id,f])=><span key={id} className="rounded-full border px-2 py-1 font-semibold" style={{color:f.color,backgroundColor:f.background,borderColor:f.border}}>{tr(f.label)}</span>)}</div>
   <p className="text-xs text-slate-500">{tr("Hover, tap or focus a byte to link its field across all views.")}</p>
   <div className="byte-card-grid" aria-label={tr("Telegram byte cards")}>{bytes.map((byte,i)=><button key={`${revision}-${i}`} type="button" aria-label={msg('byte.inspect',{index:i+1,name:tr(byte.name)})} aria-pressed={selected===i} onClick={()=>onSelect(i)} onMouseEnter={()=>onSelect(i)} onFocus={()=>onSelect(i)} className={`byte-card ${changed.includes(i)?'byte-updated':''} ${active===telegramField(i,bytes.length)?'field-active':''}`} style={fieldStyle(i,bytes.length)}>
     <span className="text-[10px] font-semibold">{i+1} · {tr(TELEGRAM_FIELDS[telegramField(i,bytes.length)].label)}</span><strong className="block text-xl font-mono">{byte.hex}</strong><span className="text-[10px] font-mono">{byte.logicalBinary}</span>
   </button>)}</div>
   <div className="overflow-x-auto rounded-lg bg-slate-50 p-2 text-[11px] font-mono whitespace-nowrap" tabIndex={0} aria-label={tr("Generated hexadecimal telegram")}>{tr("Hex Dump:")} {bytes.map(b=>b.hex).join(' ')}</div>
   <div><h3 className="text-sm font-bold mb-2">{tr("On the wire · least-significant data bit first")}</h3><div ref={bitBox} className="overflow-x-auto flex gap-2 p-1 rounded-lg border border-slate-200" tabIndex={0} role="region" aria-label={tr("Scrollable physical bit stream")}>{bytes.map((b,i)=><button key={i} className={`serial-character ${active===telegramField(i,bytes.length)?'field-active':''}`} style={fieldStyle(i,bytes.length)} onFocus={()=>onSelect(i)} onClick={()=>onSelect(i)} aria-label={msg('byte.serial',{index:i+1})} aria-pressed={selected===i}><span className="block text-[10px]">Byte {i+1} · S / D0…D7 / P / Stop</span><span className="font-mono text-xs">{b.physicalBits.start} {b.physicalBits.dataReversed} {b.physicalBits.parity} {b.physicalBits.stop}</span></button>)}</div><p className="text-[10px] text-slate-500 mt-1">{tr("Two idle bit periods separate characters; no extra gap is appended after the check character.")}</p></div>
   <div className="p-3 rounded-xl border text-sm" style={fieldStyle(selected,bytes.length)} aria-label={tr("Selected field summary")}><strong>{tr(TELEGRAM_FIELDS[active].label)} {tr("· byte")} {selected+1}</strong><p className="mt-1 text-xs">{tr(bytes[selected]?.details)}</p></div>
   <details className="detail-box"><summary>{tr("Show details · selected byte fields")}</summary><TelegramFieldDetails byte={bytes[selected]} count={bytes.length}/></details>
   <WaveformRenderer compact bitStream={stream} ackBits={ackBits} ackType={response} nextAccess={nextAccess} bytes={bytes} selectedByte={selected} onSelectByte={onSelect}/>
  </>}
  <details className="detail-box"><summary>{tr("Show details · timing and acknowledgement")}</summary>{timingDetails}</details>
 </div>;
}
