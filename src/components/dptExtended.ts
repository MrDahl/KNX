// Compatibility exports derived from the edition-specific shared catalogue.
import { legacyRows, DPT_DATABASE } from "./dptDatabase";
export const DPT_validity_and_extended = legacyRows(r=>Number(r.family)>=200);
