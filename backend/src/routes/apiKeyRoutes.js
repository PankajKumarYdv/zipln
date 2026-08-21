import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listKeys,
  createKey,
  revokeKey,
} from '../controllers/apiKeyController.js';
import { composeAuth } from '../middleware/auth.js';
import { requireProPlan } from '../middleware/plan.js';

const router = Router();
const auth = composeAuth();

router.use(...auth);
router.use(requireProPlan);

router.get('/', listKeys);
router.post('/', body('name').optional().isString().trim().isLength({ max: 80 }), createKey);
router.delete('/:id', param('id').isMongoId(), revokeKey);

export default router;
