import React, { useRef, useState } from "react";
import { Sliders, Play, Layers, AlertTriangle, Clock, CornerDownRight, Zap } from "lucide-react";
import { APCICode, TelegramParams, TelegramByte, KNXAddressIndividual, KNXAddressGroup } from "../types";
import { APCI_DEFS, DPT_DEFS, PRESET_TELEGRAMS } from "../data";
import { WaveformRenderer, telegramTiming } from "./WaveformRenderer";
import { DptValueEditor } from "./DptValueEditor";
import { DPT_INPUTS, defaults, encodeDpt, type Values } from "../knx/dptCodec";

// Scope: standard, plain TP1 group-value telegrams. DPT IDs are not sent on the bus.
// Sources: supplied Tutor PDF pp. 111, 114, 121–123; DPT v02.02.01 p. 39.
const GROUP_SERVICES = [APCICode.GroupValueRead, APCICode.GroupValueResponse, APCICode.GroupValueWrite];
const STANDARD_DPTS = DPT_DEFS.filter(d => d.sizeBits <= 112 && DPT_INPUTS[d.id]);
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
  const hop = integer(params.routingCounter, 7, "Hop count");
  const read = params.command === APCICode.GroupValueRead;
  const dpt = STANDARD_DPTS.find(d => d.id === params.dptType);
  let extra: number[] = [], embedded = 0;
  if (!read) {
    if (!dpt) throw new Error("This DPT needs an unsupported frame format.");
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

export { telegramTiming } from "./WaveformRenderer";

export function TelegramVisualizer() {
  const [params, setParams] = useState<TelegramParams>({repeatFlag: "1", targetType: "1", command: APCICode.GroupValueWrite,
    source: {area: 1, line: 1, device: 10}, destination: {main: 1, middle: 0, sub: 1}, routingCounter: 6, priority: "11", dptType: "1.001", ackType: "CC"});
  const [dptValue, setDptValue] = useState("1");
  const [editorInitial, setEditorInitial] = useState<Values>(defaults('1.001'));
  const [editorVersion, setEditorVersion] = useState(0);
  const [response, setResponse] = useState<'CC'|'0C'|'C0'|'NONE'>('CC');
  const [selectedByte, setSelectedByte] = useState(0);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [currentPreset, setCurrentPreset] = useState(-1);
  const [constructedBytes, setLogicalBytes] = useState<TelegramByte[]>([]);
  const [compiled, setCompiled] = useState<{signature: string; stream: string; params: TelegramParams} | null>(null);
  const [error, setError] = useState("");
  const signature = JSON.stringify([params, dptValue]);
  const isGenerated = compiled !== null;
  const isDirty = !!compiled && (compiled.signature !== signature);
  const isRead = params.command === APCICode.GroupValueRead;
  const applyPreset = (idx: number) => {
    const p = PRESET_TELEGRAMS[idx];
    setParams({...p.params, source: {...p.params.source}, destination: {...p.params.destination}} as TelegramParams);
    // Correct this tool's presets without modifying the shared catalogue in this step.
    setDptValue(p.params.dptType === "9.001" ? encodeTemperature(23.5) : p.params.dptType === "5.001" ? bits(Math.round(75 * 255 / 100)) : p.payloadValue);
    const values=defaults(p.params.dptType);
    if(p.params.dptType==='9.001')values.value='23.5';
    if(p.params.dptType==='5.001')values.value='75';
    if(p.params.dptType==='1.001')values.value=p.payloadValue;
    setEditorInitial(values); setEditorVersion(v=>v+1);
    setCurrentPreset(idx); setError("");
  };
  const handleGenerateClick = () => {
    try {
      const result = buildStandardGroupTelegram(params, dptValue);
      setLogicalBytes(result.cards); setSelectedByte(0);
      setCompiled({signature, stream: result.stream, params: {...params}}); setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot generate this telegram.");
      setCompiled(null); setLogicalBytes([]);
    }
  };
  const handleDptSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value, d = STANDARD_DPTS.find(d => d.id === id)!;
    setParams(p => ({...p, dptType: id}));
    // Raw zero defaults avoid inheriting unverified handwritten examples.
    const values=defaults(id);
    setDptValue(encodeDpt(id,values)); setEditorInitial(values); setEditorVersion(v=>v+1);
    setCurrentPreset(-1); setError("");
  };
  const totalCharactersCount = constructedBytes.length;
  const timing = telegramTiming(totalCharactersCount, compiled?.params.priority ?? params.priority);
  const totalTransmitBitsCount = timing.frameBits, transmissionMs = timing.frameMs, totalCycleMs = timing.cycleMs;
  const getAckPhysicalBitStream = () => compiled && response !== 'NONE' ? serial(bits(parseInt(response, 16))) : "";
  const showReadExample = (reply:boolean) => {
    const p:TelegramParams = {repeatFlag:'1',targetType:'1',command:reply?APCICode.GroupValueResponse:APCICode.GroupValueRead,
      source:{area:1,line:1,device:reply?20:10},destination:{main:1,middle:0,sub:1},routingCounter:6,priority:'11',dptType:'9.001',ackType:'CC'};
    const values={value:'23.5'}, payload=encodeDpt('9.001',values),result=buildStandardGroupTelegram(p,payload);
    setParams(p);setDptValue(payload);setEditorInitial(values);setEditorVersion(v=>v+1);setCurrentPreset(-1);setError('');setResponse('CC');setSelectedByte(0);
    setLogicalBytes(result.cards);setCompiled({signature:JSON.stringify([p,payload]),stream:result.stream,params:p});
  };

  return (
    <div className="space-y-8 text-slate-700">

      <p className="text-sm text-slate-600">Standard plain TP1 group-value telegrams: Read, Response and Write. Maximum 14 value octets. Management services, extended frames and KNX Secure are not implemented here.</p>
      {error && <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">{error}</div>}
      {/* Dirty warning notice */}
      {isGenerated && isDirty && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed text-amber-800 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-amber-900">Modified input:</strong> Settings have changed. Byte cards and timing still describe the last generated telegram. Generate again to apply the current settings.
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerateClick}
            className="bg-amber-600 text-white font-bold px-3.5 py-2 rounded-xl text-[10px] hover:bg-amber-700 transition-colors shrink-0"
          >
            Regenerate telegram
          </button>
        </div>
      )}

      {/* Configuration Sliders & Presets Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Controls Block */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-knx-blue" />
              Telegram Configuration Parameters
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-knx-blue font-bold bg-knx-blue/10 border border-knx-blue/20 px-2.5 py-1 rounded-full">
              TP1 Link Layer Engine
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">
              Apply Standard Operational Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TELEGRAMS.map((t, idx) => (
                <button
                  key={`preset-${idx}`}
                  type="button"
                  onClick={() => applyPreset(idx)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs border font-bold transition-all ${
                    currentPreset === idx
                      ? "bg-knx-blue/10 text-knx-blue border-knx-blue/20 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-955"
                  }`}
                >
                  <CornerDownRight className="h-3 w-3 inline mr-1.5 shrink-0 text-knx-blue" />
                  {t.name.replace("(High Priority)", "(Alarm Priority)")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Repeat Control */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1.5">
                Repeat Flag (R)
              </label>
              <select
                value={params.repeatFlag}
                onChange={(e) => setParams(prev => ({ ...prev, repeatFlag: e.target.value as "0" | "1" }))}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none focus:ring-1 focus:ring-knx-blue/20"
              >
                <option value="1">Original (Not repeated)</option>
                <option value="0">Repeated Telegram (In case of prior error)</option>
              </select>
            </div>

            {/* Target Address Mode */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1.5">
                Target Address Type (AT)
              </label>
              <select
                disabled
                value={params.targetType}
                onChange={(e) => {
                  const val = e.target.value as "0" | "1";
                  setParams(prev => ({
                    ...prev,
                    targetType: val,
                    destination: val === "1" ? { main: 1, middle: 0, sub: 1 } : { area: 1, line: 1, device: 10 }
                  }));
                  setCurrentPreset(-1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none focus:ring-1 focus:ring-knx-blue/20"
              >
                <option value="1">Group / Multicast (nonzero group address)</option>

              </select>
            </div>

            {/* APCI Command Command */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 sm:col-span-2">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1.5">
                APCI Group-Value Service
              </label>
              <select
                value={params.command}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, command: e.target.value as APCICode }));
                  setCurrentPreset(-1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
              >
                {APCI_DEFS.filter(cmd => GROUP_SERVICES.includes(cmd.code)).map((cmd) => (
                  <option key={cmd.code} value={cmd.code}>
                    {cmd.name} - {cmd.description.slice(0, 55)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Source Individual Addr */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 sm:col-span-2">
              <span className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-2">
                Source Address (Area.Line.Device)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Area (0-15)</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={params.source.area}
                    onChange={(e) => {
                      const val = Math.min(15, Math.max(0, parseInt(e.target.value) || 0));
                      setParams(p => ({ ...p, source: { ...p.source, area: val } }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Line (0-15)</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={params.source.line}
                    onChange={(e) => {
                      const val = Math.min(15, Math.max(0, parseInt(e.target.value) || 0));
                      setParams(p => ({ ...p, source: { ...p.source, line: val } }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Device (0-255)</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={params.source.device}
                    onChange={(e) => {
                      const val = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                      setParams(p => ({ ...p, source: { ...p.source, device: val } }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Destination Target Addr */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 sm:col-span-2">
              <span className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-2">
                Destination Address ({params.targetType === "1" ? "Main/Middle/Sub Group format" : "Area.Line.Device Individual format"})
              </span>
              {params.targetType === "1" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Main (0-31)</span>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={(params.destination as KNXAddressGroup).main}
                      onChange={(e) => {
                        const val = Math.min(31, Math.max(0, parseInt(e.target.value) || 0));
                        setParams(p => ({ ...p, destination: { ...(p.destination as KNXAddressGroup), main: val } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Middle (0-7)</span>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={(params.destination as KNXAddressGroup).middle}
                      onChange={(e) => {
                        const val = Math.min(7, Math.max(0, parseInt(e.target.value) || 0));
                        setParams(p => ({ ...p, destination: { ...(p.destination as KNXAddressGroup), middle: val } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-550 uppercase font-bold block mb-1">Sub-Group (0-255)</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={(params.destination as KNXAddressGroup).sub}
                      onChange={(e) => {
                        const val = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                        setParams(p => ({ ...p, destination: { ...(p.destination as KNXAddressGroup), sub: val } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Area (0-15)</span>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={(params.destination as KNXAddressIndividual).area}
                      onChange={(e) => {
                        const val = Math.min(15, Math.max(0, parseInt(e.target.value) || 0));
                        setParams(p => ({ ...p, destination: { ...(p.destination as KNXAddressIndividual), area: val } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Line (0-15)</span>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={(params.destination as KNXAddressIndividual).line}
                      onChange={(e) => {
                        const val = Math.min(15, Math.max(0, parseInt(e.target.value) || 0));
                        setParams(p => ({ ...p, destination: { ...(p.destination as KNXAddressIndividual), line: val } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-505 uppercase font-bold block mb-1">Device (0-255)</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={(params.destination as KNXAddressIndividual).device}
                      onChange={(e) => {
                        const val = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                        setParams(p => ({ ...p, destination: { ...(p.destination as KNXAddressIndividual), device: val } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DPT Type Select */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1">
                Data Point Type (DPT) Size
              </label>
              <select
                disabled={isRead}
                value={params.dptType}
                onChange={handleDptSelectChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
              >
                {STANDARD_DPTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    DPT {d.id} — {DPT_INPUTS[d.id].name}
                  </option>
                ))}
              </select>
            </div>

            {/* DPT Data Value Field Inputs */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1">
                DPT Payload Data Value
              </label>
              {isRead ? <p className="text-xs text-slate-600">Read requests carry no value. The selected DPT does not change the request bytes.</p> :
                <DptValueEditor key={`${params.dptType}-${editorVersion}`} id={params.dptType} initial={editorInitial} onChange={value=>{setDptValue(value);setCurrentPreset(-1);setError('');}} />}
            </div>

            {/* Routing / Hop count slider */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1">
                Routing Hop Count (HC: {params.routingCounter})
              </label>
              <input
                type="range"
                min="0"
                max="7"
                value={params.routingCounter}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, routingCounter: parseInt(e.target.value) }));
                  setCurrentPreset(-1);
                }}
                className="w-full h-1.5 mt-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-knx-blue"
              />
              <span className="text-[9px] text-slate-500 block mt-1">
                HC 0 permits local reception but no further forwarding. HC 7 is a special value, not a seven-hop budget.
              </span>
            </div>

            {/* Priorty selector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1">
                Arbitration Priority
              </label>
              <select
                value={params.priority}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, priority: e.target.value as any }));
                  setCurrentPreset(-1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
              >
                <option value="00">System (00) - Network critical</option>
                <option value="10">Alarm (10) - Security alerts</option>
                <option value="01">High (01) - Higher bus access priority</option>
                <option value="11">Low/Normal (11) - Generic runtime</option>
              </select>
            </div>

            {/* Generate Telegram Trigger Button */}
            <div className="pt-4 border-t border-slate-150 sm:col-span-2">
              <button
                type="button"
                onClick={handleGenerateClick}
                className="w-full bg-knx-blue hover:bg-knx-blue/90 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Generate Telegram</span>
              </button>
            </div>
          </div>
        </div>

        <aside className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 self-start" aria-label="Timing and acknowledgement">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Clock className="h-5 w-5 text-green-700"/>Timing and acknowledgement</h3>
          <p role="status" className={`rounded-lg p-3 text-sm font-semibold ${isDirty?'bg-amber-100 text-amber-900':'bg-green-50 text-green-900'}`}>{!isGenerated?'Generate a telegram to calculate timing.':isDirty?'Previous telegram — regenerate to apply edited settings.':'Generated telegram matches the current settings.'}</p>
          {isGenerated&&<dl className="text-sm space-y-3 text-slate-800">
            {[
              ['Characters',`${totalCharactersCount} octets, including check byte`],
              ['Frame serial length',`${totalTransmitBitsCount} bit periods`],
              ['Frame duration',`${transmissionMs.toFixed(3)} ms`],
              ['Delay to response slot',`${timing.ackGapMs.toFixed(3)} ms (15 bits)`],
              [response==='NONE'?'Silent observation slot':'Response character',`${timing.ackMs.toFixed(3)} ms (11 bits)`],
              ...(response==='NONE'?[]:[['Guard + idle',`${timing.postAckMs.toFixed(3)} ms (${timing.postAckBits} bits)`],['Ideal exchange',`${totalCycleMs.toFixed(3)} ms`]])
            ].map(([name,value])=><div key={name} className="border-b border-slate-200 pb-2"><dt className="text-slate-600">{name}</dt><dd className="font-mono font-semibold mt-1">{value}</dd></div>)}
          </dl>}
          <label className="block text-sm font-semibold text-slate-800">Demonstration response
            <select aria-label="Demonstration response" value={response} onChange={e=>setResponse(e.target.value as typeof response)} className="block w-full mt-2 border rounded-lg p-2 bg-white text-slate-900">
              <option value="CC">ACK · CC · received correctly</option><option value="0C">NAK · 0C · reception error</option><option value="C0">BUSY · C0 · receive buffer full</option><option value="NONE">No acknowledgement · silence</option>
            </select>
          </label>
          <p className="text-xs text-slate-600">Changes apply immediately to the response illustration. They do not change the generated telegram bytes. This is a selected teaching scenario, not a simulated receiver.</p>
          <p className="text-sm text-slate-800">{response==='CC'?'ACK confirms link-layer reception. It does not prove that an actuator performed an action or that an application response will follow.':response==='0C'?'NAK reports a reception error. A sender can repeat the telegram according to its retry behaviour.':response==='C0'?'BUSY reports that the receiving link layer cannot process the telegram because its buffers are full. Retry handling is device-dependent.':'No acknowledgement means no response was observed. The waveform shows a silent nominal response slot, not a specified timeout or complete failed transaction. Retry timing is not calculated.'}</p>
          <p className="text-xs text-slate-600">For simultaneous group acknowledgements, the Tutor course gives BUSY → NAK → ACK priority. A group ACK cannot identify which individual receivers acknowledged. Negative or absent responses can cause repetitions; these are not included in the displayed ideal exchange. Reference: Tutor §3.6.4.</p>
        </aside>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3" aria-label="Read and response example">
        <h3 className="font-bold text-slate-900">Teaching example: read → response</h3>
        <p className="text-sm text-slate-600">1.1.10 asks group 1/0/1 for its value. In this example, sensor 1.1.20 answers with 23.5 °C (DPT 9.001). These are two separate telegrams to the same group address. Each may receive its own link-layer acknowledgement.</p>
        <div className="flex flex-wrap gap-3"><button className="border border-green-700 rounded-lg px-4 py-2 text-sm font-semibold text-green-900" onClick={()=>showReadExample(false)}>1 · Load read request (no value)</button><button className="border border-green-700 rounded-lg px-4 py-2 text-sm font-semibold text-green-900" onClick={()=>showReadExample(true)}>2 · Load temperature response (23.5 °C)</button></div>
        <p className="text-xs text-slate-600">These buttons replace the current configuration and generate that step. A GroupValueResponse is application data, not LL_ACK. It depends on the group-object configuration; no fixed delay between the two telegrams is implied.</p>
      </section>
      <div ref={waveformRef} className="space-y-3">
      {isDirty&&<p className="bg-amber-100 text-amber-900 rounded-lg p-3 text-sm font-semibold">Waveform and byte cards show the previous generated telegram.</p>}
      <WaveformRenderer
        bitStream={compiled?.stream ?? ""}
        ackBits={getAckPhysicalBitStream()}
        ackType={response}
        priority={compiled?.params.priority ?? params.priority}
        bytes={constructedBytes}
        selectionRevision={selectionRevision}
        selectedByte={selectedByte}
        onSelectByte={setSelectedByte}
      />
      </div>

      {/* Structured Octet breakdown displayed only after generating a telegram */}
      {isGenerated && (
        <div className="space-y-6">
          {/* Bytes breakdown cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-knx-blue" />
                <h4 className="text-base font-bold text-slate-900">TP1 Telegram Logical-Physical Byte Reconstruction</h4>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono self-start sm:self-auto font-bold shadow-xs font-sans">
                Hex Dump: {constructedBytes.map(b => b.hex).join(" ")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {constructedBytes.map((byte, idx) => (
                <div
                  key={`byte-card-${idx}`}
                  className="bg-white p-4 border border-slate-200 shadow-sm rounded-xl flex flex-col justify-between hover:border-knx-blue/50 hover:shadow-md transition-all font-sans relative group"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 group-hover:text-knx-blue group-hover:border-knx-blue/30 transition-all">
                    OCTET {idx + 1}
                  </div>
                  <button type="button" className="text-left space-y-2 rounded-lg focus-visible:ring-2 focus-visible:ring-green-700" aria-label={`Inspect byte ${idx+1}: ${byte.name}`} aria-pressed={selectedByte===idx} onClick={()=>{setSelectedByte(idx);setSelectionRevision(v=>v+1);waveformRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}}>
                    <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider block truncate pr-16">
                      {byte.name}
                    </span>

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-mono font-bold text-slate-900">{byte.logicalBinary}</span>
                      <span className="text-xs font-mono font-extrabold text-knx-blue bg-knx-blue/5 px-1.5 py-0.5 rounded">0x{byte.hex}</span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed min-h-[30px] font-medium">
                      {byte.details}
                    </p>
                    <span className="block text-xs font-semibold text-green-800">Inspect fields & waveform →</span>
                  </button>

                  {/* Physical Serial Stream Bit representation in card base */}
                  <div className="mt-4 pt-3 border-t border-slate-100 font-mono text-[9px] space-y-1.5 bg-slate-50 p-2.5 rounded-lg">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Start Bit</span>
                      <span className="text-rose-600 font-bold">{byte.physicalBits.start}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Data bits (LSB-first)</span>
                      <span className="text-slate-900 font-bold">{byte.physicalBits.dataReversed}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Even Parity Bit</span>
                      <span className="text-knx-blue font-bold">{byte.physicalBits.parity}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Stop Bit</span>
                      <span className="text-amber-600 font-bold">{byte.physicalBits.stop}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
