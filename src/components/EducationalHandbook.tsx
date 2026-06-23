import React, { useState } from "react";
import { BookOpen, Zap, Clock, Layers, HardDrive, Binary, CheckSquare } from "lucide-react";

export function EducationalHandbook() {
  const [activeSegment, setActiveSegment] = useState<string>("physical");

  const segments = [
    { id: "physical", label: "TP1 Physical Signalling", icon: Zap },
    { id: "timing", label: "Transmission & Timing Specs", icon: Clock },
    { id: "arbitration", label: "CSMA/CA Lane Arbitration", icon: Binary },
    { id: "crosscheck", label: "Checksum & Cross Checks", icon: Layers },
    { id: "topology_rules", label: "TP1 Power & Cable Specs", icon: BookOpen },
    { id: "cemivstp", label: "TP Bus vs cEMI Wrapper format", icon: HardDrive },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
      
      {/* Side Nav segments switcher */}
      <div className="lg:col-span-1 space-y-2">
        {segments.map((seg) => {
          const Icon = seg.icon;
          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => setActiveSegment(seg.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer shadow-xs ${
                activeSegment === seg.id 
                  ? "bg-indigo-600 text-white border-indigo-700" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{seg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        {activeSegment === "physical" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="h-5 w-5 text-indigo-600 animate-pulse" />
              KNX TP1 Baseband Signaling & Signals shape
            </h3>
            
            <p>
              KNX TP1 uses <strong>symmetrical baseband transmission</strong> inside a shielded twisted pair cable at a speed of <strong>9600 bit/s</strong>. 
              The nominal continuous power delivered by the power supply holds the cable pairs at approximately <strong>29V DC</strong>.
            </p>

            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-sm">Active Dominant vs Passive states</span>
              <ul className="list-disc pl-4 space-y-2 text-slate-600 font-medium font-sans">
                <li>
                  <strong className="text-slate-800">Logical '1' (Passive State):</strong> Represented physically by NO activity. The bus simply rests at its nominal static 29V DC power limit.
                </li>
                <li>
                  <strong className="text-slate-800">Logical '0' (Active Dominant State):</strong> Driven physically when a sending device closes its channel loop to discharge tension. This triggers a sudden <strong>5V to 10V drop</strong> across the line for approximately <strong>35 µs</strong> (t_active).
                </li>
              </ul>
            </div>

            <p>
              Because driving a logical '0' is active, any device transmitting a '0' will completely pull down a logical '1' sent simultaneously by other devices. 
              This is called <strong>active dominant state resolution</strong> and underpins the CSMA/CA protocol: if a device trying to transmit a passive '1' receives a dominant active '0' instead, it instantly knows it has lost the arbitration crawl and suspends transmission immediately to let the other package proceed smoothly.
            </p>

            <div className="p-4.5 rounded-xl bg-indigo-50 border border-indigo-100 flex gap-3 text-indigo-900 font-medium">
              <CheckSquare className="h-5 w-5 shrink-0 mt-0.5 text-indigo-600" />
              <div>
                <strong className="text-indigo-950 font-bold">The choke coil response</strong>
                <p className="mt-1 text-slate-600 font-sans text-[11px] leading-relaxed font-medium">
                  Inside every KNX power supply sits an inductor coil (choke). When an active pulldown ends (current stops growing), the choke reacts electro-magnetically by pushing voltage back up, generating a brief spike called an inductive overshoot peak of up to ~13V above average static voltage. This overshoot naturally decays back to the reference level.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSegment === "timing" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="h-5 w-5 text-indigo-600" />
              Transmission Time Requirements & Bus pauses
            </h3>

            <p>
              To structure frames logically, physical bits are packed together with transmission margins. At 9600 bps, each bit occupies exactly <strong>104 µs</strong>.
            </p>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-2 text-sm">Character Frame Structure (11 bits total)</span>
                <p className="text-slate-500 mb-2">
                  Each raw byte (octet) requires 3 supplementary physical signaling bits. Total transmission envelope = <strong>1.144 ms (11 bits)</strong>.
                </p>
                <div className="grid grid-cols-4 gap-2 font-mono text-center text-[10px] bg-white p-3 rounded-lg border border-slate-200">
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 py-2 rounded font-bold">
                    Start Bit '0' (1 bit)
                  </div>
                  <div className="bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded font-bold">
                    Data (8 payload bits)
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 py-2 rounded font-bold">
                    Even Parity (1 bit)
                  </div>
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded font-bold">
                    Stop Bit '1' (1 bit)
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-805 block mb-2 text-sm">System Bus Idle Pauses</span>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>
                    <strong className="text-slate-800">t4 Character Pause (2 bits):</strong> Separates characters within a telegram. This adds up with 11-bit characters to represent exactly 13 bits (1.352 ms) total character transmission limits on the wire.
                  </p>
                  <p>
                    <strong className="text-slate-800">t2 Inter-frame Pause (15 bits):</strong> Idle margin waiting time after a telegram ends, which represents <strong>1.560 ms</strong>. This allows receiving devices to perform parity and vertical byte integrity crosschecks, and drive the LL_ACK byte.
                  </p>
                  <p>
                    <strong className="text-slate-805">t1 Pre-arbitration Delay (Priority dependent):</strong> Margin wait time before beginning a transmission. This is 50 bit-periods (5.2 ms) for system/critical messages, and scales higher for normal/low prior frames to guarantee that system diagnostics obtain priority and win line arbitration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSegment === "arbitration" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium font-sans">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Binary className="h-5 w-5 text-indigo-600" />
              CSMA/CA Lane Arbitration & Priority Classes
            </h3>

            <p>
              KNX TP1 implements <strong>CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance)</strong> to govern media access. This ensures that no frames collide or get mangled when multiple devices attempt to transmit simultaneously.
            </p>

            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3 font-sans">
              <span className="font-bold text-slate-805 block text-sm">How Bit-Level Arbitration Works</span>
              <p>
                Before sending, a device listens to the bus. If the bus is idle for at least a specific period (priority-dependent pause <em>t1</em>), transmission starts.
              </p>
              <p>
                When multiple devices transmit simultaneously, they send out bits bit-by-bit. Remember, a logical '0' is active dominant (pulls bus low), while logical '1' is passive (rests at 29V).
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-605">
                <li>If Device A transmits '0' and Device B transmits '1', the wire drops to the low active level (dominant '0').</li>
                <li>Device B, which was trying to send a '1', reads back a '0' from the wire.</li>
                <li>Device B immediately detects this conflict, suspends further transmission, and falls back to receiver mode.</li>
                <li>Device A continues sending its telegram without a single bit of interruption or decay!</li>
              </ul>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
              <span className="font-bold text-indigo-950 block text-[12px]">Four Standard Priority Classes</span>
              <p className="text-slate-600 font-medium">
                Arbitration priorities are determined by the Control Field Byte 0 (specifically the Priority bits). This is enforced by adjusting the pre-arbitration pause times (t1) that transceivers wait before attempting to transmit:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[9.5px] text-center">
                <div className="bg-white border border-rose-100 text-rose-700 p-2 rounded shadow-2xs">
                  <span className="font-extrabold block text-rose-800">1. System (00)</span>
                  <span className="text-[9px] text-slate-550 block font-sans">t1 = 50 bits (5.2 ms)</span>
                </div>
                <div className="bg-white border border-amber-100 text-amber-700 p-2 rounded shadow-2xs">
                  <span className="font-extrabold block text-amber-800">2. Alarm (10)</span>
                  <span className="text-[9px] text-slate-550 block font-sans">t1 = 60 bits (6.24 ms)</span>
                </div>
                <div className="bg-white border border-indigo-100 text-indigo-700 p-2 rounded shadow-2xs">
                  <span className="font-extrabold block text-indigo-850">3. High (01)</span>
                  <span className="text-[9px] text-slate-550 block font-sans">t1 = 70 bits (7.28 ms)</span>
                </div>
                <div className="bg-white border border-slate-255 text-slate-600 p-2 rounded shadow-2xs">
                  <span className="font-extrabold block text-slate-700">4. Low (11)</span>
                  <span className="text-[9px] text-slate-550 block font-sans">t1 = 80 bits (8.32 ms)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-sans italic pt-1 leading-normal font-medium">
                Because high-priority frames wait a shorter duration (fewer wait bits) than lower-priority frames, they grasp the bus first, winning line arbitration easily before lower-priority frames can even start transmitting!
              </p>
            </div>
          </div>
        )}

        {activeSegment === "crosscheck" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="h-5 w-5 text-indigo-600" />
              Link Layer checksum (Horizontal & Vertical Cross checks)
            </h3>

            <p>
              KNX implements a 2-dimensional parity grid checking strategy (<strong>Cross Check</strong>) designed to expose transmission errors when multiple data lines fluctuate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 block text-indigo-650">Horizontal Check: Even Parity</span>
                <p className="text-slate-600 font-medium">
                  Every 11-bit serial character transmitted carries its own parity bit. If the count of logical '1' values inside the 8-bit data byte is odd, the parity bit is set to '1'. This ensures the combined total count of '1' bits over the character is always even.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 block text-indigo-650">Vertical Check: NOT-XOR Checkbyte</span>
                <p className="text-slate-600 font-medium">
                  At the end of every telegram is a vertical check byte (inverted XOR). All bits at index 0 across all logical bytes in the package are verified alongside the checksum bit at index 0 to enforce a vertical check on every column.
                </p>
              </div>
            </div>

            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
              <span className="text-slate-800 font-bold block mb-2 text-center text-[10px] uppercase font-sans">Visualizing Crosscheck Matrices</span>
              <div className="space-y-1 text-center text-[10.5px]">
                <div className="grid grid-cols-10 border-b border-slate-200 pb-1 text-indigo-600 font-extrabold">
                  <span>D7</span><span>D6</span><span>D5</span><span>D4</span><span>D3</span><span>D2</span><span>D1</span><span>D0</span><span></span><span>Parity</span>
                </div>
                <div className="grid grid-cols-10 text-slate-605 py-0.5 font-bold">
                  <span>1</span><span>0</span><span>1</span><span>1</span><span>1</span><span>1</span><span>0</span><span>0</span><span>+</span><span className="text-indigo-605 font-bold">1</span>
                </div>
                <div className="grid grid-cols-10 text-slate-605 py-0.5 font-bold">
                  <span>0</span><span>1</span><span>0</span><span>1</span><span>0</span><span>0</span><span>0</span><span>1</span><span>+</span><span className="text-indigo-605 font-bold">1</span>
                </div>
                <div className="grid grid-cols-10 text-slate-400 py-0.5">
                  <span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span></span><span>⋮</span>
                </div>
                <div className="grid grid-cols-10 border-t border-slate-200 pt-1 text-indigo-650 font-extrabold">
                  <span>S7</span><span>S6</span><span>S5</span><span>S4</span><span>S3</span><span>S2</span><span>S1</span><span>S0</span><span></span><span className="text-slate-400 font-medium font-sans">Check</span>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 font-semibold italic">
              * By combining horizontal even parity on each character and vertical odd parity across the whole message, receivers can perform immediate 1-bit error isolation and automatically request a diagnostic repeat from the sender.
            </p>
          </div>
        )}

        {activeSegment === "topology_rules" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium font-sans">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="h-5 w-5 text-indigo-600 animate-pulse" />
              TP1 Power & Bus Cable Infrastructure Specifications
            </h3>

            <p>
              The twisted-pair installation rules are mathematically designed to prevent voltage degradation and signal wave reflections. Following these rules guarantees standard, error-free operation of up to 9600 bps signals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-850 block text-indigo-900 text-[13px] border-b border-slate-100 pb-1">Cable & Voltage Requirements</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-650 leading-relaxed text-[11px] font-sans font-medium">
                  <li><strong>Standard Cable:</strong> YCYM 2x2x0.8 or J-Y(St)Y 2x2x0.8 shielded twisted pair with red/black cores (bus power/signals) and yellow/white cores (auxiliary power).</li>
                  <li><strong>Operating Voltage:</strong> Nominal continuous supply holds the cable pairs at <strong>29V DC</strong>.</li>
                  <li><strong>Lower Tolerance Limit:</strong> Devices must operate correctly down to <strong>21V DC</strong>, offering an 8V insulation margin for line impedance losses.</li>
                </ul>
              </div>

              <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-850 block text-indigo-900 text-[13px] border-b border-slate-100 pb-1">Critical Boundary Segment Limits</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-650 leading-relaxed text-[11px] font-sans font-medium">
                  <li><strong>Power Supply to Device:</strong> Max 350 meters. Prevents extreme static voltage drop.</li>
                  <li><strong>Device to Device:</strong> Max 700 meters. Restricts signal attenuation over the copper cores.</li>
                  <li><strong>Total Wire Length in Segment:</strong> Max 1000 meters. Keeps the cumulative capacitance under the system threshold (~120 nF/km).</li>
                  <li><strong>Choke Requirement:</strong> A power supply requires a choke coil to prevent the power supply capacitors from absorbing the high-frequency active signaling pulses.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 text-amber-950 border border-amber-100 rounded-xl flex gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="font-sans text-[11px] leading-relaxed">
                <strong className="text-amber-950 text-[12px]">Important Star/Tree Topology Rule:</strong>
                <p className="mt-1 text-slate-700 font-medium font-sans">
                  While KNX TP1 permits arbitrary bus architectures (line, tree, star, or mixed structures), <strong>closed loop wiring rings are strictly forbidden</strong>. Doing so causes infinite magnetic wave loops and conflicts signal reflections!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSegment === "cemivstp" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <HardDrive className="h-5 w-5 text-indigo-600 animate-pulse" />
              TP Bus frames vs cEMI (common External Message Interface)
            </h3>

            <p>
              When a KNX interface receives bytes from the TP1 bus and forwards them to a PC running ETS (or vice versa), it converts the raw bus-side telegram to the standardized <strong>cEMI structure</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-2 font-sans">
                <span className="font-bold text-indigo-950 block text-sm">TP1 Bus Frame Structure</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                  <li><strong className="text-slate-800">Control Field (Byte 0):</strong> Contains frame type, priority, repeat state.</li>
                  <li><strong className="text-slate-800">Addresses:</strong> 16-bit physical source + 16-bit destination (Group/Indiv).</li>
                  <li><strong className="text-slate-800">Routing Byte (Byte 5):</strong> High bits hold AT/HC. Low bits hold 4-bit length.</li>
                  <li><strong className="text-slate-800">Data (Byte 6+):</strong> Contains TPCI, APCI, and payload.</li>
                  <li><strong className="text-slate-800">Checksum (Last Byte):</strong> Vertical validation (Link Layer).</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-2 font-sans">
                <span className="font-bold text-indigo-950 block text-sm">cEMI Format wrapper Structure</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                  <li><strong className="text-slate-800">Message Code (MC):</strong> Identifies transaction direction (e.g. 0x29 = received from bus).</li>
                  <li><strong className="text-slate-800">Additional Info Length (AddIL):</strong> Always 0 for standard wire.</li>
                  <li><strong className="text-slate-800">Control Field 1:</strong> Matching raw Byte 0.</li>
                  <li><strong className="text-slate-800">Control Field 2:</strong> Isolates routing AT & HC.</li>
                  <li><strong className="text-slate-800">Data Pack (NPDU):</strong> Contains isolated payload length (L) byte, TPCI/APCI, and data block without checksum.</li>
                </ul>
              </div>
            </div>

            <p className="p-4 bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-xl leading-relaxed text-[11px] font-medium">
              <strong>Educational Key Takeaway:</strong> ETS Bus Monitor inspects cEMI wrappers generated by IP or USB transceivers. 
              The cEMI format adds <strong>MC + AddIL</strong> wrappers and separates the TP routing byte into Control Field 2 and Length fields, whilst stripping out the bus-side checksum byte.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
