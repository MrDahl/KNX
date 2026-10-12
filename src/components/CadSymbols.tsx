import React,{useState} from 'react';
import {Shapes,Search,Maximize2} from 'lucide-react';
import {CAD_SYMBOLS,SYMBOL_CATEGORIES,filterSymbols,symbolAssetUrl,type CadSymbol} from '../symbols/catalogue';
const assetBase=(import.meta as ImportMeta & {env?:{BASE_URL?:string}}).env?.BASE_URL??'/';
function Drawing({symbol,large=false}:{symbol:CadSymbol;large?:boolean}){
 const [failed,setFailed]=useState(false);
 return <div className={'symbol-drawing '+(large?'symbol-drawing-large':'')}>
  {symbol.svgPath&&!failed?<img src={symbolAssetUrl(symbol.svgPath,assetBase)} alt={`${symbol.name} — example CAD symbol`} onError={()=>setFailed(true)}/>:<div className="text-center text-slate-400"><Shapes size={26} className="mx-auto mb-2" aria-hidden="true"/><span className="text-xs">{failed?'Drawing unavailable':'Drawing pending'}</span></div>}
 </div>;
}
export function CadSymbols({entries=CAD_SYMBOLS}:{entries?:CadSymbol[]}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('all');
 const results=filterSymbols(query,category,entries),ready=entries.filter(s=>s.svgPath).length;
 return <section className="@container symbols-page space-y-6" aria-label="Example KNX CAD Symbols">
  <header className="rounded-2xl border border-slate-200 bg-white p-6 @lg:p-8 shadow-sm">
   <p className="eyebrow">DRAWING REFERENCE</p><h2 className="text-2xl @lg:text-3xl font-extrabold text-slate-900 mt-2">Example KNX CAD Symbols</h2>
   <p className="text-sm text-slate-600 mt-3 max-w-2xl">Explore the devices shown in a KNX drawing. Find a symbol by name or function, then read what the device does.</p>
   <div className="flex flex-wrap gap-2 mt-5 text-xs font-semibold"><span className="rounded-full bg-green-50 text-green-800 px-3 py-2">{entries.length} reference entries</span><span className="rounded-full bg-slate-100 text-slate-600 px-3 py-2">{ready} drawings available · {entries.length-ready} pending</span></div>
  </header>
  {ready===0&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">The English reference is ready. Symbol drawings are being prepared; placeholder icons below are not CAD symbols.</p>}
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
   <div className="grid gap-4 @lg:grid-cols-[1fr_15rem_auto] items-end">
    <label className="text-xs font-semibold text-slate-600">Search symbols<div className="relative mt-1"><Search size={17} className="absolute left-3 top-3 text-slate-400" aria-hidden="true"/><input aria-label="Search CAD symbols" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try valve, lighting or interface…" className="w-full border border-slate-300 rounded-lg p-2.5 pl-9 text-sm font-normal"/></div></label>
    <label className="text-xs font-semibold text-slate-600">Category<select aria-label="CAD symbol category" value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm font-normal"><option value="all">All categories</option>{SYMBOL_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
    <button className="lesson-button" onClick={()=>{setQuery('');setCategory('all');}}>Reset filters</button>
   </div>
   <p role="status" className="text-xs text-slate-500">{results.length} matching {results.length===1?'entry':'entries'}</p>
  </div>
  {results.length===0?<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="font-bold text-slate-800">No matching symbols</h3><p className="text-sm text-slate-500 mt-2">Try a different name or choose another category.</p></div>:<table className="symbol-table"><caption className="sr-only">Example KNX CAD symbols and English descriptions</caption><thead><tr><th scope="col">Symbol</th><th scope="col">English name</th><th scope="col">What it represents</th></tr></thead><tbody>{results.map(s=><tr key={s.id}>
   <td><Drawing symbol={s}/>{s.svgPath&&<details className="mt-2"><summary className="cursor-pointer text-xs text-green-800 font-semibold"><Maximize2 size={12} className="inline mr-1"/>Enlarge symbol</summary><Drawing symbol={s} large/></details>}</td>
   <th scope="row"><span className="block text-base font-bold text-slate-900">{s.name}</span><span className="inline-block mt-2 text-xs font-normal rounded-full bg-green-50 text-green-800 px-2 py-1">{s.category}</span></th>
   <td className="text-sm leading-relaxed text-slate-600">{s.description}</td>
  </tr>)}</tbody></table>}
  <details className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"><summary className="cursor-pointer font-semibold text-slate-800">Show details · using this reference</summary><p className="mt-3">These are example drawing symbols. Use the legend supplied with the project to establish the meaning of each symbol. Channel counts, ratings, connections and supported functions must be checked against the drawing and the device documentation.</p></details>
 </section>;
}
