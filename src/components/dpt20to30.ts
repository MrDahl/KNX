// Compatibility exports derived from the edition-specific shared catalogue.
import { legacyRows, DPT_DATABASE } from "./dptDatabase";
export const DPT_N8_enums = legacyRows(r=>r.family==='20');
export const DPT_bitfields_and_actions = legacyRows(r=>['21','22','23','25','26','27'].includes(r.family));
export const DPT_strings_and_other = legacyRows(r=>['24','28','29','30','31'].includes(r.family));
