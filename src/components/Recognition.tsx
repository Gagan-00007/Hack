import React, { useState, useRef, useEffect } from 'react';
import { extractFaceEncoding, matchFaceDescriptor, loadFaceApiModels } from '../utils/faceUtils';
import { playSuccessChime, playUnknownAlertBeep } from '../utils/audioUtils';
import { AttendanceRecord, Student } from '../types';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const Recognition: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLogs, setRecentLogs] = useState<AttendanceRecord[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(65);
  
  // Kiosk Device Tracking
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceConfigured, setDeviceConfigured] = useState<boolean>(false);

  // Recognition outcome state
  const [activeDetection, setActiveDetection] = useState<{
    recognized: boolean;
    studentId?: string;
    studentName?: string;
    department?: string;
    confidence?: number;
    duplicate?: boolean;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Anti-debounce state: prevent logging attendance more than once every 5 seconds for the same person in live loop
  const lastMarkedMapRef = useRef<Record<string, number>>({});

  useEffect(() => {
    loadFaceApiModels();
    fetchStudentsAndLogs();

    return () => {
      stopCamera();
    };
  }, []);

  const fetchStudentsAndLogs = async () => {
    try {
      const [stuRes, attRes, setRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance'),
        fetch('/api/settings'),
      ]);

      if (stuRes.ok) {
        const stuData = await stuRes.json();
        setStudents(stuData);
      }
      if (attRes.ok) {
        const attData = await attRes.json();
        setRecentLogs(attData.slice(0, 15));
      }
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.strictModeConfidence) {
          setConfidenceThreshold(setData.strictModeConfidence);
        }
      }
    } catch (err) {
      console.error('Failed to load students for face recognition:', err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Failed to start camera for recognition:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Continuous Scanner Loop
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;

    if (isScanning && videoRef.current) {
      scanInterval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        const result = await extractFaceEncoding(videoRef.current);
        const canvas = canvasRef.current;

        if (canvas && videoRef.current) {
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (result && result.descriptor) {
              // Match against registered student encodings
              const match = matchFaceDescriptor(result.descriptor, students, confidenceThreshold);

              if (match) {
                // RECOGNISED STUDENT -> Draw GREEN Bounding Box
                ctx.strokeStyle = '#22c55e'; // Green
                ctx.lineWidth = 4;
                ctx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);

                // Label Tag
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(result.box.x, Math.max(0, result.box.y - 28), result.box.width, 28);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillText(
                  `${match.fullName} (${match.confidence}%)`,
                  result.box.x + 6,
                  Math.max(18, result.box.y - 10)
                );

                // Auto Mark Attendance
                const nowMs = Date.now();
                const lastMarked = lastMarkedMapRef.current[match.studentId] || 0;

                if (nowMs - lastMarked > 5000) {
                  lastMarkedMapRef.current[match.studentId] = nowMs;
                  markAttendanceOnServer(match.studentId, match.confidence, result.croppedDataUrl);
                }
              } else {
                // UNKNOWN PERSON -> Draw RED Bounding Box
                ctx.strokeStyle = '#ef4444'; // Red
                ctx.lineWidth = 4;
                ctx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);

                ctx.fillStyle = '#ef4444';
                ctx.fillRect(result.box.x, Math.max(0, result.box.y - 28), result.box.width, 28);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillText('UNKNOWN PERSON', result.box.x + 6, Math.max(18, result.box.y - 10));

                setActiveDetection({
                  recognized: false,
                });

                if (audioEnabled) playUnknownAlertBeep();
              }
            } else {
              setActiveDetection(null);
            }
          }
        }
      }, 350); // Continuous scan every 350ms
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [isScanning, students, audioEnabled]);

  // Server API call to mark attendance
  const markAttendanceOnServer = async (studentId: string, confidence: number, capturedImage: string) => {
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          confidence,
          capturedImage,
          deviceId: deviceName || 'Unknown Kiosk',
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.duplicate) {
          // Already marked today
          setActiveDetection({
            recognized: true,
            studentId,
            studentName: data.record.studentName,
            department: data.record.department,
            confidence,
            duplicate: true,
          });
        } else {
          // Successfully marked
          setActiveDetection({
            recognized: true,
            studentId,
            studentName: data.record.studentName,
            department: data.record.department,
            confidence,
            duplicate: false,
          });

          if (audioEnabled) playSuccessChime();

          // Refresh logs stream
          setRecentLogs((prev) => [data.record, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  if (!deviceConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Camera className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Configure Kiosk</h2>
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8">
            Please enter a location or device tag so attendance scans can be tracked to this physical device.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Device / Location Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Main Gate, Library Entrance, Phone 1"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                autoFocus
              />
            </div>
            
            <button
              onClick={() => deviceName.trim() && setDeviceConfigured(true)}
              disabled={!deviceName.trim()}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Initialize Scanner
            </button>
            
            {onClose && (
               <button
                 onClick={onClose}
                 className="w-full py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-sm transition-colors"
               >
                 Cancel & Return to Dashboard
               </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{deviceName} — Real-Time Biometric Kiosk</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Continuous webcam facial scanner with real-time vector matching and duplicate prevention.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={audioEnabled ? 'Mute Chimes' : 'Enable Audio Chimes'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {!isScanning ? (
            <button
              onClick={startCamera}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>Pause Kiosk Scanner</span>
            </button>
          )}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl shadow-sm transition-all sm:ml-4 sm:border-l sm:border-slate-300 sm:dark:border-slate-700"
              >
                <span>Exit Kiosk Mode</span>
              </button>
            )}
          </div>
        </div>

      {/* Main Kiosk Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Video Stream & Detection Badge */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
            />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 space-y-3">
                <Camera className="w-12 h-12 text-blue-500 animate-pulse" />
                <div className="text-sm font-bold text-white">Camera Scanner Suspended</div>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click "Start Camera Scanner" to begin live biometric face identification.
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Live Indicator Badge */}
            {isScanning && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-mono font-bold flex items-center space-x-2 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>SCANNER LIVE (HIGH PRECISION)</span>
              </div>
            )}
          </div>

          {/* Active Detection Banner */}
          {activeDetection && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold shadow-xs flex items-center justify-between animate-in fade-in ${
                activeDetection.recognized
                  ? activeDetection.duplicate
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {activeDetection.recognized ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-extrabold text-sm">
                    {activeDetection.recognized ? activeDetection.studentName : 'UNKNOWN PERSON'}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {activeDetection.recognized
                      ? `${activeDetection.studentId} • ${activeDetection.department} • Match Confidence: ${activeDetection.confidence}%`
                      : 'Facial descriptor does not match any registered student in database.'}
                  </div>
                </div>
              </div>

              {activeDetection.recognized && (
                <span
                  className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase ${
                    activeDetection.duplicate
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                      : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                  }`}
                >
                  {activeDetection.duplicate ? 'Already Marked Today' : 'Attendance Logged'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Attendance Check-ins Feed */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Today's Verified Check-Ins</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">{recentLogs.length} Records</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {recentLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No attendance scans recorded yet today.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    {log.capturedImage ? (
                      <img
                        src={log.capturedImage}
                        alt="Crop"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-600 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                        {log.studentName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{log.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.studentId} • {log.department}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                        log.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {log.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
