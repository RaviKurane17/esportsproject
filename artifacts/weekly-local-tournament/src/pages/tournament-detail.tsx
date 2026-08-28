import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Clock3, FileText, LockKeyhole, MapPin, ShieldCheck, Users, X, Info, ChevronRight, UploadCloud } from 'lucide-react';
import { getGetTournamentQueryKey, useGetTournament, useRegisterForTournament, type RegistrationInput } from '@workspace/api-client-react';
import { Button, ErrorState, GameMark, Skeleton, StatusPill } from '@/components/shared';
import { motion, AnimatePresence } from 'framer-motion';

const fields: Array<{ key: Exclude<keyof RegistrationInput, 'confirmations'>; label: string; placeholder: string; type: string }> = [
  { key: 'fullName', label: 'Full name', placeholder: 'Your legal name', type: 'text' },
  { key: 'displayName', label: 'Display name', placeholder: 'The name on the bracket', type: 'text' },
  { key: 'gameUid', label: 'Game UID', placeholder: 'Your in-game ID', type: 'text' },
  { key: 'gameUsername', label: 'Game username', placeholder: 'Your exact username', type: 'text' },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210', type: 'tel' },
  { key: 'teamName', label: 'Team name (optional)', placeholder: 'Leave blank for solo queue', type: 'text' },
];

export default function TournamentDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetTournament(id, { query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) } });
  const register = useRegisterForTournament();
  
  const [modal, setModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  
  const [done, setDone] = useState<{ registrationId: string; amount: number } | null>(null);
  const [form, setForm] = useState<RegistrationInput>({ fullName: '', displayName: '', gameUid: '', gameUsername: '', email: '', phone: '', teamName: '', confirmations: [] });
  const [confirmations, setConfirmations] = useState<string[]>([]);
  
  // Payment Proof Form State
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  
  const tournament = query.data;
  
  const updateField = (key: keyof RegistrationInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!tournament || confirmations.length < 4) return;
    
    register.mutate({ id, data: { ...form, teamName: form.teamName || null, confirmations } }, { 
      onSuccess: (result) => { 
        setDone({ registrationId: result.registrationId, amount: result.totalAmount }); 
        setModal(false);
        if (result.totalAmount > 0) {
          setPaymentModal(true);
        }
      } 
    });
  };

  const submitPaymentProof = (event: FormEvent) => {
    event.preventDefault();
    if (!upiId || !utrNumber) return;
    // Mocking the payment API call
    setTimeout(() => {
      setPaymentModal(false);
      window.alert('Payment proof submitted successfully! The organizer will verify it shortly.');
    }, 800);
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
                <GameMark slug={tournament.gameSlug} name={tournament.game} size="lg" />
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
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Entry</p>
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
            
            <div className="mt-6 flex items-end justify-between">
              <p className="font-display text-5xl font-bold text-white">{tournament.entryType === 'FREE' ? '₹0' : `${tournament.currency}${tournament.entryFee}`}</p>
              <p className="text-sm text-muted-foreground mb-1">per player</p>
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
              className="mt-8 w-full h-14 bg-primary hover:bg-primary/90 text-white text-base shadow-[0_0_20px_hsla(var(--primary),0.4)] transition-all hover:scale-[1.02]" 
              onClick={() => setModal(true)} 
              disabled={tournament.registrationStatus !== 'AVAILABLE'}
            >
              {tournament.registrationStatus === 'REGISTERED' ? 'You are registered' : 'Register now'} <ArrowRight size={18} className="ml-2" />
            </Button>
            
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <LockKeyhole size={14} className="text-secondary" /> Registration closes {tournament.registrationDeadline}
            </p>
          </div>
          
          <div className="mt-6 rounded-3xl border border-secondary/30 bg-secondary/10 p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
             <p className="flex items-center gap-3 font-bold text-white"><ShieldCheck size={20} className="text-secondary" /> Run by a verified host</p>
             <p className="mt-3 text-sm leading-relaxed text-white/60">Clear rules, visible room details, and a real match result after the final round.</p>
          </div>
          
          {done && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-green-500/30 bg-green-500/10 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
              <p className="font-display text-2xl font-bold text-green-400">Slot reserved.</p>
              <p className="mt-2 text-sm text-green-400/80">Registration <span className="font-mono-ui bg-green-500/20 px-1 rounded">{done.registrationId}</span> is {done.amount ? 'pending payment' : 'confirmed'}.</p>
              
              {done.amount > 0 && (
                 <Button className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white" onClick={() => setPaymentModal(true)}>
                   Complete Payment <ChevronRight size={16} className="ml-1"/>
                 </Button>
              )}
            </motion.div>
          )}
        </aside>
      </div>
      
      {/* Registration Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5">
            <motion.div 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-black border border-white/10 p-6 shadow-2xl sm:rounded-3xl sm:p-10 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-primary">Registration desk</p>
                  <h2 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-white">Lock in your slot.</h2>
                  <p className="mt-3 text-base text-muted-foreground">Your details are used only for this bracket.</p>
                </div>
                <button onClick={() => setModal(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={submit} className="mt-10">
                <div className="grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field.key} className={field.key === 'teamName' ? 'sm:col-span-2' : ''}>
                      <span className="mb-2 block text-xs font-bold text-muted-foreground">{field.label}</span>
                      <input 
                        type={field.type} required={field.key !== 'teamName'} 
                        value={form[field.key] ?? ''} onChange={(e) => updateField(field.key, e.target.value)} 
                        placeholder={field.placeholder} 
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-primary focus:bg-white/10" 
                      />
                    </label>
                  ))}
                </div>
                
                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <p className="text-sm font-bold text-primary mb-4 flex items-center gap-2"><Info size={16}/> I confirm that:</p>
                  {['My game UID and username are accurate.', 'I will check in before the lobby opens.', 'I have read and accept the tournament rules.', 'I understand the host decision is final.'].map((label, index) => (
                    <label key={label} className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground hover:text-white transition-colors">
                      <input 
                        type="checkbox" checked={confirmations.includes(label)} 
                        onChange={(e) => setConfirmations((current) => e.target.checked ? [...current, label] : current.filter((item) => item !== label))} 
                        className="mt-1 accent-primary w-4 h-4 cursor-pointer" 
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                
                <Button type="submit" className="mt-8 w-full h-14 bg-primary hover:bg-primary/90 text-white text-base shadow-[0_0_15px_hsla(var(--primary),0.3)]" disabled={register.isPending || confirmations.length < 4}>
                  {register.isPending ? 'Submitting slot...' : 'Confirm registration'} <ArrowRight size={18} className="ml-2" />
                </Button>
                
                {register.isError && <p className="mt-4 text-center text-sm text-destructive">Registration could not be completed. Please try again.</p>}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Proof Modal */}
      <AnimatePresence>
        {paymentModal && done && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
             className="w-full max-w-lg rounded-3xl bg-black border border-white/10 p-8 shadow-2xl relative overflow-hidden"
           >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
             <div className="flex items-start justify-between">
               <div>
                 <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-secondary">Payment Required</p>
                 <h2 className="mt-2 font-display text-3xl font-bold text-white">Upload Proof</h2>
               </div>
               <button onClick={() => setPaymentModal(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <div className="mt-8 mb-8 p-5 bg-secondary/10 border border-secondary/20 rounded-2xl flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Scan QR or pay to UPI ID</p>
                <div className="w-32 h-32 bg-white rounded-xl my-4 flex items-center justify-center text-black font-bold">QR CODE</div>
                <p className="font-mono-ui text-lg font-bold text-white tracking-widest bg-black/50 px-4 py-2 rounded-lg border border-white/10">nexarena@upi</p>
                <p className="mt-4 text-xl text-white">Amount: <span className="font-bold text-secondary font-display">₹{done.amount}</span></p>
             </div>

             <form onSubmit={submitPaymentProof}>
               <div className="space-y-4">
                 <label className="block">
                   <span className="mb-2 block text-xs font-bold text-muted-foreground">Your UPI ID (Sender)</span>
                   <input required value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-secondary" />
                 </label>
                 <label className="block">
                   <span className="mb-2 block text-xs font-bold text-muted-foreground">12-Digit UTR / Transaction ID</span>
                   <input required value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="e.g. 301234567890" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-secondary" />
                 </label>
                 
                 <div className="mt-4 border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                    <UploadCloud size={32} className="text-muted-foreground mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Upload Screenshot</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                 </div>
               </div>
               
               <Button type="submit" className="mt-8 w-full h-12 bg-secondary hover:bg-secondary/90 text-black font-bold shadow-[0_0_15px_hsla(var(--color-secondary),0.4)]">
                 Submit Payment Proof <ArrowRight size={16} className="ml-2" />
               </Button>
             </form>
           </motion.div>
         </div>
        )}
      </AnimatePresence>

    </div>
  );
}