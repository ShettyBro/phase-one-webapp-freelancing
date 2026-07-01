import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import { RegistrationProvider } from './context/RegistrationContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { RequireAdmin } from './components/admin/RequireAdmin';
import { useScrollProgress } from './hooks/useScroll';




// Public pages
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RetrievePage = lazy(() => import('./pages/RetrievePage'));

// Admin pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations'));
const AdminResources = lazy(() => import('./pages/admin/AdminResources'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminAdmins = lazy(() => import('./pages/admin/AdminAdmins'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ── Admin (own auth provider, no public chrome) ── */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* ── Form pages — layout route gives FormHeader, no navbar/footer ── */}
          <Route element={<FormLayout />}>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/retrieve" element={<RetrievePage />} />
          </Route>

          {/* ── Homepage with full chrome ── */}
          <Route path="/*" element={<HomeLayout />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// ─── Homepage layout: Navbar + page + Footer ──────────────────────────────
const HomeLayout: React.FC = () => (
  <RegistrationProvider>
    <ScrollProgress />
    <Navbar />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Suspense>
    <Footer />
  </RegistrationProvider>
);

// ─── Form layout: slim header only, Outlet renders the child page ─────────
const FormLayout: React.FC = () => (
  <RegistrationProvider>
    <FormHeader />
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  </RegistrationProvider>
);

// ─── Admin shell ──────────────────────────────────────────────────────────
const AdminApp: React.FC = () => (
  <AdminAuthProvider>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="admins" element={<RequireAdmin superOnly><AdminAdmins /></RequireAdmin>} />
        </Route>
      </Routes>
    </Suspense>
  </AdminAuthProvider>
);

// ─── Route loading fallback ───────────────────────────────────────────────
const RouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-comun-black">
    <div className="w-6 h-6 border-2 border-comun-gold/30 border-t-comun-gold rounded-full animate-spin" />
  </div>
);

// ─── Gold scroll-progress bar (homepage only) ─────────────────────────────
const ScrollProgress: React.FC = () => {
  const progress = useScrollProgress();
  return (
    <div
      className="fixed top-0 left-0 z-[100] h-[2px] bg-gradient-to-r from-comun-gold-dark via-comun-gold to-comun-gold-light transition-all duration-75"
      style={{ width: `${progress * 100}%` }}
      aria-hidden="true"
    />
  );
};

// ─── Form page header — slim, distraction-free ───────────────────────────
const FormHeader: React.FC = () => (
  <motion.header
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8"
    style={{
      height: '60px',
      background: 'rgba(7,14,29,0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(201,168,76,0.14)',
    }}
  >
    {/* Logo → home */}
    <Link to="/" className="flex items-center gap-2.5 group" aria-label="CoMUN 2026 — Back to Home">
      <img
        src="/logo.png"
        alt="CoMUN"
        className="h-8 w-auto object-contain"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,208,0,0.3))' }}
      />
      <span className="font-sans font-bold text-sm tracking-widest text-white/90 group-hover:text-comun-gold transition-colors">
        CoMUN <span className="text-comun-gold/70">2026</span>
      </span>
    </Link>

    {/* Back to home */}
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 font-sans text-sm text-comun-muted hover:text-comun-gold transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Home
    </Link>
  </motion.header>
);
