# KNX TP Explorer — Educational Bus Analysis Tool v4.0

An interactive, responsive, and highly polished education-first web application designed for students, trainers, and engineers to explore the intricacies of the **KNX Twisted Pair (TP1)** physical layer, telegram framing, network topology limits, and standard Datapoint Types.

Based on the official instructional material and Tutor course syllabi provided by the **KNX Association**, this suite provides fully visualized simulation modules.

🚀 Try it for yourself at: **https://mrdahl.github.io/KNX/**

---

## 🚀 Interactive Modules

1. **Telegram Visualiser**
   - Interact with individual fields of a standard KNX bus frame (Control Field, Source Address, Destination Address, Routing Counter, Length, and APDU payload).
   - Automatically compile binary bit-level frames and hex conversions live.
   - Generate exact physical waveforms demonstrating active/blank state pulses (superimposed AC on DC bus) and parity validations.

2. **Topology Capacity Explorer**
   - Visualize classic hierarchical KNX systems (Areas, Lines, Segment couplers).
   - Simulate bus load configurations up to maximum capacities.
   - Calculate theoretical filtering tables, segment drop tables, and total data overhead parameters dynamically.

3. **Datapoint Types Matrix**
   - Complete lookup table of standardized KNX Datapoint Types (from DPT 1.xxx up to complex DPT 20.xxx fields).
   - Formats, resolutions, typical physical values, and standard engineering units.

4. **Training Handbook**
   - Clean, beautifully organized reference text detailing key physical parameters: CSMA/CA bus arbitrations, collision management, voltage modulation spikes, and transmission rates.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/) (fast, modern front-end tooling)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (type-safe business logic)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern responsive spacing and utility structure)
- **Animations**: [Motion](https://motion.dev/) (fluid, hardware-accelerated user interaction transitions)
- **Icons**: [Lucide React](https://lucide.dev/) (consistent, crisp vector figures)

---

🚀 Try it for yourself at: **https://mrdahl.github.io/KNX/**

---

*Designed and maintained by Marc Sonne Dahl © 2026. Made for automation students and instructors of home and building control standards.*
