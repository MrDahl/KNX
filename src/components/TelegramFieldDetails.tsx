import {tr} from '../i18n';
import {useTranslation} from 'react-i18next';
import React from 'react';
import type { TelegramByte } from '../types';
export function fieldRows(byte:TelegramByte,count:number):[string,string,string][] {
 const b=byte.logicalBinary,n=parseInt(b,2),i=byte.index;
 if(i===count-1)return [['Check byte',b,'NOT-XOR of preceding octets; XOR of the whole frame is FF.']];
 if(i===0)return [['Frame type · b7',b[0],'1 = standard frame'],['Fixed bits · b6, b4, b1..0',`${b[1]} ${b[3]} ${b.slice(6)}`,'0, 1, 00 for this standard frame'],['Repeat · b5',b[2],b[2]==='1'?'Original transmission':'Repeated transmission'],['Priority · b3..2',b.slice(4,6),({'00':'System','10':'Alarm / urgent','01':'High / normal','11':'Low'} as Record<string,string>)[b.slice(4,6)]]];
 if(i===1)return [['Area · b7..4',b.slice(0,4),`${n>>4}`],['Line · b3..0',b.slice(4),`${n&15}`]];
 if(i===2)return [['Device · b7..0',b,`${n}`]];
 if(i===3)return [['Main group · b7..3',b.slice(0,5),`${n>>3}`],['Middle group · b2..0',b.slice(5),`${n&7}`]];
 if(i===4)return [['Subgroup · b7..0',b,`${n}`]];
 if(i===5)return [['Address type · b7',b[0],'1 = group address'],['Hop count · b6..4',b.slice(1,4),`${(n>>4)&7}; 0 = no forwarding, 7 has special meaning`],['Length · b3..0',b.slice(4),`${n&15}; TPDU contains ${(n&15)+1} octets`]];
 if(i===6)return [['Transport control · b7..2',b.slice(0,6),'Unnumbered data in this tool'],['APCI upper two bits · b1..0',b.slice(6),'Combine with the next octet’s two most significant bits.']];
 if(i===7)return [['APCI lower two bits · b7..6',b.slice(0,2),({'00':'GroupValueRead','01':'GroupValueResponse','10':'GroupValueWrite'} as Record<string,string>)[b.slice(0,2)]??'Unsupported'],['Inline value / reserved · b5..0',b.slice(2),count>9?'Zero; complete value octets follow.':'Small value, or zero for a read.']];
 return [['Value octet · b7..0',b,'Part of the selected DPT payload. DPT identifiers are not carried in the telegram.']];
}
export function TelegramFieldDetails({byte,count}:{byte?:TelegramByte;count:number}) {
 useTranslation();
 if(!byte)return null;
 return <section aria-label={tr("Selected byte explanation")} className="border border-green-200 rounded-xl bg-green-50 p-4 space-y-3">
 <h4 className="font-bold text-slate-900">Byte {byte.index+1}: {tr(byte.name)} · 0x{byte.hex}</h4>
 <p className="text-xs text-slate-700">{tr("Logical bits below run b7 → b0. On the wire, data bits travel D0 → D7, preceded by Start and followed by even Parity and Stop.")}</p>
 <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr><th className="p-2">{tr("Field")}</th><th className="p-2">{tr("Bits")}</th><th className="p-2">{tr("Meaning")}</th></tr></thead><tbody>{fieldRows(byte,count).map(([field,bits,meaning])=><tr key={field} className="border-t border-green-200"><td className="p-2 font-semibold">{tr(field)}</td><td className="p-2 font-mono whitespace-nowrap">{bits}</td><td className="p-2">{tr(meaning)}</td></tr>)}</tbody></table></div>
 </section>;
}
