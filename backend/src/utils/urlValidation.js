const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

export function isValidHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    return false;
  }
  if (!SAFE_PROTOCOLS.has(parsed.protocol)) return false;
  if (!parsed.hostname) return false;
  return true;
}

export function normalizeUrl(value) {
  return value.trim();
}
