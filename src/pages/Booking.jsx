import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { DF } from '../data/defaults.js';

const MO = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function Booking() {
  const [d, setD] = useState(DF);
  const [selSvc, setSelSvc] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [selDate, setSelDate] = useState(null);
  const [cal, setCal] = useState({ m: new Date().getMonth(), y: new Date().getFullYear() });
  const [done, setDone] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  useEffect(() => {
    api.getState()
      .then(state => setD({ ...DF, ...state }))
      .catch(() => {});
  }, []);

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const firstDay = new Date(cal.y, cal.m, 1).getDay();
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();

  function prevM() {
    setCal(c => c.m === 0 ? { m: 11, y: c.y - 1 } : { m: c.m - 1, y: c.y });
  }
  function nextM() {
    setCal(c => c.m === 11 ? { m: 0, y: c.y + 1 } : { m: c.m + 1, y: c.y });
  }

  function doBook() {
    if (!selDate || selSvc === null || !selTime) return;
    const svc = d.svcs[selSvc];
    const ds = selDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const sub = encodeURIComponent('Booking: ' + svc.n + ' — ' + ds);
    const body = encodeURIComponent('Service: ' + svc.n + '\nPrice: ' + svc.p + '\nDate: ' + ds + '\nTime: ' + selTime + '\n\nPayment: ' + d.pay);
    if (d.email) window.location.href = 'mailto:' + d.email + '?subject=' + sub + '&body=' + body;
    setDoneMsg(svc.n + ' on ' + ds + ' at ' + selTime + '. Request sent — confirming within 24hrs.');
    setDone(true);
  }

  function reset() {
    setSelSvc(null); setSelDate(null); setSelTime(null); setDone(false);
  }

  const ready = selDate && selSvc !== null && selTime;
  const selSvcData = selSvc !== null ? d.svcs[selSvc] : null;

  if (done) {
    return (
      <section className="pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="mx-auto max-w-lg text-center">
          <div className="text-4xl mb-6">✓</div>
          <h2 className="font-display text-4xl text-gold mb-4">Request Sent</h2>
          <p className="text-offwhite/60 text-sm mb-8">{doneMsg}</p>
          <button onClick={reset} className="px-8 py-4 border border-white/20 text-xs uppercase tracking-widest hover:border-gold hover:text-gold transition">
            Book Another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-20 px-6 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">{d.bsb}</p>
        <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none mb-2">Book a Session</h1>
        <p className="text-xs text-muted mb-12">{d.dep}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Services */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gold mb-4">1. Choose a Service</h2>
            <div className="flex flex-col gap-1">
              {d.svcs.map((svc, i) => {
                const isCustom = svc.p.toLowerCase().includes('talk');
                return (
                  <button
                    key={i}
                    onClick={() => setSelSvc(i)}
                    className={`flex items-center justify-between px-4 py-3 border text-left transition ${
                      selSvc === i
                        ? 'border-gold bg-gold/5'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs text-offwhite leading-snug">{svc.n}</span>
                    <span className={`text-xs font-mono ml-3 whitespace-nowrap ${isCustom ? 'text-gold' : 'text-muted'}`}>
                      {svc.p}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gold mb-4">2. Pick a Date</h2>
            <div className="bg-card border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevM} className="text-muted hover:text-offwhite px-2 py-1">‹</button>
                <span className="text-xs uppercase tracking-widest">{MO[cal.m]} {cal.y}</span>
                <button onClick={nextM} className="text-muted hover:text-offwhite px-2 py-1">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WD.map(d => (
                  <div key={d} className="text-center text-xs text-muted py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={'e' + i} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(cal.y, cal.m, day);
                  const isPast = date < todayMidnight;
                  const isClosed = (d.cd || []).includes(date.getDay());
                  const isToday = day === today.getDate() && cal.m === today.getMonth() && cal.y === today.getFullYear();
                  const isSelected = selDate && date.toDateString() === selDate.toDateString();
                  const disabled = isPast || isClosed;

                  return (
                    <button
                      key={day}
                      disabled={disabled}
                      onClick={() => !disabled && setSelDate(date)}
                      className={`aspect-square text-xs flex items-center justify-center rounded-sm transition ${
                        disabled
                          ? 'text-white/10 cursor-not-allowed'
                          : isSelected
                          ? 'bg-gold text-black font-medium'
                          : isToday
                          ? 'border border-gold/40 text-gold'
                          : 'hover:bg-white/5 text-offwhite'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Times + Summary */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gold mb-4">3. Pick a Time</h2>
              <div className="grid grid-cols-2 gap-2">
                {d.ts.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelTime(t)}
                    className={`py-2 px-3 text-xs border transition ${
                      selTime === t
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-white/10 text-muted hover:border-white/30 hover:text-offwhite'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {ready && (
              <div className="border border-gold/20 bg-gold/5 p-5">
                <div className="text-xs uppercase tracking-widest text-gold mb-3">Your Selection</div>
                <div className="text-sm text-offwhite mb-1">{selSvcData.n}</div>
                <div className="text-xs text-muted mb-1">
                  {selDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selTime}
                </div>
                <div className="text-sm font-mono text-offwhite mb-4">{selSvcData.p}</div>
                <button
                  onClick={doBook}
                  className="w-full py-3 bg-gold text-black text-xs uppercase tracking-widest font-medium hover:bg-gold/90 transition"
                >
                  Request This Booking →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
