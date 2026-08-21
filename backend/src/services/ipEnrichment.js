/**
 * Best-effort IP enrichment (ip-api.com free tier). Non-blocking for redirects when used async.
 */
export async function lookupIp(ip) {
  const fallback = {
    country: '—',
    location: '—',
    isp: '—',
    vpnLikely: false,
  };
  if (!ip || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.startsWith('127.')) {
    return { ...fallback, country: 'Local', location: 'Local' };
  }
  const clean = ip.replace(/^::ffff:/, '');
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,country,city,isp,proxy,hosting,mobile`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    const j = await res.json();
    if (j.status !== 'success') return fallback;
    const location = [j.city, j.country].filter(Boolean).join(', ') || j.country || '—';
    return {
      country: j.country || '—',
      location,
      isp: j.isp || '—',
      vpnLikely: Boolean(j.proxy || j.hosting),
    };
  } catch {
    return fallback;
  }
}
