import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import { RegistrationProvider } from './context/RegistrationContext';

const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RetrievePage = lazy(() => import('./pages/RetrievePage'));

export default function App() {
  return (
    <Router>
      <RegistrationProvider>
        {/* Global scroll progress bar */}
        <ScrollProgress />

        <Navbar />

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/retrieve" element={<RetrievePage />} />
            {/* Future routes: /admin */}
          </Routes>
        </Suspense>

        <Footer />
      </RegistrationProvider>
    </Router>
  );
}

// ─── Route loading fallback ───────────────────────────────────────────────
const RouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-comun-gold/30 border-t-comun-gold rounded-full animate-spin" />
  </div>
);

// ─── Gold Scroll Progress Bar ─────────────────────────────────────────────
import { useScrollProgress } from './hooks/useScroll';

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
