import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Camera,
  UserPlus,
  Users,
  GraduationCap,
  ClipboardList,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Database,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'recognition'
  | 'registration'
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'reports'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  isCollapsed,
  setIsCollapsed,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'recognition',
      label: 'Real-Time Kiosk',
      icon: Camera,
      roles: ['ADMIN', 'TEACHER'],
      badge: 'Live',
    },
    {
      id: 'registration',
      label: 'Register Student',
      icon: UserPlus,
      roles: ['ADMIN'],
    },
    {
      id: 'students',
      label: 'Student Directory',
      icon: GraduationCap,
      roles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'teachers',
      label: 'Teacher Accounts',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      id: 'attendance',
      label: 'Attendance Records',
      icon: ClipboardList,
      roles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'analytics',
      label: 'Analytics & Insights',
      icon: BarChart3,
      roles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'settings',
      label: 'System & Backup',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Footer Status */}
      {!isCollapsed && (
        <div className="p-3 m-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="capitalize">{userRole.toLowerCase()} Mode</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {userRole === 'ADMIN' ? 'Full Administrator Privileges' : 'Teacher Access Mode'}
          </p>
        </div>
      )}

      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-t border-slate-200 dark:border-slate-800 transition-colors"
      >
        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>
    </aside>
  );
};
