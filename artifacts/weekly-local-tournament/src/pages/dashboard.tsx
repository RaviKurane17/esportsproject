import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight, CalendarDays, Check, ChevronRight, Copy, KeyRound, Medal, Radio, Trophy } from 'lucide-react';
import { useGetDashboardSummary, useGetDashboardTournaments } from '@workspace/api-client-react';
import { Avatar, Button, EmptyState, ErrorState, GameMark, SectionHeading, Skeleton, StatusPill } from '@/components/shared';
import { motion } from 'framer-motion';

function copyText(value: string) {
  void navigator.clipboard?.writeText(value);
}

export default function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const tournamentsQuery = useGetDashboardTournaments();
  
  const summary = summaryQuery.data;
  const tournaments = tournamentsQuery.data ?? [];
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const visible = tournaments.filter((item) => tab === 'upcoming' ? !['COMPLETED', 'CANCELLED'].includes(item.status) : ['COMPLETED'].includes(item.status));
  
  if (summaryQuery.isLoading || tournamentsQuery.isLoading) return <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-10"><Skeleton className="h-44 bg-white/5" /><div className="mt-6 grid gap-5 md:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 bg-white/5" />)}</div></div>;
  if (summaryQuery.isError || tournamentsQuery.isError || !summary) return <div className="mx-auto max-w-[760px] px-5 py-20"><ErrorState onRetry={() => { void summaryQuery.refetch(); void tournamentsQuery.refetch(); }} /></div>;
  
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 md:py-14">
      
      {/* Welcome Banner */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-7 text-foreground md:p-10 shadow-2xl"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[2px] border-primary/20 bg-primary/5 blur-xl" />
        
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-secondary text-glow-cyan">Player Dashboard</p>
            <div className="mt-6 flex items-center gap-5">
              <div className="rounded-2xl border border-primary/30 p-1 bg-black/50">
                <Avatar name={summary.playerName} src={summary.avatar} size="lg" />
              </div>
              <div>
                <h1 className="font-display text-4xl font-extrabold tracking-[-.04em] md:text-5xl text-glow">Hey, {summary.playerName.split(' ')[0]}.</h1>
                <p className="mt-2 font-mono-ui text-sm text-primary uppercase tracking-widest">{summary.gamerTag}</p>
              </div>
            </div>
          </div>
          <Link href="/tournaments" className="flex items-center gap-2 text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl transition-all">
            Find Another Match <ArrowRight size={16} className="text-primary" />
          </Link>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat label="Upcoming" value={summary.upcomingCount} icon={<CalendarDays size={18} />} />
        <Stat label="Live now" value={summary.liveCount} icon={<Radio size={18} />} accent />
        <Stat label="Completed" value={summary.completedCount} icon={<Check size={18} />} />
        <Stat label="Total points" value={summary.totalPoints} icon={<Trophy size={18} />} accent />
      </motion.section>

      {/* Next Match Highlight */}
      {summary.nextMatch && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <SectionHeading eyebrow="MATCH CENTER" title="Your next lock-in" />
          <div className="glass-card flex flex-col justify-between gap-6 rounded-2xl p-6 md:flex-row md:items-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_hsla(var(--primary),0.3)]">
                <Radio size={24} className="animate-pulse" />
              </div>
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">{summary.nextMatch.status}</p>
                <h3 className="mt-1 font-display text-2xl font-bold">{summary.nextMatch.tournamentTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{summary.nextMatch.date} · {summary.nextMatch.time}</p>
              </div>
            </div>
            <Button className="relative z-10 bg-white/10 hover:bg-white/20 border-white/20" onClick={() => window.alert('Match room details appear after check-in opens.')}>
              Open match center <ArrowRight size={15} />
            </Button>
          </div>
        </motion.section>
      )}

      {/* Registered Tournaments List */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16"
      >
        <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-6">
          <SectionHeading eyebrow="YOUR BRACKETS" title="Registered tournaments" />
          <div className="flex rounded-xl bg-black/40 p-1 border border-white/5">
            <button onClick={() => setTab('upcoming')} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${tab === 'upcoming' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white'}`}>Upcoming</button>
            <button onClick={() => setTab('completed')} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${tab === 'completed' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white'}`}>Results</button>
          </div>
        </div>
        
        {visible.length ? (
          <div className="space-y-3">
            {visible.map((item, i) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <GameMark name={item.game} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate font-display text-lg font-bold">{item.title}</h3>
                    <StatusPill value={item.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-secondary" />{item.date} · {item.time}</span>
                    <span className="font-mono-ui text-[10px] tracking-widest text-primary/70">ID: {item.registrationId}</span>
                  </div>
                </div>
                {item.roomDetails ? (
                  <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-primary/30 px-4 py-2 text-xs">
                    <KeyRound size={14} className="text-primary" />
                    <span className="font-mono-ui tracking-wider text-white">ROOM {item.roomDetails.roomId}</span>
                    <button onClick={(e) => { e.preventDefault(); copyText(item.roomDetails?.password ?? ''); }} className="ml-2 text-muted-foreground hover:text-primary transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">{item.checkIn}</p>
                )}
                <Link href={`/tournaments/${item.tournamentId}`} className="rounded-xl p-2 text-muted-foreground group-hover:text-primary transition-colors">
                  <ChevronRight size={20} />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title={tab === 'upcoming' ? 'Your arena is open' : 'No results yet'} 
            copy={tab === 'upcoming' ? 'Find a bracket and make this week competitive.' : 'Finish a tournament to see your results here.'} 
            action={tab === 'upcoming' ? <Link href="/tournaments" className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:scale-105 transition-transform">Find a match</Link> : undefined} 
          />
        )}
      </motion.section>

      {/* Footer Profile Cards */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-14 grid gap-5 md:grid-cols-2"
      >
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Player profile</p>
            <Link href="/leaderboard" className="text-primary hover:text-white transition-colors"><ArrowRight size={20} /></Link>
          </div>
          <div className="mt-6 flex items-center gap-4 relative z-10">
            <div className="p-1 rounded-2xl border border-white/10 bg-black/40">
              <Avatar name={summary.playerName} src={summary.avatar} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-glow">{summary.gamerTag}</p>
              <p className="text-xs text-muted-foreground">Ranked across active games</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <Medal size={20} className="text-secondary" />
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-secondary text-glow-cyan">Keep the streak alive</p>
          </div>
          <p className="mt-5 max-w-sm font-display text-2xl font-bold leading-tight relative z-10 text-white">
            One more strong finish and you are in the local top 100.
          </p>
          <Link href="/leaderboard" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-white transition-colors relative z-10">
            See your position <ArrowRight size={16} />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

function Stat({ label, value, icon, accent = false }: { label: string; value: number; icon: ReactNode; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors`}>
      {accent && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />}
      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/40 ${accent ? 'text-primary' : 'text-muted-foreground group-hover:text-white'} transition-colors`}>
        {icon}
      </div>
      <p className="relative z-10 mt-6 font-display text-4xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="relative z-10 mt-1 text-sm text-muted-foreground font-mono-ui uppercase tracking-wider">{label}</p>
    </div>
  );
}