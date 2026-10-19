import {tr} from '../i18n';
import {useTranslation} from 'react-i18next';
import React, { useState, useRef } from "react";
import {parseIndividualAddress} from "../knx/teachingModels";
import {LinePowerBudget} from "./LinePowerBudget";
import { 
  Network, Search, Compass, ChevronDown, ChevronRight, Calculator, 
  Cpu, Power, CornerDownRight, CheckCircle, HelpCircle, AlertCircle, Info, Server 
} from "lucide-react";

export function TopologyExplorer() {
 useTranslation();
  const [searchInput, setSearchInput] = useState<string>("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    backbone: false
  });
  const [highlightedAddress, setHighlightedAddress] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const NUM_AREAS = 15;
  const NUM_LINES = 15;
  const NUM_DEVICES = 255;
  const SEG_ADDRS = [64, 128, 192];

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchSuccess(null);
    setHighlightedAddress(null);
    const address = parseIndividualAddress(searchInput);
    if (!address) {
      setSearchError("Enter exactly Area.Line.Device using nonnegative whole decimal numbers: Area 0–15, Line 0–15, Device 0–255. No extra characters or spaces.");
      return;
    }
    const [a,l,d] = address;
    if (a === 0 && (l !== 0 || d === 0)) {
      setSearchError("This conventional TP backbone example shows 0.0.1–0.0.255 and areas 1–15. 0.0.0 is reserved; lines 0.1–0.15 are outside this example.");
      return;
    }

    // Explicitly open parent paths automatically on find!
    const updated: Record<string, boolean> = { ...openFolders };
    
    if (a === 0 && l === 0) {
      // Backbone line
      updated["backbone"] = true;
    } else {
      // Area folder
      updated[`area-${a}`] = true;
      if (l > 0) {
        // Line folder
        updated[`line-${a}-${l}`] = true;
      }
    }

    setOpenFolders(updated);

    const targetId = `dev-${a}-${l}-${d}`;
    setHighlightedAddress(targetId);

    // Wait for the DOM updates to complete and scroll smoothly
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        
        setSearchSuccess(`Located address position ${a}.${l}.${d} and scrolled to view.`);
        // Remove highlight pulse after 4s
        setTimeout(() => {
          setHighlightedAddress(null);
        }, 4000);
      } else {
        setSearchError(`Address ${a}.${l}.${d} is not displayed in this example.`);
      }
    }, 150);
  };

  // Helper renderers
  const renderPsu = (segment: string) => <div className="border border-rose-200 bg-rose-50 text-rose-700 px-2 py-1 rounded text-center text-[10px] font-bold" title={tr("Illustrative unaddressed KNX power supply with choke. Not an individual-address position.")}>PSU · {tr(segment)} {tr("· no IA")}</div>;

  return (
    <div className="space-y-8 font-sans text-slate-705 bg-transparent">
      {/* Search Header Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-knx-blue/5 blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="space-y-4">
          <div className="flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Network className="h-5 w-5 text-knx-blue" /> {tr("KNX Hierarchical Tree Topology Capacity Explorer")} </h3>
              <p className="text-slate-500 text-xs font-semibold"> {tr("Explore a defined address-allocation example, then calculate a separate TP segment power budget.")} </p>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2 w-full @2xl:w-auto">
              <div className="relative flex-grow @2xl:w-72">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" aria-label={tr("Individual address search")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={tr("Locate e.g. 1.1.10, 5.0.0, 3.4.64")}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none focus:ring-1 focus:ring-knx-blue/20"
                />
              </div>
              <button 
                type="submit"
                className="bg-knx-blue hover:bg-knx-blue/90 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              > {tr("Locate Address")} </button>
            </form>
          </div>

          {searchError && (
            <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 flex gap-2 text-xs text-rose-800 animate-fade-in font-medium max-w-4xl">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{tr(searchError)}</span>
            </div>
          )}

          {searchSuccess && (
            <div className="bg-knx-blue/5 border border-knx-blue/10 rounded-xl p-3 flex gap-2 text-xs text-knx-blue animate-fade-in font-medium max-w-4xl">
              <CheckCircle className="h-4 w-4 shrink-0 text-knx-blue mt-0.5" />
              <span>{tr(searchSuccess)}</span>
            </div>
          )}
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-left">
        <h3 className="font-bold text-lg text-slate-900">{tr("Address capacity is not an installation device limit")}</h3>
        <p className="text-sm text-slate-600">{tr("This template has a TP backbone, 15 TP main lines and 225 secondary lines. Each secondary line illustrates three segment couplers and four separately powered segments. Ordinary device positions are available slots, not installed devices. The former 59,687 total mixed incompatible quantities and has been removed.")}</p>
        <div className="grid @lg:grid-cols-2 @4xl:grid-cols-4 gap-4">
          {[
            ['61,695', 'Individual-address positions', 'In this conventional topology template'],
            ['915', 'Allocated addressed devices', '15 BC + 225 LC + 675 SC; counted once each'],
            ['60,780', 'Unallocated positions', '61,695 − 915; not an electrical capacity'],
            ['916', 'Unaddressed supplies', 'One per illustrated electrical segment'],
          ].map(([value,title,detail]) => <div key={title} className="bg-slate-50 rounded-xl p-4 border border-slate-200"><strong className="block text-2xl text-knx-blue">{value}</strong><span className="block font-bold text-sm">{tr(title)}</span><span className="text-xs text-slate-600">{tr(detail)}</span></div>)}
        </div>
        <details className="detail-box"><summary>{tr("Show details · address allocation and electrical loading")}</summary><div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
          <thead><tr className="text-left border-b"><th className="py-2">{tr("Address allocation")}</th><th>{tr("Positions")}</th><th>{tr("Allocated couplers")}</th><th>{tr("Unallocated")}</th></tr></thead>
          <tbody>{[
            ['Backbone: 0.0.1–0.0.255', '255', '0', '255'],
            ['15 main lines: A.0.0–A.0.255', '15 × 256 = 3,840', '15 BC', '3,825'],
            ['225 lines: A.L.0–A.L.255', '225 × 256 = 57,600', '225 LC + 675 SC = 900', '56,700'],
          ].map(row => <tr key={row[0]} className="border-b border-slate-100">{row.map((cell,i) => <td key={i} className="py-3 pr-4">{tr(cell)}</td>)}</tr>)}</tbody>
        </table></div>
        <p className="text-sm text-slate-600">{tr("Positions: 255 + 15 × 256 + 225 × 256 = 61,695. Supplies: 1 backbone + 15 main lines + 225 × 4 line segments = 916. Unaddressed supplies add no individual addresses. A supply with its own KNX diagnostic interface does need an address and must be budgeted as a bus device.")}</p>
        <p className="text-sm text-slate-600">{tr("A coupler has one individual address but a bus interface on each connected segment. For example, the 15 backbone-coupler interfaces also load the backbone, and the 15 line-coupler interfaces load each main line. Thus not every available address slot can be populated simultaneously on one TP segment. Electrical loading, PSU current, cable constraints and product specifications must all be checked separately.")}</p>
        <p className="text-xs text-slate-500">{tr("The 16-bit address field contains 65,536 bit patterns; that is neither a count of installable devices nor this template’s capacity. Reserved positions and topology placement still apply. Sources: KNX Basic, “TP Topology”, sections 3–5 and 8; KNX Advanced, “Couplers”.")}</p>
      </details></section>
      <LinePowerBudget />

      {/* Read Me guide */}
      <details className="detail-box space-y-3"><summary>{tr("Show details · reading network addresses")}</summary>
        <label className="text-xs font-bold text-knx-blue uppercase tracking-widest flex items-center gap-2">
          <Info className="h-4 w-4" /> {tr("Technical Handbook: How to read network topologies")} </label>
        <div className="text-xs text-slate-600 leading-relaxed space-y-2 font-medium">
          <p> {tr("An address on the TP1 bus is formatted as")} <strong className="text-slate-900">{tr("Area.Line.Device")}</strong>{tr(". A backbone coupler always sits as")} <strong className="text-knx-blue font-bold">x.0.0</strong> {tr("to connect and map area lines together. Line couplers occupy address")} <strong className="text-knx-blue font-bold">x.y.0</strong> {tr("on each secondary line.")} </p>
          <p> {tr("Segment couplers occupy ordinary device addresses on their line. Here .64, .128 and .192 are example allocations, not mandatory boundaries: a device’s address does not identify its physical segment. These couplers are included within the 256 address positions, never added on top. Each electrical segment has its own KNX supply with choke; the PSU badges show infrastructure, not addresses. No paired or redundant supplies are assumed.")} </p>
        </div>
      </details>

      {/* Interactive network directory explorer */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-knx-blue" /> {tr("Individual-Address Directory — Example Allocations")} </h4>

        <div className="space-y-2 text-xs">
          
          {/* Backbone Folder */}
          <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => toggleFolder("backbone")}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none"
            >
              <div className="flex items-center gap-2 font-bold text-slate-800">
                {openFolders["backbone"] ? <ChevronDown className="h-4 w-4 text-knx-blue" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <Network className="h-4 w-4 text-knx-blue" /> {tr("Backbone line (0.0.x)")} </div>
              <span className="font-mono text-slate-500 text-[11px] font-bold">{tr("255 address positions; electrical limits separate")}</span>
            </button>

            {openFolders["backbone"] && (
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-3 @lg:grid-cols-6 @4xl:grid-cols-8 gap-2 font-mono" id="backbone-grid">
                  {/* PSUs */}
                  {renderPsu("backbone")}
                  {Array.from({ length: 255 }, (_, i) => i + 1).map((d) => {
                    const addrId = `dev-0-0-${d}`;
                    const isHighlighted = highlightedAddress === addrId;
                    return (
                      <div 
                        key={addrId} 
                        id={addrId}
                        className={`px-1.5 py-1.5 text-center rounded border transition-all text-[11px] font-bold ${
                          isHighlighted 
                            ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-knx-blue/30 hover:text-knx-blue"
                        }`}
                      >
                        0.0.{d}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Area Folders */}
          {Array.from({ length: NUM_AREAS }, (_, i) => i + 1).map((areaNum) => {
            const folderId = `area-${areaNum}`;
            const isAreaOpen = openFolders[folderId];
            return (
              <div key={folderId} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
                {/* Area Header */}
                <button
                  type="button"
                  onClick={() => toggleFolder(folderId)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    {isAreaOpen ? <ChevronDown className="h-4 w-4 text-knx-blue" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <Server className="h-4 w-4 text-knx-blue animate-pulse-slow" /> {tr("Area")} {areaNum} {tr("mainline (coupler address:")} {areaNum}.0.0)
                  </div>
                  <span className="font-mono text-slate-500 text-[11px] font-bold">{tr("15 logical sublines available")}</span>
                </button>

                {isAreaOpen && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                    {/* Area Coupler Info Block */}
                    <div className="grid grid-cols-3 @lg:grid-cols-6 @4xl:grid-cols-8 gap-2 font-mono">
                      <div 
                        id={`dev-${areaNum}-0-0`}
                        className={`vcard px-1.5 py-1.5 text-center text-[10px] rounded border font-bold ${
                          highlightedAddress === `dev-${areaNum}-0-0`
                            ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse"
                            : "bg-knx-blue/5 border-knx-blue/10 text-knx-blue"
                        }`}
                        title={tr("Area Backbone Coupler - Bridging Section Area to TP backbone")}
                      >
                        {areaNum}.0.0 (BC)
                      </div>
                      {renderPsu(`${areaNum}.0 main segment`)}
                      {Array.from({length:255}, (_,i) => i+1).map(d => <div key={d} id={`dev-${areaNum}-0-${d}`} className={`border rounded p-1 text-center text-[10px] ${highlightedAddress === `dev-${areaNum}-0-${d}` ? 'bg-knx-blue text-white' : 'bg-white text-slate-600 border-slate-200'}`}>{areaNum}.0.{d}</div>)}
                    </div>

                    {/* Nested Subline list */}
                    <div className="pl-4 space-y-2.5 border-l border-slate-200">
                      {Array.from({ length: NUM_LINES }, (_, i) => i + 1).map((lineNum) => {
                        const lineFolderId = `line-${areaNum}-${lineNum}`;
                        const isLineOpen = openFolders[lineFolderId];
                        return (
                          <div key={lineFolderId} className="border border-slate-200 bg-white rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleFolder(lineFolderId)}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none"
                            >
                              <div className="flex items-center gap-2 font-bold text-slate-700">
                                {isLineOpen ? <ChevronDown className="h-3.5 w-3.5 text-knx-blue" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                                <Network className="h-3.5 w-3.5 text-knx-blue" /> {tr("Sub-Line")} {areaNum}.{lineNum}
                              </div>
                              <span className="font-mono text-slate-500 text-[10px] font-bold">{tr("256 positions including LC and 3 example SCs")}</span>
                            </button>

                            {isLineOpen && (
                              <div className="p-3 bg-slate-50 border-t border-slate-100">
                                <div className="grid grid-cols-3 @lg:grid-cols-6 @4xl:grid-cols-8 gap-2 font-mono">
                                  {/* Line Coupler .0 */}
                                  <div 
                                    id={`dev-${areaNum}-${lineNum}-0`}
                                    className={`px-1.5 py-1 text-center text-[10px] rounded border font-bold ${
                                      highlightedAddress === `dev-${areaNum}-${lineNum}-0`
                                        ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse"
                                        : "bg-knx-blue/10 border-knx-blue/20 text-knx-blue"
                                    }`}
                                    title={tr("Line Coupler - Maps data from mainline down onto this line")}
                                  >
                                    {areaNum}.{lineNum}.0 (LC)
                                  </div>
                                  {renderPsu(`${areaNum}.${lineNum} main segment`)}

                                  {/* Devices list from .1 to .255, intercepting segment couplers at .64, .128, .192 */}
                                  {Array.from({ length: 255 }, (_, i) => i + 1).map((deviceNum) => {
                                    const devAddressStr = `dev-${areaNum}-${lineNum}-${deviceNum}`;
                                    const isSegCoupler = SEG_ADDRS.includes(deviceNum);
                                    const isHighlighted = highlightedAddress === devAddressStr;

                                    if (isSegCoupler) {
                                      return (
                                        <React.Fragment key={devAddressStr}>
                                          <div 
                                            id={devAddressStr}
                                            className={`px-1.5 py-1 text-center text-[10px] rounded border font-bold ${
                                              isHighlighted
                                                ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse"
                                                : "bg-knx-blue/5 border-knx-blue/10 text-knx-blue"
                                            }`}
                                            title={tr("Example segment-coupler allocation. Shares the line address space; supports filtering. Its interfaces load both connected segments.")}
                                          >
                                            {areaNum}.{lineNum}.{deviceNum} (SC)
                                          </div>
                                          {renderPsu(`${areaNum}.${lineNum} subsegment ${SEG_ADDRS.indexOf(deviceNum) + 1}`)}
                                        </React.Fragment>
                                      );
                                    }

                                    return (
                                      <div 
                                        key={devAddressStr} 
                                        id={devAddressStr}
                                        className={`px-1 text-center py-1 rounded border text-[11px] font-bold ${
                                          isHighlighted 
                                            ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse" 
                                            : "bg-white border-slate-200 text-slate-550 hover:border-knx-blue/30 hover:text-knx-blue"
                                        }`}
                                      >
                                        {areaNum}.{lineNum}.{deviceNum}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
