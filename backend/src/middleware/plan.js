import { isProUser } from '../utils/plan.js';

export function requireProPlan(req, res, next) {
  if (!isProUser(req.user)) {
    return res.status(403).json({
      message: 'This feature requires a Pro plan',
      code: 'PRO_REQUIRED',
    });
  }
  next();
}
