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

  const schedule = [
    { time: '09:00 AM', subject: 'Data Structures & Algorithms', room: 'Room 302', status: 'completed' },
    { time: '11:30 AM', subject: 'Database Management Systems', room: 'Lab 4', status: 'upcoming' },
    { time: '02:00 PM', subject: 'Software Engineering', room: 'Room 105', status: 'upcoming' },
  ];

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

      {/* Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Today's Schedule
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {schedule.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-12 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.subject}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.time} • {item.room}</p>
                </div>
              </div>
              <div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  item.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
