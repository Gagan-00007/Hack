import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Lock, UserCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Invalid credentials');
      }

      const data = await res.json();
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            SmartFace <span className="text-blue-600 dark:text-blue-400">AI</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise Facial Recognition Attendance Portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Username / Account ID
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or teacher_smith"
              className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authenticate & Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Credentials Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
            Quick Fill Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('admin', 'admin123')}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-center transition-colors"
            >
              🔑 Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('teacher_smith', 'teacher123')}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-center transition-colors"
            >
              🎓 Teacher Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
