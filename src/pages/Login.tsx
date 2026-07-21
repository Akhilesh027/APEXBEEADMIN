import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Sparkles, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { setIsAuthenticated } = useAdminState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://server.apexbee.in/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Invalid admin credentials. Please try again.');
        setLoading(false);
        return;
      }

      const roles = data.user?.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase() === 'admin');

      if (!isAdmin) {
        setError('Access denied. Only administrators can log in here.');
        setLoading(false);
        return;
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Connection error, unable to connect to auth server.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center relative overflow-hidden px-4 select-none">
      {/* Decorative animated glow circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute w-80 h-80 rounded-full bg-primary/20 blur-[100px] -top-20 -left-20"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -60, 0],
          y: [0, 60, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] -bottom-40 -right-40"
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass bg-card/40 border border-border/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Brand logo */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="bg-primary/20 text-primary p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">Apex Market Admin Hub</h1>
          <p className="text-xs text-muted-foreground max-w-[280px]">Enterprise Control Center for approvals, networks, and commission distributions</p>
        </div>



        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs leading-normal mb-5"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-muted-foreground block font-medium">Administrator Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="admin@apexmarket.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-white/5 focus:border-primary rounded-xl bg-white/[0.03] text-xs text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground block font-medium">Secret Security Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-white/5 focus:border-primary rounded-xl bg-white/[0.03] text-xs text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={15} /> Authenticate Admin Credentials
              </>
            )}
          </button>
        </form>


      </motion.div>
    </div>
  );
};
export default Login;
