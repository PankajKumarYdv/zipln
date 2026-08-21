import axios from 'axios';

function resolveBaseURL() {
  const env = import.meta.env.VITE_API_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (import.meta.env.DEV) return '';
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return '';
}

export const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getApiBase() {
  return resolveBaseURL();
}

/** Resolve stored avatar path to full URL */
export function resolveUploadUrl(relativePath) {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const base = getApiBase();
  if (base) return `${base}${relativePath}`;
  return relativePath;
}
