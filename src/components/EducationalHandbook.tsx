import React, { useState } from "react";
import { BookOpen, Zap, Clock, Layers, HardDrive, Binary, CheckSquare, Shield, Server, Network, FileText } from "lucide-react";

export function EducationalHandbook() {
  const [activeSegment, setActiveSegment] = useState<string>("physical");

  const segments = [
    { id: "physical", label: "TP1 Physical Signalling", icon: Zap },
    { id: "choke", label: "Power Supply Choke Coil", icon: Shield },
    { id: "addresses", label: "Individual vs Group Address", icon: Server },
    { id: "casting", label: "Unicast, Multicast & Broadcast", icon: Network },
    { id: "frames", label: "Short-Frame vs Long-Frame", icon: FileText },
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
                  ? "bg-knx-blue text-white border-knx-blue/90" 
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
              <Zap className="h-5 w-5 text-knx-blue animate-pulse" />
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

            <div className="p-4.5 rounded-xl bg-knx-blue/10 border border-knx-blue/20 flex gap-3 text-knx-blue font-medium">
              <CheckSquare className="h-5 w-5 shrink-0 mt-0.5 text-knx-blue" />
              <div>
                <strong className="text-knx-blue font-bold">The choke coil response</strong>
                <p className="mt-1 text-slate-600 font-sans text-[11px] leading-relaxed font-medium">
                  Inside every KNX power supply sits an inductor coil (choke). When an active pulldown ends (current stops growing), the choke reacts electro-magnetically by pushing voltage back up, generating a brief spike called an inductive overshoot peak of up to ~13V above average static voltage. This overshoot naturally decays back to the reference level.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSegment === "choke" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="h-5 w-5 text-knx-blue animate-pulse" />
              The Choke (Inductor Coil) — Functions & Purpose
            </h3>
            
            <p>
              In a KNX TP1 installation, the <strong>Choke (Inductor Coil)</strong> is one of the most critical physical layer components. It is connected in series with the output of the 29V DC KNX Power Supply unit.
            </p>

            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-sm">Why is a Choke needed?</span>
              <p>
                A standard DC power supply has a very large filter capacitor on its output. From an AC signaling perspective, a capacitor acts as an <strong>AC short-circuit</strong> (zero impedance). 
              </p>
              <p>
                If a KNX bus coupler tries to transmit data by drawing an active pulldown current to signal a logical '0', the massive capacitors in the power supply would instantly supply extra current to maintain the flat 29V. This would <strong>absorb/short-circuit the communication pulse entirely</strong>, making any communication physically impossible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-extrabold text-slate-900 block text-knx-blue">1. Signal Protection</span>
                <p className="text-[11px] leading-relaxed">
                  By presenting high AC impedance, the choke decouples the static DC power supply filter capacitors from the high-frequency 10 kHz communication pulses, allowing the signal waveform to form on the bus.
                </p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-extrabold text-slate-900 block text-knx-blue">2. DC Energy Path</span>
                <p className="text-[11px] leading-relaxed">
                  While blocking high-frequency data signals, the choke allows the static 29V DC operating energy to flow unhindered down the bus line to power all connected microcontrollers and transceivers.
                </p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-extrabold text-slate-900 block text-knx-blue">3. Active Voltage Reset</span>
                <p className="text-[11px] leading-relaxed">
                  When the active '0' pulldown pulse ends, the choke collapses its magnetic field (inductor kickback), generating a transient reverse voltage peak of up to ~34V. This crucial overshoot acts as a natural line equalizer to speed up stabilization.
                </p>
              </div>
            </div>

            <p className="p-4 bg-knx-blue/10 text-knx-blue border border-knx-blue/20 rounded-xl leading-relaxed text-[11px] font-medium">
              <strong>Advanced Certification Note:</strong> Power supplies usually come with an integrated choke, but separate external chokes are also available. Connecting a power supply without a choke to an active KNX line will cause an immediate bus collapse where devices power up but are completely unable to communicate.
            </p>
          </div>
        )}

        {activeSegment === "addresses" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium font-sans">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="h-5 w-5 text-knx-blue" />
              Addressing in KNX: Individual Address vs. Group Address
            </h3>

            <p>
              Every KNX packet contains both a <strong>Source Address</strong> and a <strong>Destination Address</strong>. Understanding the radical operational difference between these two address types is fundamental to designing and commissioning any KNX automation project.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-sm border-b border-slate-200 pb-1 text-knx-blue">Individual Address (Physical Address)</span>
                <div className="space-y-2 text-[11px]">
                  <p>
                    <strong className="text-slate-900">Format:</strong> <code>Area.Line.Device</code> (e.g., <code>1.1.25</code>)
                  </p>
                  <p>
                    <strong className="text-slate-900">Purpose:</strong> Uniquely identifies a single physical device in the entire installation. No two devices on the same KNX network can ever share the same Individual Address.
                  </p>
                  <p>
                    <strong className="text-slate-900">How it is set:</strong> Assigned by the system designer in ETS and downloaded onto the device while its physical programming button is active.
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">Primary Use Case:</strong> Point-to-point (unicast) system management: configuring devices, downloading application parameters, diagnostic line checks, and individual status readings.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-sm border-b border-slate-200 pb-1 text-knx-blue">Group Address (Logical Address)</span>
                <div className="space-y-2 text-[11px]">
                  <p>
                    <strong className="text-slate-900">Format:</strong> <code>Main/Middle/Sub</code> (e.g., <code>2/3/45</code>)
                  </p>
                  <p>
                    <strong className="text-slate-900">Purpose:</strong> Defines a logical control function or communication channel (e.g., "Kitchen ceiling light toggle" or "West facade heating setpoint").
                  </p>
                  <p>
                    <strong className="text-slate-900">How it is set:</strong> Created in ETS and linked to the virtual communication objects of sensors (senders) and actuators (receivers).
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">Primary Use Case:</strong> Runtime communication. Sensors send telegrams to a Group Address, and one or many listening actuators receive and execute the payload simultaneously.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 text-amber-950 border border-amber-100 rounded-xl leading-relaxed text-[11px] font-sans">
              <strong className="text-amber-900 text-xs font-bold">Crucial Rule for ETS Diagnostics:</strong>
              <p className="mt-1 text-slate-700 font-medium font-sans">
                During standard runtime communication (switching lights, adjusting blinds), <strong>Group Addresses are always used as the destination</strong>. A Group Address must never be used as a source address in a telegram. The source address must always be the specific Individual Address of the transmitting physical node!
              </p>
            </div>
          </div>
        )}

        {activeSegment === "casting" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium font-sans">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Network className="h-5 w-5 text-knx-blue" />
              Addressing Modes: Unicast, Multicast & Broadcast
            </h3>

            <p>
              KNX TP1 utilizes different delivery patterns depending on the task at hand. The <strong>Address Type (AT)</strong> bit inside the telegram routing octet flags whether the payload target represents a Group Address or an Individual Address.
            </p>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex gap-4">
                <div className="w-24 shrink-0 bg-knx-blue/10 text-knx-blue font-bold px-3 py-2 rounded-lg text-center h-fit border border-knx-blue/20">
                  Unicast
                </div>
                <div className="space-y-1.5 font-sans">
                  <span className="font-extrabold text-slate-900 text-sm block">Unicast (Point-to-Point)</span>
                  <p className="text-[11px] leading-relaxed">
                    Used to direct commands to a single physical device. The telegram's destination address contains a physical <strong>Individual Address</strong>, and the AT bit is set to <code>0</code>. Unicast is mostly used for diagnostic queries, physical programming, and downloading parameters via ETS.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex gap-4">
                <div className="w-24 shrink-0 bg-knx-blue/10 text-knx-blue font-bold px-3 py-2 rounded-lg text-center h-fit border border-knx-blue/20">
                  Multicast
                </div>
                <div className="space-y-1.5 font-sans">
                  <span className="font-extrabold text-slate-900 text-sm block">Multicast (Group Communication)</span>
                  <p className="text-[11px] leading-relaxed">
                    The absolute backbone of standard KNX runtime. A sensor (such as a keypad) sends a packet targeting a <strong>Group Address</strong> (with AT set to <code>1</code>). Every actuator on the line that is linked to this group address receives the packet and acts on it simultaneously. This allows efficient, multi-point control without sending multiple separate messages.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex gap-4">
                <div className="w-24 shrink-0 bg-knx-blue/10 text-knx-blue font-bold px-3 py-2 rounded-lg text-center h-fit border border-knx-blue/20">
                  Broadcast
                </div>
                <div className="space-y-1.5 font-sans">
                  <span className="font-extrabold text-slate-900 text-sm block">Broadcast (One-to-All)</span>
                  <p className="text-[11px] leading-relaxed">
                    Directs a message to absolutely every active node on the bus segment. In KNX, this is triggered when the target is set to the system group address <code>0/0/0</code> (or group routing with a physical address equal to zero). Broadcasts are reserved for critical system events, emergency building resets, and discovery commands during configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSegment === "frames" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium font-sans">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-5 w-5 text-knx-blue" />
              Framing Specifications: Short-Frame vs. Long-Frame (Extended)
            </h3>

            <p>
              KNX TP1 supports two distinct framing mechanisms to balance transmission efficiency and large-scale bulk parameters downloads.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-sm border-b border-slate-200 pb-1 text-knx-blue">Short-Frame (Standard L_DATA)</span>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Maximum Payload:</strong> Holds up to <strong>15 bytes</strong> of data. Most simple runtime commands (such as a 1-bit light toggle) pack the payload directly inside the 4-bit length parameter block to minimize overhead.
                  </p>
                  <p>
                    <strong className="text-slate-900">Efficiency:</strong> Extremely high. By keeping frames short, the transmission window on the wire is kept extremely small, minimizing bus load and reducing the chances of arbitration collisions.
                  </p>
                  <p>
                    <strong className="text-slate-900">Where it is used:</strong> Standard daily runtime commands (switching actuators, reading sensor values, raising or lowering blinds).
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-sm border-b border-slate-200 pb-1 text-knx-blue">Long-Frame (Extended L_DATA_Extended)</span>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Maximum Payload:</strong> Extends the frame bounds up to <strong>254 bytes</strong> of payload.
                  </p>
                  <p>
                    <strong className="text-slate-900">Mechanism:</strong> Relocates frame length bytes into secondary octets, freeing up constraints on the physical line transceiver boundaries.
                  </p>
                  <p>
                    <strong className="text-slate-900">Where it is used:</strong> Bulk configurations, complex device application uploads via ETS, firmware flashing, and exchanging large cryptographic keys (KNX Secure certificates).
                  </p>
                </div>
              </div>
            </div>

            <p className="p-4 bg-knx-blue/10 text-knx-blue border border-knx-blue/20 rounded-xl leading-relaxed text-[11px] font-medium font-sans">
              <strong>Tutor tip:</strong> Not all older KNX TP1 physical transceivers or line couplers support long-frame extended telegrams. If you try to download a huge application to an old actuator through a line coupler that lacks extended-frame buffer support, the download will fail. In those cases, ETS must fall back to standard short-frame segmented downloads.
            </p>
          </div>
        )}

        {activeSegment === "timing" && (
          <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-slate-600 font-medium">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="h-5 w-5 text-knx-blue" />
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
                  <div className="bg-knx-blue/10 border border-knx-blue/20 text-knx-blue py-2 rounded font-bold">
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
              <Binary className="h-5 w-5 text-knx-blue" />
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

            <div className="bg-knx-blue/10 p-4 rounded-xl border border-knx-blue/20 space-y-2">
              <span className="font-bold text-knx-blue block text-[12px]">Four Standard Priority Classes</span>
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
                <div className="bg-white border border-knx-blue/20 text-knx-blue p-2 rounded shadow-2xs">
                  <span className="font-extrabold block text-knx-blue">3. High (01)</span>
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
              <Layers className="h-5 w-5 text-knx-blue" />
              Link Layer checksum (Horizontal & Vertical Cross checks)
            </h3>

            <p>
              KNX implements a 2-dimensional parity grid checking strategy (<strong>Cross Check</strong>) designed to expose transmission errors when multiple data lines fluctuate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 block text-knx-blue">Horizontal Check: Even Parity</span>
                <p className="text-slate-600 font-medium">
                  Every 11-bit serial character transmitted carries its own parity bit. If the count of logical '1' values inside the 8-bit data byte is odd, the parity bit is set to '1'. This ensures the combined total count of '1' bits over the character is always even.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 block text-knx-blue">Vertical Check: NOT-XOR Checkbyte</span>
                <p className="text-slate-600 font-medium">
                  At the end of every telegram is a vertical check byte (inverted XOR). All bits at index 0 across all logical bytes in the package are verified alongside the checksum bit at index 0 to enforce a vertical check on every column.
                </p>
              </div>
            </div>

            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
              <span className="text-slate-800 font-bold block mb-2 text-center text-[10px] uppercase font-sans">Visualizing Crosscheck Matrices</span>
              <div className="space-y-1 text-center text-[10.5px]">
                <div className="grid grid-cols-10 border-b border-slate-200 pb-1 text-knx-blue font-extrabold">
                  <span>D7</span><span>D6</span><span>D5</span><span>D4</span><span>D3</span><span>D2</span><span>D1</span><span>D0</span><span></span><span>Parity</span>
                </div>
                <div className="grid grid-cols-10 text-slate-605 py-0.5 font-bold">
                  <span>1</span><span>0</span><span>1</span><span>1</span><span>1</span><span>1</span><span>0</span><span>0</span><span>+</span><span className="text-knx-blue font-bold">1</span>
                </div>
                <div className="grid grid-cols-10 text-slate-605 py-0.5 font-bold">
                  <span>0</span><span>1</span><span>0</span><span>1</span><span>0</span><span>0</span><span>0</span><span>1</span><span>+</span><span className="text-knx-blue font-bold">1</span>
                </div>
                <div className="grid grid-cols-10 text-slate-400 py-0.5">
                  <span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span>⋮</span><span></span><span>⋮</span>
                </div>
                <div className="grid grid-cols-10 border-t border-slate-200 pt-1 text-knx-blue font-extrabold">
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
              <BookOpen className="h-5 w-5 text-knx-blue animate-pulse" />
              TP1 Power & Bus Cable Infrastructure Specifications
            </h3>

            <p>
              The twisted-pair installation rules are mathematically designed to prevent voltage degradation and signal wave reflections. Following these rules guarantees standard, error-free operation of up to 9600 bps signals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-850 block text-knx-blue text-[13px] border-b border-slate-100 pb-1">Cable & Voltage Requirements</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-650 leading-relaxed text-[11px] font-sans font-medium">
                  <li><strong>Standard Cable:</strong> YCYM 2x2x0.8 or J-Y(St)Y 2x2x0.8 shielded twisted pair with red/black cores (bus power/signals) and yellow/white cores (auxiliary power).</li>
                  <li><strong>Operating Voltage:</strong> Nominal continuous supply holds the cable pairs at <strong>29V DC</strong>.</li>
                  <li><strong>Lower Tolerance Limit:</strong> Devices must operate correctly down to <strong>21V DC</strong>, offering an 8V insulation margin for line impedance losses.</li>
                </ul>
              </div>

              <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-850 block text-knx-blue text-[13px] border-b border-slate-100 pb-1">Critical Boundary Segment Limits</span>
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
              <HardDrive className="h-5 w-5 text-knx-blue animate-pulse" />
              TP Bus frames vs cEMI (common External Message Interface)
            </h3>

            <p>
              When a KNX interface receives bytes from the TP1 bus and forwards them to a PC running ETS (or vice versa), it converts the raw bus-side telegram to the standardized <strong>cEMI structure</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-2 font-sans">
                <span className="font-bold text-knx-blue block text-sm">TP1 Bus Frame Structure</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                  <li><strong className="text-slate-800">Control Field (Byte 0):</strong> Contains frame type, priority, repeat state.</li>
                  <li><strong className="text-slate-800">Addresses:</strong> 16-bit physical source + 16-bit destination (Group/Indiv).</li>
                  <li><strong className="text-slate-800">Routing Byte (Byte 5):</strong> High bits hold AT/HC. Low bits hold 4-bit length.</li>
                  <li><strong className="text-slate-800">Data (Byte 6+):</strong> Contains TPCI, APCI, and payload.</li>
                  <li><strong className="text-slate-800">Checksum (Last Byte):</strong> Vertical validation (Link Layer).</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-2 font-sans">
                <span className="font-bold text-knx-blue block text-sm">cEMI Format wrapper Structure</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                  <li><strong className="text-slate-800">Message Code (MC):</strong> Identifies transaction direction (e.g. 0x29 = received from bus).</li>
                  <li><strong className="text-slate-800">Additional Info Length (AddIL):</strong> Always 0 for standard wire.</li>
                  <li><strong className="text-slate-800">Control Field 1:</strong> Matching raw Byte 0.</li>
                  <li><strong className="text-slate-800">Control Field 2:</strong> Isolates routing AT & HC.</li>
                  <li><strong className="text-slate-800">Data Pack (NPDU):</strong> Contains isolated payload length (L) byte, TPCI/APCI, and data block without checksum.</li>
                </ul>
              </div>
            </div>

            <p className="p-4 bg-knx-blue/10 text-knx-blue border border-knx-blue/20 rounded-xl leading-relaxed text-[11px] font-medium">
              <strong>Educational Key Takeaway:</strong> ETS Bus Monitor inspects cEMI wrappers generated by IP or USB transceivers. 
              The cEMI format adds <strong>MC + AddIL</strong> wrappers and separates the TP routing byte into Control Field 2 and Length fields, whilst stripping out the bus-side checksum byte.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
