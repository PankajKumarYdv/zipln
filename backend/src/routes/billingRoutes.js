import { Router } from 'express';
import { body } from 'express-validator';
import {
  upgradePro,
  simulateDowngrade,
  pricingList,
} from '../controllers/billingController.js';
import { composeAuth } from '../middleware/auth.js';

const router = Router();

router.get('/pricing', pricingList);
router.post(
  '/upgrade',
  ...composeAuth(),
  body('tier').optional().isIn(['1m', '6m', '12m']),
  upgradePro
);
router.post('/downgrade', ...composeAuth(), simulateDowngrade);

export default router;
