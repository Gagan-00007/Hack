import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Lock, UserCheck, KeyRound, AlertCircle, Sparkles, GraduationCap, Users } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [activeRole, setActiveRole] = useState<'student' | 'teacher' | 'admin'>('student');
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

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', text);
        throw new Error(
          res.ok 
            ? 'Received invalid data from server.' 
            : `Server error (${res.status}): The backend might not be running or is unreachable.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (user: string, pass: string, role: 'student' | 'teacher' | 'admin') => {
    setUsername(user);
    setPassword(pass);
    setActiveRole(role);
    setErrorMessage(null);
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative"
      style={{
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.9) 100%), url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop') center/cover no-repeat fixed`
      }}
    >
      <div className="w-full max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8 lg:gap-14 items-center">
        
        {/* Left Hero Branding Block */}
        <div className="hidden lg:flex flex-col justify-between min-h-[480px] py-4 text-white">
          <div className="max-w-[480px]">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center text-white mb-6 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-[2.5rem] font-bold leading-[1.15] tracking-tight mb-3 drop-shadow-lg">
              SmartFace AI <br /> Attendance Portal
            </h1>
            <p className="text-lg text-white/90 leading-relaxed drop-shadow-sm mb-8">
              Experience the next generation of seamless, secure, and touchless attendance tracking powered by advanced facial recognition.
            </p>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-white/25 px-4 py-2 rounded-full text-sm font-medium text-white/95">
                <Sparkles className="w-4 h-4 text-blue-400" />
                AI-Powered
              </div>
              <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-white/25 px-4 py-2 rounded-full text-sm font-medium text-white/95">
                <Shield className="w-4 h-4 text-emerald-400" />
                Enterprise Grade
              </div>
            </div>
          </div>
        </div>

        {/* Translucent Frosted Glass Card */}
        <div className="w-full bg-slate-900/40 backdrop-blur-[16px] border border-white/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] p-8 sm:p-10 transition-all duration-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/25 text-indigo-100 border border-indigo-300/45 px-3 py-1.5 rounded-full font-semibold text-xs mb-3 shadow-sm">
              <Lock className="w-4 h-4" />
              Secure Login
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1 drop-shadow-md">
              Welcome Back
            </h2>
            <p className="text-slate-300 text-sm drop-shadow-sm">
              Enter your credentials to access the portal
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-slate-900/40 backdrop-blur-md p-1 rounded-xl mb-6 border border-white/25">
            <button
              type="button"
              onClick={() => setActiveRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeRole === 'student'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('teacher')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeRole === 'teacher'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeRole === 'admin'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 mb-5 bg-rose-500/20 backdrop-blur-md border border-rose-400/50 text-rose-200 rounded-xl text-sm font-medium flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 drop-shadow-sm">
                Username / ID
              </label>
              <div className="relative flex items-center">
                <UserCheck className="absolute left-3 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your ID"
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] text-sm font-medium text-white bg-slate-900/45 backdrop-blur-md border-[1.5px] border-white/35 rounded-xl outline-none transition-all placeholder:text-slate-300/70 focus:bg-slate-900/65 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 drop-shadow-sm">
                Password
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 w-4 h-4 text-slate-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] text-sm font-medium text-white bg-slate-900/45 backdrop-blur-md border-[1.5px] border-white/35 rounded-xl outline-none transition-all placeholder:text-slate-300/70 focus:bg-slate-900/65 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-2 mt-2">
              <label className="flex items-center gap-2 text-slate-100 font-medium cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 bg-slate-900/50" />
                Remember me
              </label>
              <a href="#" className="text-indigo-300 hover:text-indigo-200 font-semibold transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-br from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 active:scale-[0.98] text-white font-bold text-[15px] rounded-xl shadow-[0_8px_24px_rgba(79,70,229,0.45)] transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Credentials Buttons */}
          <div className="mt-8 pt-5 border-t border-white/20">
            <div className="text-[11px] font-bold text-slate-300 text-center uppercase tracking-wider mb-3">
              Quick Demo Login
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin', 'admin123', 'admin')}
                className="px-3 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 text-xs font-bold rounded-xl border border-white/20 text-center transition-colors backdrop-blur-sm flex justify-center items-center gap-1"
              >
                <span>🔑</span> Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('teacher_smith', 'teacher123', 'teacher')}
                className="px-3 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 text-xs font-bold rounded-xl border border-white/20 text-center transition-colors backdrop-blur-sm flex justify-center items-center gap-1"
              >
                <span>🎓</span> Teacher
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
