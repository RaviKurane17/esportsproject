import { useMemo, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Crosshair, MapPin, Radio, ShieldCheck, Sparkles, Users, Zap, Trophy, Gamepad2, TrendingUp } from 'lucide-react';
import { useListGames, useListTournaments } from '@workspace/api-client-react';
import { Button, ErrorState, GameMark, SectionHeading, Skeleton, TournamentCard } from '@/components/shared';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Home() {
  const gamesQuery = useListGames();
  const tournamentsQuery = useListTournaments({ status: 'OPEN' });
  const games = gamesQuery.data ?? [];
  const tournaments = tournamentsQuery.data ?? [];
  const activeGames = useMemo(() => games.filter((game) => game.status === 'ACTIVE'), [games]);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  return (
    <div className="overflow-hidden bg-background">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center border-b border-border px-5 pb-16 pt-24 md:px-10">
        
        {/* Animated Background Grid & Particles */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute inset-0 noise" />
        
        <div className="mx-auto grid max-w-[1280px] w-full items-center gap-12 lg:grid-cols-[1fr_1fr] relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-mono-ui text-xs font-bold uppercase tracking-widest text-primary glow-border"
            >
              <span className="pulse-dot h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
              The Arena is Live
            </motion.div>
            
            <h1 className="max-w-3xl font-display text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-[1.1] tracking-[-.04em] text-foreground">
              PLAY. <br/>
              COMPETE. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">CONQUER.</span>
            </h1>
            
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              India's premium competitive gaming arena for players, squads, and tournament organizers.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_hsla(var(--primary),0.6)]">
                Explore Tournaments <ArrowRight size={20} />
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-lg border border-border glass px-8 py-4 text-base font-bold transition-all hover:border-primary hover:text-primary hover:bg-primary/5">
                Join the Arena
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="relative hidden lg:block"
            style={{ y }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Emulated 3D Floating Elements */}
            <motion.div 
              className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[500px] glass-card rounded-2xl p-6 glow-border z-20"
              animate={{ 
                y: [0, -20, 0],
                rotateX: [0, 5, 0],
                rotateY: [0, -5, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
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
              
              <div className="w-full bg-primary/20 text-center py-3 rounded-lg text-primary font-bold animate-pulse-glow">
                REGISTER NOW
              </div>
            </motion.div>

            {/* Background floating decor */}
            <motion.div 
              className="absolute right-[-50px] top-[-50px] w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute right-[200px] bottom-[-100px] w-80 h-80 bg-secondary/20 rounded-full blur-[120px] -z-10"
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </motion.div>

        </div>
      </section>

      {/* GAMES SECTION */}
      <section className="relative z-20 bg-card/50 border-y border-white/5 backdrop-blur-xl px-5 py-20 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <SectionHeading 
            eyebrow="CHOOSE YOUR BATTLEFIELD" 
            title="Supported Arenas" 
            copy="Compete in the most popular games." 
          />
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-12">
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-primary">
                      <Gamepad2 size={24} />
                    </div>
                    {game.status === 'ACTIVE' ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Live</span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/10 text-muted-foreground rounded-full">Coming Soon</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">{game.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{game.description}</p>
                  
                  {game.status === 'ACTIVE' && (
                    <Link href={`/tournaments?game=${game.slug}`} className="text-sm font-bold text-primary flex items-center gap-2 group-hover:gap-3 transition-all">
                      View Tournaments <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NEXARENA */}
      <section className="px-5 py-24 md:px-10 relative">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Build your competitive record.</h2>
            <p className="text-lg text-muted-foreground mb-8">NEXARENA is designed for serious players who want to prove their skills, climb the ranks, and earn rewards.</p>
            
            <div className="space-y-6">
              {[
                { icon: <Crosshair />, title: 'COMPETE', desc: 'Find tournaments that match your game and skill level.' },
                { icon: <Users />, title: 'CONNECT', desc: 'Build teams and compete with other players.' },
                { icon: <TrendingUp />, title: 'CLIMB', desc: 'Earn ranking points and climb the global leaderboard.' },
                { icon: <Trophy />, title: 'CONQUER', desc: 'Win prize pools and build your esports reputation.' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="mt-1 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative h-[600px] hidden md:block">
            {/* Visual Representation of Platform */}
            <motion.div 
              className="absolute inset-0 glass-card rounded-3xl border border-white/10 p-2 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="w-full h-full bg-black/60 rounded-2xl relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-grid opacity-30" />
                
                {/* Mock UI Elements */}
                <motion.div 
                  className="absolute top-10 left-10 w-64 glass p-4 rounded-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="h-4 w-24 bg-white/20 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded" />
                    <div className="h-2 w-4/5 bg-white/10 rounded" />
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute bottom-20 right-10 w-72 glass p-4 rounded-xl border-primary/50"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/40" />
                    <div className="h-3 w-20 bg-white/20 rounded" />
                  </div>
                  <div className="h-10 w-full bg-primary/20 rounded flex items-center justify-center text-primary text-xs font-bold">
                    MATCH WON
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE */}
      <section className="bg-black/40 py-24 px-5 md:px-10 border-t border-white/5">
        <div className="max-w-[1000px] mx-auto text-center">
          <SectionHeading eyebrow="HOW IT WORKS" title="Your Journey to the Top" />
          
          <div className="grid md:grid-cols-4 gap-8 mt-16 relative">
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
            
            {[
              { step: '01', title: 'CREATE ACCOUNT', desc: 'Sign up and link your game IDs.' },
              { step: '02', title: 'FIND MATCH', desc: 'Browse live tournaments for your game.' },
              { step: '03', title: 'REGISTER', desc: 'Pay entry fee or join free brackets.' },
              { step: '04', title: 'COMPETE', desc: 'Get room details and track results.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-black border-2 border-primary flex items-center justify-center font-display font-bold text-primary mb-6 shadow-[0_0_15px_hsla(var(--primary),0.5)]">
                  {item.step}
                </div>
                <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32 px-5 md:px-10 overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl"
        >
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 text-glow">YOUR NEXT MATCH STARTS HERE.</h2>
          <p className="text-xl text-muted-foreground mb-10">Don't just play the game. Dominate the arena.</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/tournaments" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all hover:scale-105">
              EXPLORE TOURNAMENTS
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg border border-border glass px-8 py-4 text-base font-bold transition-all hover:border-primary hover:text-primary hover:bg-primary/5">
              CREATE AN ACCOUNT
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}