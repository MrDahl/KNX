import React,{useMemo,useState} from 'react';
import {parseCaptureXml,candidateDpts,decodeCapture,captureScenario,type CaptureRecord,type CaptureScenario} from '../knx/capture';
import {DPT_INPUTS} from '../knx/dptCodec';
import {DPT_BY_ID} from './dptDatabase';
import {dptLayout} from '../knx/dptLayout';
import {TELEGRAM_FIELDS} from '../knx/telegramFields';
const input='border border-slate-300 rounded-lg p-2 bg-white text-sm w-full';
const button='border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40';
const panel='rounded-2xl border border-slate-200 bg-white p-5 space-y-4';
const serviceName=(s:string)=>s==='L_Data.con'?'TX confirmation':s==='L_Data.req'?'TX request':s==='L_Data.ind'?'RX indication':s;
export function CaptureAnalyser({onUseTelegram}:{onUseTelegram:(s:CaptureScenario)=>void}){
 const [rows,setRows]=useState<CaptureRecord[]>([]),[fileName,setFileName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [selected,setSelected]=useState(1),[query,setQuery]=useState(''),[operation,setOperation]=useState(''),[page,setPage]=useState(0),[byte,setByte]=useState(0);
 const [choices,setChoices]=useState<Record<string,{id:string;confirmed:boolean}>>({});
 const row=rows.find(r=>r.index===selected),choice=row?.destination?choices[row.destination]:undefined,id=choice?.id??'';
 const candidates=useMemo(()=>row?candidateDpts(row):[],[row]);
 const families=useMemo(()=>Array.from(new Set(candidates.map(d=>d.id.split('.')[0]))),[candidates]);
 const visible=useMemo(()=>rows.filter(r=>(!operation||r.operation===operation)&&[r.source,r.destination,r.operation,r.service,r.raw].join(' ').toLowerCase().includes(query.toLowerCase())),[rows,operation,query]);
 const maxPage=Math.max(0,Math.ceil(visible.length/30)-1),currentPage=Math.min(page,maxPage);
 let decoded:ReturnType<typeof decodeCapture>|undefined,decodeError='';
 if(row&&id&&row.apci!==0){try{decoded=decodeCapture(row,id);}catch(e){decodeError=(e as Error).message;}}
 let scenario:CaptureScenario|undefined,scenarioError='Choose an implemented DPT interpretation to open a reconstruction.';
 if(row&&(id||row.apci===0)){try{scenario=captureScenario(row,id||'1.001');scenarioError='';}catch(e){scenarioError=(e as Error).message;}}
 const changeChoice=(value:string)=>{if(row?.destination)setChoices(old=>({...old,[row.destination!]:{id:value,confirmed:false}}));};
 async function load(file:File){setBusy(true);setError('');try{if(file.size>5_000_000)throw Error('Use a recording smaller than 5 MB.');const parsed=parseCaptureXml(await file.text());setRows(parsed);setFileName(file.name);setSelected(parsed[0].index);setByte(0);setPage(0);setQuery('');setOperation('');setChoices({});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const selectedByte=row?.bytes[byte];
 return <div className="@container space-y-5 max-w-7xl mx-auto p-4 @lg:p-6">
  <section className={panel}>
   <h2 className="text-xl font-bold">ETS capture analyser</h2>
   <p className="text-sm text-slate-600">Inspect captured cEMI telegrams and compare DPT interpretations. Files are processed in this browser only. Nothing is sent to an installation or stored after reloading.</p>
   <label className="block text-sm font-semibold">Open ETS monitor XML<input aria-label="Open ETS monitor XML" type="file" accept=".xml,application/xml,text/xml" disabled={busy} className="block mt-2 text-sm max-w-full" onChange={e=>{const file=e.target.files?.[0];if(file)void load(file);e.target.value='';}}/></label>
   <p className="text-xs text-slate-500">ETS CommunicationLog · up to 5 MB / 10,000 records. Connection IP addresses and computer names are not imported.</p>
   {busy&&<p role="status">Reading capture…</p>}{error&&<p role="alert" className="text-red-800">{error}</p>}
   {!!rows.length&&<div className="flex flex-wrap justify-between items-center gap-3"><p role="status" className="text-sm">{fileName} · {rows.length} records · {rows.filter(r=>r.error).length} unsupported or invalid</p><button className={button} onClick={()=>{setRows([]);setChoices({});setFileName('');setError('');}}>Clear capture</button></div>}
  </section>
  {!!rows.length&&<section className={panel} aria-label="Capture telegram table">
   <div className="grid @lg:grid-cols-2 gap-3"><label className="text-sm">Filter addresses, service or hex<input className={input} value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label><label className="text-sm">Operation<select className={input} value={operation} onChange={e=>{setOperation(e.target.value);setPage(0);}}><option value="">All operations</option>{['GroupValueRead','GroupValueWrite','GroupValueResponse','Other service / transport'].map(s=><option key={s}>{s}</option>)}</select></label></div>
   <div className="overflow-x-auto"><table className="w-full text-left text-xs whitespace-nowrap"><thead><tr>{['Record / time (UTC)','Service','Source','Destination','Operation','HC','Raw value'].map(s=><th key={s} className="p-2">{s}</th>)}</tr></thead><tbody>{visible.slice(currentPage*30,(currentPage+1)*30).map(r=><tr key={r.index} className={'border-t '+(selected===r.index?'bg-green-50':'')}><td className="p-2"><button className="text-green-800 underline font-semibold" aria-pressed={selected===r.index} onClick={()=>{setSelected(r.index);setByte(0);}}>#{r.index} · {r.timestamp||'No timestamp'}</button></td><td className="p-2">{serviceName(r.service)}</td><td className="p-2">{r.source??'—'}</td><td className="p-2">{r.destination??'—'}</td><td className="p-2">{r.error?'Inspect error':r.operation}</td><td className="p-2">{r.hopCount??'—'}</td><td className="p-2 font-mono">{r.apci===0&&r.groupValue?'No value':r.payload??'—'}</td></tr>)}</tbody></table></div>
   <div className="flex items-center justify-between"><button className={button} disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous</button><span className="text-xs">{visible.length} matches · Page {currentPage+1} / {maxPage+1}</span><button className={button} disabled={currentPage>=maxPage} onClick={()=>setPage(currentPage+1)}>Next</button></div>
  </section>}
  {row&&<>
   <section className={panel} aria-label="Captured telegram dissection">
    <h3 className="text-lg font-bold">Record {row.index} · captured facts</h3>
    {row.error&&<p role="alert" className="text-red-800">{row.error}</p>}
    <p className="text-sm">{row.source} → {row.destination} · {row.operation} · {serviceName(row.service)}</p>
    <p className="text-sm text-slate-600">{row.standard?'Standard':'Extended / unknown'} frame · Hop Count {row.hopCount??'—'} · Priority {['System','High','Alarm','Low'][row.priority??-1]??'—'}{row.control!==undefined&&` · Repetition flag: ${row.control&32?'original':'repeated'}`}</p>
    <p className="text-xs text-slate-600">A TX confirmation is a local link-layer result, not an actuator-state report. The capture does not establish the full route or physical bus waveform.</p>
    <div className="flex gap-2 overflow-x-auto pb-2" role="region" aria-label="Captured cEMI bytes" tabIndex={0}>{row.bytes.map((b,i)=>{const f=b.field?TELEGRAM_FIELDS[b.field]:undefined;return <button key={i} aria-label={`Captured byte ${i}: ${b.label}`} aria-pressed={byte===i} onClick={()=>setByte(i)} onFocus={()=>setByte(i)} onMouseEnter={()=>setByte(i)} className={'shrink-0 rounded-xl border p-3 text-left '+(byte===i?'ring-2 ring-slate-700':'')} style={f?{backgroundColor:f.background,color:f.color,borderColor:f.border}:{}}><span className="block text-[10px]">{i} · {b.label}</span><strong className="font-mono text-xl">{b.hex}</strong></button>;})}</div>
    {selectedByte&&<div className="bg-slate-50 rounded-lg p-3"><p className="text-sm font-semibold">Byte {byte}: {selectedByte.label}</p><p className="font-mono text-lg tracking-widest">{selectedByte.bits}</p><p className="text-xs">Logical bits, most significant first. These are cEMI bytes, not serial TP1 characters.</p></div>}
    <details className="detail-box"><summary>Show details · raw frame and capture limits</summary><p className="font-mono break-all text-sm">{row.raw}</p><p className="text-sm mt-3">The message code and additional information belong to cEMI. TP1 parity, physical timing and check byte are not present here. Unrecognised services remain raw; no application decoding is inferred. Timestamps are recording timestamps, not measured wire timing.</p></details>
   </section>
   <section className={panel} aria-label="DPT interpretation">
    <h3 className="text-lg font-bold">Interpretation for {row.destination??'this record'}</h3>
    {row.groupValue&&!row.error?row.apci===0?<p className="text-sm">GroupValueRead carries no value. Its length cannot identify the DPT. Inspect a response or write on this group address.{id&&` Current address interpretation: DPT ${id}.`}</p>:<>
     <p className="text-sm"><strong>Observed encoding:</strong> {row.compact?'Compact value in the lower six APCI/data bits; intended DPT width is unknown.':`${row.payload!.split(' ').length} payload byte(s).`}</p>
     <p className="text-sm"><strong>Size-compatible families:</strong> {families.length?families.map(f=>`${f}.*`).join(', '):'No fixed-size catalogue match.'}</p>
     <p className="text-xs text-slate-600">Size and unused compact bits narrow the candidates; they do not identify the DPT. Reserved values and semantic constraints are checked only by implemented decoders. Variable-length and manufacturer-specific types may also exist.</p>
     <label className="block text-sm font-semibold">Selected subtype<select aria-label="Selected subtype" className={input+' mt-2'} value={id} onChange={e=>changeChoice(e.target.value)}><option value="">Choose an interpretation</option>{id&&!candidates.some(d=>d.id===id)&&<option value={id}>{id} · Previously selected; incompatible with this record</option>}{candidates.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name} · {d.size}{DPT_INPUTS[d.id]?'':' · reference only'}</option>)}</select></label>
     {id&&<p className="text-sm font-semibold text-amber-900">{choice?.confirmed?'Manually confirmed assignment (not verified by this capture)':'Selected interpretation — not supplied by the capture.'}</p>}
     {decodeError&&<p role="status" className="text-amber-900 text-sm">{decodeError} This does not by itself establish a malformed telegram; the decoder may support only a subset.</p>}
     {decoded&&<><dl className="grid @lg:grid-cols-2 gap-2">{DPT_INPUTS[id].fields.map(f=>{const v=decoded!.values[f.key],oi=f.optionValues?f.optionValues.indexOf(Number(v)):Number(v);return <div key={f.key} className="bg-green-50 rounded-lg p-3"><dt className="text-xs text-green-900">{f.label}</dt><dd className="font-semibold break-all">{f.options?.[oi]??v}</dd></div>;})}</dl><div className="flex flex-wrap gap-2" aria-label="Interpreted payload bits">{(()=>{let offset=0;return dptLayout(id,decoded!.bits.length).map((f,i)=>{const b=decoded!.bits.slice(offset,offset+=f.bits);return <div key={i} className="border rounded-lg p-2 max-w-full"><p className="text-xs">{f.name} · {f.bits} bits</p><p className="font-mono text-xs break-all">{b}</p></div>;});})()}</div></>}
     {id&&<><p className="text-xs text-slate-600">{DPT_INPUTS[id]?.note??DPT_BY_ID[id]?.range}</p><label className="text-sm flex gap-2 items-start"><input type="checkbox" checked={choice?.confirmed??false} onChange={e=>setChoices(old=>({...old,[row.destination!]:{id,confirmed:e.target.checked}}))}/>I have independently checked this address’s DPT assignment.</label><p className="text-xs text-slate-500">This choice applies to this group address throughout the current recording. It is cleared when another file is opened.</p></>}
    </>:<p className="text-sm">DPT interpretation is available for supported unnumbered group-value services only.</p>}
    <button className={button+' bg-green-700 text-white'} disabled={!scenario} onClick={()=>scenario&&onUseTelegram(scenario)}>Open in Telegram Visualiser</button>
    <p className="text-xs text-slate-600">{scenario?'Creates a TP1 reconstruction with captured addresses, operation, priority, Hop Count and payload. Check byte and waveform are generated; no telegram is transmitted.':scenarioError}</p>
   </section>
  </>}
 </div>;
}
