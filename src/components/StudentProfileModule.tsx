import React, { useState, useEffect } from 'react';
import { UserCircle, Shield, Camera } from 'lucide-react';
import { Student } from '../types';

export const StudentProfileModule: React.FC = () => {
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('smartface_token');
        const res = await fetch('/api/students/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-rose-500">Could not load profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UserCircle className="w-6 h-6 text-blue-500" />
            Face Enrollment Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your biometric identity for the attendance kiosk.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700">
            {profile.datasetImages && profile.datasetImages[0] ? (
              <img src={profile.datasetImages[0]} alt="Enrolled face" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-12 h-12 text-slate-400" />
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Name: {profile.fullName}</h2>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">Roll Number: {profile.studentId}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Department: {profile.department}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-xs text-slate-500 dark:text-slate-400">Enrollment Status</span>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <Shield className="w-4 h-4" /> Active
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-xs text-slate-500 dark:text-slate-400">Face Encodings</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                  {profile.faceEncodings?.length || 0} Vectors Saved
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                If the kiosk frequently fails to recognize you, or if you haven't uploaded a face yet, you can add your face data to the system here.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white dark:bg-blue-600 dark:text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-md">
                <Camera className="w-4 h-4" />
                Upload Face to System
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
