import { useMemo, useState } from 'react';
import { ArrowRight, Crosshair, MapPin, Radio, ShieldCheck, Sparkles, Users, Zap, Trophy, Gamepad2, TrendingUp, Megaphone, CheckCircle } from 'lucide-react';
import { useListGames, useListTournaments } from '@workspace/api-client-react';
import { Button, ErrorState, GameMark, SectionHeading, Skeleton, TournamentCard } from '@/components/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

export default function Home() {
  const gamesQuery = useListGames();
  const openTournamentsQuery = useListTournaments({ status: 'OPEN' });
  const completedTournamentsQuery = useListTournaments({ status: 'COMPLETED' });
  
  const games = Array.isArray(gamesQuery.data) ? gamesQuery.data : [];
  const openTournaments = Array.isArray(openTournamentsQuery.data) ? openTournamentsQuery.data : [];
  const completedTournaments = Array.isArray(completedTournamentsQuery.data) ? completedTournamentsQuery.data : [];
  
  // Filter games strictly to BGMI and Free Fire
  const activeGames = useMemo(() => games.filter((game) => game.slug === 'bgmi' || game.slug === 'free-fire'), [games]);

  const { data = [] } = useQuery({
    queryKey: ['publicAnnouncements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      return res.json();
    }
  });
  
  const announcements = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-hidden bg-background scroll-smooth">
      
      {/* HERO SECTION */}
      <section id="home" className="relative min-h-[90vh] flex items-center justify-center border-b border-border px-5 pb-16 pt-24 md:px-10">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute inset-0 noise" />
        
        <div className="mx-auto grid max-w-[1280px] w-full items-center gap-12 lg:grid-cols-[1fr_1fr] relative z-10">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-mono-ui text-xs font-bold uppercase tracking-widest text-primary glow-border">
              <span className="pulse-dot h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
              The Arena is Live
            </motion.div>
            
            <h1 className="max-w-3xl font-display text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-[1.1] tracking-[-.04em] text-foreground">
              PLAY. <br/>
              COMPETE. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">CONQUER.</span>
            </h1>
            
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              India's premium competitive gaming arena for BGMI & Free Fire squads. Prove your skills and earn rewards.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#tournaments" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_hsla(var(--primary),0.6)]">
                Explore Tournaments <ArrowRight size={20} />
              </a>
              <a href="#rules" className="inline-flex items-center gap-2 rounded-lg border border-border glass px-8 py-4 text-base font-bold transition-all hover:border-primary hover:text-primary hover:bg-primary/5">
                Read the Rule Book
              </a>
            </div>
          </motion.div>

          {/* Floating UI Elements */}
          <motion.div className="relative hidden lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <motion.div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[500px] glass-card rounded-2xl p-6 glow-border z-20" animate={{ y: [0, -20, 0], rotateX: [0, 5, 0], rotateY: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <span className="text-xs font-mono-ui text-muted-foreground">LIVE TOURNAMENT</span>
                <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-bold">BGMI</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-6">NEXARENA WEEKEND CUP</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase">Prize Pool</p>
                  <p className="font-bold text-lg text-secondary text-glow-cyan">₹10,000</p>
                </div>
                <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase">Entry</p>
                  <p className="font-bold text-lg">₹50</p>
                </div>
              </div>
              <a href="#tournaments" className="w-full bg-primary/20 text-center py-3 rounded-lg text-primary font-bold animate-pulse-glow block hover:bg-primary/30 transition-colors">
                REGISTER NOW
              </a>
            </motion.div>
            <motion.div className="absolute right-[-50px] top-[-50px] w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
            <motion.div className="absolute right-[200px] bottom-[-100px] w-80 h-80 bg-secondary/20 rounded-full blur-[120px] -z-10" animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 6, repeat: Infinity }} />
          </motion.div>
        </div>
      </section>

      {/* TOURNAMENTS SECTION */}
      <section id="tournaments" className="relative z-20 bg-card/50 border-y border-white/5 backdrop-blur-xl px-5 py-24 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          
          {announcements.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 overflow-hidden rounded-2xl bg-black/40 border border-primary/30 p-4 relative">
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

          <SectionHeading eyebrow="MARKETPLACE" title="Active Tournaments" copy="Local-feeling lobbies, clear rules, and verified hosts. Lock in your squad." />
          
          <div className="mt-8">
            {openTournamentsQuery.isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[400px] w-full" />)}
              </div>
            ) : openTournamentsQuery.isError ? (
              <ErrorState onRetry={() => openTournamentsQuery.refetch()} />
            ) : openTournaments.length === 0 ? (
              <EmptyState title="No active tournaments" copy="Check back later for new matches." />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {openTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SCORECARDS SECTION */}
      <section id="scorecards" className="px-5 py-24 md:px-10 relative">
        <div className="max-w-[1280px] mx-auto">
          <SectionHeading eyebrow="HALL OF FAME" title="Recent Scorecards" copy="Check out the results from our latest completed tournaments." />
          
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {completedTournamentsQuery.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : completedTournaments.length === 0 ? (
              <div className="col-span-full">
                <EmptyState title="No finished matches yet" copy="Once a tournament concludes, the final scorecard will appear here." />
              </div>
            ) : (
              completedTournaments.map((tournament) => (
                <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                  <motion.div whileHover={{ scale: 1.02 }} className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden group cursor-pointer block">
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-white group-hover:text-secondary transition-colors">{tournament.title}</h3>
                        <p className="text-xs text-muted-foreground uppercase mt-1">{tournament.game} • {tournament.date}</p>
                      </div>
                      <div className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-2">
                        <CheckCircle size={14} className="text-secondary" /> Completed
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 font-bold group-hover:text-white transition-colors">
                      View Full Scorecard & Winners <ArrowRight size={16} />
                    </p>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* RULE BOOK SECTION */}
      <section id="rules" className="bg-black/40 py-24 px-5 md:px-10 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="max-w-[1000px] mx-auto text-center relative z-10">
          <SectionHeading eyebrow="REGULATIONS" title="Official Rule Book" />
          
          <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass p-8 rounded-2xl border border-primary/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3"><ShieldCheck className="text-primary" /> General Rules</h3>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Emulators are strictly prohibited. Only mobile devices are allowed.</li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Any use of hacks, scripts, or third-party modifications will result in a permanent ban.</li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Teaming up with other squads is not allowed and will lead to immediate disqualification.</li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Respect all admins and players. Toxicity or abuse will not be tolerated.</li>
              </ul>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="glass p-8 rounded-2xl border border-secondary/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3"><Gamepad2 className="text-secondary" /> Room & Match Details</h3>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" /> Room ID & Password will be shared on the tournament page 15 minutes before start time.</li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" /> Sit in your assigned slots only. Admins will kick players in wrong slots.</li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" /> Match starts exactly on time. Late entries will not be entertained or refunded.</li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" /> Prize money will be distributed within 24 hours of match completion.</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32 px-5 md:px-10 overflow-hidden flex items-center justify-center text-center border-t border-white/10">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] -z-10 pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative z-10 max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 text-glow">YOUR NEXT MATCH STARTS HERE.</h2>
          <p className="text-xl text-muted-foreground mb-10">Don't just play the game. Dominate the arena.</p>
          <a href="#tournaments" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all hover:scale-105">
            FIND A BRACKET
          </a>
        </motion.div>
      </section>

    </div>
  );
}