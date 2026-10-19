import {tr} from '../i18n';
import {useTranslation} from 'react-i18next';
import React, { useState } from "react";
import {TELEGRAM_FIELDS} from '../knx/telegramFields';
import {receiveSwitchWrite} from "../knx/teachingModels";
import {
  Send,
  RotateCcw,
  Info,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  ListFilter
} from "lucide-react";

interface BusLog {
  time: string;
  source: string;
  destination: string;
  type: string;
  value: string;
  status: "success" | "error";
  details: string;
}

export function SendingSimulator({onTransmit}:{onTransmit?:(destination:string,value:boolean)=>void}) {
 useTranslation();
  // Initial matrix state
  const [matrix, setMatrix] = useState({
    sensor1: { ga1: false, ga2: false },
    actuator1: { ga1: false, ga2: false },
    actuator2: { ga1: false, ga2: false }
  });

  // Keep track of the sending address for Sensor 1 ("1/1/1" or "1/1/2" or null)
  const [sFlagGa, setSFlagGa] = useState<"1/1/1" | "1/1/2" | null>(null);

  // Visual status of Lamp A and Lamp B
  const [lampA, setLampA] = useState<boolean>(false);
  const [lampB, setLampB] = useState<boolean>(false);

  const [sendValue, setSendValue] = useState(true);
  const [receiverFlags, setReceiverFlags] = useState([{communication:true, write:true}, {communication:true, write:true}]);

  // Bus Monitor Log
  const [busLogs, setBusLogs] = useState<BusLog[]>([]);

  // Toggling checkboxes in matrix
  const handleCheckboxChange = (
    row: "sensor1" | "actuator1" | "actuator2",
    ga: "1/1/1" | "1/1/2"
  ) => {
    const gaKey = ga === "1/1/1" ? "ga1" : "ga2";

    if (row === "sensor1") {
      const nextVal = !matrix.sensor1[gaKey];
      const otherGa = ga === "1/1/1" ? "1/1/2" : "1/1/1";
      const otherKey = otherGa === "1/1/1" ? "ga1" : "ga2";
      if (nextVal && !sFlagGa) setSFlagGa(ga);
      if (!nextVal && sFlagGa === ga) setSFlagGa(matrix.sensor1[otherKey] ? otherGa : null);
      setMatrix(prev => ({...prev, sensor1:{...prev.sensor1,[gaKey]:nextVal}}));
    } else {
      // Actuators can be checked freely
      setMatrix(prev => ({
        ...prev,
        [row]: {
          ...prev[row],
          [gaKey]: !prev[row][gaKey]
        }
      }));
    }
  };

  // Reset all links, lamps, and logs
  const handleReset = () => {
    setMatrix({
      sensor1: { ga1: false, ga2: false },
      actuator1: { ga1: false, ga2: false },
      actuator2: { ga1: false, ga2: false }
    });
    setSFlagGa(null);
    setLampA(false);
    setLampB(false);
    setBusLogs([]);
    setSendValue(true);
    setReceiverFlags([{communication:true, write:true}, {communication:true, write:true}]);
  };

  // Triggering physical button press on Sensor 1
  const handlePressButton = () => {
    const timeStr = new Date().toLocaleTimeString();

    // 1. Check if sending address exists
    if (!sFlagGa) {
      const errorLog: BusLog = {
        time: timeStr,
        source: "1.1.1",
        destination: "N/A",
        type: "Error",
        value: "N/A",
        status: "error",
        details: "Transmission failed: No Sending (S) Group Address assigned to Sensor 1."
      };
      setBusLogs(prev => [errorLog, ...prev]);
      return;
    }

    // 2. We have a sending GA
    const targetGA = sFlagGa;
    const gaKey = targetGA === "1/1/1" ? "ga1" : "ga2";

    const a = receiveSwitchWrite(lampA, sendValue, matrix.actuator1[gaKey], receiverFlags[0].communication, receiverFlags[0].write);
    const b = receiveSwitchWrite(lampB, sendValue, matrix.actuator2[gaKey], receiverFlags[1].communication, receiverFlags[1].write);
    setLampA(a.state);
    setLampB(b.state);

    // Create log row
    const successLog: BusLog = {
      time: timeStr,
      source: "1.1.1",
      destination: targetGA,
      type: "GroupValueWrite",
      value: sendValue ? "$01 (ON)" : "$00 (OFF)",
      status: "success",
      details: `Sent to GA ${targetGA}. Lamp A: ${a.reason} Lamp B: ${b.reason}`
    };

    setBusLogs(prev => [successLog, ...prev]);
    onTransmit?.(targetGA,sendValue);


  };

  return (
    <div className="space-y-6">

      {/* Educational Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 @2xl:p-8 shadow-xs relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Database className="h-28 w-28 text-knx-blue" />
        </div>
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-knx-blue/10 text-knx-blue rounded-full text-xs font-bold tracking-wide">
            <Layers className="h-3.5 w-3.5" />
            <span>{tr("ETS GROUP OBJECTS & SENDING ADDRESS")}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight"> {tr("Sending address and group communication")} </h2>
          <p className="text-slate-600 text-sm leading-relaxed"> {tr("In KNX, a group object (for example, a switching object in a push-button sensor) can be associated with multiple Group Addresses (GAs). However, a standard multicast telegram only has room for")} <strong>{tr("exactly one Destination Address (2 bytes)")}</strong>.
          </p>

          <p className="text-sm text-slate-600">{tr("In ETS, S marks the sending group address. It is not a communication flag. The communication flags are C, R, W, T, U and I.")}</p>
          <details className="detail-box"><summary>{tr("Show details · one destination per telegram")}</summary><div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 font-mono text-xs text-slate-700 space-y-2">
            <div className="font-bold text-knx-blue border-b border-slate-200/80 pb-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>{tr("KNX TP Telegram Structure")}</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-[11px] pt-1">
              <span className="px-2 py-1 rounded font-semibold" style={{color:TELEGRAM_FIELDS.source.color,background:TELEGRAM_FIELDS.source.background}}>{tr("[Source PA]")}</span>
              <span className="text-slate-400 font-bold">→</span>
              <span className="px-2 py-1 rounded font-bold" style={{color:TELEGRAM_FIELDS.destination.color,background:TELEGRAM_FIELDS.destination.background}}>{tr("[Destination GA (2 Bytes)]")}</span>
              <span className="text-slate-400 font-bold">→</span>
              <span className="px-2 py-1 rounded font-semibold" style={{color:TELEGRAM_FIELDS.data.color,background:TELEGRAM_FIELDS.data.background}}>{tr("[Payload]")}</span>
            </div>
            <p className="text-slate-500 text-[10px] leading-relaxed pt-1 font-sans"> {tr("Because the destination field only holds one address, a sensor cannot natively transmit a single telegram to multiple Group Addresses at the same time. It will always transmit solely to its designated")} <strong>{tr("\"Sending\" (S) Group Address")}</strong>{tr(", which defaults to the first linked address in ETS and can be changed explicitly. Here, the first checked address is used until it is unlinked.")} </p>
          </div></details>
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 text-left">

        {/* Left column: Assignment Matrix */}
        <div className="@4xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{tr("ETS Group Address Matrix")}</h3>
              <p className="text-xs text-slate-500">{tr("Configure device links. Notice how the sending address behaves on Sensor 1.")}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{tr("Reset Matrix")}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 font-bold text-slate-600">{tr("Device (Physical Address)")}</th>
                  <th className="py-3 px-4 text-center bg-knx-blue/5 border-x border-slate-100">
                    <span className="text-knx-blue block font-extrabold">GA 1/1/1</span>
                    <span className="text-[9px] font-medium text-slate-500 lowercase">{tr("Light Sw. Main")}</span>
                  </th>
                  <th className="py-3 px-4 text-center bg-emerald-50/40">
                    <span className="text-emerald-700 block font-extrabold">GA 1/1/2</span>
                    <span className="text-[9px] font-medium text-slate-500 lowercase">{tr("Light Sw. Aux")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">

                {/* Row 1: Sensor 1 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{tr("Sensor 1 (Push Button)")}</span>
                      <span className="font-mono text-[10px] text-slate-500">{tr("PA: 1.1.1 (Sensor)")}</span>
                    </div>
                  </td>

                  {/* GA 1/1/1 */}
                  <td className="py-4 px-4 text-center bg-knx-blue/5 border-x border-slate-100">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <label className="relative flex items-center justify-center cursor-pointer p-2">
                        <input
                          type="checkbox"
                          aria-label="sensor1 1/1/1"
                          checked={matrix.sensor1.ga1}
                          onChange={() => handleCheckboxChange("sensor1", "1/1/1")}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-knx-blue focus:ring-knx-blue/30 cursor-pointer"
                        />
                      </label>
                      {matrix.sensor1.ga1 && sFlagGa === "1/1/1" && (
                        <span className="bg-knx-blue text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs animate-pulse"> {tr("[Sending] (S)")} </span>
                      )}
                    </div>
                  </td>

                  {/* GA 1/1/2 */}
                  <td className="py-4 px-4 text-center bg-emerald-50/40">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <label className="relative flex items-center justify-center cursor-pointer p-2">
                        <input
                          type="checkbox"
                          aria-label="sensor1 1/1/2"
                          checked={matrix.sensor1.ga2}
                          onChange={() => handleCheckboxChange("sensor1", "1/1/2")}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer"
                        />
                      </label>
                      {matrix.sensor1.ga2 && sFlagGa === "1/1/2" && (
                        <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs animate-pulse"> {tr("[Sending] (S)")} </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Row 2: Actuator 1 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{tr("Actuator 1 (Lamp A)")}</span>
                      <span className="font-mono text-[10px] text-slate-500">{tr("PA: 1.1.2 (Receiver)")}</span>
                    </div>
                  </td>

                  {/* GA 1/1/1 */}
                  <td className="py-4 px-4 text-center bg-knx-blue/5 border-x border-slate-100">
                    <label className="relative flex items-center justify-center cursor-pointer p-2">
                      <input
                        type="checkbox"
                        aria-label="actuator1 1/1/1"
                          checked={matrix.actuator1.ga1}
                        onChange={() => handleCheckboxChange("actuator1", "1/1/1")}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-knx-blue focus:ring-knx-blue/30 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* GA 1/1/2 */}
                  <td className="py-4 px-4 text-center bg-emerald-50/40">
                    <label className="relative flex items-center justify-center cursor-pointer p-2">
                      <input
                        type="checkbox"
                        aria-label="actuator1 1/1/2"
                          checked={matrix.actuator1.ga2}
                        onChange={() => handleCheckboxChange("actuator1", "1/1/2")}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer"
                      />
                    </label>
                  </td>
                </tr>

                {/* Row 3: Actuator 2 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{tr("Actuator 2 (Lamp B)")}</span>
                      <span className="font-mono text-[10px] text-slate-500">{tr("PA: 1.1.3 (Receiver)")}</span>
                    </div>
                  </td>

                  {/* GA 1/1/1 */}
                  <td className="py-4 px-4 text-center bg-knx-blue/5 border-x border-slate-100">
                    <label className="relative flex items-center justify-center cursor-pointer p-2">
                      <input
                        type="checkbox"
                        aria-label="actuator2 1/1/1"
                          checked={matrix.actuator2.ga1}
                        onChange={() => handleCheckboxChange("actuator2", "1/1/1")}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-knx-blue focus:ring-knx-blue/30 cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* GA 1/1/2 */}
                  <td className="py-4 px-4 text-center bg-emerald-50/40">
                    <label className="relative flex items-center justify-center cursor-pointer p-2">
                      <input
                        type="checkbox"
                        aria-label="actuator2 1/1/2"
                          checked={matrix.actuator2.ga2}
                        onChange={() => handleCheckboxChange("actuator2", "1/1/2")}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer"
                      />
                    </label>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <p>{tr("Simple DPT 1.001 switch objects: the sensor’s Communication (C) and Transmit (T) flags are assumed enabled. Each receiver updates only when the destination GA is linked and its C and W flags allow the write. Other telegrams and link edits leave the lamp state unchanged.")}</p>
            {receiverFlags.map((flags, index) => <div className="flex gap-4 items-center" key={index}>
              <strong>{tr("Lamp")} {index === 0 ? 'A' : 'B'}</strong>
              {(['communication', 'write'] as const).map(flag => <label key={flag} className="flex gap-2 items-center">
                <input type="checkbox" aria-label={tr(`Lamp ${index === 0 ? 'A' : 'B'} ${flag}`)} checked={flags[flag]} onChange={e => setReceiverFlags(prev => prev.map((f,i) => i === index ? {...f,[flag]:e.target.checked} : f))}/>
                {tr(flag === 'communication' ? 'Communication (C)' : 'Write (W)')}
              </label>)}
            </div>)}
          </div>
          {/* Real-time configuration summary info */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-slate-600">
            <HelpCircle className="h-5 w-5 text-knx-blue shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-800">{tr("One sending address per group object")}</p>
              <p> {tr("Notice how the")} <strong>{tr("(S) Sending Flag")}</strong> {tr("resides only on the first Group Address checked for Sensor 1. If you check both boxes, Sensor 1 links to both GAs in the matrix, but only one GA receives the (S) tag. This demonstrates why the actuator link logic depends on which Group Address the sensor actively outputs to.")} </p>
            </div>
          </div>
        </div>

        {/* Right column: Simulation, Lamp States & Bus Monitor */}
        <div className="@4xl:col-span-5 flex flex-col gap-6 text-left">

          {/* Active Device Simulation Workspace */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3"> {tr("Simulated receiver states")} </h3>

            {/* Lamp state circles */}
            <div className="grid grid-cols-2 gap-4 text-center">
              {/* Lamp A */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                lampA
                  ? "bg-amber-50 border-amber-300 shadow-md shadow-amber-200/20"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-center mb-2">
                  <Lightbulb className={`h-10 w-10 transition-colors ${
                    lampA ? "text-amber-500 fill-amber-300 animate-pulse" : "text-slate-300"
                  }`} />
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">{tr("Actuator 1 (Lamp A)")}</span>
                <span className="text-[10px] text-slate-400 font-mono">{tr("GA Link:")} {
                  [matrix.actuator1.ga1 && "1/1/1", matrix.actuator1.ga2 && "1/1/2"].filter(Boolean).join(", ") || "None"
                }</span>
                <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  lampA ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                }`}>
                  <span aria-label={tr("Lamp A state")}>{lampA ? tr("ON") : tr("OFF")}</span>
                </span>
              </div>

              {/* Lamp B */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                lampB
                  ? "bg-amber-50 border-amber-300 shadow-md shadow-amber-200/20"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-center mb-2">
                  <Lightbulb className={`h-10 w-10 transition-colors ${
                    lampB ? "text-amber-500 fill-amber-300 animate-pulse" : "text-slate-300"
                  }`} />
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">{tr("Actuator 2 (Lamp B)")}</span>
                <span className="text-[10px] text-slate-400 font-mono">{tr("GA Link:")} {
                  [matrix.actuator2.ga1 && "1/1/1", matrix.actuator2.ga2 && "1/1/2"].filter(Boolean).join(", ") || "None"
                }</span>
                <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  lampB ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                }`}>
                  <span aria-label={tr("Lamp B state")}>{lampB ? tr("ON") : tr("OFF")}</span>
                </span>
              </div>
            </div>

            {/* Interactive button trigger */}
            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700">{tr("Switch value")} <select aria-label={tr("Switch value")} value={sendValue ? '1' : '0'} onChange={e => setSendValue(e.target.value === '1')} className="border border-slate-200 rounded-lg p-2">
                  <option value="1">{tr("ON (1)")}</option><option value="0">{tr("OFF (0)")}</option>
                </select>
              </label>
              <button
                onClick={handlePressButton}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-knx-blue text-white rounded-2xl text-sm font-extrabold shadow-md hover:bg-knx-blue/95 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Send className="h-4.5 w-4.5" />
                <span>{tr("Press Push Button (Sensor 1)")}</span>
              </button>
            </div>
          </div>

          {/* Real-time Bus Monitor logs */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="h-4 w-4 text-knx-blue" />
              <span>{tr("Interactive KNX Bus Monitor")}</span>
            </h3>

            <div className="flex-grow overflow-y-auto mt-3 space-y-2 pr-1 font-mono">
              {busLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-1">
                  <span className="text-xs font-bold">{tr("No active bus traffic.")}</span>
                  <p className="text-[10px] font-sans">{tr("Press the sensor physical button to transmit a GroupValueWrite telegram.")}</p>
                </div>
              ) : (
                busLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-[10px] p-2.5 rounded-xl border leading-relaxed ${
                      log.status === "success"
                        ? "bg-emerald-50/50 border-emerald-100 text-slate-700"
                        : "bg-red-50 border-red-100 text-red-700 font-sans"
                    }`}
                  >
                    {log.status === "success" ? (
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-800 border-b border-dashed border-slate-200/60 pb-1 mb-1">
                          <span>{log.time}</span>
                          <span className="text-knx-blue font-extrabold">{tr(log.type)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                          <div><span className="text-slate-400">{tr("Source PA:")}</span> <span className="font-bold">{tr(log.source)}</span></div>
                          <div><span className="text-slate-400">{tr("Dest GA:")}</span> <span className="font-bold text-knx-blue">{log.destination}</span></div>
                          <div className="col-span-2"><span className="text-slate-400">{tr("Payload:")}</span> <span className="font-bold text-slate-800">{log.value}</span></div>
                        </div>
                        <p className="text-[9px] text-slate-500 font-sans mt-1 bg-white/70 px-1.5 py-0.5 rounded border border-slate-100">{tr(log.details)}</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-red-800 text-[11px]">{log.time} {tr("— Bus Error")}</span>
                          <p className="text-[10px] text-red-700 leading-normal">{tr(log.details)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
