import React, {useRef,useState} from 'react';
import {Sliders,Send,Network,Layers,FlaskConical,ArrowRight,Shapes} from 'lucide-react';
import {TelegramVisualizer} from './components/TelegramVisualizer';
import {TopologyExplorer} from './components/TopologyExplorer';
import {RoutingCounterExplorer} from './components/RoutingCounterExplorer';
import {SendingSimulator} from './components/SendingSimulator';
import {DatapointTypesList,DptScenario} from './components/DatapointTypesList';
import {CadSymbols} from './components/CadSymbols';
import {PredictionExercises} from './components/PredictionExercises';
const navigation=[
 {id:'telegram',label:'Telegram',description:'Build and inspect',icon:Sliders},
 {id:'objects',label:'Objects',description:'Sending and C/W flags',icon:Send},
 {id:'topology',label:'Topology',description:'Hop count and power',icon:Network},
 {id:'dpt',label:'DPT workbench',description:'Values and encoding',icon:Layers},
 {id:'exercises',label:'Exercises',description:'Predict → run → explain',icon:FlaskConical},
 {id:'symbols',label:'CAD symbols',description:'Drawing reference',icon:Shapes},
] as const;
type Page=typeof navigation[number]['id'];
export default function App() {
 const [page,setPage]=useState<Page>('telegram');
 const [topology,setTopology]=useState<'routing'|'capacity'>('routing');
 const [scenario,setScenario]=useState<(DptScenario&{generate?:boolean;destination?:string;origin?:string})|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const navigate=(id:string)=>{if(!navigation.some(n=>n.id===id))return;setPage(id as Page);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});};
 const selectDpt=(value:DptScenario)=>{setScenario(value);navigate('telegram');};
 const active=navigation.find(n=>n.id===page)!;
 return <div className="@container/app app-root">
  <a href="#lesson-content" className="skip-link">Skip to lesson</a>
  <div className="app-layout">
   <nav className="learning-nav" aria-label="Learning path">
    <div className="nav-brand"><span className="text-green-700 font-extrabold text-2xl tracking-tight">KNX <span className="text-slate-800">Explorer</span></span><p className="text-xs text-slate-500 mt-2">Learn the bus, one idea at a time.</p></div>
    {navigation.map((item,i)=>{const Icon=item.icon;return <button key={item.id} aria-current={page===item.id?'page':undefined} className="nav-item" onClick={()=>navigate(item.id)}><Icon size={19}/><span><span className="nav-number">0{i+1} · </span>{item.label}<small>{item.description}</small></span></button>;})}
    <div className="nav-credit">Marc Sonne Dahl<br/>KNX++ Tutor<br/><span className="text-[11px]">Teaching tool · TP1</span></div>
   </nav>
   <div className="app-main min-w-0">
    <header className="workspace-heading"><div><p className="eyebrow">KNX TP Explorer · learning workspace</p><h1 ref={heading} tabIndex={-1} className="text-xl font-extrabold text-slate-900 outline-none">{active.label}</h1></div><span className="text-xs text-slate-500">Predict <ArrowRight size={12} className="inline"/> run <ArrowRight size={12} className="inline"/> explain</span></header>
    <main id="lesson-content">
     {page==='symbols'&&<CadSymbols/>}
     <div hidden={page==='symbols'}>
     <TelegramVisualizer scenario={scenario} showControls={page==='telegram'} onConfigure={()=>navigate('telegram')}>
      {page==='objects'&&<SendingSimulator onTransmit={(destination,value)=>setScenario({id:'1.001',values:{value:value?'1':'0'},generate:true,destination,origin:'Objects exercise · Sensor 1.1.1'})}/>}
      {page==='topology'&&<div className="space-y-4"><div className="flex flex-wrap gap-2" role="group" aria-label="Topology lesson"><button className="lesson-button" aria-pressed={topology==='routing'} onClick={()=>setTopology('routing')}>Routing Counter</button><button className="lesson-button" aria-pressed={topology==='capacity'} onClick={()=>setTopology('capacity')}>Topology Capacity Explorer</button></div>{topology==='routing'?<RoutingCounterExplorer/>:<TopologyExplorer/>}</div>}
      {page==='dpt'&&<DatapointTypesList onUseTelegram={selectDpt}/>}
      {page==='exercises'&&<PredictionExercises onTelegram={value=>setScenario({id:'1.001',values:{value},generate:true,origin:'ON becomes OFF exercise'})}/>}
     </TelegramVisualizer>
     </div>
    </main>
    <footer className="app-footer">Marc Sonne Dahl · KNX++ Tutor · 2026<br/>Educational simulations and an edition-specific reference. No live bus connection.</footer>
   </div>
  </div>
 </div>;
}
