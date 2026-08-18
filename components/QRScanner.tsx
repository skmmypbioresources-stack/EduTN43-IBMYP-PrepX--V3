import React, { useEffect, useState, useRef } from 'react';
import { Camera, X, ScanLine, Smartphone, Check, Zap, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';
import { getClasses } from '../services/storageService';
import { ClassSection, Wing } from '../types';

interface QRScannerProps {
  onScan: (classData: ClassSection) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedWingFilter, setSelectedWingFilter] = useState<Wing>('MYP');
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Load class data dynamically
    const loadedClasses = getClasses();
    setClasses(loadedClasses);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.warn("Video play error:", e));
            setHasPermission(true);
            setScanning(true);
            requestRef.current = requestAnimationFrame(tick);
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const handleDetectedData = (rawData: string) => {
    console.log("QR Code scanned:", rawData);
    let detectedClassId = rawData.trim();

    try {
      if (rawData.includes('?')) {
        const url = new URL(rawData, window.location.origin);
        const classIdParam = url.searchParams.get('classId');
        if (classIdParam) detectedClassId = classIdParam;
      }
    } catch (e) {
      // Not a valid URL, use raw string
    }

    const cleanId = detectedClassId.toLowerCase();
    const foundClass = classes.find(c =>
      c.id.toLowerCase() === cleanId ||
      `${c.grade}-${c.section}`.toLowerCase().replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')
    );

    if (foundClass) {
      // Haptic feedback if supported on mobile
      if (navigator.vibrate) {
        try { navigator.vibrate(100); } catch (e) {}
      }
      setScannedSuccess(`${foundClass.grade} - ${foundClass.section}`);
      setTimeout(() => {
        onScan(foundClass);
      }, 300);
    }
  };

  const tick = () => {
    if (scannedSuccess) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.height = video.videoHeight || 480;
        canvas.width = video.videoWidth || 640;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (typeof jsQR === 'function') {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleDetectedData(code.data);
            return; // Stop scan loop
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const filteredClasses = classes.filter(c => c.wing === selectedWingFilter);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      {/* Hidden Canvas for QR Analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-black/70 backdrop-blur-md absolute top-0 w-full z-20 text-white border-b border-white/10">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 animate-pulse text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold">Scan Classroom QR</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {hasPermission === false ? (
          <div className="text-center p-6 text-white max-w-sm z-10 bg-slate-900/90 rounded-2xl border border-slate-800 mx-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
            <h3 className="font-bold text-lg mb-1">Camera Permission Needed</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please allow camera access in your browser settings to scan QR cards directly. You can also select the class manually below.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Viewfinder Reticle */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-emerald-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex items-center justify-center">
              <div className="w-full h-0.5 bg-emerald-400 absolute animate-pulse shadow-[0_0_8px_#34d399] top-1/2" />
              {scannedSuccess ? (
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-xl animate-in zoom-in">
                  <Check className="w-5 h-5" />
                  <span>{scannedSuccess} Scanned!</span>
                </div>
              ) : (
                <p className="absolute -bottom-8 text-white/90 text-xs font-semibold uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Align QR within box
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Manual Quick Fallback Grid */}
      <div className="bg-white p-4 sm:p-5 rounded-t-3xl shadow-2xl z-20 max-h-[45vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-slate-700" />
            Direct Class Selection
          </p>
          {/* Wing Filter Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(['MYP', 'MS', 'HS', 'HSS'] as Wing[]).map(w => (
              <button
                key={w}
                onClick={() => setSelectedWingFilter(w)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedWingFilter === w ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto pr-1">
          {filteredClasses.map(cls => (
            <button
              key={cls.id}
              onClick={() => onScan(cls)}
              className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl transition-all active:scale-95 text-center group"
            >
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">{cls.grade}</span>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-emerald-600">Sec {cls.section}</span>
            </button>
          ))}
          {filteredClasses.length === 0 && (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              No classes configured for this wing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
