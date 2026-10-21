# KNX Explorer

<img src="assets/KNX_explorer_logo.svg" alt="KNX Explorer" width="170">

<p align="left">
  <img src="assets/marc_dahl_logo.svg" alt="Marc Sonne Dahl" width="200">
</p>

An educational simulation and reference for KNX TP1 telegrams, group objects, topology and datapoint types. Built by **Marc Sonne Dahl · KNX++ Tutor**.

**[Open the app](https://mrdahl.github.io/KNX/)**

The app runs in the browser without installation or a bus interface.

## Learning path

| Lesson | Available functions |
| --- | --- |
| **Telegram** | Generate standard plain TP1 GroupValueRead, GroupValueResponse and GroupValueWrite examples. Follow a field through coloured byte cards, physical bits, an explanation and an illustrative waveform. |
| **Capture analyser** | Open ETS monitor XML locally, inspect cEMI bytes, filter telegrams and test DPT interpretations per group address. Transfer supported frames to a clearly labelled TP1 reconstruction. |
| **Objects** | Configure group associations and the sending address; try ON/OFF writes with receiver communication/write flags. Unrelated or disabled receivers retain their previous state. Successful transmissions also update the telegram monitor. |
| **Hop Count** | Follow a defined path through the backbone/area/line/segment hierarchy and inspect each forwarding decision. |
| **Topology Capacity Explorer** | Explore address allocations and budget current and interface loading for one TP segment. |
| **DPT workbench** | Search 454 edition-specific catalogue entries, inspect provenance, and encode/decode 371 implemented subtypes. Click bytes, bits or field names for inline inspection; transfer eligible group values to the telegram builder. |

**CAD symbols** adds a full-width “Example KNX CAD Symbols” reference with English and Danish descriptions, search and categories. Thirteen original SVG drawings by Marc Sonne Dahl illustrate generic device functions, with enlarged views; see [SVG delivery format](docs/cad-symbols.md).

Short explanations stay visible. **Show details** sections provide layouts, assumptions, calculations and source notes without separate Basic/Advanced/Tutor modes.

## Workspace and interaction

- **Wide workspace:** learning-path sidebar and full-width sections stacked vertically: the active explorer first, then the closable telegram monitor. The page scrolls naturally, with no competing pane scrollbars. Show telegram monitor restores a closed monitor without losing the telegram.
- **Narrow workspace:** bottom navigation and a monitor drawer/bottom sheet, with a sticky Generate action in the telegram lesson. Generate opens the monitor; close it with its button, Escape, the backdrop or a downward header gesture.
- **Readable signals:** bit streams and waveforms scroll horizontally inside their own regions instead of shrinking to fit.
- **Linked fields:** hover, tap or keyboard-focus a byte card to highlight the same field in the bit stream, explanation and waveform. Labels accompany colours.
- **Inline DPT inspection:** select a byte, bit or field name in the existing workbench. Matching fields are highlighted across octet boundaries. Explanations distinguish raw values, padding and Z8 status/command meanings without modifying the value or opening another page.
- **Page loading:** refresh starts at the top of the Telegram page. The desktop monitor opens without taking keyboard focus; the narrow-screen drawer keeps native modal focus behaviour.
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

The analyser separates receive indications, transmit requests and local confirmations. Compatible fixed-size DPT families are candidates, not automatic identification. Compact payload length does not distinguish 1-, 2- and 4-bit values. Read requests have no value. Implemented decoders validate only their documented subset; reference-only and unresolved DPTs cannot be decoded or transferred. Manual confirmation is a manual annotation, not evidence from the capture.

Supported standard group frames can be reconstructed in the visualiser with original addressing, operation, priority, Hop Count and round-tripped value bytes. cEMI is not a physical TP1 recording: the check byte, serial timing and waveform are generated, and ACK is not captured. Unsupported or malformed records remain inspectable as raw data.

## Reference material and review status

The teaching content was developed against the supplied **KNX Basic, Advanced and Tutor course documentation**, the TP1 document **v01.02.02** used for the timing model, and **KNX Interworking Datapoint Types v02.02.01 (2021)**. Relevant chapters and per-type printed page references appear in the app. These documents and current manufacturer instructions remain the authority for design and commissioning; the repository does not grant rights to redistribute course or standard PDFs.

The DPT catalogue is edition-specific, not a claim to cover every later KNX release. All 454 identities and overview formats were checked. The previously missing descriptions and size-corrected rows were researched. **The KNX-level scaling of DPT 248.600’s rated duration remains unconfirmed**, as stated in its source note; its byte layout is implemented. Other inherited descriptions are marked as such. Identity verification, description review and implemented codec coverage are deliberately separate.

The workbench implements **371 subtypes** (83 entries remain reference-only). Parameter-only and LTE structures remain inspectable but are excluded from ordinary group-value transfer. See [codec coverage and source pages](docs/dpt-codec-coverage.md) for exact subtype coverage, restrictions and remaining work.

DPT 247.600 now supports a conservative complete-timestamp subset. DPT 248.600 supports raw-byte encoding while its KNX rated-duration scaling remains unconfirmed; a separate conditional DALI display uses raw × 2 min (255 = 510 min or longer). DPT 243.600 uses the x → y order confirmed by KNX Association support; an application note is pending. DPT 245.600 (converter test result; last duration-test result in minutes, 0–510) and DPT 246.600 (battery status and charge level) follow clauses 6.12 and 6.13 of v02.02.01.

Report a technical discrepancy through [GitHub Issues](https://github.com/MrDahl/KNX/issues), ideally with the example settings, expected/actual result, and document edition and page. Please distinguish a reference correction from a request for another simulated service or DPT codec.

## Language support

The interface supports **English and Danish**. The English / Dansk selector remembers the chosen language and preserves entered values and simulation state. Danish numeric inputs accept decimal commas; KNX addresses, DPT identifiers and telegram bytes keep their protocol format. See [localization documentation](docs/localization.md) for translation coverage, terminology and maintenance.

## Loading and codec coverage

The 14,000-line reference catalogue is loaded with the DPT workbench or capture analyser. Other lessons load on first visit; imported captures remain mounted after their first visit. Danish messages, lookup keys and interpolation templates load only when Danish is selected or restored from a saved preference. English uses source strings and a small semantic-message resource. The synchronous codec definitions remain available for the initial telegram editor.

371 of the 454 catalogue entries have codecs. Coverage includes 237.600, the 200–205 and 218 Z8 families, 217.001, 219.001, 225.001–003, 229.001, 238.001, 239.001, 240.800 and 241.800. Z8 editing requires explicit status/command interpretation and is excluded from ordinary group telegrams and capture candidates. Remaining aggregate/date-time types retain their existing reference-only coverage. Source discrepancies for 219.001, 237.600 and 240.800 are explained alongside their layouts.

Run `npm run test:loading` to verify that the production import graph keeps the catalogue, Danish resources and secondary pages out of the initial bundle. The JavaScript baseline after lazy loading is approximately 582 kB (138 kB gzip), down from approximately 1,627 kB (435 kB gzip). Logo image bytes are separate from these JavaScript measurements. Vite still flags the initial bundle above 500 kB; the synchronous codecs are retained for the complete telegram selector. These are build sizes, not measured load times.

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
npm run test:loading # Verify production lazy-loading boundaries
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
| `src/components/DptByteInspector.tsx` | Inline DPT byte, bit and field inspection |
| `src/knx/dptInspection.ts` | Field offsets and context-aware value explanations |
| `src/components/WaveformRenderer.tsx` | Illustrative TP1 signal and timing display |
| `src/knx/tp1Timing.ts` | Nominal timing and next-access model |
| `src/knx/teachingModels.ts` | Object reception, routing, address validation and segment budgets |
| `src/knx/telegramFields.ts` | Shared semantic field palette |

Tests cover known frame vectors, parity/check bytes, timing boundaries, DPT round trips and invalid inputs, state retention, routing/filter decisions, power budgets and workspace interactions. Passing tests validate these implemented cases; they do not establish general KNX conformity.

The GitHub Pages workflow runs `npm test` and `npm run lint` before building and deploying `dist/` after changes reach `main` (or `master`). Keep Vite's repository base path consistent with `/KNX/` when changing hosting.

---

<p align="center">
  <img src="assets/made_in_dk.svg" alt="Made in Denmark" width="250">
</p>

## Licence and attribution

Copyright © 2026 **Marc Sonne Dahl** for the independently authored app code, documentation and original CAD drawings.

| Material | Reuse terms |
| --- | --- |
| Original application code and documentation | **Noncommercial use, modification and redistribution with attribution**, under the [KNX Explorer Noncommercial Source Licence](LICENSE). Commercial use requires separate written permission from Marc Sonne Dahl. |
| Original drawings and CAD symbol SVGs in `public/symbols/` | **Commercial use is permitted**, under the [MIT License](public/symbols/LICENSE). Keep its copyright and licence notice when redistributing copies or substantial portions. |
| Application and personal branding in `assets/*.svg` | Excluded from the reuse grants; no brand or trademark permissions are granted. |
| Dependencies and other third-party material | Their respective owners’ licences and notices continue to apply. |

The code is **source-available for noncommercial reuse**, not OSI-defined open-source: an open-source licence must permit commercial use. See the [Open Source Initiative definition](https://opensource.org/osd). Earlier versions distributed under MIT retain those permissions; this change does not revoke them. The previous notice is preserved in [LICENSES/legacy-MIT.txt](LICENSES/legacy-MIT.txt).

**KNX and ETS are registered trademarks of KNX Association.** Copyright and other rights in KNX Association’s standards, specifications, documentation, course materials, logos and other protected materials remain with KNX Association. This repository grants no rights to redistribute those materials or reuse its trademarks. Other third-party rights remain with their respective owners. The app’s independently authored code and Marc Sonne Dahl’s drawings are licensed separately as above.

KNX Explorer is an independent educational application. It is **not affiliated with, endorsed by or certified by KNX Association**. The same summary is available under “Licence and attribution” in the app footer. See KNX Association’s [publication/logo guidance](https://support.knx.org/hc/en-us/articles/4741645555730-Use-of-KNX-logo-on-publications) for its own branding rules; no permission from the Association is implied here.
