import {APCICode, type TelegramByte, type TelegramParams, type KNXAddressGroup} from '../types';
import {type Values} from './dptCodec';
import {dptSummary} from '../dptPresentation';
export interface FrameSnapshot {bytes:TelegramByte[];params:TelegramParams;payload:string;values:Values}
export function snapshot(bytes:TelegramByte[],params:TelegramParams,payload:string,values:Values):FrameSnapshot {
 return structuredClone({bytes,params,payload,values});
}
export function frameFacts(frame:FrameSnapshot) {
 const p=frame.params,d=p.destination as KNXAddressGroup;
 return {Source:`${p.source.area}.${p.source.line}.${p.source.device}`,Destination:`${d.main}/${d.middle}/${d.sub}`,Service:({[APCICode.GroupValueWrite]:'GroupValueWrite',[APCICode.GroupValueRead]:'GroupValueRead',[APCICode.GroupValueResponse]:'GroupValueResponse'}[p.command]),Value:p.command===APCICode.GroupValueRead?'No value payload':dptSummary(p.dptType,frame.payload,frame.values),'Datapoint type':p.command===APCICode.GroupValueRead?'—':p.dptType,Priority:({'00':'System (00)','10':'Alarm / urgent (10)','01':'High / normal (01)','11':'Low (11)'}[p.priority]),'Repeat flag':p.repeatFlag==='1'?'Original':'Repeated','Hop count':String(p.hopCount)};
}
// Match by role: the check byte remains the last column even when payload lengths differ.
export function compareBytes(before:TelegramByte[],after:TelegramByte[]) {
 const count=Math.max(before.length,after.length)-1;
 return Array.from({length:count+1},(_,index)=>{
  const a=index===count?before.at(-1):before[index]?.index===before.length-1?undefined:before[index];
  const b=index===count?after.at(-1):after[index]?.index===after.length-1?undefined:after[index];
  return {before:a,after:b,changed:a?.hex!==b?.hex,check:index===count};
 });
}
