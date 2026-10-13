import React, {useId} from 'react';
import {RouteNode, traceRoute} from '../knx/teachingModels';

/** Course-style hierarchy; the trace model remains the sole source of event state. */
export function HopCountTopology({nodes, trace, step, mode}: {
  nodes: RouteNode[]; trace: ReturnType<typeof traceRoute>; step: number; mode: 'series'|'parallel';
}) {
  const marker = useId().replace(/:/g,'');
  const cascade = mode === 'series';
  const deviceY = cascade ? 825 : 585;
  const height = deviceY + 110;
  const center = (right:boolean) => right ? 815 : 285;
  const yFor = (node:RouteNode) => {
    if (node.type === 'device') return deviceY;
    if (node.type === 'backbone_coupler') return 135;
    if (node.type === 'line_coupler') return 285;
    if (!cascade) return 435;
    return 435 + (Number(node.address.split('.')[2])/64-1)*120;
  };
  const rightSide = (node:RouteNode) => node.address.startsWith('15.');
  const seen = (id:string) => trace.findIndex(e=>e.id===id)>=0 && trace.findIndex(e=>e.id===id)<=step;
  const event = (id:string) => trace.find(e=>e.id===id);
  const outgoing = (id:string) => seen(id) && !event(id)?.blocked;
  const lineColor = (active:boolean) => active ? '#509E2F' : '#cbd5e1';
  const badge = (x:number,y:number,id:string) => {
    const active=outgoing(id);
    return <g transform={`translate(${x},${y-13})`}><rect width="85" height="26" rx="13" fill={active?'#dcfce7':'#f1f5f9'}/><text x="42.5" y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill={active?'#166534':'#64748b'}>{active?`HC ${event(id)!.after}`:'HC —'}</text></g>;
  };
  const bus = (right:boolean,y:number,label:string,origin:string) => <g key={`${right}-${y}`}>
    <line x1={right?645:115} x2={right?985:455} y1={y} y2={y} stroke={lineColor(outgoing(origin))} strokeWidth="3"/>
    <text x={right?650:120} y={y-16} fontSize="13" fontWeight="600" fill="#475569">{label}</text>
    {badge(right?900:370,y-17,origin)}
  </g>;
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
      <span><strong className="text-slate-900">Read the route:</strong> source ↑ backbone → receiver ↓</span>
      <span><strong>HC</strong> = hop count</span>
    </div>
    <div className="overflow-x-auto rounded-xl bg-slate-50 border border-slate-200">
      <svg viewBox={`0 0 1100 ${height}`} className="w-full min-w-[760px]" role="img" aria-label="Hierarchical KNX topology: source rises through Area 1 to the backbone and descends through Area 15 to the receiver">
        <title>Backbone, area main lines, secondary lines and repeater segments — course-style hop-count hierarchy.</title>
        <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#509E2F"/></marker></defs>
        <rect x="75" y="107" width="420" height={height-130} rx="18" fill="#eff6ff" fillOpacity=".55" stroke="#dbeafe"/>
        <rect x="605" y="107" width="420" height={height-130} rx="18" fill="#f0fdf4" fillOpacity=".55" stroke="#dcfce7"/>
        <text x="100" y="130" fontSize="12" fontWeight="800" fill="#1e40af">AREA 1</text>
        <text x="630" y="130" fontSize="12" fontWeight="800" fill="#166534">AREA 15</text>
        <text x="550" y="29" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">Backbone line 0.0</text>
        <text x="550" y="49" textAnchor="middle" fontSize="12" fill="#64748b">Connects the areas</text>
        <line x1="115" x2="985" y1="80" y2="80" stroke={lineColor(outgoing('1.0.0'))} strokeWidth="3"/>
        {nodes.slice(1).map((node,index)=>{
          const from=nodes[index],right=rightSide(from),x1=center(right),x2=center(rightSide(node));
          const y1=yFor(from),y2=yFor(node);
          const backbone=from.type==='backbone_coupler'&&node.type==='backbone_coupler';
          const d=backbone?`M ${x1} ${y1} V 80 H ${x2} V ${y2}`:
            right?`M ${x1} ${y1+64} V ${y2}`:`M ${x1} ${y1} V ${y2+64}`;
          const active=outgoing(from.id);
          return <g key={node.id}>
            <path d={d} fill="none" stroke="#cbd5e1" strokeWidth="3"/>
            {active&&<path d={d} fill="none" stroke="#509E2F" strokeWidth="3" markerEnd={`url(#${marker})`}/>}
          </g>;
        })}
        {badge(508,80,'1.0.0')}
        {[false,true].map(right=>{
          const prefix=right?'15.15':'1.1';
          return <g key={prefix}>
            {bus(right,245,`Main line ${right?'15':'1'}.0`,right?'15.0.0':'1.1.0')}
            {bus(right,395,`Line ${prefix} · main segment`,right?'15.15.0':cascade?'1.1.64':'1.1.192')}
            {cascade&&<>
              {bus(right,535,'Segment 2',right?`${prefix}.64`:`${prefix}.128`)}
              {bus(right,655,'Segment 3',right?`${prefix}.128`:`${prefix}.192`)}
            </>}
            {bus(right,deviceY-40,`Line ${prefix} · segment 4`,right?'15.15.192':'source')}
          </g>;
        })}
        <text x="550" y="237" textAnchor="middle" fontSize="12" fill="#64748b">Main lines</text>
        <text x="550" y="387" textAnchor="middle" fontSize="12" fill="#64748b">Secondary lines</text>
        <text x="550" y={deviceY-48} textAnchor="middle" fontSize="12" fill="#64748b">Line segments</text>
        {nodes.map((node,index)=>{
          const x=center(rightSide(node))-110,y=yFor(node),e=event(node.id),reached=seen(node.id),blocked=reached&&e?.blocked;
          const abbr=node.type==='backbone_coupler'?'BC':node.type==='line_coupler'?'LC':node.type==='repeater'?'LR':node.id==='source'?'TX':'RX';
          const label=node.type==='device'?(node.id==='source'?'Source device':'Receiving device'):node.label;
          const tint=node.type==='backbone_coupler'?'#e0f2fe':node.type==='line_coupler'?'#fef9c3':node.type==='repeater'?'#dcfce7':'#f1f5f9';
          return <g key={node.id} transform={`translate(${x},${y})`}>
            <rect width="220" height="64" rx="10" fill={blocked?'#fff1f2':'white'} stroke={blocked?'#be123c':reached?'#509E2F':'#cbd5e1'} strokeWidth={index===step?3:1.5}/>
            <rect x="9" y="12" width="34" height="34" rx="7" fill={tint}/><text x="26" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155">{abbr}</text>
            <text x="52" y="19" fontSize="12" fontWeight="700" fill="#334155">{label}</text>
            <text x="52" y="37" fontSize="13" fontFamily="monospace" fill="#334155">{node.address}</text>
            <text x="52" y="54" fontSize="11" fill={blocked?'#be123c':reached?'#166534':'#64748b'}>{reached?blocked?`STOP · incoming HC ${e!.before}`:e!.forwarded?`HC ${e!.before} → ${e!.after}`:`HC ${e!.after}`:'Not yet reached'}</text>
          </g>;
        })}
        <text x="285" y={deviceY+88} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e40af">SOURCE · telegram travels upward</text>
        <text x="815" y={deviceY+88} textAnchor="middle" fontSize="13" fontWeight="700" fill="#166534">DESTINATION · telegram travels downward</text>
      </svg>
    </div>
    <p className="text-xs text-slate-500">BC = backbone/area coupler · LC = line coupler · LR = legacy line repeater. Horizontal strokes are TP bus sections, not extra hops. A repeater segment stays within its line: its devices keep the same Area.Line prefix. Other branches and power supplies are omitted.</p>
  </div>;
}
