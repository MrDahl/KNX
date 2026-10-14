import catalogue from './dptCatalogue.json';
import { DPT_INPUTS, defaults, encodeDpt, type Values } from './dptCodec';
import { decodeDptHex } from './dptDecode';
import { APCICode, type TelegramParams } from '../types';
import type { TelegramField } from './telegramFields';
export type CaptureScenario={id:string;values:Values;generate:true;destination:string;origin:string;captureParams:TelegramParams};
export type CaptureByte={hex:string;bits:string;label:string;field?:TelegramField};
export type CaptureRecord={index:number;timestamp:string;service:string;raw:string;error?:string;source?:string;destination?:string;group?:boolean;hopCount?:number;priority?:number;control?:number;standard?:boolean;operation?:string;apci?:number;payload?:string;compact?:boolean;groupValue?:boolean;bytes:CaptureByte[]};
const hx=(n:number)=>n.toString(16).padStart(2,'0').toUpperCase();
const individual=(n:number)=>`${n>>12}.${n>>8&15}.${n&255}`;
export function parseCaptureRecord(raw:string,timestamp='',service='',index=1):CaptureRecord {
 const row:CaptureRecord={index,timestamp,service,raw,bytes:[]};
 try {
  const hex=raw.replace(/\s/g,'');
  if(!/^(?:[\da-f]{2})+$/i.test(hex))throw Error('RawData must contain complete hexadecimal bytes.');
  const b=hex.match(/../g)!.map(v=>parseInt(v,16));row.raw=b.map(hx).join(' ');
  row.bytes=b.map(n=>({hex:hx(n),bits:n.toString(2).padStart(8,'0'),label:'Raw byte'}));
  if(![0x11,0x29,0x2e].includes(b[0]))throw Error('This cEMI service is not supported; raw bytes are preserved.');
  const expected={17:'L_Data.req',41:'L_Data.ind',46:'L_Data.con'}[b[0]]!;
  if(service&&service!==expected)throw Error('Service attribute disagrees with the cEMI message code.');
  row.service=expected;
  const o=2+b[1];if(b.length<o+9)throw Error('Truncated cEMI frame.');
  const len=b[o+6];if(b.length!==o+8+len)throw Error('cEMI length field does not match the available bytes.');
  row.control=b[o];row.standard=!!(b[o]&128);row.group=!!(b[o+1]&128);row.hopCount=b[o+1]>>4&7;row.priority=b[o]>>2&3;
  row.source=individual(b[o+2]*256+b[o+3]);const dst=b[o+4]*256+b[o+5];
  row.destination=row.group?`${dst>>11}/${dst>>8&7}/${dst&255}`:individual(dst);
  row.apci=((b[o+7]&3)<<2)|(b[o+8]>>6);
  row.groupValue=row.group&&(b[o+7]&252)===0&&row.apci<=2;
  row.operation=row.groupValue?['GroupValueRead','GroupValueResponse','GroupValueWrite'][row.apci]:'Other service / transport';
  row.compact=len===1;row.payload=row.apci===0&&row.groupValue?'':row.compact?hx(b[o+8]&63):b.slice(o+9).map(hx).join(' ');
  if(row.groupValue&&((row.apci===0&&(len!==1||(b[o+8]&63)!==0))||(len>1&&(b[o+8]&63)!==0)))throw Error('Invalid group-value payload layout.');
  const labels:[string,TelegramField?][]=[['cEMI message code'],['Additional-info length'],...b.slice(2,o).map(()=>['Additional information'] as [string]),['Control 1','control'],['Control 2 / Hop Count','routing'],['Source high','source'],['Source low','source'],['Destination high','destination'],['Destination low','destination'],['TPDU length − 1','routing'],['TPCI / APCI','data'],['APCI / compact data','data'],...b.slice(o+9).map((_,i)=>[`Payload byte ${i+1}`,'data'] as [string,TelegramField])];
  row.bytes.forEach((byte,i)=>{byte.label=labels[i][0];byte.field=labels[i][1];});
 } catch(e){row.error=e instanceof Error?e.message:'Cannot parse this record.';}
 return row;
}
export function parseCaptureXml(text:string,Parser:typeof DOMParser=DOMParser):CaptureRecord[]{
 if(text.length>5_000_000)throw Error('Use a recording smaller than 5 MB.');
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML document types and entities are not supported.');
 const doc=new Parser().parseFromString(text,'application/xml');
 if(doc.getElementsByTagName('parsererror').length||doc.documentElement.localName!=='CommunicationLog'||doc.documentElement.namespaceURI!=='http://knx.org/xml/telegrams/01')throw Error('Choose an ETS CommunicationLog XML export (telegrams/01).');
 const nodes=Array.from(doc.getElementsByTagNameNS('http://knx.org/xml/telegrams/01','Telegram'));
 if(!nodes.length)throw Error('No telegram records found.');if(nodes.length>10000)throw Error('Use a recording containing at most 10,000 telegrams.');
 // ConnectionName, Host and ConnectionOptions never enter application state.
 return nodes.map((n,i)=>parseCaptureRecord(n.getAttribute('RawData')??'',n.getAttribute('Timestamp')??'',n.getAttribute('Service')??'',i+1));
}
export function sizeBits(size:string):number|null {const m=size.match(/^(\d+)\s*(bits?|bytes?|octets?)$/i);return m?Number(m[1])*(/^bit/i.test(m[2])?1:8):null;}
export function candidateDpts(row:CaptureRecord){
 if(row.error||!row.groupValue||row.apci===0)return [];
 return catalogue.filter(d=>{const size=DPT_INPUTS[d.id]?.size??sizeBits(d.size);return size!==null&&(row.compact?size<=6&&parseInt(row.payload!,16)<2**size:size===(row.payload!.replace(/ /g,'').length/2)*8);});
}
export function decodeCapture(row:CaptureRecord,id:string){
 if(!candidateDpts(row).some(d=>d.id===id))throw Error('This DPT does not fit the observed payload encoding.');
 return decodeDptHex(id,row.payload!);
}
export function captureScenario(row:CaptureRecord,id:string):CaptureScenario{
 if(row.error||!row.groupValue||!row.standard||row.destination==='0/0/0'||(row.control!&0x53)!==0x10)throw Error('This frame is outside the standard group visualiser’s supported scope.');
 const spec=DPT_INPUTS[id];if(!spec||spec.telegramAllowed===false||spec.size>112)throw Error('Choose a supported subtype of at most 14 bytes.');
 const read=row.apci===0, decoded=read?null:decodeCapture(row,id),values=read?defaults(id):decoded!.values;
 if(decoded&&encodeDpt(id,values)!==decoded.bits)throw Error('This interpretation cannot round-trip the captured payload exactly.');
 const [area,line,device]=row.source!.split('.').map(Number),[main,middle,sub]=row.destination!.split('/').map(Number);
 const params:TelegramParams={source:{area,line,device},destination:{main,middle,sub},hopCount:row.hopCount!,priority:row.priority!.toString(2).padStart(2,'0') as TelegramParams['priority'],repeatFlag:row.control!&32?'1':'0',targetType:'1',command:[APCICode.GroupValueRead,APCICode.GroupValueResponse,APCICode.GroupValueWrite][row.apci!],dptType:id,ackType:'CC'};
 return {id,values,generate:true,destination:row.destination!,captureParams:params,origin:`Capture record ${row.index} · reconstructed TP1 frame; check byte, serial timing and waveform are generated. ACK is not captured. ${read?'Read request has no value.':`DPT ${id} is a selected interpretation.`}`};
}
