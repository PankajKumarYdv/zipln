import { validationResult } from 'express-validator';
import { ApiKey, hashApiKey } from '../models/ApiKey.js';

export async function listKeys(req, res) {
  const keys = await ApiKey.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('name keyPrefix createdAt lastUsedAt')
    .lean();
  return res.json({ keys });
}

export async function createKey(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const name = req.body.name?.trim() || 'API Key';
  const raw = ApiKey.generateRawKey();
  const keyHash = hashApiKey(raw);
  const keyPrefix = `${raw.slice(0, 12)}…`;

  await ApiKey.create({
    userId: req.user._id,
    name,
    keyHash,
    keyPrefix,
  });

  return res.status(201).json({
    key: raw,
    message: 'Store this key securely; it will not be shown again.',
    name,
    keyPrefix,
  });
}

export async function revokeKey(req, res) {
  const { id } = req.params;
  const deleted = await ApiKey.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });
  if (!deleted) {
    return res.status(404).json({ message: 'API key not found' });
  }
  return res.status(204).send();
}
