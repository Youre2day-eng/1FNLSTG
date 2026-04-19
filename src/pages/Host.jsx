import { useState } from 'react';
import { api } from '../api/client.js';

export default function Host() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState('');

  async function login(e) {
    e.preventDefault();
    setErr('');
    api.setAdminToken(pw);
    try {
      const state = await api.getState();
      await api.saveState(state);
      setAuthed(true);
    } catch (ex) {
      api.clearAdminToken();
      setErr('Wrong password or API not ready.');
    }
  }

  if (!authed) {
    return (
      <section className="pt-32 pb-20 px-6 min-h-screen flex items-center">
        <form onSubmit={login} className="mx-auto max-w-sm w-full">
          <h1 className="font-display text-4xl text-gold mb-6">Host Login</h1>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            className="w-full p-3 bg-card2 border border-white/10 text-offwhite mb-3"
          />
          {err && <div className="text-red-400 text-xs mb-3">{err}</div>}
          <button className="w-full p-3 bg-gold text-black text-xs uppercase tracking-widest">
            Enter
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-20 px-6 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-6xl text-gold mb-8">Host Dashboard</h1>
        <p className="text-offwhite/60">Dashboard panels — port from main.js loadHF() next.</p>
      </div>
    </section>
  );
}
