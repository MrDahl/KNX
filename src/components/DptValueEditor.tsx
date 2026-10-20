import {expandedFields} from '../knx/dptExpandedCodec';
import {tr,i18n,normalizeDecimalInput} from '../i18n';
import {useTranslation} from 'react-i18next';
import { dptInterpretation } from '../knx/dptInterpretation';
import React from 'react';
import {dptSummary} from '../dptPresentation';
import { DPT_INPUTS, encodeDpt, type Values } from '../knx/dptCodec';
export function DptValueEditor({id,values,onChange}:{id:string;values:Values;onChange:(values:Values)=>void}) {
 useTranslation();
 const spec=DPT_INPUTS[id]; let payload='',error='';
 try{payload=encodeDpt(id,values);}catch(e){error=(e as Error).message;}
 const change=(key:string,value:string)=>onChange({...values,[key]:value});
 return <div className="space-y-3">
  {(expandedFields(id,values)??spec.fields).map(f=><label key={f.key} className="block text-xs font-semibold text-slate-700">{tr(f.label)}
   {f.options?<select aria-label={tr(f.label)} className="block w-full border rounded-lg p-2 mt-1 bg-white" value={f.type==='number'&&i18n.language==='da'?values[f.key]?.replace('.',','):values[f.key]} onChange={e=>change(f.key,f.type==='number'?normalizeDecimalInput(e.target.value,i18n.language):e.target.value)}>{f.options.map((o,i)=><option key={i} value={f.optionValues?.[i]??i}>{tr(o)}</option>)}</select>:<input aria-label={tr(f.label)} type={f.type==='number'&&i18n.language==='da'?'text':f.type??'text'} inputMode={f.type==='number'?'decimal':undefined} step={f.step} min={f.min} max={f.max} className="block w-full border rounded-lg p-2 mt-1 bg-white" value={f.type==='number'&&i18n.language==='da'?values[f.key]?.replace('.',','):values[f.key]} onChange={e=>change(f.key,f.type==='number'?normalizeDecimalInput(e.target.value,i18n.language):e.target.value)}/>}
  </label>)}
  {error?<p role="alert" className="text-xs text-red-700">{tr(error)}</p>:<div className="text-xs text-slate-600 break-all"><strong>{tr("Encoded value:")}</strong> {dptSummary(id,payload,values)}<div className="font-mono mt-1">{payload.match(/.{1,8}/g)?.join(' ')}</div></div>}
  {!error&&dptInterpretation(id,values)&&<p className="text-xs text-amber-900">{tr(dptInterpretation(id,values))}</p>}
  {spec.note&&<p className="text-xs text-slate-600">{tr(spec.note)}</p>}
 </div>;
}
