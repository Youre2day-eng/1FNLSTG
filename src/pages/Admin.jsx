import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useSite } from '../context/SiteContext.jsx';
import { DF } from '../data/defaults.js';

const TABS = [
  ['content', 'Content'],
  ['navigation', 'Navigation'],
  ['payments', 'Pricing & Payments'],
  ['bookings', 'Bookings'],
  ['analytics', 'Analytics'],
  ['config', 'Configuration'],
];

const TEXT_FIELDS = [
  ['b1', 'Hero Line 1'], ['b2', 'Hero Line 2'], ['tag', 'Hero Tagline'],
  ['loc', 'Location'], ['copy', 'Footer Copy'], ['phone', 'Phone'], ['email', 'Email'],
  ['ig', 'Instagram'], ['pt', 'Portfolio URL'], ['dep', 'Deposit Policy'], ['pay', 'Payment Summary'],
  ['pyn', 'Payment Notes'], ['sst', 'Services Intro'], ['bsb', 'Booking Intro'],
  ['ah', 'About Headline'], ['ap1', 'About Paragraph 1'], ['ap2', 'About Paragraph 2'], ['aq', 'Quote'],
];

const FONT_OPTIONS = ['Space Grotesk', 'Inter', 'Poppins', 'Bebas Neue', 'DM Sans', 'Montserrat'];

function uid(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest text-gold">{title}</h3>
          <button onClick={onClose} className="text-xs text-muted hover:text-offwhite">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

function downloadFile(name, content, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function parsePrice(value) {
  const matched = String(value || '').match(/\d+(?:\.\d+)?/);
  const num = matched ? parseFloat(matched[0]) : 0;
  return Number.isFinite(num) ? num : 0;
}

export default function Admin() {
  const { state, setState, loaded } = useSite();
  const [tab, setTab] = useState('content');
  const [auth, setAuth] = useState(api.isLoggedIn());
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [working, setWorking] = useState({ ...DF });
  const [bookings, setBookings] = useState([]);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!loaded) return;
    setWorking({ ...DF, ...state, theme: { ...DF.theme, ...(state.theme || {}) }, config: { ...DF.config, ...(state.config || {}) } });
  }, [loaded, state]);

  useEffect(() => {
    if (!auth) return;
    api.getBookings().then(setBookings).catch(() => {
      setBookings([]);
      setError('Could not load bookings. Check admin auth or network status.');
    });
  }, [auth]);

  const metrics = useMemo(() => {
    const approved = bookings.filter((b) => b.status === 'approved');
    const denied = bookings.filter((b) => b.status === 'denied');
    const pending = bookings.filter((b) => b.status === 'pending');
    const revenue = approved.reduce((sum, b) => sum + parsePrice(b.price), 0);
    const traffic = JSON.parse(localStorage.getItem('fsp_traffic') || '{"total":0,"paths":{}}');
    return { approved: approved.length, denied: denied.length, pending: pending.length, revenue, traffic };
  }, [bookings]);

  function updateField(key, value) {
    setWorking((w) => ({ ...w, [key]: value }));
  }

  function updateTheme(key, value) {
    setWorking((w) => ({ ...w, theme: { ...(w.theme || DF.theme), [key]: value } }));
  }

  function updateConfig(key, value) {
    setWorking((w) => ({ ...w, config: { ...(w.config || DF.config), [key]: value } }));
  }

  async function doLogin(e) {
    e.preventDefault();
    setError('');
    try {
      await api.login(creds.username.trim(), creds.password);
      setAuth(true);
      setMessage('Signed in.');
    } catch {
      setError('Invalid admin credentials.');
    } finally {
      setCreds((c) => ({ ...c, password: '' }));
    }
  }

  function doLogout() {
    api.logout();
    setAuth(false);
    setMessage('Signed out.');
  }

  async function saveAll() {
    setError('');
    setMessage('');
    if (!working.adminUser?.trim() || !working.pw?.trim()) {
      setError('Admin username and password are required.');
      return;
    }
    setSaving(true);
    try {
      await api.saveState(working);
      setState(working);
      setMessage('Settings saved.');
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function updateBooking(id, status) {
    const note = noteDrafts[id] || '';
    try {
      const res = await api.updateBooking(id, status, note);
      setBookings((prev) => prev.map((b) => (b.id === id ? (res.booking || b) : b)));
      setMessage(`Booking ${status}.`);
    } catch {
      setError('Could not update booking status.');
    }
  }

  function exportBookings() {
    const rows = [
      ['ID', 'Service', 'Price', 'Date', 'Time', 'Status', 'Note', 'Created At'],
      ...bookings.map((b) => [b.id, b.service, b.price, b.date, b.time, b.status, b.note || '', b.timestamp]),
    ];
    downloadFile('bookings-report.csv', toCsv(rows));
  }

  function exportSummary() {
    const rows = [
      ['Metric', 'Value'],
      ['Pending Bookings', metrics.pending],
      ['Approved Bookings', metrics.approved],
      ['Denied Bookings', metrics.denied],
      ['Revenue (approved)', metrics.revenue.toFixed(2)],
      ['Traffic Views', metrics.traffic.total || 0],
    ];
    downloadFile('dashboard-summary.csv', toCsv(rows));
  }

  function onImageFile(file, category, label) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = { id: uid('img'), url: String(reader.result), c: category || 'Photography', lbl: label || file.name };
      setWorking((w) => ({ ...w, imgs: [...(w.imgs || []), image] }));
    };
    reader.readAsDataURL(file);
  }

  if (!auth) {
    return (
      <section className="pt-32 pb-20 px-6 min-h-screen">
        <div className="mx-auto max-w-md border border-gold/20 bg-gold/5 p-6">
          <p className="text-xs uppercase tracking-widest text-gold mb-2">Admin Login</p>
          <h1 className="font-display text-5xl leading-none mb-6">/admin</h1>
          <form onSubmit={doLogin} className="space-y-4">
            <input required value={creds.username} onChange={(e) => setCreds((c) => ({ ...c, username: e.target.value }))} placeholder="Username" className="w-full bg-black border border-white/10 px-3 py-2 text-sm" />
            <input required type="password" value={creds.password} onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))} placeholder="Password" className="w-full bg-black border border-white/10 px-3 py-2 text-sm" />
            <p className="text-[11px] text-yellow-300 uppercase tracking-wide">Warning: local fallback auth is development-only. Use backend auth in production.</p>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button className="w-full py-3 bg-gold text-black text-xs uppercase tracking-widest font-medium">Sign In</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Final Stage Productions</p>
            <h1 className="font-display text-[clamp(2rem,6vw,4rem)] leading-none">Admin Panel</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={saveAll} disabled={saving} className="px-4 py-2 bg-gold text-black text-xs uppercase tracking-widest font-medium disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={doLogout} className="px-4 py-2 border border-white/20 text-xs uppercase tracking-widest hover:border-gold">Logout</button>
          </div>
        </div>

        {message && <p className="mb-3 text-xs text-green-300">{message}</p>}
        {error && <p className="mb-3 text-xs text-red-300">{error}</p>}

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 text-xs uppercase tracking-widest border ${tab === id ? 'border-gold text-gold' : 'border-white/10 text-muted hover:text-offwhite'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-white/10 bg-card p-4">
              <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Text Fields Editor</h2>
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {TEXT_FIELDS.map(([key, label]) => (
                  <button key={key} onClick={() => setModal({ type: 'text', key, label, value: String(working[key] || '') })} className="w-full text-left border border-white/10 p-3 hover:border-gold/50">
                    <div className="text-xs uppercase tracking-widest text-muted">{label}</div>
                    <div className="text-sm text-offwhite/80 truncate">{String(working[key] || '') || '—'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-white/10 bg-card p-4">
                <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Image Manager</h2>
                <button onClick={() => setModal({ type: 'image-add', c: working.cats?.[0] || 'Photography', lbl: '' })} className="mb-4 px-3 py-2 text-xs uppercase tracking-widest border border-white/20 hover:border-gold">Add Image</button>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(working.imgs || []).slice(0, 12).map((img) => (
                    <div key={img.id || img.url} className="border border-white/10 p-2">
                      <img src={img.url} alt={img.lbl || 'Gallery image'} className="aspect-square object-cover w-full mb-2" />
                      <p className="text-[10px] text-muted truncate">{img.lbl || 'Untitled'}</p>
                      <button onClick={() => setWorking((w) => ({ ...w, imgs: (w.imgs || []).filter((x) => x !== img) }))} className="text-[10px] text-red-300 mt-1">Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-card p-4">
                <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Typography & Colors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <label className="flex flex-col gap-1">Body Font
                    <select value={working.theme?.bodyFont || DF.theme.bodyFont} onChange={(e) => updateTheme('bodyFont', e.target.value)} className="bg-black border border-white/10 p-2">
                      {FONT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">Display Font
                    <select value={working.theme?.displayFont || DF.theme.displayFont} onChange={(e) => updateTheme('displayFont', e.target.value)} className="bg-black border border-white/10 p-2">
                      {FONT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">Body Size
                    <input type="number" min="12" max="20" value={working.theme?.bodySize || 16} onChange={(e) => updateTheme('bodySize', Number(e.target.value || 16))} className="bg-black border border-white/10 p-2" />
                  </label>
                  <label className="flex flex-col gap-1">Heading Scale
                    <input type="number" step="0.05" min="0.8" max="1.4" value={working.theme?.headingScale || 1} onChange={(e) => updateTheme('headingScale', Number(e.target.value || 1))} className="bg-black border border-white/10 p-2" />
                  </label>
                  {['bg', 'text', 'muted', 'gold', 'card'].map((c) => (
                    <label key={c} className="flex items-center justify-between gap-3 border border-white/10 p-2">{c}
                      <input type="color" value={working.theme?.[c] || DF.theme[c]} onChange={(e) => updateTheme(c, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'navigation' && (
          <div className="border border-white/10 bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest text-gold">Hamburger Menu Links</h2>
              <button onClick={() => setModal({ type: 'nav', item: { id: uid('nav'), to: '/', label: '', visible: true }, isNew: true })} className="px-3 py-2 text-xs border border-white/20 hover:border-gold">Add Link</button>
            </div>
            <div className="space-y-2">
              {(working.navLinks || []).map((link, i) => (
                <div key={link.id || link.to + i} className="border border-white/10 p-3 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div>
                    <p className="text-sm">{link.label}</p>
                    <p className="text-xs text-muted">{link.to}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={link.visible !== false} onChange={(e) => {
                      const next = [...(working.navLinks || [])];
                      next[i] = { ...next[i], visible: e.target.checked };
                      setWorking((w) => ({ ...w, navLinks: next }));
                    }} /> Visible</label>
                    <button disabled={i === 0} onClick={() => {
                      const next = [...(working.navLinks || [])];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      setWorking((w) => ({ ...w, navLinks: next }));
                    }} className="px-2 py-1 border border-white/20 disabled:opacity-30">↑</button>
                    <button disabled={i === (working.navLinks || []).length - 1} onClick={() => {
                      const next = [...(working.navLinks || [])];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      setWorking((w) => ({ ...w, navLinks: next }));
                    }} className="px-2 py-1 border border-white/20 disabled:opacity-30">↓</button>
                    <button onClick={() => setModal({ type: 'nav', item: link, index: i })} className="px-2 py-1 border border-white/20">Edit</button>
                    <button onClick={() => setWorking((w) => ({ ...w, navLinks: (w.navLinks || []).filter((_, idx) => idx !== i) }))} className="px-2 py-1 border border-red-300/40 text-red-200">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-white/10 bg-card p-4">
              <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Service Pricing</h2>
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {(working.svcs || []).map((svc, i) => (
                  <button key={svc.n + i} onClick={() => setModal({ type: 'price', index: i, item: svc })} className="w-full text-left border border-white/10 p-3 hover:border-gold/50">
                    <p className="text-sm">{svc.n}</p>
                    <p className="text-xs text-gold">{svc.p}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-white/10 bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs uppercase tracking-widest text-gold">Payment Links</h2>
                  <button onClick={() => setModal({ type: 'pay-link', item: { id: uid('pay'), label: '', url: '', visible: true }, isNew: true })} className="px-3 py-2 text-xs border border-white/20 hover:border-gold">Add Link</button>
                </div>
                <div className="space-y-2">
                  {(working.paymentLinks || []).map((pl, i) => (
                    <div key={pl.id || i} className="border border-white/10 p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm">{pl.label || 'Untitled'}</p>
                        <p className="text-xs text-muted truncate">{pl.url || 'No URL'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <label className="flex items-center gap-1"><input type="checkbox" checked={pl.visible !== false} onChange={(e) => {
                          const next = [...(working.paymentLinks || [])];
                          next[i] = { ...next[i], visible: e.target.checked };
                          setWorking((w) => ({ ...w, paymentLinks: next }));
                        }} /> Visible</label>
                        <button onClick={() => setModal({ type: 'pay-link', item: pl, index: i })} className="px-2 py-1 border border-white/20">Edit</button>
                        <button onClick={() => setWorking((w) => ({ ...w, paymentLinks: (w.paymentLinks || []).filter((_, idx) => idx !== i) }))} className="px-2 py-1 border border-red-300/40 text-red-200">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-card p-4">
                <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Processors & Crypto Buckets</h2>
                <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                  {['stripe', 'paypal', 'square'].map((p) => (
                    <label key={p} className="border border-white/10 p-2 flex items-center justify-between capitalize">
                      {p}
                      <input type="checkbox" checked={!!working.paymentProcessors?.[p]} onChange={(e) => setWorking((w) => ({ ...w, paymentProcessors: { ...(w.paymentProcessors || {}), [p]: e.target.checked } }))} />
                    </label>
                  ))}
                </div>
                <button onClick={() => setModal({ type: 'crypto', item: { id: uid('crypto'), name: '', network: '', address: '' }, isNew: true })} className="mb-3 px-3 py-2 text-xs border border-white/20 hover:border-gold">Add Bucket</button>
                <div className="space-y-2">
                  {(working.cryptoBuckets || []).map((b, i) => (
                    <div key={b.id || i} className="border border-white/10 p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm">{b.name || 'Wallet'}</p>
                        <p className="text-xs text-muted">{b.network} · {b.address || 'No address'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button onClick={() => setModal({ type: 'crypto', item: b, index: i })} className="px-2 py-1 border border-white/20">Edit</button>
                        <button onClick={() => setWorking((w) => ({ ...w, cryptoBuckets: (w.cryptoBuckets || []).filter((_, idx) => idx !== i) }))} className="px-2 py-1 border border-red-300/40 text-red-200">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="border border-white/10 bg-card p-4">
            <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Pending Booking Requests</h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted">No bookings found.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="border border-white/10 p-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <p className="text-sm">{b.service || 'Service'}</p>
                        <p className="text-xs text-muted">{b.date} · {b.time} · {b.price}</p>
                        <p className="text-xs mt-1">Status: <span className="text-gold">{b.status || 'pending'}</span></p>
                      </div>
                      <div className="w-full md:w-auto md:min-w-[280px] space-y-2">
                        <textarea value={noteDrafts[b.id] ?? b.note ?? ''} onChange={(e) => setNoteDrafts((n) => ({ ...n, [b.id]: e.target.value }))} placeholder="Admin note" className="w-full bg-black border border-white/10 p-2 text-xs" rows={2} />
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => updateBooking(b.id, 'approved')} className="px-3 py-2 bg-gold text-black uppercase tracking-widest">Approve</button>
                          <button onClick={() => updateBooking(b.id, 'denied')} className="px-3 py-2 border border-red-300/50 text-red-200 uppercase tracking-widest">Deny</button>
                        </div>
                      </div>
                    </div>
                    {(b.history || []).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-muted space-y-1">
                        {(b.history || []).slice(-3).map((h, i) => (
                          <p key={i}>{new Date(h.at).toLocaleString()} · {h.action} {h.note ? `— ${h.note}` : ''}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted">Pending</p><p className="text-3xl font-display">{metrics.pending}</p></div>
            <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted">Approved</p><p className="text-3xl font-display">{metrics.approved}</p></div>
            <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted">Revenue</p><p className="text-3xl font-display">${metrics.revenue.toFixed(0)}</p></div>
            <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted">Traffic</p><p className="text-3xl font-display">{metrics.traffic.total || 0}</p></div>
            <div className="md:col-span-2 lg:col-span-4 border border-white/10 bg-card p-4">
              <h2 className="text-xs uppercase tracking-widest text-gold mb-2">Traffic by Route</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.traffic.paths || {}).map(([path, count]) => (
                  <div key={path} className="border border-white/10 p-2 flex justify-between"><span>{path}</span><span>{count}</span></div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={exportBookings} className="px-3 py-2 border border-white/20 text-xs uppercase tracking-widest">Export Bookings CSV</button>
                <button onClick={exportSummary} className="px-3 py-2 border border-white/20 text-xs uppercase tracking-widest">Export Summary CSV</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-white/10 bg-card p-4 space-y-3 text-xs">
              <h2 className="text-xs uppercase tracking-widest text-gold">General Site Settings</h2>
              <label className="flex flex-col gap-1">Site Name
                <input value={working.config?.siteName || ''} onChange={(e) => updateConfig('siteName', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
              <label className="flex flex-col gap-1">Support Email
                <input type="email" value={working.config?.supportEmail || ''} onChange={(e) => updateConfig('supportEmail', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
              <label className="flex flex-col gap-1">Admin Username
                <input required value={working.adminUser || ''} onChange={(e) => updateField('adminUser', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
              <label className="flex flex-col gap-1">Admin Password
                <input type="password" required value={working.pw || ''} onChange={(e) => updateField('pw', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
            </div>

            <div className="border border-white/10 bg-card p-4 space-y-3 text-xs">
              <h2 className="text-xs uppercase tracking-widest text-gold">AWS / API Configuration</h2>
              <label className="flex flex-col gap-1">AWS Bucket
                <input value={working.config?.awsBucket || ''} onChange={(e) => updateConfig('awsBucket', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
              <label className="flex flex-col gap-1">AWS Region
                <input value={working.config?.awsRegion || ''} onChange={(e) => updateConfig('awsRegion', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
              <label className="flex flex-col gap-1">Bucket Base URL
                <input type="url" value={working.config?.awsBaseUrl || ''} onChange={(e) => updateConfig('awsBaseUrl', e.target.value)} className="bg-black border border-white/10 p-2" />
              </label>
              {['stripe', 'paypal', 'analytics'].map((k) => (
                <label key={k} className="flex flex-col gap-1 capitalize">{k} API Key
                  <input value={working.config?.apiKeys?.[k] || ''} onChange={(e) => setWorking((w) => ({ ...w, config: { ...(w.config || {}), apiKeys: { ...(w.config?.apiKeys || {}), [k]: e.target.value } } }))} className="bg-black border border-white/10 p-2" />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal?.type === 'text' && (
        <Modal title={`Edit ${modal.label}`} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <textarea value={modal.value} onChange={(e) => setModal((m) => ({ ...m, value: e.target.value }))} rows={6} className="w-full bg-black border border-white/10 p-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-2 border border-white/20 text-xs">Cancel</button>
              <button onClick={() => { updateField(modal.key, modal.value.trim()); setModal(null); }} className="px-3 py-2 bg-gold text-black text-xs uppercase tracking-widest">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'image-add' && (
        <Modal title="Add Gallery Image" onClose={() => setModal(null)}>
          <div className="space-y-3 text-xs">
            <label className="flex flex-col gap-1">Image URL
              <input type="url" value={modal.url || ''} onChange={(e) => setModal((m) => ({ ...m, url: e.target.value }))} className="bg-black border border-white/10 p-2" />
            </label>
            <label className="flex flex-col gap-1">Label
              <input value={modal.lbl || ''} onChange={(e) => setModal((m) => ({ ...m, lbl: e.target.value }))} className="bg-black border border-white/10 p-2" />
            </label>
            <label className="flex flex-col gap-1">Category
              <select value={modal.c || ''} onChange={(e) => setModal((m) => ({ ...m, c: e.target.value }))} className="bg-black border border-white/10 p-2">
                {(working.cats || []).map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">Upload File
              <input type="file" accept="image/*" onChange={(e) => onImageFile(e.target.files?.[0], modal.c, modal.lbl)} className="bg-black border border-white/10 p-2" />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-2 border border-white/20">Cancel</button>
              <button onClick={() => {
                if (modal.url) {
                  setWorking((w) => ({ ...w, imgs: [...(w.imgs || []), { id: uid('img'), url: modal.url, lbl: modal.lbl || '', c: modal.c || 'Photography' }] }));
                }
                setModal(null);
              }} className="px-3 py-2 bg-gold text-black uppercase tracking-widest">Add</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'nav' && (
        <Modal title="Navigation Link" onClose={() => setModal(null)}>
          <div className="space-y-3 text-xs">
            <input placeholder="Label" value={modal.item.label} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, label: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <input placeholder="Path or URL" value={modal.item.to} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, to: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={modal.item.visible !== false} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, visible: e.target.checked } }))} /> Visible</label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-2 border border-white/20">Cancel</button>
              <button onClick={() => {
                if (!modal.item.label.trim() || !modal.item.to.trim()) {
                  setError('Navigation links require both label and path.');
                  return;
                }
                const next = [...(working.navLinks || [])];
                if (modal.isNew) next.push(modal.item);
                else next[modal.index] = modal.item;
                setWorking((w) => ({ ...w, navLinks: next }));
                setError('');
                setModal(null);
              }} className="px-3 py-2 bg-gold text-black uppercase tracking-widest">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'pay-link' && (
        <Modal title="Payment Link" onClose={() => setModal(null)}>
          <div className="space-y-3 text-xs">
            <input placeholder="Label" value={modal.item.label} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, label: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <input type="url" required placeholder="https://..." value={modal.item.url} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, url: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={modal.item.visible !== false} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, visible: e.target.checked } }))} /> Visible</label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-2 border border-white/20">Cancel</button>
              <button onClick={() => {
                if (!modal.item.label.trim() || !modal.item.url.trim()) {
                  setError('Payment links require both label and URL.');
                  return;
                }
                const next = [...(working.paymentLinks || [])];
                if (modal.isNew) next.push(modal.item);
                else next[modal.index] = modal.item;
                setWorking((w) => ({ ...w, paymentLinks: next }));
                setError('');
                setModal(null);
              }} className="px-3 py-2 bg-gold text-black uppercase tracking-widest">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'crypto' && (
        <Modal title="Crypto Bucket" onClose={() => setModal(null)}>
          <div className="space-y-3 text-xs">
            <input placeholder="Bucket Name" value={modal.item.name} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, name: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <input placeholder="Network" value={modal.item.network} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, network: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <input placeholder="Wallet Address" value={modal.item.address} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, address: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-2 border border-white/20">Cancel</button>
              <button onClick={() => {
                if (!modal.item.name.trim() || !modal.item.address.trim()) {
                  setError('Crypto buckets require name and wallet address.');
                  return;
                }
                const next = [...(working.cryptoBuckets || [])];
                if (modal.isNew) next.push(modal.item);
                else next[modal.index] = modal.item;
                setWorking((w) => ({ ...w, cryptoBuckets: next }));
                setError('');
                setModal(null);
              }} className="px-3 py-2 bg-gold text-black uppercase tracking-widest">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'price' && (
        <Modal title="Edit Service Price" onClose={() => setModal(null)}>
          <div className="space-y-3 text-xs">
            <input aria-label="Service Name" placeholder="Service Name" value={modal.item.n} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, n: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <input aria-label="Service Price" placeholder="Price" value={modal.item.p} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, p: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <textarea aria-label="Service Description" placeholder="Description" rows={3} value={modal.item.d || ''} onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, d: e.target.value } }))} className="w-full bg-black border border-white/10 p-2" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-3 py-2 border border-white/20">Cancel</button>
              <button onClick={() => {
                const svcs = [...(working.svcs || [])];
                svcs[modal.index] = modal.item;
                setWorking((w) => ({ ...w, svcs }));
                setModal(null);
              }} className="px-3 py-2 bg-gold text-black uppercase tracking-widest">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
