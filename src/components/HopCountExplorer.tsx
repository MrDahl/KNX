import React, {useEffect, useState} from 'react';
import {Play, RotateCcw, Network, Info} from 'lucide-react';
import {traceRoute} from '../knx/teachingModels';
import {routingExample} from '../knx/routingExample';
import {HopCountTopology} from './HopCountTopology';

export function HopCountExplorer() {
  const [mode,setMode] = useState<'series'|'parallel'>('parallel');
  const [startHopCount,setStartHopCount] = useState(6);
  const [blockedCoupler,setBlockedCoupler] = useState('');
  const [playing,setPlaying] = useState(false);
  const [step,setStep] = useState(-1);
  const [speed,setSpeed] = useState(1200);
  const nodes = routingExample(mode);
  const trace = traceRoute(nodes,startHopCount,blockedCoupler);
  const current = trace[step];
  const finished = step === trace.length-1;
  const delivered = trace.at(-1)?.id === 'destination';
  const reset = () => {setPlaying(false);setStep(-1);};
  useEffect(() => {
    if (!playing) return;
    if (step >= trace.length-1) {setPlaying(false);return;}
    const timer = setTimeout(() => setStep(s=>s+1),speed);
    return () => clearTimeout(timer);
  },[playing,step,speed,trace.length]);
  const start = () => {
    if (playing) {setPlaying(false);return;}
    if (finished || step < 0) setStep(0);
    setPlaying(true);
  };
  return <div className="space-y-6 max-w-6xl mx-auto text-left">
    <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
      <h2 className="text-xl font-extrabold text-slate-900 flex gap-2 items-center"><Network className="text-knx-green"/>Hop Count · TP path simulation</h2>
      <p className="text-sm text-slate-600">Follow a normal group telegram from 1.1.255 to 15.15.255 through the devices shown below. The normal starting hop count (HC) is 6. A forwarding coupler or legacy line repeater receives HC &gt; 0 and sends it onward with HC reduced by one. An incoming HC of 0 prevents another crossing; receivers on the reached segment can still accept the telegram.</p>
      <p className="text-xs text-slate-500">Scope: ordinary group-addressed traffic, matching receiver with C/W enabled, healthy TP links and no repetitions or ACK simulation. Each relevant group-address filter permits forwarding unless you select a rejection below. HC 7 has special non-decrementing behavior; it is outside this ordinary-traffic simulation, not an extra hop to use in planning.</p>
    </section>
    <details className="detail-box"><summary>Show details · compare the two arrangements</summary><section className="grid @2xl:grid-cols-2 gap-4 text-sm">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2"><h3 className="font-bold text-knx-green">Parallel repeater branches</h3><p className="text-slate-600">Each extension connects to its line’s main segment. This selected cross-area path has one repeater at each end and four line/backbone couplers: six crossings. That count belongs to this path; shorter paths use fewer. With HC 6, the final segment receives HC 0, with no forwarding budget left.</p></div>
      <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5 space-y-2"><h3 className="font-bold text-rose-800">Series cascade — deliberately invalid example</h3><p className="text-slate-700">Three legacy repeaters in series at each end create ten crossings. This demonstrates the failure of this arrangement; it is not a permitted legacy repeater topology or a general ten-hop KNX rule. The trace stops at the first coupler that cannot forward.</p></div>
    </section></details>
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
      <div className="flex flex-wrap gap-5 items-end text-sm">
        <label className="space-y-1">Arrangement<select aria-label="Coupling arrangement" value={mode} onChange={e=>{setMode(e.target.value as typeof mode);reset();}} className="block border border-slate-200 rounded-lg p-2"><option value="parallel">Parallel Star</option><option value="series">Series Cascade (invalid example)</option></select></label>
        <label className="space-y-1">Starting hop count<select aria-label="Starting hop count" value={startHopCount} onChange={e=>{setStartHopCount(Number(e.target.value));reset();}} className="block border border-slate-200 rounded-lg p-2">{Array.from({length:7},(_,i)=><option key={i} value={i}>{i}{i===6?' — normal default':''}</option>)}</select></label>
        <label className="space-y-1">Group-address filter<select aria-label="Routing filter" value={blockedCoupler} onChange={e=>{setBlockedCoupler(e.target.value);reset();}} className="block border border-slate-200 rounded-lg p-2"><option value="">Permit at all couplers</option>{nodes.filter(n=>n.type==='line_coupler'||n.type==='backbone_coupler').map(n=><option key={n.id} value={n.id}>GA absent at {n.address}</option>)}</select></label>
        <label className="space-y-1">Pace<select aria-label="Trace pace" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="block border border-slate-200 rounded-lg p-2"><option value={1800}>Slow</option><option value={1200}>Standard</option><option value={400}>Fast</option></select></label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={start} className="bg-knx-green text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2"><Play size={16}/>{playing?'Pause trace':finished?'Replay trace':step<0?'Transmit telegram':'Resume trace'}</button>
        <button onClick={()=>{setPlaying(false);setStep(s=>Math.min(s+1,trace.length-1));}} disabled={finished} className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-40">Next event</button>
        <button onClick={reset} className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2"><RotateCcw size={16}/>Reset</button>
      </div>
      <p className="text-xs text-slate-500">Selected route only, not the complete physical wiring. Grey = not yet reached; green = reached; red = rejection. Off-path branches are omitted: a repeater has no filter and may also send telegrams into those branches. Ordinary devices do not relay telegrams.</p>
      <HopCountTopology nodes={nodes} trace={trace} step={step} mode={mode}/>
      <div aria-live="polite" className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
        <p><strong>{nodes.length-2} forwarding devices on this selected path.</strong> {step<0?'Ready to trace.':finished?delivered?'Receiver reached.':'Trace stopped.':'Trace in progress.'}</p>
        <p>{current ? `${nodes[step].label} (${nodes[step].address}): ${current.reason}` : 'Transmit or advance one event to see the forwarding decision.'}</p>
      </div>
    </section>
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h3 className="font-bold text-slate-900">Event trace</h3>
      <ol className="space-y-2 text-sm" aria-label="Routing event log">{trace.slice(0,step+1).map((event,i)=><li key={event.id} className={`p-3 rounded-lg ${event.blocked?'bg-rose-50 text-rose-800':'bg-slate-50 text-slate-700'}`}><strong>{i+1}. {nodes[i].label} {nodes[i].address}</strong> — {event.reason}</li>)}</ol>
      {step<0&&<p className="text-sm text-slate-500">No telegram sent yet.</p>}
    </section>
    <details className="detail-box text-sm space-y-3"><summary>Show details · device profiles and sources</summary>
      <h3 className="font-bold flex gap-2 items-center"><Info size={18}/>Repeater and segment coupler are different profiles</h3>
      <p className="text-slate-600">The LR devices in this demonstration are legacy TP1 repeaters: they extend a line without group-address filtering. A modern segment coupler connects subsegments within a logical line and supports filter tables, including ETS-managed individual-address filtering. Do not treat its behavior or permitted arrangement as identical to the legacy repeater example. Neither .64, .128 nor .192 is a required segment boundary.</p>
      <p className="text-slate-600">The normal-traffic HC budget and filtering are separate decisions. Reaching HC 0 on the destination segment is allowed; forwarding it through another coupler is not. A healthy cable and an adequate HC do not override a filter rejection.</p>
      <p className="text-xs text-slate-500">Sources: KNX Basic, “TP Topology”, sections 8 and 14; KNX Advanced, “Couplers”, sections 2.3–2.4. This is a teaching trace, not a complete KNX network validator.</p>
      <a className="text-xs underline text-knx-blue" href="https://support.knx.org/hc/en-us/articles/27352680887442-TP-TP-Couplers-in-Repeater-Mode" target="_blank" rel="noreferrer">KNX Association: repeater versus segment-coupler profiles</a>
    </details>
  </div>;
}
