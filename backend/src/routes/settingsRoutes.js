import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import {
  updateProfile,
  updatePassword,
  uploadAvatar,
  deleteAccount,
  getUploadRoot,
} from '../controllers/settingsController.js';
import { composeAuth } from '../middleware/auth.js';

const router = Router();
const auth = composeAuth();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadRoot()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 8);
    const safe =
      ext && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
        ? ext
        : '.jpg';
    cb(null, `${req.user._id}-${Date.now()}${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.patch(
  '/profile',
  ...auth,
  body('name').optional().trim().isLength({ min: 1, max: 120 }),
  body('phone').optional().isString().trim().isLength({ max: 32 }),
  body('country').optional().isString().trim().isLength({ max: 80 }),
  updateProfile
);

router.patch(
  '/password',
  ...auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8, max: 128 }),
  updatePassword
);

router.post(
  '/avatar',
  ...auth,
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Upload failed' });
      }
      next();
    });
  },
  uploadAvatar
);

router.delete(
  '/account',
  ...auth,
  body('password').notEmpty(),
  deleteAccount
);

export default router;
