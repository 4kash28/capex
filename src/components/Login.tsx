import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, AlertCircle, ShieldCheck, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      // Fallback for local dev without Supabase
      if (email && password) {
        onLogin(email);
      } else {
        setError('Please enter email and password');
      }
      return;
    }

    if (!navigator.onLine) {
      setError('You are offline. Please check your internet connection.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      onLogin(email);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to Supabase. The project might be paused or unreachable.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B1F3A] relative overflow-hidden flex-col justify-between p-12 border-r-4 border-slate-900">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full border-[40px] border-white/20 blur-3xl"></div>
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full border-[40px] border-blue-500/20 blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-blue-600 border-2 border-slate-900 flex items-center justify-center font-black text-2xl text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              IT
            </div>
            <span className="text-2xl font-black text-white tracking-tight uppercase">ITBMS Portal</span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
              Enterprise IT <br/>
              <span className="text-blue-400">Budget Management</span> <br/>
              System
            </h1>
            <p className="text-lg text-blue-100/80 font-medium max-w-md leading-relaxed">
              Streamline your Capex and Opex tracking, vendor management, and financial reporting in one secure platform.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-white font-bold mb-1">Secure Access</h3>
            <p className="text-blue-200/70 text-sm">Role-based data isolation and encrypted storage.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
            <Database className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-white font-bold mb-1">Real-time Analytics</h3>
            <p className="text-blue-200/70 text-sm">Track budgets and expenditures with live dashboards.</p>
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-8 border-t border-white/10">
          <p className="text-sm text-blue-200/50 font-medium">
            Designed & Developed by <span className="font-black text-white tracking-wide">ARtecH Group</span>
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50 relative">
        {/* Mobile Header (only visible on small screens) */}
        <div className="absolute top-8 left-8 flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 bg-blue-600 border-2 border-slate-900 flex items-center justify-center font-black text-xl text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              IT
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight uppercase">ITBMS</span>
        </div>

        <div className="max-w-md w-full">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Please enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 p-4 border-2 border-red-200 rounded-xl text-sm font-bold flex items-start gap-3 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-2d w-full !pl-12 py-3.5 text-base bg-white"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">Password</label>
                  <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-2d w-full !pl-12 py-3.5 text-base bg-white"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-2d w-full py-4 text-lg flex justify-center items-center mt-8"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In to Portal'
              )}
            </button>
            
            <p className="text-center text-xs font-medium text-slate-400 mt-8">
              By signing in, you agree to our <a href="#" className="text-slate-600 hover:underline font-bold">Terms of Service</a> and <a href="#" className="text-slate-600 hover:underline font-bold">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
