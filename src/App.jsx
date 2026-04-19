import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext.jsx';
import { useSite } from './context/SiteContext.jsx';
import { DF } from './data/defaults.js';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Gallery from './pages/Gallery.jsx';
import Services from './pages/Services.jsx';
import Booking from './pages/Booking.jsx';
import Host from './pages/Host.jsx';
import ToolPage from './pages/ToolPage.jsx';
import Admin from './pages/Admin.jsx';

function AppShell() {
  const { state } = useSite();
  const location = useLocation();
  const theme = { ...DF.theme, ...(state.theme || {}) };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--fsp-bg', theme.bg);
    root.style.setProperty('--fsp-text', theme.text);
    root.style.setProperty('--fsp-muted', theme.muted);
    root.style.setProperty('--fsp-gold', theme.gold);
    root.style.setProperty('--fsp-card', theme.card);
    root.style.setProperty('--fsp-body-font', theme.bodyFont);
    root.style.setProperty('--fsp-display-font', theme.displayFont);
    root.style.setProperty('--fsp-body-size', `${theme.bodySize}px`);
    root.style.setProperty('--fsp-heading-scale', String(theme.headingScale));
  }, [theme]);

  useEffect(() => {
    const key = 'fsp_traffic';
    const traffic = JSON.parse(localStorage.getItem(key) || '{"total":0,"paths":{}}');
    traffic.total += 1;
    traffic.paths[location.pathname] = (traffic.paths[location.pathname] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(traffic));
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/gallery"      element={<Gallery />} />
          <Route path="/services"     element={<Services />} />
          <Route path="/booking"      element={<Booking />} />
          <Route path="/host"         element={<Host />} />
          <Route path="/admin"        element={<Admin />} />
          {/* All tool pages — slug resolved from KV state */}
          <Route path="/tools/:slug"  element={<ToolPage />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <div style={{ fontFamily: 'var(--fsp-body-font)' }}>
        <AppShell />
      </div>
   </SiteProvider>
  );
}
