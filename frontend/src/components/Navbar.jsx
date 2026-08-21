import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-white/60 text-accent shadow-sm'
      : 'text-slate-600 hover:bg-white/40'
  }`;

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-white/40 bg-white/30 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-slate-900"
        >
          Short<span className="text-accent">Link</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <a href="/#pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white/40">
            Pricing
          </a>
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/settings" className={linkClass}>
                Settings
              </NavLink>
              <button type="button" onClick={logout} className="btn-ghost text-sm">
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/auth" className={linkClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
