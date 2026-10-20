import {DPT_INPUTS,type Values} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {dptLayout} from './dptLayout';
import {EXPANDED_DPTS} from './dptExpandedCodec';
export type InspectedField={name:string;start:number;end:number;bits:string;raw:string;meaning:string};
/** Offsets refer to the padded value view, never to a complete TP1 telegram. */
export function inspectDpt(id:string,bits:string,context:Values):{padded:string;padding:number;fields:InspectedField[]} {
 const padded=bits.padStart(Math.ceil(bits.length/8)*8,'0'),padding=padded.length-bits.length;
 const values=decodeDptHex(id,payloadHex(bits),context).values;
 const spec=DPT_INPUTS[id],expanded=EXPANDED_DPTS[id];let offset=padding;
 const fields=dptLayout(id,bits.length).map(f=>{
  const start=offset,end=offset+f.bits;offset=end;
  const chunk=padded.slice(start,end),raw=BigInt('0b'+chunk).toString();
  const field=spec.fields.find(x=>x.label===f.name)??(f.bits===bits.length&&spec.fields.length===1?spec.fields[0]:undefined);
  let meaning=field?(field.options?field.options[(field.optionValues??field.options.map((_,i)=>i)).indexOf(Number(values[field.key]))]:values[field.key]):'';
  if(/reserved/i.test(f.name))meaning='Reserved bits must be zero.';
  if(f.name==='Sign')meaning=chunk==='1'?'Negative sign':'Non-negative sign';
  if(f.name==='Exponent'&&f.bits===4)meaning=`× 2^${raw}`;
  if(f.name==='Mantissa bits')meaning='KNX F16 stores 11 mantissa bits plus a separate sign bit; value = 0.01 × signed mantissa × 2^exponent.';
  if(expanded?.z8){
   if(start===padding){
    if(values.z8Mode==='1'&&!['0','1','4'].includes(values.z8Command))meaning='Ignored by this command; raw main field is preserved.';
    else if(values.z8Mode==='0'&&(Number(values.z8Status)&1))meaning='Out of service: this is not a measurement. Raw main field is preserved.';
    else if(values.z8Mode==='0'&&(Number(values.z8Status)&2)&&!(Number(values.z8Status)&4))meaning=['General failure','Open circuit','Short circuit'][Number(values.faultCode)];
    else if(values.z8Mode==='0'&&(Number(values.z8Status)&4))meaning='Overridden value is valid, including when Fault is also set.';
   }
   if(f.name==='Status / command (Z8)'){
    if(values.z8Mode==='1')meaning=spec.fields.find(f=>f.key==='z8Command')!.options![Number(values.z8Command)];
    else meaning=Number(values.z8Status)===0?'Normal status': ['Out of service','Fault','Overridden','In alarm','Unacknowledged alarm'].filter((_,i)=>Number(values.z8Status)&(1<<i)).join(' · ');
   }
  }
  return {name:f.name,start,end,bits:chunk,raw,meaning:meaning??''};
 });
 return {padded,padding,fields};
}
export const overlaps=(field:InspectedField,start:number,end:number)=>field.start<end&&field.end>start;
