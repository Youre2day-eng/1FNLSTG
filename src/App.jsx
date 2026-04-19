import { Routes, Route, Navigate } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext.jsx';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Gallery from './pages/Gallery.jsx';
import Services from './pages/Services.jsx';
import Booking from './pages/Booking.jsx';
import Host from './pages/Host.jsx';
import ToolPage from './pages/ToolPage.jsx';

export default function App() {
  return (
    <SiteProvider>
      <div className="min-h-screen">
        <Header />
        <main>
          <Routes>
            <Route path="/"             element={<Home />} />
            <Route path="/gallery"      element={<Gallery />} />
            <Route path="/services"     element={<Services />} />
            <Route path="/booking"      element={<Booking />} />
            <Route path="/host"         element={<Host />} />
            {/* All tool pages — slug resolved from KV state */}
            <Route path="/tools/:slug"  element={<ToolPage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </SiteProvider>
  );
}
