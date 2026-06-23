import React, { useState } from "react";
import { Sliders, Network, BookOpen, Layers } from "lucide-react";
import { TelegramVisualizer } from "./components/TelegramVisualizer";
import { TopologyExplorer } from "./components/TopologyExplorer";
import { EducationalHandbook } from "./components/EducationalHandbook";
import { DatapointTypesList } from "./components/DatapointTypesList";

export default function App() {
  const [activeTab, setActiveTab] = useState<"visualizer" | "topology" | "datapointtypes" | "handbook">("visualizer");

  const navigationItems = [
    { id: "visualizer" as const, label: "Telegram Visualiser", icon: Sliders, color: "text-cyan-400" },
    { id: "topology" as const, label: "Topology Capacity Explorer", icon: Network, color: "text-indigo-400" },
    { id: "datapointtypes" as const, label: "Datapoint Types Matrix", icon: Layers, color: "text-sky-400" },
    { id: "handbook" as const, label: "Training Handbook", icon: BookOpen, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-950">
      
      {/* Dynamic ambient soft gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/5 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/5 blur-[150px]" />
        {/* Subtle grid mesh pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f103_1px,transparent_1px),linear-gradient(to_bottom,#6366f103_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8">
        
        {/* Main Logo & Platform Header / Nav combo styled with the exact branding structure */}
        <header className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded flex items-center justify-center shrink-0">
              <div className="w-4.5 h-4.5 border-2 border-white rotate-45"></div>
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">KNX TP Explorer</h1>
              <p className="text-xs text-slate-500 font-medium">Educational Bus Analysis Tool v4.0</p>
            </div>
          </div>
          <div className="text-center sm:text-right max-w-md">
            <p className="text-slate-500 text-[11px] leading-normal font-medium">
              Explore raw TP1 Twisted Pair telegrams, physical waveforms, and hierarchical network topologies in real-time.
            </p>
          </div>
        </header>

        {/* Global Navigation Tabs in a pristine modern container */}
        <nav className="bg-white border border-slate-200 p-1.5 rounded-2xl max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-1 shadow-sm relative overflow-hidden">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold leading-normal transition-all duration-200 border ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm" 
                    : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-indigo-600 opacity-100" : "text-slate-400 opacity-70"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Primary Workspace Sections Component Router switch */}
        <main className="w-full">
          {activeTab === "visualizer" && <TelegramVisualizer />}
          {activeTab === "topology" && <TopologyExplorer />}
          {activeTab === "datapointtypes" && <DatapointTypesList />}
          {activeTab === "handbook" && <EducationalHandbook />}
        </main>

      </div>

      {/* High-quality Academic Credits footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 text-center space-y-2 selection:bg-indigo-100 selection:text-indigo-950">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
          KNX TP Explorer Dashboard — Version 4.0 Pro
        </p>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          Based on the official Tutor & Advanced instruction course material provided by the{" "}
          <a 
            href="https://www.knx.org/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 hover:text-indigo-700 font-bold underline decoration-indigo-200 transition-colors"
          >
            KNX Association
          </a>.
        </p>
        <div className="pt-2">
          <p className="text-slate-400 text-[10px] font-sans">
            Marc Sonne Dahl © 2026. Made with ❤️ for automation engineering students.
          </p>
        </div>
      </footer>

    </div>
  );
}
