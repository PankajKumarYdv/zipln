/**
 * Creates or upgrades a Pro user for local testing.
 *
 * Defaults (override via .env):
 *   SEED_PRO_EMAIL, SEED_PRO_PASSWORD, SEED_PRO_NAME
 *
 * Run: npm run seed:pro
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { User } from '../src/models/User.js';

const email = (process.env.SEED_PRO_EMAIL || 'pro.test@shortlink.dev').toLowerCase();
const password = process.env.SEED_PRO_PASSWORD || 'ProTest123!';
const name = process.env.SEED_PRO_NAME || 'Pro Tester';
const proExpiresAt = new Date('2099-12-31T23:59:59.000Z');

async function main() {
  await connectDb();

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'pro';
    user.proTier = '12m';
    user.proExpiresAt = proExpiresAt;
    if (process.env.SEED_PRO_RESET_PASSWORD === '1') {
      user.password = password;
    }
    await user.save();
    console.log('[seed:pro] Updated existing user to Pro:', email);
    if (process.env.SEED_PRO_RESET_PASSWORD === '1') {
      console.log('[seed:pro] Password set to:', password);
    } else {
      console.log(
        '[seed:pro] Password unchanged. Use SEED_PRO_RESET_PASSWORD=1 to set it to SEED_PRO_PASSWORD / default.'
      );
    }
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'pro',
      proTier: '12m',
      proExpiresAt,
    });
    console.log('[seed:pro] Created Pro test user:', email);
    console.log('[seed:pro] Password:', password);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:pro] Failed:', err.message);
  process.exit(1);
});
