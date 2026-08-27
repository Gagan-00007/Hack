import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Notification } from '../types';

export const NotificationsModule: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('smartface_token');
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Notifications & Alerts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Stay updated on your attendance status.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No new notifications. You're all caught up!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.map((n) => (
              <div key={n.id} className="p-5 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="mt-1">
                  {n.type === 'INFO' && <Info className="w-5 h-5 text-blue-500" />}
                  {n.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                  {n.type === 'SUCCESS' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
