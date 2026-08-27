import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Calendar, Clock, Trophy, Flame } from 'lucide-react';

export const StudentDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('smartface_token');
        const res = await fetch('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);



  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back, {currentUser.fullName.split(' ')[0]}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your attendance overview for this semester.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Attendance</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats?.attendancePercentage || 0}%</h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current Streak</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats?.streak || 0} Days</h3>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-500 dark:text-orange-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Classes Attended</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats?.presentCount || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

    </div>
  );
};
