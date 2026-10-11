// Compatibility exports derived from the edition-specific shared catalogue.
import { legacyRows, DPT_DATABASE } from "./dptDatabase";
export const DPT_9_float = legacyRows(r=>r.family==='9');
export const DPT_3to4bytes = legacyRows(r=>['10','11','12','13','15'].includes(r.family));
export const DPT_strs_scenes = legacyRows(r=>['16','17','18','19'].includes(r.family));
export const DPT14_additions_raw: [string,string,string][] = DPT_DATABASE.filter(r=>r.family==='14').map(r=>[r.id.split('.')[1],r.name.replace(/^DPT_Value_/,''),r.unit]);
