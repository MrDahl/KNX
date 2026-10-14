# KNX TP Explorer

An educational simulation and reference for KNX TP1 telegrams, group objects, topology and datapoint types. Built by **Marc Sonne Dahl · KNX++ Tutor**.

**[Open the app](https://mrdahl.github.io/KNX/)**

The app runs in the browser without installation or a bus interface.

## Learning path

| Lesson | What students can do |
| --- | --- |
| **Telegram** | Generate standard plain TP1 GroupValueRead, GroupValueResponse and GroupValueWrite examples. Follow a field through coloured byte cards, physical bits, an explanation and an illustrative waveform. |
| **Capture analyser** | Open ETS monitor XML locally, inspect cEMI bytes, filter telegrams and test DPT interpretations per group address. Transfer supported frames to a clearly labelled TP1 reconstruction. |
| **Objects** | Configure group associations and the sending address; try ON/OFF writes with receiver communication/write flags. Unrelated or disabled receivers retain their previous state. Successful transmissions also update the telegram monitor. |
| **Hop Count** | Follow a defined path through the backbone/area/line/segment hierarchy and inspect each forwarding decision. |
| **Topology Capacity Explorer** | Explore address allocations and budget current and interface loading for one TP segment. |
| **DPT workbench** | Search 453 edition-specific catalogue entries, inspect provenance, and encode/decode 290 implemented subtypes. Transfer eligible group values to the telegram builder. |

**CAD symbols** adds a full-width “Example KNX CAD Symbols” reference with English descriptions, search and categories. Thirteen original SVG drawings by Marc Sonne Dahl illustrate generic device functions, with enlarged views; see [SVG delivery format](docs/cad-symbols.md).

Short explanations stay visible. **Show details** sections provide layouts, assumptions, calculations and source notes without separate Basic/Advanced/Tutor modes.

## Workspace and interaction

- **Wide workspace:** learning-path sidebar and full-width sections stacked vertically: the active explorer first, then the closable telegram monitor. The page scrolls naturally, with no competing pane scrollbars. Show telegram monitor restores a closed monitor without losing the telegram.
- **Narrow workspace:** bottom navigation and a monitor drawer/bottom sheet, with a sticky Generate action in the telegram lesson. Generate opens the monitor; close it with its button, Escape, the backdrop or a downward header gesture.
- **Readable signals:** bit streams and waveforms scroll horizontally inside their own regions instead of shrinking to fit.
- **Linked fields:** hover, tap or keyboard-focus a byte card to highlight the same field in the bit stream, explanation and waveform. Labels accompany colours.
- **Shared state:** the generated telegram survives lesson navigation. Hop Count and Topology Capacity Explorer do not modify that frame. The Objects sensor generates its own frame.

Layout uses Tailwind CSS v4 container queries. The monitor changes mode at a **1,000 px workspace width**, measured by `ResizeObserver` to match the CSS query; it is not selected by device name. Navigation becomes a sidebar at a **72 rem app-container width**. A narrow desktop window therefore behaves like a tablet workspace.

Field colours come from `src/knx/telegramFields.ts`: control orange, source blue, destination purple, routing/length cyan, TPCI/APCI/data green, and check byte rose.

## Model scope and important distinctions

This is an educational simulation and reference, **not ETS, a live bus monitor, a certification tool or a complete installation validator**.

- The frame builder supports standard plain group-value frames with at most **14 value octets**. Management services, extended frames, KNX Secure and arbitrary cEMI generation are outside its scope. DPT identifiers are not transmitted in ordinary group-value telegrams.
- Logical octets and serial framing are distinct. TP1 data bits are sent least-significant first; character parity is even over the eight data bits plus parity. The check byte is the inverted XOR of the preceding logical octets, not a CRC.
- Waveform voltages and equalization decay are illustrative. Nominal timing uses 9,600 bit/s. Selecting ACK/NAK/BUSY/silence is a demonstration setting, not a measured receiver response.
- The Advanced switching-course example counts **193 bit periods**, including the final two-bit character gap. The monitor's TP1 convention counts **191** for the comparable 50-bit next-access example. The app explains the difference and the documented priority/repetition rule; contention and retry-specific delays are not simulated.
- Routing results belong to the displayed path. Ordinary HC 0 can be received on the reached segment, but cannot be forwarded again. The series-repeater cascade is a deliberately invalid teaching example. Legacy repeaters and modern filtering segment couplers are distinct profiles.
- Available addresses, addressed couplers, unaddressed supplies, current and interface loading are separate quantities. The topology template's **61,695 address positions** are not a universal device ceiling. PSU ratings and actual device consumption must be checked per electrical segment, alongside cable and product constraints.

## ETS capture analysis

Open **Capture analyser** and select an ETS CommunicationLog XML export (`http://knx.org/xml/telegrams/01`). Processing is local, with a limit of 5 MB / 10,000 records. Connection metadata is ignored; captures and address interpretations remain in memory until cleared or the page reloads. No uploaded capture is bundled in the repository.

The analyser separates receive indications, transmit requests and local confirmations. Compatible fixed-size DPT families are candidates, not automatic identification. Compact payload length does not distinguish 1-, 2- and 4-bit values. Read requests have no value. Implemented decoders validate only their documented subset; reference-only and unresolved DPTs cannot be decoded or transferred. Teacher confirmation is a manual annotation, not evidence from the capture.

Supported standard group frames can be reconstructed in the visualiser with original addressing, operation, priority, Hop Count and round-tripped value bytes. cEMI is not a physical TP1 recording: the check byte, serial timing and waveform are generated, and ACK is not captured. Unsupported or malformed records remain inspectable as raw data.

## Reference material and review status

The teaching content was developed against the supplied **KNX Basic, Advanced and Tutor course documentation**, the TP1 document **v01.02.02** used for the timing model, and **KNX Interworking Datapoint Types v02.02.01 (2021)**. Relevant chapters and per-type printed page references appear in the app. These documents and current manufacturer instructions remain the authority for design and commissioning; the repository does not grant rights to redistribute course or standard PDFs.

The DPT catalogue is edition-specific, not a claim to cover every later KNX release. All 453 identities and overview formats were checked. The previously missing descriptions and size-corrected rows were researched, while **two entries still explicitly require source clarification** (243.600 coordinate order and 248.600 rated-duration unit). Other inherited descriptions are marked as such. Identity verification, description review and implemented codec coverage are deliberately separate.

The workbench implements **290 subtypes**. Parameter-only and LTE structures remain inspectable but are excluded from ordinary group-value transfer. See [codec coverage and source pages](docs/dpt-codec-coverage.md) for exact subtype coverage, restrictions and remaining work.

DPT 247.600 now supports a conservative complete-timestamp subset. DPT 248.600 supports raw-byte encoding while its rated-duration unit remains unresolved; no minutes/hours conversion is inferred. DPT 243.600 remains reference-only.

Report a technical discrepancy through [GitHub Issues](https://github.com/MrDahl/KNX/issues), ideally with the example settings, expected/actual result, and document edition and page. Please distinguish a reference correction from a request for another simulated service or DPT codec.

## Language support

The current interface is English. The [English/Danish localization plan](docs/localization.md) describes translation resources, terminology review, locale-aware input and protocol-independent rendering. Danish support is planned, not yet implemented.

## Development

Requires **Node.js 24 or later**.

```sh
npm ci
npm run dev
```

Vite serves the development app on port 3000. The app itself requires no API key or KNX connection.

```sh
npm run lint   # TypeScript checking
npm test       # KNX model and React interaction regressions
npm run build  # Production assets in dist/
npm run preview
```

Core implementation:

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Learning-path navigation and persistent workspace |
| `src/components/MonitorDock.tsx` | Desktop pane / accessible narrow-screen dialog |
| `src/components/TelegramVisualizer.tsx` | Typed inputs, standard frame generation and scenario handoff |
| `src/components/TelegramMonitor.tsx` | Linked byte/bit/detail views |
| `src/components/WaveformRenderer.tsx` | Illustrative TP1 signal and timing display |
| `src/knx/tp1Timing.ts` | Nominal timing and next-access model |
| `src/knx/teachingModels.ts` | Object reception, routing, address validation and segment budgets |
| `src/knx/telegramFields.ts` | Shared semantic field palette |

Tests cover known frame vectors, parity/check bytes, timing boundaries, DPT round trips and invalid inputs, state retention, routing/filter decisions, power budgets and workspace interactions. Passing tests validate these implemented cases; they do not establish general KNX conformity.

The GitHub Pages workflow runs `npm test` and `npm run lint` before building and deploying `dist/` after changes reach `main` (or `master`). Keep Vite's repository base path consistent with `/KNX/` when changing hosting.

---

<p align="center">
  <img src="assets/made_in_dk.svg" alt="Made in Denmark" width="160">
</p>
