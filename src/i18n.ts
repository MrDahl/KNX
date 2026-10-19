import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en.json';
import da from './locales/da.json';
import lookup from './locales/lookup.json';
import templates from './locales/templates.json';
export type Language = 'en' | 'da';
export const LANGUAGE_STORAGE_KEY = 'knx-explorer-language';
function storedLanguage(): Language {
 try { return globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY)==='da'?'da':'en'; } catch { return 'en'; }
}
void i18next.use(initReactI18next).init({
 resources:{en:{translation:en},da:{translation:da}},lng:storedLanguage(),fallbackLng:'en',
 supportedLngs:['en','da'],initAsync:false,interpolation:{escapeValue:false},returnNull:false,
});
export const i18n=i18next;
/** Match only registered messages; never replace words in arbitrary text or protocol values. */
const templateMatchers = Object.entries(templates).map(([source,key])=>{
 const slots=[...source.matchAll(/\{\{(\d+)\}\}/g)].map(m=>m[1]);
 const parts=source.split(/\{\{\d+\}\}/).map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 return {key,slots,pattern:new RegExp('^'+parts.join('([\\s\\S]*?)')+'$')};
});
/** Translation is applied at render time so stored diagnostics also follow language changes. */
export function tr(english:string|null|undefined,depth=0):string {
 if(english==null)return '';
 if(i18n.language!=='da')return english;
 const key=(lookup as Record<string,string>)[english];
 if(key)return String(i18n.t(key,{defaultValue:english}));
 if(depth<4)for(const {key,slots,pattern} of templateMatchers){
  const match=pattern.exec(english);
  if(match){
   const values=Object.fromEntries(slots.map((slot,i)=>[slot,tr(match[i+1],depth+1)]));
   return String(i18n.t(key,{...values,defaultValue:english}));
  }
 }
 return english;
}
function applyDocumentLanguage(language:string) {
 if(typeof document!=='undefined'&&document.documentElement)document.documentElement.lang=language;
}
i18n.on('languageChanged',applyDocumentLanguage);
applyDocumentLanguage(i18n.language);
export async function setLanguage(language:Language) {
 await i18n.changeLanguage(language);
 try{globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY,language);}catch{/* Private browsing can block storage. */}
}
/** Commas are accepted for Danish numeric values only, never addresses, IDs or bytes. */
export function normalizeDecimalInput(value:string,language:string):string {
 if(language!=='da'||!value.includes(','))return value;
 if(!/^[+-]?(?:\d+,\d*|,\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))return value;
 return value.replace(',','.');
}
export function msg(key:string,values:Record<string,string|number>={}):string {
 return String(i18n.t(key,values));
}
export function formatNumber(value:number,maximumFractionDigits=3):string {
 return new Intl.NumberFormat(i18n.language==='da'?'da-DK':'en-GB',{maximumFractionDigits,useGrouping:false}).format(value);
}
