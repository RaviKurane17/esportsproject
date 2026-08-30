import { useState, type FormEvent, useRef } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Clock3, FileText, LockKeyhole, MapPin, ShieldCheck, Users, X, Info, ChevronRight, UploadCloud, Loader2, Trophy, Ticket, Search, Key, ImageIcon, Eye } from 'lucide-react';
import { getGetTournamentQueryKey, useGetTournament, useRegisterForTournament, type RegistrationInput } from '@workspace/api-client-react';
import { Button, ErrorState, GameMark, Skeleton, StatusPill } from '@/components/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '@/lib/utils';
import { LeaderboardTable } from '@/components/shared/LeaderboardTable';
import { useQuery } from '@tanstack/react-query';

export default function TournamentDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetTournament(id, { query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) } });
  const register = useRegisterForTournament();
  
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment, 3 = Success
  const [isUploading, setIsUploading] = useState(false);
  
  const [done, setDone] = useState<{ registrationId: string; amount: number } | null>(null);
  
  const [form, setForm] = useState({ 
    teamName: '', 
    captainName: '', 
    inGameId: '', 
    email: '', 
    whatsapp: '', 
  });
  const [confirmations, setConfirmations] = useState<string[]>([]);
  
  // Payment Proof State
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Booking checker state
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const checkBooking = async () => {
    if (!bookingIdInput.trim()) return;
    setBookingLoading(true);
    setBookingError('');
    setBookingResult(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/booking/${bookingIdInput.replace('#', '')}`);
      if (!res.ok) {
        const err = await res.json();
        setBookingError(err.error || 'Booking not found');
        return;
      }
      setBookingResult(await res.json());
    } catch {
      setBookingError('Connection error. Try again.');
    } finally {
      setBookingLoading(false);
    }
  };
  
  const tournament = query.data as (typeof query.data & { resultImageUrl?: string | null; upiId?: string | null; paymentQrUrl?: string | null }) | undefined;
  
  const { data: results = [] } = useQuery({
    queryKey: ['tournamentResults', id],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${id}/results`);
      return res.json();
    },
    enabled: tournament?.status === 'COMPLETED'
  });
  
  const updateField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  
  const handleNextStep = (event: FormEvent) => {
    event.preventDefault();
    if (confirmations.length < 4) {
      window.alert("Please check all confirmation boxes.");
      return;
    }
    setStep(2);
  };

  const submitFinal = async (event: FormEvent) => {
    event.preventDefault();
    if (!tournament || !screenshotFile || !utrNumber) return;
    
    setIsUploading(true);
    try {
      // 1. Upload screenshot to ImgBB
      const screenshotUrl = await uploadImage(screenshotFile);
      
      // 2. Submit entire registration payload
      register.mutate(
        { 
          id, 
          data: { 
            ...form,
            screenshotUrl,
            utrNumber,
            confirmations,
            // Fallback empty strings for legacy fields to satisfy Zod if it expects them
            fullName: form.captainName,
            displayName: form.teamName || form.captainName,
            gameUid: form.inGameId,
            gameUsername: form.captainName,
            phone: form.whatsapp,
          } as any
        }, 
        { 
          onSuccess: (result) => { 
            setDone({ registrationId: result.id, amount: tournament.entryFee }); 
            setStep(3);
          },
          onError: () => {
            window.alert("Failed to submit registration. Please try again.");
          }
        }
      );
    } catch (err) {
      window.alert("Failed to upload screenshot. Please ensure it's a valid image under 5MB.");
    } finally {
      setIsUploading(false);
    }
  };
  
  if (query.isLoading) return <div className="mx-auto max-w-[1280px] px-5 py-14 md:px-10"><Skeleton className="h-[270px] bg-white/5 rounded-3xl" /><Skeleton className="mt-8 h-[500px] bg-white/5 rounded-3xl" /></div>;
  if (query.isError || !tournament) return <div className="mx-auto max-w-[760px] px-5 py-20"><ErrorState onRetry={() => query.refetch()} /></div>;
  
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-black/40 border-b border-white/10 px-5 py-10 text-foreground md:px-10 md:py-20 shadow-2xl">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-full opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 70% 30%, ${tournament.accent || 'hsla(var(--primary), 1)'}, transparent 60%)` }} />
        <div className="absolute left-[-10%] top-[-20%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-[1280px]">
          <Link href="/tournaments" className="mb-12 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={16} /> Marketplace
          </Link>
          
          <div className="flex flex-wrap items-start justify-between gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-4">
                <GameMark slug={tournament.gameSlug} name={tournament.game} size="md" />
                <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-primary">{tournament.game} · {tournament.format}</p>
              </div>
              <h1 className="mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[1.1] tracking-[-.04em] md:text-7xl text-glow">{tournament.title}</h1>
              <p className="mt-6 text-base text-muted-foreground">Hosted by <span className="font-bold text-white">{tournament.organizer}</span> · {tournament.region}</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <StatusPill value={tournament.status} />
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-16 grid max-w-4xl grid-cols-2 gap-5 border-t border-white/10 pt-8 sm:grid-cols-4"
          >
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-secondary text-glow-cyan">Prize pool</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{tournament.currency}{tournament.prizePool.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Entry (Per Squad)</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{tournament.entryType === 'FREE' ? 'Free' : `${tournament.currency}${tournament.entryFee}`}</p>
            </div>
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Players</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{tournament.participants}<span className="text-white/40">/{tournament.maxParticipants}</span></p>
            </div>
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Match day</p>
              <p className="mt-2 font-display text-xl font-bold text-white">{tournament.date}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 md:px-10 lg:grid-cols-[1fr_400px]">
        
        {/* Left Column: Details */}
        <div className="space-y-12">
          
          <div className="flex flex-wrap items-center gap-6 border-b border-white/10 pb-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10"><Clock3 size={16} className="text-primary" /> {tournament.time}</span>
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10"><MapPin size={16} className="text-secondary" /> {tournament.region}</span>
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10"><Users size={16} className="text-primary" /> {tournament.teamSize} player team</span>
          </div>

          {tournament.status === 'COMPLETED' && results.length > 0 && (
            <section className="bg-black/40 border border-primary/30 rounded-3xl p-4 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
              <h2 className="flex items-center justify-center gap-3 font-display text-2xl md:text-3xl font-bold text-white mb-6 md:mb-10 relative">
                <Trophy size={32} className="text-primary" /> Tournament Standings
              </h2>
              
              <LeaderboardTable results={results.map((r: any) => ({
                rank: r.rank,
                teamName: r.teamName,
                kills: r.kills,
                score: r.score,
                prizeMoney: r.prizeMoney
              }))} />
              
              {tournament.resultImageUrl && (
                <div className="mt-12 text-center border-t border-white/10 pt-8">
                  <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                    <ImageIcon size={16} className="text-secondary" /> Full Match Scorecard
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-white/10 max-w-3xl mx-auto shadow-2xl relative group">
                    <img src={tournament.resultImageUrl} alt="Tournament Full Scorecard" className="w-full h-auto object-contain bg-black/50" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <a href={tournament.resultImageUrl} target="_blank" rel="noreferrer" className="bg-primary text-white font-bold px-6 py-3 rounded-full pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2">
                        <Eye size={18} /> View Original Image
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
          
          <section>
            <h2 className="font-display text-3xl font-bold text-white mb-6">The brief</h2>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              Bring your best game to a clean, competitive lobby run by {tournament.organizer}. Check in before the room opens and keep your game UID handy for verification.
            </p>
          </section>
          
          <section className="border-t border-white/10 pt-12">
            <h2 className="font-display text-3xl font-bold text-white mb-8">How the day runs</h2>
            <div className="space-y-6">
              {tournament.schedule.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                  key={`${item.label}-${index}`} className="flex gap-6 group"
                >
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono-ui text-[12px] font-bold border transition-colors ${item.state === 'DONE' ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_hsla(var(--primary),0.3)]' : item.state === 'NEXT' ? 'bg-secondary/20 text-secondary border-secondary/50 shadow-[0_0_10px_hsla(var(--color-secondary),0.3)]' : 'bg-black/50 text-white/30 border-white/10'}`}>
                    {item.state === 'DONE' ? <Check size={18} /> : String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="glass flex-1 p-5 rounded-2xl group-hover:bg-white/10 transition-colors">
                    <p className="font-bold text-lg text-white">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
          
          <div className="grid gap-8 border-t border-white/10 pt-12 sm:grid-cols-2">
            <section className="glass p-6 rounded-2xl">
              <h2 className="flex items-center gap-3 font-display text-2xl font-bold text-white mb-6">
                <ShieldCheck size={24} className="text-primary" /> Eligibility
              </h2>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {tournament.eligibility.map((item) => (
                  <li key={item} className="flex gap-3 items-start"><Check size={18} className="mt-0.5 shrink-0 text-secondary" />{item}</li>
                ))}
              </ul>
            </section>
            
            <section className="glass p-6 rounded-2xl">
              <h2 className="flex items-center gap-3 font-display text-2xl font-bold text-white mb-6">
                <FileText size={24} className="text-primary" /> Rules
              </h2>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {tournament.rules.map((item) => (
                  <li key={item} className="flex gap-3 items-start"><span className="font-mono-ui text-[12px] text-primary/70">/</span>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-3xl border border-primary/30 bg-black/60 backdrop-blur-xl p-8 shadow-[0_0_30px_hsla(var(--primary),0.1)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-primary">Secure your slot</p>
            
            {tournament.status === 'COMPLETED' ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Trophy size={48} className="text-primary mb-4" />
                <p className="font-display text-2xl font-bold text-white mb-2">Tournament Completed</p>
                <p className="text-sm text-muted-foreground text-center">Registrations are closed and this tournament has ended.</p>
              </div>
            ) : (
              <>
                <div className="mt-6 flex items-end justify-between">
                  <p className="font-display text-5xl font-bold text-white">{tournament.entryType === 'FREE' ? '₹0' : `${tournament.currency}${tournament.entryFee}`}</p>
                  <p className="text-sm text-muted-foreground mb-1">per squad</p>
                </div>
                
                <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${Math.min((tournament.participants / tournament.maxParticipants) * 100, 100)}%` }} transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary relative"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                  </motion.div>
                </div>
                
                <div className="mt-3 flex justify-between text-xs font-bold text-muted-foreground">
                  <span className="text-white">{tournament.participants} registered</span>
                  <span>{tournament.maxParticipants - tournament.participants} left</span>
                </div>
                
                <Button 
                  className={`mt-8 w-full h-14 ${(tournament.registrationStatus as string) === 'FULL' ? 'bg-white/10 text-muted-foreground border border-white/10' : 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all hover:scale-[1.02]'} text-base`}
                  onClick={() => { setStep(1); setModal(true); }} 
                  disabled={tournament.registrationStatus !== 'AVAILABLE'}
                >
                  {(tournament.registrationStatus as string) === 'FULL' 
                    ? 'Registration Full' 
                    : `Register your ${tournament.format || 'Squad'}`}
                  {(tournament.registrationStatus as string) !== 'FULL' && <ArrowRight size={18} className="ml-2 inline-block" />}
                </Button>
                
                {(tournament.registrationStatus as string) === 'FULL' ? (
                  <p className="mt-6 text-center text-xs text-[#ff5c73] font-bold">
                    Registration is full. Wait for next tournament.
                  </p>
                ) : (
                  <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                    <LockKeyhole size={14} className="text-secondary" /> Registration closes {tournament.registrationDeadline}
                  </p>
                )}
              </>
            )}
          </div>
          
          <div className="mt-6 rounded-3xl border border-secondary/30 bg-secondary/10 p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
             <p className="flex items-center gap-3 font-bold text-white"><ShieldCheck size={20} className="text-secondary" /> Run by a verified host</p>
             <p className="mt-3 text-sm leading-relaxed text-white/60">Clear rules, visible room details, and a real match result after the final round.</p>
          </div>

          {/* Booking Checker Widget */}
          <div className="mt-6 rounded-3xl border border-primary/30 bg-black/60 backdrop-blur-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <p className="flex items-center gap-2 font-bold text-white mb-1 relative"><Ticket size={18} className="text-primary" /> Check Your Booking</p>
            <p className="text-xs text-muted-foreground mb-4 relative">Enter your Booking ID to see status & room details.</p>
            
            <div className="flex gap-2 relative mb-4">
              <input 
                value={bookingIdInput}
                onChange={e => setBookingIdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkBooking()}
                placeholder="e.g. 42"
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors"
              />
              <button 
                onClick={checkBooking}
                disabled={bookingLoading}
                className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {bookingLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>

            {bookingError && (
              <div className="relative bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-bold">
                {bookingError}
              </div>
            )}

            {bookingResult && (
              <div className="relative space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">{bookingResult.teamName}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                      bookingResult.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {bookingResult.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{bookingResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      
      {/* Registration Modal (Multi-step) */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-black border border-white/10 p-6 shadow-2xl sm:rounded-3xl sm:p-10 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-primary">
                    {step === 1 ? 'Step 1 of 2: Team Details' : step === 2 ? 'Step 2 of 2: Payment' : 'Registration Complete'}
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-white">
                    {step === 1 ? 'Lock in your slot.' : step === 2 ? 'Confirm Payment' : 'You are all set!'}
                  </h2>
                </div>
                {step !== 3 && (
                  <button onClick={() => setModal(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                )}
              </div>
              
              {/* STEP 1: Details */}
              {step === 1 && (
                <form onSubmit={handleNextStep}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">Team Name</span>
                      <input required type="text" value={form.teamName} onChange={(e) => updateField('teamName', e.target.value)} placeholder="Enter team name" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-primary focus:bg-white/10" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">Captain Name</span>
                      <input required type="text" value={form.captainName} onChange={(e) => updateField('captainName', e.target.value)} placeholder="Your name" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-primary focus:bg-white/10" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">Captain In-Game ID</span>
                      <input required type="text" value={form.inGameId} onChange={(e) => updateField('inGameId', e.target.value)} placeholder="UID / IGN" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-primary focus:bg-white/10" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">WhatsApp Number</span>
                      <input required type="tel" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} placeholder="Room ID will be sent here" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-primary focus:bg-white/10" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">Email Address</span>
                      <input required type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-primary focus:bg-white/10" />
                    </label>
                  </div>
                  
                  <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <p className="text-sm font-bold text-primary mb-4 flex items-center gap-2"><Info size={16}/> I confirm that:</p>
                    {['My game UID and username are accurate.', 'I will check in before the lobby opens.', 'I have read and accept the tournament rules.', 'I understand the host decision is final.'].map((label) => (
                      <label key={label} className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground hover:text-white transition-colors">
                        <input type="checkbox" checked={confirmations.includes(label)} onChange={(e) => setConfirmations((current) => e.target.checked ? [...current, label] : current.filter((item) => item !== label))} className="mt-1 accent-primary w-4 h-4 cursor-pointer" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <Button type="submit" className="mt-8 w-full h-14 bg-primary hover:bg-primary/90 text-white text-base shadow-[0_0_15px_hsla(var(--primary),0.3)]">
                    Next: Payment <ArrowRight size={18} className="ml-2" />
                  </Button>
                </form>
              )}

              {/* STEP 2: Payment */}
              {step === 2 && (
                <form onSubmit={submitFinal}>
                  <div className="p-5 bg-secondary/10 border border-secondary/20 rounded-2xl flex flex-col items-center justify-center text-center mb-8">
                     <p className="text-sm text-muted-foreground">Scan QR or pay to UPI ID</p>
                     
                     <div className="w-48 h-48 bg-white rounded-xl my-6 flex items-center justify-center p-2 relative overflow-hidden">
                        {(tournament as any).paymentQrUrl ? (
                          <img src={(tournament as any).paymentQrUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-xs text-muted-foreground flex flex-col items-center">
                            <span className="block mb-2 font-bold text-black/50">NO QR UPLOADED</span>
                            Please use the UPI ID below
                          </div>
                        )}
                     </div>
                     
                     <p className="font-mono-ui text-lg font-bold text-white tracking-widest bg-black/50 px-4 py-2 rounded-lg border border-white/10">{(tournament as any).upiId || 'Host UPI not provided'}</p>
                     <p className="mt-4 text-xl text-white">Entry Fee: <span className="font-bold text-secondary font-display">₹{tournament.entryFee}</span></p>
                  </div>

                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">12-Digit UTR / Transaction ID</span>
                      <input required type="text" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="e.g. 301234567890" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-secondary focus:bg-white/10" />
                    </label>
                    
                    <div>
                       <span className="mb-2 block text-xs font-bold text-muted-foreground">Payment Screenshot</span>
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className={`border-2 border-dashed ${screenshotFile ? 'border-secondary/50 bg-secondary/10' : 'border-white/20 bg-white/5 hover:bg-white/10'} rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors`}
                       >
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && setScreenshotFile(e.target.files[0])} />
                          {screenshotFile ? (
                            <>
                              <Check size={32} className="text-secondary mb-3" />
                              <p className="text-sm font-bold text-white mb-1">{screenshotFile.name}</p>
                              <p className="text-xs text-muted-foreground">Click to change file</p>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={32} className="text-muted-foreground mb-3" />
                              <p className="text-sm font-bold text-white mb-1">Upload Screenshot</p>
                              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                            </>
                          )}
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-14 px-6 border-white/20 hover:bg-white/10">
                       Back
                    </Button>
                    <Button type="submit" disabled={isUploading || register.isPending || !screenshotFile || !utrNumber} className="flex-1 h-14 bg-secondary hover:bg-secondary/90 text-black font-bold text-base shadow-[0_0_15px_hsla(var(--color-secondary),0.4)]">
                      {isUploading || register.isPending ? <><Loader2 size={18} className="mr-2 animate-spin"/> Processing...</> : 'Submit Registration'}
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 3: Success */}
              {step === 3 && done && (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 relative">
                    <Check size={40} />
                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-white mb-2">Registration Successful! 🎉</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Your squad has been registered and payment proof submitted.
                  </p>
                  
                  {/* Booking ID Card */}
                  <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 rounded-2xl p-6 mb-6 w-full max-w-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <p className="text-xs text-primary uppercase tracking-[.2em] font-bold mb-2 relative">Your Booking ID</p>
                    <p className="font-mono-ui font-bold text-4xl text-white relative tracking-wider">#{done.registrationId}</p>
                    <p className="text-[11px] text-muted-foreground mt-3 relative">⚠️ Save this ID! You'll need it to check your status and get room credentials.</p>
                  </div>

                  {/* What happens next */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 w-full max-w-sm text-left space-y-3 mb-8">
                    <p className="text-xs uppercase font-bold text-white tracking-wider">What happens next?</p>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</div>
                      <p className="text-sm text-muted-foreground">Admin will <strong className="text-white">verify your payment</strong> (usually within 30 min)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</div>
                      <p className="text-sm text-muted-foreground">Your status changes to <strong className="text-green-500">CONFIRMED</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">3</div>
                      <p className="text-sm text-muted-foreground">Come back to this page, enter your <strong className="text-white">Booking ID</strong> to see Room ID & Password</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">4</div>
                      <p className="text-sm text-muted-foreground">Admin may also send Room details via <strong className="text-white">WhatsApp</strong></p>
                    </div>
                  </div>

                  <Button onClick={() => setModal(false)} className="h-12 px-8 bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    Close & Return to Tournament
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}