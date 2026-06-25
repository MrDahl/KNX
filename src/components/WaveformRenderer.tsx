import React, { useRef, useEffect } from "react";
import { Zap } from "lucide-react";

interface WaveformRendererProps {
  bitStream: string;
  ackBits?: string;
  ackType?: "CC" | "0C" | "C0";
  isPlayground?: boolean;
}

export function WaveformRenderer({ 
  bitStream, 
  ackBits = "", 
  ackType = "CC", 
  isPlayground = false 
}: WaveformRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Constants for waveform coordinates
  const bitWidth = 34; // visual width of one bit-period
  const t1Width = 190; // pre-telegram idle gap check
  const t2Bits = 15;   // 15 bits for T2 inter-frame gap pause in KNX TP1 spec
  const t2Width = t2Bits * bitWidth;
  const ackWidth = 11 * bitWidth; // ACK character (11 bits)
  const t3Width = 120; // visual trailing idle gap
  
  const height = 280;   // increased height to give vertical and horizontal labels plenty of space
  const baselineY = 150; // zero reference logic level shifted down
  const amplitude = 32;  // vertical scale
  const passiveY = baselineY - amplitude; // 29V reference (logical '1')
  const activeY = baselineY + amplitude;  // Active drop (logical '0')
  const overshootY = passiveY - 24;      // Inductive kickback (36V)

  const telegramWidth = bitStream.length * bitWidth;
  const totalWidth = isPlayground 
    ? t1Width + telegramWidth + t3Width
    : t1Width + telegramWidth + t2Width + ackWidth + t3Width;

  const ackColors = {
    CC: "#509E2F", // KNX Green
    "0C": "#ef4444", // Red Negative LL_NAK
    C0: "#ca8a04", // Amber LL_BUSY
  };
  const ackColor = ackColors[ackType] || "#509E2F";

  // Auto-scroll the visualizer viewport to bring the ACK wave into position when updated
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [bitStream, ackBits]);

  // Builds the complex curve mathematical path for the baseband TP1 signal
  const buildSignalPath = (stream: string, offsetStartX: number): string => {
    let path = `L ${offsetStartX} ${passiveY}`;
    let currentX = offsetStartX;

    for (let i = 0; i < stream.length; i++) {
      const bit = stream[i];
      if (bit === "0") {
        // Active dominant '0' state has drop, steady interval, spike overshoot, exponential settle
        const dropX = currentX;
        const riseX = dropX + bitWidth * 0.35;
        const peakX = dropX + bitWidth * 0.55;
        const settleX = dropX + bitWidth;

        path += ` L ${dropX} ${activeY}`;
        // Bezier to draw the sudden bounce induction overshoot
        path += ` C ${dropX + 3} ${activeY}, ${riseX} ${overshootY + 18}, ${peakX} ${overshootY}`;
        // Curve to decay back to the 29V DC level (passiveY)
        path += ` C ${peakX + 8} ${overshootY + 6}, ${settleX - 5} ${passiveY - 2}, ${settleX} ${passiveY}`;
        currentX = settleX;
      } else {
        // Passive '1' state remains steady at the 29V reference power
        currentX += bitWidth;
        path += ` L ${currentX} ${passiveY}`;
      }
    }
    return path;
  };

  const telegramPath = `M 0 ${passiveY} L ${t1Width} ${passiveY} ` + buildSignalPath(bitStream, t1Width) + (isPlayground ? ` L ${totalWidth} ${passiveY}` : "");
  const ackStartX = isPlayground ? 0 : t1Width + telegramWidth + t2Width;
  const fullAckPath = isPlayground ? "" : `M ${ackStartX} ${passiveY} ` + buildSignalPath(ackBits, ackStartX) + ` L ${totalWidth} ${passiveY}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-knx-blue/5 blur-[100px] pointer-events-none -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-knx-green/5 blur-[100px] pointer-events-none -ml-40 -mb-40" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-knx-blue animate-pulse" />
            {isPlayground ? "Interactive Custom Bitstream Voltage Simulator" : "KNX TP1 Physical Waveform Signal Shape"}
          </h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            {isPlayground 
              ? "Type raw bits on the keyboard and watch how voltage states drop and overshoot dynamically on the physical line."
              : "Visualises physical voltage drops on the Twisted Pair cable. Drag or scroll to explore the entire stream."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-150 text-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-knx-blue shrink-0" />
            29V DC (Passive 1)
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-150 text-slate-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-rose-500" />
            Voltage Drop (Active 0)
          </div>
          {!isPlayground && ackBits && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-150 text-slate-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ackColor }} />
              LL_ACK ({ackType})
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Scroller */}
      <div 
        ref={containerRef}
        className="w-full overflow-x-auto select-none overflow-y-hidden cursor-grab active:cursor-grabbing border border-slate-150 bg-slate-50 rounded-xl py-4 scrollbar-thin"
        style={{ scrollBehavior: "smooth" }}
      >
        <svg 
          ref={svgRef}
          width={totalWidth} 
          height={height} 
          className="block mx-auto min-w-full font-mono overflow-visible"
        >
          {/* Grids and References */}
          <line 
            x1={0} y1={passiveY} 
            x2={totalWidth} y2={passiveY} 
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={15} y={passiveY + 14} className="fill-knx-blue text-[9px] font-sans font-extrabold uppercase tracking-wider">29V DC (Passive '1' Idle Level)</text>
          
          <line 
            x1={0} y1={activeY} 
            x2={totalWidth} y2={activeY} 
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text x={15} y={activeY + 14} className="fill-rose-650 text-[9px] font-sans font-extrabold uppercase tracking-wider">~24V DC (Active '0' dominant drop of ~5V)</text>

          {/* Theoretical 0V Ground Reference Line & Axis Break */}
          <line 
            x1={0} y1={216} 
            x2={totalWidth} y2={216} 
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x={15} y={229} className="fill-slate-600 text-[9px] font-sans font-extrabold uppercase tracking-wider">0V DC (Theoretical Ground Level — Never reached during data transmission)</text>

          {/* Axis Break Indicator on the left */}
          <g className="opacity-80">
            <line x1={8} y1={203} x2={16} y2={199} stroke="#64748b" strokeWidth="1.5" />
            <line x1={8} y1={207} x2={16} y2={203} stroke="#64748b" strokeWidth="1.5" />
            <text x={22} y={205} className="fill-slate-400 text-[8px] font-sans font-semibold italic">Scale break: 24V down to 0V is highly compressed</text>
          </g>

          <line 
            x1={0} y1={overshootY} 
            x2={totalWidth} y2={overshootY} 
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text x={15} y={overshootY - 8} className="fill-slate-500 text-[9px] font-sans font-extrabold uppercase tracking-wider">~36V Inductive Overshoot bounce</text>

          {/* Zones Separators */}
          {/* T1 */}
          <line x1={t1Width} y1={10} x2={t1Width} y2={height - 10} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
          <text x={t1Width / 2} y={35} textAnchor="middle" className="fill-slate-500 text-xs font-bold font-sans">T1 Idle</text>
          <text x={t1Width / 2} y={height - 24} textAnchor="middle" className="fill-slate-400 text-[10px] font-sans font-bold">50 bits</text>

          {/* Telegram Line */}
          <line x1={t1Width + telegramWidth} y1={10} x2={t1Width + telegramWidth} y2={height - 10} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
          <text x={t1Width + telegramWidth / 2} y={35} textAnchor="middle" className="fill-knx-blue text-xs font-bold font-sans">
            {isPlayground ? "PLAYGROUND BIT SEQUENCE" : "TRANSMITTING TELEGRAM"}
          </text>
          
          {!isPlayground && (
            <>
              {/* T2 intercharacter pause */}
              <line 
                x1={t1Width + telegramWidth + t2Width} 
                y1={10} x2={t1Width + telegramWidth + t2Width} 
                y2={height - 10} 
                stroke="#cbd5e1" 
                strokeWidth="1" 
                strokeDasharray="3 3" 
              />
              <text 
                x={t1Width + telegramWidth + t2Width / 2} 
                y={35} textAnchor="middle" 
                className="fill-slate-500 text-xs font-bold font-sans"
              >
                T2 Pause
              </text>
              <text 
                x={t1Width + telegramWidth + t2Width / 2} 
                y={height - 24} textAnchor="middle" 
                className="fill-slate-400 text-[10px] font-sans font-bold"
              >
                1.56 ms (15 bits)
              </text>

              {/* ACK */}
              <line 
                x1={t1Width + telegramWidth + t2Width + ackWidth} 
                y1={10} x2={t1Width + telegramWidth + t2Width + ackWidth} 
                y2={height - 10} 
                stroke="#cbd5e1" 
                strokeWidth="1" 
                strokeDasharray="3 3" 
              />
              <text 
                x={t1Width + telegramWidth + t2Width + ackWidth / 2} 
                y={35} textAnchor="middle" 
                style={{ fill: ackColor }}
                className="text-xs font-bold font-sans"
              >
                LL_ACK
              </text>
              {/* T3 segment */}
              <text 
                x={t1Width + telegramWidth + t2Width + ackWidth + t3Width / 2} 
                y={35} textAnchor="middle" 
                className="fill-slate-500 text-xs font-bold font-sans"
              >
                T3 Idle
              </text>
              <text 
                x={t1Width + telegramWidth + t2Width + ackWidth + t3Width / 2} 
                y={height - 24} textAnchor="middle" 
                className="fill-slate-400 text-[10px] font-sans font-bold"
              >
                5.2 ms (50 bits)
              </text>
            </>
          )}

          {isPlayground && (
            <>
              {/* T3 segment trailing for playground */}
              <text 
                x={t1Width + telegramWidth + t3Width / 2} 
                y={35} textAnchor="middle" 
                className="fill-slate-500 text-xs font-bold font-sans"
              >
                End Idle
              </text>
            </>
          )}

          {/* RENDER TELEGRAM WAVEFORM */}
          <path 
            d={telegramPath} 
            fill="none" 
            stroke="#509E2F" 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />

          {/* Bit grids for telegram bits */}
          {bitStream.split("").map((bit, idx) => {
            const x = t1Width + idx * bitWidth;
            return (
              <g key={`tele-bit-${idx}`}>
                <line x1={x} y1={passiveY - 14} x2={x} y2={activeY + 14} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4" />
                <rect 
                  x={x + 1} 
                  y={height - 40} 
                  width={bitWidth - 2} 
                  height={18} 
                  className={`rounded fill-white stroke-1 ${bit === "1" ? "stroke-slate-200" : "stroke-knx-blue"}`} 
                />
                <text 
                  x={x + bitWidth / 2} 
                  y={height - 27} 
                  textAnchor="middle" 
                  className={`text-[11px] font-bold ${bit === "1" ? "fill-slate-400" : "fill-knx-blue font-mono"}`}
                >
                  {bit}
                </text>
                <text 
                  x={x + bitWidth / 2} 
                  y={height - 4} 
                  textAnchor="middle" 
                  className="fill-slate-400 text-[8px] font-bold"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* RENDER LL_ACK WAVEFORM */}
          {!isPlayground && ackBits && (
            <path 
              d={fullAckPath} 
              fill="none" 
              stroke={ackColor} 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          )}

          {/* Bit grids for ACK bits */}
          {!isPlayground && ackBits && ackBits.split("").map((bit, idx) => {
            const x = ackStartX + idx * bitWidth;
            return (
              <g key={`ack-bit-${idx}`}>
                <line x1={x} y1={passiveY - 14} x2={x} y2={activeY + 14} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4" />
                <rect 
                  x={x + 1} 
                  y={height - 40} 
                  width={bitWidth - 2} 
                  height={18} 
                  className="rounded fill-white stroke-1 stroke-slate-200" 
                />
                <text 
                  x={x + bitWidth / 2} 
                  y={height - 27} 
                  textAnchor="middle" 
                  style={{ fill: bit === "0" ? ackColor : "#94a3b8" }}
                  className="text-[11px] font-bold"
                >
                  {bit}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Educational details callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-[11px] text-slate-500 leading-relaxed font-sans">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex gap-2.5">
          <span className="text-knx-blue font-extrabold text-xs">A</span>
          <div>
            <span className="text-slate-800 font-bold block mb-1">No Zero-Volt Drops</span>
            A standard KNX logical '0' is active dominant but drops the voltage by only ~5V (forcing a ~24V level). If signals dropped down to 0V, or crossed a zero potential line, bus devices would suffer a total power loss during long telegram transmissions!
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex gap-2.5">
          <span className="text-knx-green font-extrabold text-xs">B</span>
          <div>
            <span className="text-slate-800 font-bold block mb-1">Inductive Overshoot Peak</span>
            The power source has an integrated choke coil. When the pulldown active '0' drops, current deceleration triggers an electromagnetic bounce back overshoot of up to ~13V above average level.
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex gap-2.5">
          <span className="text-knx-blue font-extrabold text-xs">C</span>
          <div>
            <span className="text-slate-800 font-bold block mb-1">Timing Tolerances</span>
            A stable bit occupies exactly 104 µs (1/9600s). Accurate filters in the receiving transceivers handle minor phase distortions caused by line capacitance or long ring topologies.
          </div>
        </div>
      </div>
    </div>
  );
}
