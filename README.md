# ShortLink — MERN URL Shortener (SaaS)

Production-oriented URL shortener with guest shortening, JWT auth, Free/Pro roles, rich click analytics (pagination + charts for Pro), optional expiry, QR codes, and `POST /api/shorten` via API keys (Pro).

## Architecture

- **Backend** (`backend/`): Node.js, Express, Mongoose, JWT, express-rate-limit.
- **Frontend** (`frontend/`): React (Vite), Tailwind CSS, Axios, Framer Motion, Recharts, `react-qr-code`.

Short codes map **one-to-one** to documents in MongoDB (`shortCode` is unique). On collision, the generator retries with a new code (and rejects taken custom aliases).

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## Quick start

### 1. MongoDB

Start MongoDB locally or create a cluster and copy the connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET (16+ random characters)
npm install
npm run dev
```

API defaults to `http://localhost:5000`. Health check: `GET http://localhost:5000/health`.

**Pro test user (optional):** from `backend/`, run `npm run seed:pro`. Defaults: `pro.test@shortlink.dev` / `ProTest123!` (override with `SEED_PRO_EMAIL`, `SEED_PRO_PASSWORD` in `.env`). Pro expiry is set far in the future so the account stays Pro locally.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. In development, Vite proxies `/api`, `/health`, and `/uploads` to the backend.

### 4. Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

Set `VITE_API_URL` in `.env` to your public API origin when the app and API are on different hosts. If you use `vite preview` without a proxy, set `VITE_API_URL=http://localhost:5000` (or your API URL); the production bundle otherwise assumes the API on the same hostname port **5000**.

### Click analytics enrichment

Each redirect records **User-Agent** (device, OS, browser) immediately. **IP** is used asynchronously (non-blocking for redirects) to:

1. Resolve **geo + ISP** over **HTTPS** (`ipwho.is`), with **HTTP ip-api.com** as fallback.
2. Run **IP WHOIS** via the **`whoiser`** library (registry/RDAP-style fields such as org, netname, route) and store a short summary on the click row.

## Environment variables

### Backend (`.env`)

See `backend/.env.example`. Important keys:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLIENT_URL` | CORS origin (e.g. `http://localhost:5173`) |
| `FREE_DAILY_URL_LIMIT` | Max new links per UTC day for free users |
| `PUBLIC_SHORT_URL_BASE` | Optional; base URL shown in API responses for short links |
| `PUBLIC_API_RATE_LIMIT_*` | Window/max for `POST /api/shorten` per IP |
| `GUEST_SHORTEN_HOURLY_LIMIT` | Max guest shortens per IP per hour |

### Frontend (`.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL; leave empty in dev to use the Vite proxy |

## API summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Current user (`role`: `free` \| `pro`) |
| POST | `/api/guest/shorten` | — | Shorten without auth (IP rate limit) |
| GET | `/api/urls` | JWT | List my URLs |
| POST | `/api/urls` | JWT | Create short URL (daily limit for Free) |
| DELETE | `/api/urls/:id` | JWT | Delete URL + analytics |
| GET | `/api/urls/:id/stats/summary` | JWT | Totals, click rate, day/month/year counts |
| GET | `/api/urls/:id/stats/events` | JWT | Paginated device rows (`page`, `limit`) |
| GET | `/api/urls/:id/stats/chart` | JWT + Pro | Time-series (`period=day\|week\|month\|year\|all`) |
| PATCH | `/api/settings/profile` | JWT | Name, phone, country |
| PATCH | `/api/settings/password` | JWT | Change password |
| POST | `/api/settings/avatar` | JWT | `multipart/form-data` field `avatar` |
| DELETE | `/api/settings/account` | JWT | Body `{ "password" }` — deletes user data |
| GET | `/api/keys` | JWT + Pro | List API key metadata |
| POST | `/api/keys` | JWT + Pro | Create API key (plaintext shown once) |
| DELETE | `/api/keys/:id` | JWT + Pro | Revoke key |
| GET | `/api/billing/pricing` | — | INR tier list (demo) |
| POST | `/api/billing/upgrade` | JWT | Body `{ "tier": "1m" \| "6m" \| "12m" }` — simulate Pro |
| POST | `/api/billing/downgrade` | JWT | Simulate downgrade to Free |
| POST | `/api/shorten` | `X-API-Key` | Public shorten (Pro + valid key) |
| GET | `/:shortCode` | — | Redirect; records click |

**Example — public shorten**

```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -H "X-API-Key: usk_your_key_here" \
  -d "{\"url\":\"https://example.com\"}"
```

## Plans (simulated)

- **Free:** Daily authenticated URL cap, analytics with blurred rows after the first 5 per page, no custom aliases, no API keys, no chart endpoint.
- **Pro:** Unlimited authenticated creates, custom aliases, full analytics + Recharts data via `/stats/chart`, API keys and `POST /api/shorten`. Demo pricing: ₹100 / ₹500 / ₹1000 (1m / 6m / 12m).

Use **Upgrade to Pro** on the homepage or **Settings → API access** after signing in.

## Security notes

- Use a strong `JWT_SECRET` in production.
- Serve the API over HTTPS and set `PUBLIC_SHORT_URL_BASE` to your public short domain if it differs from the API host.
- API keys are stored as SHA-256 hashes; the plaintext is only returned once at creation.

## License

MIT
