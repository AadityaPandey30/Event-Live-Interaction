const configured = (process.env.SESSION_ID || 'catalygn-edge-workshop-1').trim();

export const SESSION_ID = configured;
export const DEFAULT_START_INDEX = 0;

export function startIndex() {
  const raw = Number.parseInt(process.env.SESSION_START_INDEX || '0', 10);
  return Number.isInteger(raw) && raw >= 0 ? raw : DEFAULT_START_INDEX;
}
