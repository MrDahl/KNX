import {tr} from '../i18n';
import {useTranslation} from 'react-i18next';
import React, {useId} from 'react';
import {RouteNode, traceRoute} from '../knx/teachingModels';
import {hopCountDevices} from '../knx/routingExample';

const colours={backbone_coupler:'#44546a',line_coupler:'#305496',repeater:'#c55a11',device:'#70ad47',static_device:'#70ad47'};
const ys=[62,132,202,272,342,412,482,552,622];
const position=(node:RouteNode)=>{
 const i=hopCountDevices.findIndex(n=>n.id===node.id),right=i>=9,row=i%9;
 return {x:right?(row%2===0?990:1085):(row%2===0?175:60),y:ys[row],row,right};
};
type Leg={d:string;x:number;y:number};
function leg(from:RouteNode,to:RouteNode,series:boolean):Leg {
 const a=position(from),b=position(to);
 if(from.id==='1.0.0')return {d:`M 310 62 H 990`,x:650,y:48};
 if(from.id==='source')return {d:'M 310 622 H 340 V 552 H 195',x:365,y:590};
 if(to.id==='destination')return {d:'M 1220 552 H 1270 V 622 H 1125',x:1240,y:600};
 if(from.id==='1.1.0')return {d:'M 195 132 H 242 V 86',x:290,y:119};
 if(from.id==='15.0.0')return {d:'M 1125 62 H 1260 V 132 H 1220',x:1205,y:95};
 if(!series&&from.id==='1.1.204')return {d:'M 60 552 H 25 V 132 H 60',x:58,y:108};
 if(!series&&from.id==='15.1.0')return {d:'M 1220 132 H 1290 V 552 H 1220',x:1230,y:175};
 const outer=a.row===7||a.row===3;
 const bend=a.right?(outer?1270:960):(outer?335:25);
 const ax=outer?a.x+135:a.x;
 const bx=outer?b.x+135:b.x;
 return {d:`M ${ax} ${a.y} H ${bend} V ${b.y} H ${bx}`,x:a.right?(outer?1230:932):(outer?365:62),y:(a.y+b.y)/2-8};
}

/** Physical bus wiring and the selected telegram route are separate SVG layers. */
export function HopCountTopology({nodes,trace,step,mode}:{nodes:RouteNode[];trace:ReturnType<typeof traceRoute>;step:number;mode:'series'|'parallel'}) {
 useTranslation();
 const id=useId().replace(/:/g,''),series=mode==='series';
 const visible=trace.slice(0,step+1),blocked=visible.find(e=>e.blocked);
 const stoppedAt=blocked?nodes.findIndex(n=>n.id===blocked.id):-1;
 const title=series?'Series-connected line repeaters':'Parallel-connected line repeaters';
 const busPaths=['M 242 38 V 28 H 1057 V 38'];
 for(const right of [false,true]){
  const col=hopCountDevices.slice(right?9:0,right?18:9).map(position);
  busPaths.push(`M ${col[0].x+67.5} 86 L ${col[1].x+67.5} 108`,`M ${col[1].x+67.5} 156 L ${col[2].x+67.5} 178`);
  if(series){for(let i=2;i<8;i++)busPaths.push(`M ${col[i].x+67.5} ${col[i].y+24} L ${col[i+1].x+67.5} ${col[i+1].y-24}`);}
  else {
   const trunk=right?1242:46;
   busPaths.push(`M ${trunk} 132 V 552`);
   for(const row of [1,3,5,7])busPaths.push(`M ${trunk} ${col[row].y} H ${right?col[row].x+135:col[row].x}`);
   for(const row of [3,5,7])busPaths.push(`M ${col[row].x+67.5} ${col[row].y+24} L ${col[row+1].x+67.5} ${col[row+1].y-24}`);
  }
 }
 return <div className="space-y-3">
  <div className="overflow-x-auto border border-slate-200 bg-white rounded-lg" role="region" aria-label={tr("Scrollable Hop Count diagram")} tabIndex={0}>
   <svg viewBox="0 0 1320 810" className="w-full min-w-[1000px]" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>{tr(title)}</title>
    <desc id={`${id}-desc`}>{tr("Two area couplers across the top, line 1.1 on the left and line 15.1 on the right. Dashed green lines show TP bus connections. Arrows show only the selected path from 1.1.252 to 15.1.255. HC labels appear as the trace advances. Red dotted arrows mark the unreached remainder after a rejection.")}</desc>
    <defs>{[['route','#111827'],['unreached','#dc2626'],['delivered','#509e2f']].map(([name,colour])=><marker key={name} id={`${id}-${name}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke={colour} strokeWidth="1.5"/></marker>)}</defs>
    <g aria-label={tr("KNX TP bus connections")} fill="none" stroke="#70ad47" strokeWidth="3" strokeDasharray="12 9">{busPaths.map((d,i)=><path key={i} d={d}/>)}</g>
    <text x="660" y="195" textAnchor="middle" fontSize="23" fill="#111827">{tr(title)}</text>
    <text x="660" y="225" textAnchor="middle" fontSize="15" fill={series?'#b91c1c':'#475569'}>{series?tr("Invalid legacy-repeater arrangement"):tr("Repeaters connected to the main segment")}</text>
    <g aria-label={tr("Selected telegram path")}>{nodes.slice(1).map((to,i)=>{
     const from=nodes[i],edge=leg(from,to,series),arrival=visible.find(e=>e.id===to.id),sent=trace.find(e=>e.id===from.id);
     const unreached=stoppedAt>=0&&i>=stoppedAt,reached=!!arrival,delivered=reached&&to.id==='destination';
     const stroke=unreached?'#dc2626':delivered?'#509e2f':reached?'#111827':'#cbd5e1';
     return <g key={to.id} data-route-to={to.id} data-route-state={unreached?'not-reached':reached?'reached':'pending'}>
      <path d={edge.d} fill="none" stroke={stroke} strokeWidth={delivered?3:2} strokeDasharray={unreached?'2 4':reached?undefined:'5 5'} markerEnd={reached||unreached?`url(#${id}-${unreached?'unreached':delivered?'delivered':'route'})`:undefined}/>
      {reached&&<g><rect x={edge.x-45} y={edge.y-16} width="90" height="24" fill="white"/><text x={edge.x} y={edge.y+1} textAnchor="middle" fontSize="16" fill={stroke}>HC = {sent?.after}</text></g>}
     </g>;
    })}</g>
    {hopCountDevices.map(node=>{
     const p=position(node),event=visible.find(e=>e.id===node.id),active=trace[step]?.id===node.id,rejected=!!event?.blocked;
     return <g key={node.id} data-device-address={node.address}>
      <title>{`${tr(node.label)} · ${node.address}${event?` · ${tr(event.reason)}`:''}`}</title>
      {(active||rejected)&&<rect x={p.x-5} y={p.y-29} width="145" height="58" fill="none" stroke={rejected?'#dc2626':'#111827'} strokeWidth="3"/>}
      <rect x={p.x} y={p.y-24} width="135" height="48" fill={colours[node.type]} stroke="#24334a"/>
      <text x={p.x+67.5} y={p.y+7} textAnchor="middle" fill="white" fontSize="23">{node.address}</text>
      {rejected&&<text x={p.right?p.x-15:p.x+150} y={p.y-33} textAnchor={p.right?'end':'start'} fontSize="16" fill="#b91c1c">STOP · HC = {event.before}</text>}
     </g>;
    })}
    <text x="242" y="670" textAnchor="middle" fontSize="15" fill="#334155">{tr("Source · line 1.1")}</text>
    <text x="1057" y="670" textAnchor="middle" fontSize="15" fill="#334155">{tr("Receiver · line 15.1")}</text>
    {blocked&&<g><rect x="430" y="290" width="460" height="82" rx="6" fill="#fff1f2" stroke="#fecaca"/><text x="660" y="319" textAnchor="middle" fontSize="18" fill="#b91c1c">{tr("Forwarding stopped at")} {nodes[stoppedAt].address}</text><text x="660" y="348" textAnchor="middle" fontSize="16" fill="#b91c1c">{tr("Red dotted path: not reached")}</text></g>}
    {[['Area coupler',colours.backbone_coupler],['Line coupler',colours.line_coupler],['Line repeater',colours.repeater],['Bus device',colours.device]].map(([label,fill],i)=><g key={label}><rect x={35+i*265} y="699" width="255" height="46" fill={fill} stroke="#24334a"/><text x={162.5+i*265} y="728" textAnchor="middle" fill="white" fontSize="17">{tr(label)}</text></g>)}
    <path d="M 1105 711 H 1285" stroke="#70ad47" strokeWidth="3" strokeDasharray="12 9"/><text x="1195" y="738" textAnchor="middle" fontSize="16">{tr("KNX TP bus")}</text>
    <text x="35" y="786" fontSize="15" fill="#475569">{tr("Solid arrow: traced telegram · grey dashed: pending · red dotted: not reached · outline: current event / rejection")}</text>
   </svg>
  </div>
  <p className="text-xs text-slate-500">{tr("HC = hop count. Device colours identify their functions, not reception status. The arrows trace one selected path; telegram propagation into other branches is not animated. Bus devices do not forward telegrams. Addresses are examples; power supplies are omitted.")}</p>
 </div>;
}
