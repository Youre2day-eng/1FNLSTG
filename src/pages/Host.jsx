// Host — redirects to the standalone host dashboard app
import { useEffect } from 'react';

export default function Host() {
  useEffect(() => {
    window.location.href = '/host-app.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-xs text-muted font-mono uppercase tracking-widest">Loading Host…</span>
    </div>
  );
}
