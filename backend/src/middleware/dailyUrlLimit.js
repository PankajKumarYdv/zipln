import { Url } from '../models/Url.js';
import { isProUser } from '../utils/plan.js';

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function getFreeDailyLimit() {
  const n = Number.parseInt(process.env.FREE_DAILY_URL_LIMIT, 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

export async function dailyUrlCreateLimit(req, res, next) {
  if (isProUser(req.user)) {
    return next();
  }
  const since = startOfUtcDay();
  const count = await Url.countDocuments({
    userId: req.user._id,
    createdAt: { $gte: since },
  });
  const limit = getFreeDailyLimit();
  if (count >= limit) {
    return res.status(429).json({
      message: `Free plan allows up to ${limit} new links per day. Upgrade to Pro for unlimited.`,
      code: 'DAILY_LIMIT',
      limit,
    });
  }
  next();
}
