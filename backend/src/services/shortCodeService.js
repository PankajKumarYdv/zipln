import { nanoid } from 'nanoid';
import { Url } from '../models/Url.js';

const DEFAULT_LENGTH = 7;
const DEFAULT_RETRIES = 12;

function getLength() {
  const n = Number.parseInt(process.env.SHORT_CODE_LENGTH, 10);
  return Number.isFinite(n) && n >= 4 && n <= 16 ? n : DEFAULT_LENGTH;
}

function getMaxRetries() {
  const n = Number.parseInt(process.env.SHORT_CODE_MAX_COLLISION_RETRIES, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RETRIES;
}

const CUSTOM_ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

/** Avoid shadowing top-level routes like /api */
const RESERVED_SHORT_CODES = new Set([
  'api',
  'health',
  'favicon.ico',
  'robots.txt',
]);

export function isReservedShortCode(code) {
  return RESERVED_SHORT_CODES.has(String(code).toLowerCase());
}

export function isValidCustomAlias(alias) {
  if (typeof alias !== 'string' || !CUSTOM_ALIAS_REGEX.test(alias)) return false;
  return !isReservedShortCode(alias);
}

/**
 * HashMap-style mapping: unique shortCode → document in MongoDB.
 * On collision, regenerates a new code up to max retries.
 */
export async function generateUniqueShortCode({ preferredAlias = null } = {}) {
  if (preferredAlias) {
    const normalized = preferredAlias.trim().toLowerCase();
    if (isReservedShortCode(normalized)) {
      const err = new Error('INVALID_ALIAS');
      err.code = 'INVALID_ALIAS';
      throw err;
    }
    const exists = await Url.exists({ shortCode: normalized });
    if (exists) {
      const err = new Error('ALIAS_TAKEN');
      err.code = 'ALIAS_TAKEN';
      throw err;
    }
    return normalized;
  }

  const length = getLength();
  const maxRetries = getMaxRetries();
  for (let i = 0; i < maxRetries; i += 1) {
    const code = nanoid(length).toLowerCase();
    if (isReservedShortCode(code)) continue;
    const taken = await Url.exists({ shortCode: code });
    if (!taken) return code;
  }
  const err = new Error('CODE_GENERATION_FAILED');
  err.code = 'CODE_GENERATION_FAILED';
  throw err;
}
