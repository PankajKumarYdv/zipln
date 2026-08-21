import { Router } from 'express';
import { body } from 'express-validator';
import { guestShorten } from '../controllers/urlController.js';

const router = Router();

const rules = [body('url').isString().trim().notEmpty().isLength({ max: 2048 })];

router.post('/shorten', rules, guestShorten);

export default router;
