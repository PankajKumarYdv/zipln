import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { normalizeRole } from '../utils/plan.js';

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user),
    phone: user.phone || '',
    country: user.country || '',
    avatarUrl: user.avatarUrl || '',
    proTier: user.proTier || 'none',
    proExpiresAt: user.proExpiresAt || null,
  };
}

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, password } = req.body;
  try {
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    const token = signToken(user._id.toString());
    return res.status(201).json({
      token,
      user: userPayload(user),
    });
  } catch (e) {
    return res.status(500).json({ message: 'Registration failed' });
  }
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user._id.toString());
    return res.json({
      token,
      user: userPayload(user),
    });
  } catch {
    return res.status(500).json({ message: 'Login failed' });
  }
}

export async function me(req, res) {
  return res.json({
    user: userPayload(req.user),
  });
}
