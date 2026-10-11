/** Individual-address syntax, separate from topology placement/reserved-address rules. */
export function parseIndividualAddress(input: string): [number, number, number] | null {
  if (!/^\d{1,2}\.\d{1,2}\.\d{1,3}$/.test(input)) return null;
  const values = input.split('.').map(Number);
  return values.every((n, i) => Number.isInteger(n) && n >= 0 && n <= (i === 2 ? 255 : 15))
    ? values as [number, number, number] : null;
}

export function receiveSwitchWrite(previous: boolean, value: boolean, linked: boolean, communication: boolean, write: boolean) {
  const reason = !linked ? 'destination GA not linked' : !communication ? 'Communication (C) disabled' : !write ? 'Write (W) disabled' : null;
  return {state: reason ? previous : value, accepted: !reason,
    reason: reason ? `Retained ${previous ? 'ON' : 'OFF'}: ${reason}.` : `Accepted GroupValueWrite: ${value ? 'ON' : 'OFF'}.`};
}

export type PowerItem = {id: number; name: string; quantity: number; current: number; tp: 'TP1-64' | 'TP1-256'};
export function calculatePowerBudget(rating: number, items: PowerItem[]) {
  const valid = Number.isFinite(rating) && rating > 0 && items.every(i =>
    Number.isInteger(i.quantity) && i.quantity >= 1 && Number.isFinite(i.current) && i.current >= 0);
  const current = items.reduce((s, i) => s + i.quantity * i.current, 0);
  const loads = items.reduce((s, i) => s + i.quantity * (i.tp === 'TP1-64' ? 4 : 1), 0);
  return {valid, current, loads, remaining: rating - current, currentOK: valid && current <= rating, loadOK: valid && loads <= 256};
}

export type RouteNode = {id: string; label: string; address: string; type: 'device' | 'repeater' | 'line_coupler' | 'backbone_coupler' | 'static_device'};
export function traceRoute(nodes: RouteNode[], initial: number, blockedCoupler: string = '') {
  if (!Number.isInteger(initial) || initial < 0 || initial > 6) throw new Error('Normal group-telegram exercise supports RC 0–6.');
  let rc = initial;
  return nodes.reduce<Array<{id: string; before: number; after: number; forwarded: boolean; blocked: boolean; reason: string}>>((trace, node, index) => {
    if (trace.some(e => e.blocked)) return trace;
    const before = rc;
    const bridge = node.type !== 'device' && node.type !== 'static_device';
    const filtered = bridge && node.type !== 'repeater' && node.id === blockedCoupler;
    const blocked = bridge && (before === 0 || filtered);
    if (bridge && !blocked) rc--;
    const reason = index === 0 ? `Source sends a group telegram with RC ${rc}.` :
      !bridge ? `Telegram present on this segment with RC ${rc}. End devices do not forward it; a linked receiver may accept it even at RC 0.` :
      before === 0 ? 'Not forwarded: incoming RC is 0. Devices on the incoming segment can still receive it.' :
      filtered ? 'Not forwarded: destination group address is absent from this coupler’s filter table.' :
      `${node.type === 'repeater' ? 'Repeater has no group-address filter' : 'Group-address filter permits this route'}; forwarded with RC ${before} → ${rc}.`;
    trace.push({id: node.id, before, after: rc, forwarded: bridge && !blocked, blocked, reason});
    return trace;
  }, []);
}
