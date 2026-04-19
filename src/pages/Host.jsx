import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { DF } from '../data/defaults.js';

// ── tiny shared input ──────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', mono }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-muted uppercase tracking-widest">{label}</label>}
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm focus:border-gold/50 outline-none transition ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function Card({ title, sub, children }) {
  return (
    <div className="bg-card border border-white/5 p-5 flex flex-col gap-4">
      {title && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">{title}</div>
          {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

const PANELS = [
  { id: 'identity',  label: 'Identity' },
  { id: 'contact',   label: 'Contact' },
  { id: 'services',  label: 'Services' },
  { id: 'gallery',   label: 'Gallery' },
  { id: 'booking',   label: 'Booking' },
  { id: 'tools',     label: 'Tools & Pages' },
  { id: 'cypher',    label: 'Cypher' },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function Host() {
  const [authed, setAuthed]   = useState(api.isLoggedIn());
  const [user,   setUser]     = useState('');
  const [pw,     setPw]       = useState('');
  const [err,    setErr]      = useState('');
  const [saving, setSaving]   = useState(false);
  const [toast,  setToast]    = useState('');
  const [panel,  setPanel]    = useState('identity');
  const [D,      setD]        = useState(null); // null = loading

  // ── Load state after login ─────────────────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      const state = await api.getState();
      setD({ ...DF, ...state });
    } catch {
      setD({ ...DF });
    }
  }, []);

  useEffect(() => { if (authed) loadState(); }, [authed, loadState]);

  // ── Login ──────────────────────────────────────────────────────────────
  async function login(e) {
    e.preventDefault();
    setErr('');
    if (!user.trim()) { setErr('Username required.'); return; }
    try {
      await api.login(user.trim(), pw);
      setAuthed(true);
      setPw(''); setUser('');
    } catch (ex) {
      setErr(ex.message || 'Wrong credentials.');
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────
  async function save() {
    if (!D) return;
    setSaving(true);
    try {
      await api.saveState(D);
      showToast('Saved ✓');
    } catch (ex) {
      showToast('Save failed: ' + ex.message, true);
    } finally {
      setSaving(false);
    }
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(''), 3000);
  }

  function upd(key, val) {
    setD(prev => ({ ...prev, [key]: val }));
  }

  // ── Login screen ───────────────────────────────────────────────────────
  if (!authed) {
    return (
      <section className="pt-32 pb-20 px-6 min-h-screen flex items-center">
        <form onSubmit={login} className="mx-auto max-w-sm w-full">
          <div className="text-xs uppercase tracking-widest text-muted mb-2">Final Stage Productions</div>
          <h1 className="font-display text-5xl text-gold mb-8">Host ⬡</h1>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="Username"
              autoFocus
              autoComplete="username"
              className="w-full px-4 py-3 bg-card border border-white/10 text-offwhite focus:border-gold/50 outline-none"
            />
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-card border border-white/10 text-offwhite focus:border-gold/50 outline-none"
            />
            {err && <div className="text-red-400 text-xs font-mono">{err}</div>}
            <button
              type="submit"
              className="w-full py-3 bg-gold text-black text-xs uppercase tracking-widest font-medium hover:bg-gold/90 transition"
            >
              Enter
            </button>
          </div>
          <p className="text-xs text-muted mt-6 leading-relaxed">
            Session is device-only — stored in your browser tab. Closing the tab logs you out.
            Site content is global — changes affect all visitors instantly after saving.
          </p>
        </form>
      </section>
    );
  }

  if (!D) {
    return (
      <section className="pt-32 min-h-screen flex items-center justify-center">
        <div className="text-xs uppercase tracking-widest text-muted">Loading…</div>
      </section>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 flex">

      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-white/5 pt-8 flex flex-col">
        <div className="px-5 mb-6">
          <div className="text-xs uppercase tracking-widest text-gold mb-1">Host Dashboard</div>
          <div className="text-xs text-muted">Global · KV-backed</div>
        </div>
        <nav className="flex flex-col flex-1">
          {PANELS.map(p => (
            <button
              key={p.id}
              onClick={() => setPanel(p.id)}
              className={`text-left px-5 py-3 text-xs uppercase tracking-widest border-l-2 transition ${
                panel === p.id
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-muted hover:text-offwhite hover:bg-white/3'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2 bg-gold text-black text-xs uppercase tracking-widest font-medium hover:bg-gold/90 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save All'}
          </button>
          <button
            onClick={() => { api.logout(); setAuthed(false); }}
            className="w-full py-2 border border-white/10 text-xs uppercase tracking-widest text-muted hover:text-offwhite hover:border-white/30 transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main panel area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {panel === 'identity'  && <PanelIdentity  D={D} upd={upd} />}
        {panel === 'contact'   && <PanelContact   D={D} upd={upd} />}
        {panel === 'services'  && <PanelServices  D={D} upd={upd} />}
        {panel === 'gallery'   && <PanelGallery   D={D} upd={upd} />}
        {panel === 'booking'   && <PanelBooking   D={D} upd={upd} />}
        {panel === 'tools'     && <PanelTools     D={D} upd={upd} />}
        {panel === 'cypher'    && <PanelCypher    D={D} upd={upd} showToast={showToast} save={save} />}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 text-xs uppercase tracking-widest font-mono ${
          toast.err ? 'bg-red-900 text-red-200' : 'bg-gold text-black'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// IDENTITY
// ══════════════════════════════════════════════════════════════════════════════
function PanelIdentity({ D, upd }) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="font-display text-4xl text-gold">Identity</h2>
      <Card title="Branding" sub="What shows in the hero section">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Line 1" value={D.b1} onChange={v => upd('b1', v)} placeholder="FINAL STAGE" />
          <Field label="Line 2" value={D.b2} onChange={v => upd('b2', v)} placeholder="Productions" />
        </div>
        <Field label="Tagline" value={D.tag} onChange={v => upd('tag', v)} />
        <Field label="Location" value={D.loc} onChange={v => upd('loc', v)} />
        <Field label="Copyright" value={D.copy} onChange={v => upd('copy', v)} />
      </Card>
      <Card title="Stats" sub="Three numbers shown on the about section">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Stat 1 #" value={D.s1n} onChange={v => upd('s1n', v)} placeholder="23+" />
          <Field label="Label"   value={D.s1l} onChange={v => upd('s1l', v)} placeholder="Service Types" />
          <div />
          <Field label="Stat 2 #" value={D.s2n} onChange={v => upd('s2n', v)} placeholder="PNW" />
          <Field label="Label"   value={D.s2l} onChange={v => upd('s2l', v)} placeholder="Based & Rooted" />
          <div />
          <Field label="Stat 3 #" value={D.s3n} onChange={v => upd('s3n', v)} placeholder="∞" />
          <Field label="Label"   value={D.s3l} onChange={v => upd('s3l', v)} placeholder="Creative Range" />
        </div>
      </Card>
      <Card title="Credentials Strip" sub="The 6 icons on the home page">
        {(D.creds || []).map((c, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={c.icon} onChange={e => {
              const arr = [...D.creds]; arr[i] = { ...arr[i], icon: e.target.value }; upd('creds', arr);
            }} className="w-12 px-2 py-2 bg-deep border border-white/10 text-offwhite text-center text-sm outline-none" />
            <input value={c.t} onChange={e => {
              const arr = [...D.creds]; arr[i] = { ...arr[i], t: e.target.value }; upd('creds', arr);
            }} className="flex-1 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none" placeholder="Title" />
            <input value={c.d} onChange={e => {
              const arr = [...D.creds]; arr[i] = { ...arr[i], d: e.target.value }; upd('creds', arr);
            }} className="flex-[2] px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none" placeholder="Description" />
            <button onClick={() => upd('creds', D.creds.filter((_, j) => j !== i))}
              className="text-muted hover:text-red-400 text-xs px-2">✕</button>
          </div>
        ))}
        <button onClick={() => upd('creds', [...(D.creds || []), { icon: '⭐', t: 'New', d: 'Description' }])}
          className="text-xs uppercase tracking-widest text-gold hover:underline text-left">+ Add Credential</button>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTACT
// ══════════════════════════════════════════════════════════════════════════════
function PanelContact({ D, upd }) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="font-display text-4xl text-gold">Contact</h2>
      <Card title="Details" sub="Used in CTAs, footer, and booking emails">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={D.phone} onChange={v => upd('phone', v)} placeholder="+1 (206) 000-0000" />
          <Field label="Email (all forms send here)" value={D.email} onChange={v => upd('email', v)} placeholder="you@gmail.com" mono />
          <Field label="Instagram" value={D.ig} onChange={v => upd('ig', v)} placeholder="@yourhandle" />
          <Field label="Portfolio URL" value={D.pt} onChange={v => upd('pt', v)} placeholder="https://yoursite.com" mono />
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ══════════════════════════════════════════════════════════════════════════════
function PanelServices({ D, upd }) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h2 className="font-display text-4xl text-gold">Services</h2>
      <Card title="Categories">
        {(D.cats || []).map((c, i) => (
          <div key={i} className="flex gap-2">
            <input value={c} onChange={e => {
              const arr = [...D.cats]; arr[i] = e.target.value; upd('cats', arr);
            }} className="flex-1 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none" />
            <button onClick={() => upd('cats', D.cats.filter((_, j) => j !== i))}
              className="text-muted hover:text-red-400 text-xs px-3">✕</button>
          </div>
        ))}
        <button onClick={() => upd('cats', [...(D.cats || []), 'New Category'])}
          className="text-xs uppercase tracking-widest text-gold hover:underline text-left">+ Add Category</button>
      </Card>
      <Card title="Service List" sub="Name · Price · Category">
        {(D.svcs || []).map((s, i) => (
          <div key={i} className="flex gap-2 items-center flex-wrap">
            <input value={s.n} onChange={e => {
              const arr = [...D.svcs]; arr[i] = { ...arr[i], n: e.target.value }; upd('svcs', arr);
            }} className="flex-[3] min-w-0 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none" placeholder="Service name" />
            <input value={s.p} onChange={e => {
              const arr = [...D.svcs]; arr[i] = { ...arr[i], p: e.target.value }; upd('svcs', arr);
            }} className="w-24 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none font-mono" placeholder="$0" />
            <select value={s.c} onChange={e => {
              const arr = [...D.svcs]; arr[i] = { ...arr[i], c: e.target.value }; upd('svcs', arr);
            }} className="w-36 px-2 py-2 bg-deep border border-white/10 text-offwhite text-xs outline-none">
              {(D.cats || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button onClick={() => upd('svcs', D.svcs.filter((_, j) => j !== i))}
              className="text-muted hover:text-red-400 text-xs px-2">✕</button>
          </div>
        ))}
        <button onClick={() => upd('svcs', [...(D.svcs || []), { n: 'New Service', p: '$0', c: (D.cats || [])[0] || 'Photography', d: '', i: [] }])}
          className="text-xs uppercase tracking-widest text-gold hover:underline text-left">+ Add Service</button>
      </Card>
      <Card title="Pricing Notes">
        <Field label="Deposit / Payment Terms" value={D.dep} onChange={v => upd('dep', v)} />
        <Field label="Payment Methods" value={D.pay} onChange={v => upd('pay', v)} placeholder="Venmo · Zelle · Cash" />
        <Field label="Pricing Note" value={D.pyn} onChange={v => upd('pyn', v)} />
        <Field label="Services Subtitle" value={D.sst} onChange={v => upd('sst', v)} />
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════════════════════════════════════════
function PanelGallery({ D, upd }) {
  const [url,  setUrl]  = useState('');
  const [lbl,  setLbl]  = useState('');
  const [cat,  setCat]  = useState((D.cats || [])[0] || '');

  function addImg() {
    if (!url.trim()) return;
    upd('imgs', [...(D.imgs || []), { url: url.trim(), lbl: lbl.trim(), c: cat }]);
    setUrl(''); setLbl('');
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h2 className="font-display text-4xl text-gold">Gallery</h2>
      <Card title="Add Image" sub="Paste a direct image URL">
        <div className="flex gap-2 flex-wrap">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... image URL"
            className="flex-[3] min-w-0 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none font-mono" />
          <input value={lbl} onChange={e => setLbl(e.target.value)} placeholder="Label"
            className="flex-1 min-w-0 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none" />
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="w-36 px-2 py-2 bg-deep border border-white/10 text-offwhite text-xs outline-none">
            {(D.cats || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addImg}
            className="px-4 py-2 bg-gold text-black text-xs uppercase tracking-widest hover:bg-gold/90 transition">
            Add
          </button>
        </div>
      </Card>
      <Card title={`Images (${(D.imgs || []).length})`}>
        {!(D.imgs || []).length && (
          <div className="text-xs text-muted font-mono uppercase">No images yet.</div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {(D.imgs || []).map((img, i) => (
            <div key={i} className="relative group bg-card2 border border-white/5">
              <img src={img.url} alt={img.lbl} className="w-full aspect-square object-cover" />
              <div className="p-2 flex flex-col gap-1">
                <input value={img.lbl} onChange={e => {
                  const arr = [...D.imgs]; arr[i] = { ...arr[i], lbl: e.target.value }; upd('imgs', arr);
                }} className="w-full px-2 py-1 bg-deep border border-white/10 text-offwhite text-xs outline-none" placeholder="Label" />
                <select value={img.c} onChange={e => {
                  const arr = [...D.imgs]; arr[i] = { ...arr[i], c: e.target.value }; upd('imgs', arr);
                }} className="w-full px-1 py-1 bg-deep border border-white/10 text-offwhite text-xs outline-none">
                  {(D.cats || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => upd('imgs', D.imgs.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:underline text-left">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOKING CONFIG
// ══════════════════════════════════════════════════════════════════════════════
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PanelBooking({ D, upd }) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="font-display text-4xl text-gold">Booking</h2>
      <Card title="Closed Days" sub="Toggle days you never take bookings">
        <div className="flex gap-2 flex-wrap">
          {DAY_NAMES.map((d, i) => {
            const closed = (D.cd || []).includes(i);
            return (
              <button key={d} onClick={() => {
                const arr = closed ? D.cd.filter(x => x !== i) : [...(D.cd || []), i];
                upd('cd', arr);
              }} className={`px-4 py-2 text-xs uppercase tracking-widest border transition ${
                closed ? 'border-red-500 text-red-400 bg-red-900/20' : 'border-white/10 text-muted hover:border-white/30'
              }`}>
                {d}
              </button>
            );
          })}
        </div>
      </Card>
      <Card title="Available Time Slots">
        {(D.ts || []).map((t, i) => (
          <div key={i} className="flex gap-2">
            <input value={t} onChange={e => {
              const arr = [...D.ts]; arr[i] = e.target.value; upd('ts', arr);
            }} className="flex-1 px-3 py-2 bg-deep border border-white/10 text-offwhite text-sm outline-none font-mono" />
            <button onClick={() => upd('ts', D.ts.filter((_, j) => j !== i))}
              className="text-muted hover:text-red-400 text-xs px-3">✕</button>
          </div>
        ))}
        <button onClick={() => upd('ts', [...(D.ts || []), 'New Time'])}
          className="text-xs uppercase tracking-widest text-gold hover:underline text-left">+ Add Time Slot</button>
      </Card>
      <Card title="Booking Page Text">
        <Field label="Subtitle" value={D.bsb} onChange={v => upd('bsb', v)} />
        <Field label="Deposit Note" value={D.dep} onChange={v => upd('dep', v)} />
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOLS & PAGES — manage tool pages in the hamburger nav
// ══════════════════════════════════════════════════════════════════════════════
function PanelTools({ D, upd }) {
  const tools = D.toolPages || [];

  function updTool(i, key, val) {
    const arr = [...tools];
    arr[i] = { ...arr[i], [key]: val };
    upd('toolPages', arr);
  }

  function addTool() {
    upd('toolPages', [...tools, {
      id: Date.now().toString(),
      slug: '',
      label: 'New Tool',
      src: '',
      inNav: true,
      desc: '',
    }]);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="font-display text-4xl text-gold">Tools & Pages</h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Each tool appears in the hamburger menu under "Free Tools" when enabled.
          Built-in tools live at <span className="font-mono text-offwhite">/tools/filename.html</span> —
          you can also point to any external URL. Toggle off to hide without deleting.
        </p>
      </div>

      {tools.map((t, i) => (
        <Card key={t.id} title={t.label || 'Untitled'} sub={t.inNav ? `✓ Visible in nav · /tools/${t.slug}` : `Hidden · /tools/${t.slug}`}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nav Label" value={t.label} onChange={v => updTool(i, 'label', v)} placeholder="e.g. Cypher" />
            <Field label="URL Slug" value={t.slug} onChange={v => updTool(i, 'slug', v.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))} placeholder="cypher" mono />
          </div>
          <Field label="Source URL or Path" value={t.src} onChange={v => updTool(i, 'src', v)} placeholder="/tools/cypher.html or https://..." mono />
          <Field label="Short Description (shown in nav)" value={t.desc} onChange={v => updTool(i, 'desc', v)} placeholder="Beat player & store" />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={t.inNav || false}
                onChange={e => updTool(i, 'inNav', e.target.checked)}
                className="accent-gold w-3.5 h-3.5"
              />
              Show in hamburger nav
            </label>
            <div className="flex items-center gap-4">
              <a
                href={`/tools/${t.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gold hover:underline"
              >
                Preview ↗
              </a>
              <button
                onClick={() => upd('toolPages', tools.filter((_, j) => j !== i))}
                className="text-xs text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </Card>
      ))}

      <button
        onClick={addTool}
        className="px-6 py-3 border border-gold/30 text-xs uppercase tracking-widest text-gold hover:bg-gold/5 transition text-left"
      >
        + Add Tool or Page
      </button>

      <Card title="Built-in Tools" sub="Files already in /public/tools/ — use these paths as-is">
        <div className="flex flex-col gap-2 font-mono text-xs">
          {[
            ['/tools/cypher.html',    'Beat player & store'],
            ['/tools/aisle-lens.html','Wedding photography community'],
            ['/tools/lexsearch.html', 'US legal research'],
            ['/tools/gallery.html',   'Premium gallery viewer'],
          ].map(([path, desc]) => (
            <div key={path} className="flex items-center justify-between border border-white/5 px-3 py-2">
              <span className="text-offwhite">{path}</span>
              <span className="text-muted ml-4">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          To update a tool, replace its HTML file in your repo under <span className="font-mono text-offwhite">public/tools/</span> and push. Cloudflare deploys automatically.
        </p>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CYPHER — change password
// ══════════════════════════════════════════════════════════════════════════════
function PanelCypher({ showToast, save }) {
  const [cur,  setCur]  = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [msg,  setMsg]  = useState('');
  const [ok,   setOk]   = useState(false);

  async function change(e) {
    e.preventDefault();
    setMsg(''); setOk(false);

    // Verify current password against API
    try {
      await api.login(cur);
    } catch {
      setMsg('Current password is wrong.'); return;
    }
    if (next.length < 6) { setMsg('New password must be at least 6 characters.'); return; }
    if (next !== conf)   { setMsg("New passwords don't match."); return; }

    // The new ADMIN_TOKEN must be changed in Cloudflare dashboard.
    // What we can do: update the pw field in KV state so the UI matches.
    try {
      const state = await api.getState();
      await api.saveState({ ...state, pw: next });
      // Re-auth with new password so token stays valid
      await api.login(next);
      setOk(true);
      setMsg('Password updated in KV. ⚠️ Also update ADMIN_TOKEN in Cloudflare dashboard to match.');
      setCur(''); setNext(''); setConf('');
    } catch (ex) {
      setMsg('Failed: ' + ex.message);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <h2 className="font-display text-4xl text-gold">Cypher</h2>
        <p className="text-xs text-muted mt-1">Change your host password.</p>
      </div>
      <Card title="Change Password">
        <form onSubmit={change} className="flex flex-col gap-3">
          <Field label="Current Password" value={cur} onChange={setCur} type="password" />
          <Field label="New Password" value={next} onChange={setNext} type="password" placeholder="Min 6 characters" />
          <Field label="Confirm New Password" value={conf} onChange={setConf} type="password" />
          {msg && (
            <div className={`text-xs font-mono ${ok ? 'text-gold' : 'text-red-400'}`}>{msg}</div>
          )}
          <button type="submit"
            className="py-3 bg-gold text-black text-xs uppercase tracking-widest font-medium hover:bg-gold/90 transition">
            Update Password
          </button>
        </form>
      </Card>
      <Card title="How Auth Works" sub="For reference">
        <ul className="text-xs text-muted leading-relaxed flex flex-col gap-1.5">
          <li>— Your password = the <span className="text-offwhite font-mono">ADMIN_TOKEN</span> env var in Cloudflare</li>
          <li>— Sessions are per-device, stored in your browser tab only</li>
          <li>— Site content (state) is global — one host, all visitors see the same KV data</li>
          <li>— After changing here, go to Cloudflare Pages → Settings → Environment Variables and update <span className="text-offwhite font-mono">ADMIN_TOKEN</span> to match</li>
        </ul>
      </Card>
    </div>
  );
}
