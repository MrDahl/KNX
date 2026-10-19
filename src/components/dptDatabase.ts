import {tr} from '../i18n';
import catalogue from '../knx/dptCatalogue.json';
import { DPT_INPUTS } from '../knx/dptCodec';
export const DPT_EDITION = '02.02.01 (2021)';
export const DPT_DATABASE = catalogue.map(row => ({...row, family:row.id.split('.')[0], supported:!!DPT_INPUTS[row.id]}));
export type DptItem = typeof DPT_DATABASE[number];
export const DPT_BY_ID = Object.fromEntries(DPT_DATABASE.map(row=>[row.id,row]));
export const legacyRows = (test:(row:DptItem)=>boolean):[string,string,string,string,string][] => DPT_DATABASE.filter(test).map(r=>[r.id,r.size,r.name,r.dataType,r.range]);
export function filterDpts(query:string,family='all',kind='all',status='all') {
 const normalized=query.trim().toLowerCase().replace(/^dpt\s*/,'');
 return DPT_DATABASE.filter(r=>(family==='all'||r.family===family)&&(kind==='all'||r.dataType===kind)&&(status==='all'||(status==='interactive'?r.supported:status==='pending'?r.layoutPending:!r.layoutPending&&!r.supported))&&normalized.split(/\s+/).every(word=>[r.id,r.name,r.format,r.unit,r.dataType,r.range,tr(r.unit),tr(r.dataType),tr(r.range),...(DPT_INPUTS[r.id]?.fields.flatMap(f=>[f.label,tr(f.label),...(f.options??[]),...(f.options??[]).map(o=>tr(o))])??[])].join(' ').toLowerCase().includes(word)));
}
