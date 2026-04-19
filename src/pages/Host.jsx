export default function Host() {
  return (
    <section className="pt-32 pb-20 px-6 min-h-screen">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">Seattle · Tacoma</p>
        <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-none mb-10">Host a Production</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-card border border-white/5 p-5">
            <div className="text-xs uppercase tracking-widest text-gold mb-3">Venue Type</div>
            <div className="text-sm text-offwhite">Studio, event hall, storefront, rooftop, and private venues.</div>
          </div>
          <div className="bg-card border border-white/5 p-5">
            <div className="text-xs uppercase tracking-widest text-gold mb-3">Service Area</div>
            <div className="text-sm text-offwhite">Seattle-Tacoma and surrounding Pacific Northwest locations.</div>
          </div>
          <div className="bg-card border border-white/5 p-5">
            <div className="text-xs uppercase tracking-widest text-gold mb-3">Response Time</div>
            <div className="text-sm text-offwhite">Typically within 24 hours for venue and scheduling requests.</div>
          </div>
        </div>

        <div className="border border-gold/20 bg-gold/5 p-6">
          <h2 className="text-xs uppercase tracking-widest text-gold mb-3">Venue Information Checklist</h2>
          <ul className="text-sm text-offwhite/80 space-y-2 list-disc pl-5">
            <li>Address and parking/loading access</li>
            <li>Available dates and preferred time windows</li>
            <li>Indoor/outdoor power and lighting details</li>
            <li>Any permits, limitations, or security requirements</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
