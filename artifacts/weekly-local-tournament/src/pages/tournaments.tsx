import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Filter, Search, SlidersHorizontal, X, Megaphone } from 'lucide-react';
import { useListGames, useListTournaments } from '@workspace/api-client-react';
import { Button, EmptyState, ErrorState, Skeleton, TournamentCard } from '@/components/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

export default function Tournaments() {
  const [location, setLocation] = useLocation();
  const initialGame = new URLSearchParams(location.split('?')[1] ?? '').get('game') ?? '';
  const [search, setSearch] = useState('');
  const [game, setGame] = useState(initialGame);
  const [entry, setEntry] = useState<'all' | 'free' | 'paid'>('all');
  const [status, setStatus] = useState('OPEN');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  
  const params = useMemo(() => ({ 
    ...(game ? { game } : {}), 
    ...(search ? { search } : {}), 
    entryType: entry, 
    ...(status ? { status } : {}) 
  }), [game, search, entry, status]);
  
  const gamesQuery = useListGames();
  const tournamentsQuery = useListTournaments(params);
  const tournaments = tournamentsQuery.data ?? [];

  const { data: announcements = [] } = useQuery({
    queryKey: ['publicAnnouncements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      return res.json();
    }
  });
  
  const clearFilters = () => { 
    setSearch(''); 
    setGame(''); 
    setEntry('all'); 
    setStatus('OPEN'); 
    setLocation('/tournaments'); 
  };
  
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 md:py-14 relative z-10">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px]" />
      </div>

      {announcements.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-2xl bg-black/40 border border-primary/30 p-4 relative"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <div className="flex items-start gap-4">
            <Megaphone size={24} className="text-primary mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">{announcements[0].title}</h3>
              <p className="text-sm text-muted-foreground">{announcements[0].content}</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-primary text-glow">Tournament marketplace</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold tracking-[-.04em] md:text-7xl text-white">
          Pick a bracket.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Make it yours.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Local-feeling lobbies, clear rules, and hosts who run a tight game. Filter by your game, format, and how much skin you want in it.
        </p>
      </motion.div>
      
      {/* Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-12 flex flex-col gap-3 rounded-2xl border border-white/10 glass-card bg-black/40 p-3 md:flex-row md:items-center shadow-xl"
      >
        <div className="flex flex-1 items-center gap-3 px-3">
          <Search size={20} className="text-muted-foreground" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search tournaments, hosts, regions..." 
            className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground/65" 
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="hidden h-8 w-px bg-white/10 md:block" />
        
        <button onClick={() => setFiltersOpen((v) => !v)} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors px-4 py-3 text-sm font-bold text-white md:hidden">
          <span className="flex items-center gap-2"><SlidersHorizontal size={16} /> Filters</span>
          <span className="font-mono-ui text-[10px] text-primary">{[game, entry !== 'all' ? entry : '', status !== 'OPEN' ? status : ''].filter(Boolean).length} active</span>
        </button>
        
        <div className={`${filtersOpen ? 'flex' : 'hidden'} flex-col gap-2 md:flex md:flex-row w-full md:w-auto`}>
          <select value={game} onChange={(e) => setGame(e.target.value)} className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary cursor-pointer hover:bg-black/80 transition-colors appearance-none">
            <option value="">All games</option>
            {(gamesQuery.data ?? []).map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}
          </select>
          <select value={entry} onChange={(e) => setEntry(e.target.value as 'all' | 'free' | 'paid')} className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary cursor-pointer hover:bg-black/80 transition-colors appearance-none">
            <option value="all">Any entry</option>
            <option value="free">Free entry</option>
            <option value="paid">Paid entry</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary cursor-pointer hover:bg-black/80 transition-colors appearance-none">
            <option value="OPEN">Open now</option>
            <option value="">All statuses</option>
            <option value="FILLING_FAST">Filling fast</option>
            <option value="STARTING_SOON">Starting soon</option>
          </select>
          <Button variant="ghost" className="px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10" onClick={clearFilters}>
            <Filter size={16} className="mr-2" /> Reset
          </Button>
        </div>
      </motion.div>
      
      <div className="mt-12 flex items-center justify-between border-b border-white/10 pb-4">
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">
          {tournaments.length} matches found
        </p>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span className="h-2 w-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_hsla(var(--color-secondary),0.8)]" /> 
          Live updates active
        </div>
      </div>
      
      {/* Grid */}
      <div className="mt-8">
        {tournamentsQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[400px] bg-white/5 rounded-2xl" />)}
          </div>
        ) : tournamentsQuery.isError ? (
          <ErrorState onRetry={() => tournamentsQuery.refetch()} />
        ) : tournaments.length ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {tournaments.map((tournament, i) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TournamentCard tournament={tournament} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState 
            title="No matches in this lane" 
            copy="Try widening your filters. The next good lobby may be one click away." 
            action={<Button onClick={clearFilters} className="bg-primary hover:bg-primary/90 text-white border-none shadow-[0_0_15px_hsla(var(--primary),0.3)]">Clear filters</Button>} 
          />
        )}
      </div>
      
      <div className="mt-20 border-t border-white/10 pt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors">
          ← Back to discovery
        </Link>
      </div>
    </div>
  );
}