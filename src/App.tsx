import React, { useState } from "react";
import { Sliders, Network, BookOpen, Layers } from "lucide-react";
import { TelegramVisualizer } from "./components/TelegramVisualizer";
import { TopologyExplorer } from "./components/TopologyExplorer";
import { EducationalHandbook } from "./components/EducationalHandbook";
import { DatapointTypesList } from "./components/DatapointTypesList";

export default function App() {
  const [activeTab, setActiveTab] = useState<"visualizer" | "topology" | "datapointtypes" | "handbook">("visualizer");

  const navigationItems = [
    { id: "visualizer" as const, label: "Telegram Visualiser", icon: Sliders, color: "text-knx-blue" },
    { id: "topology" as const, label: "Topology Capacity Explorer", icon: Network, color: "text-knx-grey" },
    { id: "datapointtypes" as const, label: "Datapoint Types Matrix", icon: Layers, color: "text-knx-blue" },
    { id: "handbook" as const, label: "Training Handbook", icon: BookOpen, color: "text-knx-green" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700 flex flex-col justify-between selection:bg-knx-blue/10 selection:text-knx-blue">
      
      {/* Dynamic ambient soft gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-knx-blue/5 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-knx-green/5 blur-[150px]" />
        {/* Subtle grid mesh pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#003DA503_1px,transparent_1px),linear-gradient(to_bottom,#003DA503_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8">
        
        {/* Main Logo & Platform Header / Nav combo styled with the exact branding structure */}
        <header className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-28 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3840 1832" className="h-full w-auto">
                <path fill="#509E2F" d="M1865 467.7c-119.7 4.5-246.3 26.2-371.5 63.5-23.5 7-83.1 26.6-106.1 34.9-67.6 24.3-141 59.7-206.6 99.6-72.1 43.8-151.1 103.5-199.8 151l-11.5 11.2 71.7.1h71.8l14-11.9c82.3-69.8 200.5-133.2 324-174 112.9-37.2 239.2-60.8 372-69.6 20.1-1.3 77-3.3 89.5-3.1l4 .1v-102l-22-.1c-12.1 0-25.4.1-29.5.3m-896 644.8V1365h145l.1-72.3v-72.2l28.5-29 28.5-29 2 2.5c1.2 1.4 39.3 46.7 84.7 100.7l82.5 98.3h86.4c68.1 0 86.3-.3 85.7-1.2-.5-.7-51.8-61.4-114.1-135-104.9-123.9-133.3-157.9-133.3-159.8 0-.7 128.7-131.7 183.4-186.8l21.1-21.2h-147l-104 105.8-104 105.7-.3-105.7-.2-105.8H969z"/>
                <path fill="#003DA5" d="M1917 518.3V570h19.3c10.6 0 28.7.5 40.2 1 170.8 8.4 325.5 37.8 447.5 84.9 104.5 40.4 213.4 103 290.6 167l6.1 5.1 71.9-.2 71.9-.3-12.5-12.4c-82.2-81.4-210.2-164.9-339.6-221.4-127.2-55.6-284.9-98.6-427.6-116.6-49.3-6.3-85.5-8.9-133-9.8l-34.8-.6zm359.1 343.4c.8.9 46.5 55.5 101.7 121.2 55.1 65.7 100.2 119.8 100.2 120.1 0 .4-57.3 59.1-127.2 130.5-70 71.4-127.4 130.2-127.6 130.6-.2.5 32 .9 71.6.9h72l88.7-91c48.7-50.1 89-91 89.4-91s34.9 40.7 76.5 90.3l75.8 90.4 86.6.6c47.6.4 86.7.6 86.8.4.1-.1-45.7-54.7-101.8-121.2-56.1-66.6-108.5-128.8-116.5-138.3l-14.5-17.2L2751 974l113.2-114h-145l-73.9 74.5-73.8 74.5-63.9-74.5-63.9-74.5h-84.5c-79.3 0-84.4.1-83.1 1.7"/>
                <path fill="#7C878E" d="m1623.2 1108.2.3 252.3 70.6.3 70.6.2.7-28.2c.3-15.6.9-77.6 1.2-137.8.4-60.2.9-117.8 1.3-127.9l.6-18.3 115.5 156.1 115.5 156.1H2165V857h-143.3l.5 157.6c.3 112 .1 157.2-.6 156.2-.6-.9-51-72-112.1-158.1l-111-156.7H1623z"/>
              </svg>
            </div>
            <div className="text-left border-l border-slate-200 pl-3.5">
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
                    ? "bg-knx-blue/10 text-knx-blue border-knx-blue/20 shadow-xs" 
                    : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-knx-blue opacity-100" : "text-slate-400 opacity-70"}`} />
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
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 text-center space-y-2 selection:bg-knx-blue/10 selection:text-knx-blue">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
          KNX TP Explorer Dashboard — Version 4.0 Pro
        </p>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          Based on the official Advanced & Tutor certification course material provided by the{" "}
          <a 
            href="https://www.knx.org/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-knx-blue hover:text-knx-blue/80 font-bold underline decoration-knx-blue/20 transition-colors"
          >
            KNX Association
          </a>.
        </p>
        <div className="pt-2">
          <p className="text-slate-400 text-[10px] font-sans">
            Marc Sonne Dahl - KNX++ Tutor © 2026. Made with ❤️ for automation & electrical students.
          </p>
        </div>
      </footer>

    </div>
  );
}
