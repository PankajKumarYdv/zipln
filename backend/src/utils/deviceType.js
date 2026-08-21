export function parseDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (!ua) return 'unknown';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
  if (/mozilla|chrome|safari|firefox|edge|opera/i.test(ua)) return 'desktop';
  return 'unknown';
}
