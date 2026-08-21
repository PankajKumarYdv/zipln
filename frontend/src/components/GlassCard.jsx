export function GlassCard({ children, className = '', strong = false }) {
  const base = strong ? 'glass-panel-strong' : 'glass-panel';
  return <div className={`${base} p-6 ${className}`}>{children}</div>;
}
