import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { GlassCard } from '../components/GlassCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const LIMIT = 10;
const FREE_PREVIEW_ROWS = 5;
const MONGO_ID_RE = /^[a-f\d]{24}$/i;

function formatDt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function trunc(s, max = 44) {
  if (s == null || s === '') return '—';
  const t = String(s).trim();
  if (!t) return '—';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function formatAxiosError(e) {
  const data = e.response?.data;
  const msg =
    (typeof data === 'object' && data && 'message' in data && data.message) ||
    (typeof data === 'string' && data.trim());
  if (msg) return String(msg);
  if (e.response?.status === 404) {
    return 'Not found. If you recently updated the project, restart the backend (npm run dev in backend/) so routes match the frontend.';
  }
  if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
    return 'Cannot reach the API. Confirm the backend is running and VITE_API_URL (e.g. http://localhost:5000) is correct. Privacy/ad-block extensions can block localhost API calls—try pausing them for this site.';
  }
  if (e.code === 'ECONNABORTED') return 'Request timed out — try again.';
  return e.message || 'Request failed';
}

export function UrlAnalytics() {
  const { urlId } = useParams();
  const { isPro } = useAuth();
  const [summary, setSummary] = useState(null);
  const [eventsRes, setEventsRes] = useState(null);
  const [chart, setChart] = useState(null);
  const [period, setPeriod] = useState('month');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [err, setErr] = useState('');

  const loadChart = useCallback(async () => {
    if (!isPro || !urlId || !MONGO_ID_RE.test(urlId)) return;
    setChartLoading(true);
    try {
      const { data } = await api.get(
        `/api/urls/${urlId}/stats/timeline?period=${period}`
      );
      setChart(data);
    } catch {
      setChart(null);
    } finally {
      setChartLoading(false);
    }
  }, [urlId, period, isPro]);

  const fetchSummaryAndEvents = useCallback(async () => {
    if (!urlId || !MONGO_ID_RE.test(urlId)) {
      throw new Error('Invalid link id');
    }
    const [sum, ev] = await Promise.all([
      api.get(`/api/urls/${urlId}/stats/summary`),
      api.get(`/api/urls/${urlId}/stats/activity?page=${page}&limit=${LIMIT}`),
    ]);
    setSummary(sum.data);
    setEventsRes(ev.data);
  }, [urlId, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        await fetchSummaryAndEvents();
      } catch (e) {
        if (!cancelled) {
          setErr(formatAxiosError(e));
          setSummary(null);
          setEventsRes(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSummaryAndEvents]);

  useEffect(() => {
    if (!isPro) return;
    loadChart();
  }, [isPro, loadChart]);

  const pag = eventsRes?.pagination;
  const events = eventsRes?.events || [];
  const blurAfterIndex = !isPro ? FREE_PREVIEW_ROWS - 1 : Infinity;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/dashboard"
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Back to dashboard
      </Link>

      {loading && (
        <div className="mt-10 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {err && (
        <p className="mt-8 rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-800">
          {err}
        </p>
      )}

      {!loading && summary && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <h1 className="font-display text-3xl font-bold text-slate-900">
              Analytics
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-500">
              /{summary.shortCode}
            </p>
          </motion.div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Total clicks
              </p>
              <p className="mt-1 font-display text-2xl font-bold">{summary.totalClicks}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Click rate / day
              </p>
              <p className="mt-1 font-display text-2xl font-bold">{summary.clickRate}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs font-semibold uppercase text-slate-500">Today (UTC)</p>
              <p className="mt-1 font-display text-2xl font-bold">
                {summary.clicksPerPeriod?.day ?? 0}
              </p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs font-semibold uppercase text-slate-500">This month</p>
              <p className="mt-1 font-display text-2xl font-bold">
                {summary.clicksPerPeriod?.month ?? 0}
              </p>
            </GlassCard>
          </div>

          <GlassCard className="mt-6">
            <p className="text-xs font-semibold uppercase text-slate-500">This year</p>
            <p className="mt-1 font-display text-2xl font-bold">
              {summary.clicksPerPeriod?.year ?? 0}
            </p>
          </GlassCard>

          {isPro && (
            <GlassCard className="mt-8" strong>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-lg font-semibold">Click trend</h2>
                <div className="flex flex-wrap gap-2">
                  {['day', 'week', 'month', 'year', 'all'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                        period === p
                          ? 'bg-accent text-white shadow'
                          : 'bg-white/50 text-slate-600 hover:bg-white/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 h-72 w-full">
                {chartLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Loading chart…
                  </div>
                ) : chart?.points?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          background: 'rgba(255,255,255,0.95)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-16 text-center text-sm text-slate-500">No chart data yet.</p>
                )}
              </div>
            </GlassCard>
          )}

          <GlassCard className="mt-8">
            <h2 className="font-display text-lg font-semibold">Device &amp; traffic</h2>
            <p className="mt-1 text-sm text-slate-600">
              Parsed from each click&apos;s <strong>User-Agent</strong> and <strong>IP</strong>.
              Geo/ISP uses HTTPS geolocation; <strong>WHOIS</strong> uses registry data for the IP
              (filled asynchronously after the redirect). {LIMIT} rows per page. Free: first{' '}
              {FREE_PREVIEW_ROWS} rows sharp; the rest blurred.
            </p>

            <div className="relative mt-6 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase text-slate-500">
                    <th className="pb-2 pr-2">When</th>
                    <th className="pb-2 pr-2">IP</th>
                    <th className="pb-2 pr-2">Device</th>
                    <th className="pb-2 pr-2">OS</th>
                    <th className="pb-2 pr-2">Browser</th>
                    <th className="pb-2 pr-2 max-w-[140px]">User-Agent</th>
                    <th className="pb-2 pr-2">ISP</th>
                    <th className="pb-2 pr-2">Location</th>
                    <th className="pb-2 pr-2 min-w-[180px]">WHOIS / network</th>
                    <th className="pb-2">VPN?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500">
                        No visit rows yet. Open your short URL once (or click it from the dashboard
                        copy link); device rows appear immediately, geo/WHOIS fill within a few
                        seconds.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev, idx) => {
                      const pageNum = pag?.page ?? 1;
                      const globalIndex = (pageNum - 1) * LIMIT + idx;
                      const blurred = globalIndex > blurAfterIndex;
                      const b = (node) => (
                        <span className={blurred ? 'blur-sm select-none' : ''}>{node}</span>
                      );
                      return (
                        <tr key={ev.id}>
                          <td className="py-2 pr-2 align-top whitespace-nowrap">
                            {b(formatDt(ev.clickedAt))}
                          </td>
                          <td className="py-2 pr-2 align-top font-mono text-xs">
                            {b(trunc(ev.ip, 22))}
                          </td>
                          <td className="py-2 pr-2 align-top">{b(ev.deviceType)}</td>
                          <td className="py-2 pr-2 align-top">{b(ev.osType)}</td>
                          <td className="py-2 pr-2 align-top">{b(ev.browserName)}</td>
                          <td className="py-2 pr-2 align-top max-w-[160px] break-all text-xs text-slate-600">
                            {b(trunc(ev.userAgent, 48))}
                          </td>
                          <td className="py-2 pr-2 align-top">{b(ev.isp)}</td>
                          <td className="py-2 pr-2 align-top">{b(ev.location)}</td>
                          <td className="py-2 pr-2 align-top text-xs text-slate-600">
                            {b(trunc(ev.whoisSummary, 120))}
                          </td>
                          <td className="py-2 align-top">{b(ev.vpnLikely ? 'Likely' : '—')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {!isPro && pag && pag.total > FREE_PREVIEW_ROWS && events.length > 0 && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-center bg-gradient-to-t from-white/90 via-white/40 to-transparent pb-4 pt-24">
                  <p className="pointer-events-auto rounded-full border border-accent/30 bg-white/90 px-4 py-2 text-center text-sm font-semibold text-accent shadow-glass">
                    Upgrade to Pro to view full analytics
                  </p>
                </div>
              )}
            </div>

            {pag && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Page {pag.page} of {pag.totalPages} · {pag.total} events
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pag.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!pag.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
