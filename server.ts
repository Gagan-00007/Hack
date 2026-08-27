import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Paths
const DATA_DIR = path.join(process.cwd(), 'database');
const DATASET_DIR = path.join(process.cwd(), 'dataset');
const DB_FILE = path.join(DATA_DIR, 'smartface_db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATASET_DIR)) fs.mkdirSync(DATASET_DIR, { recursive: true });

// Password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_SMARTFACE_SALT_2026').digest('hex');
}

// Initial Database Schema & Seed Data
const initialData = {
  users: [
    {
      id: 'usr_admin_01',
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      fullName: 'System Administrator',
      email: 'admin@smartface.ai',
      role: 'ADMIN',
      department: 'IT & Administration',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_teacher_01',
      username: 'teacher_smith',
      passwordHash: hashPassword('teacher123'),
      fullName: 'Prof. Sarah Smith',
      email: 'ssmith@university.edu',
      role: 'TEACHER',
      department: 'Computer Science',
      createdAt: new Date().toISOString(),
    },
  ],
  students: [],
  attendance: [],
  auditLogs: [
    {
      id: 'log_001',
      timestamp: new Date().toISOString(),
      userId: 'usr_admin_01',
      username: 'admin',
      role: 'ADMIN',
      action: 'SYSTEM_INIT',
      details: 'SmartFace AI Enterprise Database initialized securely.',
      ipAddress: '127.0.0.1',
    },
  ],
  settings: {
    darkMode: false,
    strictModeConfidence: 70,
    autoAttendanceIntervalSeconds: 3,
    kioskDeviceName: 'Kiosk Terminal #1 (Main Entrance)',
    departmentList: [
      'Computer Science',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Business Administration',
      'Information Technology',
    ],
    systemVersion: 'SmartFace AI Enterprise v2.4.0',
  },
};

// Load or Save DB helper
function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Database read error, restoring defaults:', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database save error:', err);
  }
}

function addLog(db: any, username: string, role: any, action: string, details: string, ipAddress: string = '127.0.0.1') {
  const log = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    userId: username,
    username,
    role,
    action,
    details,
    ipAddress,
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) db.auditLogs.pop(); // Keep last 500 logs
}

const activeSessions: Record<string, { id: string; role: string; username: string }> = {};

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions[token];
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
  (req as any).user = session;
  next();
};

// REST API ROUTES

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = getDB();
  const passHash = hashPassword(password);
  
  let user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === passHash);

  // Fallback check for students
  if (!user) {
    const student = db.students.find((s: any) => s.studentId.toLowerCase() === username.toLowerCase());
    if (student && password === 'student123') { // hardcoded demo password for students
      user = {
        id: student.studentId,
        username: student.studentId,
        fullName: student.fullName,
        email: student.email || `${student.studentId}@smartface.ai`,
        role: 'STUDENT',
        department: student.department,
        createdAt: student.createdAt,
      };
    }
  }

  if (!user) {
    addLog(db, username, 'SYSTEM', 'LOGIN_FAILED', `Failed login attempt for username: ${username}`, req.ip);
    saveDB(db);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.role !== 'STUDENT') {
    const dbUser = db.users.find((u: any) => u.id === user.id);
    if (dbUser) dbUser.lastLogin = new Date().toISOString();
  }
  
  addLog(db, user.username, user.role, 'LOGIN_SUCCESS', `User ${user.fullName} logged in successfully`, req.ip);
  saveDB(db);

  const token = `token_${user.id}_${Date.now()}`;
  activeSessions[token] = { id: user.id, role: user.role, username: user.username };

  // Return session user object (without password hash)
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Admin Password Reset
app.post('/api/auth/reset-password', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { targetUsername, newPassword, adminUsername } = req.body;
  const db = getDB();

  const user = db.users.find((u: any) => u.username.toLowerCase() === targetUsername.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.passwordHash = hashPassword(newPassword);
  addLog(db, adminUsername || 'admin', 'ADMIN', 'PASSWORD_RESET', `Reset password for user: ${targetUsername}`, req.ip);
  saveDB(db);

  res.json({ success: true, message: `Password for ${targetUsername} reset successfully` });
});

// Dashboard Stats
app.get('/api/stats', requireAuth, (req, res) => {
  const db = getDB();
  const user = (req as any).user;
  const todayStr = new Date().toISOString().split('T')[0];

  if (user.role === 'STUDENT') {
    const studentRecords = db.attendance.filter((a: any) => a.studentId.toLowerCase() === user.id.toLowerCase());
    const presentCount = studentRecords.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalDays = Array.from(new Set(db.attendance.map((a: any) => a.date))).length || 1;
    const attendancePercentage = Math.round((presentCount / totalDays) * 100);
    return res.json({
      totalStudents: 1, totalTeachers: 0, todayAttendanceCount: studentRecords.filter((a:any) => a.date === todayStr).length,
      presentCount, absentCount: totalDays - presentCount, attendancePercentage, recentActivity: [], departmentStats: [], streak: presentCount
    });
  }

  const totalStudents = db.students.filter((s: any) => s.status === 'ACTIVE').length;
  const totalTeachers = db.users.filter((u: any) => u.role === 'TEACHER').length;

  const todayRecords = db.attendance.filter((a: any) => a.date === todayStr);
  const presentCount = todayRecords.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Department Distribution
  const deptMap: Record<string, number> = {};
  db.students.forEach((s: any) => {
    deptMap[s.department] = (deptMap[s.department] || 0) + 1;
  });

  const departmentStats = Object.keys(deptMap).map((dept) => ({
    department: dept,
    count: deptMap[dept],
    percentage: Math.round((deptMap[dept] / (totalStudents || 1)) * 100),
  }));

  res.json({
    totalStudents,
    totalTeachers,
    todayAttendanceCount: todayRecords.length,
    presentCount,
    absentCount,
    attendancePercentage,
    recentActivity: db.auditLogs.slice(0, 15),
    departmentStats,
  });
});

// Students List & Create / Edit / Delete
app.get('/api/students/me', requireAuth, (req, res) => {
  const db = getDB();
  const student = db.students.find((s: any) => s.studentId.toLowerCase() === (req as any).user.id.toLowerCase());
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json(student);
});

app.get('/api/students', requireAuth, (req, res) => {
  if ((req as any).user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
  const db = getDB();
  res.json(db.students);
});

app.post('/api/students', requireAuth, (req, res) => {
  if (!['ADMIN', 'TEACHER'].includes((req as any).user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { studentId, fullName, department, year, section, rollNumber, email, phoneNumber, faceEncodings, datasetImages } = req.body;

  if (!studentId || !fullName || !department) {
    return res.status(400).json({ error: 'Student ID, Full Name, and Department are required' });
  }

  const db = getDB();

  // Prevent Duplicate Student ID
  const existing = db.students.find((s: any) => s.studentId.toLowerCase() === studentId.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: `Student ID "${studentId}" is already registered!` });
  }

  const newStudent = {
    studentId,
    fullName,
    department,
    year: year || '1st Year',
    section: section || 'Sec-A',
    rollNumber: rollNumber || 'RN-001',
    email: email || '',
    phoneNumber: phoneNumber || '',
    registrationDate: new Date().toISOString().split('T')[0],
    faceEncodings: faceEncodings || [],
    datasetImages: datasetImages || [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.students.unshift(newStudent);
  addLog(db, 'admin', 'ADMIN', 'STUDENT_REGISTERED', `Registered new student: ${fullName} (${studentId}) with ${faceEncodings?.length || 0} real face encodings`, req.ip);
  saveDB(db);

  res.status(201).json(newStudent);
});

app.put('/api/students/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'TEACHER'].includes((req as any).user.role)) return res.status(403).json({ error: 'Forbidden' });
  const studentId = req.params.id;
  const db = getDB();
  const index = db.students.findIndex((s: any) => s.studentId.toLowerCase() === studentId.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  db.students[index] = { ...db.students[index], ...req.body };
  addLog(db, 'admin', 'ADMIN', 'STUDENT_UPDATED', `Updated student details: ${studentId}`, req.ip);
  saveDB(db);

  res.json(db.students[index]);
});

app.delete('/api/students/:id', requireAuth, (req, res) => {
  if (!['ADMIN', 'TEACHER'].includes((req as any).user.role)) return res.status(403).json({ error: 'Forbidden' });
  const studentId = req.params.id;
  const db = getDB();
  const index = db.students.findIndex((s: any) => s.studentId.toLowerCase() === studentId.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const removed = db.students.splice(index, 1)[0];
  addLog(db, 'admin', 'ADMIN', 'STUDENT_DELETED', `Deleted student record: ${removed.fullName} (${studentId})`, req.ip);
  saveDB(db);

  res.json({ success: true, message: `Student ${studentId} deleted successfully` });
});

// Teachers List & Create / Delete
app.get('/api/teachers', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDB();
  const teachers = db.users
    .filter((u: any) => u.role === 'TEACHER')
    .map(({ passwordHash: _, ...t }: any) => t);
  res.json(teachers);
});

app.post('/api/teachers', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { username, password, fullName, email, department } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Username, password, and full name are required' });
  }

  const db = getDB();

  // Prevent Duplicate Username
  const existing = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: `Username "${username}" is already taken!` });
  }

  const newTeacher = {
    id: 'usr_teacher_' + Date.now(),
    username,
    passwordHash: hashPassword(password),
    fullName,
    email: email || `${username}@university.edu`,
    role: 'TEACHER',
    department: department || 'General Academics',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newTeacher);
  addLog(db, 'admin', 'ADMIN', 'TEACHER_CREATED', `Created new teacher account: ${fullName} (@${username})`, req.ip);
  saveDB(db);

  const { passwordHash: _, ...safeTeacher } = newTeacher;
  res.status(201).json(safeTeacher);
});

app.delete('/api/teachers/:id', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const teacherId = req.params.id;
  const db = getDB();
  const index = db.users.findIndex((u: any) => u.id === teacherId && u.role === 'TEACHER');

  if (index === -1) {
    return res.status(404).json({ error: 'Teacher account not found' });
  }

  const removed = db.users.splice(index, 1)[0];
  addLog(db, 'admin', 'ADMIN', 'TEACHER_DELETED', `Removed teacher account: @${removed.username}`, req.ip);
  saveDB(db);

  res.json({ success: true, message: `Teacher ${removed.username} removed successfully` });
});

// Attendance Log & Mark
app.get('/api/attendance', requireAuth, (req, res) => {
  const db = getDB();
  let records = db.attendance;
  const user = (req as any).user;

  let { studentId, department, date, month, year, status, search } = req.query;

  if (user.role === 'STUDENT') {
    studentId = user.id; // Enforce scoping
  }

  if (studentId) {
    records = records.filter((r: any) => r.studentId.toLowerCase() === String(studentId).toLowerCase());
  }
  if (department) {
    records = records.filter((r: any) => r.department.toLowerCase() === String(department).toLowerCase());
  }
  if (date) {
    records = records.filter((r: any) => r.date === date);
  }
  if (month) {
    records = records.filter((r: any) => r.date.startsWith(String(month)));
  }
  if (year) {
    records = records.filter((r: any) => r.date.startsWith(String(year)));
  }
  if (status) {
    records = records.filter((r: any) => r.status.toUpperCase() === String(status).toUpperCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    records = records.filter((r: any) =>
      r.studentName.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  }

  res.json(records);
});

app.post('/api/attendance/mark', requireAuth, (req, res) => {
  if ((req as any).user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
  const { studentId, confidence, deviceId, capturedImage } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const db = getDB();
  const student = db.students.find((s: any) => s.studentId.toLowerCase() === studentId.toLowerCase());

  if (!student) {
    return res.status(404).json({ error: `Student with ID "${studentId}" not found` });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  // Prevent Duplicate Attendance on the same day!
  const existingRecord = db.attendance.find((a: any) => a.studentId.toLowerCase() === studentId.toLowerCase() && a.date === todayStr);

  if (existingRecord) {
    return res.json({
      duplicate: true,
      message: `Attendance for ${student.fullName} (${studentId}) is ALREADY marked for today (${todayStr}) at ${existingRecord.time}.`,
      record: existingRecord,
    });
  }

  // Determine status (Late if after 09:00 AM)
  const hour = new Date().getHours();
  const status = hour >= 9 ? 'LATE' : 'PRESENT';

  const newRecord = {
    id: 'att_' + Date.now(),
    studentId: student.studentId,
    studentName: student.fullName,
    department: student.department,
    year: student.year,
    section: student.section,
    date: todayStr,
    time: nowTime,
    status,
    confidence: confidence || 95.0,
    deviceId: deviceId || db.settings.kioskDeviceName,
    capturedImage: capturedImage || '',
  };

  db.attendance.unshift(newRecord);
  addLog(db, 'SYSTEM_KIOSK', 'TEACHER', 'ATTENDANCE_MARKED', `Attendance marked for ${student.fullName} (${student.studentId}) - Status: ${status} (${confidence || 95}%)`, req.ip);
  saveDB(db);

  res.status(201).json({ duplicate: false, message: `Attendance marked successfully for ${student.fullName}!`, record: newRecord });
});

// Logs Endpoint
app.get('/api/logs', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDB();
  res.json(db.auditLogs);
});

// Settings Get & Post
app.get('/api/settings', requireAuth, (req, res) => {
  const db = getDB();
  res.json(db.settings);
});

app.post('/api/settings', requireAuth, (req, res) => {
  if (!['ADMIN', 'TEACHER'].includes((req as any).user.role)) return res.status(403).json({ error: 'Forbidden' });
  const db = getDB();
  db.settings = { ...db.settings, ...req.body };
  addLog(db, 'admin', 'ADMIN', 'SETTINGS_UPDATED', 'Updated system configurations', req.ip);
  saveDB(db);

  res.json(db.settings);
});

// Backup & Restore Routes
app.get('/api/database/backup', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const db = getDB();
  const exportData = {
    exportDate: new Date().toISOString(),
    system: 'SmartFace AI Enterprise',
    version: '2.4.0',
    data: db,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=SmartFace_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  res.send(JSON.stringify(exportData, null, 2));
});

app.post('/api/database/restore', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { restoredData } = req.body;
  if (!restoredData || !restoredData.users || !restoredData.students || !restoredData.attendance) {
    return res.status(400).json({ error: 'Invalid database backup payload format' });
  }

  saveDB(restoredData);
  res.json({ success: true, message: 'Database state restored successfully!' });
});


// Mock Student Endpoints
app.get('/api/leave-requests', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
  res.json([]);
});
app.post('/api/leave-requests', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
  res.status(201).json({ success: true, message: 'Request submitted successfully' });
});
app.get('/api/notifications', requireAuth, (req, res) => {
  if ((req as any).user.role !== 'STUDENT') return res.status(403).json({ error: 'Forbidden' });
  res.json([
    { id: 'n1', studentId: (req as any).user.id, title: 'Welcome', message: 'Welcome to SmartFace Portal!', type: 'INFO', createdAt: new Date().toISOString(), read: false }
  ]);
});

// Start Server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartFace AI Enterprise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
