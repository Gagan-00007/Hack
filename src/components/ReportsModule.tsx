import React, { useEffect, useState } from 'react';
import { AttendanceRecord, UserRole } from '../types';
import { exportAttendanceToPDF, exportAttendanceToExcel, exportAttendanceToCSV } from '../utils/exportUtils';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Building,
  GraduationCap,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface ReportsModuleProps {
  userRole: UserRole;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ userRole }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Report Type
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'DEPARTMENT'>('DAILY');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchRecords();
  }, [reportType, selectedDept, selectedDate]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedDept !== 'ALL') query.append('department', selectedDept);

      if (reportType === 'DAILY') {
        query.append('date', selectedDate);
      } else if (reportType === 'MONTHLY') {
        query.append('month', selectedDate.slice(0, 7)); // YYYY-MM
      } else if (reportType === 'YEARLY') {
        query.append('year', selectedDate.slice(0, 4)); // YYYY
      }

      const res = await fetch(`/api/attendance?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    exportAttendanceToPDF(
      records,
      `SmartFace AI - ${reportType} Attendance Report`,
      `Department: ${selectedDept} | Date Reference: ${selectedDate}`
    );
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel(records, `SmartFace_Attendance_${reportType}`);
  };

  const handleExportCSV = () => {
    exportAttendanceToCSV(records, `SmartFace_Attendance_${reportType}`);
  };

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{userRole === 'STUDENT' ? 'My Attendance Reports & Export Hub' : 'Corporate Attendance Reports & Export Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {userRole === 'STUDENT' ? 'Download your attendance history for reference or correction requests.' : 'Generate executive attendance statements formatted for HR, university records, and compliance audits.'}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportPDF}
            disabled={records.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={records.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel XLSX</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Report Configuration Controls */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Report Parameters & Scope
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Report Frequency / Period
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="DAILY">Daily Attendance Statement</option>
              <option value="MONTHLY">Monthly Summary</option>
              <option value="YEARLY">Yearly Academic Audit</option>
              {userRole !== 'STUDENT' && <option value="DEPARTMENT">Department Specific Report</option>}
            </select>
          </div>

          {userRole !== 'STUDENT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Scope
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
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
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reference Date / Month
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Executive Summary Metrics Pill */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Logged</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{total}</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Present</div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">{present}</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">Late</div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300">{late}</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-800/60">
            <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase">Overall Rate</div>
            <div className="text-lg font-black text-blue-700 dark:text-blue-300">{percentage}%</div>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Live Statement Preview</span>
          <span className="font-mono text-slate-400">Ready for Download</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No records found for the selected report filters.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{rec.studentId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{rec.studentName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rec.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{rec.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{rec.time}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {rec.confidence}%
                    </td>
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
