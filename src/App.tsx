import {tr,i18n,setLanguage,type Language} from './i18n';
import {useTranslation} from 'react-i18next';
import type {CaptureScenario} from './knx/capture';
import React, {useRef,useState,useLayoutEffect} from 'react';
import {LessonBoundary,lessons} from './components/LazyLessons';
import {Sliders,Send,Network,Calculator,Layers,Shapes,FileSearch} from 'lucide-react';
import {TelegramVisualizer} from './components/TelegramVisualizer';
import type {DptScenario} from './components/DatapointTypesList';
const CaptureAnalyser=lessons.CaptureAnalyser;
const TopologyExplorer=lessons.TopologyExplorer;
const HopCountExplorer=lessons.HopCountExplorer;
const SendingSimulator=lessons.SendingSimulator;
const DatapointTypesList=lessons.DatapointTypesList;
const CadSymbols=lessons.CadSymbols;
const explorerLogo=new URL('../assets/KNX_explorer_logo.svg',import.meta.url).href;
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
 useTranslation();
 useLayoutEffect(()=>{window.scrollTo({top:0,left:0,behavior:'instant'});},[]);
 const [page,setPage]=useState<Page>('telegram');
 const [captureVisited,setCaptureVisited]=useState(false);
 const [languageBusy,setLanguageBusy]=useState(false);
 const [languageError,setLanguageError]=useState('');
 const changeLanguage=async(language:Language)=>{setLanguageBusy(true);setLanguageError('');try{await setLanguage(language);}catch{setLanguageError('Could not load the language. Please try again.');}finally{setLanguageBusy(false);}};
 const [scenario,setScenario]=useState<(DptScenario&{generate?:boolean;destination?:string;origin?:string;captureParams?:CaptureScenario['captureParams']})|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const navigate=(id:string)=>{if(!navigation.some(n=>n.id===id))return;if(id==='capture')setCaptureVisited(true);setPage(id as Page);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});};
 const selectDpt=(value:DptScenario)=>{setScenario(value);navigate('telegram');};
 const active=navigation.find(n=>n.id===page)!;
 return <div className="@container/app app-root">
  <a href="#lesson-content" className="skip-link">{tr("Skip to lesson")}</a>
  <div className="app-layout">
   <nav className="learning-nav" aria-label={tr("Learning path")}>
    <div className="nav-brand"><img src={explorerLogo} alt="KNX Explorer" width="170" height="108" className="nav-logo"/><p className="text-xs text-slate-500 mt-2">{tr("KNX TP1 simulation and reference")}</p></div>
    {navigation.map((item,i)=>{const Icon=item.icon;return <button key={item.id} aria-current={page===item.id?'page':undefined} className="nav-item" onClick={()=>navigate(item.id)}><Icon size={19}/><span><span className="nav-number">0{i+1} · </span>{tr(item.label)}<small>{tr(item.description)}</small></span></button>;})}
    <div className="nav-credit">Marc Sonne Dahl<br/>KNX++ Tutor<br/><span className="text-[11px]">{tr("Teaching tool · TP1")}</span></div>
   </nav>
   <div className="app-main min-w-0">
    <header className="workspace-heading"><div className="workspace-title"><img src={explorerLogo} alt="KNX Explorer" width="170" height="108" className="header-logo"/><div><p className="eyebrow">KNX TP Explorer</p><h1 ref={heading} tabIndex={-1} className="text-xl font-extrabold text-slate-900 outline-none">{tr(active.label)}</h1></div></div><label className="language-selector"><span>{i18n.language==='da'?'Sprog':'Language'}</span><select aria-label={i18n.language==='da'?'Sprog':'Language'} value={i18n.language} disabled={languageBusy} onChange={e=>void changeLanguage(e.target.value as Language)}><option value="en" lang="en">English</option><option value="da" lang="da">Dansk</option></select></label></header>
    {languageError&&<p role="alert">{tr(languageError)}</p>}
    <main id="lesson-content">
     {page==='symbols'&&<LessonBoundary><CadSymbols/></LessonBoundary>}
     {captureVisited&&<div hidden={page!=='capture'}><LessonBoundary><CaptureAnalyser onUseTelegram={value=>{setScenario(value);navigate('telegram');}}/></LessonBoundary></div>}
     <div hidden={page==='symbols'||page==='capture'}>
     <TelegramVisualizer scenario={scenario} showControls={page==='telegram'} onConfigure={()=>navigate('telegram')}>
      {page==='objects'&&<LessonBoundary><SendingSimulator onTransmit={(destination,value)=>setScenario({id:'1.001',values:{value:value?'1':'0'},generate:true,destination,origin:'Objects simulator · Sensor 1.1.1'})}/></LessonBoundary>}
      {page==='routing'&&<LessonBoundary><HopCountExplorer/></LessonBoundary>}
      {page==='capacity'&&<LessonBoundary><TopologyExplorer/></LessonBoundary>}
      {page==='dpt'&&<LessonBoundary><DatapointTypesList onUseTelegram={selectDpt}/></LessonBoundary>}

     </TelegramVisualizer>
     </div>
    </main>
    <footer className="app-footer">Marc Sonne Dahl · KNX++ Tutor · 2026<br/>{tr("Educational simulations and an edition-specific reference. No live bus connection.")}<details className="mt-3"><summary className="cursor-pointer underline">{tr('Licence and attribution')}</summary><div className="mt-2 space-y-2 max-w-2xl mx-auto"><p>{tr('Application code: noncommercial use, modification and sharing with attribution. CAD drawings by Marc Sonne Dahl: commercial use permitted under MIT.')}</p><p>{tr('KNX and ETS are registered trademarks of KNX Association. Its standards, documentation, course materials and branding remain protected by their respective rights. This independent app is not affiliated with, endorsed by or certified by KNX Association.')}</p><a className="underline" href="https://github.com/MrDahl/KNX/blob/main/LICENSE">{tr('Read the licence terms')}</a></div></details></footer>
   </div>
  </div>
 </div>;
}
