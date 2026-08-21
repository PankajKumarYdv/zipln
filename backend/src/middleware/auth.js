import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

async function expireProIfNeeded(user) {
  if (user.role !== 'pro' || !user.proExpiresAt) return;
  const expMs = new Date(user.proExpiresAt).getTime();
  if (Number.isNaN(expMs) || expMs >= Date.now()) return;
  user.role = 'free';
  user.proTier = 'none';
  user.proExpiresAt = null;
  await user.save();
}

export async function loadUser(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(401).json({ message: 'User not found' });
    }
    const oid = new mongoose.Types.ObjectId(req.userId);
    const raw = await User.collection.findOne({ _id: oid });
    if (!raw) {
      return res.status(401).json({ message: 'User not found' });
    }
    /** Legacy `plan` in DB is not mapped by Mongoose; sync to `role` so Pro is not shown as Free */
    if (raw.plan === 'paid' || raw.plan === 'pro') {
      await User.collection.updateOne(
        { _id: oid },
        { $set: { role: 'pro' }, $unset: { plan: '' } }
      );
    } else if (raw.role == null || raw.role === '') {
      await User.collection.updateOne({ _id: oid }, { $set: { role: 'free' } });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    await expireProIfNeeded(user);
    req.user = await User.findById(req.userId);
    next();
  } catch {
    return res.status(500).json({ message: 'Failed to load user' });
  }
}

export function composeAuth() {
  return [authRequired, loadUser];
}
