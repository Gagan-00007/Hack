import React, { useEffect, useState } from 'react';
import { AttendanceRecord, UserRole } from '../types';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Building,
} from 'lucide-react';

interface AttendanceModuleProps {
  userRole: UserRole;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ userRole }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter parameters
  const [search, setSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    fetchRecords();
  }, [deptFilter, statusFilter, dateFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (deptFilter !== 'ALL') query.append('department', deptFilter);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (dateFilter) query.append('date', dateFilter);

      const res = await fetch(`/api/attendance?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Attendance Audit Logs & Search Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time biometric attendance records with recognition confidence metrics and terminal details.
          </p>
        </div>

        <div className="text-right font-mono text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredRecords.length}</span> Records
        </div>
      </div>

      {/* Search & Filter Controls Panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="ALL">All Departments</option>
              <option>Computer Science</option>
              <option>Electrical Engineering</option>
              <option>Mechanical Engineering</option>
              <option>Civil Engineering</option>
              <option>Business Administration</option>
              <option>Information Technology</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {dateFilter && (
          <div className="flex justify-end">
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear Date Filter
            </button>
          </div>
        )}
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Terminal Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No attendance logs match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {rec.studentId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {rec.studentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rec.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      <div>{rec.date}</div>
                      <div className="text-[10px] text-slate-400">{rec.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : rec.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 font-semibold">
                      {rec.confidence}%
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{rec.deviceId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
