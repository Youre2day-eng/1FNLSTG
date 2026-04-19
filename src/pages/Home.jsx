import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const DEFAULTS = {
  b1: 'FINAL STAGE',
  b2: 'Productions',
  tag: 'Where vision becomes unforgettable',
  loc: 'Seattle · Tacoma · Pacific Northwest',
  creds: [
    { icon: '📸', t: 'Photography', d: 'Studio · Events · Sports · Real Estate' },
    { icon: '🎬', t: 'Film & Video', d: 'Music Videos · Podcast · YouTube' },
    { icon: '🎤', t: 'Artist Work', d: 'Press · EPK · Full Campaign' },
    { icon: '🏆', t: 'Sports & NIL', d: 'Athletes · Teams · Combat' },
    { icon: '🎓', t: 'Coaching', d: '1-on-1 · On-Set · Online' },
    { icon: '✈️', t: 'FAA Certified', d: 'Drone · Aerial · Real Estate' },
  ],
};

export default function Home() {
  const [d, setD] = useState(DEFAULTS);

  useEffect(() => {
    api.getState()
      .then(state => setD({ ...DEFAULTS, ...state }))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center">
        <div className="mx-auto max-w-6xl w-full">
          <div className="flex items-center gap-4 mb-6 text-xs uppercase tracking-widest text-gold">
            <div className="h-px w-12 bg-gold" />
            {d.loc}
          </div>
          <h1 className="font-display text-[clamp(3rem,12vw,12rem)] leading-none tracking-tight">
            {d.b1}
            <br />
            <span className="text-gold/40 [-webkit-text-stroke:1px_theme(colors.gold)] text-transparent">
              {d.b2}
            </span>
          </h1>
          <p className="mt-8 text-xl italic text-offwhite/80 max-w-2xl">{d.tag}</p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/booking"
              className="px-8 py-4 bg-gold text-black text-xs uppercase tracking-widest font-medium hover:bg-gold/90 transition"
            >
              Book a Session
            </Link>
            <Link
              to="/services"
              className="px-8 py-4 border border-offwhite/20 text-xs uppercase tracking-widest hover:border-gold hover:text-gold transition"
            >
              See All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Credentials strip */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {(d.creds || []).map((c, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-xs uppercase tracking-widest text-gold mb-1">{c.t}</div>
              <div className="text-xs text-muted">{c.d}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
