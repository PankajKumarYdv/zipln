/** Supports legacy DB values (`plan`) and current `role` field */
export function normalizeRole(user) {
  if (!user) return 'free';
  const r = user.role;
  if (r === 'pro') return 'pro';
  if (r === 'free') return 'free';
  const p = user.plan;
  if (p === 'paid' || p === 'pro') return 'pro';
  if (p === 'free') return 'free';
  return 'free';
}

export function isProUser(user) {
  return normalizeRole(user) === 'pro';
}
