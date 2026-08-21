import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController.js';
import { authRequired, loadUser, composeAuth } from '../middleware/auth.js';

const router = Router();

const registerRules = [
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.get('/me', ...composeAuth(), me);

export default router;
