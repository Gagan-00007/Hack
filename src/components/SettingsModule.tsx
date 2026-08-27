import React, { useEffect, useState } from 'react';
import { AuditLog, SystemSettings, User } from '../types';
import { Clock, Sliders, Bell, HardDrive, Smartphone } from 'lucide-react';
import {
  Settings,
  Database,
  Download,
  Upload,
  KeyRound,
  Activity,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface SettingsModuleProps {
  currentUser: User | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentUser,
  darkMode,
  onToggleDarkMode,
}) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Password reset state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const fetchSettingsAndLogs = async () => {
    try {
      const [setRes, logRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/logs'),
      ]);

      if (setRes.ok) {
        const s = await setRes.json();
        setSettings(s);
      }
      if (logRes.ok) {
        const l = await logRes.json();
        setAuditLogs(l);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // Download DB Backup JSON
  const handleDownloadBackup = () => {
    window.location.href = '/api/database/backup';
  };

  // Restore DB from file upload
  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const payload = parsed.data || parsed;

      const res = await fetch('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoredData: payload }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Database state restored successfully! Refreshing view...' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: 'Invalid database backup payload.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error parsing JSON database file.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: currentUser?.username,
          newPassword,
          adminUsername: currentUser?.username,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'Failed to update password.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error.' });
    }
  };


  const handleSaveSettings = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'System configuration updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update configuration.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error while saving settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Title Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>System Settings, Maintenance & Backup Hub</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure kiosk terminal params, database exports/imports, password management, and security audit logs.
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      
      {settings && (
        <>
          {/* Section: Biometric Recognition Settings */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Biometric Recognition Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Liveness Detection Sensitivity ({settings.livenessSensitivity}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.livenessSensitivity || 80}
                  onChange={(e) => setSettings({ ...settings, livenessSensitivity: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
                <p className="text-xs text-slate-500 mt-1">Lower values may accept spoofs; higher values may reject real faces.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Face-Match Confidence Threshold ({settings.strictModeConfidence}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.strictModeConfidence || 70}
                  onChange={(e) => setSettings({ ...settings, strictModeConfidence: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum similarity required to log attendance.</p>
              </div>
            </div>
          </div>

          {/* Section: Attendance & Time Rules */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Attendance & Time Rules</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Late Arrival Cutoff Time
                </label>
                <input
                  type="time"
                  value={settings.lateArrivalCutoff || '09:00'}
                  onChange={(e) => setSettings({ ...settings, lateArrivalCutoff: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Auto-Mark Absent Time
                </label>
                <input
                  type="time"
                  value={settings.autoMarkAbsentTime || '10:00'}
                  onChange={(e) => setSettings({ ...settings, autoMarkAbsentTime: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Data Retention & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Bell className="w-4 h-4 text-rose-500" />
                <span>Alerts & Notifications</span>
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Low Attendance Warning Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.lowAttendanceWarningThreshold || 75}
                  onChange={(e) => setSettings({ ...settings, lowAttendanceWarningThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <span>Data Retention</span>
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Log & Photo Retention Period
                </label>
                <select
                  value={settings.dataRetentionDays || 30}
                  onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                  <option value={9999}>Forever</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Kiosk Management */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>Registered Kiosks</span>
            </h3>
            
            <div className="space-y-3">
              {settings.registeredKiosks?.map((kiosk) => (
                <div key={kiosk.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{kiosk.name}</div>
                      <div className="text-xs text-slate-500">ID: {kiosk.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{kiosk.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </>
      )}

      {/* Section 1: Database Backup & Restore */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Database Backup & State Restoration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-xs font-bold text-slate-900 dark:text-white">Export Complete Database JSON</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download complete backup containing student profiles, real face encodings, teacher accounts, and attendance logs.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup File</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3 border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-xs font-bold text-slate-900 dark:text-white">Restore Database Payload</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload previously exported `.json` database file to restore students and attendance records.
            </p>
            <label className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Backup JSON</span>
              <input type="file" accept=".json" onChange={handleRestoreDatabase} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Change Password & Security */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>Security & Credential Management</span>
        </h3>

        <form onSubmit={handleChangePassword} className="max-w-md space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:opacity-90 transition-opacity"
          >
            Update My Password
          </button>
        </form>
      </div>

      {/* Section 3: System Audit Logs Viewer */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>System Security Audit Logs</span>
        </h3>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">User</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">@{log.username}</td>
                  <td className="py-2 px-3 font-mono text-slate-500">{log.role}</td>
                  <td className="py-2 px-3 font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
