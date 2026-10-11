// Compatibility exports derived from the edition-specific shared catalogue.
import { legacyRows, DPT_DATABASE } from "./dptDatabase";
export const DPT_1bit = legacyRows(r=>r.family==='1');
export const DPT_2bit = legacyRows(r=>r.family==='2');
export const DPT_4bit = legacyRows(r=>r.family==='3');
export const DPT_1byte = legacyRows(r=>['4','5','6'].includes(r.family));
export const DPT_2byte = legacyRows(r=>['7','8'].includes(r.family));
