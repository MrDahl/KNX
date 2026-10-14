import { EXPANDED_DPTS, encodeExpanded, expandedSummary, encodeFloat16, validateFields } from './dptExpandedCodec';
// KNX Interworking Datapoint Types v02.02.01, §§3.1–3.20, 3.31, 6.6.
// This catalogue names exact subtypes; it does not change the shared DPT matrix.
export type Values = Record<string, string>;
export type Field = { key: string; label: string; type?: string; min?: number; max?: number; step?: string; options?: string[]; optionValues?: number[]; initial: string };
export type Spec = { name: string; size: number; fields: Field[]; note?: string; telegramAllowed?: boolean };
const num = (key: string, label: string, min: number, max: number, initial = '0', step = '1'): Field => ({key,label,type:'number',min,max,initial,step});
const select = (key: string,label: string, options: string[],initial='0'): Field => ({key,label,options,initial});
const day = select('day','Day of week',['Not specified','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']);
const time: Field = {key:'time',label:'Time (HH:MM:SS)',type:'time',step:'1',initial:'12:00:00'};
const date: Field = {key:'date',label:'Date',type:'date',initial:'2026-01-01'};
export const DPT_INPUTS: Record<string, Spec> = {
 ...EXPANDED_DPTS,
 '1.001':{name:'Switch',size:1,fields:[select('value','Switch value',['Off','On'],'1')]},
 '2.001':{name:'Switch control',size:2,fields:[select('control','Control',['No control','Control active']),select('value','Switch value',['Off','On'])]},
 '3.007':{name:'Relative dimming',size:4,fields:[select('direction','Direction',['Decrease','Increase'],'1'),select('step','Step code',['Stop','100%','50%','25%','12.5%','6.25%','3.125%','1.5625%'])]},
 '4.001':{name:'ASCII character',size:8,fields:[{key:'text',label:'One ASCII character',initial:'A'}]},
 '5.001':{name:'Scaling (%)',size:8,fields:[num('value','Percentage',0,100,'75','any')],note:'Rounded to the nearest 1/255 of full scale.'},
 '5.003':{name:'Angle (°)',size:8,fields:[num('value','Angle (°)',0,360,'0','any')],note:'Rounded to the nearest 360/255 degrees.'},
 '5.010':{name:'Unsigned counter (8-bit)',size:8,fields:[num('value','Counter',0,255)]},
 '6.001':{name:'Signed percentage (%)',size:8,fields:[num('value','Signed percentage',-128,127)]},
 '7.001':{name:'Unsigned counter (16-bit)',size:16,fields:[num('value','Counter',0,65535)]},
 '8.001':{name:'Signed counter (16-bit)',size:16,fields:[num('value','Counter',-32768,32767)]},
 '9.001':{name:'Temperature (°C)',size:16,fields:[num('value','Temperature (°C)',-273,670433.28,'21','any')],note:'KNX 16-bit floating point; the encoded value may be rounded.'},
 '9.007':{name:'Humidity (%)',size:16,fields:[num('value','Humidity (%)',0,670433.28,'50','any')],note:'Standard encoding range extends above 100%; ordinary relative humidity is normally 0–100%.'},
 '10.001':{name:'Time of day',size:24,fields:[day,time]},
 '11.001':{name:'Date',size:24,fields:[date],note:'Supported years: 1990–2089; transmitted year is interpreted using the KNX century rule.'},
 '12.001':{name:'Unsigned counter (32-bit)',size:32,fields:[num('value','Counter',0,4294967295)]},
 '13.001':{name:'Signed counter (32-bit)',size:32,fields:[num('value','Counter',-2147483648,2147483647)]},
 '14.000':{name:'Acceleration (m/s²)',size:32,fields:[num('value','Acceleration (m/s²)',-3.4028234663852886e38,3.4028234663852886e38,'0','any')],note:'IEEE 754 single precision; finite values only in this editor.'},
 '16.000':{name:'ASCII text (14 bytes)',size:112,fields:[{key:'text',label:'ASCII text (up to 14 characters)',initial:'KNX'}],note:'Short text is explicitly NULL-padded to the fixed 14-byte DPT format.'},
 '17.001':{name:'Scene number',size:8,fields:[num('scene','Scene number (1–64)',1,64,'1')],note:'Scene 1 is encoded as 0; scene 64 as 63. Reserved bits are zero.'},
 '18.001':{name:'Scene control',size:8,fields:[select('action','Scene command',['Activate','Learn / store']),num('scene','Scene number (1–64)',1,64,'1')],note:'Scene numbers are displayed with a +1 offset. Bit 6 is reserved and remains zero.'},
 '19.001':{name:'Date and time',size:64,fields:[date,time,select('working','Working-day status',['Unknown','Non-working day','Working day']),select('summer','Summer time',['Standard time','Summer time'])],note:'Encodes a complete local calendar timestamp (1900–2155), calculated weekday, no fault, and an unsynchronised clock. Time zone is not transmitted; this editor uses hours 0–23.'},
 '20.102':{name:'HVAC mode',size:8,fields:[select('value','HVAC operating mode',['Auto','Comfort','Standby','Economy','Building protection'])]},
 '221.001':{name:'Device serial number',size:48,fields:[{key:'hex',label:'Serial number (12 hexadecimal digits)',initial:'000100000001'}],note:'Two-byte manufacturer code followed by four-byte manufacturer-specific serial value. No manufacturer assignment is checked.'},
 '232.600':{name:'RGB colour',size:24,fields:[{key:'colour',label:'RGB colour',type:'color',initial:'#509e2f'}]}
};
// p. 190: conservative complete-timestamp subset; the subtype reserves SRC.
DPT_INPUTS['247.600']={name:'Converter test information',size:96,fields:[...DPT_INPUTS['19.001'].fields,num('interval','Automatic-test interval (hours; 0 = disabled)',0,65535),num('duration','Preceding-test duration (seconds)',0,65535)],note:'Complete, fault-free, unsynchronised timestamp subset (1900–2155, hours 0–23, calculated weekday). CLQ and all seven following bits are zero; SRC is reserved here. Other timestamp flags and 24:00:00 are outside this editor. KNX defines TimePeriod1 as U16 hours (DPT 7.007; 0 disables automatic testing) and TimePeriod2 as U16 seconds (DPT 7.005). Raw field values are preserved in those KNX units. DALI Edition 1 command 242 selects a variable via DTR0: 0x00–0x03 are test delays in 15-minute units, 0x04 is a function-test interval in days, and 0x05 is a duration-test interval in weeks (maximum 97). The KNX interval wording and 15-minute note do not establish which variable the gateway uses. DALI duration-test results use 2-minute units (255 = 510 min or longer); conversion to the KNX seconds field is gateway-dependent and is not inferred here.'};
export const bin = (n:number,width=8) => n.toString(2).padStart(width,'0');
const octets = (ns:number[]) => ns.map(n=>bin(n)).join('');
export const defaults = (id:string):Values => Object.fromEntries(DPT_INPUTS[id].fields.map(f=>[f.key,f.initial]));
export function float16(value:number) {
 return encodeFloat16(value);
}
export function decodeFloat(payload:string) {
 const n=parseInt(payload,2); let m=n&2047; if(n&32768)m-=2048;
 return .01*m*2**((n>>11)&15);
}
function calendar(text:string,min:number,max:number) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw Error('Enter a complete calendar date.');
 const [y,m,d]=text.split('-').map(Number), dt=new Date(Date.UTC(y,m-1,d));
 if(y<min||y>max||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d) throw Error(`Enter a valid date between ${min} and ${max}.`);
 return {y,m,d,day:dt.getUTCDay()||7};
}
function clock(text:string) {
 if(!/^\d{2}:\d{2}(:\d{2})?$/.test(text)) throw Error('Enter a valid time.');
 const [h,m,s=0]=text.split(':').map(Number);
 if(h>23||m>59||s>59) throw Error('Time must be 00:00:00–23:59:59.');
 return [h,m,s];
}
export function encodeDpt(id:string,v:Values):string {
 const spec=DPT_INPUTS[id]; if(!spec)throw Error('Unsupported DPT.');
 if(EXPANDED_DPTS[id])return encodeExpanded(id,v);
 validateFields(spec,v);
 const n=Number(v.value);
 switch(id) {
 case '1.001':return v.value;
 case '2.001':return v.control+v.value;
 case '3.007':return v.direction+bin(Number(v.step),3);
 case '4.001':if(v.text.length!==1||v.text.charCodeAt(0)>127)throw Error('Enter exactly one ASCII character.');return bin(v.text.charCodeAt(0));
 case '5.001':return bin(Math.round(n*255/100));
 case '5.003':return bin(Math.round(n*255/360));
 case '5.010':case '6.001':case '7.001':case '8.001':case '12.001':case '13.001':return bin(n<0?n+2**spec.size:n,spec.size);
 case '9.001':case '9.007':return encodeFloat16(n,spec.fields[0].min,spec.fields[0].max);
 case '10.001':{const [h,m,s]=clock(v.time);return octets([(Number(v.day)<<5)|h,m,s]);}
 case '11.001':{const {y,m,d}=calendar(v.date,1990,2089);return octets([d,m,y%100]);}
 case '14.000':{const b=new ArrayBuffer(4),d=new DataView(b);d.setFloat32(0,n,false);return octets([...new Uint8Array(b)]);}
 case '16.000':if(v.text.length>14||/[^\x01-\x7f]/.test(v.text))throw Error('Use at most 14 ASCII characters; embedded NULL is not allowed.');return octets([...Array(14)].map((_,i)=>i<v.text.length?v.text.charCodeAt(i):0));
 case '17.001':return bin(Number(v.scene)-1);
 case '18.001':return bin((Number(v.action)<<7)|(Number(v.scene)-1));
 case '19.001':{const {y,m,d,day}=calendar(v.date,1900,2155),[h,min,s]=clock(v.time);return octets([y-1900,m,d,(day<<5)|h,min,s,(v.working==='0'?32:v.working==='2'?64:0)|Number(v.summer),0]);}
 case '20.102':return bin(n);
 case '247.600':return encodeDpt('19.001',v)+bin(Number(v.interval),16)+bin(Number(v.duration),16);
 case '221.001':if(!/^[0-9a-fA-F]{12}$/.test(v.hex))throw Error('Enter exactly 12 hexadecimal digits.');return octets(v.hex.match(/../g)!.map(h=>parseInt(h,16)));
 case '232.600':if(!/^#[0-9a-f]{6}$/i.test(v.colour))throw Error('Choose an RGB colour.');return octets(v.colour.slice(1).match(/../g)!.map(h=>parseInt(h,16)));
 default:throw Error('Unsupported DPT.');
 }
}
export function decodedSummary(id:string,payload:string) {
 if(EXPANDED_DPTS[id])return expandedSummary(id,payload);
 const n=parseInt(payload,2), spec=DPT_INPUTS[id];
 if(id==='5.001')return `${(n*100/255).toFixed(3)} %`;
 if(id==='5.003')return `${(n*360/255).toFixed(3)} °`;
 if(id.startsWith('9.'))return `${decodeFloat(payload)} ${id==='9.001'?'°C':'%'}`;
 if(['6.001','8.001','13.001'].includes(id))return `${n>=2**(spec.size-1)?n-2**spec.size:n}`;
 if(id==='14.000'){const b=new Uint8Array(payload.match(/.{8}/g)!.map(x=>parseInt(x,2)));return `${new DataView(b.buffer).getFloat32(0,false)} m/s²`;}
 if(id==='17.001'||id==='18.001')return `Scene ${(n&63)+1}${id==='18.001'?(n&128?' · learn/store':' · activate'):''}`;
 return '';
}
