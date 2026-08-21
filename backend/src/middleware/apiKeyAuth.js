import { ApiKey, hashApiKey } from '../models/ApiKey.js';
import { User } from '../models/User.js';
import { isProUser } from '../utils/plan.js';

const HEADER = 'x-api-key';

export async function apiKeyRequired(req, res, next) {
  const raw = req.get(HEADER);
  if (!raw?.trim()) {
    return res.status(401).json({ message: 'Missing X-API-Key header' });
  }
  try {
    const digest = hashApiKey(raw.trim());
    const doc = await ApiKey.findOne({ keyHash: digest });
    if (!doc) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    const user = await User.findById(doc.userId);
    if (!user || !isProUser(user)) {
      return res.status(403).json({ message: 'API access requires an active Pro plan' });
    }
    doc.lastUsedAt = new Date();
    await doc.save();
    req.apiKeyUser = user;
    req.apiKeyDoc = doc;
    next();
  } catch {
    return res.status(500).json({ message: 'API key validation failed' });
  }
}
