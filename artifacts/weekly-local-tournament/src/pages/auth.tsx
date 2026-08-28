import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Check, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/shared';
import { motion } from 'framer-motion';

export function Login() {
  return <AuthCard mode="login" />;
}

export function Register() {
  return <AuthCard mode="register" />;
}

function AuthCard({ mode }: { mode: 'login' | 'register' }) {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Updated fields matching the backend schema
  const [form, setForm] = useState({ 
    fullName: '', 
    username: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  const isRegister = mode === 'register';
  
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  
  const submit = async (event: FormEvent) => { 
    event.preventDefault(); 
    
    if (isRegister && form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    setSubmitted(true); 
    
    // MOCK API CALL
    setTimeout(() => setLocation('/dashboard'), 800); 
  };
  
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2 bg-background overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* LEFT SIDE: Brand Identity */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 z-10 border-r border-white/5 bg-black/20 backdrop-blur-3xl">
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-black">
              <Zap size={20} fill="currentColor" />
            </span>
            <span className="font-display text-2xl font-bold tracking-[-.04em] text-glow">
              NEXA<span className="text-primary">RENA</span>
            </span>
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-32 max-w-md"
          >
            <p className="font-mono-ui text-xs font-bold uppercase tracking-[.2em] text-secondary text-glow-cyan mb-4">
              Player Authentication
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-[-.04em]">
              The Arena <br /> Awaits <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Your Arrival.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Secure your spot in the most competitive tournaments. Verify your identity, link your game accounts, and start your journey to the top of the leaderboard.
            </p>
          </motion.div>
        </div>
        
        <div className="relative flex items-center gap-3 text-sm text-muted-foreground bg-white/5 p-4 rounded-2xl border border-white/10 w-fit">
          <ShieldCheck size={20} className="text-primary" /> 
          <div>
            <p className="font-bold text-foreground">Secure Platform</p>
            <p className="text-xs">End-to-end encrypted credentials.</p>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE: Auth Form */}
      <section className="flex items-center justify-center px-5 py-10 md:px-10 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[480px] glass-card p-8 md:p-10 rounded-3xl"
        >
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3 justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-black">
                <Zap size={20} fill="currentColor" />
              </span>
              <span className="font-display text-2xl font-bold tracking-[-.04em] text-glow">
                NEXA<span className="text-primary">RENA</span>
              </span>
            </Link>
          </div>
          
          <h2 className="font-display text-3xl font-bold tracking-[-.04em] mb-2">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {isRegister ? 'Join the ultimate esports platform.' : 'Enter your credentials to access your dashboard.'}
          </p>
          
          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Full Name</span>
                  <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="John Doe" className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-primary focus:bg-black/60 transition-colors" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Username</span>
                  <input required value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="johndoe99" className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-primary focus:bg-black/60 transition-colors" />
                </label>
                <label className="block col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Phone Number (Optional)</span>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 9876543210" className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-primary focus:bg-black/60 transition-colors" />
                </label>
              </div>
            )}
            
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Email</span>
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-primary focus:bg-black/60 transition-colors" />
            </label>
            
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Password</span>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" minLength={6} className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 pr-12 text-sm outline-none focus:border-primary focus:bg-black/60 transition-colors" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {isRegister && (
               <label className="block">
               <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Confirm Password</span>
               <div className="relative">
                 <input required type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" minLength={6} className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 pr-12 text-sm outline-none focus:border-primary focus:bg-black/60 transition-colors" />
               </div>
             </label>
            )}
            
            {!isRegister && (
              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold text-secondary hover:text-primary transition-colors">
                  Forgot password?
                </button>
              </div>
            )}
            
            <Button type="submit" className="h-12 w-full mt-4 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_hsla(var(--primary),0.3)]" disabled={submitted}>
              {submitted ? 'Authenticating...' : isRegister ? 'Create Account' : 'Login'} <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isRegister ? 'Already have an account?' : 'New to NEXARENA?'} 
            <Link href={isRegister ? '/login' : '/register'} className="ml-2 font-bold text-white hover:text-primary transition-colors">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </motion.div>
      </section>
    </div>
  );
}