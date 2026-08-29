import { useState } from 'react';
import { useLocation } from 'wouter';
import { ShieldAlert, CheckCircle, XCircle, Search, FileText, Megaphone, LogOut, Upload, Eye, Image, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { uploadImage } from '@/lib/utils';

export default function Admin() {
  const [tab, setTab] = useState<'payments' | 'tournaments' | 'announcements'>('payments');
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['adminRegistrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/registrations');
      if (!res.ok) throw new Error("Failed to fetch registrations");
      return res.json();
    }
  });

  const { data: announcementsList = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      return res.json();
    }
  });

  const { data: allTournaments = [] } = useQuery({
    queryKey: ['allTournamentsAdmin'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!window.confirm("Are you sure you want to permanently delete this registration?")) {
        throw new Error("Cancelled by user");
      }
      const res = await fetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRegistrations'] });
    }
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!window.confirm("WARNING: This will completely delete the tournament, ALL its registrations, payments, and results. Are you sure?")) {
        throw new Error("Cancelled by user");
      }
      const res = await fetch(`/api/admin/tournaments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete tournament");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTournamentsAdmin'] });
    }
  });

  const [showPastRegistrations, setShowPastRegistrations] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    game: 'BGMI',
    entryFee: 0,
    prizePool: 0,
    date: '',
    time: '',
    banner: '/banners/banner1.png',
    maxSlots: 100,
    teamSize: 4,
    format: 'Squad',
    upiId: 'nexarena@upi',
    paymentQrFile: null as File | null
  });
  
  const createTournament = useMutation({
    mutationFn: async (data: typeof formData) => {
      let paymentQrUrl = '';
      if (data.paymentQrFile) {
        paymentQrUrl = await uploadImage(data.paymentQrFile);
      }

      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer fake-token-for-now`
        },
        body: JSON.stringify({
          ...data,
          paymentQrUrl,
          gameSlug: data.game.toLowerCase().replace(' ', '-'),
          organizer: 'NEXARENA Official',
          entryType: data.entryFee > 0 ? 'PAID' : 'FREE',
          currency: 'INR',
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

  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  const createAnnouncement = useMutation({
    mutationFn: async (data: typeof announcementForm) => {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake-token-for-now' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to post announcement");
      return res.json();
    },
    onSuccess: () => {
      alert("Announcement posted successfully!");
      setAnnouncementForm({ title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  });

  const [winnerForm, setWinnerForm] = useState<{tournamentId: string | null, winners: {teamName: string, rank: number}[]}>({
    tournamentId: null,
    winners: [{teamName: '', rank: 1}, {teamName: '', rank: 2}, {teamName: '', rank: 3}]
  });

  const [roomForm, setRoomForm] = useState<{tournamentId: string | null, roomId: string, roomPassword: string}>({
    tournamentId: null,
    roomId: '',
    roomPassword: ''
  });

  const updateRoom = useMutation({
    mutationFn: async (data: typeof roomForm) => {
      const res = await fetch(`/api/admin/tournaments/${data.tournamentId}/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: data.roomId, roomPassword: data.roomPassword })
      });
      if (!res.ok) throw new Error("Failed to update room");
      return res.json();
    },
    onSuccess: () => {
      alert("Room credentials updated!");
      setRoomForm({ tournamentId: null, roomId: '', roomPassword: '' });
      queryClient.invalidateQueries({ queryKey: ['allTournamentsAdmin'] });
    }
  });

  const [notifyTournamentId, setNotifyTournamentId] = useState<string | null>(null);
  const notifyPlayersQuery = useQuery({
    queryKey: ['tournamentPlayers', notifyTournamentId],
    queryFn: async () => {
      if (!notifyTournamentId) return [];
      const res = await fetch(`/api/admin/tournaments/${notifyTournamentId}/players`);
      return res.json();
    },
    enabled: !!notifyTournamentId
  });

  const completeTournament = useMutation({
    mutationFn: async (data: typeof winnerForm) => {
      const res = await fetch(`/api/admin/tournaments/${data.tournamentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake-token-for-now' },
        body: JSON.stringify({ winners: data.winners })
      });
      if (!res.ok) throw new Error("Failed to complete tournament");
      return res.json();
    },
    onSuccess: () => {
      alert("Tournament completed!");
      setWinnerForm({ tournamentId: null, winners: [{teamName: '', rank: 1}, {teamName: '', rank: 2}, {teamName: '', rank: 3}] });
      queryClient.invalidateQueries({ queryKey: ['allTournamentsAdmin'] });
    }
  });

  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin-login');
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 md:py-14">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Admin Console</h1>
            <p className="text-sm text-muted-foreground">Manage tournaments and verify manual UPI payments.</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        <button 
          onClick={() => setTab('payments')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === 'payments' ? 'bg-primary text-white shadow-[0_0_15px_hsla(var(--primary),0.3)]' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
        >
          Verify Squad Registrations
        </button>
        <button 
          onClick={() => setTab('tournaments')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === 'tournaments' ? 'bg-primary text-white shadow-[0_0_15px_hsla(var(--primary),0.3)]' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
        >
          Manage Tournaments
        </button>
        <button 
          onClick={() => setTab('announcements')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === 'announcements' ? 'bg-primary text-white shadow-[0_0_15px_hsla(var(--primary),0.3)]' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
        >
          Announcements
        </button>
      </div>

      {tab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Pending Verification</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={showPastRegistrations} 
                  onChange={(e) => setShowPastRegistrations(e.target.checked)} 
                  className="accent-primary w-4 h-4 rounded"
                />
                Show Past Tournaments
              </label>
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                <Search size={16} className="text-muted-foreground" />
                <input placeholder="Search UTR or Username..." className="bg-transparent border-none outline-none text-sm text-white w-48" />
              </div>
            </div>
          </div>
          
          <div className="grid gap-4">
            {isLoading && <p className="text-muted-foreground">Loading registrations...</p>}
            
            {(() => {
              const visibleRegistrations = registrations.filter((reg: any) => showPastRegistrations || reg.tournamentStatus !== 'COMPLETED');
              
              if (visibleRegistrations.length === 0 && !isLoading) {
                return <p className="text-muted-foreground">No registrations found for active tournaments.</p>;
              }
              
              return visibleRegistrations.map((reg: any) => (
                <div key={reg.id} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg text-white">{reg.teamName || reg.captainName}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                      reg.status === 'PENDING_PAYMENT' ? 'bg-yellow-500/20 text-yellow-500' :
                      reg.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {reg.status}
                    </span>
                  </div>
                  {reg.payment && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase">Amount Paid</p>
                      <p className="font-display font-bold text-2xl text-secondary">₹{reg.payment.amount}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                  <p>WhatsApp: <span className="text-white">{reg.whatsapp}</span></p>
                  <p>IGN: <span className="text-white">{reg.inGameId}</span></p>
                  <p>Tournament: <span className="text-white">{reg.tournamentName}</span></p>
                  {reg.payment && (
                    <p>UTR: <span className="text-primary font-mono-ui tracking-widest">{reg.payment.utrNumber}</span></p>
                  )}
                </div>

                {/* Payment Screenshot Preview */}
                {reg.payment?.screenshotUrl && (
                  <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs uppercase text-muted-foreground font-bold mb-2 flex items-center gap-2"><Image size={14} /> Payment Screenshot</p>
                    <img src={reg.payment.screenshotUrl} alt="Payment proof" className="max-h-48 rounded-lg border border-white/10 object-contain" />
                    <a href={reg.payment.screenshotUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <Eye size={12} /> View Full Size
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex gap-2">
                    {reg.status === 'PENDING_PAYMENT' && (
                      <>
                        <button 
                          onClick={() => approveMutation.mutate(reg.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-2 bg-green-500/20 text-green-500 hover:bg-green-500/40 border border-green-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40 border border-yellow-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                          <XCircle size={16} /> Reject
                        </button>
                      </>
                    )}
                    {reg.status === 'CONFIRMED' && (
                      <span className="flex items-center gap-2 text-green-500 text-xs font-bold"><CheckCircle size={14} /> Verified & Confirmed</span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => deleteMutation.mutate(reg.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ));
          })()}
          </div>
        </motion.div>
      )}

      {tab === 'tournaments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 glass rounded-2xl max-w-2xl mx-auto">
           {/* Active Tournaments List */}
           <div className="mb-12 border-b border-white/10 pb-12">
             <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Active Tournaments</h2>
             <div className="grid gap-4">
               {allTournaments.filter((t: any) => t.status !== 'COMPLETED').map((t: any) => (
                 <div key={t.id} className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col gap-4">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                     <div>
                       <p className="font-bold text-white text-lg">{t.title}</p>
                       <p className="text-sm text-muted-foreground">{t.game} | {t.date} {t.time}</p>
                     </div>
                     <div className="flex flex-wrap items-center gap-2">
                       <button onClick={() => setRoomForm({...roomForm, tournamentId: t.id, roomId: t.roomId || '', roomPassword: t.roomPassword || ''})} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                         Manage Room
                       </button>
                       <button onClick={() => setNotifyTournamentId(notifyTournamentId === t.id ? null : t.id)} className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                         Notify Players
                       </button>
                       <button onClick={() => setWinnerForm({...winnerForm, tournamentId: t.id})} className="bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
                         Declare Winners
                       </button>
                       <div className="w-px h-6 bg-white/10 mx-1 hidden md:block"></div>
                       <button 
                         onClick={() => deleteTournamentMutation.mutate(t.id)} 
                         disabled={deleteTournamentMutation.isPending}
                         className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                         title="Delete Tournament"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   </div>
                   
                   {/* Room Credentials Form */}
                   {roomForm.tournamentId === t.id && (
                     <div className="bg-black/40 p-4 rounded-xl border border-blue-500/30">
                       <p className="text-xs font-bold uppercase text-blue-400 mb-3">Room Credentials</p>
                       <div className="flex gap-2 mb-4">
                         <input placeholder="Room ID" value={roomForm.roomId} onChange={e => setRoomForm({...roomForm, roomId: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex-1" />
                         <input placeholder="Password" value={roomForm.roomPassword} onChange={e => setRoomForm({...roomForm, roomPassword: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex-1" />
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => updateRoom.mutate(roomForm)} className="bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600">Save Room</button>
                         <button onClick={() => setRoomForm({...roomForm, tournamentId: null})} className="bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/20">Cancel</button>
                       </div>
                     </div>
                   )}

                   {/* Notify Players Box */}
                   {notifyTournamentId === t.id && (
                     <div className="bg-black/40 p-4 rounded-xl border border-yellow-500/30">
                       <p className="text-xs font-bold uppercase text-yellow-500 mb-3">Send Credentials to Players</p>
                       {notifyPlayersQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading players...</p> : (
                         <div>
                           <p className="text-sm text-muted-foreground mb-4">Total Confirmed Squads: <span className="text-white font-bold">{notifyPlayersQuery.data?.length || 0}</span></p>
                           
                           {notifyPlayersQuery.data?.length > 0 && (
                             <div className="flex flex-col gap-4">
                               {/* Email Mailto Link */}
                               {(() => {
                                 const emails = notifyPlayersQuery.data.map((p: any) => p.contactEmail).filter(Boolean).join(',');
                                 const subject = encodeURIComponent(`Room Details: ${t.title}`);
                                 const body = encodeURIComponent(`Match is starting soon!\n\nRoom ID: ${t.roomId || 'Not set yet'}\nPassword: ${t.roomPassword || 'Not set yet'}\n\nGood luck!`);
                                 return (
                                   <a href={`mailto:?bcc=${emails}&subject=${subject}&body=${body}`} className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-3 rounded-lg text-center transition-colors">
                                     ✉️ Open Mail Client (BCC All)
                                   </a>
                                 );
                               })()}

                               {/* WhatsApp Direct Links - one click per player */}
                               <div className="bg-black/60 p-3 rounded-lg border border-white/5">
                                 <p className="text-xs text-muted-foreground mb-2">WhatsApp Direct Send (one click per player)</p>
                                 <div className="max-h-40 overflow-y-auto space-y-2">
                                   {notifyPlayersQuery.data.filter((p: any) => p.contactWhatsApp).map((p: any, idx: number) => {
                                     const phone = p.contactWhatsApp.replace(/[^0-9]/g, '');
                                     const phoneWithCountry = phone.startsWith('91') ? phone : `91${phone}`;
                                     const msg = encodeURIComponent(`🚨 MATCH STARTING SOON 🚨\n\nHi ${p.captainName || p.teamName}!\nTournament: ${t.title}\n\n🔑 Room ID: ${t.roomId || 'TBA'}\n🔑 Password: ${t.roomPassword || 'TBA'}\n\nPlease join the room. All the best! 🎯`);
                                     return (
                                       <a 
                                         key={idx}
                                         href={`https://wa.me/${phoneWithCountry}?text=${msg}`}
                                         target="_blank"
                                         rel="noreferrer"
                                         className="flex items-center justify-between bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 rounded-lg px-3 py-2 transition-colors"
                                       >
                                         <span className="text-xs text-white font-bold">{p.teamName || p.captainName}</span>
                                         <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Send via WhatsApp →</span>
                                       </a>
                                     );
                                   })}
                                 </div>
                               </div>
                               
                               <div className="bg-black/60 p-3 rounded-lg border border-white/5">
                                 <p className="text-xs text-muted-foreground mb-2">Message Template (Copy & Paste)</p>
                                 <div className="text-sm text-white whitespace-pre-wrap font-mono-ui">
{`🚨 MATCH STARTING SOON 🚨\n\nTournament: ${t.title}\n\nRoom ID: ${t.roomId || 'TBA'}\nPassword: ${t.roomPassword || 'TBA'}\n\nPlease join the room. All the best!`}
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                   
                   {/* Declare Winners Form */}
                   {winnerForm.tournamentId === t.id && (
                     <div className="bg-black/40 p-4 rounded-xl border border-green-500/30">
                       <p className="text-xs font-bold uppercase text-green-500 mb-3">Declare Winners</p>
                       <div className="flex flex-col gap-2 mb-4">
                         {[0, 1, 2].map(idx => (
                           <input 
                             key={idx}
                             placeholder={`${idx+1}${idx===0?'st':idx===1?'nd':'rd'} Place Team Name`}
                             value={winnerForm.winners[idx].teamName}
                             onChange={e => {
                               const newWinners = [...winnerForm.winners];
                               newWinners[idx].teamName = e.target.value;
                               setWinnerForm({...winnerForm, winners: newWinners});
                             }}
                             className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary w-full"
                           />
                         ))}
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => completeTournament.mutate(winnerForm)} className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex-1 hover:bg-green-600">Submit Results</button>
                         <button onClick={() => setWinnerForm({...winnerForm, tournamentId: null})} className="bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/20">Cancel</button>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
                {allTournaments.filter((t: any) => t.status !== 'COMPLETED').length === 0 && (
                  <p className="text-muted-foreground text-sm">No active tournaments.</p>
                )}
              </div>
            </div>

            {/* Finished Tournaments List */}
            <div className="mb-12 border-b border-white/10 pb-12">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Finished Tournaments</h2>
              <div className="grid gap-4">
                {allTournaments.filter((t: any) => t.status === 'COMPLETED').map((t: any) => (
                  <div key={t.id} className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col gap-4 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-white text-lg">{t.title}</p>
                          <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">COMPLETED</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.game} | {t.date} {t.time}</p>
                      </div>
                      <div>
                        <button 
                          onClick={() => deleteTournamentMutation.mutate(t.id)} 
                          disabled={deleteTournamentMutation.isPending}
                          className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Trash2 size={14} /> Delete Permanently
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {allTournaments.filter((t: any) => t.status === 'COMPLETED').length === 0 && (
                  <p className="text-muted-foreground text-sm">No finished tournaments.</p>
                )}
              </div>
            </div>

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

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Max Slots (Teams/Players)</label>
                 <input required type="number" value={formData.maxSlots} onChange={e => setFormData({...formData, maxSlots: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Team Size</label>
                 <input required type="number" value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
               <div>
                 <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Format</label>
                 <input required value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})} placeholder="e.g. Squad TPP" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
               </div>
             </div>

             {/* Payment Collection Section */}
             <div className="bg-black/40 rounded-2xl border border-primary/20 p-6">
                <h3 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4">
                  <Upload size={16} /> Payment Collection Setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">UPI ID</label>
                    <input value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})} placeholder="e.g. yourname@upi" className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" />
                    <p className="text-[10px] text-muted-foreground mt-1">Players will see this UPI ID during registration.</p>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Upload Payment QR Scanner</label>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={e => setFormData({...formData, paymentQrFile: e.target.files?.[0] || null})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-primary transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/80" />
                    </div>
                    {formData.paymentQrFile && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-green-500">
                        <CheckCircle size={12} /> {formData.paymentQrFile.name} selected
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">Upload your UPI QR code image. Players will scan this to pay.</p>
                  </div>
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

      {tab === 'announcements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 glass rounded-2xl max-w-2xl mx-auto">
           <h2 className="flex items-center gap-3 text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4"><Megaphone className="text-primary"/> Post Announcement</h2>
           <form onSubmit={(e) => { e.preventDefault(); createAnnouncement.mutate(announcementForm); }} className="grid gap-6">
             <div>
               <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Announcement Title</label>
               <input required value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" placeholder="e.g. Server Maintenance" />
             </div>
             <div>
               <label className="block text-xs uppercase text-muted-foreground font-bold mb-2">Message</label>
               <textarea required value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors" placeholder="What do you want to tell the players?" />
             </div>
             <button disabled={createAnnouncement.isPending} type="submit" className="mt-2 px-6 py-4 bg-primary text-white font-bold rounded-xl shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:scale-[1.02] transition-all disabled:opacity-50">
               {createAnnouncement.isPending ? 'Posting...' : 'Post Announcement'}
             </button>
           </form>

           <div className="mt-10 pt-6 border-t border-white/10">
             <h3 className="font-bold text-white mb-4">Recent Announcements</h3>
             <div className="space-y-4">
               {announcementsList.length === 0 && <p className="text-muted-foreground text-sm">No announcements posted yet.</p>}
               {announcementsList.map((ann: any) => (
                 <div key={ann.id} className="bg-black/30 p-4 rounded-xl border border-white/5">
                   <p className="font-bold text-white">{ann.title}</p>
                   <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                 </div>
               ))}
             </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}
