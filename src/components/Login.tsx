import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login({ onLogin, onOfflineLogin }: { onLogin: (email: string) => void, onOfflineLogin: () => void }) {
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
        setError('Network error: Unable to connect to Supabase. The project might be paused or unreachable. Please use "Continue in Offline Mode" below.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0B1F3A] p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-4xl text-white mx-auto mb-4 shadow-lg">
            S
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ITBMS</h1>
          <p className="text-blue-200 text-sm mt-2">
            Sign in to manage your expenditures
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOfflineLogin}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
            >
              Continue Offline (IndexedDB)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
