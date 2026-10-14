import { dptInterpretation } from '../knx/dptInterpretation';
import React from 'react';
import { DPT_INPUTS, encodeDpt, decodedSummary, type Values } from '../knx/dptCodec';
export function DptValueEditor({id,values,onChange}:{id:string;values:Values;onChange:(values:Values)=>void}) {
 const spec=DPT_INPUTS[id]; let payload='',error='';
 try{payload=encodeDpt(id,values);}catch(e){error=(e as Error).message;}
 const change=(key:string,value:string)=>onChange({...values,[key]:value});
 return <div className="space-y-3">
  {spec.fields.map(f=><label key={f.key} className="block text-xs font-semibold text-slate-700">{f.label}
   {f.options?<select aria-label={f.label} className="block w-full border rounded-lg p-2 mt-1 bg-white" value={values[f.key]} onChange={e=>change(f.key,e.target.value)}>{f.options.map((o,i)=><option key={i} value={f.optionValues?.[i]??i}>{o}</option>)}</select>:<input aria-label={f.label} type={f.type??'text'} step={f.step} min={f.min} max={f.max} className="block w-full border rounded-lg p-2 mt-1 bg-white" value={values[f.key]} onChange={e=>change(f.key,e.target.value)}/>}
  </label>)}
  {error?<p role="alert" className="text-xs text-red-700">{error}</p>:<div className="text-xs text-slate-600 break-all"><strong>Encoded value:</strong> {decodedSummary(id,payload)}<div className="font-mono mt-1">{payload.match(/.{1,8}/g)?.join(' ')}</div></div>}
  {!error&&dptInterpretation(id,values)&&<p className="text-xs text-amber-900">{dptInterpretation(id,values)}</p>}
  {spec.note&&<p className="text-xs text-slate-600">{spec.note}</p>}
 </div>;
}
