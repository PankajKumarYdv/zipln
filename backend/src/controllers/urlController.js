import { validationResult } from 'express-validator';
import { Url } from '../models/Url.js';
import { ClickAnalytics } from '../models/ClickAnalytics.js';
import {
  createShortUrl,
  createGuestShortUrl,
  findByShortCode,
  isExpired,
  recordClick,
} from '../services/urlService.js';

export async function listMine(req, res) {
  const urls = await Url.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  const base = getPublicBase(req);
  return res.json({
    urls: urls.map((u) => ({
      id: String(u._id),
      originalUrl: u.originalUrl,
      shortCode: u.shortCode,
      shortUrl: `${base}/${u.shortCode}`,
      clickCount: u.clickCount,
      createdAt: u.createdAt,
      expiresAt: u.expiresAt,
      isCustomAlias: u.isCustomAlias,
      expired: u.expiresAt ? new Date(u.expiresAt) <= new Date() : false,
    })),
  });
}

export async function createMine(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { url, customAlias, expiresAt } = req.body;
  try {
    const doc = await createShortUrl({
      user: req.user,
      originalUrl: url,
      customAlias,
      expiresAt: expiresAt || null,
    });
    const base = getPublicBase(req);
    return res.status(201).json({
      url: {
        id: String(doc._id),
        originalUrl: doc.originalUrl,
        shortCode: doc.shortCode,
        shortUrl: `${base}/${doc.shortCode}`,
        clickCount: doc.clickCount,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt,
        isCustomAlias: doc.isCustomAlias,
      },
    });
  } catch (e) {
    if (e.code === 'ALIAS_TAKEN') {
      return res.status(409).json({ message: 'This alias is already in use' });
    }
    if (e.code === 'INVALID_URL') {
      return res.status(400).json({ message: 'Invalid URL (http/https only)' });
    }
    if (e.code === 'INVALID_EXPIRY') {
      return res.status(400).json({ message: 'Invalid expiration date' });
    }
    if (e.code === 'CUSTOM_ALIAS_PRO_ONLY') {
      return res.status(403).json({
        message: 'Custom aliases are available on the Pro plan',
        code: 'PRO_REQUIRED',
      });
    }
    if (e.code === 'INVALID_ALIAS') {
      return res.status(400).json({
        message:
          'Alias must be 3–32 characters: letters, numbers, underscore, hyphen',
      });
    }
    if (e.code === 'CODE_GENERATION_FAILED') {
      return res.status(503).json({ message: 'Could not generate a short code' });
    }
    return res.status(500).json({ message: 'Failed to shorten URL' });
  }
}

export async function removeMine(req, res) {
  const { id } = req.params;
  const deleted = await Url.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });
  if (!deleted) {
    return res.status(404).json({ message: 'URL not found' });
  }
  await ClickAnalytics.deleteMany({ urlId: deleted._id });
  return res.status(204).send();
}

export async function publicShorten(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const user = req.apiKeyUser;
  const { url, customAlias, expiresAt } = req.body;
  try {
    const doc = await createShortUrl({
      user,
      originalUrl: url,
      customAlias,
      expiresAt: expiresAt || null,
    });
    const base = getPublicBase(req);
    return res.status(201).json({
      shortCode: doc.shortCode,
      shortUrl: `${base}/${doc.shortCode}`,
      originalUrl: doc.originalUrl,
      expiresAt: doc.expiresAt,
    });
  } catch (e) {
    if (e.code === 'ALIAS_TAKEN') {
      return res.status(409).json({ message: 'Alias taken' });
    }
    if (e.code === 'INVALID_URL') {
      return res.status(400).json({ message: 'Invalid URL' });
    }
    if (e.code === 'INVALID_EXPIRY') {
      return res.status(400).json({ message: 'Invalid expiry' });
    }
    if (e.code === 'INVALID_ALIAS') {
      return res.status(400).json({ message: 'Invalid alias' });
    }
    if (e.code === 'CUSTOM_ALIAS_PRO_ONLY') {
      return res.status(403).json({ message: 'Pro required for custom alias' });
    }
    return res.status(500).json({ message: 'Shorten failed' });
  }
}

export async function guestShorten(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { url } = req.body;
  try {
    const doc = await createGuestShortUrl(url);
    const base = getPublicBase(req);
    return res.status(201).json({
      shortCode: doc.shortCode,
      shortUrl: `${base}/${doc.shortCode}`,
      originalUrl: doc.originalUrl,
    });
  } catch (e) {
    if (e.code === 'INVALID_URL') {
      return res.status(400).json({ message: 'Invalid URL (http/https only)' });
    }
    if (e.code === 'CODE_GENERATION_FAILED') {
      return res.status(503).json({ message: 'Could not generate a short code' });
    }
    return res.status(500).json({ message: 'Failed to shorten URL' });
  }
}

export async function redirectByCode(req, res) {
  const { shortCode } = req.params;
  const doc = await findByShortCode(shortCode);
  if (!doc || isExpired(doc)) {
    const status = doc && isExpired(doc) ? 410 : 404;
    const message = doc ? 'This link has expired' : 'Short URL not found';
    if (req.accepts('html')) {
      return res
        .status(status)
        .type('html')
        .send(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${message}</title></head><body><p>${message}</p></body></html>`
        );
    }
    return res.status(status).json({ message });
  }
  await recordClick({ urlDoc: doc, req });
  return res.redirect(302, doc.originalUrl);
}

export function getPublicBase(req) {
  const fromEnv = process.env.PUBLIC_SHORT_URL_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = req.get('host');
  const proto = req.protocol;
  return `${proto}://${host}`;
}
