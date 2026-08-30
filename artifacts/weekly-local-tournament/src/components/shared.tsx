import { useState, type ReactNode, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';
import { ArrowRight, Bell, CalendarDays, ChevronDown, Gamepad2, LayoutGrid, Menu, ShieldCheck, Trophy, X, Zap, Instagram, MessageCircle } from 'lucide-react';

export const gameColors: Record<string, string> = {
  bgmi: '#f06443',
  'free-fire': '#c1e84b',
};

export function initials(value: string) {
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-lg' };
  return src ? (
    <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-background`} data-testid={`img-avatar-${name}`} />
  ) : (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-accent ring-2 ring-background`} data-testid={`img-avatar-${name}`}>
      {initials(name)}
    </div>
  );
}

export function GameMark({ slug, name, size = 'md' }: { slug?: string; name: string; size?: 'sm' | 'md' }) {
  const color = gameColors[slug ?? ''] ?? '#ff7655';
  return (
    <span className={`${size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-11 w-11 text-xs'} flex shrink-0 items-center justify-center rounded-xl font-display font-bold text-[#151b22]`} style={{ backgroundColor: color }} aria-label={name} data-testid={`game-mark-${slug ?? name}`}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function StatusPill({ value }: { value: string }) {
  const label = value.replaceAll('_', ' ');
  const hot = ['FILLING FAST', 'STARTING SOON', 'LIVE'].includes(label);
  const good = ['OPEN', 'REGISTERED', 'CONFIRMED', 'ACTIVE'].includes(label);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-[.08em] ${hot ? 'bg-[#ffdfd7] text-[#d74424]' : good ? 'bg-[#e9f7ae] text-[#466000]' : 'bg-muted text-muted-foreground'}`} data-testid={`status-${value.toLowerCase()}`}>
      {(hot || value === 'LIVE') && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-bold tracking-[-.045em] text-foreground md:text-4xl" data-testid={`heading-${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</h2>
        {copy && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copy}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', onClick, type = 'button', disabled, testId }: { children: ReactNode; variant?: 'primary' | 'dark' | 'ghost' | 'lime'; className?: string; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; testId?: string }) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:bg-[#e84b2d]',
    dark: 'bg-secondary text-secondary-foreground hover:bg-[#252f3b]',
    ghost: 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
    lime: 'bg-accent text-accent-foreground hover:bg-[#c8ef3b]',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} data-testid={testId}>
    {children}
  </button>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function ErrorState({ onRetry, compact = false }: { onRetry?: () => void; compact?: boolean }) {
  return <div className={`rounded-2xl border border-[#f0b8ab] bg-[#fff0eb] text-center ${compact ? 'p-5' : 'p-10'}`} data-testid="status-error">
    <p className="font-display font-bold text-[#a33721]">Signal lost</p>
    <p className="mt-1 text-sm text-[#a33721]/75">We could not load this arena right now.</p>
    {onRetry && <Button variant="ghost" className="mt-4 border-[#e6a18f] text-[#a33721]" onClick={onRetry} testId="button-retry">Try again</Button>}
  </div>;
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return <div className="page-grid rounded-2xl border border-dashed border-border bg-card p-12 text-center" data-testid="status-empty">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary"><Trophy size={22} /></div>
    <h3 className="font-display text-xl font-bold">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{copy}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>;
}

export function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setClickCount((prev) => prev + 1);
    
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => setClickCount(0), 2000); // reset if slow
  };

  useEffect(() => {
    if (clickCount >= 5) {
      setClickCount(0);
      setLocation('/admin/login');
    }
  }, [clickCount, setLocation]);

  const health = useHealthCheck({ query: { staleTime: 60000, queryKey: getHealthCheckQueryKey() } });
  const links = [
    { href: '#home', label: 'Home', icon: LayoutGrid },
    { href: '#tournaments', label: 'Tournaments', icon: Gamepad2 },
    { href: '#scorecards', label: 'Scorecards', icon: Trophy },
    { href: '#rules', label: 'Rule Book', icon: ShieldCheck },
  ];
  const isAuth = location === '/login' || location === '/register' || location === '/admin/login';
  if (isAuth) return <div className="noise min-h-[100dvh] bg-background">{children}</div>;
  return (
    <div className="noise min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-secondary px-5 py-6 text-secondary-foreground transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={(e) => {
            handleLogoClick(e);
            if (clickCount < 4) setOpen(false); 
          }} data-testid="link-logo">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-secondary"><Zap size={19} fill="currentColor" /></span>
            <span className="font-display text-lg font-bold tracking-[-.04em]">weekly<span className="text-primary">.</span></span>
          </Link>
          <button className="text-secondary-foreground/60 md:hidden" onClick={() => setOpen(false)} data-testid="button-close-menu"><X size={20} /></button>
        </div>
        <p className="mb-3 px-3 font-mono-ui text-[9px] font-bold uppercase tracking-[.2em] text-secondary-foreground/40">Playground</p>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            return <a key={href} href={href} onClick={(e) => {
              setOpen(false);
              if (location !== '/') {
                setLocation('/' + href);
              }
            }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors text-secondary-foreground/65 hover:bg-secondary-foreground/10 hover:text-secondary-foreground" data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </a>;
          })}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-4">
            <div className="mb-3 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-primary' : 'bg-accent'}`} /><span className="font-mono-ui text-[9px] font-bold uppercase tracking-[.14em] text-secondary-foreground/60">{health.isError ? 'Checking network' : 'Arena online'}</span></div>
            <p className="text-xs leading-relaxed text-secondary-foreground/50">Find your next local match. Show up. Lock in.</p>
          </div>

        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-secondary/50 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" data-testid="button-overlay-menu" />}
      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-3"><button className="md:hidden" onClick={() => setOpen(true)} data-testid="button-open-menu"><Menu size={22} /></button><p className="hidden font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground sm:block">{location === '/' ? 'Weekly local tournament' : location.replace('/', '').replaceAll('-', ' ')}</p></div>
          <div className="flex items-center gap-4">
            <button onClick={() => window.alert('You are all caught up.')} className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid="button-notifications"><Bell size={18} /></button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-72px)] flex flex-col">
          <div className="flex-1">{children}</div>
          
          <footer className="border-t border-border bg-card mt-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div className="max-w-[1280px] mx-auto px-5 py-12 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary shadow-[0_0_15px_hsla(var(--primary),0.5)]"><Zap size={20} fill="currentColor" /></span>
                <div>
                  <p className="font-display text-lg font-bold tracking-[-.04em] text-foreground">Nex<span className="text-primary">Arena</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Level up your competitive gaming</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <motion.a whileHover={{ scale: 1.05, y: -2 }} href="https://chat.whatsapp.com/CAbWCbIX1498JzRbjO22xQ?s=sw&p=a&ilr=1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366] hover:border-[#25D366] hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all">
                  <MessageCircle size={18} /> WhatsApp
                </motion.a>
                <motion.a whileHover={{ scale: 1.05, y: -2 }} href="https://www.instagram.com/official_nexarena?igsi=MXFkN2d1ajI5dGQwMg==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#E1306C]/10 border border-[#E1306C]/30 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-transparent hover:shadow-[0_0_20px_rgba(225,48,108,0.4)] transition-all">
                  <Instagram size={18} /> Instagram
                </motion.a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function TournamentCard({ tournament }: { tournament: any }) {
  return <Link href={`/tournaments/${tournament.id}`} className="shine lift group block overflow-hidden rounded-2xl border border-border bg-card" data-testid={`card-tournament-${tournament.id}`}>
    <div className="relative h-32 overflow-hidden p-5" style={{ background: `linear-gradient(120deg, ${tournament.accent || '#f06443'}, #1b232c)` }}>
      {tournament.banner && <img src={tournament.banner} alt={tournament.title} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />}
      <div className="absolute -right-4 -top-8 h-32 w-32 rounded-full border-[18px] border-white/10" /><div className="absolute -bottom-12 right-12 h-24 w-24 rounded-full border-[14px] border-white/10" />
      <div className="relative flex items-start justify-between"><GameMark slug={tournament.gameSlug} name={tournament.game} size="sm" /><StatusPill value={tournament.status} /></div>
      <p className="relative mt-5 font-mono-ui text-[9px] uppercase tracking-[.15em] text-white/65">{tournament.region} · {tournament.format}</p>
    </div>
    <div className="p-5">
      <h3 className="font-display text-lg font-bold leading-tight tracking-[-.025em] group-hover:text-primary">{tournament.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">by {tournament.organizer}</p>
      <div className="mt-5 flex items-end justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">Prize pool</p><p className="mt-1 font-display text-xl font-bold">{tournament.currency}{tournament.prizePool.toLocaleString()}</p></div><div className="text-right"><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">Spots</p><p className="mt-1 text-sm font-bold">{tournament.participants}<span className="font-normal text-muted-foreground">/{tournament.maxParticipants}</span></p></div></div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><CalendarDays size={14} />{tournament.date}</span><span className="flex items-center gap-1 text-xs font-bold text-primary">View match <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span></div>
    </div>
  </Link>;
}