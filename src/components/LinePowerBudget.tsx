import {tr,msg,formatNumber} from '../i18n';
import {useTranslation} from 'react-i18next';
import React, {useState} from 'react';
import {calculatePowerBudget, PowerItem} from '../knx/teachingModels';

export function LinePowerBudget() {
 useTranslation();
  const [rating, setRating] = useState(640);
  const [line, setLine] = useState('1.1');
  const [items, setItems] = useState<PowerItem[]>([
    {id: 1, name: 'Example sensors — replace with datasheet values', quantity: 10, current: 5, tp: 'TP1-256'},
    {id: 2, name: 'Example actuators — replace with datasheet values', quantity: 8, current: 10, tp: 'TP1-256'},
    {id: 3, name: 'Line-coupler interface on this segment — example', quantity: 1, current: 5, tp: 'TP1-256'},
  ]);
  const budget = calculatePowerBudget(rating, items);
  const update = (id: number, patch: Partial<PowerItem>) => setItems(prev => prev.map(i => i.id === id ? {...i, ...patch} : i));
  const inputClass = 'w-full min-w-20 border border-slate-200 rounded-lg p-2 bg-white text-slate-800';
  return <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-left" aria-label={tr("Line power budget")}>
    <h3 className="text-lg font-bold text-slate-900">{tr("TP segment power budget")}</h3>
    <p className="text-sm text-slate-600">{tr("Select a line and budget its main segment. Each electrically separated subsegment needs its own calculation and supply. The line selector labels this working example; changing it keeps your entered budget. The address directory below is independent of this calculation.")}</p>
    <div className="flex flex-wrap gap-4 text-sm">
      <label>{tr("Line")} <select aria-label={tr("Power budget line")} className={inputClass} value={line} onChange={e => setLine(e.target.value)}>
        {Array.from({length: 15}, (_, a) => Array.from({length: 15}, (_, l) => `${a + 1}.${l + 1}`)).flat().map(v => <option key={v}>{v}</option>)}
      </select></label>
      <label>{tr("KNX PSU rated output")} <select aria-label={tr("PSU rating")} className={inputClass} value={rating} onChange={e => setRating(Number(e.target.value))}>
        {[160, 320, 640, 1280].map(v => <option key={v} value={v}>{v} mA</option>)}
      </select></label>
    </div>
    <p className="text-xs text-slate-500">{tr("Illustrative values, not product specifications. Enter each product’s specified maximum KNX bus current. Count every connected coupler interface for electrical loading, even when its individual address belongs to another line. Use its actual current draw from this side, including 0 mA if documented.")}</p>
    <div className="overflow-x-auto"><table className="w-full text-sm min-w-[650px]">
      <thead><tr className="text-left text-slate-600"><th>{tr("Device / interface")}</th><th>{tr("Quantity")}</th><th>{tr("mA each")}</th><th>{tr("TP interface type")}</th><th /></tr></thead>
      <tbody>{items.map((item, index) => <tr key={item.id}>
        <td className="py-2 pr-2"><input aria-label={msg('power.itemName',{index:index+1})} className={inputClass} value={item.name} onChange={e => update(item.id, {name:e.target.value})}/></td>
        <td className="pr-2 w-24"><input aria-label={msg('power.itemQuantity',{index:index+1})} className={inputClass} type="number" min="1" step="1" value={Number.isNaN(item.quantity) ? '' : item.quantity} onChange={e => update(item.id, {quantity:e.target.value === '' ? NaN : Number(e.target.value)})}/></td>
        <td className="pr-2 w-24"><input aria-label={msg('power.itemCurrent',{index:index+1})} className={inputClass} type="number" min="0" step="0.1" value={Number.isNaN(item.current) ? '' : item.current} onChange={e => update(item.id, {current:e.target.value === '' ? NaN : Number(e.target.value)})}/></td>
        <td className="pr-2"><select aria-label={msg('power.itemType',{index:index+1})} className={inputClass} value={item.tp} onChange={e => update(item.id, {tp:e.target.value as PowerItem['tp']})}><option>TP1-256</option><option>TP1-64</option></select></td>
        <td><button className="p-2 text-rose-700" aria-label={msg('power.remove',{index:index+1})} onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}>{tr("Remove")}</button></td>
      </tr>)}</tbody>
    </table></div>
    <button className="px-4 py-2 rounded-xl bg-knx-blue text-white text-sm font-bold" onClick={() => setItems(prev => [...prev, {id:Math.max(0,...prev.map(i=>i.id))+1, name:'New device', quantity:1, current:10, tp:'TP1-256'}])}>{tr("Add device / interface")}</button>
    <div role="status" className="rounded-xl bg-slate-50 p-4 text-sm space-y-2">
      {!budget.valid ? <p className="text-rose-700">{tr("Enter whole quantities of at least 1 and nonnegative current values.")}</p> : <>
        <p className={budget.currentOK ? 'text-emerald-800' : 'text-rose-700'}><strong>{formatNumber(budget.current,1)} / {rating} mA</strong> — {budget.remaining >= 0 ? msg('power.remaining',{value:formatNumber(budget.remaining,1)}) : msg('power.overload',{value:formatNumber(-budget.remaining,1)})}.</p>
        <p className={budget.loadOK ? 'text-emerald-800' : 'text-rose-700'}><strong>{budget.loads} {tr("/ 256 TP load units")}</strong> — {budget.loadOK ? tr("within interface-loading limit") : tr("interface-loading limit exceeded")}.</p>
      </>}
    </div>
    <p className="text-xs text-slate-600">{tr("Independent checks: current = Σ(quantity × mA); interface load = 4 × TP1-64 + TP1-256 ≤ 256. Passing both is not a complete installation check: verify address allocation, cable length, voltage drop, supply/choke instructions and topology. No fixed 10 mA assumption and no network-wide current total. Supplies must not simply be paralleled to add their ratings.")}</p>
    <a className="text-xs text-knx-blue underline" href="https://www.knx.org/news/new-knx-tp1-256-topology-more-devices-and-fewer-line-repeaters" target="_blank" rel="noreferrer">{tr("KNX Association: TP1-256, mixed interface loading and power supplies")}</a>
  </section>;
}
