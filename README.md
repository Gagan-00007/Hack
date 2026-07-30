# SmartFace AI – Enterprise Face Recognition Attendance Management System

**SmartFace AI** is a commercial-grade, full-stack biometric attendance management system engineered for enterprise corporations, universities, and research institutes.

---

## 🌟 Key Features

### 1. 🔒 Role-Based Access Control (RBAC) & Security
- **Administrator**: Full privileges including student registration, face capture, teacher account management, database backups/restores, audit logs, and settings.
- **Teacher**: Restricted privileges for initiating live face scanner kiosks, viewing attendance logs, searching records, and generating reports.
- **Security Protocols**: SHA-256 hashed password storage, session verification, input sanitization, and detailed audit logging for every system action.

### 2. 📷 Real Webcam Facial Registration (Strictly No Synthetic AI)
- **Zero AI-Generated Faces**: Operates strictly on real human faces captured through live webcam feeds.
- **Interactive Guided Angles**: Step-by-step head rotation guidance (Look Straight, Turn Left, Turn Right, Tilt Up, Tilt Down) extracting 20–40 real facial frame samples.
- **128-Dimensional Vector Extraction**: Computes normalized facial feature descriptors stored securely in the database.

### 3. ⚡ Real-Time Face Recognition Kiosk
- **Continuous Webcam Scanner**: Detects faces live on HTML5 canvas with real-time vector distance calculation.
- **Visual Bounding Indicators**:
  - 🟩 **Green Bounding Box**: Recognized student with Name, ID, Department, and Match Confidence %.
  - 🟥 **Red Bounding Box**: Unknown person warning indicator.
- **Anti-Duplicate Attendance**: Automatically prevents duplicate attendance logs for the same student on the same calendar day.
- **Audio Feedback**: Synthetics chimes for successful attendance checks and warning tones for unknown persons.

### 4. 📊 Analytics, Reports & Export Hub
- **Interactive Graphs**: Powered by Recharts (Weekly attendance trends, Department comparisons, Turnout ratios).
- **Multi-Format Reports**:
  - **PDF Reports**: Formal corporate document layout with official headers, metrics, and page numbers.
  - **Excel XLSX**: Styled spreadsheets with executive summaries and itemized logs.
  - **CSV**: Structured downloadable data files.

### 5. 💾 Database Management & Backup
- **JSON / SQLite Storage Engine**: Complete database persistence with full REST API endpoint integration.
- **State Backup & Restoration**: One-click download of JSON database snapshots and restoration uploads.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti.
- **Computer Vision & Biometrics**: `@vladmandic/face-api`, HTML5 Canvas API, Web Audio API.
- **Backend**: Node.js, Express, `tsx`, `esbuild`, Crypto.
- **Document Export**: `jspdf`, `jspdf-autotable`, SheetJS `xlsx`.

---

## 📁 Folder Structure

```
SmartFaceAI/
├── server.ts                 # Express REST API backend & database persistence engine
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Primary layout & tab navigation
│   ├── types.ts              # TypeScript interface definitions
│   ├── components/
│   │   ├── Header.tsx        # Enterprise top navigation & clock
│   │   ├── Sidebar.tsx       # Collapsible role-based sidebar
│   │   ├── Dashboard.tsx     # Executive analytics dashboard
│   │   ├── Registration.tsx  # Guided webcam face capture & registration
│   │   ├── Recognition.tsx   # Real-time face recognition kiosk
│   │   ├── StudentManagement.tsx # Student directory & dataset viewer
│   │   ├── TeacherManagement.tsx # Faculty account manager (Admin)
│   │   ├── AttendanceModule.tsx  # Attendance audit logs & filter engine
│   │   ├── ReportsModule.tsx     # PDF, XLSX, CSV export hub
│   │   ├── AnalyticsModule.tsx   # Recharts visual analytics
│   │   ├── SettingsModule.tsx    # DB backup, restore, password reset, audit logs
│   │   └── LoginModal.tsx        # Enterprise login screen
│   └── utils/
│       ├── faceUtils.ts      # 128-d vector extraction & similarity matching
│       ├── exportUtils.ts    # PDF, Excel, and CSV generator engines
│       └── audioUtils.ts     # Synthetics audio chimes
├── database/
│   └── smartface_db.json     # Primary JSON database store
├── dataset/                  # Saved real face image frame crops
├── metadata.json
├── package.json
└── README.md
```

---

## 🔑 Demo Login Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |
| **Teacher** | `teacher_smith` | `teacher123` |

---

## 📄 License & Author

**SmartFace AI Enterprise** — Built for high-volume enterprise attendance management and biometric security compliance.
