import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderOpen, Mail, Settings as SettingsIcon,
  ScrollText, ShieldCheck, LogOut, Clock, Menu, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: Users },
  { to: '/admin/resources', label: 'Resources', icon: FolderOpen },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/admin/logs', label: 'Activity Logs', icon: ScrollText },
];

function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ── Shared sidebar nav list ────────────────────────────────────────────────
const SidebarNav: React.FC<{ isSuperAdmin: boolean; onNav?: () => void }> = ({ isSuperAdmin, onNav }) => (
  <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
    {NAV.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onNav}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-sm font-sans text-sm transition-colors ${
            isActive
              ? 'bg-comun-gold/15 text-comun-gold'
              : 'text-comun-muted hover:text-comun-white hover:bg-white/5'
          }`
        }
      >
        <Icon className="w-4 h-4" /> {label}
      </NavLink>
    ))}
    {isSuperAdmin && (
      <NavLink
        to="/admin/admins"
        onClick={onNav}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-sm font-sans text-sm transition-colors ${
            isActive ? 'bg-comun-gold/15 text-comun-gold' : 'text-comun-muted hover:text-comun-white hover:bg-white/5'
          }`
        }
      >
        <ShieldCheck className="w-4 h-4" /> Admins
      </NavLink>
    )}
  </nav>
);

const AdminLayout: React.FC = () => {
  const { admin, isSuperAdmin, msUntilExpiry, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-comun-black flex">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 border-r border-comun-maroon/30 bg-comun-charcoal/60 hidden md:flex flex-col">
        <div className="px-5 py-5 border-b border-comun-gold/10 flex items-center gap-3">
          <img src="/logo.png" alt="CoMUN" className="h-9 w-auto" />
          <div>
            <p className="font-serif-display text-comun-gold text-lg leading-none">CoMUN</p>
            <p className="font-sans text-[10px] text-comun-muted tracking-widest uppercase">Admin</p>
          </div>
        </div>
        <SidebarNav isSuperAdmin={isSuperAdmin} />
        <div className="px-5 py-4 border-t border-comun-gold/10">
          <p className="font-sans text-xs text-comun-muted truncate">{admin?.name}</p>
          <p className="font-sans text-[10px] text-comun-gold/60 uppercase tracking-widest">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
        </div>
      </aside>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/70 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-[81] w-64 bg-comun-charcoal border-r border-comun-maroon/30 flex flex-col md:hidden"
            >
              <div className="px-5 py-5 border-b border-comun-gold/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="CoMUN" className="h-8 w-auto" />
                  <span className="font-serif-display text-comun-gold text-base">Admin</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-comun-muted hover:text-comun-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarNav isSuperAdmin={isSuperAdmin} onNav={() => setMobileOpen(false)} />
              <div className="px-5 py-4 border-t border-comun-gold/10">
                <p className="font-sans text-xs text-comun-muted truncate">{admin?.name}</p>
                <p className="font-sans text-[10px] text-comun-gold/60 uppercase tracking-widest">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-comun-maroon/30 bg-comun-charcoal/40 flex items-center justify-between px-5 gap-4 sticky top-0 z-50">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-comun-muted hover:text-comun-gold transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <img src="/logo.png" alt="CoMUN" className="h-7 w-auto" />
              <span className="font-serif-display text-comun-gold text-base">Admin</span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Session timer */}
          {msUntilExpiry !== null && (
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${msUntilExpiry < 5 * 60 * 1000 ? 'border-comun-maroon/50 bg-comun-maroon/10' : 'border-comun-gold/20'}`}>
              <Clock className={`w-3.5 h-3.5 ${msUntilExpiry < 5 * 60 * 1000 ? 'text-comun-maroon-light' : 'text-comun-gold'}`} />
              <span className={`font-sans text-xs tabular-nums ${msUntilExpiry < 5 * 60 * 1000 ? 'text-comun-maroon-light' : 'text-comun-white/80'}`}>
                {formatTimer(msUntilExpiry)}
              </span>
            </div>
          )}

          {/* User info */}
          <div className="text-right hidden sm:block">
            <p className="font-sans text-sm text-comun-white/90 leading-none">{admin?.name}</p>
            <p className="font-sans text-[10px] text-comun-gold/70 tracking-wider uppercase">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="p-2 text-comun-muted hover:text-comun-maroon-light transition-colors" aria-label="Logout" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
