import React, { useState, useEffect } from "react";
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Network, 
  Layers, 
  Info,
  GitMerge,
  GitCommit,
  ArrowRight,
  Shield,
  Zap
} from "lucide-react";

interface NodeStep {
  id: string;
  label: string;
  type: "device" | "repeater" | "line_coupler" | "backbone_coupler" | "static_device";
  address: string;
  description: string;
}

export function RoutingCounterExplorer() {
  const [couplingMode, setCouplingMode] = useState<"series" | "parallel">("series");
  const [startRC, setStartRC] = useState<number>(6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [simSpeed, setSimSpeed] = useState<number>(1200); // ms per step
  const [logs, setLogs] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  // Exact 18-node cascade sequence requested by the user:
  // DVC (1.1.255) - LR (1.1.192) - DVC (1.1.172) - LR (1.1.128) - DVC (1.1.101) - LR (1.1.64) - DVC (1.1.13) - LC (1.1.0) - BC (1.0.0) 
  // - BC (15.0.0) - LC (15.15.0) - DVC (15.15.13) - LR (15.15.64) - DVC (15.15.101) - LR (15.15.128) - DVC (15.15.172) - LR (15.15.192) - DVC (15.15.255)
  const pathNodes: NodeStep[] = [
    { id: "src_dvc", label: "Source Device", type: "device", address: "1.1.255", description: "Originates telegram on Segment 4 of Line 1.1." },
    { id: "lr_192", label: "Line Repeater", type: "repeater", address: "1.1.192", description: "Repeater separating Segment 4 and Segment 3." },
    { id: "dvc_172", label: "Device", type: "device", address: "1.1.172", description: "Device on Segment 3 receiving cascading signal." },
    { id: "lr_128", label: "Line Repeater", type: "repeater", address: "1.1.128", description: "Repeater separating Segment 3 and Segment 2." },
    { id: "dvc_101", label: "Device", type: "device", address: "1.1.101", description: "Device on Segment 2 receiving cascading signal." },
    { id: "lr_64", label: "Line Repeater", type: "repeater", address: "1.1.64", description: "Repeater separating Segment 2 and Main Segment 1." },
    { id: "dvc_13", label: "Device", type: "device", address: "1.1.13", description: "Device on Main Segment 1 receiving cascading signal." },
    { id: "lc_110", label: "Line Coupler", type: "line_coupler", address: "1.1.0", description: "Couples Line 1.1 to Area 1 Mainline." },
    { id: "bc_100", label: "Backbone Coupler", type: "backbone_coupler", address: "1.0.0", description: "Couples Area 1 Mainline to high-speed Backbone." },
    { id: "bc_1500", label: "Backbone Coupler", type: "backbone_coupler", address: "15.0.0", description: "Couples high-speed Backbone to Area 15 Mainline." },
    { id: "lc_15150", label: "Line Coupler", type: "line_coupler", address: "15.15.0", description: "Couples Area 15 Mainline to Line 15.15." },
    { id: "dvc_15_13", label: "Device", type: "device", address: "15.15.13", description: "Device on Main Segment 1 receiving cascading signal." },
    { id: "lr_1564", label: "Line Repeater", type: "repeater", address: "15.15.64", description: "Repeater separating Main Segment 1 and Segment 2." },
    { id: "dvc_15_101", label: "Device", type: "device", address: "15.15.101", description: "Device on Segment 2 receiving cascading signal." },
    { id: "lr_15128", label: "Line Repeater", type: "repeater", address: "15.15.128", description: "Repeater separating Segment 2 and Segment 3." },
    { id: "dvc_15_172", label: "Device", type: "device", address: "15.15.172", description: "Device on Segment 3 receiving cascading signal." },
    { id: "lr_15192", label: "Line Repeater", type: "repeater", address: "15.15.192", description: "Repeater separating Segment 3 and Segment 4." },
    { id: "dst_dvc", label: "Destination Device", type: "device", address: "15.15.255", description: "Final target node on Segment 4 of Line 15.15." }
  ];

  // Routing counter values at each step based on architecture
  const getRoutingCounterAtStep = (step: number, mode: "series" | "parallel", startingRC: number) => {
    if (step < 0) return startingRC;
    
    let currentRC = startingRC;
    for (let i = 1; i <= step; i++) {
      const node = pathNodes[i];
      if (mode === "parallel" && isNodeBypassedInParallel(node.id)) {
        continue; // bypassed repeaters are electrically isolated and never process the telegram
      }
      if (node && (node.type === "repeater" || node.type === "line_coupler" || node.type === "backbone_coupler")) {
        currentRC -= 1;
      }
    }
    return Math.max(0, currentRC);
  };

  const isNodeBypassedInParallel = (nodeId: string) => {
    if (couplingMode === "series") return false;
    const bypassed = [
      "dvc_172", "lr_128", "dvc_101", "lr_64", "dvc_13",
      "dvc_15_13", "lr_1564", "dvc_15_101", "lr_15128", "dvc_15_172"
    ];
    return bypassed.includes(nodeId);
  };

  // Convert step index to active path coordinates for the animating telegram circle
  const getTelegramCoordinates = (step: number) => {
    if (step < 0) return { x: 345, y: 398 }; // Initial Source DVC position at y=380, center y is 398
    
    // Series mode path coordinates (fully sequential cascade matching the daisy-chained route)
    const seriesCoordinates: { [key: number]: { x: number; y: number } } = {
      0: { x: 345, y: 398 },   // src_dvc (DVC 1.1.255)
      1: { x: 145, y: 338 },   // lr_192 (LR 1.1.192)
      2: { x: 345, y: 338 },   // dvc_172 (DVC 1.1.172)
      3: { x: 145, y: 278 },   // lr_128 (LR 1.1.128)
      4: { x: 345, y: 278 },   // dvc_101 (DVC 1.1.101)
      5: { x: 145, y: 218 },   // lr_64 (LR 1.1.64)
      6: { x: 345, y: 218 },   // dvc_13 (DVC 1.1.13)
      7: { x: 245, y: 158 },   // lc_110 (LC 1.1.0)
      8: { x: 245, y: 98 },    // bc_100 (BC 1.0.0)
      9: { x: 755, y: 98 },    // bc_1500 (BC 15.0.0)
      10: { x: 755, y: 158 },  // lc_15150 (LC 15.15.0)
      11: { x: 655, y: 218 },  // dvc_15_13 (DVC 15.15.13)
      12: { x: 855, y: 218 },  // lr_1564 (LR 15.15.64)
      13: { x: 655, y: 278 },  // dvc_15_101 (DVC 15.15.101)
      14: { x: 855, y: 278 },  // lr_15128 (LR 15.15.128)
      15: { x: 655, y: 338 },  // dvc_15_172 (DVC 15.15.172)
      16: { x: 855, y: 338 },  // lr_15192 (LR 15.15.192)
      17: { x: 655, y: 398 }   // dst_dvc (DVC 15.15.255)
    };

    if (couplingMode === "series") {
      return seriesCoordinates[step] || { x: 345, y: 398 };
    }

    // Parallel mode path coordinates (shows skipping/bypassing intermediate nodes)
    const parallelCoordinates: { [key: number]: { x: number; y: number } } = {
      0: { x: 345, y: 398 }, // src_dvc
      1: { x: 145, y: 338 }, // lr_192
      2: { x: 145, y: 338 }, // Bypassed
      3: { x: 145, y: 338 }, // Bypassed
      4: { x: 145, y: 338 }, // Bypassed
      5: { x: 145, y: 338 }, // Bypassed
      6: { x: 145, y: 338 }, // Bypassed
      7: { x: 245, y: 158 }, // lc_110 (goes straight up parallel trunk to Line Coupler!)
      8: { x: 245, y: 98 },  // bc_100
      9: { x: 755, y: 98 },  // bc_1500
      10: { x: 755, y: 158 }, // lc_15150
      11: { x: 755, y: 158 }, // Bypassed
      12: { x: 755, y: 158 }, // Bypassed
      13: { x: 755, y: 158 }, // Bypassed
      14: { x: 755, y: 158 }, // Bypassed
      15: { x: 755, y: 158 }, // Bypassed
      16: { x: 855, y: 338 },// lr_15192 (goes straight down parallel trunk to Repeater 192!)
      17: { x: 655, y: 398 } // dst_dvc
    };

    return parallelCoordinates[step] || { x: 345, y: 398 };
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      if (currentStepIndex < pathNodes.length - 1) {
        timer = setTimeout(() => {
          let nextStep = currentStepIndex + 1;
          if (couplingMode === "parallel") {
            while (nextStep < pathNodes.length && isNodeBypassedInParallel(pathNodes[nextStep].id)) {
              nextStep++;
            }
          }
          const targetNode = pathNodes[nextStep];

          const beforeRC = getRoutingCounterAtStep(currentStepIndex, couplingMode, startRC);
          const afterRC = getRoutingCounterAtStep(nextStep, couplingMode, startRC);

          let logMessage = "";
          if (nextStep === 0) {
            logMessage = `▶️ Telegram sent from Source Device ${targetNode.address} with Starting RC = ${startRC}.`;
          } else if (targetNode.id === "dst_dvc") {
            if (beforeRC > 0 || (couplingMode === "parallel" && beforeRC === 0 && startRC >= 6)) {
              logMessage = `🎉 Success! Telegram reached Destination Device ${targetNode.address} with RC = ${beforeRC}.`;
            } else {
              logMessage = `🛑 Failure! Telegram was dropped because Routing Counter depleted to 0.`;
            }
          } else {
            if (beforeRC <= 0) {
              logMessage = `❌ Blocked! ${targetNode.label} (${targetNode.address}) dropped the package. Routing Counter is 0.`;
              setIsPlaying(false);
            } else {
              if (targetNode.type === "device") {
                logMessage = `⚙️ Passed through Device (${targetNode.address}). Devices do not decrement the Routing Counter. RC remains ${beforeRC}.`;
              } else {
                let passiveNote = "";
                if (couplingMode === "parallel") {
                  if (targetNode.id === "lr_192") passiveNote = " 📢 Parallel Star benefit: Bypassed segments 1, 2 & 3 are isolated, reducing bus traffic!";
                }
                logMessage = `⚙️ Forwarded by ${targetNode.label} (${targetNode.address}). RC decremented: ${beforeRC} ➡️ ${afterRC}.${passiveNote}`;
              }
            }
          }

          setLogs((prev) => [...prev, logMessage]);
          setCurrentStepIndex(nextStep);

          if (afterRC === 0 && nextStep < pathNodes.length - 2) {
            // Let simulation proceed one step to show the block/drop
          }
        }, simSpeed);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, couplingMode, startRC, simSpeed]);

  const handleStartSim = () => {
    if (currentStepIndex >= pathNodes.length - 1 || currentStepIndex === -1) {
      setCurrentStepIndex(0);
      setLogs([`▶️ Telegram sent from Source Device 1.1.255 with Starting RC = ${startRC}.`]);
    }
    setIsPlaying(true);
  };

  const handlePauseSim = () => setIsPlaying(false);
  const handleResetSim = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setLogs([]);
  };

  const activeRC = getRoutingCounterAtStep(currentStepIndex, couplingMode, startRC);
  const telegramPos = getTelegramCoordinates(currentStepIndex);
  
  // Overall delivery capability check
  const overallSuccess = couplingMode === "series" ? (startRC >= 11) : (startRC >= 6);

  // Left Area 1 device and coupler/repeater receiving states (broadcast receipt)
  const dvc1_receiving = couplingMode === "series" ? (currentStepIndex >= 6) : (currentStepIndex >= 1);
  const dvc2_receiving = couplingMode === "series" ? (currentStepIndex >= 4) : (currentStepIndex >= 1);
  const dvc3_receiving = couplingMode === "series" ? (currentStepIndex >= 2) : (currentStepIndex >= 1);
  const src_receiving = currentStepIndex >= 0;

  const lr64_receiving = couplingMode === "parallel" && currentStepIndex >= 1;
  const lr128_receiving = couplingMode === "parallel" && currentStepIndex >= 1;
  const lr192_receiving = couplingMode === "parallel" && currentStepIndex >= 1;
  const lc1_receiving = couplingMode === "parallel" && currentStepIndex >= 1;

  // Right Area 15 device and coupler/repeater receiving states
  const dvc15_1_receiving = overallSuccess && (couplingMode === "series" ? (currentStepIndex >= 11) : (currentStepIndex >= 10));
  const dvc15_2_receiving = overallSuccess && (couplingMode === "series" ? (currentStepIndex >= 13) : (currentStepIndex >= 10));
  const dvc15_3_receiving = overallSuccess && (couplingMode === "series" ? (currentStepIndex >= 15) : (currentStepIndex >= 10));
  const dst_receiving = overallSuccess && (couplingMode === "series" ? (currentStepIndex >= 17) : (currentStepIndex >= 10));

  const lr1564_receiving = overallSuccess && couplingMode === "parallel" && currentStepIndex >= 10;
  const lr15128_receiving = overallSuccess && couplingMode === "parallel" && currentStepIndex >= 10;
  const lr15192_receiving = overallSuccess && couplingMode === "parallel" && currentStepIndex >= 10;
  const lc15_receiving = overallSuccess && couplingMode === "parallel" && currentStepIndex >= 10;

  // Modular SVG card renderer matching the "Topology Capacity Explorer" perfectly!
  const renderSvgNode = (
    x: number,
    y: number,
    label: string,
    type: "coupler" | "device" | "repeater",
    address: string,
    isActive: boolean,
    isReceiving: boolean = false,
    isBypassed: boolean = false
  ) => {
    let bgFill = "#FFFFFF";
    let strokeColor = "#E2E8F0"; // slate-200
    let titleColor = "#475569"; // slate-600
    let opacityVal = isBypassed ? (isReceiving ? "0.6" : "0.35") : "1";

    if (isActive) {
      bgFill = "#509E2F"; // Solid KNX Green highlight
      strokeColor = "#509E2F";
      titleColor = "#FFFFFF";
    } else if (isReceiving) {
      // Glow amber when actively receiving a broadcasted telegram (demonstrating receiving concept)
      bgFill = "#FFFBEB"; // amber-50
      strokeColor = "#F59E0B"; // amber-500
      titleColor = "#B45309"; // amber-700
    } else {
      if (type === "coupler" || type === "repeater") {
        bgFill = "#F4FBF0"; // bg-knx-blue/5 (very light brand green tint)
        strokeColor = "rgba(80, 158, 47, 0.2)"; // border-knx-blue/20
        titleColor = "#509E2F"; // brand text color
      }
    }

    return (
      <g 
        transform={`translate(${x}, ${y})`} 
        opacity={opacityVal} 
        className="transition-all duration-300"
        key={address}
      >
        {/* Glowing halo for receiving/active nodes */}
        {(isActive || isReceiving) && (
          <rect 
            x="-2" 
            y="-2" 
            width="114" 
            height="37" 
            rx="8" 
            fill="none" 
            stroke={isActive ? "#509E2F" : "#F59E0B"} 
            strokeWidth="1.5" 
            strokeOpacity="0.4"
            className="animate-pulse"
          />
        )}
        
        {/* Main flat card */}
        <rect 
          x="0" 
          y="0" 
          width="110" 
          height="33" 
          rx="6" 
          fill={bgFill} 
          stroke={isActive ? "none" : strokeColor} 
          strokeWidth="1.2"
        />
        
        {/* Label */}
        <text 
          x="55" 
          y="20.5" 
          fill={titleColor} 
          fontSize="10" 
          fontWeight="800" 
          fontFamily="system-ui, sans-serif" 
          textAnchor="middle"
          letterSpacing="0.2"
        >
          {label} ({address})
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in font-sans">
      
      {/* Intro Header banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-1.5 max-w-2xl text-left">
          <div className="flex items-center gap-2">
            <span className="bg-knx-green/10 text-knx-green text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md border border-knx-green/20">
              Topology Lesson
            </span>
            <span className="text-slate-400 text-xs font-mono">• KNX Association Training Partner</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="h-5.5 w-5.5 text-knx-green" />
            Routing Counter & Repeater Cascade Explorer
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            KNX telegrams use a 3-bit **Routing Counter** (default **6**). It decrements by 1 each time the packet crosses a Coupler or Line Repeater. This simulator demonstrates why daisy-chaining (Series) repeaters can exhaust this counter and cause packet drop, and how parallel (Star) coupling resolves it.
          </p>
        </div>
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs font-bold text-knx-green hover:bg-knx-green/5 border border-knx-green/10 px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Info className="h-4 w-4" />
          {showExplanation ? "Hide Explanation" : "Show Explanation"}
        </button>
      </div>

      {/* Dynamic Educational Card */}
      {showExplanation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-red-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              Series Coupling (Incorrect Cascade)
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Segment repeaters are connected sequentially: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Segment 4 ➔ Segment 3 ➔ Segment 2 ➔ Segment 1</code>.
            </p>
            <div className="p-3 bg-red-50 text-red-950 rounded-xl border border-red-100/50 text-[11px] space-y-1.5">
              <span className="font-extrabold text-red-900 block text-xs">Exhaustion Mechanism:</span>
              <p>
                To reach the other area, a telegram must crawl through **10 couplers/repeaters in a row**. 
              </p>
              <p className="font-semibold text-red-800">
                Starting at 6, the Routing Counter hits 0 mid-transit at Backbone Coupler <code className="bg-red-100/80 text-red-900 font-bold px-1 rounded">15.0.0</code> and is permanently dropped by the hardware!
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-knx-green uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-knx-green" />
              Parallel Coupling (Recommended Star)
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              All line repeaters connect directly to the **Main Line Segment** as branch star segments.
            </p>
            <div className="p-3 bg-knx-green/5 text-knx-green rounded-xl border border-knx-green/10 text-[11px] space-y-1.5">
              <span className="font-extrabold text-slate-900 block text-xs">Efficient Star Mechanism:</span>
              <p>
                The telegram exits Segment 4, crosses only **1 repeater** to reach the main line, routes across the backbone, and enters Area 15 segment 4 through only **1 repeater**. 
              </p>
              <p className="font-bold text-knx-green">
                Total hops needed is exactly 6! The telegram successfully arrives with RC = 0.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Control Dashboard Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-slate-100 pb-5">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-6 text-left">
            {/* Coupling Mode Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Coupling Scheme</label>
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                <button
                  onClick={() => { setCouplingMode("series"); handleResetSim(); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    couplingMode === "series" 
                      ? "bg-white text-red-600 shadow-xs border border-slate-200" 
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  Series Cascade
                </button>
                <button
                  onClick={() => { setCouplingMode("parallel"); handleResetSim(); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    couplingMode === "parallel" 
                      ? "bg-white text-knx-green shadow-xs border border-slate-200" 
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  <GitCommit className="h-3.5 w-3.5" />
                  Parallel Star
                </button>
              </div>
            </div>

            {/* Starting Routing Counter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting Routing Counter (3-Bit Value)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="1" 
                  max="7" 
                  value={startRC} 
                  onChange={(e) => { setStartRC(parseInt(e.target.value)); handleResetSim(); }}
                  className="w-32 accent-knx-green h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  disabled={isPlaying}
                />
                <span className="font-mono text-xs font-extrabold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
                  {startRC} {startRC === 6 ? "(KNX Default)" : startRC === 7 ? "(System Max)" : ""}
                </span>
              </div>
            </div>

            {/* Sim Speed */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostic Pace</label>
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                {[
                  { label: "Slow", val: 1800 },
                  { label: "Standard", val: 1200 },
                  { label: "Fast", val: 600 }
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setSimSpeed(s.val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      simSpeed === s.val 
                        ? "bg-white text-slate-800 shadow-xs border border-slate-200" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={isPlaying ? handlePauseSim : handleStartSim}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 text-white shadow-sm ${
                isPlaying 
                  ? "bg-amber-600 hover:bg-amber-700" 
                  : "bg-knx-green hover:bg-knx-green/90"
              }`}
            >
              <Play className="h-4 w-4" />
              {isPlaying ? "Pause Trace" : currentStepIndex === -1 ? "Transmit Telegram" : "Resume Trace"}
            </button>
            <button
              onClick={handleResetSim}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Reset Trace"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Beautiful high-fidelity SVG schematic of Area 1 and Area 15 */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-knx-green" />
              Active Bus Topology Path: <span className="font-mono text-knx-green bg-knx-green/5 px-2 py-0.5 rounded border border-knx-green/10">1.1.255 ➔ 15.15.255</span>
            </span>
            <div className="flex items-center gap-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0089FF]" /> Device (DVC)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#509E2F]" /> Coupler/Repeater</span>
            </div>
          </div>

          {/* Render Vector Schematic Canvas */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 md:p-6 overflow-x-auto">
            <div className="min-w-[960px] flex justify-center">
              <svg 
                width="1000" 
                height="460" 
                viewBox="0 0 1000 460" 
                className="select-none overflow-visible"
              >
                {/* DEFINE CUSTOM 3D DROPSHADOW FILTERS AND MARKERS */}
                <defs>
                  <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="115%">
                    <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.06" />
                  </filter>
                  <linearGradient id="backbone-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#509E2F" />
                    <stop offset="50%" stopColor="#7C878E" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#509E2F" />
                  </linearGradient>
                </defs>

                {/* 1. BACKBONE LINE SYSTEM (at top y = 40) */}
                <g>
                  {/* Left part of backbone */}
                  <line x1="245" y1="40" x2="430" y2="40" stroke="#509E2F" strokeWidth="3" />
                  {/* Middle dotted part to indicate large layout bounds */}
                  <line x1="430" y1="40" x2="570" y2="40" stroke="url(#backbone-gradient)" strokeWidth="3" strokeDasharray="6,4" />
                  {/* Right part of backbone */}
                  <line x1="570" y1="40" x2="755" y2="40" stroke="#509E2F" strokeWidth="3" />
                  {/* Label shifted higher to prevent overlap with transmission line */}
                  <rect x="440" y="12" width="120" height="20" rx="10" fill="#7C878E" />
                  <text x="500" y="25" fill="#FFFFFF" fontSize="10" fontWeight="extrabold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
                    BACKBONE (LINE 0)
                  </text>
                </g>

                {/* 3. AREA 1 CONTAINER (Left) */}
                <g filter="url(#card-shadow)">
                  <rect x="40" y="75" width="410" height="365" rx="16" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="2" />
                  <text x="430" y="100" fill="#2E7D32" fontSize="12" fontWeight="extrabold" fontFamily="sans-serif" textAnchor="end" letterSpacing="0.5">
                    Area 1 (Source Area)
                  </text>
                </g>

                {/* 4. AREA 15 CONTAINER (Right) */}
                <g filter="url(#card-shadow)">
                  <rect x="550" y="75" width="410" height="365" rx="16" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="2" />
                  <text x="940" y="100" fill="#2E7D32" fontSize="12" fontWeight="extrabold" fontFamily="sans-serif" textAnchor="end" letterSpacing="0.5">
                    Area 15 (Destination)
                  </text>
                </g>

                {/* 5. PHYSICAL WIRE CONNECTIONS OVERLAYS */}
                {/* Area 1 structural wires */}
                <g fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Backbone connection */}
                  <line x1="245" y1="40" x2="245" y2="80" />
                  
                  {/* BC bottom center to LC top center */}
                  <line x1="245" y1="113" x2="245" y2="140" />

                  {couplingMode === "series" ? (
                    // SERIES COUPLING SCHEME WIRE PATH (Daisy-chained snaking sequentially through devices)
                    <g>
                      {/* LC (1.1.0) bottom center (245, 173) to DVC (1.1.13) top center (345, 200) */}
                      <path d="M 245 173 L 245 185 L 345 185 L 345 200" />
                      {/* DVC (1.1.13) left center (290, 218) to LR (1.1.64) right center (200, 218) */}
                      <path d="M 290 218 L 200 218" />
                      {/* LR (1.1.64) bottom center (145, 233) to DVC (1.1.101) top center (345, 260) */}
                      <path d="M 145 233 L 145 246 L 345 246 L 345 260" />
                      {/* DVC (1.1.101) left center (290, 278) to LR (1.1.128) right center (200, 278) */}
                      <path d="M 290 278 L 200 278" />
                      {/* LR (1.1.128) bottom center (145, 293) to DVC (1.1.172) top center (345, 320) */}
                      <path d="M 145 293 L 145 306 L 345 306 L 345 320" />
                      {/* DVC (1.1.172) left center (290, 338) to LR (1.1.192) right center (200, 338) */}
                      <path d="M 290 338 L 200 338" />
                      {/* LR (1.1.192) bottom center (145, 353) to DVC (1.1.255) top center (345, 380) */}
                      <path d="M 145 353 L 145 366 L 345 366 L 345 380" />
                    </g>
                  ) : (
                    // PARALLEL STAR COUPLING SCHEME WIRE PATH
                    <g>
                      {/* Parallel trunk line on the left side */}
                      <path d="M 245 173 L 245 185 L 55 185 L 55 338" />
                      {/* Branch taps to repeaters */}
                      <path d="M 55 218 L 90 218 M 55 278 L 90 278 M 55 338 L 90 338" />
                      {/* Device connections directly from their segment repeaters */}
                      <path d="M 245 185 L 345 185 L 345 200" />
                      <path d="M 200 218 L 245 218 L 245 246 L 345 246 L 345 260" />
                      <path d="M 200 278 L 245 278 L 245 306 L 345 306 L 345 320" />
                      <path d="M 200 338 L 245 338 L 245 366 L 345 366 L 345 380" />
                    </g>
                  )}
                </g>

                {/* Area 15 structural wires */}
                <g fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Backbone connection */}
                  <line x1="755" y1="40" x2="755" y2="80" />
                  
                  {/* BC bottom center to LC top center */}
                  <line x1="755" y1="113" x2="755" y2="140" />

                  {couplingMode === "series" ? (
                    // SERIES COUPLING SCHEME WIRE PATH (Daisy-chained snaking sequentially through devices)
                    <g>
                      {/* LC (15.15.0) bottom center (755, 173) to DVC (15.15.13) top center (655, 200) */}
                      <path d="M 755 173 L 755 185 L 655 185 L 655 200" />
                      {/* DVC (15.15.13) right center (710, 218) to LR (15.15.64) left center (800, 218) */}
                      <path d="M 710 218 L 800 218" />
                      {/* LR (15.15.64) bottom center (855, 233) to DVC (15.15.101) top center (655, 260) */}
                      <path d="M 855 233 L 855 246 L 655 246 L 655 260" />
                      {/* DVC (15.15.101) right center (710, 278) to LR (15.15.128) left center (800, 278) */}
                      <path d="M 710 278 L 800 278" />
                      {/* LR (15.15.128) bottom center (855, 293) to DVC (15.15.172) top center (655, 320) */}
                      <path d="M 855 293 L 855 306 L 655 306 L 655 320" />
                      {/* DVC (15.15.172) right center (710, 338) to LR (15.15.192) left center (800, 338) */}
                      <path d="M 710 338 L 800 338" />
                      {/* LR (15.15.192) bottom center (855, 353) to DVC (15.15.255) top center (655, 380) */}
                      <path d="M 855 353 L 855 366 L 655 366 L 655 380" />
                    </g>
                  ) : (
                    // PARALLEL STAR COUPLING SCHEME WIRE PATH
                    <g>
                      {/* Parallel trunk line on the right side */}
                      <path d="M 755 173 L 755 185 L 945 185 L 945 338" />
                      {/* Branch taps to repeaters */}
                      <path d="M 945 218 L 910 218 M 945 278 L 910 278 M 945 338 L 910 338" />
                      {/* Device connections directly from their segment repeaters */}
                      <path d="M 755 185 L 655 185 L 655 200" />
                      <path d="M 800 218 L 755 218 L 755 246 L 655 246 L 655 260" />
                      <path d="M 800 278 L 755 278 L 755 306 L 655 306 L 655 320" />
                      <path d="M 800 338 L 755 338 L 755 366 L 655 366 L 655 380" />
                    </g>
                  )}
                </g>

                {/* 6. TELEGRAM ROUTING HIGHLIGHT ANIMATOR PATH (Pulsing orange/yellow glow wire) */}
                {currentStepIndex >= 0 && (
                  <g fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                    
                    {/* Series Cascade paths */}
                    {couplingMode === "series" ? (
                      <g>
                        {/* Area 1 series path highlights */}
                        {currentStepIndex >= 1 && <path d="M 145 353 L 145 366 L 345 366 L 345 380" />}
                        {currentStepIndex >= 2 && <path d="M 290 338 L 200 338" />}
                        {currentStepIndex >= 3 && <path d="M 145 293 L 145 306 L 345 306 L 345 320" />}
                        {currentStepIndex >= 4 && <path d="M 290 278 L 200 278" />}
                        {currentStepIndex >= 5 && <path d="M 145 233 L 145 246 L 345 246 L 345 260" />}
                        {currentStepIndex >= 6 && <path d="M 290 218 L 200 218" />}
                        {currentStepIndex >= 7 && <path d="M 245 173 L 245 185 L 345 185 L 345 200" />}
                      </g>
                    ) : (
                      // Parallel trunk path Area 1 (all branches highlight in sync when telegram enters the star)
                      <g>
                        {currentStepIndex >= 0 && (
                          <path d="M 200 338 L 245 338 L 245 366 L 345 366 L 345 380" />
                        )}
                        {currentStepIndex >= 1 && (
                          <g>
                            <path d="M 245 173 L 245 185 L 55 185 L 55 338" />
                            <path d="M 55 218 L 90 218 M 55 278 L 90 278 M 55 338 L 90 338" />
                            <path d="M 245 185 L 345 185 L 345 200" />
                            <path d="M 200 218 L 245 218 L 245 246 L 345 246 L 345 260" />
                            <path d="M 200 278 L 245 278 L 245 306 L 345 306 L 345 320" />
                          </g>
                        )}
                      </g>
                    )}

                    {/* LC 110 to BC 100 to BC 1500 to LC 15150 */}
                    {currentStepIndex >= 8 && <line x1="245" y1="140" x2="245" y2="98" />}
                    {currentStepIndex >= 9 && <path d="M 245 80 L 245 40 L 755 40 L 755 80" />}
                    {currentStepIndex >= 10 && <line x1="755" y1="98" x2="755" y2="158" />}

                    {/* Area 15 pathways */}
                    {overallSuccess && (
                      <g>
                        {couplingMode === "series" ? (
                           <g>
                             {currentStepIndex >= 11 && <path d="M 755 173 L 755 185 L 655 185 L 655 200" />}
                             {currentStepIndex >= 12 && <path d="M 710 218 L 800 218" />}
                             {currentStepIndex >= 13 && <path d="M 855 233 L 855 246 L 655 246 L 655 260" />}
                             {currentStepIndex >= 14 && <path d="M 710 278 L 800 278" />}
                             {currentStepIndex >= 15 && <path d="M 855 293 L 855 306 L 655 306 L 655 320" />}
                             {currentStepIndex >= 16 && <path d="M 710 338 L 800 338" />}
                             {currentStepIndex >= 17 && <path d="M 855 353 L 855 366 L 655 366 L 655 380" />}
                           </g>
                        ) : (
                          // Parallel trunks Area 15 (multicast star-burst triggers all Area 15 branches in unison)
                          <g>
                            {currentStepIndex >= 10 && (
                              <g>
                                <path d="M 755 173 L 755 185 L 945 185 L 945 338" />
                                <path d="M 945 218 L 910 218 M 945 278 L 910 278 M 945 338 L 910 338" />
                                <path d="M 755 185 L 655 185 L 655 200" />
                                <path d="M 800 218 L 755 218 L 755 246 L 655 246 L 655 260" />
                                <path d="M 800 278 L 755 278 L 755 306 L 655 306 L 655 320" />
                                <path d="M 800 338 L 755 338 L 755 366 L 655 366 L 655 380" />
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                )}


                {/* 7. NODE BLOCKS STYLED MATCHING TOPOLOGY EXPLORER */}
                {/* Area 1 Node Elements */}
                {renderSvgNode(190, 80, "BC", "coupler", "1.0.0", currentStepIndex === 8)}
                {renderSvgNode(190, 140, "LC", "coupler", "1.1.0", currentStepIndex === 7, lc1_receiving)}
                {renderSvgNode(90, 200, "LR", "repeater", "1.1.64", currentStepIndex === 5, lr64_receiving, isNodeBypassedInParallel("lr_64"))}
                {renderSvgNode(90, 260, "LR", "repeater", "1.1.128", currentStepIndex === 3, lr128_receiving, isNodeBypassedInParallel("lr_128"))}
                {renderSvgNode(90, 320, "LR", "repeater", "1.1.192", currentStepIndex === 1, lr192_receiving)}
 
                {/* Left side end-devices */}
                {renderSvgNode(290, 200, "DVC", "device", "1.1.13", currentStepIndex === 6, dvc1_receiving)}
                {renderSvgNode(290, 260, "DVC", "device", "1.1.101", currentStepIndex === 4, dvc2_receiving)}
                {renderSvgNode(290, 320, "DVC", "device", "1.1.172", currentStepIndex === 2, dvc3_receiving)}
                {renderSvgNode(290, 380, "DVC", "device", "1.1.255", currentStepIndex === 0, src_receiving)}
 
 
                {/* Area 15 Node Elements */}
                {renderSvgNode(700, 80, "BC", "coupler", "15.0.0", currentStepIndex === 9)}
                {renderSvgNode(700, 140, "LC", "coupler", "15.15.0", currentStepIndex === 10, lc15_receiving)}
                {renderSvgNode(800, 200, "LR", "repeater", "15.15.64", currentStepIndex === 12, lr1564_receiving, isNodeBypassedInParallel("lr_1564"))}
                {renderSvgNode(800, 260, "LR", "repeater", "15.15.128", currentStepIndex === 14, lr15128_receiving, isNodeBypassedInParallel("lr_15128"))}
                {renderSvgNode(800, 320, "LR", "repeater", "15.15.192", currentStepIndex === 16, lr15192_receiving)}
 
                {/* Right side end-devices */}
                {renderSvgNode(600, 200, "DVC", "device", "15.15.13", currentStepIndex === 11, dvc15_1_receiving)}
                {renderSvgNode(600, 260, "DVC", "device", "15.15.101", currentStepIndex === 13, dvc15_2_receiving)}
                {renderSvgNode(600, 320, "DVC", "device", "15.15.172", currentStepIndex === 15, dvc15_3_receiving)}
                {renderSvgNode(600, 380, "DVC", "device", "15.15.255", currentStepIndex === 17, dst_receiving)}


                {/* 8. ANIMATING TRAVELING TELEGRAM PACKAGE CIRCLE */}
                {currentStepIndex >= 0 && (
                  <g 
                    transform={`translate(${telegramPos.x}, ${telegramPos.y})`}
                    style={{ transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    className="overflow-visible"
                  >
                    {/* Glowing outer halo */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="16" 
                      fill={activeRC === 0 && currentStepIndex < pathNodes.length - 1 && currentStepIndex > 0 ? "#EF4444" : "#F59E0B"} 
                      opacity="0.3" 
                      className="animate-ping" 
                    />
                    {/* Main package body */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="12" 
                      fill={activeRC === 0 && currentStepIndex < pathNodes.length - 1 && currentStepIndex > 0 ? "#EF4444" : "#F59E0B"} 
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                      className="shadow-md"
                    />
                    {/* Active routing counter value inside the circle */}
                    <text 
                      x="0" 
                      y="3.5" 
                      fill="#FFFFFF" 
                      fontSize="10" 
                      fontWeight="black" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                    >
                      {activeRC}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Grid Layout of Interactive Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">

        {/* Real-time metrics analyzer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2.5 block">
            Path Diagnostics (Real-time)
          </span>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-bold">Coupling Arrangement</span>
              <span className={`text-[11px] font-extrabold border px-2.5 py-0.5 rounded-lg ${
                couplingMode === "series" ? "bg-red-50 text-red-600 border-red-100" : "bg-knx-green/10 text-knx-green border-knx-green/20"
              }`}>
                {couplingMode === "series" ? "Series Cascade" : "Parallel Star"}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-bold">Total Devices Traversed</span>
              <span className="font-mono text-xs font-extrabold text-slate-800 bg-white border px-2 py-0.5 rounded-lg">
                {couplingMode === "series" ? "10 Couplers / LRs" : "6 Couplers / LRs"}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-bold">Remaining Routing Counter</span>
              <span className={`font-mono text-xs font-extrabold border px-2 py-0.5 rounded-lg ${
                activeRC > 0 ? "bg-knx-green/10 text-knx-green border-knx-green/20" : "bg-red-100 text-red-700 border-red-200"
              }`}>
                {activeRC}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-bold">Overall Delivery Outcome</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                overallSuccess 
                  ? "bg-knx-green/10 text-knx-green border border-knx-green/20" 
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}>
                {overallSuccess ? "SUCCESSFUL DELIVERY" : "PACKET EXHAUSTED"}
              </span>
            </div>
          </div>
        </div>

        {/* KNX Guidelines reference card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2.5 block">
            Official KNX Topology Standards
          </span>

          <div className="text-[11px] text-slate-600 space-y-3 font-medium leading-relaxed">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-knx-green shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-950 block">Parallel (Star) Topology Standard:</strong>
                Always route branch repeaters to the Main Line segment to limit total hops to exactly 6, leaving a buffer of 1.
              </p>
            </div>
            
            <div className="flex gap-2">
              <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-950 block">No Cascade Cascading:</strong>
                Never wire segment repeaters in series. It decreases the remaining routing counter budget past the default 3-bit ceiling.
              </p>
            </div>

            <div className="p-2.5 bg-amber-50 text-amber-950 rounded-xl border border-amber-100/50 text-[10px] font-medium leading-relaxed">
              <strong>Advanced Certification Rule:</strong> Standard KNX line repeaters cannot act as filters. If cascaded in series, telegram loops can cause complete bandwidth lockout.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
