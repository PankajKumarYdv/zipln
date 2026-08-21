import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Url } from '../models/Url.js';
import { ClickAnalytics } from '../models/ClickAnalytics.js';
import { ApiKey } from '../models/ApiKey.js';
import { userPayload } from './authController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, '../../uploads/avatars');

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

export async function updateProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, phone, country } = req.body;
  if (name == null && phone == null && country == null) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  if (name != null) req.user.name = String(name).trim().slice(0, 120);
  if (phone != null) req.user.phone = String(phone).trim().slice(0, 32);
  if (country != null) req.user.country = String(country).trim().slice(0, 80);
  await req.user.save();
  return res.json({ user: userPayload(req.user) });
}

export async function updatePassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { currentPassword, newPassword } = req.body;
  const full = await User.findById(req.user._id).select('+password');
  if (!(await full.comparePassword(currentPassword))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  full.password = newPassword;
  await full.save();
  return res.json({ message: 'Password updated' });
}

export async function uploadAvatar(req, res) {
  if (!req.file?.filename) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }
  const publicPath = `/uploads/avatars/${req.file.filename}`;
  const oldRelative = req.user.avatarUrl;
  if (oldRelative?.startsWith('/uploads/avatars/')) {
    const oldAbs = path.join(__dirname, '../..', oldRelative);
    safeUnlink(oldAbs);
  }
  req.user.avatarUrl = publicPath;
  await req.user.save();
  return res.json({ user: userPayload(req.user) });
}

export async function deleteAccount(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { password } = req.body;
  const full = await User.findById(req.user._id).select('+password');
  if (!(await full.comparePassword(password))) {
    return res.status(400).json({ message: 'Password is incorrect' });
  }
  if (full.avatarUrl?.startsWith('/uploads/avatars/')) {
    safeUnlink(path.join(__dirname, '../..', full.avatarUrl));
  }
  const urls = await Url.find({ userId: full._id }).select('_id').lean();
  const ids = urls.map((u) => u._id);
  if (ids.length) {
    await ClickAnalytics.deleteMany({ urlId: { $in: ids } });
  }
  await Url.deleteMany({ userId: full._id });
  await ApiKey.deleteMany({ userId: full._id });
  await User.findByIdAndDelete(full._id);
  return res.status(204).send();
}

export function ensureUploadDir() {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
}

export function getUploadRoot() {
  return uploadRoot;
}
