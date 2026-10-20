import type { Values } from './dptCodec';
export function dptInterpretation(id:string, values:Values):string|null {
 if(id==='217.001'&&values.magic==='31'&&values.version==='31'&&values.revision==='63')return 'FF FF: invalid, void or undefined version information.';
 if(id!=='248.600'||!/^\d+$/.test(values.durationRaw??''))return null;
 const raw=Number(values.durationRaw);if(raw>255)return null;
 return `Rated duration raw ${raw}: ${raw===255?'510 min or longer':`${raw*2} min`} if the gateway passes the DALI byte unchanged (raw × 2 min, IEC 62386-202). KNX-level scaling unconfirmed.`;
}
