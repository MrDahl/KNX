import React, {useEffect,useRef,useState} from 'react';
import {PanelBottomOpen,X} from 'lucide-react';

/** CSS and ResizeObserver both use the workspace's width, never the viewport width. */
export function MonitorDock({children,controls,openRevision=0,actions}:{children:React.ReactNode;controls:React.ReactNode;openRevision?:number;actions?:React.ReactNode}) {
 const root=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),launcher=useRef<HTMLButtonElement>(null);
 const [compact,setCompact]=useState(false),[open,setOpen]=useState(false);
 const touchY=useRef<number|null>(null);
 useEffect(()=>{
  if(!root.current||typeof ResizeObserver==='undefined')return;
  const resize=new ResizeObserver(entries=>setCompact(entries[0].contentRect.width<1000));resize.observe(root.current);return()=>resize.disconnect();
 },[]);
 useEffect(()=>{if(openRevision>0&&compact)setOpen(true);},[openRevision]);
 useEffect(()=>{
  const d=dialog.current;if(!d)return;
  if(d.open)d.close();
  if(compact&&open)d.showModal();else if(!compact)d.show();
  if(compact&&open){const prev=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=prev;};}
 },[compact,open]);
 const close=()=>{setOpen(false);launcher.current?.focus();};
 return <div ref={root} className="@container/workspace monitor-workspace">
  <div className="workspace-grid">
   <div className="@container controls-pane min-w-0">{controls}</div>
   <dialog ref={dialog} aria-label="Telegram monitor" className="monitor-dock @container" data-compact={compact} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(compact&&e.target===dialog.current)close();}}>
    <div className="monitor-header" onPointerDown={e=>{touchY.current=e.clientY;}} onPointerUp={e=>{if(compact&&touchY.current!==null&&e.clientY-touchY.current>60)close();touchY.current=null;}}>
     <div><span className="drawer-handle"/><p className="eyebrow">Observe · explain</p><h2 className="text-lg font-extrabold text-slate-900">Telegram monitor</h2></div>
     {compact&&<button autoFocus onClick={close} className="icon-button" aria-label="Close telegram monitor"><X size={20}/></button>}
    </div>
    <div className="monitor-content">{children}</div>
   </dialog>
  </div>
  <div className="workspace-actions">{actions}<button ref={launcher} onClick={()=>setOpen(true)} onPointerDown={e=>{touchY.current=e.clientY;}} onPointerUp={e=>{if(touchY.current!==null&&touchY.current-e.clientY>35)setOpen(true);touchY.current=null;}} className="monitor-launch" aria-haspopup="dialog" aria-expanded={compact&&open}><PanelBottomOpen size={18}/>Telegram monitor<span className="text-xs">↑</span></button></div>
 </div>;
}
