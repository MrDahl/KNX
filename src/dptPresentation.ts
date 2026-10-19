import {tr} from './i18n';
import {decodedSummary} from './knx/dptCodec';
import {EXPANDED_DPTS,decodeExpanded} from './knx/dptExpandedCodec';

/** Translate labels and enum meanings, never captured text or numeric values. */
export function dptSummary(id:string,payload:string):string {
 const spec=EXPANDED_DPTS[id];
 if(!spec)return tr(decodedSummary(id,payload));
 const values=decodeExpanded(id,payload);
 return spec.fields.map(field=>{
  const raw=values[field.key];
  const index=field.optionValues?field.optionValues.indexOf(Number(raw)):Number(raw);
  const value=field.options?tr(field.options[index]):raw;
  return `${tr(field.label)}: ${value}`;
 }).join(' · ');
}
