import { userPayload } from './authController.js';

const TIERS = {
  '1m': { label: '1 Month', priceInr: 100, months: 1 },
  '6m': { label: '6 Months', priceInr: 500, months: 6 },
  '12m': { label: '1 Year', priceInr: 1000, months: 12 },
};

export async function upgradePro(req, res) {
  const tier = req.body?.tier || '1m';
  if (!TIERS[tier]) {
    return res.status(400).json({ message: 'Invalid subscription tier' });
  }
  req.user.role = 'pro';
  req.user.proTier = tier;
  const exp = new Date();
  exp.setUTCMonth(exp.getUTCMonth() + TIERS[tier].months);
  req.user.proExpiresAt = exp;
  await req.user.save();
  return res.json({
    message: `Pro activated (simulated) — ${TIERS[tier].label} @ ₹${TIERS[tier].priceInr}`,
    user: userPayload(req.user),
    tier: TIERS[tier],
  });
}

export async function simulateDowngrade(req, res) {
  req.user.role = 'free';
  req.user.proTier = 'none';
  req.user.proExpiresAt = null;
  await req.user.save();
  return res.json({
    message: 'Plan set to Free (simulated)',
    user: userPayload(req.user),
  });
}

export async function pricingList(_req, res) {
  return res.json({
    tiers: Object.entries(TIERS).map(([id, t]) => ({
      id,
      label: t.label,
      priceInr: t.priceInr,
      months: t.months,
    })),
  });
}
