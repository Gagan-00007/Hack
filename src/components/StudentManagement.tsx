import React, { useEffect, useState } from 'react';
import { Student, UserRole } from '../types';
import {
  GraduationCap,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Image,
  X,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface StudentManagementProps {
  userRole: UserRole;
  onNavigateRegister: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ userRole, onNavigateRegister }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Modal States
  const [viewDatasetStudent, setViewDatasetStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    try {
      const res = await fetch(`/api/students/${editStudent.studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStudent),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Updated student ${editStudent.fullName} successfully.` });
        setEditStudent(null);
        fetchStudents();
      } else {
        setMessage({ type: 'error', text: 'Failed to update student.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Deleted student record ${studentId}.` });
        setDeleteConfirmId(null);
        fetchStudents();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete student.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Student Directory & Dataset Encodings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage registered students, view dataset images, and inspect facial vector encodings.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={onNavigateRegister}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Student</span>
          </button>
        )}
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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, ID, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
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
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year / Sec</th>
                <th className="py-3 px-4">Encodings</th>
                <th className="py-3 px-4">Dataset Samples</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {stu.studentId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{stu.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{stu.email || 'No email provided'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{stu.department}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {stu.year} / {stu.section}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {stu.faceEncodings?.length || 0} Vectors
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setViewDatasetStudent(stu)}
                        className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Image className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>View ({stu.datasetImages?.length || 0})</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {userRole === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => setEditStudent(stu)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Student Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(stu.studentId)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Images Modal */}
      {viewDatasetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real Dataset Images for {viewDatasetStudent.fullName}
                </h3>
                <p className="text-xs text-slate-500">ID: {viewDatasetStudent.studentId}</p>
              </div>
              <button
                onClick={() => setViewDatasetStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewDatasetStudent.datasetImages && viewDatasetStudent.datasetImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {viewDatasetStudent.datasetImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                    <img src={imgUrl} alt={`Dataset Sample ${idx}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-mono rounded-md">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No cropped dataset images stored for this student.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Student Record?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete student <span className="font-bold">{deleteConfirmId}</span>? Facial encodings will be removed permanently.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteConfirmId)}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
