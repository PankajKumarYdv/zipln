import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import publicApiRoutes from './routes/publicApiRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { redirectByCode } from './controllers/urlController.js';
import { isReservedShortCode } from './services/shortCodeService.js';
import { ensureUploadDir } from './controllers/settingsController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  ensureUploadDir();

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '32kb' }));

  app.use(
    '/uploads',
    express.static(path.join(__dirname, '../uploads'), {
      maxAge: '7d',
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  const publicApiLimiter = rateLimit({
    windowMs:
      Number.parseInt(process.env.PUBLIC_API_RATE_LIMIT_WINDOW_MS, 10) ||
      15 * 60 * 1000,
    max: Number.parseInt(process.env.PUBLIC_API_RATE_LIMIT_MAX, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const guestShortenLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: Number.parseInt(process.env.GUEST_SHORTEN_HOURLY_LIMIT, 10) || 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many guest shortens, try again later' },
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/urls', urlRoutes);
  app.use('/api/keys', apiKeyRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/guest', guestShortenLimiter, guestRoutes);
  app.use('/api', publicApiLimiter, publicApiRoutes);

  app.get('/:shortCode', (req, res, next) => {
    const { shortCode } = req.params;
    if (isReservedShortCode(shortCode)) {
      return res.status(404).json({ message: 'Not found' });
    }
    return redirectByCode(req, res, next);
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
