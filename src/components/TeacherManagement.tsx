import React, { useEffect, useState } from 'react';
import { Teacher } from '../types';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Search,
} from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Form State for New Teacher
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    department: 'Computer Science',
  });

  // Reset Password Modal
  const [resetModalTeacher, setResetModalTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.fullName) return;

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Created teacher account @${formData.username} successfully.` });
        setShowAddModal(false);
        setFormData({ username: '', password: '', fullName: '', email: '', department: 'Computer Science' });
        fetchTeachers();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to create teacher account.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTeacher || !newPassword) return;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: resetModalTeacher.username,
          newPassword,
          adminUsername: 'admin',
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Reset password for @${resetModalTeacher.username} successfully.` });
        setResetModalTeacher(null);
        setNewPassword('');
      } else {
        setMessage({ type: 'error', text: 'Failed to reset password.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const handleDeleteTeacher = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to remove teacher account @${username}?`)) return;

    try {
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: `Removed teacher account @${username}.` });
        fetchTeachers();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove teacher account.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.username.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Faculty & Teacher Account Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Only administrators can create teacher accounts, assign login credentials, and reset passwords.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Teacher Account</span>
        </button>
      </div>

      {/* Alert Message */}
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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search teachers by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
        />
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Account Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No teacher accounts found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.fullName}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      @{t.username}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.department}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{t.email}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setResetModalTeacher(t)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id, t.username)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Teacher Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTeacher}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Teacher Account</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Prof. Robert Vance"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. teacher_vance"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option>Computer Science</option>
                  <option>Electrical Engineering</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Business Administration</option>
                  <option>Information Technology</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rvance@university.edu"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reset Password for @{resetModalTeacher.username}
              </h3>
              <button
                type="button"
                onClick={() => setResetModalTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setResetModalTeacher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 shadow-sm"
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
