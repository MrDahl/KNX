import React,{lazy,Suspense} from 'react';
import {tr} from '../i18n';
// Each import is triggered by its first render, not by initial app startup.
export const lessonLoaders={
 CaptureAnalyser:()=>import('./CaptureAnalyser').then(m=>({default:m.CaptureAnalyser})),
 DatapointTypesList:()=>import('./DatapointTypesList').then(m=>({default:m.DatapointTypesList})),
 TopologyExplorer:()=>import('./TopologyExplorer').then(m=>({default:m.TopologyExplorer})),
 HopCountExplorer:()=>import('./HopCountExplorer').then(m=>({default:m.HopCountExplorer})),
 SendingSimulator:()=>import('./SendingSimulator').then(m=>({default:m.SendingSimulator})),
 CadSymbols:()=>import('./CadSymbols').then(m=>({default:m.CadSymbols})),
};
export const lessons={
 CaptureAnalyser:lazy(lessonLoaders.CaptureAnalyser),
 DatapointTypesList:lazy(lessonLoaders.DatapointTypesList),
 TopologyExplorer:lazy(lessonLoaders.TopologyExplorer),
 HopCountExplorer:lazy(lessonLoaders.HopCountExplorer),
 SendingSimulator:lazy(lessonLoaders.SendingSimulator),
 CadSymbols:lazy(lessonLoaders.CadSymbols),
};
class LessonError extends React.Component<{children:React.ReactNode},{failed:boolean}> {
 declare props:{children:React.ReactNode};
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p role="alert">{tr('Could not load this lesson. Reload the page to try again.')}</p>:this.props.children;}
}
export function LessonBoundary({children}:{children:React.ReactNode}) {
 return <LessonError><Suspense fallback={<p role="status">{tr('Loading lesson…')}</p>}>{children}</Suspense></LessonError>;
}
