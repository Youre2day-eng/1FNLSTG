import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/services', label: 'Services' },
  { to: '/booking', label: 'Book' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex flex-col leading-none">
          <span className="italic text-sm tracking-wider">FINAL STAGE</span>
          <span className="italic text-xs text-muted">Productions</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 text-xs uppercase tracking-widest">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive ? 'text-gold' : 'text-offwhite hover:text-gold transition'
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/booking"
            className="hidden md:block text-xs uppercase tracking-widest text-gold hover:underline"
          >
            Book a Session
          </Link>

          {/* Subtle host lock — desktop only */}
          <NavLink
            to="/host"
            className={({ isActive }) =>
              `hidden md:block text-base leading-none transition ${isActive ? 'text-gold' : 'text-white/20 hover:text-white/60'}`
            }
            title="Host"
          >
            ⬡
          </NavLink>

          {/* Hamburger — all screen sizes */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
            className="flex flex-col gap-1.5 p-2"
          >
            <span className={`h-0.5 w-6 bg-gold transition duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`h-0.5 w-6 bg-gold transition duration-300 ${open ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-6 bg-gold transition duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Drawer — all screen sizes */}
      {open && (
        <nav className="border-t border-white/5 bg-black/95">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-6 py-4 text-sm uppercase tracking-widest border-b border-white/5 ${
                  isActive ? 'text-gold' : 'text-offwhite hover:text-gold transition'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/host"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-6 py-4 text-sm uppercase tracking-widest border-b border-white/5 ${
                isActive ? 'text-gold' : 'text-muted hover:text-offwhite transition'
              }`
            }
          >
            Host ⬡
          </NavLink>
        </nav>
      )}
    </header>
  );
}
