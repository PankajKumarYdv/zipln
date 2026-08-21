import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, resolveUploadUrl } from '../services/api.js';
import { COUNTRIES } from '../data/countries.js';

export function Settings() {
  const { user, refreshUser, isPro, upgradePlan } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [upgradeBusy, setUpgradeBusy] = useState(false);

  const [delPw, setDelPw] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCountry(user.country || '');
    }
  }, [user]);

  const loadKeys = useCallback(async () => {
    if (!isPro) {
      setKeys([]);
      return;
    }
    try {
      const { data } = await api.get('/api/keys');
      setKeys(data.keys);
    } catch {
      setKeys([]);
    }
  }, [isPro]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await api.patch('/api/settings/profile', {
        name,
        phone,
        country,
      });
      setMsg({ type: 'ok', text: 'Profile saved.' });
      await refreshUser();
      if (data.user) {
        setName(data.user.name);
        setPhone(data.user.phone || '');
        setCountry(data.user.country || '');
      }
    } catch (err) {
      setMsg({
        type: 'err',
        text: err.response?.data?.message || 'Could not save profile',
      });
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await api.patch('/api/settings/password', {
        currentPassword: curPw,
        newPassword: newPw,
      });
      setCurPw('');
      setNewPw('');
      setMsg({ type: 'ok', text: 'Password updated.' });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err.response?.data?.message || 'Could not update password',
      });
    }
  }

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.post('/api/settings/avatar', fd);
      await refreshUser();
      setMsg({ type: 'ok', text: 'Profile photo updated.' });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err.response?.data?.message || 'Upload failed',
      });
    } finally {
      setAvatarBusy(false);
      e.target.value = '';
    }
  }

  async function createKey() {
    setNewKey(null);
    try {
      const { data } = await api.post('/api/keys', { name: 'Settings' });
      setNewKey(data.key);
      await loadKeys();
    } catch (err) {
      setMsg({
        type: 'err',
        text: err.response?.data?.message || 'Could not create key',
      });
    }
  }

  async function revokeKey(id) {
    if (!window.confirm('Revoke this API key?')) return;
    await api.delete(`/api/keys/${id}`);
    await loadKeys();
  }

  async function deleteAccount(e) {
    e.preventDefault();
    if (!window.confirm('Permanently delete your account and all links?')) return;
    try {
      await api.delete('/api/settings/account', { data: { password: delPw } });
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      setMsg({
        type: 'err',
        text: err.response?.data?.message || 'Could not delete account',
      });
    }
  }

  async function quickUpgrade() {
    setUpgradeBusy(true);
    try {
      await upgradePlan('1m');
      setMsg({ type: 'ok', text: 'Welcome to Pro (simulated).' });
      await loadKeys();
    } catch (err) {
      setMsg({
        type: 'err',
        text: err.response?.data?.message || 'Upgrade failed',
      });
    } finally {
      setUpgradeBusy(false);
    }
  }

  const avatarSrc = resolveUploadUrl(user?.avatarUrl);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link to="/dashboard" className="text-sm font-medium text-accent hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-6 font-display text-3xl font-bold text-slate-900">Settings</h1>

      {msg.text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 rounded-xl px-4 py-2 text-sm ${
            msg.type === 'ok'
              ? 'bg-emerald-500/15 text-emerald-800'
              : 'bg-rose-500/15 text-rose-800'
          }`}
        >
          {msg.text}
        </motion.p>
      )}

      <GlassCard className="mt-8" strong>
        <h2 className="font-display text-lg font-semibold">Profile photo</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-inner">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                {(user?.name || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <label className="btn-primary cursor-pointer">
            {avatarBusy ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onAvatar}
              disabled={avatarBusy}
            />
          </label>
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Name
            </label>
            <input
              className="input-glass"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Mobile number
            </label>
            <input
              className="input-glass"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 …"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Country
            </label>
            <select
              className="input-glass"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="mt-6">
        <h2 className="font-display text-lg font-semibold">Password</h2>
        <form onSubmit={savePassword} className="mt-4 space-y-4">
          <input
            type="password"
            className="input-glass"
            placeholder="Current password"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-glass"
            placeholder="New password (min 8)"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={8}
          />
          <button type="submit" className="btn-primary">
            Update password
          </button>
        </form>
      </GlassCard>

      <GlassCard className="relative mt-6 overflow-hidden">
        <h2 className="font-display text-lg font-semibold">API access</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use header <code className="rounded bg-white/50 px-1">X-API-Key</code> with{' '}
          <code className="rounded bg-white/50 px-1">POST /api/shorten</code>.
        </p>

        {!isPro && (
          <div className="relative mt-6 rounded-2xl border border-dashed border-accent/30 bg-white/30 p-8 text-center">
            <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" />
            <p className="relative text-sm font-semibold text-slate-800">
              API keys are available on Pro
            </p>
            <button
              type="button"
              disabled={upgradeBusy}
              onClick={quickUpgrade}
              className="relative mt-4 btn-primary"
            >
              {upgradeBusy ? 'Please wait…' : 'Upgrade to Pro'}
            </button>
            <Link
              to="/#pricing"
              className="relative mt-3 block text-sm text-accent hover:underline"
            >
              View pricing
            </Link>
          </div>
        )}

        {isPro && (
          <div className="mt-6">
            <button type="button" className="btn-primary text-sm" onClick={createKey}>
              Generate API key
            </button>
            <ul className="mt-4 divide-y divide-slate-200/60 text-sm">
              {keys.length === 0 && (
                <li className="py-2 text-slate-500">No keys yet.</li>
              )}
              {keys.map((k) => (
                <li
                  key={k._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium">{k.name}</p>
                    <p className="font-mono text-xs text-slate-500">{k.keyPrefix}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-rose-600 hover:underline"
                    onClick={() => revokeKey(k._id)}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {newKey && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-strong fixed inset-x-4 bottom-8 z-50 mx-auto max-w-lg rounded-2xl p-6 shadow-glass-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        >
          <h3 className="font-display font-semibold text-slate-900">New API key</h3>
          <p className="mt-1 text-sm text-slate-600">Copy now — it won&apos;t be shown again.</p>
          <pre className="mt-3 max-h-24 overflow-auto rounded-xl bg-slate-900/90 p-3 text-xs text-emerald-300">
            {newKey}
          </pre>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={() => {
              navigator.clipboard.writeText(newKey);
            }}
          >
            Copy
          </button>
          <button
            type="button"
            className="btn-ghost mt-2 w-full"
            onClick={() => setNewKey(null)}
          >
            Done
          </button>
        </motion.div>
      )}

      <GlassCard className="mt-6 border-rose-200/60">
        <h2 className="font-display text-lg font-semibold text-rose-800">Delete account</h2>
        <p className="mt-1 text-sm text-slate-600">
          Removes your profile, API keys, and all shortened links you created.
        </p>
        <form onSubmit={deleteAccount} className="mt-4 space-y-3">
          <input
            type="password"
            className="input-glass border-rose-200/50"
            placeholder="Confirm password"
            value={delPw}
            onChange={(e) => setDelPw(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700"
          >
            Delete my account
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
