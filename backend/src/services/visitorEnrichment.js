import { whoisIp } from 'whoiser';
import { lookupIp } from './ipEnrichment.js';

function isLocalIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.'))
    return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

function cleanIp(ip) {
  return ip.replace(/^::ffff:/i, '').trim();
}

/**
 * HTTPS geo (works when plain HTTP to ip-api is blocked).
 */
export async function lookupGeo(ip) {
  const fallback = {
    country: '—',
    location: '—',
    isp: '—',
    vpnLikely: false,
  };
  if (!ip || isLocalIp(ip)) {
    return { ...fallback, country: 'Local', location: 'Local', isp: 'Local' };
  }
  const clean = cleanIp(ip);
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(clean)}`, {
      signal: controller.signal,
    });
    clearTimeout(t);
    const j = await res.json();
    if (!j.success) throw new Error('geo');
    const isp =
      j.connection?.isp ||
      j.connection?.org ||
      j.connection?.domain ||
      '—';
    const location =
      [j.city, j.region, j.country].filter(Boolean).join(', ') ||
      j.country ||
      '—';
    return {
      country: j.country || '—',
      location,
      isp,
      vpnLikely: Boolean(j.connection?.is_proxy || j.connection?.is_hosting),
    };
  } catch {
    return lookupIp(ip);
  }
}

function formatWhoisSummary(data) {
  if (!data || typeof data !== 'object') return '';
  const parts = [];
  if (data.Organization) parts.push(String(data.Organization).split('\n')[0]);
  if (data.NetName) parts.push(`NetName: ${data.NetName}`);
  if (data.route) parts.push(String(data.route));
  const org = data.organisation;
  if (org && typeof org === 'object') {
    if (org.OrgName) parts.push(String(org.OrgName));
    const loc = [org.City, org.StateProv, org.Country].filter(Boolean).join(', ');
    if (loc) parts.push(loc);
  }
  const text = parts.filter(Boolean).join(' · ');
  return text.length > 600 ? `${text.slice(0, 597)}…` : text;
}

/**
 * IP WHOIS (RDAP-backed via whoiser) — org, netname, route.
 */
export async function lookupWhoisSummary(ip) {
  if (!ip || isLocalIp(ip)) return '';
  const clean = cleanIp(ip);
  try {
    const data = await Promise.race([
      whoisIp(clean, { timeout: 6000 }),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error('whois timeout')), 6500)
      ),
    ]);
    return formatWhoisSummary(data);
  } catch {
    return '';
  }
}

/**
 * Geo + WHOIS in parallel; safe to call fire-and-forget after recording a click.
 */
export async function enrichVisitorRecord(clickId, ClickModel, ip) {
  const [geo, whoisSummary] = await Promise.all([
    lookupGeo(ip),
    lookupWhoisSummary(ip),
  ]);
  await ClickModel.findByIdAndUpdate(clickId, {
    country: geo.country,
    location: geo.location,
    isp: geo.isp,
    vpnLikely: geo.vpnLikely,
    whoisSummary: whoisSummary || '',
  });
}
