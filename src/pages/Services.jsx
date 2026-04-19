import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { DF } from '../data/defaults.js';

export default function Services() {
  const [d, setD] = useState(DF);
  const [activeCat, setActiveCat] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    api.getState()
      .then(state => setD({ ...DF, ...state }))
      .catch(() => {});
  }, []);

  const cats = ['All', ...d.cats];
  const svcs = activeCat === 'All' ? d.svcs : d.svcs.filter(s => s.c === activeCat);
  const visiblePaymentLinks = (d.paymentLinks || []).filter((x) => x.visible !== false && x.url);

  return (
    <section className="pt-32 pb-20 px-6 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">{d.sst}</p>
        <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none mb-10">Services</h1>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition ${
                activeCat === c
                  ? 'border-gold text-gold'
                  : 'border-white/10 text-muted hover:border-white/30 hover:text-offwhite'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {svcs.map((s, i) => {
            const isCustom = s.p.toLowerCase().includes('talk') || s.p.toLowerCase().includes('from');
            return (
              <div key={i} className="bg-card border border-white/5 p-6 flex flex-col gap-4 hover:border-white/10 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-medium text-offwhite leading-snug">{s.n}</div>
                  <div className={`text-sm font-mono whitespace-nowrap ${isCustom ? 'text-gold' : 'text-offwhite'}`}>
                    {s.p}
                  </div>
                </div>
                {s.d && <div className="text-xs text-muted">{s.d}</div>}
                <div className="flex flex-col gap-1 flex-1">
                  {(s.i || []).map((inc, j) => (
                    <div key={j} className="text-xs text-offwhite/60 flex items-center gap-2">
                      <span className="text-gold">—</span> {inc}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/booking')}
                  className="mt-auto text-xs uppercase tracking-widest text-gold hover:underline text-left"
                >
                  Book This →
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment note */}
        <div className="border-t border-white/5 pt-8 text-xs text-muted leading-relaxed">
          <strong className="text-offwhite">Payment:</strong> {d.pay}
          {visiblePaymentLinks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {visiblePaymentLinks.map((x) => (
                <a key={x.id || x.label} href={x.url} target="_blank" rel="noreferrer"
                  className="px-3 py-1 border border-white/10 hover:border-gold hover:text-gold transition">
                  {x.label}
                </a>
              ))}
            </div>
          )}
          <br />
          {d.pyn}
        </div>
      </div>
    </section>
  );
}
