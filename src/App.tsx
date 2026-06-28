import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <Router>
      {/* Global scroll progress bar */}
      <ScrollProgress />

      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Future routes: /about, /committees, /register, /admin */}
      </Routes>

      <Footer />
    </Router>
  );
}

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
