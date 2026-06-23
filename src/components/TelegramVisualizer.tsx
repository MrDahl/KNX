import React, { useState, useEffect } from "react";
import { 
  Sliders, Play, RefreshCw, Layers, CheckCircle2, AlertTriangle, 
  HelpCircle, Clock, Database, Server, Info, CornerDownRight, Zap 
} from "lucide-react";
import { APCICode, TelegramParams, TelegramByte, KNXAddressIndividual, KNXAddressGroup } from "../types";
import { APCI_DEFS, DPT_DEFS, encodeKnxFloat, decodeKnxFloat, PRESET_TELEGRAMS } from "../data";
import { WaveformRenderer } from "./WaveformRenderer";

export function TelegramVisualizer() {
  const [params, setParams] = useState<TelegramParams>({
    repeatFlag: "1",
    targetType: "1",
    command: APCICode.GroupValueWrite,
    source: { area: 1, line: 1, device: 10 },
    destination: { main: 1, middle: 0, sub: 1 },
    routingCounter: 6,
    priority: "11",
    dptType: "1.001",
    ackType: "CC",
  });

  const [dptValue, setDptValue] = useState<string>("1"); // input variable for chosen DPT value
  const [currentPreset, setCurrentPreset] = useState<number>(-1);
  const [constructedBytes, setLogicalBytes] = useState<TelegramByte[]>([]);
  const [isExtended, setIsExtended] = useState<boolean>(false);
  const [customBitstreamInput, setCustomBitstreamInput] = useState<string>("");

  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [customPlaygroundBits, setCustomPlaygroundBits] = useState<string>("0101100110");

  // Auto-fill values when preset changes
  const applyPreset = (idx: number) => {
    setCurrentPreset(idx);
    const p = PRESET_TELEGRAMS[idx];
    setParams({
      ...p.params,
    });
    setDptValue(p.payloadValue);
  };

  // Pads a binary representation
  const padBinary = (val: number, len: number): string => {
    return val.toString(2).padStart(len, "0");
  };

  // Convert binary represent to Hex
  const binaryToHex = (b: string): string => {
    return parseInt(b, 2).toString(16).toUpperCase().padStart(2, "0");
  };

  // Calculates Even Parity bit
  const getEvenParity = (byteStr: string): string => {
    const ones = byteStr.split("1").length - 1;
    return ones % 2 === 0 ? "0" : "1";
  };

  // 11-bit Physical serial character construction
  const buildPhysicalBits = (logByte: string) => {
    const reversed = logByte.split("").reverse().join("");
    const parity = getEvenParity(logByte);
    return {
      start: "0",
      dataReversed: reversed,
      parity,
      stop: "1"
    };
  };

  // Link Layer Checksum: NOT(XOR of all bytes)
  const calculateChecksum = (bytes: string[]): string => {
    let xorVal = 0x00;
    bytes.forEach((b) => {
      xorVal ^= parseInt(b, 2);
    });
    const inverted = ~xorVal & 0xff;
    return padBinary(inverted, 8);
  };

  // Dynamic binary payload encoding based on selected DPT format
  const encodePayload = (dpt: string, val: string): string => {
    const d = DPT_DEFS.find((x) => x.id === dpt);
    const size = d ? d.sizeBits : 8;
    return val.padEnd(size, "0").slice(0, size);
  };

  // Refreshes and recompute entire raw TP1 bus telegram structure from selections
  const generateTelegram = () => {
    const srcArea = padBinary(params.source.area, 4);
    const srcLine = padBinary(params.source.line, 4);
    const srcDev = padBinary(params.source.device, 8);
    
    const srcH = srcArea + srcLine;
    const srcL = srcDev;

    let destH = "";
    let destL = "";

    if (params.targetType === "1") {
      // Group Address 3-level format: 5 bits Main, 3 bits Middle, 8 bits Sub-group
      const g = params.destination as KNXAddressGroup;
      const gMain = padBinary(g.main || 0, 5);
      const gMid = padBinary(g.middle || 0, 3);
      const gSub = padBinary(g.sub || 0, 8);
      destH = gMain + gMid;
      destL = gSub;
    } else {
      // Individual Address format (system unicasts): Area(4), Line(4), Device(8)
      const ia = params.destination as KNXAddressIndividual;
      const dArea = padBinary(ia.area || 0, 4);
      const dLine = padBinary(ia.line || 0, 4);
      const dDev = padBinary(ia.device || 0, 8);
      destH = dArea + dLine;
      destL = dDev;
    }

    const command = params.command;
    const payloadBinary = encodePayload(params.dptType, dptValue);
    const dptSize = payloadBinary.length;

    // APDU Packing Strategy (KNX specs)
    // For small payloads (<= 6 bits, i.e., DPT 1, 2, 3), the value is packed DIRECTLY into the second byte of the APDU.
    // APDU Byte 1 (Byte 6): TPCI (2 bits) + APCI 9:8 (2 bits)
    // APDU Byte 2 (Byte 7): APCI 7:6 (2 bits) + Payload (6 bits)
    // For larger payloads (> 6 bits), the raw payload bytes follow sequentially starts on APDU Byte 3 (Byte 8).
    let apduDataBytes: string[] = [];
    const val6 = dptSize <= 6 ? payloadBinary.padStart(6, "0") : payloadBinary.slice(0, 6);
    const valExtra = dptSize <= 6 ? "" : payloadBinary.slice(6);

    const apduFirstByte = "000000" + command.slice(0, 2); // TPCI (00) + APCI[9:8] (first 2 bits)
    const apduSecondByte = command.slice(2, 4) + val6;   // APCI[7:6] + small 6-bit data

    // Split remaining bits into 8-bit octets
    for (let i = 0; i < valExtra.length; i += 8) {
      const octet = valExtra.slice(i, i + 8).padEnd(8, "0");
      apduDataBytes.push(octet);
    }

    // Determine NPDU payload length index ('L' field). 
    // L counts the number of bytes following the routing control byte up to the checksum, which equals (2 + remaining payload bytes)
    const npduLengthValue = 1 + apduDataBytes.length; // (APDU Byte 2 and extra payload bytes)
    const extendedMode = npduLengthValue > 15;
    setIsExtended(extendedMode);

    // Byte 0: Control Field 1
    // Format: FT (Frame Type: 1 standard, 0 extended) | 0 | R (Repeat) | 1 | P1 | P0 | 0 | 0
    const ft = extendedMode ? "0" : "1";
    const ctrl1 = `${ft}0${params.repeatFlag}1${params.priority}00`;

    // Byte 5: Routing/Control Field 2
    // For standard frames: AT (Address Type: 1=group, 0=indiv) | HC (Hop count, 3 bits) | L (Payload length, 4 bits)
    // For extended frames (FT=0): L-nibble must be 0000, and a separate 8-bit 'Length octet' is inserted between routing and APDU
    let routingByte = "";
    let lengthByte: string | null = null;

    if (extendedMode) {
      routingByte = params.targetType + padBinary(params.routingCounter, 3) + "0000";
      lengthByte = padBinary(npduLengthValue, 8);
    } else {
      routingByte = params.targetType + padBinary(params.routingCounter, 3) + padBinary(npduLengthValue, 4);
    }

    // Assemble the complete logical byte list
    const logBytes: string[] = [ctrl1, srcH, srcL, destH, destL, routingByte];
    if (extendedMode && lengthByte) {
      logBytes.push(lengthByte);
    }
    logBytes.push(apduFirstByte, apduSecondByte, ...apduDataBytes);

    // Append the Link Layer parity NOT-XOR checkbyte 
    const checkbyteValue = calculateChecksum(logBytes);
    logBytes.push(checkbyteValue);

    // Build readable description data arrays for educational UI cards
    const byteLabels: string[] = [
      "Control Field 1", "Source Addr High", "Source Addr Low", 
      "Dest Addr High", "Dest Addr Low", 
      extendedMode ? "Control Field 2 (Routing)" : "Routing Byte (AT|HC|L)"
    ];
    if (extendedMode) byteLabels.push("Extended Length Byte");
    byteLabels.push("APDU Byte 1 (TPCI/APCI)", "APDU Byte 2 (APCI/Data)");
    
    for (let i = 0; i < apduDataBytes.length; i++) {
      byteLabels.push(`APDU Payload Byte ${i + 1}`);
    }
    byteLabels.push("NOT-XOR Checksum");

    const byteDetails: string[] = [
      `FrameType: ${extendedMode ? "0 (Extended)" : "1 (Standard)"} | Repeat: ${params.repeatFlag === "1" ? "No" : "Yes"} | Priority: ${params.priority}`,
      `Area: ${params.source.area} | Line: ${params.source.line}`,
      `Device Address: ${params.source.device}`,
      params.targetType === "1" 
        ? `Group Address Main: ${(params.destination as KNXAddressGroup).main}`
        : `Unicast Area: ${(params.destination as KNXAddressIndividual).area}`,
      params.targetType === "1"
        ? `Middle: ${(params.destination as KNXAddressGroup).middle} | Sub: ${(params.destination as KNXAddressGroup).sub}`
        : `Line: ${(params.destination as KNXAddressIndividual).line} | Device: ${(params.destination as KNXAddressIndividual).device}`,
      extendedMode 
        ? `AddrType=${params.targetType} | HopCount=${params.routingCounter} | L-field in Standard format set to 0`
        : `Target: ${params.targetType === "1" ? "Group" : "Indiv"} | HopCount (TTL): ${params.routingCounter} | APDU Len: ${npduLengthValue} bytes`
    ];

    if (extendedMode) {
      byteDetails.push(`Declares total APDU bytes explicitly: ${npduLengthValue} (Exceeds 15 byte standard standard buffer size)`);
    }

    byteDetails.push(`Flags: TPCI = 00 (Unnumbered Data), APCI high bits = ${command.slice(0, 2)}`);
    byteDetails.push(`Payload: APCI low bits = ${command.slice(2, 4)} | Value = ${val6}`);

    for (let i = 0; i < apduDataBytes.length; i++) {
      byteDetails.push(`DPT Value Byte portion represent index offsets ${6 + i * 8} to ${14 + i * 8}`);
    }
    byteDetails.push("Inverted XOR parity computed vertically across all columns of preceding logical bytes.");

    // Map to final model
    const resultingByteObjects: TelegramByte[] = logBytes.map((binStr, idx) => {
      const phys = buildPhysicalBits(binStr);
      return {
        index: idx,
        name: byteLabels[idx] || `Byte ${idx}`,
        logicalBinary: binStr,
        hex: binaryToHex(binStr),
        physicalBits: phys,
        details: byteDetails[idx] || ""
      };
    });

    setLogicalBytes(resultingByteObjects);

    // Compute full physical stream to pump waveforms
    // In KNX serial transmission, characters are separated by a 2-bit t4 inter-character pause ('11')
    let streamBits = "";
    resultingByteObjects.forEach((byte, i) => {
      const bits = "0" + byte.physicalBits.dataReversed + byte.physicalBits.parity + "1";
      streamBits += bits;
      // append t4 pause for all characters except the absolute final character
      if (i < resultingByteObjects.length - 1) {
        streamBits += "11";
      }
    });

    setCustomBitstreamInput(streamBits);
  };

  // Set isDirty to true when inputs change after generation, to warn the user
  useEffect(() => {
    if (isGenerated) {
      setIsDirty(true);
    }
  }, [params, dptValue]);

  const handleGenerateClick = () => {
    generateTelegram();
    setIsGenerated(true);
    setIsDirty(false);
  };

  // Handle changing input DPT formats
  const handleDptSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dptId = e.target.value;
    const def = DPT_DEFS.find((d) => d.id === dptId);
    setParams(prev => ({ ...prev, dptType: dptId }));
    if (def && def.exampleValues && def.exampleValues.length > 0) {
      setDptValue(def.exampleValues[0].binary);
    }
    setCurrentPreset(-1); // reset preset dropdown mapping
  };

  // Timing requirements calculations based on official KNX course guides:
  // Bit speed: 9600 bits/sec -> 104 µs per bit
  // T1 waiting pause: 50 bit-periods (5.2 ms)
  // T2 acknowledgment pause: 15 bit-periods (1.56 ms)
  // ACK byte transmission: 11 bits (1.144 ms)
  // T3 idle priority time: 50 bit-periods (5.2 ms)
  const totalCharactersCount = constructedBytes.length;
  const totalLogicalBitsCount = totalCharactersCount * 8;
  const totalSerialGapsCount = totalCharactersCount > 1 ? (totalCharactersCount - 1) * 2 : 0;
  const totalTransmitBitsCount = (totalCharactersCount * 11) + totalSerialGapsCount;
  
  const transmissionMs = totalTransmitBitsCount * 0.104;
  const t2PauseMs = 15 * 0.104; // 1.560 ms
  const ackMs = 11 * 0.104;     // 1.144 ms
  const t3PauseMs = 50 * 0.104; // 5.2 ms0 for CSMA priority line check
  const totalCycleMs = transmissionMs + t2PauseMs + ackMs + t3PauseMs;

  const acksNames = {
    CC: "LL_ACK (0xCC) - Positive Link Acknowledgment (No frame errors)",
    "0C": "LL_NAK (0x0C) - Negative Link Acknowledgment (Parity/checksum failure, sender repeats up to 3×)",
    C0: "LL_BUSY (0xC0) - Busy Link Acknowledgment (Actuator buffer saturated, sender repeats up to 3×)"
  };

  // Convert logical ACK hex to 11-bit physical bit streams
  const getAckPhysicalBitStream = (): string => {
    const logicalHex = params.ackType;
    const bin = padBinary(parseInt(logicalHex, 16), 8);
    const phys = buildPhysicalBits(bin);
    return "0" + phys.dataReversed + phys.parity + "1";
  };

  return (
    <div className="space-y-8 text-slate-700">
      
      {/* Dirty warning notice */}
      {isGenerated && isDirty && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed text-amber-800 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-amber-900">Parameters Modified:</strong> You have changed the configuration. The waveform and bytes below are displaying the stale state. Click the button to re-compile.
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
                  {t.name}
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
                <option value="1">Group / Multicast / Broadcast (DPT-bound)</option>
                <option value="0">Individual / Unicast (System configurations)</option>
              </select>
            </div>

            {/* APCI Command Command */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 sm:col-span-2">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1.5">
                APCI Application Command / TPCI Management
              </label>
              <select
                value={params.command}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, command: e.target.value as APCICode }));
                  setCurrentPreset(-1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
              >
                {APCI_DEFS.map((cmd) => (
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
                value={params.dptType}
                onChange={handleDptSelectChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
              >
                {DPT_DEFS.map((d) => (
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
              {params.dptType === "1.001" ? (
                <select
                  value={dptValue}
                  onChange={(e) => { setDptValue(e.target.value); setCurrentPreset(-1); }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:border-knx-blue focus:outline-none"
                >
                  <option value="1">Active High 'On' (1)</option>
                  <option value="0">Active Low 'Off' (0)</option>
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
                    step="0.5"
                    value={dptValue.length === 16 ? decodeKnxFloat(dptValue) : 23.5}
                    onChange={(e) => {
                      const tc = parseFloat(e.target.value) || 0;
                      setDptValue(encodeKnxFloat(tc));
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
                  onChange={(e) => { setDptValue(e.target.value.replace(/[^01]/g, "")); setCurrentPreset(-1); }}
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
                      <span className="text-slate-500 font-sans block leading-normal">{d.description}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Routing / Hop count slider */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
              <label className="text-[10px] font-bold text-knx-blue uppercase tracking-wider block mb-1">
                Routing Hop Counter (TTL: {params.routingCounter})
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
                Decremented by 1 at each router. Intercepted when 0.
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
                <option value="01">High (01) - Safety / High speed</option>
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
                  <span className="font-mono text-white font-bold">{totalCharactersCount} octets (+ CRC)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Total Serial Bits</span>
                  <span className="font-mono text-white font-bold">{totalTransmitBitsCount} bits</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Air Time (Telegram)</span>
                  <span className="font-mono text-emerald-300 font-bold">{transmissionMs.toFixed(3)} ms</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Inter-frame Gap Time (t2)</span>
                  <span className="font-mono text-white/80 font-bold">1.560 ms (15 bits)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Link-Layer ACK Time</span>
                  <span className="font-mono text-white/80 font-bold">1.144 ms (11 bits)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-white/10">
                  <span className="text-white/70">Priority Delay (t3)</span>
                  <span className="font-mono text-white/80 font-bold">5.200 ms (50 bits)</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/75 uppercase font-bold block mb-1">Estimated Combined Cycle Time</span>
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
              Real-time TP1 physical wave. Type logical bits below or press "Generate Telegram" above to compile a structured frame.
            </p>
          </div>
          <span className="text-[10px] uppercase font-extrabold text-knx-blue bg-knx-blue/10 px-2.5 py-1 rounded-full border border-knx-blue/20 self-start sm:self-auto shrink-0">
            Real-time Physical Simulator
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
                  setIsDirty(true);
                }}
                placeholder="Type raw bits here (e.g., 0101100110)..."
                className="flex-grow bg-white border border-slate-200 focus:border-knx-blue focus:ring-1 focus:ring-knx-blue/25 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:outline-none text-slate-800"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCustomBitstreamInput("");
                    setIsDirty(true);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
                >
                  Clear bits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomBitstreamInput("1010101010101010");
                    setIsDirty(true);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
                >
                  Alternating (1010...)
                </button>
                {isGenerated && (
                  <button
                    type="button"
                    onClick={() => {
                      generateTelegram();
                      setIsDirty(false);
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
          ackType={params.ackType}
        />
      </div>

      {/* Structured Octet breakdown displayed only after generating a telegram */}
      {isGenerated && (
        <div className="space-y-6">
          {/* Frame Warning & Explanations */}
          {isExtended && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-amber-800 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <strong className="text-amber-900">L_DATA_Extended Active warning (APCI Limit exceeded)</strong>
                <p className="mt-1 text-amber-700 font-sans">
                  Payload exceeds standard limits (15 APDU bytes). The system is utilizing the <strong>extended format (FT = 0)</strong>. 
                  The 4-bit 'L' field inside the standard routing control byte is set to zeroes, and a dedicated 8-bit octet 'Length Byte' has been dynamically inserted at the end of the header. 
                  This is fully validated in modern KNX systems but occupies the physical bus longer than standard frames.
                </p>
              </div>
            </div>
          )}

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
