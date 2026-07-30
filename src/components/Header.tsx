import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Shield,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  Camera,
  Bell,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenKiosk: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenKiosk,
  darkMode,
  onToggleDarkMode,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Brand Identification */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              SmartFace<span className="text-blue-600 dark:text-blue-400"> AI</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 dark:bg-blue-950/80 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/60 uppercase">
              Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Facial Recognition Attendance Engine
          </p>
        </div>
      </div>

      {/* Clock & Action Bar */}
      <div className="flex items-center space-x-4">
        {/* Live Date-Time Display */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{date}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-slate-900 dark:text-white font-semibold">{time}</span>
        </div>

        {/* Quick Kiosk Launch Button */}
        <button
          onClick={onOpenKiosk}
          className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-lg shadow-sm shadow-blue-500/20"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Launch Real-Time Scanner</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* System Health Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Engine Active</span>
        </div>

        {/* User Profile Menu */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser.role.toLowerCase()}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                    Role: {currentUser.role}
                  </span>
                </div>
                <div className="px-2 py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
