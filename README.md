# 📘 KNX TP Explorer — Comprehensive Bus Analysis & Education Tool (v4.0 Pro)

An interactive, responsive, and highly polished education-first web application designed for students, automation engineers, and trainers. This tool offers an immersive suite of interactive simulators and reference modules to master **KNX Twisted Pair 1 (TP1)** physical layer signaling, telegram framing logic, network topology capacity limits, and standard Datapoint Types (DPT).

Designed in accordance with the official **KNX Association Advanced & Tutor certification course syllabi**, this suite bridges the gap between abstract protocol specifications and real-world electrical behaviors.

---

🚀 Try it for yourself at: **https://mrdahl.github.io/KNX/**

---


## 🌟 Interactive Modules & Features

The application is structured into four main workspace modules, accessible instantly from the sidebar:

### 1. ⚡ Interactive Telegram Visualizer & Waveform Simulator
Analyze and reconstruct standard **L_DATA** (Data Link Layer) KNX frames byte-by-byte and bit-by-bit.
- **Dynamic Header & Payload Configuration**:
  - **Priority Control**: Select between *System* (00), *Normal* (10), *Urgent* (01), and *Low* (11) frame priorities.
  - **Repeat Flag (R)**: Toggle whether the telegram is an original transmission or a repeated frame triggered by a transmission error.
  - **Logical Addresses**: Define exact source and destination addresses. Supports both 3-level Group Addresses (`Main/Middle/Sub`) and 2-level Individual Addresses (`Area.Line.Device`).
  - **APCI Commands**: Select standard Application Protocol Control Information commands such as `GroupValue_Read`, `GroupValue_Write`, `GroupValue_Response`, `IndividualAddr_Write`, and `Adpu_DeviceDescriptor`.
  - **DPT Payload Size & Value Builder**: Toggle between various Datapoint Sizes (e.g., DPT 1.001 1-bit binary boolean, DPT 5.001 8-bit scaling percent, and DPT 9.001 16-bit float) and input custom decimal values or float temperatures (e.g., °C) to see real-time bitstreams generated automatically.
- **Physical Bus Voltage Waveform Visualizer**:
  - Renders a real-time, interactive graph of the physical **TP1 Twisted Pair bus voltage modulation**.
  - Renders **logical '0'** as an active pulse: a sudden voltage drop to ~24V followed by a high inductive kickback/overshoot peak up to ~34V.
  - Renders **logical '1'** as a passive level: keeping the bus silent at a flat 29V DC level.
  - **Real-Time Input Sandbox**: Type or edit raw bit sequences (`0`s and `1`s) directly in the sandbox input to immediately view how the physical waveform transitions. It includes quick-presets (e.g., Alternating `10101010`).
- **Logical-to-Physical Octet Reconstruction Table**:
  - Highlights the structured hex and binary representations of the raw L_DATA telegram bytes:
    1. **Control Byte**: Prioritization, repeat status, and standard frame identifier.
    2. **Source Address (2 Bytes)**: Individual address of the transmitter.
    3. **Destination Address (2 Bytes)**: Group or individual target address.
    4. **Routing & Length Byte**: Holds the logical routing counter (hop limit) and the payload size bounds.
    5. **APCI & Data Payload (1 to 255 Bytes)**: The compiled application command and its variables.
    6. **Frame Check (XOR Checksum Byte)**: Even parity validation checksum byte.
    7. **Receiver Ack Byte (LL_ACK, LL_NAK, LL_BUSY)**: Interactive feedback simulation testing target state responses on the line.

### 2. 🖧 Topology Capacity & Bus Load Explorer
Explore the physical and logical boundaries of classical hierarchical KNX systems.
- **Visual Bus Node Map Directory**:
  - Explore the full structural bus hierarchy: the high-speed **Backbone Line (0.0.x)**, the primary **Area Mainlines (x.0.0)**, down into individual **Logical Sub-Lines (x.y.z)**.
  - Interact with nodes in the grid view. Locate nodes instantaneously via the search bar (e.g., searching `1.1.10`, `5.0.0`, or `3.4.64` highlights that physical device's slot with an active pulse animation).
- **Network Stats & Live Calculations**:
  - **Total Logical Nodes**: Simulates the bounds of a classic KNX network (up to 59,687 potential devices, incorporating 15 logical areas, 15 lines per area, and segment couplers).
  - **Power Draw & Current Capacity**: Displays current load estimations (~573.7 Amperes aggregated max current budget based on a standard 640mA power supply unit limit per line).
  - **Segment Extensions**: Explains segment line limits (64 physical load devices per segment) and the strategic use of segment couplers at addresses `64`, `128`, and `192` to extend segment lines up to 255 addressable nodes.

### 3. 📊 Datapoint Types (DPT) Reference Library & Matrix
A complete interactive lookup matrix of standardized KNX Datapoint Types.
- **Comprehensive Database**: Includes lookups spanning from basic 1-bit boolean controls (DPT 1.xxx) up to complex 16-bit or 32-bit floating-point coordinates and scaling values.
- **Category Filter Rails**: Quickly filter by size classifications (1-bit, 2-bit, 8-bit, 16-bit, and multi-byte structures).
- **Expandable Detail Cards**: Click any DPT row to view its exact binary layout, scientific formulas, typical ranges, default engineering units, and real-world application examples (e.g., HVAC temperature adjustments, solar wind speed gauges, scene controls, or dimming state transitions).

### 4. 📖 Educational Handbook
A master textbook reference guide written specifically to prepare students for Advanced & Tutor certification exams.
- **Physical Layer Specification**:
  - Explains the TP1 base transmission speed (**9,600 bits per second**).
  - Explains superimposed AC communication over 29V DC power.
  - Detail description of why logic `0` dominates the bus over logic `1` due to the physics of bus discharges (enabling elegant CSMA/CA collision prevention).
- **Bus Access & Arbitration (CSMA/CA)**:
  - Explains why collision-free access works natively over long distances without high central processing overhead.
  - Outlines the priority system (how priority bits resolve simultaneous bus-grabbing actions on the wire).
- **Error Detection & Framing Standards**:
  - Details parity bits (both horizontal even parity via the Block Check Character XOR byte, and vertical odd parity appended to each transmitted octet).

---

## 🧪 Simulated Physics & Physical Layer Mechanics

The physical simulation is mathematically accurate in its layout:
- **Twisted Pair Modulation**: Rather than simple digital square waves, the waveform generator simulates standard **KNX TP1 physical signaling**:
  $$\text{Logic } '0' \longrightarrow \text{Active pulse (voltage drop to } \approx 24\text{V, followed by a } \approx 34\text{V inductive kickback overshoot)}$$
  $$\text{Logic } '1' \longrightarrow \text{Passive state (flat } 29\text{V DC voltage)}$$
- **Transmission Speeds**: Transmission is exactly 104 microseconds ($\mu s$) per bit, matching the standard **9,600 bps** baud rate.
- **KNX Float Mathematics (DPT 9.xxx)**:
  The 16-bit float uses the signed 2's complement mantissa algorithm defined in the KNX specification:
  $$\text{Value} = 0.01 \times \text{Mantissa} \times 2^{\text{Exponent}}$$
  - **Mantissa**: 11-bit signed integer ($-2048$ to $+2047$).
  - **Exponent**: 4-bit unsigned integer ($0$ to $15$).
  - **Sign Bit**: 1-bit indicator.
  The simulator automatically encodes and decodes raw inputs on-the-fly to represent temperature inputs in standard °C precisely.

---

## 🛠️ Modern Tech Stack

This educational applet is built entirely on client-side React with high architectural fidelity:
- **Framework**: [React 19](https://react.dev/) inside a high-performance [Vite 6](https://vite.dev/) build environment.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for bulletproof type-safety on all logical address routers and byte converters.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for fluid, responsive layouts optimized for both ultrawide desktop monitors and portable tablet displays.
- **Animations**: [Motion](https://motion.dev/) (from `motion/react`) for smooth, hardware-accelerated drawer transitions and real-time highlighted search states.
- **Icons**: [Lucide React](https://lucide.dev/) for crisp, uniform vector imagery throughout the dashboard interface.

---

## Try it out

🚀 Try it for yourself at: **https://mrdahl.github.io/KNX/**

---

*Designed and maintained by **Marc Sonne Dahl - KNX++ Tutor © 2026. Made with ❤️ for KNX, automation & electrical students.*
