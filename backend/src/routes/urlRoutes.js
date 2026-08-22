import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listMine,
  createMine,
  removeMine,
} from '../controllers/urlController.js';
import {
  analyticsSummary,
  analyticsEvents,
  analyticsChart,
} from '../controllers/urlAnalyticsController.js';
import { composeAuth } from '../middleware/auth.js';
import { dailyUrlCreateLimit } from '../middleware/dailyUrlLimit.js';

const router = Router();
const auth = composeAuth();

const createRules = [
  body('url').isString().trim().notEmpty().isLength({ max: 2048 }),
  body('customAlias').optional({ nullable: true }).isString().trim(),
  body('expiresAt').optional({ nullable: true }).isISO8601(),
];

router.get('/', ...auth, listMine);
router.post('/', ...auth, dailyUrlCreateLimit, createRules, createMine);

router.get(
  '/:id/stats/summary',
  ...auth,
  param('id').isMongoId(),
  analyticsSummary
);
router.get(
  '/:id/stats/activity',
  ...auth,
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  analyticsEvents
);
router.get(
  '/:id/stats/timeline',
  ...auth,
  param('id').isMongoId(),
  query('period').optional().isIn(['day', 'week', 'month', 'year', 'all']),
  analyticsChart
);

/** Legacy paths (same handlers) — older clients and cached bundles */
router.get(
  '/:id/analytics/summary',
  ...auth,
  param('id').isMongoId(),
  analyticsSummary
);
router.get(
  '/:id/analytics/events',
  ...auth,
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  analyticsEvents
);
router.get(
  '/:id/analytics/chart',
  ...auth,
  param('id').isMongoId(),
  query('period').optional().isIn(['day', 'week', 'month', 'year', 'all']),
  analyticsChart
);

router.delete('/:id', ...auth, param('id').isMongoId(), removeMine);

export default router;
