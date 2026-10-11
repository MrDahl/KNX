import React, { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import type { TelegramByte, TelegramParams } from "../types";

// Tutor: Serial Data Transmission §§3.7.1–3.7.4 (PDF pp.113–119).
// Example amplitudes only; not a transmitter/receiver compliance envelope.
export const BIT_US = 1e6 / 9600;
export const ACTIVE_US = 35;
export function telegramTiming(octets: number, priority: TelegramParams["priority"]) {
  const bitMs = BIT_US / 1000;
  const frameBits = octets * 11 + Math.max(0, octets - 1) * 2;
  const idleBits = priority === "00" ? 50 : 53;
  return { frameBits, frameMs: frameBits * bitMs, ackGapMs: 15 * bitMs,
    ackMs: 11 * bitMs, postAckBits: 2 + idleBits, postAckMs: (2 + idleBits) * bitMs,
    cycleMs: (frameBits + 15 + 11 + 2 + idleBits) * bitMs };
}
const y = (volts: number) => 235 - volts * 4.5;
// Same pulse geometry in the detail view and every serial bit. The decay is
// normalized to reach the illustrative resting level at the end of the bit.
export function signalPath(stream: string, start: number, width: number) {
  let path = `M ${start} ${y(29)}`;
  for (let i = 0; i < stream.length; i++) {
    const x = start + i * width;
    if (stream[i] === "0") {
      const release = x + width * ACTIVE_US / BIT_US;
      path += ` L ${x} ${y(22)} L ${release} ${y(22)} L ${release} ${y(36)}`;
      for (let j = 1; j <= 16; j++) {
        const u = j / 16;
        const v = 29 + 7 * (Math.exp(-5 * u) - Math.exp(-5)) / (1 - Math.exp(-5));
        path += ` L ${release + (x + width - release) * u} ${y(v)}`;
      }
    } else path += ` L ${x + width} ${y(29)}`;
  }
  return path;
}
const responseNames = { CC: "ACK", "0C": "NAK", C0: "BUSY" };
const bitNames = ["Start", "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "Parity", "Stop", "Gap", "Gap"];
const buttonStyle = "px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-green-600";
interface WaveformRendererProps {
  bitStream: string;
  ackBits?: string;
  ackType?: "CC" | "0C" | "C0";
  priority?: TelegramParams["priority"];
  bytes?: TelegramByte[];
}
export function WaveformRenderer({bitStream, ackBits = "", ackType = "CC", priority = "11", bytes = []}: WaveformRendererProps) {
  const [mode, setMode] = useState<"telegram" | "raw">("telegram");
  const [raw, setRaw] = useState("0101");
  const [zoom, setZoom] = useState(12);
  const [focusByte, setFocusByte] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const timing = telegramTiming(bytes.length, priority);
  const generated = mode === "telegram" && !!bitStream && bytes.length > 0;
  const stream = mode === "raw" ? raw : bitStream;
  const ackStart = stream.length + 15;
  const totalBits = generated ? ackStart + 11 + timing.postAckBits : stream.length;
  const left = 80, end = left + totalBits * zoom, width = Math.max(600, end + 35);
  useEffect(() => { setMode("telegram"); setFocusByte(0); }, [bitStream, ackBits, priority]);
  useEffect(() => { if (scroller.current) scroller.current.scrollLeft = focusByte * 13 * zoom; }, [focusByte, zoom]);
  const jump = (index: number) => { setZoom(40); setFocusByte(index); if (scroller.current) scroller.current.scrollLeft = index * 13 * 40; };
  return <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
    <div>
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Zap className="h-5 w-5 text-green-700" />TP1 waveform explorer</h3>
      <p className="text-sm text-slate-600 mt-2">Idealized TP1 signalling at 9,600 bit/s. Example voltages, not a measured trace or an electrical compliance test.</p>
    </div>
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="font-semibold text-slate-900">Bit detail: active zero and passive one</h4>
      <p className="text-xs text-slate-600 mt-1">Bus voltage between red (+) and black (−). Linear voltage scale; 29 V resting, 7 V drop and +7 V equalization peak are illustrative.</p>
      <svg viewBox="0 0 900 305" role="img" aria-label="Zero: 35 microseconds at 22 volts, then equalization from 36 toward 29 volts. One: passive at 29 volts. Each bit lasts 104.167 microseconds." className="w-full block" style={{minHeight:180}}>
        {[0,22,29,36].map(v => <g key={v}><line x1="75" x2="860" y1={y(v)} y2={y(v)} stroke="#cbd5e1" strokeDasharray="3 4"/><text x="63" y={y(v)+4} textAnchor="end" fill="#475569" fontSize="12">{v} V</text></g>)}
        <rect x="110" y="45" width={340*ACTIVE_US/BIT_US} height="195" fill="#fef3c7" opacity="0.45"/>
        <path d={signalPath("01",110,340)} fill="none" stroke="#448c29" strokeWidth="3"/>
        <text x="280" y="25" textAnchor="middle" fill="#166534" fontSize="16" fontWeight="bold">0 · active / dominant</text>
        <text x="620" y="25" textAnchor="middle" fill="#475569" fontSize="16" fontWeight="bold">1 · passive</text>
        <text x="166" y="215" textAnchor="middle" fontSize="11" fill="#92400e">Active: 35 µs</text>
        <text x="337" y="60" textAnchor="middle" fontSize="11" fill="#166534">Equalization: ≈69 µs</text>
        {[0,1,2].map(i => <g key={i}><line x1={110+i*340} x2={110+i*340} y1="80" y2="247" stroke="#94a3b8" strokeDasharray="3 4"/><text x={110+i*340} y="265" textAnchor="middle" fontSize="12" fill="#475569">{(i*BIT_US).toFixed(3)} µs</text></g>)}
        <text x="450" y="295" textAnchor="middle" fontSize="12" fill="#475569">One bit = 104.167 µs nominal · the equalization decay is illustrative</text>
      </svg>
    </div>
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Waveform mode">
      <button className={buttonStyle} aria-pressed={mode === "telegram"} onClick={() => setMode("telegram")}>Generated telegram</button>
      <button className={buttonStyle} aria-pressed={mode === "raw"} onClick={() => setMode("raw")}>Raw-bit playground</button>
      <label className="ml-auto text-xs text-slate-600">Horizontal zoom <select aria-label="Horizontal zoom" className="border rounded p-2 ml-2 bg-white" value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value={12}>Overview</option><option value={24}>Bits</option><option value={40}>Character detail</option></select></label>
    </div>
    {mode === "raw" ? <div className="space-y-2">
      <label className="text-sm font-semibold block" htmlFor="tp1-raw">Raw bits (maximum 512)</label>
      <input id="tp1-raw" className="border rounded-lg p-3 w-full font-mono text-sm" value={raw} maxLength={512} onChange={e => setRaw(e.target.value.replace(/[^01]/g,""))}/>
      <div className="flex gap-2"><button className={buttonStyle} onClick={() => setRaw("")}>Clear bits</button><button className={buttonStyle} onClick={() => setRaw("01010101")}>Alternating bits</button><button className={buttonStyle} disabled={!bitStream} onClick={() => setRaw(bitStream)}>Copy generated bits</button></div>
      <p className="text-xs text-slate-600">Arbitrary bits only. No framing validation, acknowledgement or telegram-cycle timing is implied. The generated byte cards remain unchanged.</p>
    </div> : <p className="text-xs text-slate-600">Last generated telegram. All intervals share the same time scale; scroll horizontally to reach the response. Click a byte below to inspect its character.</p>}
    {generated && <div className="flex flex-wrap gap-2" aria-label="Jump to telegram byte">{bytes.map((b,i) => <button key={i} className={buttonStyle} title={b.name} onClick={() => jump(i)}>{i+1}: {b.hex}</button>)}</div>}
    {!stream ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">{mode === "raw" ? "Enter bits to draw a waveform." : "Generate a telegram above to inspect its complete transmission."}</p> : <>
      <div ref={scroller} tabIndex={0} role="region" aria-label="Scrollable TP1 timeline" className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
        <svg width={width} height="330" role="img" aria-label={`${mode === "raw" ? "Raw bits" : "Generated telegram"}: ${stream.length} bit periods${generated ? `, then 15-bit pause, ${responseNames[ackType]}, and ${timing.postAckBits}-bit guard and idle` : ""}`}>
          {[22,29,36].map(v => <g key={v}><line x1={left} x2={end} y1={y(v)} y2={y(v)} stroke="#cbd5e1" strokeDasharray="3 4"/><text x="65" y={y(v)+4} textAnchor="end" fill="#475569" fontSize="11">{v} V</text></g>)}
          <path d={signalPath(stream,left,zoom) + (generated ? ` L ${left+ackStart*zoom} ${y(29)}` : "")} fill="none" stroke="#448c29" strokeWidth="2"/>
          {generated && <path d={signalPath(ackBits,left+ackStart*zoom,zoom)+` L ${end} ${y(29)}`} fill="none" stroke={ackType === "CC" ? "#166534" : "#b45309"} strokeWidth="2"/>}
          {stream.split("").map((bit,i) => <g key={i}>
            <line x1={left+i*zoom} x2={left+i*zoom} y1="65" y2="207" stroke="#e2e8f0"/>
            <text x={left+(i+.5)*zoom} y="225" textAnchor="middle" fontSize="10" fill="#334155">{bit}</text>
            {zoom >= 24 && <text x={left+(i+.5)*zoom} y="246" textAnchor="middle" fontSize="9" fill="#475569">{generated ? bitNames[i%13] : i+1}</text>}
          </g>)}
          {generated && bytes.map((b,i) => <g key={i}>
            <rect x={left+i*13*zoom} y="20" width={11*zoom} height="26" rx="4" fill="#dcfce7"/>
            <text x={left+(i*13+5.5)*zoom} y="38" textAnchor="middle" fontSize="11" fill="#166534">Byte {i+1} · {b.hex}</text>
          </g>)}
          {generated && <>
            <text x={left+(stream.length+7.5)*zoom} y="38" textAnchor="middle" fontSize="11" fill="#475569">Pause · 15 bits</text>
            <text x={left+(ackStart+5.5)*zoom} y="38" textAnchor="middle" fontSize="11" fill="#92400e">{responseNames[ackType]} · {ackType}</text>
            <text x={left+(ackStart+11+timing.postAckBits/2)*zoom} y="38" textAnchor="middle" fontSize="11" fill="#475569">Guard 2 + idle {timing.postAckBits-2} bits</text>
            {ackBits.split("").map((b,i) => <g key={i}><text x={left+(ackStart+i+.5)*zoom} y="225" textAnchor="middle" fontSize="10" fill="#92400e">{b}</text>{zoom>=24 && <text x={left+(ackStart+i+.5)*zoom} y="246" textAnchor="middle" fontSize="9" fill="#475569">{bitNames[i]}</text>}</g>)}
          </>}
          {(generated ? [0,stream.length,ackStart,ackStart+11,totalBits] : [0,totalBits]).map((n,i) => <g key={i}><line x1={left+n*zoom} x2={left+n*zoom} y1="50" y2="275" stroke="#64748b" strokeDasharray="3 4"/><text x={left+n*zoom} y={i%2 ? 310 : 290} textAnchor="middle" fontSize="11" fill="#475569">{(n*BIT_US/1000).toFixed(3)} ms</text></g>)}
        </svg>
      </div>
      {generated && <p className="text-xs text-slate-600">Frame: {timing.frameMs.toFixed(3)} ms · Response delay: {timing.ackGapMs.toFixed(3)} ms · Response: {timing.ackMs.toFixed(3)} ms · Guard + idle: {timing.postAckMs.toFixed(3)} ms · Ideal cycle: {timing.cycleMs.toFixed(3)} ms. No contention or retries included.</p>}
    </>}
    <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
      <p><strong className="block text-slate-900 mb-1">Supply and signal</strong>Communication is superimposed on the DC bus supply. A zero actively lowers the bus voltage; a one has no active pulse. Neither conductor is a protective-earth reference.</p>
      <p><strong className="block text-slate-900 mb-1">Equalization phase</strong>The active pulse is followed by positive equalization and a return toward the resting voltage. The bus choke, integrated or separate, is essential. Actual shapes depend on the transmitter, cable and loading.</p>
      <p><strong className="block text-slate-900 mb-1">Reading this illustration</strong>The Tutor overview gives 21–32 V DC, a 3–10 V drop and up to +13 V overshoot. These are separate from this example’s 29 / 22 / 36 V levels. The curve is not a tolerance envelope.</p>
    </div>
    <p className="text-xs text-slate-500">References: KNX Tutor course, Serial Data Transmission §§3.7.1–3.7.4, Figures 9–11; KNX Basic course, System overview §§10–13.2. Nominal bit timing is exact in this model; analogue amplitudes and decay are illustrative.</p>
  </section>;
}
