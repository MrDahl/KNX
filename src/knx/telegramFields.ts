export const TELEGRAM_FIELDS = {
  control: {label:'Control', color:'#9a3412', background:'#fff7ed', border:'#fdba74'},
  source: {label:'Source', color:'#1e40af', background:'#eff6ff', border:'#93c5fd'},
  destination: {label:'Destination', color:'#6b21a8', background:'#faf5ff', border:'#d8b4fe'},
  routing: {label:'Routing / length', color:'#155e75', background:'#ecfeff', border:'#67e8f9'},
  data: {label:'TPCI / APCI / data', color:'#166534', background:'#f0fdf4', border:'#86efac'},
  check: {label:'Check byte', color:'#9f1239', background:'#fff1f2', border:'#fda4af'},
} as const;
export type TelegramField = keyof typeof TELEGRAM_FIELDS;
export function telegramField(index:number,count:number):TelegramField {
  return index===count-1?'check':index===0?'control':index<=2?'source':index<=4?'destination':index===5?'routing':'data';
}
export function fieldStyle(index:number,count:number) {
  const field=TELEGRAM_FIELDS[telegramField(index,count)];
  return {color:field.color,backgroundColor:field.background,borderColor:field.border};
}
