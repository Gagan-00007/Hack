import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { extractFaceEncoding, loadFaceApiModels } from '../utils/faceUtils';
import { playRegistrationFanfare } from '../utils/audioUtils';
import {
  UserPlus,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  Video,
  VideoOff,
} from 'lucide-react';

export const Registration: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    department: 'Computer Science',
    year: '1st Year',
    section: 'Sec-A',
    rollNumber: '',
    email: '',
    phoneNumber: '',
  });

  // Step state: 1 = Form, 2 = Face Capture, 3 = Completed
  const [step, setStep] = useState<number>(1);

  // Capture State
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [capturedEncodings, setCapturedEncodings] = useState<number[][]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<string>('Look Straight at the Camera');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const TOTAL_REQUIRED_SAMPLES = 30;

  const instructionsList = [
    { text: 'Look Straight at the Camera', range: [0, 6] },
    { text: 'Slowly Turn Your Head to the Left ⬅️', range: [6, 12] },
    { text: 'Slowly Turn Your Head to the Right ➡️', range: [12, 18] },
    { text: 'Slowly Tilt Your Head Up ⬆️', range: [18, 24] },
    { text: 'Slowly Tilt Your Head Down ⬇️', range: [24, 30] },
  ];

  useEffect(() => {
    loadFaceApiModels();
    return () => {
      stopWebcam();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage(null);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMessage('Camera access failed. Please ensure webcam permissions are granted.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCaptureProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId.trim() || !formData.fullName.trim()) {
      setErrorMessage('Please fill in Student ID and Full Name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Verify duplicate ID on server first
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const students = await res.json();
        const dup = students.find((s: any) => s.studentId.toLowerCase() === formData.studentId.trim().toLowerCase());
        if (dup) {
          setErrorMessage(`Student ID "${formData.studentId}" already exists in the database!`);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
    }

    setStep(2);
    setLoading(false);
    await startWebcam();
  };

  // Automatic Face Capture Loop
  useEffect(() => {
    let captureInterval: NodeJS.Timeout | null = null;

    if (step === 2 && videoRef.current) {
      setIsCapturing(true);

      captureInterval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        // Determine current angle instruction
        setCapturedCount((count) => {
          if (count >= TOTAL_REQUIRED_SAMPLES) {
            if (captureInterval) clearInterval(captureInterval);
            setIsCapturing(false);
            return count;
          }

          const currentGuide = instructionsList.find((inst) => count >= inst.range[0] && count < inst.range[1]);
          if (currentGuide) {
            setCurrentInstruction(currentGuide.text);
          }

          // Process Frame and Extract Real Face Encoding & Image Sample
          extractFaceEncoding(videoRef.current!).then((result) => {
            if (result && result.descriptor && result.croppedDataUrl) {
              setCapturedEncodings((prev) => [...prev, result.descriptor]);
              setCapturedImages((prev) => [...prev, result.croppedDataUrl]);

              // Draw bounding box on canvas overlay
              if (canvasOverlayRef.current && videoRef.current) {
                const canvas = canvasOverlayRef.current;
                canvas.width = videoRef.current.videoWidth || 640;
                canvas.height = videoRef.current.videoHeight || 480;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.strokeStyle = '#22c55e'; // Green
                  ctx.lineWidth = 3;
                  ctx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);
                  ctx.fillStyle = '#22c55e';
                  ctx.font = 'bold 12px Inter, sans-serif';
                  ctx.fillText('Capturing Real Face Frame', result.box.x, Math.max(15, result.box.y - 8));
                }
              }
            }
          });

          return count + 1;
        });
      }, 250); // Capture frame every 250ms
    }

    return () => {
      if (captureInterval) clearInterval(captureInterval);
    };
  }, [step]);

  // Submit Completed Registration to Backend
  const handleSubmitFinalRegistration = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        rollNumber: formData.rollNumber || `RN-${formData.studentId}`,
        faceEncodings: capturedEncodings,
        datasetImages: capturedImages.slice(0, 15), // Save top 15 real cropped images in dataset
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      // Success
      stopWebcam();
      setStep(3);
      playRegistrationFanfare();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setSuccessMessage(`Student ${formData.fullName} (${formData.studentId}) registered successfully!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopWebcam();
    setStep(1);
    setCapturedCount(0);
    setCapturedImages([]);
    setCapturedEncodings([]);
    setFormData({
      studentId: '',
      fullName: '',
      department: 'Computer Science',
      year: '1st Year',
      section: 'Sec-A',
      rollNumber: '',
      email: '',
      phoneNumber: '',
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const progressPercentage = Math.min(100, Math.round((capturedCount / TOTAL_REQUIRED_SAMPLES) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Student Biometric Registration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manual detail entry + Guided real webcam facial sample extraction (20–40 frames).
            </p>
          </div>
        </div>

        {/* Wizard Steps Bar */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className={`p-2.5 rounded-xl border text-xs font-bold text-center ${step === 1 ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            1. Student Info
          </div>
          <div className={`p-2.5 rounded-xl border text-xs font-bold text-center ${step === 2 ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            2. Real Face Capture
          </div>
          <div className={`p-2.5 rounded-xl border text-xs font-bold text-center ${step === 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            3. Registration Complete
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Student Details Form */}
      {step === 1 && (
        <form onSubmit={handleStartCaptureProcess} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Student Personal & Academic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student ID *
              </label>
              <input
                type="text"
                name="studentId"
                required
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="e.g. STU-2026-089"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                placeholder="Sec-A"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                placeholder="e.g. CS-104"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>Proceed to Webcam Capture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Guided Webcam Real Face Capture */}
      {step === 2 && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Facial Sample Extraction for {formData.fullName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ensure good lighting. Follow the on-screen head movement prompts.
              </p>
            </div>
            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-mono font-bold">
              {capturedCount} / {TOTAL_REQUIRED_SAMPLES} Frames
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">{currentInstruction}</span>
              <span>{progressPercentage}% Completed</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Video & Canvas Overlay */}
          <div className="relative w-full max-w-lg mx-auto aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <canvas
              ref={canvasOverlayRef}
              className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
            />

            {/* Target Guidance Overlay Box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-dashed border-blue-400/60 rounded-3xl animate-pulse" />
            </div>

            {/* Live Instruction Pill */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900/90 text-white text-xs font-bold rounded-full border border-slate-700 shadow-lg backdrop-blur-xs">
              {currentInstruction}
            </div>
          </div>

          {/* Captured Real Face Thumbnails Carousel */}
          {capturedImages.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Captured Real Face Samples ({capturedImages.length}):
              </div>
              <div className="flex space-x-2 overflow-x-auto py-2">
                {capturedImages.slice(-10).map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt={`Sample ${i}`}
                    className="w-14 h-14 object-cover rounded-xl border-2 border-emerald-500 shadow-xs shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                stopWebcam();
                setStep(1);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Back to Form
            </button>

            {capturedCount >= TOTAL_REQUIRED_SAMPLES && (
              <button
                onClick={handleSubmitFinalRegistration}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all animate-bounce"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Student & Complete Registration</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Completed Success Screen */}
      {step === 3 && (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Student Registered Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Real facial encodings and dataset frame samples have been securely saved to the database.
            </p>
          </div>

          <div className="p-4 max-w-md mx-auto bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left text-xs space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Student ID:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.studentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="text-slate-800 dark:text-slate-200">{formData.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Encodings Saved:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{capturedEncodings.length} Real Encodings</span>
            </div>
          </div>

          <div className="pt-4 flex justify-center space-x-4">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Another Student</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
