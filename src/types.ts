export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface LeaveRequest {
  id: string;
  studentId: string;
  date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Notification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'SUCCESS';
  createdAt: string;
  read: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Student {
  studentId: string;
  fullName: string;
  department: string;
  year: string;
  section: string;
  rollNumber: string;
  email: string;
  phoneNumber: string;
  registrationDate: string;
  faceEncodings: number[][]; // Array of 128-dimensional facial vectors
  datasetImages: string[];   // Data URLs of real cropped face images captured during registration
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Teacher {
  id: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  year: string;
  section: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  confidence: number; // 0 - 100%
  deviceId: string;
  capturedImage?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  details: string;
  ipAddress: string;
}

export interface SystemSettings {
  darkMode: boolean;
  strictModeConfidence: number; // e.g. 70 (%)
  autoAttendanceIntervalSeconds: number;
  kioskDeviceName: string;
  departmentList: string[];
  systemVersion: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendanceCount: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
  recentActivity: AuditLog[];
  departmentStats: { department: string; count: number; percentage: number }[];
}
