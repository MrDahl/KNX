import React, { useState, useRef } from "react";
import { 
  Network, Search, Compass, ChevronDown, ChevronRight, Calculator, 
  Cpu, Power, CornerDownRight, CheckCircle, HelpCircle, AlertCircle, Info, Server 
} from "lucide-react";

export function TopologyExplorer() {
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
    const cleanInput = searchInput.trim();
    const parts = cleanInput.split(".");
    
    if (parts.length !== 3) {
      setSearchError("Invalid format! Please enter full Area.Line.Device format (e.g. 1.1.10).");
      return;
    }

    const a = parseInt(parts[0]);
    const l = parseInt(parts[1]);
    const d = parseInt(parts[2]);

    if (isNaN(a) || isNaN(l) || isNaN(d) || a > 15 || l > 15 || d > 255) {
      setSearchError("Address out of bound! Range: Area 0–15, Line 0–15, Device 0–255.");
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
        
        setSearchSuccess(`Successfully located address ${a}.${l}.${d} and scrolled to view.`);
        // Remove highlight pulse after 4s
        setTimeout(() => {
          setHighlightedAddress(null);
        }, 4000);
      } else {
        setSearchSuccess(`Found address ${a}.${l}.${d}! Expand matching folders below to inspect the highlighted hardware node.`);
      }
    }, 150);
  };

  // Helper renderers
  const renderPsuPair = (addr: string) => {
    return (
      <>
        <div className="device psu border border-rose-200 bg-rose-50 text-rose-700 px-2 py-1 rounded text-center text-[10px] italic font-bold select-none shadow-xs" title="Power Supply Unit (PSU) - Provides bus voltage power and has an integrated choke">
          {addr}.- (PSU)
        </div>
        <div className="device psu border border-rose-200 bg-rose-50 text-rose-700 px-2 py-1 rounded text-center text-[10px] italic font-bold select-none shadow-xs" title="Power Supply Unit (PSU) - Secondary redundancy source">
          {addr}.- (PSU)
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8 font-sans text-slate-705 bg-transparent">
      {/* Search Header Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-knx-blue/5 blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Network className="h-5 w-5 text-knx-blue" />
                KNX Hierarchical Tree Topology Capacity Explorer
              </h3>
              <p className="text-slate-500 text-xs font-semibold">
                Calculate maximum network threshold configurations of the Twisted Pair installation base.
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:w-72">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Locate e.g. 1.1.10, 5.0.0, 3.4.64"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-mono focus:border-knx-blue focus:outline-none focus:ring-1 focus:ring-knx-blue/20"
                />
              </div>
              <button 
                type="submit"
                className="bg-knx-blue hover:bg-knx-blue/90 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Locate Node
              </button>
            </form>
          </div>

          {searchError && (
            <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 flex gap-2 text-xs text-rose-800 animate-fade-in font-medium max-w-4xl">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{searchError}</span>
            </div>
          )}

          {searchSuccess && (
            <div className="bg-knx-blue/5 border border-knx-blue/10 rounded-xl p-3 flex gap-2 text-xs text-knx-blue animate-fade-in font-medium max-w-4xl">
              <CheckCircle className="h-4 w-4 shrink-0 text-knx-blue mt-0.5" />
              <span>{searchSuccess}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Devices", value: "59,687", desc: "Combined lines maximum bounds with PSUs", border: "border-l-knx-blue" },
          { title: "Backbone Line", value: "257 Nodes", desc: "255 devices + couplers & PSUs", border: "border-l-knx-green" },
          { title: "Logical Areas", value: "15 Sections", desc: "Areas x.0.0 (Address Area 1-15)", border: "border-l-knx-grey" },
          { title: "Logical Sub-Lines", value: "225 Lines", desc: "15 lines configured per Area logical boundary", border: "border-l-slate-400" },
        ].map((item, i) => (
          <div key={`stat-${i}`} className={`bg-white p-5 rounded-2xl border border-slate-200 border-l-4 ${item.border} shadow-sm hover:translate-y-[-2px] transition-all`}>
            <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider block mb-1">{item.title}</span>
            <span className="text-2xl font-bold font-mono text-slate-900 block">{item.value}</span>
            <span className="text-[11px] text-slate-500 leading-normal block mt-1 font-medium">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Capacity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "0.0.x Backbone line", dev: "255 Address Devices", psu: "2 non-prog PSUs", total: "257 total hostings" },
          { label: "x.0.0 Areas mainlines", dev: "15 Area backbone couplers", psu: "30 PSUs (2 per coupler)", total: "45 network interfaces" },
          { label: "x.y.0 Lines sublines", dev: "225 line couplers | 675 segment couplers", psu: "1,800 PSUs (8 per main line)", total: "2,025 physical gateways" },
          { label: "x.y.z End actuators/sensors", dev: "255 programmable devices/line", psu: "15 Areas × 15 Lines × 255 Dev", total: "57,375 operational items" },
        ].map((item, idx) => (
          <div key={`breakdown-${idx}`} className="bg-white border border-slate-200 p-5 rounded-xl space-y-3.5 font-sans shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-800">
              <Calculator className="h-4 w-4 text-knx-blue shrink-0" />
              <span className="font-extrabold text-xs uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between font-mono font-medium">
                <span>Devices:</span>
                <span className="text-slate-805 font-bold">{item.dev}</span>
              </div>
              <div className="flex justify-between font-mono font-medium">
                <span>Power Supplies:</span>
                <span className="text-slate-805 font-bold">{item.psu}</span>
              </div>
            </div>
            <div className="bg-knx-blue/5 p-2.5 rounded-lg text-center text-xs font-mono font-bold text-knx-blue border border-knx-blue/10">
              {item.total}
            </div>
          </div>
        ))}
      </div>

      {/* Sump Power draw check */}
      <div className="bg-knx-blue/5 border border-knx-blue/10 p-5 rounded-2xl text-center shadow-xs">
        <div className="flex items-center justify-center gap-2.5 text-knx-blue font-extrabold text-base">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          General Network Current Capacity: ~573.7 Amperes
        </div>
        <p className="text-slate-600 text-xs mt-1.5 font-sans leading-relaxed max-w-2xl mx-auto font-medium">
          Rule-of-thumb current budget calculation: 10 mA average draw allocated per physical end item node. 
          The overall physical TP layout requires balanced installation segment chokes.
        </p>
      </div>

      {/* Read Me guide */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
        <label className="text-xs font-bold text-knx-blue uppercase tracking-widest flex items-center gap-2">
          <Info className="h-4 w-4" />
          Technical Handbook: How to read network topologies
        </label>
        <div className="text-xs text-slate-600 leading-relaxed space-y-2 font-medium">
          <p>
            An address on the TP1 bus is formatted as <strong className="text-slate-900">Area.Line.Device</strong>.
            A backbone coupler always sits as <strong className="text-knx-blue font-bold">x.0.0</strong> to connect and map area lines together. 
            Line couplers occupy address <strong className="text-knx-blue font-bold">x.y.0</strong> on each subsegment.
          </p>
          <p>
            Lines can expand via <strong>segment couplers</strong> configured at device addresses <strong className="text-rose-650 font-bold">64</strong>, <strong className="text-rose-650 font-bold">128</strong> and <strong className="text-rose-650 font-bold">192</strong> respectively. 
            All coupler bridges must sit between active PSU pairs. Non-programmable power supply units do not grab a logical address on the bus, and are represented in diagnostics and ETS using dash notation (<em className="text-rose-650 font-bold font-mono">x.y.–</em>).
          </p>
        </div>
      </div>

      {/* Interactive network directory explorer */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-knx-blue" />
          Hierarchical Bus Node Map Directory
        </h4>

        <div className="space-y-2 text-xs">
          
          {/* Backbone Folder */}
          <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => toggleFolder("backbone")}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none"
            >
              <div className="flex items-center gap-2 font-bold text-slate-800">
                {openFolders["backbone"] ? <ChevronDown className="h-4 w-4 text-knx-blue" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <Network className="h-4 w-4 text-knx-blue" />
                Backbone line (0.0.x)
              </div>
              <span className="font-mono text-slate-500 text-[11px] font-bold">255 programmable nodes + 2 power supplies</span>
            </button>

            {openFolders["backbone"] && (
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 font-mono" id="backbone-grid">
                  {/* PSUs */}
                  {renderPsuPair("0.0")}
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
                    <Server className="h-4 w-4 text-knx-blue animate-pulse-slow" />
                    Area {areaNum} mainline (coupler address: {areaNum}.0.0)
                  </div>
                  <span className="font-mono text-slate-500 text-[11px] font-bold">15 logical sublines available</span>
                </button>

                {isAreaOpen && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                    {/* Area Coupler Info Block */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 font-mono">
                      <div 
                        id={`dev-${areaNum}-0-0`}
                        className={`vcard px-1.5 py-1.5 text-center text-[10px] rounded border font-bold ${
                          highlightedAddress === `dev-${areaNum}-0-0`
                            ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse"
                            : "bg-knx-blue/5 border-knx-blue/10 text-knx-blue"
                        }`}
                        title="Area Backbone Coupler - Bridging Section Area to primary high-speed backbone"
                      >
                        {areaNum}.0.0 (BC)
                      </div>
                      {renderPsuPair(`${areaNum}.0`)}
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
                                <Network className="h-3.5 w-3.5 text-knx-blue" />
                                Sub-Line {areaNum}.{lineNum}
                              </div>
                              <span className="font-mono text-slate-500 text-[10px] font-bold">256 slots + segment couplers</span>
                            </button>

                            {isLineOpen && (
                              <div className="p-3 bg-slate-50 border-t border-slate-100">
                                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 font-mono">
                                  {/* Line Coupler .0 */}
                                  <div 
                                    id={`dev-${areaNum}-${lineNum}-0`}
                                    className={`px-1.5 py-1 text-center text-[10px] rounded border font-bold ${
                                      highlightedAddress === `dev-${areaNum}-${lineNum}-0`
                                        ? "bg-knx-blue border-knx-blue/90 text-white font-extrabold scale-105 shadow-md animate-pulse"
                                        : "bg-knx-blue/10 border-knx-blue/20 text-knx-blue"
                                    }`}
                                    title="Line Coupler - Maps data from mainline down onto this line"
                                  >
                                    {areaNum}.{lineNum}.0 (LC)
                                  </div>
                                  {renderPsuPair(`${areaNum}.${lineNum}`)}

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
                                            title="Segment Coupler - Physically extends line distance limitations. Consumes 1 logical address on line."
                                          >
                                            {areaNum}.{lineNum}.{deviceNum} (SC)
                                          </div>
                                          {renderPsuPair(`${areaNum}.${lineNum}`)}
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
