import React, { useState } from "react";
import { Sliders, Play, Layers, AlertTriangle, Clock, CornerDownRight, Zap } from "lucide-react";
import { APCICode, TelegramParams, TelegramByte, KNXAddressIndividual, KNXAddressGroup } from "../types";
import { APCI_DEFS, DPT_DEFS, decodeKnxFloat, PRESET_TELEGRAMS } from "../data";
import { WaveformRenderer } from "./WaveformRenderer";

// Scope: standard, plain TP1 group-value telegrams. DPT IDs are not sent on the bus.
// Sources: supplied Tutor PDF pp. 111, 114, 121–123; DPT v02.02.01 p. 39.
const GROUP_SERVICES = [APCICode.GroupValueRead, APCICode.GroupValueResponse, APCICode.GroupValueWrite];
const STANDARD_DPTS = DPT_DEFS.filter(d => d.sizeBits <= 112);
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

export function telegramTiming(octets: number, priority: TelegramParams["priority"]) {
  // End of last stop bit -> ACK: 15 periods. After ACK: 2 guard periods
  // plus 50 system / 53 lower-priority idle periods. Total = (n+2)*13 + idle.
  const bitMs = 1000 / 9600;
  const frameBits = octets * 11 + Math.max(0, octets - 1) * 2;
  const idleBits = priority === "00" ? 50 : 53;
  return { frameBits, frameMs: frameBits * bitMs, ackGapMs: 15 * bitMs,
    ackMs: 11 * bitMs, postAckBits: 2 + idleBits, postAckMs: (2 + idleBits) * bitMs,
    cycleMs: (frameBits + 15 + 11 + 2 + idleBits) * bitMs };
}

export function TelegramVisualizer() {
  const [params, setParams] = useState<TelegramParams>({repeatFlag: "1", targetType: "1", command: APCICode.GroupValueWrite,
    source: {area: 1, line: 1, device: 10}, destination: {main: 1, middle: 0, sub: 1}, routingCounter: 6, priority: "11", dptType: "1.001", ackType: "CC"});
  const [dptValue, setDptValue] = useState("1");
  const [currentPreset, setCurrentPreset] = useState(-1);
  const [constructedBytes, setLogicalBytes] = useState<TelegramByte[]>([]);
  const [customBitstreamInput, setCustomBitstreamInput] = useState("");
  const [compiled, setCompiled] = useState<{signature: string; stream: string; params: TelegramParams} | null>(null);
  const [error, setError] = useState("");
  const signature = JSON.stringify([params, dptValue]);
  const isGenerated = compiled !== null;
  const isDirty = !!compiled && (compiled.signature !== signature || customBitstreamInput !== compiled.stream);
  const isRead = params.command === APCICode.GroupValueRead;
  const padBinary = bits;
  const applyPreset = (idx: number) => {
    const p = PRESET_TELEGRAMS[idx];
    setParams({...p.params, source: {...p.params.source}, destination: {...p.params.destination}} as TelegramParams);
    // Correct this tool's presets without modifying the shared catalogue in this step.
    setDptValue(p.params.dptType === "9.001" ? encodeTemperature(23.5) : p.params.dptType === "5.001" ? bits(Math.round(75 * 255 / 100)) : p.payloadValue);
    setCurrentPreset(idx); setError("");
  };
  const handleGenerateClick = () => {
    try {
      const result = buildStandardGroupTelegram(params, dptValue);
      setLogicalBytes(result.cards); setCustomBitstreamInput(result.stream);
      setCompiled({signature, stream: result.stream, params: {...params}}); setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot generate this telegram.");
      setCompiled(null); setLogicalBytes([]); setCustomBitstreamInput("");
    }
  };
  const handleDptSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value, d = STANDARD_DPTS.find(d => d.id === id)!;
    setParams(p => ({...p, dptType: id}));
    // Raw zero defaults avoid inheriting unverified handwritten examples.
    setDptValue(id === "9.001" ? encodeTemperature(21) : "0".repeat(d.sizeBits));
    setCurrentPreset(-1); setError("");
  };
  const totalCharactersCount = constructedBytes.length;
  const timing = telegramTiming(totalCharactersCount, compiled?.params.priority ?? params.priority);
  const totalTransmitBitsCount = timing.frameBits, transmissionMs = timing.frameMs, totalCycleMs = timing.cycleMs;
  const getAckPhysicalBitStream = () => compiled ? serial(bits(parseInt(compiled.params.ackType, 16))) : "";

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
              <strong className="text-amber-900">Modified input:</strong> Settings or waveform bits have changed. Byte cards and timing still describe the last generated telegram. Generate again to apply the current settings.
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerateClick}
            className="bg-amber-600 text-white font-bold px-3.5 py-2 rounded-xl text-[10px] hover:bg-amber-700 transition-colors shrink-0"
          >
            Update Waveform
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
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DPT Data Value Field Inputs */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1">
                DPT Payload Data Value
              </label>
              {isRead ? <p className="text-xs text-slate-600">Read requests carry no value. The selected DPT does not change the request bytes.</p> : params.dptType === "1.001" ? (
                <select
                  value={dptValue}
                  onChange={(e) => { setDptValue(e.target.value); setCurrentPreset(-1); }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
                >
                  <option value="1">On (1)</option>
                  <option value="0">Off (0)</option>
                </select>
              ) : params.dptType === "5.001" ? (
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dptValue ? Math.round((parseInt(dptValue, 2) / 255) * 100) : 0}
                    onChange={(e) => {
                      const perc = parseInt(e.target.value);
                      const bin = padBinary(Math.round((perc / 100) * 255), 8);
                      setDptValue(bin);
                      setCurrentPreset(-1);
                    }}
                    className="w-full h-1.5 mt-3.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-knx-blue"
                  />
                  <span className="font-mono text-xs text-knx-blue mt-1 pb-1 px-1.5 shrink-0 bg-knx-blue/5 border border-knx-blue/10 rounded">
                    {dptValue ? Math.round((parseInt(dptValue, 2) / 255) * 100) : 0}%
                  </span>
                </div>
              ) : params.dptType === "9.001" ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="-273"
                    max="670433.28"
                    step="0.01"
                    value={dptValue.length === 16 ? decodeKnxFloat(dptValue) : ""}
                    onChange={(e) => {
                      const tc = Number(e.target.value);
                      if (!e.target.value.trim() || !Number.isFinite(tc) || tc < -273 || tc > 670433.28) {
                        setDptValue(""); setError("Temperature must be between -273 and 670433.28 °C."); return;
                      }
                      setError(""); setDptValue(encodeTemperature(tc));
                      setCurrentPreset(-1);
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
                  />
                  <span className="font-mono text-xs text-knx-blue mt-1.5 shrink-0 font-bold">°C</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={dptValue}
                  onChange={(e) => { setDptValue(e.target.value); setCurrentPreset(-1); }}
                  placeholder="Bits sequence (00101011...)"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none"
                />
              )}
              {(() => {
                const d = DPT_DEFS.find((x) => x.id === params.dptType);
                if (d) {
                  return (
                    <div className="mt-2 text-[10px] text-slate-500 leading-normal border-t border-slate-200/50 pt-1.5">
                      <span className="font-semibold text-slate-700 block mb-0.5">{d.name} ({d.sizeBits} {d.sizeBits === 1 ? "bit" : "bits"}):</span>
                      <span className="text-slate-500 font-sans block leading-normal">{isRead ? "No value is encoded for a read request." : "Value bits are shown most significant bit first; each octet is transmitted least significant bit first. Raw bit input checks length, not every subtype-specific reserved value."}</span>
                    </div>
                  );
                }
                return null;
              })()}
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

        {/* Dynamic Timing Stats Block */}
        {!isGenerated ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-5 lg:col-span-1">
            <div className="w-12 h-12 bg-knx-blue/10 rounded-full flex items-center justify-center text-knx-blue">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Live Frame analysis</h4>
              <p className="text-[11px] text-slate-500 leading-normal font-medium max-w-[200px]">
                Once compiled, real-time bit counts, cycle times, air duration, and ACK values will be simulated here.
              </p>
            </div>
            <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-[10.5px] text-slate-500 font-medium leading-relaxed italic text-left">
              💡 <strong>Pro-Tip:</strong> Try changing the data payload to a larger type (like 9.001 2-octet Float) to see how character length scales timing requirements!
            </div>
          </div>
        ) : (
          <div className="bg-knx-blue rounded-2xl p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-5">
              <div className="border-b border-white/20 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-white/80" />
                  Transmission Timing Metrics
                </h3>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Total Characters</span>
                  <span className="font-mono text-white font-bold">{totalCharactersCount} octets (includes check byte)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Total Serial Bits</span>
                  <span className="font-mono text-white font-bold">{totalTransmitBitsCount} bits</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Frame duration (through final stop bit)</span>
                  <span className="font-mono text-emerald-300 font-bold">{transmissionMs.toFixed(3)} ms</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Final stop bit → ACK</span>
                  <span className="font-mono text-white/80 font-bold">{timing.ackGapMs.toFixed(3)} ms (15 bits)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Link-Layer ACK Time</span>
                  <span className="font-mono text-white/80 font-bold">{timing.ackMs.toFixed(3)} ms (11 bits)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">After ACK: guard + idle</span>
                  <span className="font-mono text-white/80 font-bold">{timing.postAckMs.toFixed(3)} ms ({timing.postAckBits} bits)</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/75 uppercase font-bold block mb-1">Ideal cycle (no retries or contention)</span>
                  <span className="font-mono text-lg text-emerald-300 font-bold">{totalCycleMs.toFixed(3)} ms</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-[10px] text-white/80 uppercase font-bold block mb-2">Simulated Link Layer Acknowledgment</span>
              <select
                value={params.ackType}
                onChange={(e) => setParams(prev => ({ ...prev, ackType: e.target.value as any }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="CC" className="text-slate-900 bg-white font-medium">0xCC - Positive (LL_ACK)</option>
                <option value="0C" className="text-slate-900 bg-white font-medium">0x0C - Negative Error (LL_NAK)</option>
                <option value="C0" className="text-slate-900 bg-white font-medium">0xC0 - Target Overload (LL_BUSY)</option>
              </select>
              <p className="text-[9.5px] text-white/60 mt-2 italic leading-relaxed opacity-75">
                * Collision Avoidance determines that BUSY takes channel priority over NAK, which beats ACK.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Unified Interactive Waveform & Bitstream Controller Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-knx-blue animate-pulse" />
              Interactive Bus Voltage Waveform Visualizer
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Illustrative TP1 signal shape. Custom waveform bits do not alter the generated byte cards or timing. The drawing’s idle margins are schematic; use the timing panel for calculated durations.
            </p>
          </div>
          <span className="text-[10px] uppercase font-extrabold text-knx-blue bg-knx-blue/10 px-2.5 py-1 rounded-full border border-knx-blue/20 self-start sm:self-auto shrink-0">
            Illustrative waveform
          </span>
        </div>

        {/* Input Sandbox Field directly tied to the Waveform */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
              Physical Bit Sequence Stream (Type 1s and 0s to modify wave in real-time)
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={customBitstreamInput}
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^01]/g, "");
                  setCustomBitstreamInput(filtered);
                  // Mark as custom mode

                }}
                placeholder="Type raw bits here (e.g., 0101100110)..."
                className="flex-grow bg-white border border-slate-200 focus:border-knx-blue focus:ring-1 focus:ring-knx-blue/25 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:outline-none text-slate-800"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCustomBitstreamInput("");

                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
                >
                  Clear bits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomBitstreamInput("1010101010101010");

                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
                >
                  Alternating (1010...)
                </button>
                {isGenerated && (
                  <button
                    type="button"
                    onClick={() => {
                      if (compiled) setCustomBitstreamInput(compiled.stream);
                    }}
                    className="px-3 py-2 bg-knx-blue/10 hover:bg-knx-blue/15 text-knx-blue rounded-xl text-xs font-bold transition-all border border-knx-blue/20 shadow-xs cursor-pointer"
                  >
                    Reset to Compiled Telegram
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
              * A logical <strong className="text-rose-500 font-bold">'0'</strong> forces an active voltage drop to ~24V with inductive kickback overshoot, while logical <strong className="text-knx-blue font-bold">'1'</strong> remains silent at 29V DC.
            </p>
          </div>
        </div>

        {/* Waveform Renderer */}
        <WaveformRenderer
          bitStream={customBitstreamInput}
          ackBits={getAckPhysicalBitStream()}
          ackType={compiled?.params.ackType ?? params.ackType}
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
                  <div className="space-y-2">
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
                  </div>

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
