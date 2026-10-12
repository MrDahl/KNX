import manifest from './dptExpanded.json';
import type { Spec, Values } from './dptCodec';
type Part={key:string;bits:number;kind:string;scale?:number;offset?:number};
type ExpandedSpec=Spec & {parts:Part[];unit:string;sourcePages:number[]};
export const EXPANDED_DPTS=manifest as Record<string,ExpandedSpec>;
const binary=(n:bigint,bits:number)=>BigInt.asUintN(bits,n).toString(2).padStart(bits,'0');
export function encodeFloat16(value:number,min=-671088.64,max=670433.28):string {
 if(!Number.isFinite(value)||value<min||value>max)throw Error('Outside the valid KNX F16 measurement range.');
 for(let e=0;e<=15;e++){
  const step=.01*2**e;
  let m=Math.round(value/step);
  // Rounding at a subtype boundary must not produce an out-of-range measurement.
  m=Math.max(Math.ceil(min/step),Math.min(Math.floor(max/step),m));
  if(m>=-2048&&m<=2047){const raw=(m<0?0x8000:0)|(e<<11)|(m&2047);if(raw!==0x7fff)return binary(BigInt(raw),16);}
 }
 throw Error('No valid KNX F16 measurement can represent this value.');
}
export function validateFields(spec:Spec,v:Values){
 for(const f of spec.fields){
  if(f.type!=='number'&&!f.options)continue;
  const raw=v[f.key],n=Number(raw);
  if(raw===undefined||!raw.trim()||!Number.isFinite(n))throw Error(`Invalid ${f.label.toLowerCase()}.`);
  if(f.options){if(!(f.optionValues??f.options.map((_,i)=>i)).includes(n))throw Error(`Reserved or unsupported ${f.label.toLowerCase()} code.`);}
  else if(n<(f.min??-Infinity)||n>(f.max??Infinity)||(f.step!=='any'&&!Number.isInteger(n)))throw Error(`Invalid ${f.label.toLowerCase()}.`);
 }
}
export function encodeExpanded(id:string,v:Values):string{
 const spec=EXPANDED_DPTS[id];validateFields(spec,v);
 return spec.parts.map(p=>{
  if(p.kind==='reserved')return '0'.repeat(p.bits);
  if(p.kind==='latin1'){const s=v[p.key]??'';if(s.length!==1||s.charCodeAt(0)>255)throw Error('Enter exactly one ISO 8859-1 character.');return binary(BigInt(s.charCodeAt(0)),8);}
  if(p.kind==='int64'){
   if(!/^-?\d+$/.test(v[p.key]??''))throw Error('Enter an exact decimal integer.');
   const n=BigInt(v[p.key]);if(n<-(1n<<63n)||n>=(1n<<63n))throw Error('Outside the signed 64-bit range.');return binary(n,64);
  }
  const n=Number(v[p.key]);
  if(p.kind==='f16'){const f=spec.fields.find(f=>f.key===p.key)!;return encodeFloat16(n,f.min,f.max);}
  if(p.kind==='f32'){const bytes=new Uint8Array(4);new DataView(bytes.buffer).setFloat32(0,n,false);return [...bytes].map(x=>binary(BigInt(x),8)).join('');}
  const raw=n/(p.scale??1)-(p.offset??0),rounded=Math.round(raw);
  if(p.kind==='scaled')return binary(BigInt(rounded),p.bits);
  if(Math.abs(raw-rounded)>Math.max(1,Math.abs(raw))*1e-12)throw Error(`Value must be a multiple of ${p.scale??1}.`);
  return binary(BigInt(rounded),p.bits);
 }).join('');
}
export function decodeExpanded(id:string,bits:string):Values{
 const spec=EXPANDED_DPTS[id],values:Values={};let offset=0;
 for(const p of spec.parts){
  const chunk=bits.slice(offset,offset+p.bits);offset+=p.bits;const raw=BigInt('0b'+chunk),n=Number(raw);
  if(p.kind==='reserved'){if(raw!==0n)throw Error('Reserved bits must be zero.');continue;}
  if(p.kind==='latin1')values[p.key]=String.fromCharCode(n);
  else if(p.kind==='int64')values[p.key]=BigInt.asIntN(64,raw).toString();
  else if(p.kind==='f16'){
   if(n===0x7fff)throw Error('7F FF is invalid data, not a measurement.');
   values[p.key]=String(.01*((n&2047)-(n&32768?2048:0))*2**((n>>11)&15));
  }else if(p.kind==='f32'){
   const bytes=Uint8Array.from(chunk.match(/.{8}/g)!.map(x=>parseInt(x,2))),value=new DataView(bytes.buffer).getFloat32(0,false);
   values[p.key]=Object.is(value,-0)?'-0':String(value);
  }else{
   const integer=p.kind==='sint'?Number(BigInt.asIntN(p.bits,raw)):n;
   // Avoid exposing floating-point multiplication noise in decimal fixed-point values.
   const value=(integer+(p.offset??0))*(p.scale??1);
   values[p.key]=String(p.kind!=='scaled'&&p.scale&&p.scale<1?Number(value.toFixed(Math.round(-Math.log10(p.scale)))):value);
  }
 }
 encodeExpanded(id,values);return values;
}
export function expandedSummary(id:string,bits:string):string{
 const spec=EXPANDED_DPTS[id],v=decodeExpanded(id,bits);
 return spec.fields.map(f=>`${f.label}: ${f.options?f.options[(f.optionValues??f.options.map((_,i)=>i)).indexOf(Number(v[f.key]))]:v[f.key]}`).join(' · ');
}
export function expandedLayout(id:string){
 const spec=EXPANDED_DPTS[id];if(!spec)return;
 return spec.parts.flatMap(p=>p.kind==='f16'?[{name:'Sign',bits:1},{name:'Exponent',bits:4},{name:'Mantissa bits',bits:11}]:p.kind==='f32'?[{name:'Sign',bits:1},{name:'Exponent',bits:8},{name:'Fraction',bits:23}]:[{name:spec.fields.find(f=>f.key===p.key)?.label??'Reserved',bits:p.bits}]);
}
