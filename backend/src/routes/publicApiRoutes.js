import { Router } from 'express';
import { body } from 'express-validator';
import { publicShorten } from '../controllers/urlController.js';
import { apiKeyRequired } from '../middleware/apiKeyAuth.js';
import { dailyUrlCreateLimit } from '../middleware/dailyUrlLimit.js';

const router = Router();

const shortenRules = [
  body('url').isString().trim().notEmpty().isLength({ max: 2048 }),
  body('customAlias').optional({ nullable: true }).isString().trim(),
  body('expiresAt').optional({ nullable: true }).isISO8601(),
];

/** POST /api/shorten — requires X-API-Key (Pro plan) */
router.post(
  '/shorten',
  apiKeyRequired,
  (req, res, next) => {
    req.user = req.apiKeyUser;
    next();
  },
  dailyUrlCreateLimit,
  shortenRules,
  publicShorten
);

export default router;
