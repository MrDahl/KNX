import React, { useState, useMemo } from "react";
import { Search, Info } from "lucide-react";
import { DPT_DATABASE } from "./dptDatabase";

export function DatapointTypesList() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Categories config
  const categories = [
    { id: "all", label: "All Datapoint Types" },
    { id: "1-bit", label: "1-bit (Boolean)" },
    { id: "2-bit", label: "2-bit (Priority)" },
    { id: "8-bit", label: "8-bit / Scaling" },
    { id: "composite", label: "Composite / Bytes (Status/Alarm)" },
  ];

  const handleRowClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  // Filter items
  const filteredDpts = useMemo(() => {
    return DPT_DATABASE.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesQuery =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.range.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.detailedDesc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Search and info banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="h-5 w-5 text-sky-600 animate-pulse" />
              KNX Datapoint Types (DPT) Matrix & Reference Library
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
              Standardized formatting blueprints as defined in the official <strong>KNX Technical Specification (Volume 3/7/2)</strong>. Used for decoding raw data on Twisted Pair line group communication telegrams.
            </p>
          </div>
          <div className="relative max-w-sm w-full shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search DPT identifier, name, or format..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 selection:bg-sky-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category filtering tags */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedCategory === cat.id
                  ? "bg-sky-50 text-sky-700 border-sky-300 shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Official Handbook Spreadsheet Grid View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table representation mimicking official screenshots */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-medium font-sans">
            <thead>
              <tr className="bg-sky-50 text-sky-900 font-extrabold border-b border-sky-150 select-none">
                <th className="py-3 px-4 font-bold w-28 uppercase tracking-wide border-r border-sky-200/50">Identifier</th>
                <th className="py-3 px-4 font-bold w-56 uppercase tracking-wide border-r border-sky-200/50">Name</th>
                <th className="py-3 px-3 font-bold w-24 text-center uppercase tracking-wide border-r border-sky-200/50">Size</th>
                <th className="py-3 px-4 font-bold w-24 uppercase tracking-wide border-r border-sky-200/50">Data Type</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wide">Interpretation Range / Layout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDpts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-bold italic">
                    No Datapoint Types found matching query...
                  </td>
                </tr>
              ) : (
                filteredDpts.map((dpt) => {
                  const isExpanded = expandedId === dpt.id;
                  return (
                    <React.Fragment key={dpt.id}>
                      <tr 
                        onClick={() => handleRowClick(dpt.id)}
                        className={`hover:bg-slate-50/70 transition-all cursor-pointer select-none ${
                          isExpanded ? "bg-sky-50/20" : ""
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-sky-700 bg-sky-50/10 border-r border-slate-100">
                          {dpt.id}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-extrabold text-slate-800 border-r border-slate-100">
                          {dpt.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-semibold border-r border-slate-100">
                          {dpt.size}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dpt.category === "1-bit" 
                              ? "bg-teal-50 text-teal-700 border border-teal-100" 
                              : dpt.category === "2-bit" 
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : dpt.category === "8-bit"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : "bg-slate-150 text-slate-700 border border-slate-200"
                          }`}>
                            {dpt.dataType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-medium font-mono text-[11px] leading-relaxed">
                          {dpt.range}
                        </td>
                      </tr>

                      {/* Interactive Drawer for each DPT item */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={5} className="p-4 border-t border-b border-sky-100 text-slate-600 text-xs font-sans">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm max-w-4xl">
                              
                              {/* Header detailing purpose */}
                              <div className="flex items-start gap-2.5">
                                <div className="h-5 w-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">i</div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block text-xs">Description for {dpt.name} ({dpt.id})</span>
                                  <p className="text-slate-600 leading-relaxed font-semibold mt-0.5">{dpt.detailedDesc}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
