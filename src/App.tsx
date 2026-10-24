import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';

type User = { id: string; name: string; email: string; role: 'buyer' | 'admin' };
type Session = { user: User; token: string };
type Vehicle = { id: string; make: string; model: string; category: string; price: number; quantity: number; createdAt: string; updatedAt: string };
type VehicleInput = Pick<Vehicle, 'make' | 'model' | 'category' | 'price' | 'quantity'>;
type StockEvent = { id: string; type: string; delta: number; quantityAfter: number; createdAt: string };
type Receipt = { id: string; vehicleId: string; quantity: number; price: number; remainingQuantity: number; purchasedAt: string };
type Filters = { make: string; model: string; category: string; minPrice: string; maxPrice: string };

const emptyFilters: Filters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };
const rupees = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function savedSession(): Session | null {
  try { return JSON.parse(localStorage.getItem('drivewell-session') ?? 'null') as Session | null; }
  catch { return null; }
}

async function api<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? 'Something went wrong. Please try again.');
  return body as T;
}

function Logo({ light = false }: { light?: boolean }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`} aria-label="Drivewell">
    <span className="brand-mark" aria-hidden="true"><span /></span>
    <span>drivewell<span className="brand-period">.</span></span>
  </div>;
}

function VehicleArt({ vehicle, large = false }: { vehicle: Vehicle; large?: boolean }) {
  const colors = ['#476a80', '#a8755a', '#718472', '#6b688f', '#b99153', '#51626c'];
  const index = [...vehicle.model].reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length;
  const color = colors[index];
  const category = vehicle.category.toLowerCase();
  const shape = category.includes('suv') || category.includes('adventure') ? 'suv' : category.includes('family') ? 'mpv' : category.includes('electric') ? 'compact' : 'sedan';
  const artId = useId().replace(/:/g, '');
  const bodies = {
    sedan: 'M67 145 Q76 127 112 124 L159 119 Q182 75 230 69 L338 69 Q386 74 410 119 L453 127 Q473 132 480 148 L477 179 Q474 188 463 189 L69 189 Q56 185 56 175 L59 156 Q60 149 67 145Z',
    suv: 'M51 141 Q63 127 114 124 L164 119 L188 78 Q197 65 222 65 L369 65 Q390 65 402 87 L426 123 L464 133 Q482 139 484 154 L481 178 Q479 188 464 189 L58 189 Q44 186 44 172 L44 153 Q44 145 51 141Z',
    mpv: 'M57 143 Q68 126 110 122 L161 118 L189 82 Q201 68 224 68 L377 68 Q397 68 408 88 L432 124 L463 132 Q481 137 484 152 L481 178 Q479 188 464 189 L58 189 Q44 186 44 172 L45 153 Q46 147 57 143Z',
    compact: 'M82 143 Q93 128 135 125 L176 119 L201 91 Q211 79 235 79 L354 79 Q376 79 391 104 L411 127 L454 135 Q471 140 476 154 L475 178 Q473 187 461 189 L82 189 Q66 187 65 173 L69 154 Q72 147 82 143Z',
  };
  const windows = {
    sedan: 'M182 118 Q203 81 233 79 L288 79 L288 119Z M299 79 L337 79 Q373 83 392 119 L299 119Z',
    suv: 'M186 116 L208 81 Q214 77 228 77 L288 77 L288 117Z M299 77 L366 77 Q382 78 389 95 L402 117 L299 117Z',
    mpv: 'M181 116 L207 82 Q215 79 227 79 L294 79 L294 117Z M305 79 L371 79 Q388 80 396 98 L410 117 L305 117Z',
    compact: 'M195 117 L218 94 Q224 89 236 89 L291 89 L291 119Z M302 89 L349 89 Q369 91 379 107 L390 120 L302 120Z',
  };
  return <div className={`vehicle-art vehicle-art-${shape} ${large ? 'vehicle-art-large' : ''}`} style={{ '--car-color': color } as React.CSSProperties} aria-hidden="true">
    <div className="art-orbit art-orbit-one" /><div className="art-orbit art-orbit-two" />
    <svg viewBox="0 0 520 235" role="presentation">
      <defs>
        <linearGradient id={`body-${artId}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor={color} /><stop offset="1" stopColor="#263646" /></linearGradient>
        <linearGradient id={`glass-${artId}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#d3e2e9" /><stop offset="1" stopColor="#8ea7b5" /></linearGradient>
      </defs>
      <ellipse cx="262" cy="199" rx="210" ry="18" fill="#66757d" opacity=".14" />
      <path d={bodies[shape]} fill={`url(#body-${artId})`} />
      <path d={windows[shape]} fill={`url(#glass-${artId})`} />
      <path d={shape === 'compact' ? 'M291 89 L302 89 L302 120 L291 120Z' : shape === 'suv' ? 'M288 77 L299 77 L299 117 L288 117Z' : 'M294 79 L305 79 L305 117 L294 117Z'} fill="#344a59" opacity=".7" />
      <path d="M99 136 L151 127 M407 126 L448 135" fill="none" stroke="#d5e0df" strokeWidth="4" opacity=".45" />
      <path d="M72 164 L106 164 M444 162 L469 162" stroke="#f2cf8b" strokeWidth="8" strokeLinecap="round" />
      <path d="M75 187 L461 187" stroke="#1b2936" strokeWidth="6" opacity=".6" />
      <circle cx="151" cy="187" r="31" fill="#1d2932" /><circle cx="151" cy="187" r="19" fill="#c6cdd0" /><circle cx="151" cy="187" r="10" fill="#63727b" />
      <circle cx="389" cy="187" r="31" fill="#1d2932" /><circle cx="389" cy="187" r="19" fill="#c6cdd0" /><circle cx="389" cy="187" r="10" fill="#63727b" />
      <path d="M167 135 L382 135" stroke="#e8eded" strokeWidth="2" opacity=".45" />
    </svg>
    <span className="art-caption">{vehicle.category.toUpperCase()} / DRIVEWELL</span>
  </div>;
}

function AuthPage({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await api<Session>(`/api/auth/${mode}`, undefined, { method: 'POST', body: JSON.stringify(mode === 'register' ? { name, email, password } : { email, password }) });
      onAuthenticated(data);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="auth-shell grid">
    <section className="auth-story flex flex-col justify-between">
      <Logo light />
      <div className="auth-story-content">
        <h1>Good cars.<br />Clear choices<span className="accent-dot">.</span></h1>
        <p>See what is available, understand the price, and decide at your own pace.</p>
        <div className="auth-road" aria-hidden="true"><span /><span /><span /></div>
      </div>
      <div className="auth-story-footer"><span>REAL STOCK. CLEAR NEXT STEPS.</span><span>DRIVEWELL / 2026</span></div>
    </section>
    <section className="auth-panel">
      <div className="auth-panel-inner">
        <h2>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2>
        <p className="muted">{mode === 'login' ? 'Sign in to explore available vehicles.' : 'A few details and you are ready to browse.'}</p>
        <div className="auth-tabs grid grid-cols-2" role="tablist" aria-label="Account access">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Register</button>
        </div>
        <form onSubmit={submit} className="auth-form grid">
          {mode === 'register' && <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Avery Patel" minLength={2} required /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} minLength={mode === 'register' ? 8 : undefined} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in to inventory' : 'Create account'} <span aria-hidden="true">↗</span></button>
        </form>
        <p className="auth-footnote">Your account gives you a live view of stock. Inventory changes are reserved for dealership admins.</p>
      </div>
    </section>
  </div>;
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop grid place-items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title} ref={dialogRef}>
      <header className="modal-header"><div><span className="eyebrow">DRIVEWELL / INVENTORY</span><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>;
}

function VehicleForm({ initial, busy, error, onSave, onClose }: { initial?: Vehicle; busy: boolean; error: string; onSave: (input: VehicleInput) => void; onClose: () => void }) {
  const [input, setInput] = useState({ make: initial?.make ?? '', model: initial?.model ?? '', category: initial?.category ?? '', price: String(initial?.price ?? ''), quantity: String(initial?.quantity ?? '0') });
  function field(key: keyof typeof input, value: string) { setInput((current) => ({ ...current, [key]: value })); }
  return <form className="vehicle-form" onSubmit={(event) => { event.preventDefault(); onSave({ make: input.make, model: input.model, category: input.category, price: Number(input.price), quantity: Number(input.quantity) }); }}>
    <div className="form-grid grid">
      <label>Make<input value={input.make} onChange={(event) => field('make', event.target.value)} placeholder="e.g. Tata" maxLength={60} required /></label>
      <label>Model<input value={input.model} onChange={(event) => field('model', event.target.value)} placeholder="e.g. Nexon EV" maxLength={80} required /></label>
      <label>Category<input value={input.category} onChange={(event) => field('category', event.target.value)} placeholder="e.g. Electric SUV" maxLength={60} required /></label>
      <label>Price in ₹<input type="number" min="1" step="1" value={input.price} onChange={(event) => field('price', event.target.value)} required /></label>
      <label>Units in stock<input type="number" min="0" step="1" value={input.quantity} onChange={(event) => field('quantity', event.target.value)} required /></label>
    </div>
    {initial && <p className="form-hint">Changes to stock are recorded in the vehicle history.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add vehicle'} <span aria-hidden="true">↗</span></button></div>
  </form>;
}

function App() {
  const [session, setSession] = useState<Session | null>(savedSession);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<{ kind: 'add' | 'edit' | 'restock' | 'delete' | 'purchase' | 'history'; vehicle?: Vehicle } | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('1');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [history, setHistory] = useState<StockEvent[]>([]);

  function authenticate(next: Session) { localStorage.setItem('drivewell-session', JSON.stringify(next)); setNotice(''); setSession(next); }
  function signOut() { localStorage.removeItem('drivewell-session'); setSession(null); setVehicles([]); setAllVehicles([]); setFilters(emptyFilters); setNotice(''); setDialog(null); }

  useEffect(() => {
    if (!session) return;
    let active = true;
    api<{ vehicles: Vehicle[] }>('/api/vehicles', session.token)
      .then((result) => { if (active) setAllVehicles(result.vehicles); })
      .catch((cause) => { if (active) setNotice((cause as Error).message); });
    return () => { active = false; };
  }, [session?.token, refresh]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    api<{ user: User }>('/api/auth/me', session.token).then(({ user }) => {
      if (active) setSession((current) => current ? { ...current, user } : null);
    }).catch(() => { if (active) signOut(); });
    return () => { active = false; };
  }, [session?.token]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) if (value.trim()) query.set(key, value.trim());
      try {
        const result = await api<{ vehicles: Vehicle[] }>(query.size ? `/api/vehicles/search?${query}` : '/api/vehicles', session.token);
        if (active) setVehicles(result.vehicles);
      } catch (cause) { if (active) setNotice((cause as Error).message); }
      finally { if (active) setLoading(false); }
    }, 220);
    return () => { active = false; clearTimeout(timer); };
  }, [session?.token, filters, refresh]);

  useEffect(() => {
    if (!dialog || dialog.kind !== 'history' || !dialog.vehicle || !session) return;
    let active = true;
    setHistory([]);
    api<{ events: StockEvent[] }>(`/api/vehicles/${dialog.vehicle.id}/history`, session.token)
      .then((data) => { if (active) setHistory(data.events); })
      .catch((cause) => { if (active) setDialogError((cause as Error).message); });
    return () => { active = false; };
  }, [dialog?.kind, dialog?.vehicle?.id, session?.token]);

  function open(kind: NonNullable<typeof dialog>['kind'], vehicle?: Vehicle) { setDialog({ kind, vehicle }); setDialogBusy(false); setDialogError(''); setReceipt(null); setRestockQuantity('1'); }
  function close() { setDialog(null); setDialogError(''); setReceipt(null); }
  function done(message: string) { close(); setNotice(message); setRefresh((value) => value + 1); }

  async function saveVehicle(input: VehicleInput) {
    if (!session || !dialog) return;
    setDialogBusy(true); setDialogError('');
    try {
      const editing = dialog.kind === 'edit' && dialog.vehicle;
      await api(editing ? `/api/vehicles/${dialog.vehicle!.id}` : '/api/vehicles', session.token, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(input) });
      done(editing ? 'Vehicle updated. The inventory is current.' : 'Vehicle added to the inventory.');
    } catch (cause) { setDialogError((cause as Error).message); }
    finally { setDialogBusy(false); }
  }

  async function actOnVehicle() {
    if (!session || !dialog?.vehicle) return;
    setDialogBusy(true); setDialogError('');
    const { vehicle, kind } = dialog;
    try {
      if (kind === 'purchase') {
        const result = await api<{ receipt: Receipt }>(`/api/vehicles/${vehicle.id}/purchase`, session.token, { method: 'POST' });
        setReceipt(result.receipt); setRefresh((value) => value + 1);
      } else if (kind === 'restock') {
        await api(`/api/vehicles/${vehicle.id}/restock`, session.token, { method: 'POST', body: JSON.stringify({ quantity: Number(restockQuantity) }) });
        done(`${vehicle.model} restocked. The new quantity is live.`);
      } else if (kind === 'delete') {
        await api(`/api/vehicles/${vehicle.id}`, session.token, { method: 'DELETE' });
        done(`${vehicle.model} removed from the active inventory.`);
      }
    } catch (cause) { setDialogError((cause as Error).message); setRefresh((value) => value + 1); }
    finally { setDialogBusy(false); }
  }

  if (!session) return <AuthPage onAuthenticated={authenticate} />;

  const isAdmin = session.user.role === 'admin';
  const units = allVehicles.reduce((sum, vehicle) => sum + vehicle.quantity, 0);
  const value = allVehicles.reduce((sum, vehicle) => sum + vehicle.price * vehicle.quantity, 0);
  const featuredVehicle = allVehicles.filter((vehicle) => vehicle.quantity > 0).sort((a, b) => a.price - b.price)[0];
  const lowStockVehicles = allVehicles.filter((vehicle) => vehicle.quantity <= 1);
  const hasFilters = Object.values(filters).some(Boolean);

  return <div className={`app-shell ${isAdmin ? 'admin-shell' : 'buyer-shell'}`}>
    <header className="site-header">
          <div className="header-inner flex items-center justify-between"><Logo light /><nav aria-label="Primary navigation"><span className="nav-active">{isAdmin ? 'Stock desk' : 'Showroom'}</span><span className="nav-divider" /><span className="user-chip"><span className="user-avatar">{session.user.name.charAt(0).toUpperCase()}</span><span className="user-text"><strong>{session.user.name}</strong><small>{isAdmin ? 'Inventory admin' : 'Buyer account'}</small></span></span><button className="logout-button" onClick={signOut}>Sign out ↗</button></nav></div>
    </header>

    <main>
      {isAdmin ? <section className="workspace-hero" aria-label="Stock overview">
        <div className="workspace-hero-inner">
          <div className="workspace-copy">
            <h1>Every car has<br />a story in stock.</h1>
            <p>Know what is ready to sell, what needs a restock, and how each count changed.</p>
            <a className="hero-link" href="#inventory">Work the inventory <span aria-hidden="true">↓</span></a>
          </div>
          <div className="workspace-scoreboard">
            <div className="scoreboard-top"><span>Live stock desk</span><span className="scoreboard-live"><i /> Current</span></div>
            <strong>{String(units).padStart(2, '0')}</strong>
            <p>units available across {allVehicles.length} vehicles</p>
            <dl><div><dt>Listed stock value</dt><dd>{rupees(value)}</dd></div><div><dt>Need attention</dt><dd>{lowStockVehicles.length} {lowStockVehicles.length === 1 ? 'vehicle' : 'vehicles'}</dd></div></dl>
          </div>
        </div>
      </section> : <section className="showroom-hero" aria-label="Showroom introduction">
        <div className="showroom-copy">
          <h1>Find a car that<br /><em>feels right.</em></h1>
          <p>Real availability, clear prices, and time to choose. Browse the collection before making your move.</p>
          <a className="hero-link" href="#inventory">Explore the collection <span aria-hidden="true">↓</span></a>
          <div className="showroom-facts"><span><strong>{allVehicles.length}</strong> vehicles listed</span><span><strong>{units}</strong> units available</span></div>
        </div>
        <div className="showroom-feature">
          {featuredVehicle ? <>
            <div className="feature-art"><VehicleArt vehicle={featuredVehicle} large /></div>
            <div className="feature-bottom"><div><span>Lowest in-stock price</span><h2>{featuredVehicle.make} {featuredVehicle.model}</h2><strong>{rupees(featuredVehicle.price)}</strong></div><button className="button button-primary" onClick={() => open('purchase', featuredVehicle)}>View purchase details <span aria-hidden="true">↗</span></button></div>
          </> : <div className="feature-empty"><h2>New arrivals ahead.</h2><p>There are no vehicles available to purchase right now. You can still browse the listed collection.</p></div>}
        </div>
      </section>}

      <section className="content-wrap" id="inventory">
        {isAdmin && lowStockVehicles.length > 0 && <section className="attention-section" aria-label="Vehicles needing attention"><div className="attention-intro"><h2>Restock queue</h2><p>Zero or one unit remaining. Take action before a buyer reaches an empty listing.</p></div><div className="attention-list">{lowStockVehicles.map((vehicle) => <div className="attention-item" key={vehicle.id}><span className="attention-quantity">{vehicle.quantity === 0 ? 'OUT' : '01'}</span><span><strong>{vehicle.make} {vehicle.model}</strong><small>{vehicle.quantity === 0 ? 'Out of stock' : 'Only one left'}</small></span><button onClick={() => open('restock', vehicle)} aria-label={`Restock ${vehicle.make} ${vehicle.model}`}>Restock <span aria-hidden="true">↗</span></button></div>)}</div></section>}
        <div className="inventory-heading"><div><h2>{isAdmin ? 'Inventory records' : 'The collection'}<span className="heading-count">{vehicles.length}</span></h2><p>{isAdmin ? 'Search, correct, and trace every vehicle in one place.' : 'Browse what is here, including vehicles currently sold out.'}</p></div>{isAdmin && <button className="button button-primary add-button" onClick={() => open('add')}>+ Add vehicle</button>}</div>
        <div className="filters" aria-label="Vehicle filters">
          <label>MAKE<input value={filters.make} onChange={(event) => setFilters({ ...filters, make: event.target.value })} placeholder="Search make" /></label>
          <label>MODEL<input value={filters.model} onChange={(event) => setFilters({ ...filters, model: event.target.value })} placeholder="Search model" /></label>
          <label>CATEGORY<input value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} placeholder="Any category" /></label>
          <label>MIN PRICE ₹<input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })} placeholder="No minimum" /></label>
          <label>MAX PRICE ₹<input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} placeholder="No maximum" /></label>
          {hasFilters && <button className="clear-button" onClick={() => setFilters(emptyFilters)}>Clear filters ×</button>}
        </div>
        <div className="result-line" aria-live="polite"><span>{loading ? 'Updating inventory…' : `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'} in view`}</span><span>{hasFilters ? 'FILTERED VIEW' : 'ALL VEHICLES'}</span></div>
        {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
        {vehicles.length === 0 && !loading ? <div className="empty-state"><span className="empty-icon">↗</span><h3>{hasFilters ? 'No matches on this route.' : 'The showroom is being prepared.'}</h3><p>{hasFilters ? 'Try a wider search or clear the filters to see the full selection.' : 'Check back soon, or ask an inventory admin to add the first vehicle.'}</p>{hasFilters && <button className="button button-outline" onClick={() => setFilters(emptyFilters)}>Clear filters</button>}</div> : isAdmin ? <div className="inventory-table"><div className="inventory-table-head" aria-hidden="true"><span>Vehicle</span><span>Category</span><span>Availability</span><span>Listed price</span><span>Actions</span></div><div className="inventory-rows">{vehicles.map((vehicle) => <article className="inventory-row" key={vehicle.id}>
          <div className="inventory-row-name"><span className="row-monogram" aria-hidden="true">{vehicle.make.charAt(0)}</span><div><h3>{vehicle.make} {vehicle.model}</h3><small>Updated {new Date(vehicle.updatedAt).toLocaleDateString('en-IN')}</small></div></div>
          <span className="inventory-row-category">{vehicle.category}</span>
          <span className={`inventory-row-stock ${vehicle.quantity === 0 ? 'is-empty' : vehicle.quantity === 1 ? 'is-low' : ''}`}><strong>{String(vehicle.quantity).padStart(2, '0')}</strong><small>{vehicle.quantity === 0 ? 'Out of stock' : vehicle.quantity === 1 ? 'One left' : 'In stock'}</small></span>
          <strong className="inventory-row-price">{rupees(vehicle.price)}</strong>
          <div className="inventory-row-actions"><button className="button button-primary" onClick={() => open('restock', vehicle)} aria-label={`Restock ${vehicle.make} ${vehicle.model}`}>Restock</button><button className="button button-outline" onClick={() => open('edit', vehicle)} aria-label={`Edit ${vehicle.make} ${vehicle.model}`}>Edit</button><button className="row-text-action" onClick={() => open('history', vehicle)} aria-label={`Stock history for ${vehicle.make} ${vehicle.model}`}>History</button><button className="row-text-action row-delete" onClick={() => open('delete', vehicle)} aria-label={`Remove ${vehicle.make} ${vehicle.model}`}>Remove</button></div>
        </article>)}</div></div> : <div className="vehicle-grid grid">{vehicles.map((vehicle) => <article className="vehicle-card" key={vehicle.id}>
          <div className="card-art-wrap"><VehicleArt vehicle={vehicle} /></div>
          <div className="card-body"><div className="card-meta"><span>{vehicle.category.toUpperCase()}</span><span className={`stock-pill ${vehicle.quantity === 0 ? 'sold-out' : vehicle.quantity === 1 ? 'low-stock' : ''}`}>{vehicle.quantity === 0 ? 'OUT OF STOCK' : vehicle.quantity === 1 ? 'ONLY 1 LEFT' : `${vehicle.quantity} IN STOCK`}</span></div><h3>{vehicle.make} <span>{vehicle.model}</span></h3><div className="card-price"><span>LISTED PRICE</span><strong>{rupees(vehicle.price)}</strong></div><div className="card-actions"><button className="button button-primary purchase-button" disabled={vehicle.quantity === 0} onClick={() => open('purchase', vehicle)}>{vehicle.quantity === 0 ? 'Unavailable' : 'Purchase'} <span aria-hidden="true">↗</span></button></div></div>
        </article>)}</div>}
      </section>
    </main>
    <footer className="site-footer"><Logo light /><span>Clarity in every choice. Care in every detail.</span><small>DRIVEWELL © {new Date().getFullYear()}</small></footer>

    {dialog && <Modal title={dialog.kind === 'add' ? 'Add a vehicle' : dialog.kind === 'edit' ? 'Edit vehicle' : dialog.kind === 'purchase' ? receipt ? 'Purchase confirmed' : 'Confirm purchase' : dialog.kind === 'restock' ? 'Restock vehicle' : dialog.kind === 'history' ? 'Stock history' : 'Remove vehicle'} subtitle={dialog.vehicle ? `${dialog.vehicle.make} ${dialog.vehicle.model}` : 'A new addition to the collection'} onClose={close}>
      {(dialog.kind === 'add' || dialog.kind === 'edit') && <VehicleForm key={dialog.vehicle?.id ?? 'new'} initial={dialog.vehicle} busy={dialogBusy} error={dialogError} onSave={saveVehicle} onClose={close} />}
      {dialog.kind === 'purchase' && dialog.vehicle && (receipt ? <div className="dialog-content"><div className="success-emblem">✓</div><p className="dialog-lead">Your purchase is recorded.</p><p>Receipt <strong>#{receipt.id.slice(0, 8).toUpperCase()}</strong> · {rupees(receipt.price)} · {new Date(receipt.purchasedAt).toLocaleString('en-IN')}</p><p>{receipt.remainingQuantity} {receipt.remainingQuantity === 1 ? 'unit remains' : 'units remain'} in stock. No payment is collected in this demo.</p><div className="modal-actions"><button className="button button-primary" onClick={close}>Back to inventory ↗</button></div></div> : <div className="dialog-content"><VehicleArt vehicle={dialog.vehicle} large /><p className="dialog-lead">Ready to make it yours?</p><p>One unit of {dialog.vehicle.make} {dialog.vehicle.model} will be removed from available stock at a listed price of <strong>{rupees(dialog.vehicle.price)}</strong>.</p><p className="form-hint">Stock is checked again when you confirm. No payment is collected in this demo.</p>{dialogError && <p className="form-error" role="alert">{dialogError}</p>}<div className="modal-actions"><button className="button button-quiet" onClick={close}>Not now</button><button className="button button-primary" disabled={dialogBusy} onClick={actOnVehicle}>{dialogBusy ? 'Checking stock…' : 'Confirm purchase'} ↗</button></div></div>)}
      {dialog.kind === 'restock' && dialog.vehicle && <div className="dialog-content"><p className="dialog-lead">Current stock: {dialog.vehicle.quantity} {dialog.vehicle.quantity === 1 ? 'unit' : 'units'}</p><label className="dialog-field">Units to add<input type="number" min="1" max="10000" step="1" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} /></label><p className="form-hint">This change is recorded in the stock history.</p>{dialogError && <p className="form-error" role="alert">{dialogError}</p>}<div className="modal-actions"><button className="button button-quiet" onClick={close}>Cancel</button><button className="button button-primary" disabled={dialogBusy} onClick={actOnVehicle}>{dialogBusy ? 'Updating…' : 'Add stock'} ↗</button></div></div>}
      {dialog.kind === 'delete' && dialog.vehicle && <div className="dialog-content"><p className="dialog-lead">Remove this vehicle from the active inventory?</p><p>Customers will no longer see {dialog.vehicle.make} {dialog.vehicle.model}. Its stock history stays in the database.</p>{dialogError && <p className="form-error" role="alert">{dialogError}</p>}<div className="modal-actions"><button className="button button-quiet" onClick={close}>Keep vehicle</button><button className="button button-danger" disabled={dialogBusy} onClick={actOnVehicle}>{dialogBusy ? 'Removing…' : 'Remove vehicle'}</button></div></div>}
      {dialog.kind === 'history' && <div className="dialog-content">{dialogError && <p className="form-error" role="alert">{dialogError}</p>}{history.length === 0 ? <p className="muted">Loading stock activity…</p> : <ol className="history-list">{history.map((item) => <li key={item.id}><span className={`history-symbol ${item.delta < 0 ? 'negative' : ''}`}>{item.delta < 0 ? '−' : '+'}</span><div><strong>{item.type === 'initial' ? 'Opening stock' : item.type === 'adjustment' ? 'Stock adjustment' : item.type === 'restock' ? 'Restocked' : 'Purchased'}</strong><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></div><span className="history-delta">{item.delta > 0 ? '+' : ''}{item.delta} <small>→ {item.quantityAfter}</small></span></li>)}</ol>}<div className="modal-actions"><button className="button button-primary" onClick={close}>Done</button></div></div>}
    </Modal>}
  </div>;
}

export default App;
