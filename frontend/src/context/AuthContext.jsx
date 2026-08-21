import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setAuthToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (e) {
      // Only drop the session on real auth failures — not network/CORS blips (those
      // would wrongly clear the token while other requests still need it).
      if (e.response?.status === 401) {
        setAuthToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const upgradePlan = useCallback(
    async (tier = '1m') => {
      const { data } = await api.post('/api/billing/upgrade', { tier });
      await refreshUser();
      return data;
    },
    [refreshUser]
  );

  const isPro = Boolean(
    user &&
      (user.role === 'pro' ||
        user.role === 'paid' ||
        user.plan === 'pro' ||
        user.plan === 'paid')
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      upgradePlan,
      isPro,
      /** @deprecated use isPro */
      isPaid: isPro,
    }),
    [user, loading, login, register, logout, refreshUser, upgradePlan, isPro]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
