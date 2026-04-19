import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { DF } from '../data/defaults.js';
import { useSite } from '../context/SiteContext.jsx';

const CORE_LINKS = [
  { to: '/',         label: 'Home' },
  { to: '/gallery',  label: 'Gallery' },
  { to: '/services', label: 'Services' },
  { to: '/booking',  label: 'Book' },
  { to: '/host',     label: 'Host' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { state } = useSite();

  // Always use DF.toolPages as base — KV state may not have toolPages yet
  const tools = (state.toolPages && state.toolPages.length ? state.toolPages : DF.toolPages).filter(t => t.inNav);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">

        <Link to="/" className="flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="italic text-sm tracking-wider">FINAL STAGE</span>
          <span className="italic text-xs text-muted">Productions</span>
        </Link>

        <nav className="hidden md:flex gap-8 text-xs uppercase tracking-widest">
          {CORE_LINKS.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => isActive ? 'text-gold' : 'text-offwhite hover:text-gold transition'}>
              {l.label}
            </NavLink>
          ))}
          {tools.map(t => (
            <NavLink key={t.slug} to={`/tools/${t.slug}`}
              className={({ isActive }) => isActive ? 'text-gold' : 'text-muted hover:text-gold transition'}>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/booking" className="hidden md:block text-xs uppercase tracking-widest text-gold hover:underline">
            Book a Session
          </Link>
          <button onClick={() => setOpen(o => !o)} aria-label="Menu" className="flex flex-col gap-1.5 p-2">
            <span className={`h-0.5 w-6 bg-gold transition duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`h-0.5 w-6 bg-gold transition duration-300 ${open ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-6 bg-gold transition duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/5 bg-black/95 max-h-[80vh] overflow-y-auto">

          {/* Core links */}
          {CORE_LINKS.map(l => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-6 py-4 text-sm uppercase tracking-widest border-b border-white/5 transition ${
                  isActive ? 'text-gold' : 'text-offwhite hover:text-gold'}`}>
              {l.label}
            </NavLink>
          ))}

          {/* Free Tools — always visible, from defaults if KV not loaded yet */}
          <div className="px-6 pt-5 pb-2 text-xs uppercase tracking-widest text-muted font-mono">
            Free Tools
          </div>
          {tools.map(t => (
            <NavLink key={t.slug} to={`/tools/${t.slug}`} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-6 py-4 border-b border-white/5 transition ${
                  isActive ? 'text-gold' : 'text-offwhite hover:text-gold'}`}>
              <span className="text-sm uppercase tracking-widest">{t.label}</span>
              {t.desc && <span className="text-xs text-muted ml-4">{t.desc}</span>}
            </NavLink>
          ))}

          {/* Host */}
          <NavLink to="/host" onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-6 py-4 text-sm uppercase tracking-widest border-t border-white/10 mt-2 transition ${
                isActive ? 'text-gold' : 'text-muted hover:text-offwhite'}`}>
            Host ⬡
          </NavLink>
        </nav>
      )}
    </header>
  );
}
