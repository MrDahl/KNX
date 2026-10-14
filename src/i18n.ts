import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en.json';
import da from './locales/da.json';
import lookup from './locales/lookup.json';
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
/** Only presentation text is translated. Unmigrated technical descriptions fall back to English. */
export function tr(english:string):string {
 const key=(lookup as Record<string,string>)[english];
 return key?String(i18n.t(key,{defaultValue:english})):english;
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
