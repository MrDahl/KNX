import {tr} from '../i18n';
import {useTranslation} from 'react-i18next';
import React, { useEffect, useRef, useState } from "react";
import { Sliders, Play, Layers, AlertTriangle, Clock, CornerDownRight, Zap } from "lucide-react";
import { APCICode, TelegramParams, TelegramByte, KNXAddressIndividual, KNXAddressGroup } from "../types";
import { APCI_DEFS, DPT_DEFS, PRESET_TELEGRAMS } from "../data";
import { MonitorDock } from "./MonitorDock";
import { TelegramMonitor } from "./TelegramMonitor";
import { telegramTiming, DEFAULT_NEXT_ACCESS, type NextAccess } from "../knx/tp1Timing";
import { DptValueEditor } from "./DptValueEditor";
import { DPT_INPUTS, defaults, encodeDpt, type Values } from "../knx/dptCodec";

// Scope: standard, plain TP1 group-value telegrams. DPT IDs are not sent on the bus.
// Sources: supplied Tutor PDF pp. 111, 114, 121–123; DPT v02.02.01 p. 39.
const GROUP_SERVICES = [APCICode.GroupValueRead, APCICode.GroupValueResponse, APCICode.GroupValueWrite];
const STANDARD_DPTS = DPT_DEFS.filter(d => d.sizeBits <= 112 && DPT_INPUTS[d.id] && DPT_INPUTS[d.id].telegramAllowed!==false).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
const bits = (value: number, width = 8) => value.toString(2).padStart(width, "0");
const physicalBits = (binary: string) => ({
  start: "0", dataReversed: binary.split("").reverse().join(""),
  parity: String((binary.match(/1/g) || []).length % 2), stop: "1"
});
const serial = (binary: string) => {
  const b = physicalBits(binary);
  return b.start + b.dataReversed + b.parity + b.stop;
};
function integer(value: number, max: number, name: string) {
  if (!Number.isInteger(value) || value < 0 || value > max) throw new Error(`${name} must be an integer from 0 to ${max}.`);
  return value;
}

// Encode from the original value at each exponent to avoid repeated rounding.
export function encodeTemperature(value: number): string {
  if (!Number.isFinite(value) || value < -273 || value > 670433.28) throw new Error("Temperature is outside DPT 9.001 range.");
  let exponent = 0, mantissa = Math.round(value * 100);
  while (mantissa < -2048 || mantissa > 2047) mantissa = Math.round(value * 100 / 2 ** ++exponent);
  return bits((mantissa < 0 ? 0x8000 : 0) | (exponent << 11) | (mantissa & 0x7ff), 16);
}

// Exported for byte-vector regression tests; no UI state or silent padding/truncation.
export function buildStandardGroupTelegram(params: TelegramParams, payload: string) {
  if (params.targetType !== "1" || !GROUP_SERVICES.includes(params.command)) {
    throw new Error("Only standard group read, response and write telegrams are supported.");
  }
  if (!["0", "1"].includes(params.repeatFlag) || !/^[01]{2}$/.test(params.priority)) throw new Error("Invalid control field.");
  const src = params.source, dst = params.destination as KNXAddressGroup;
  const source = (integer(src.area, 15, "Source area") << 12) | (integer(src.line, 15, "Source line") << 8) | integer(src.device, 255, "Source device");
  const destination = (integer(dst.main, 31, "Main group") << 11) | (integer(dst.middle, 7, "Middle group") << 8) | integer(dst.sub, 255, "Subgroup");
  if (!destination) throw new Error("0/0/0 is reserved for broadcast; choose a nonzero group address.");
  const hop = integer(params.hopCount, 7, "Hop count");
  const read = params.command === APCICode.GroupValueRead;
  const dpt = STANDARD_DPTS.find(d => d.id === params.dptType);
  let extra: number[] = [], embedded = 0;
  if (!read) {
    if (!dpt) throw new Error("This DPT is not enabled for ordinary group-value telegrams.");
    if (!/^[01]+$/.test(payload) || payload.length !== dpt.sizeBits) throw new Error(`Enter exactly ${dpt.sizeBits} binary digits; values are never padded or truncated.`);
    if (dpt.sizeBits <= 6) embedded = parseInt(payload, 2);
    else {
      if (dpt.sizeBits % 8) throw new Error("Larger payloads must contain complete octets.");
      extra = payload.match(/.{8}/g)!.map(b => parseInt(b, 2));
    }
  }
  const length = 1 + extra.length; // TPDU octet count minus one, not the DPT byte count.
  if (length > 15) throw new Error("Standard frames allow at most 14 value octets. Extended frames are not implemented.");
  const apci = parseInt(params.command, 2);
  const bytes = [0x90 | (Number(params.repeatFlag) << 5) | (parseInt(params.priority, 2) << 2),
    source >> 8, source & 255, destination >> 8, destination & 255,
    0x80 | (hop << 4) | length, apci >> 2, ((apci & 3) << 6) | embedded, ...extra];
  bytes.push(bytes.reduce((check, byte) => check ^ byte, 0xff));
  const names = ["Control field", "Source address high", "Source address low", "Destination address high", "Destination address low", "Routing / length", "TPCI / APCI", "APCI / inline data", ...extra.map((_, i) => `Value octet ${i + 1}`), "NOT-XOR check byte"];
  const details = [
    `Standard TP frame; ${params.repeatFlag === "1" ? "original" : "repeated"}; priority ${params.priority}.`,
    `Source ${src.area}.${src.line}.${src.device}`, `Device ${src.device}`,
    `Destination ${dst.main}/${dst.middle}/${dst.sub}`, "Group address; the DPT identifier is not transmitted.",
    `Group address; HC ${hop}; L = ${length} (TPDU has ${length + 1} octets).`,
    "Unnumbered data; first two APCI bits.",
    read ? "GroupValueRead: no value payload; lower six bits are zero." : extra.length ? "Remaining APCI bits; lower six bits are zero. Complete value octets follow." : `Remaining APCI bits; inline value ${embedded}.`,
    ...extra.map((_, i) => `DPT data bits ${i * 8}–${i * 8 + 7}, displayed most significant bit first.`),
    "Inverted XOR of preceding octets. XOR of the complete frame is FF; this is not a CRC."
  ];
  const cards: TelegramByte[] = bytes.map((byte, index) => ({index, name: names[index], logicalBinary: bits(byte), hex: byte.toString(16).toUpperCase().padStart(2, "0"), physicalBits: physicalBits(bits(byte)), details: details[index]}));
  return { cards, stream: bytes.map(byte => serial(bits(byte))).join("11") };
}

export { telegramTiming } from "../knx/tp1Timing";

export function TelegramVisualizer({scenario,showControls=true,children,onConfigure}:{scenario?:{id:string;values:Values;generate?:boolean;destination?:string;origin?:string;captureParams?:TelegramParams}|null;showControls?:boolean;children?:React.ReactNode;onConfigure?:()=>void} = {}) {
 useTranslation();
  const [params, setParams] = useState<TelegramParams>({repeatFlag: "1", targetType: "1", command: APCICode.GroupValueWrite,
    source: {area: 1, line: 1, device: 10}, destination: {main: 1, middle: 0, sub: 1}, hopCount: 6, priority: "11", dptType: "1.001", ackType: "CC"});
  // The editor and encoder share one source of truth, including while Read hides the editor.
  const [dptValues, setDptValues] = useState<Values>(defaults('1.001'));
  let dptValue = '';
  try { dptValue = encodeDpt(params.dptType, dptValues); } catch { /* Editor explains invalid input. */ }
  const [nextAccess, setNextAccess] = useState<NextAccess>(DEFAULT_NEXT_ACCESS);
  const [response, setResponse] = useState<'CC'|'0C'|'C0'|'NONE'>('CC');
  const [selectedByte, setSelectedByte] = useState(0);
  const [openRevision,setOpenRevision] = useState(0);
  const [frameOrigin,setFrameOrigin] = useState<string|undefined>();
  const [currentPreset, setCurrentPreset] = useState(-1);
  const [constructedBytes, setLogicalBytes] = useState<TelegramByte[]>([]);
  const [compiled, setCompiled] = useState<{signature: string; stream: string; params: TelegramParams} | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!scenario || !DPT_INPUTS[scenario.id] || DPT_INPUTS[scenario.id].telegramAllowed===false) return;
    const [main,middle,sub]=(scenario.destination||'1/0/1').split('/').map(Number);
    const next:TelegramParams=scenario.captureParams??(scenario.generate?{repeatFlag:'1',targetType:'1',command:APCICode.GroupValueWrite,source:{area:1,line:1,device:scenario.destination?1:10},destination:{main,middle,sub},hopCount:6,priority:'11',dptType:scenario.id,ackType:'CC'}:{...params,dptType:scenario.id,command:APCICode.GroupValueWrite});
    setParams(next);
    if(scenario.captureParams)setResponse('NONE');
    setDptValues({...scenario.values});setCurrentPreset(-1);setCompiled(null);setLogicalBytes([]);setError('');
    setFrameOrigin(scenario.generate?scenario.origin:undefined);
    if(scenario.generate){
      try{const payload=encodeDpt(scenario.id,scenario.values),result=buildStandardGroupTelegram(next,payload);setLogicalBytes(result.cards);setSelectedByte(0);setCompiled({signature:JSON.stringify([next,payload]),stream:result.stream,params:next});setOpenRevision(v=>v+1);}catch(e){setError(e instanceof Error?e.message:'Cannot generate the scenario telegram.');}
    }
  }, [scenario]);
  const updateParams: typeof setParams = next => { setParams(next); setCurrentPreset(-1); setError(''); };
  const signature = JSON.stringify([params, dptValue]);
  const isGenerated = compiled !== null;
  const isDirty = !!compiled && (compiled.signature !== signature);
  const isRead = params.command === APCICode.GroupValueRead;
  const applyPreset = (idx: number) => {
    const p = PRESET_TELEGRAMS[idx];
    setParams({...p.params, source: {...p.params.source}, destination: {...p.params.destination}} as TelegramParams);
    // Correct this tool's presets without modifying the shared catalogue in this step.
    const values=defaults(p.params.dptType);
    if(p.params.dptType==='9.001')values.value='23.5';
    if(p.params.dptType==='5.001')values.value='75';
    if(p.params.dptType==='1.001')values.value=p.payloadValue;
    setDptValues(values);
    setCurrentPreset(idx); setError("");
  };
  const handleGenerateClick = () => {
    setFrameOrigin(undefined);
    try {
      if (!isRead && !dptValue) throw new Error('Correct the invalid DPT value before generating.');
      const result = buildStandardGroupTelegram(params, dptValue);
      setLogicalBytes(result.cards); setSelectedByte(0);setOpenRevision(v=>v+1);
      setCompiled({signature, stream: result.stream, params: {...params}}); setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot generate this telegram.");
      setCompiled(null); setLogicalBytes([]);
    }
  };
  const handleDptSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    updateParams(p => ({...p, dptType: id}));
    // Use the semantic defaults for this exact subtype.
    const values=defaults(id);
    setDptValues(values);
    setCurrentPreset(-1); setError("");
  };
  const addressErrors = ([
    ['Source area', params.source.area, 15],
    ['Source line', params.source.line, 15],
    ['Source device', params.source.device, 255],
    ['Main group', (params.destination as KNXAddressGroup).main, 31],
    ['Middle group', (params.destination as KNXAddressGroup).middle, 7],
    ['Subgroup', (params.destination as KNXAddressGroup).sub, 255]
  ] as [string,number,number][]).filter(([,n,max])=>!Number.isInteger(n)||n<0||n>max).map(([label,,max])=>`${label}: enter a whole number from 0 to ${max}.`);
  const totalCharactersCount = constructedBytes.length;
  const timing = telegramTiming(totalCharactersCount, nextAccess);
  const totalTransmitBitsCount = timing.frameBits, transmissionMs = timing.frameMs;
  const getAckPhysicalBitStream = () => compiled && response !== 'NONE' ? serial(bits(parseInt(response, 16))) : "";
  const showReadExample = (reply:boolean) => {
    setFrameOrigin(undefined);
    const p:TelegramParams = {repeatFlag:'1',targetType:'1',command:reply?APCICode.GroupValueResponse:APCICode.GroupValueRead,
      source:{area:1,line:1,device:reply?20:10},destination:{main:1,middle:0,sub:1},hopCount:6,priority:'11',dptType:'9.001',ackType:'CC'};
    const values={value:'23.5'}, payload=encodeDpt('9.001',values),result=buildStandardGroupTelegram(p,payload);
    setParams(p);setDptValues(values);setCurrentPreset(-1);setError('');setResponse('CC');setSelectedByte(0);
    setOpenRevision(v=>v+1);setLogicalBytes(result.cards);setCompiled({signature:JSON.stringify([p,payload]),stream:result.stream,params:p});
  };

  const inputClass="lesson-input";
  const controls = <div className="space-y-4">
    <div hidden={!showControls} className="space-y-4">
      <section className="lesson-card space-y-4">
        <div><p className="eyebrow">{tr("01 · Telegram")}</p><h2 className="text-2xl font-extrabold text-slate-900">{tr("TP1 telegram configuration")}</h2><p className="text-sm text-slate-600 mt-2">{tr("Configure the source, destination, service and datapoint value to inspect the resulting bytes, serial bits and TP1 waveform.")}</p></div>
        <details className="detail-box"><summary>{tr("Show details · scope of this simulator")}</summary><p className="text-sm">{tr("Standard plain TP1 group-value telegrams: Read, Response and Write. Maximum 14 value octets. Management services, extended frames and KNX Secure are not implemented here.")}</p></details>
        <div><h3 className="text-sm font-bold mb-2">{tr("Example telegrams")}</h3><div className="grid @md:grid-cols-2 gap-2">{PRESET_TELEGRAMS.map((t,idx)=><button key={idx} aria-pressed={currentPreset===idx} className={`lesson-button text-left ${currentPreset===idx?'bg-green-50 border-green-700':''}`} onClick={()=>applyPreset(idx)}>{tr(t.name.replace('(High Priority)','(Alarm Priority)'))}</button>)}</div></div>
        <label className="block text-sm font-semibold">{tr("Service")}<select className={inputClass} aria-label={tr("APCI group-value service")} value={params.command} onChange={e=>updateParams(p=>({...p,command:e.target.value as APCICode}))}>{APCI_DEFS.filter(c=>GROUP_SERVICES.includes(c.code)).map(c=><option key={c.code} value={c.code}>{tr(c.name)}</option>)}</select></label>
        <fieldset className="field-config field-source"><legend>{tr("Source · individual address")}</legend><div className="grid grid-cols-3 gap-2">{(['area','line','device'] as const).map((part,i)=><label key={part} className="text-xs capitalize">{tr(part)}<input className={inputClass} type="number" min="0" max={i===2?255:15} aria-label={tr(`Source ${part}`)} aria-invalid={!Number.isInteger(params.source[part])||params.source[part]<0||params.source[part]>(i===2?255:15)} value={Number.isNaN(params.source[part])?'':params.source[part]} onChange={e=>updateParams(p=>({...p,source:{...p.source,[part]:e.target.value===''?NaN:Number(e.target.value)}}))}/></label>)}</div></fieldset>
        <fieldset className="field-config field-destination"><legend>{tr("Destination · group address")}</legend><div className="grid grid-cols-3 gap-2">{(['main','middle','sub'] as const).map((part,i)=><label key={part} className="text-xs capitalize">{tr(part)}<input className={inputClass} type="number" min="0" max={[31,7,255][i]} aria-label={tr(['Main group','Middle group','Subgroup'][i])} aria-invalid={!Number.isInteger((params.destination as KNXAddressGroup)[part])||(params.destination as KNXAddressGroup)[part]<0||(params.destination as KNXAddressGroup)[part]>[31,7,255][i]} value={Number.isNaN((params.destination as KNXAddressGroup)[part])?'':(params.destination as KNXAddressGroup)[part]} onChange={e=>updateParams(p=>({...p,destination:{...(p.destination as KNXAddressGroup),[part]:e.target.value===''?NaN:Number(e.target.value)}}))}/></label>)}</div></fieldset>
        <div className="field-config field-data space-y-3"><label className="text-sm font-semibold block">{tr("Datapoint type")}<select disabled={isRead} aria-label={tr("Datapoint type")} className={inputClass} value={params.dptType} onChange={handleDptSelectChange}>{STANDARD_DPTS.map(d=><option key={d.id} value={d.id}>{d.id} · {tr(DPT_INPUTS[d.id].name)}</option>)}</select></label>{isRead?<p className="text-sm">{tr("Read requests carry no value. The chosen DPT does not change their bytes.")}</p>:<DptValueEditor id={params.dptType} values={dptValues} onChange={v=>{setDptValues(v);setCurrentPreset(-1);setError('');}}/>}</div>
        <details className="detail-box"><summary>{tr("Show details · priority, repetition and hop count")}</summary><div className="grid @md:grid-cols-2 gap-4 pt-3">
          <label className="text-sm">{tr("Repeat flag")}<select className={inputClass} aria-label={tr("Repeat flag")} value={params.repeatFlag} onChange={e=>updateParams(p=>({...p,repeatFlag:e.target.value as '0'|'1'}))}><option value="1">{tr("Original")}</option><option value="0">{tr("Repeated")}</option></select></label>
          <label className="text-sm">{tr("Priority")}<select className={inputClass} aria-label={tr("Telegram priority")} value={params.priority} onChange={e=>updateParams(p=>({...p,priority:e.target.value as TelegramParams['priority']}))}><option value="00">{tr("System (00)")}</option><option value="10">{tr("Alarm / urgent (10)")}</option><option value="01">{tr("High / normal (01)")}</option><option value="11">{tr("Low (11)")}</option></select></label>
          <label className="text-sm">{tr("Hop count")}<select aria-label={tr("Hop count")} className={inputClass} value={params.hopCount} onChange={e=>updateParams(p=>({...p,hopCount:Number(e.target.value)}))}>{Array.from({length:8},(_,i)=><option key={i} value={i}>{i}{tr(i===7?' · special value':'')}</option>)}</select></label>
          <p className="text-xs text-slate-600">{tr("HC 0 permits local reception but no forwarding. HC 7 is special, not a seven-hop budget. This tool uses group destinations only.")}</p>
        </div></details>
        {error&&<p role="alert" className="text-sm text-red-800 bg-red-50 p-3 rounded-lg">{tr(error)}</p>}
        {addressErrors.length>0&&<div role="alert" className="text-sm text-red-800">{addressErrors.map(m=><p key={m}>{tr(m)}</p>)}</div>}
        {isDirty&&<p className="text-sm text-amber-900">{tr("Modified input: the monitor still shows the previous telegram.")}</p>}
        <button className="primary-button generate-inline" onClick={handleGenerateClick}><Play size={17}/><span>{tr("Generate Telegram")}</span></button>
      </section>
      <details className="detail-box lesson-card" aria-label={tr("Read and response example")}><summary>{tr("Show details · read → response example")}</summary><div className="space-y-3 pt-3 text-sm"><p>{tr("1.1.10 asks group 1/0/1 for its value. Sensor 1.1.20 answers with 23.5 °C (DPT 9.001). These are separate telegrams; an application response is not a link-layer ACK.")}</p><div className="flex flex-wrap gap-2"><button className="lesson-button" onClick={()=>showReadExample(false)}>{tr("1 · Load read request (no value)")}</button><button className="lesson-button" onClick={()=>showReadExample(true)}>{tr("2 · Load temperature response (23.5 °C)")}</button></div><p className="text-xs text-slate-500">{tr("These examples generate immediately. Whether a response occurs depends on object configuration; no fixed response delay is implied.")}</p></div></details>
    </div>
    {!showControls&&children}
  </div>;
  const timingDetails =         <aside className="space-y-4 pt-3" aria-label={tr("Timing and acknowledgement")}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Clock className="h-5 w-5 text-green-700"/>{tr("Timing and acknowledgement")}</h3>
          <p role="status" className={`rounded-lg p-3 text-sm font-semibold ${isDirty?'bg-amber-100 text-amber-900':'bg-green-50 text-green-900'}`}>{!isGenerated?tr("Generate a telegram to calculate timing."):isDirty?tr("Previous telegram — regenerate to apply edited settings."):tr("Generated telegram matches the current settings.")}</p>
          {isGenerated&&<dl className="text-sm space-y-3 text-slate-800">
            {[
              ['Characters',`${totalCharactersCount} octets, including check byte`],
              ['Frame serial length',`${totalTransmitBitsCount} bit periods`],
              ['Frame duration',`${transmissionMs.toFixed(3)} ms`],
              ['Delay to response slot',`${timing.ackGapMs.toFixed(3)} ms (15 bits)`],
              [response==='NONE'?tr("Silent observation slot"):tr("Response character"),`${timing.ackMs.toFixed(3)} ms (11 bits)`],
              ...(response==='NONE'?[]:[['Frame + acknowledgement',`${timing.exchangeMs.toFixed(3)} ms`],['Idle before next access',`${timing.idleMs.toFixed(3)} ms (${timing.idleBits} bits)`],['Earliest next transmission',`${timing.earliestNextMs.toFixed(3)} ms from frame start`]])
            ].map(([name,value])=><div key={name} className="border-b border-slate-200 pb-2"><dt className="text-slate-600">{tr(name)}</dt><dd className="font-mono font-semibold mt-1">{value}</dd></div>)}
          </dl>}
          <fieldset className="border border-slate-200 rounded-lg p-3 space-y-3" disabled={response==='NONE'}>
            <legend className="text-sm font-semibold">{tr("Next telegram seeking bus access")}</legend>
            <label className="block text-xs">{tr("Next telegram priority")} <select aria-label={tr("Next telegram priority")} value={nextAccess.priority} onChange={e=>setNextAccess(p=>({...p,priority:e.target.value as NextAccess['priority']}))} className="block w-full mt-1 border rounded p-2 bg-white">
                <option value="00">{tr("System (00)")}</option><option value="10">{tr("Alarm / urgent (10)")}</option><option value="01">{tr("High / normal (01)")}</option><option value="11">{tr("Low (11)")}</option>
              </select>
            </label>
            <label className="block text-xs">{tr("Next telegram transmission")} <select aria-label={tr("Next telegram transmission")} value={nextAccess.repeatFlag} onChange={e=>setNextAccess(p=>({...p,repeatFlag:e.target.value as '0'|'1'}))} className="block w-full mt-1 border rounded p-2 bg-white">
                <option value="1">{tr("Original")}</option><option value="0">{tr("Repeated")}</option>
              </select>
            </label>
            <p className="text-xs text-slate-600">{tr("This independent access scenario does not change the generated bytes. After the response stop bit: 50 bit periods for System, Alarm/urgent or a repeated telegram; 53 for an original High/normal or Low telegram. The 15-bit acknowledgement gap starts at the check character’s stop-bit end.")}</p>
          </fieldset>
          <p className="text-xs text-slate-600">{tr("Course comparison: for a 9-character switching frame with a 50-bit wait, Advanced counts 9 × 13 + 15 + 11 + 50 = 193 bits (20.07 ms using its rounded 0.104 ms/bit); this app counts only the eight internal 2-bit gaps, giving 191 bits (19.896 ms at 9600 bit/s). The app places the wait after the acknowledgement, as next-access eligibility.")}</p>
          <p className="text-xs text-slate-600">{tr("The course introduces 50 bits for System plus 3 bits for lower priorities. The fuller rule used here is in KNX TP1 v01.02.02 §2.3.2, Figure 41 (printed p. 36), and Annex B (p. 48): Alarm/urgent and repeated frames also qualify at 50 bits; only original High/normal and Low frames require 53.")} <a className="underline" href="https://www.scribd.com/document/618179938/03-02-02-Communication-Medium-TP1-v01-02-02-AS" target="_blank" rel="noreferrer">{tr("View the referenced TP1 document (third-party hosted copy)")}</a>.</p>
          <p className="text-xs text-slate-600">{tr("Earliest access is a nominal eligibility boundary assuming a continuously idle bus, not a scheduled next telegram or retry. Contention, fairness delays and retry-specific waits are not simulated. Reference: KNX TP1 §2.3, Figures 38–41.")}</p>
          <label className="block text-sm font-semibold text-slate-800">{tr("Demonstration response")} <select aria-label={tr("Demonstration response")} value={response} onChange={e=>setResponse(e.target.value as typeof response)} className="block w-full mt-2 border rounded-lg p-2 bg-white text-slate-900">
              <option value="CC">{tr("ACK · CC · received correctly")}</option><option value="0C">{tr("NAK · 0C · reception error")}</option><option value="C0">{tr("BUSY · C0 · receive buffer full")}</option><option value="NONE">{tr("No acknowledgement · silence")}</option>
            </select>
          </label>
          <p className="text-xs text-slate-600">{tr("Changes apply immediately to the response illustration. They do not change the generated telegram bytes. This is a selected teaching scenario, not a simulated receiver.")}</p>
          <p className="text-sm text-slate-800">{response==='CC'?tr("ACK confirms link-layer reception. It does not prove that an actuator performed an action or that an application response will follow."):response==='0C'?tr("NAK reports a reception error. A sender can repeat the telegram according to its retry behaviour."):response==='C0'?tr("BUSY reports that the receiving link layer cannot process the telegram because its buffers are full. Retry handling is device-dependent."):tr("The selected demonstration shows no acknowledgement and a silent nominal response slot. This is not evidence of silence in an imported capture, a specified timeout or a complete failed transaction. Retry timing is not calculated.")}</p>
          <p className="text-xs text-slate-600">{tr("For simultaneous group acknowledgements, the Tutor course gives BUSY → NAK → ACK priority. A group ACK cannot identify which individual receivers acknowledged. Negative or absent responses can cause repetitions; these are not included in the displayed frame and acknowledgement. Reference: Tutor §3.6.4.")}</p>
        </aside>;
  return <MonitorDock controls={controls} openRevision={openRevision} actions={showControls?<button className="primary-button generate-mobile" onClick={handleGenerateClick}><Play size={17}/>{tr("Generate Telegram")}</button>:<button className="lesson-button configure-mobile" onClick={onConfigure}>{tr("Build telegram")}</button>}>
    <TelegramMonitor bytes={constructedBytes} stream={compiled?.stream??''} selected={selectedByte} onSelect={setSelectedByte} dirty={isDirty} response={response} ackBits={getAckPhysicalBitStream()} nextAccess={nextAccess} timingDetails={timingDetails} origin={frameOrigin}/>
  </MonitorDock>;
}
