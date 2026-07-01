import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
const AdminLayout       = lazy(() => import('./components/admin/AdminLayout'));
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations'));
const AdminResources    = lazy(() => import('./pages/admin/AdminResources'));
const AdminMessages     = lazy(() => import('./pages/admin/AdminMessages'));
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLogs         = lazy(() => import('./pages/admin/AdminLogs'));
const AdminAdmins       = lazy(() => import('./pages/admin/AdminAdmins'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ── Admin section (own auth provider, no public chrome) ── */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* ── Public site ── */}
          <Route path="/*" element={<PublicApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// ─── Public site shell ─────────────────────────────────────────────────────
const PublicApp: React.FC = () => (
  <RegistrationProvider>
    <ScrollProgress />
    <Navbar />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/retrieve" element={<RetrievePage />} />
      </Routes>
    </Suspense>
    <Footer />
  </RegistrationProvider>
);

// ─── Admin shell ───────────────────────────────────────────────────────────
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

// ─── Gold Scroll Progress Bar ─────────────────────────────────────────────
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
