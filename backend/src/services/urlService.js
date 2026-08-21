import UAParser from 'ua-parser-js';
import { Url } from '../models/Url.js';
import { ClickAnalytics } from '../models/ClickAnalytics.js';
import { generateUniqueShortCode, isValidCustomAlias } from './shortCodeService.js';
import { isValidHttpUrl, normalizeUrl } from '../utils/urlValidation.js';
import { parseDeviceType } from '../utils/deviceType.js';
import { isProUser } from '../utils/plan.js';
import { enrichVisitorRecord } from './visitorEnrichment.js';

export async function createShortUrl({
  user,
  originalUrl,
  customAlias,
  expiresAt,
}) {
  const normalized = normalizeUrl(originalUrl);
  if (!isValidHttpUrl(normalized)) {
    const err = new Error('INVALID_URL');
    err.code = 'INVALID_URL';
    throw err;
  }

  let expires = null;
  if (expiresAt) {
    expires = new Date(expiresAt);
    if (Number.isNaN(expires.getTime())) {
      const err = new Error('INVALID_EXPIRY');
      err.code = 'INVALID_EXPIRY';
      throw err;
    }
  }

  const wantsCustom =
    typeof customAlias === 'string' && customAlias.trim().length > 0;

  if (wantsCustom) {
    if (!isProUser(user)) {
      const err = new Error('CUSTOM_ALIAS_PRO_ONLY');
      err.code = 'CUSTOM_ALIAS_PRO_ONLY';
      throw err;
    }
    if (!isValidCustomAlias(customAlias.trim())) {
      const err = new Error('INVALID_ALIAS');
      err.code = 'INVALID_ALIAS';
      throw err;
    }
  }

  const shortCode = await generateUniqueShortCode({
    preferredAlias: wantsCustom ? customAlias.trim() : null,
  });

  const doc = await Url.create({
    userId: user._id,
    isAnonymous: false,
    shortCode,
    originalUrl: normalized,
    isCustomAlias: Boolean(wantsCustom),
    expiresAt: expires,
  });

  return doc;
}

export async function createGuestShortUrl(originalUrl) {
  const normalized = normalizeUrl(originalUrl);
  if (!isValidHttpUrl(normalized)) {
    const err = new Error('INVALID_URL');
    err.code = 'INVALID_URL';
    throw err;
  }

  const shortCode = await generateUniqueShortCode({ preferredAlias: null });

  return Url.create({
    userId: null,
    isAnonymous: true,
    shortCode,
    originalUrl: normalized,
    isCustomAlias: false,
    expiresAt: null,
  });
}

export async function findByShortCode(shortCode) {
  if (!shortCode || typeof shortCode !== 'string') return null;
  const code = shortCode.trim().toLowerCase();
  return Url.findOne({ shortCode: code });
}

export function isExpired(doc) {
  if (!doc?.expiresAt) return false;
  return new Date(doc.expiresAt) <= new Date();
}

function resolveDeviceType(ua, parser) {
  const t = parser.getDevice().type;
  if (t === 'mobile') return 'mobile';
  if (t === 'tablet') return 'tablet';
  if (parser.getBrowser().name || parser.getOS().name) return 'desktop';
  return parseDeviceType(ua);
}

export async function recordClick({ urlDoc, req }) {
  const ua = req.get('user-agent') || '';
  const parser = new UAParser(ua);
  const deviceType = resolveDeviceType(ua, parser);
  const osType = parser.getOS().name || 'unknown';
  const browserName = parser.getBrowser().name || 'unknown';
  const ip =
    req.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '';

  const doc = await ClickAnalytics.create({
    urlId: urlDoc._id,
    shortCode: urlDoc.shortCode,
    userAgent: ua,
    deviceType,
    osType,
    browserName,
    ip,
    country: '',
    location: '',
    isp: '',
    vpnLikely: false,
  });

  urlDoc.clickCount += 1;
  await urlDoc.save();

  enrichVisitorRecord(doc._id, ClickAnalytics, ip).catch(() => {});
}
