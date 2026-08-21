import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const PRICING = [
  { tier: '1m', title: '1 Month', price: 100, blurb: 'Flexible monthly Pro' },
  { tier: '6m', title: '6 Months', price: 500, blurb: 'Save vs monthly' },
  { tier: '12m', title: '1 Year', price: 1000, blurb: 'Best value' },
];

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const HERO_GLOW_IDLE =
  'radial-gradient(580px circle at 50% 38%, rgba(99, 102, 241, 0.22), transparent 55%), radial-gradient(420px circle at 65% 50%, rgba(56, 189, 248, 0.12), transparent 50%)';

/** Full-hero ambient “liquid light” — slow drifting blurs + shimmer (not cursor-driven). */
function HeroLiquidField() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(165,180,252,0.35),transparent_55%),radial-gradient(ellipse_90%_70%_at_100%_50%,rgba(125,211,252,0.22),transparent_50%),radial-gradient(ellipse_80%_60%_at_0%_80%,rgba(196,181,253,0.2),transparent_45%)]" />
      <div className="absolute -left-[20%] -top-[25%] h-[95%] w-[75%] rounded-full bg-sky-300/30 blur-[120px] motion-safe:animate-hero-liquid-1" />
      <div className="absolute -right-[15%] top-[15%] h-[90%] w-[70%] rounded-full bg-indigo-300/25 blur-[110px] motion-safe:animate-hero-liquid-2" />
      <div className="absolute bottom-[-20%] left-[10%] h-[75%] w-[85%] rounded-full bg-violet-300/28 blur-[130px] motion-safe:animate-hero-liquid-3" />
      <div className="absolute left-[25%] -top-[30%] h-[65%] w-[55%] rounded-full bg-cyan-200/25 blur-[100px] motion-safe:animate-hero-liquid-4" />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-[0.55] motion-safe:animate-hero-shimmer motion-reduce:opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(115deg, transparent 36%, rgba(255,255,255,0.5) 49%, rgba(255,255,255,0.2) 51%, transparent 64%)',
          backgroundSize: '240% 240%',
          backgroundPosition: '0% 50%',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-indigo-50/15" />
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const { user, isPro, upgradePlan } = useAuth();
  const [guestUrl, setGuestUrl] = useState('');
  const [guestResult, setGuestResult] = useState(null);
  const [guestErr, setGuestErr] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [upgradeBusy, setUpgradeBusy] = useState(null);

  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);
  const rafRef = useRef(0);
  const pendingEventRef = useRef(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotionRef.current = mq.matches;
    const onChange = () => {
      reduceMotionRef.current = mq.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const applyHeroPointer = useCallback(() => {
    const e = pendingEventRef.current;
    pendingEventRef.current = null;
    rafRef.current = 0;
    if (reduceMotionRef.current || !e || !heroRef.current) return;

    const r = heroRef.current.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;

    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const x = Math.max(0, Math.min(1, px));
    const y = Math.max(0, Math.min(1, py));

    if (glowRef.current) {
      const gx = x * 100;
      const gy = y * 100;
      glowRef.current.style.background = [
        `radial-gradient(580px circle at ${gx}% ${gy}%, rgba(99, 102, 241, 0.38), transparent 58%)`,
        `radial-gradient(460px circle at ${gx * 0.88 + 12}% ${gy * 0.92 + 4}%, rgba(56, 189, 248, 0.22), transparent 52%)`,
        `radial-gradient(320px circle at ${gx * 0.75 + 18}% ${gy * 0.7 + 10}%, rgba(192, 132, 252, 0.15), transparent 48%)`,
      ].join(', ');
    }

    const blobs = [
      [blob1Ref, { mx: 40, my: 30 }],
      [blob2Ref, { mx: -32, my: 36 }],
      [blob3Ref, { mx: 26, my: -28 }],
    ];
    for (const [ref, { mx, my }] of blobs) {
      const el = ref.current;
      if (!el) continue;
      el.style.transform = `translate(${(x - 0.5) * mx}px, ${(y - 0.5) * my}px)`;
    }
  }, []);

  const onHeroPointerMove = useCallback(
    (e) => {
      if (reduceMotionRef.current) return;
      pendingEventRef.current = e;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(applyHeroPointer);
      }
    },
    [applyHeroPointer]
  );

  const onHeroPointerLeave = useCallback(() => {
    pendingEventRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (glowRef.current) glowRef.current.style.background = HERO_GLOW_IDLE;
    for (const ref of [blob1Ref, blob2Ref, blob3Ref]) {
      if (ref.current) ref.current.style.transform = 'translate(0, 0)';
    }
  }, []);

  async function handleGuestShorten(e) {
    e.preventDefault();
    setGuestErr('');
    setGuestResult(null);
    setGuestLoading(true);
    try {
      const { data } = await api.post('/api/guest/shorten', {
        url: guestUrl.trim(),
      });
      setGuestResult(data);
      setGuestUrl('');
    } catch (err) {
      setGuestErr(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Could not shorten'
      );
    } finally {
      setGuestLoading(false);
    }
  }

  async function copyGuest() {
    if (!guestResult?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(guestResult.shortUrl);
    } catch {
      /* ignore */
    }
  }

  async function handleUpgrade(tier) {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isPro) return;
    setUpgradeBusy(tier);
    try {
      await upgradePlan(tier);
    } catch {
      /* toast optional */
    } finally {
      setUpgradeBusy(null);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        onMouseMove={onHeroPointerMove}
        onMouseLeave={onHeroPointerLeave}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            ref={blob1Ref}
            className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl will-change-transform"
          />
          <div
            ref={blob2Ref}
            className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl will-change-transform"
          />
          <div
            ref={blob3Ref}
            className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl will-change-transform"
          />
          <HeroLiquidField />
          <div
            ref={glowRef}
            className="absolute inset-0 z-[2]"
            style={{ background: HERO_GLOW_IDLE }}
          />
          <svg
            className="absolute right-[8%] top-24 z-[2] hidden w-56 opacity-50 lg:block"
            viewBox="0 0 200 200"
            aria-hidden
          >
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="88" fill="url(#g1)" opacity="0.35" />
            <rect
              x="48"
              y="48"
              width="104"
              height="104"
              rx="24"
              fill="white"
              fillOpacity="0.5"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="initial"
          animate="show"
          className="text-center"
        >
          <motion.p
            variants={fade}
            className="mb-4 inline-flex rounded-full border border-white/60 bg-white/45 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-accent shadow-sm backdrop-blur-md"
          >
            Glassy · Fast · Measurable
          </motion.p>
          <motion.h1
            variants={fade}
            className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            Short links that feel
            <br />
            <span className="bg-gradient-to-r from-accent via-violet-500 to-sky-500 bg-clip-text text-transparent">
              premium out of the box
            </span>
          </motion.h1>
          <motion.p
            variants={fade}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600"
          >
            Paste any URL and get a short link instantly — no account required.
            Sign in to manage links, unlock analytics, and automate with API
            keys on Pro.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mx-auto mt-12 max-w-3xl"
        >
          <GlassCard strong className="p-6 sm:p-8">
            <h2 className="text-center font-display text-xl font-semibold text-slate-900">
              Try it now
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Shorten without signing in.{' '}
              <span className="font-semibold text-accent">
                Login to manage and track your links.
              </span>
            </p>
            <form onSubmit={handleGuestShorten} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                className="input-glass flex-1"
                placeholder="https://example.com/your-long-link"
                value={guestUrl}
                onChange={(e) => setGuestUrl(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={guestLoading}
                className="btn-primary shrink-0 px-8 py-3 sm:py-2.5"
              >
                {guestLoading ? 'Shortening…' : 'Shorten'}
              </button>
            </form>
            {guestErr && (
              <p className="mt-3 text-center text-sm text-rose-700">{guestErr}</p>
            )}
            {guestResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 rounded-xl border border-emerald-200/60 bg-emerald-500/10 p-4 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Your short link
                </p>
                <p className="mt-2 break-all font-mono text-sm font-medium text-slate-800">
                  {guestResult.shortUrl}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={copyGuest} className="btn-primary text-sm">
                    Copy link
                  </button>
                  <a
                    href={guestResult.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-sm"
                  >
                    Open
                  </a>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        <div className="mt-16 flex flex-wrap justify-center gap-4">
          <Link to="/auth" className="btn-primary px-8 py-3">
            Create free account
          </Link>
          <Link to="/dashboard" className="btn-ghost px-8 py-3">
            Go to dashboard
          </Link>
          <Link 
            to="/extension"
            className="btn-ghost px-8 py-3 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>
            Add to Chrome
          </Link>
        </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section id="pricing" className="mt-28 scroll-mt-24">
          <h2 className="text-center font-display text-3xl font-bold text-slate-900">
            Simple Pro pricing (INR)
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            Simulated checkout — pick a term to unlock Pro instantly in this demo.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRICING.map((p) => (
              <motion.div
                key={p.tier}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <GlassCard
                  className={`h-full text-center ${
                    p.tier === '12m' ? 'ring-2 ring-accent/40' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-500">{p.title}</p>
                  <p className="mt-2 font-display text-4xl font-bold text-slate-900">
                    ₹{p.price}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{p.blurb}</p>
                  <button
                    type="button"
                    disabled={Boolean(upgradeBusy) || isPro}
                    onClick={() => handleUpgrade(p.tier)}
                    className="btn-primary mt-6 w-full"
                  >
                    {isPro
                      ? 'You are on Pro'
                      : upgradeBusy === p.tier
                        ? 'Upgrading…'
                        : 'Upgrade to Pro'}
                  </button>
                  {!user && (
                    <p className="mt-2 text-xs text-slate-500">Sign in when prompted</p>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center font-display text-2xl font-bold text-slate-900">
            Free vs Pro
          </h2>
          <div className="mx-auto mt-8 max-w-4xl overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80">
                  <th className="py-3 pr-4 font-display text-slate-700">Feature</th>
                  <th className="py-3 pr-4 font-semibold text-slate-800">Free</th>
                  <th className="py-3 font-semibold text-accent">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {[
                  ['Shorten without login', '✓', '✓'],
                  ['Dashboard & link management', '✓', '✓'],
                  ['Daily create limit', 'Limited', 'Unlimited'],
                  ['Custom aliases', '—', '✓'],
                  ['Full analytics & charts', 'Preview (5 rows)', '✓'],
                  ['API keys & POST /api/shorten', '—', '✓'],
                ].map(([f, free, pro]) => (
                  <tr key={f}>
                    <td className="py-3 pr-4 text-slate-700">{f}</td>
                    <td className="py-3 pr-4 text-slate-600">{free}</td>
                    <td className="py-3 text-slate-800">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Hash-safe short codes',
              body: 'Collision-aware generation with MongoDB uniqueness guarantees.',
            },
            {
              title: 'Analytics that scale',
              body: 'Device, browser, OS, ISP, and geo hints with pagination built in.',
            },
            {
              title: 'SaaS-ready roles',
              body: 'Free and Pro paths with simulated billing — swap in a gateway anytime.',
            },
          ].map((item) => (
            <GlassCard key={item.title}>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
