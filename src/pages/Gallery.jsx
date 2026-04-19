import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { DF } from '../data/defaults.js';

export default function Gallery() {
  const [d, setD] = useState(DF);
  const [activeCat, setActiveCat] = useState('All');

  useEffect(() => {
    api.getState()
      .then(state => setD({ ...DF, ...state }))
      .catch(() => {});
  }, []);

  const cats = ['All', ...d.cats];
  const imgs = activeCat === 'All' ? d.imgs : d.imgs.filter(x => x.c === activeCat);

  return (
    <section className="pt-32 pb-20 px-6 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none mb-10">Gallery</h1>

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

        {/* Grid */}
        {imgs.length === 0 ? (
          <div className="text-center py-16 font-mono text-xs uppercase text-muted">
            No images yet. Add in Host Dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {imgs.map((img, i) => (
              <div key={i} className="relative group overflow-hidden aspect-square bg-card">
                <img
                  src={img.url}
                  alt={img.lbl}
                  loading="lazy"
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition" />
                {img.lbl && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-xs font-mono uppercase tracking-wider text-offwhite opacity-0 group-hover:opacity-100 transition">
                    {img.lbl}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
