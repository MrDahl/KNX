export type LayoutField={name:string;bits:number};
export function dptLayout(id:string,size:number):LayoutField[]{
 const fields:Record<string,[string,number][]>= {
 '1.001':[['Switch',1]],'2.001':[['Control',1],['Switch',1]],'3.007':[['Direction',1],['Step code',3]],
 '9.001':[['Sign',1],['Exponent',4],['Mantissa bits',11]],'9.007':[['Sign',1],['Exponent',4],['Mantissa bits',11]],
 '10.001':[['Weekday',3],['Hour',5],['Reserved',2],['Minute',6],['Reserved',2],['Second',6]],
 '11.001':[['Reserved',3],['Day',5],['Reserved',4],['Month',4],['Reserved',1],['Year',7]],
 '14.000':[['Sign',1],['Exponent',8],['Fraction',23]],'17.001':[['Reserved',2],['Scene − 1',6]],
 '18.001':[['Learn/store',1],['Reserved',1],['Scene − 1',6]],
 '19.001':[['Year − 1900',8],['Reserved',4],['Month',4],['Reserved',3],['Day',5],['Weekday',3],['Hour',5],['Reserved',2],['Minute',6],['Reserved',2],['Second',6],['F',1],['WD',1],['NWD',1],['NY',1],['ND',1],['NDoW',1],['NT',1],['SUTI',1],['CLQ',1],['SRC',1],['Reserved',6]],
 '221.001':[['Manufacturer',16],['Serial number',32]],'232.600':[['Red',8],['Green',8],['Blue',8]],
 };
 return (fields[id]??(id==='16.000'?Array.from({length:14},(_,i)=>[`Character ${i+1}`,8] as [string,number]):[['Value',size]])).map(([name,bits])=>({name,bits}));
}
export const DPT_NOTES:Record<string,string>={
 '1.001':'0 = Off; 1 = On. The DPT identifier is configured in ETS and is not included in group-value telegram data.',
 '2.001':'The high bit enables control. With control disabled, the value bit does not force an output.',
 '3.007':'Direction 0 decreases and 1 increases. Step code 0 stops; codes 1–7 represent 100% down to 1.5625%.',
 '9.001':'Value = 0.01 × signed mantissa × 2^exponent. 7F FF is invalid data. Temperature range starts at −273 °C.',
 '9.007':'KNX F16 uses the same encoding as temperature, but a different dimension and range. 7F FF is invalid data.',
 '10.001':'Weekday 0 means not specified; 1–7 means Monday–Sunday. Reserved bits must be zero.',
 '11.001':'Years 90–99 mean 1990–1999; 00–89 mean 2000–2089. Calendar dates are validated.',
 '14.000':'IEEE 754 single precision, acceleration in m/s². This workbench handles finite values only.',
 '17.001':'The displayed scene number is 1–64; the encoded value is 0–63. The high two bits are reserved.',
 '18.001':'Bit 7 selects activate (0) or learn/store (1). Bit 6 is reserved. The low six bits encode scene minus one.',
 '19.001':'F=fault; WD=working day; NWD/NY/ND/NDoW/NT mark unavailable fields; SUTI=summer time; CLQ=clock quality; SRC=external synchronisation reliability. The editor implements only a complete local timestamp, no fault and an unsynchronised clock, with calculated weekday and hours 0–23.',
 '16.000':'Fixed 14-byte ASCII text. This editor pads short strings with NULL and rejects embedded NULL/non-ASCII text.',
 '221.001':'Two-byte manufacturer code and four-byte serial number. A syntactically valid value does not establish a registered manufacturer assignment.',
 '232.600':'Three unsigned octets ordered red, green, blue; each channel ranges from 0 to 255.',
 '20.102':'0=Auto, 1=Comfort, 2=Standby, 3=Economy, 4=Building protection. Other codes are not accepted by this editor.'
};
