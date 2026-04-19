// Full-screen iframe wrapper for standalone tool pages.
// Lives at /tools/:slug — finds the tool from site state and renders it.

import { useParams, Navigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';

export default function ToolPage() {
  const { slug } = useParams();
  const { state, loaded } = useSite();

  if (!loaded) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <span className="text-xs text-muted font-mono uppercase tracking-widest">Loading…</span>
      </div>
    );
  }

  const tool = (state.toolPages || []).find(t => t.slug === slug);
  if (!tool) return <Navigate to="/" replace />;

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Thin back bar so users can get back to main site */}
      <div className="flex items-center gap-4 px-4 py-2 bg-black border-b border-white/5 shrink-0">
        <a
          href="/"
          className="text-xs uppercase tracking-widest text-muted hover:text-gold transition flex items-center gap-2"
        >
          ← Final Stage
        </a>
        <span className="text-white/10">|</span>
        <span className="text-xs uppercase tracking-widest text-offwhite">{tool.label}</span>
        {tool.desc && (
          <>
            <span className="text-white/10">|</span>
            <span className="text-xs text-muted">{tool.desc}</span>
          </>
        )}
      </div>
      <iframe
        src={tool.src}
        title={tool.label}
        className="flex-1 w-full border-0"
        allow="autoplay; fullscreen; clipboard-write"
      />
    </div>
  );
}
