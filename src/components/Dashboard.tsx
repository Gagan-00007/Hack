import React, { useEffect, useState } from 'react';
import { DashboardStats, User } from '../types';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Camera,
  UserPlus,
  FileText,
  Database,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { StudentDashboard } from './StudentDashboard';

interface DashboardProps {
  currentUser: User | null;
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate }) => {
  if (currentUser?.role === 'STUDENT') {
    return <StudentDashboard currentUser={currentUser} />;
  }
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-slate-500 dark:text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        <span className="text-sm font-medium">Loading SmartFace Analytics...</span>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      sub: 'Active Registrations',
      icon: GraduationCap,
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgLight: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Registered Teachers',
      value: stats?.totalTeachers || 0,
      sub: 'Faculty Operators',
      icon: Users,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgLight: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: "Today's Logs",
      value: stats?.todayAttendanceCount || 0,
      sub: 'Recorded Scans',
      icon: CalendarCheck,
      color: 'bg-slate-700',
      textColor: 'text-slate-700 dark:text-slate-300',
      bgLight: 'bg-slate-100 dark:bg-slate-800',
    },
    {
      title: 'Present Today',
      value: stats?.presentCount || 0,
      sub: 'On Time & Late',
      icon: UserCheck,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Absent Today',
      value: stats?.absentCount || 0,
      sub: 'Pending Verification',
      icon: UserX,
      color: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgLight: 'bg-rose-50 dark:bg-rose-950/50',
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendancePercentage || 0}%`,
      sub: 'Daily Turnout',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      bgLight: 'bg-cyan-50 dark:bg-cyan-950/50',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Biometric Engine v2.4 Active</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Welcome Back, {currentUser?.fullName || 'Administrator'}
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Real-time biometric facial recognition attendance monitoring system. Select a quick action below or view system performance.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => onNavigate('recognition')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Start Kiosk Scanner</span>
          </button>
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('registration')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Register Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.title}</span>
                <div className={`p-2 rounded-xl ${c.bgLight}`}>
                  <Icon className={`w-4 h-4 ${c.textColor}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {c.value}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {c.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Quick Launch & Department Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Attendance Distribution */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Department Enrollment & Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Active registered students grouped by academic department
              </p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>View Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {stats?.departmentStats.map((dept, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{dept.department}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {dept.count} Students ({dept.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Kiosk Actions Panel */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-1">
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Kiosk & Quick Tools</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Access core operational modules directly
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('recognition')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-left hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-200">Real-Time Face Kiosk</div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-400">Continuous webcam face scanner</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-700 text-white rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Generate Reports</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Export PDF, Excel XLSX, CSV</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </button>

              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => onNavigate('settings')}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-800 text-slate-200 rounded-lg">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Database & Backup</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Download DB backup & logs</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Terminal: Main Entrance Kiosk</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Online</span>
          </div>
        </div>
      </div>

      {/* System Audit & Recent Activity Feed */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Real-Time Audit & Activity Stream</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live biometric detections, system logins, and registration audit trails
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User / Operator</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {stats?.recentActivity.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    @{log.username}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
