import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { GlassCard } from '../components/GlassCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function downloadSvg(svgEl, filename) {
  if (!svgEl) return;
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgEl);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const { user, isPro, refreshUser } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    url: '',
    customAlias: '',
    expiresAt: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [qrFor, setQrFor] = useState(null);
  const qrSvgRef = useRef(null);

  const loadUrls = useCallback(async () => {
    const { data } = await api.get('/api/urls');
    setUrls(data.urls);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadUrls();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUrls]);

  const totalClicks = urls.reduce((s, u) => s + (u.clickCount || 0), 0);

  async function handleCreate(e) {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    const body = {
      url: form.url.trim(),
      customAlias: form.customAlias.trim() || undefined,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : undefined,
    };
    try {
      const { data } = await api.post('/api/urls', body);
      setUrls((prev) => [data.url, ...prev]);
      setForm({ url: '', customAlias: '', expiresAt: '' });
      setMessage({ type: 'ok', text: 'Link created.' });
    } catch (err) {
      setMessage({
        type: 'err',
        text:
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Could not create link',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this short link?')) return;
    await api.delete(`/api/urls/${id}`);
    setUrls((prev) => prev.filter((u) => u.id !== id));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'ok', text: 'Copied.' });
    } catch {
      setMessage({ type: 'err', text: 'Clipboard unavailable.' });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            {user?.email} ·{' '}
            <span className="font-semibold uppercase tracking-wide text-accent">
              {isPro ? 'pro' : user?.role || 'free'}
            </span>
          </p>
        </div>
        <Link to="/#pricing" className="btn-ghost text-sm">
          View Pro pricing
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Short links', value: urls.length },
          { label: 'Total clicks', value: totalClicks },
          { label: 'Plan', value: isPro ? 'Pro' : 'Free' },
        ].map((s) => (
          <GlassCard key={s.label} className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {message.text && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 rounded-xl px-4 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-emerald-500/15 text-emerald-800'
              : 'bg-rose-500/15 text-rose-800'
          }`}
        >
          {message.text}
        </motion.p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <GlassCard className="lg:col-span-2" strong>
          <h2 className="font-display text-lg font-semibold text-slate-900">New link</h2>
          <p className="mt-1 text-sm text-slate-600">
            Authenticated links appear here. Free plan has a daily create limit.
          </p>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                URL
              </label>
              <input
                className="input-glass"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Expires (optional)
              </label>
              <input
                type="datetime-local"
                className="input-glass"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                Custom alias
                {!isPro && (
                  <span className="normal-case font-normal text-rose-600">(Pro)</span>
                )}
              </label>
              <input
                className="input-glass disabled:opacity-50"
                placeholder="my-brand"
                disabled={!isPro}
                value={form.customAlias}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customAlias: e.target.value }))
                }
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Creating…' : 'Shorten'}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-slate-900">Your links</h2>
            <button type="button" className="btn-ghost text-xs" onClick={() => loadUrls()}>
              Refresh
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : urls.length === 0 ? (
              <p className="text-sm text-slate-500">No links yet.</p>
            ) : (
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase text-slate-500">
                    <th className="pb-2 pr-2">Original</th>
                    <th className="pb-2 pr-2">Short</th>
                    <th className="pb-2 pr-2">Clicks</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {urls.map((u) => (
                    <tr key={u.id}>
                      <td className="max-w-[180px] py-3 pr-2">
                        <span className="line-clamp-2 break-all text-slate-700">
                          {u.originalUrl}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <button
                          type="button"
                          onClick={() => copyText(u.shortUrl)}
                          className="break-all text-left font-medium text-accent hover:underline"
                        >
                          {u.shortUrl}
                        </button>
                      </td>
                      <td className="py-3 pr-2 font-mono">{u.clickCount}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Link
                            to={`/dashboard/stats/${u.id}`}
                            className="btn-ghost px-2 py-1 text-xs"
                          >
                            Analytics
                          </Link>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1 text-xs"
                            onClick={() => setQrFor(u)}
                          >
                            QR
                          </button>
                          <button
                            type="button"
                            className="rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/10"
                            onClick={() => handleDelete(u.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {qrFor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrFor(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel-strong max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-semibold">QR</h3>
              <p className="mt-1 break-all text-sm text-slate-600">{qrFor.shortUrl}</p>
              <div ref={qrSvgRef} className="mt-4 flex justify-center rounded-xl bg-white p-4">
                <QRCode value={qrFor.shortUrl} size={180} />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() =>
                    downloadSvg(
                      qrSvgRef.current?.querySelector('svg'),
                      `qr-${qrFor.shortCode}.svg`
                    )
                  }
                >
                  Download SVG
                </button>
                <button type="button" className="btn-primary flex-1" onClick={() => setQrFor(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
