import { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function Admin() {
  const [tab, setTab] = useState<'payments' | 'tournaments'>('payments');
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['adminRegistrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/registrations');
      if (!res.ok) throw new Error("Failed to fetch registrations");
      return res.json();
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/registrations/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRegistrations'] });
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    game: 'BGMI',
    entryFee: 0,
    prizePool: 0,
    date: '',
    time: '',
    banner: '/banners/banner1.png'
  });
  
  const createTournament = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer fake-token-for-now`
        },
        body: JSON.stringify({
          ...data,
          gameSlug: data.game.toLowerCase().replace(' ', '-'),
          organizer: 'NEXARENA Official',
          entryType: data.entryFee > 0 ? 'PAID' : 'FREE',
          currency: 'INR',
          maxParticipants: 100,
          teamSize: 1,
          format: 'Solo TPP',
          region: 'India',
          status: 'OPEN',
          accent: '#9900ff'
        })
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      alert("Tournament created successfully!");
      queryClient.invalidateQueries();
    }
  });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 md:py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-14 w-14 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Manage tournaments and verify manual UPI payments.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setTab('payments')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'payments' ? 'bg-primary text-white shadow-[0_0_15px_hsla(var(--primary),0.3)]' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
        >
          Verify Squad Registrations
        </button>
        <button 
          onClick={() => setTab('tournaments')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'tournaments' ? 'bg-primary text-white shadow-[0_0_15px_hsla(var(--primary),0.3)]' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
        >
          Manage Tournaments
        </button>
      </div>

      {tab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Pending Verification</h2>
            <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
              <Search size={16} className="text-muted-foreground" />
              <input placeholder="Search UTR or Username..." className="bg-transparent border-none outline-none text-sm text-white w-48" />
            </div>
          </div>
          
          <div className="grid gap-4">
            {isLoading && <p className="text-muted-foreground">Loading registrations...</p>}
            {registrations.length === 0 && !isLoading && <p className="text-muted-foreground">No registrations found.</p>}
            
            {registrations.map((reg: any) => (
              <div key={reg.id} className="glass rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-lg text-white">{reg.teamName || reg.captainName}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                      reg.status === 'PENDING_PAYMENT' ? 'bg-yellow-500/20 text-yellow-500' :
                      reg.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {reg.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">WhatsApp: <span className="text-white">{reg.whatsapp}</span> | IGN: <span className="text-white">{reg.inGameId}</span></p>
                  <p className="text-sm text-muted-foreground mb-1">Tournament: <span className="text-white">{reg.tournamentName}</span></p>
                  
                  {reg.payment && (
                    <p className="text-sm text-muted-foreground">UTR: <span className="text-primary font-mono-ui tracking-widest">{reg.payment.utrNumber}</span></p>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {reg.payment && (
                    <div className="text-right mr-6">
                      <p className="text-xs text-muted-foreground uppercase">Amount Paid</p>
                      <p className="font-display font-bold text-2xl text-secondary">₹{reg.payment.amount}</p>
                    </div>
                  )}
                  
                  {reg.status === 'PENDING_PAYMENT' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => approveMutation.mutate(reg.id)}
                        disabled={approveMutation.isPending}
                        className="h-10 w-10 rounded-xl bg-green-500/20 text-green-500 hover:bg-green-500/40 border border-green-500/30 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Approve & Confirm Squad"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button className="h-10 w-10 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/40 border border-red-500/30 flex items-center justify-center transition-colors" title="Reject">
                        <XCircle size={20} />
                      </button>
                      {reg.payment?.screenshotUrl && (
                        <a href={reg.payment.screenshotUrl} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors" title="View Payment Screenshot">
                          <FileText size={20} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'tournaments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 glass rounded-2xl max-w-2xl mx-auto">
           <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Create New Tournament</h2>
           <form onSubmit={(e) => { e.preventDefault(); createTournament.mutate(formData); }} className="grid gap-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Tournament Title</label>
                 <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" placeholder="e.g. BGMI Pro Scrims" />
               </div>
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Game</label>
                 <select value={formData.game} onChange={e => setFormData({...formData, game: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors">
                   <option>BGMI</option>
                   <option>Free Fire</option>
                   <option>Ludo</option>
                 </select>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Entry Fee (₹)</label>
                 <input required type="number" value={formData.entryFee} onChange={e => setFormData({...formData, entryFee: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Prize Pool (₹)</label>
                 <input required type="number" value={formData.prizePool} onChange={e => setFormData({...formData, prizePool: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Match Date</label>
                 <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Match Time</label>
                 <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
             </div>

             <div>
               <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Banner Image</label>
               <div className="flex flex-wrap gap-4 mb-2">
                 {[1, 2, 3, 4, 5].map(num => (
                   <div key={num} onClick={() => setFormData({...formData, banner: `/banners/banner${num}.png`})} className={`w-24 h-16 rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${formData.banner === `/banners/banner${num}.png` ? 'border-primary scale-110 shadow-[0_0_15px_hsla(var(--primary),0.5)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                     <img src={`/banners/banner${num}.png`} className="w-full h-full object-cover" />
                   </div>
                 ))}
               </div>
               <p className="text-xs text-muted-foreground">Select one of the uploaded banners.</p>
             </div>

             <button disabled={createTournament.isPending} type="submit" className="mt-4 px-6 py-4 bg-primary text-white font-bold rounded-xl shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:scale-[1.02] transition-all disabled:opacity-50">
               {createTournament.isPending ? 'Creating...' : 'Launch Tournament'}
             </button>
           </form>
        </motion.div>
      )}
    </div>
  );
}
