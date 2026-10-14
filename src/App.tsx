import {CaptureAnalyser} from './components/CaptureAnalyser';
import type {CaptureScenario} from './knx/capture';
import React, {useRef,useState} from 'react';
import {Sliders,Send,Network,Calculator,Layers,Shapes,FileSearch} from 'lucide-react';
import {TelegramVisualizer} from './components/TelegramVisualizer';
import {TopologyExplorer} from './components/TopologyExplorer';
import {HopCountExplorer} from './components/HopCountExplorer';
import {SendingSimulator} from './components/SendingSimulator';
import {DatapointTypesList,DptScenario} from './components/DatapointTypesList';
import {CadSymbols} from './components/CadSymbols';
const navigation=[
 {id:'telegram',label:'Telegram',description:'Fields, bytes and signal',icon:Sliders},
 {id:'capture',label:'Capture analyser',description:'ETS recordings and DPT interpretation',icon:FileSearch},
 {id:'objects',label:'Objects',description:'Sending and C/W flags',icon:Send},
 {id:'routing',label:'Hop Count',description:'Forwarding and filtering',icon:Network},
 {id:'capacity',label:'Topology Capacity Explorer',description:'Addresses and power',icon:Calculator},
 {id:'dpt',label:'DPT workbench',description:'Values and encoding',icon:Layers},
 {id:'symbols',label:'CAD symbols',description:'Drawing reference',icon:Shapes},
] as const;
type Page=typeof navigation[number]['id'];
export default function App() {
 const [page,setPage]=useState<Page>('telegram');
 const [scenario,setScenario]=useState<(DptScenario&{generate?:boolean;destination?:string;origin?:string;captureParams?:CaptureScenario['captureParams']})|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const navigate=(id:string)=>{if(!navigation.some(n=>n.id===id))return;setPage(id as Page);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});};
 const selectDpt=(value:DptScenario)=>{setScenario(value);navigate('telegram');};
 const active=navigation.find(n=>n.id===page)!;
 return <div className="@container/app app-root">
  <a href="#lesson-content" className="skip-link">Skip to lesson</a>
  <div className="app-layout">
   <nav className="learning-nav" aria-label="Learning path">
    <div className="nav-brand"><span className="text-green-700 font-extrabold text-2xl tracking-tight">KNX <span className="text-slate-800">Explorer</span></span><p className="text-xs text-slate-500 mt-2">KNX TP1 simulation and reference</p></div>
    {navigation.map((item,i)=>{const Icon=item.icon;return <button key={item.id} aria-current={page===item.id?'page':undefined} className="nav-item" onClick={()=>navigate(item.id)}><Icon size={19}/><span><span className="nav-number">0{i+1} · </span>{item.label}<small>{item.description}</small></span></button>;})}
    <div className="nav-credit">Marc Sonne Dahl<br/>KNX++ Tutor<br/><span className="text-[11px]">Teaching tool · TP1</span></div>
   </nav>
   <div className="app-main min-w-0">
    <header className="workspace-heading"><div><p className="eyebrow">KNX TP Explorer</p><h1 ref={heading} tabIndex={-1} className="text-xl font-extrabold text-slate-900 outline-none">{active.label}</h1></div></header>
    <main id="lesson-content">
     {page==='symbols'&&<CadSymbols/>}
     <div hidden={page!=='capture'}><CaptureAnalyser onUseTelegram={value=>{setScenario(value);navigate('telegram');}}/></div>
     <div hidden={page==='symbols'||page==='capture'}>
     <TelegramVisualizer scenario={scenario} showControls={page==='telegram'} onConfigure={()=>navigate('telegram')}>
      {page==='objects'&&<SendingSimulator onTransmit={(destination,value)=>setScenario({id:'1.001',values:{value:value?'1':'0'},generate:true,destination,origin:'Objects simulator · Sensor 1.1.1'})}/>}
      {page==='routing'&&<HopCountExplorer/>}
      {page==='capacity'&&<TopologyExplorer/>}
      {page==='dpt'&&<DatapointTypesList onUseTelegram={selectDpt}/>}

     </TelegramVisualizer>
     </div>
    </main>
    <footer className="app-footer">Marc Sonne Dahl · KNX++ Tutor · 2026<br/>Educational simulations and an edition-specific reference. No live bus connection.</footer>
   </div>
  </div>
 </div>;
}
