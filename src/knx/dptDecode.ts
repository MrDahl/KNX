import { EXPANDED_DPTS, decodeExpanded } from './dptExpandedCodec';
import { DPT_INPUTS, decodeFloat, encodeDpt, type Values } from './dptCodec';
export function decodeDptHex(id:string,text:string):{values:Values;bits:string} {
 const spec=DPT_INPUTS[id];if(!spec)throw Error('No validated decoder is implemented for this subtype.');
 const hex=text.trim().replace(/^0x/i,'').replace(/\s/g,'');
 if(!/^[\da-f]+$/i.test(hex)||hex.length!==Math.ceil(spec.size/8)*2)throw Error(`Enter exactly ${Math.ceil(spec.size/8)} hexadecimal octet(s).`);
 const a=hex.match(/../g)!.map(x=>parseInt(x,16));
 const bits=a.map(x=>x.toString(2).padStart(8,'0')).join('').slice(-spec.size);
 if(spec.size<8&&a[0]>=2**spec.size)throw Error('Unused high bits must be zero in this value-only view.');
 if(EXPANDED_DPTS[id])return {values:decodeExpanded(id,bits),bits};
 const n=parseInt(bits,2),signed=n>=2**(spec.size-1)?n-2**spec.size:n;
 let v:Values={};const str=(n:number)=>String(n);const pad=(n:number)=>str(n).padStart(2,'0');
 switch(id){
 case '1.001':v={value:str(n)};break;
 case '2.001':v={control:str(n>>1),value:str(n&1)};break;
 case '3.007':v={direction:str(n>>3),step:str(n&7)};break;
 case '4.001':v={text:String.fromCharCode(n)};break;
 case '5.001':v={value:str(n*100/255)};break;
 case '5.003':v={value:str(n*360/255)};break;
 case '5.010':case '7.001':case '12.001':case '20.102':v={value:str(n)};break;
 case '6.001':case '8.001':case '13.001':v={value:str(signed)};break;
 case '9.001':case '9.007':if(n===0x7fff)throw Error('7F FF denotes invalid data for DPT 9.xxx; it is not a measurement.');v={value:str(decodeFloat(bits))};break;
 case '10.001':if((a[1]&192)||(a[2]&192))throw Error('Reserved time bits must be zero.');v={day:str(a[0]>>5),time:`${pad(a[0]&31)}:${pad(a[1])}:${pad(a[2])}`};break;
 case '11.001':if((a[0]&224)||(a[1]&240)||(a[2]&128)||a[2]>99)throw Error('Invalid date or nonzero reserved bits.');v={date:`${a[2]+(a[2]>=90?1900:2000)}-${pad(a[1])}-${pad(a[0])}`};break;
 case '14.000':v={value:str(new DataView(Uint8Array.from(a).buffer).getFloat32(0,false))};break;
 case '16.000':{const end=a.indexOf(0),used=end<0?a:a.slice(0,end);if(end>=0&&a.slice(end).some(x=>x!==0))throw Error('This editor accepts NULL-padded text only.');v={text:String.fromCharCode(...used)};break;}
 case '17.001':if(n&192)throw Error('Reserved scene bits must be zero.');v={scene:str((n&63)+1)};break;
 case '18.001':if(n&64)throw Error('Reserved scene bit 6 must be zero.');v={scene:str((n&63)+1),action:str(n>>7)};break;
 case '19.001':{
  if(a[6]&158||a[7]!==0||a[1]&240||a[2]&224||a[4]&192||a[5]&192)throw Error('This editor decodes complete, fault-free, unsynchronised timestamps only. Other valid DPT 19 flags are outside its scope.');
  v={date:`${a[0]+1900}-${pad(a[1])}-${pad(a[2])}`,time:`${pad(a[3]&31)}:${pad(a[4])}:${pad(a[5])}`,working:a[6]&32?'0':a[6]&64?'2':'1',summer:str(a[6]&1)};
  const encoded=encodeDpt(id,v);if(encoded!==bits)throw Error('Weekday or flags do not match the complete-timestamp subset supported by this editor.');break;
 }
 case '221.001':v={hex};break;
 case '232.600':v={colour:'#'+hex};break;
 default:throw Error('Unsupported decoder.');
 }
 encodeDpt(id,v); // Apply the same semantic range/calendar checks as the editor.
 return {values:v,bits};
}
export const payloadHex=(bits:string)=>bits.padStart(Math.ceil(bits.length/8)*8,'0').match(/.{8}/g)?.map(b=>parseInt(b,2).toString(16).toUpperCase().padStart(2,'0')).join(' ')??'';
