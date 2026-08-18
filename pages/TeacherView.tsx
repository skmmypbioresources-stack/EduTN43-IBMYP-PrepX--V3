import React, { useState, useEffect } from 'react';
import { QrCode, Save, Clock, XCircle, CheckCircle, Search, ArrowLeft, Sun, Moon, AlertTriangle, X, Calendar, History, Eye, Loader2, Lock, Edit3, Image as ImageIcon, ShieldCheck, KeyRound, Smartphone, MonitorX, Filter, LogOut } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { ClassSection, StudentAttendanceRecord, AttendanceStatus, SessionType, DisciplinaryRecord, Wing } from '../types';
import { MOCK_TEACHERS, TEACHERS_LIST } from '../constants';
import { saveAttendanceLog, saveDisciplinaryRecord, getDisciplinaryRecordsForToday, getClasses, getAppSettings, getExistingLogForClass, getTimetableImage, isDeviceTrusted, trustDevice } from '../services/storageService';

interface TeacherViewProps {
  autoSelectedClassId?: string | null;
  onLogout: () => void;
}

// --- COLOR THEMES FOR WINGS ---
const WING_THEME: Record<Wing, {
    primary: string;
    hover: string;
    light: string;
    text: string;
    border: string;
    shadow: string;
    icon: string;
}> = {
    MYP: { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', shadow: 'shadow-blue-200', icon: 'text-blue-600' },
    MS: { primary: 'bg-indigo-600', hover: 'hover:bg-indigo-700', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', shadow: 'shadow-indigo-200', icon: 'text-indigo-600' },
    HS: { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', shadow: 'shadow-purple-200', icon: 'text-purple-600' },
    HSS: { primary: 'bg-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', shadow: 'shadow-rose-200', icon: 'text-rose-600' }
};

const TeacherView: React.FC<TeacherViewProps> = ({ autoSelectedClassId, onLogout }) => {
  // Security State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [selectedWing, setSelectedWing] = useState<Wing>('MYP'); // Default Wing
  const [selectedClass, setSelectedClass] = useState<ClassSection | null>(null);
  const [teacherName, setTeacherName] = useState(MOCK_TEACHERS[0]);
  const [session, setSession] = useState<SessionType>('Evening'); // Default to Evening now
  const [records, setRecords] = useState<Record<string, StudentAttendanceRecord>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Submission States
  const [submittedOverlay, setSubmittedOverlay] = useState(false);
  const [isClassSubmitted, setIsClassSubmitted] = useState(false); // Persistent state for the current class
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Settings State
  const [isMorningLocked, setIsMorningLocked] = useState(true);

  // Disciplinary Modal State
  const [reportingStudent, setReportingStudent] = useState<{id: string, name: string} | null>(null);
  const [reportDescription, setReportDescription] = useState('');

  // History / Status State
  const [showHistory, setShowHistory] = useState(false);
  const [myReports, setMyReports] = useState<DisciplinaryRecord[]>([]);

  // Timetable State
  const [showTimetable, setShowTimetable] = useState(false);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);

  // Class Data
  const [availableClasses, setAvailableClasses] = useState<ClassSection[]>([]);
  const [showManualSelection, setShowManualSelection] = useState(false); // HIDDEN BY DEFAULT TO FORCE SCANNING
  
  // Real-time Firebase Sync trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('storageService_classUpdate', handler);
    window.addEventListener('storageService_settingsUpdate', handler);
    window.addEventListener('storageService_timetableUpdate', handler);
    window.addEventListener('storageService_discUpdate', handler);
    window.addEventListener('storageService_logsUpdate', handler);
    return () => {
      window.removeEventListener('storageService_classUpdate', handler);
      window.removeEventListener('storageService_settingsUpdate', handler);
      window.removeEventListener('storageService_timetableUpdate', handler);
      window.removeEventListener('storageService_discUpdate', handler);
      window.removeEventListener('storageService_logsUpdate', handler);
    };
  }, []);

  // Current Theme based on selected Wing
  const theme = WING_THEME[selectedWing];

  // Refresh reports and settings on load
  useEffect(() => {
    // 1. Check Security Trust
    if (isDeviceTrusted()) {
        setIsAuthorized(true);
    } else {
        setIsAuthorized(false);
    }

    // 2. Load Class Data
    setAvailableClasses(getClasses());

    // 3. Check Lock Settings
    const settings = getAppSettings();
    setIsMorningLocked(settings.isMorningLocked);
    if (settings.isMorningLocked) {
      setSession('Evening');
    }
    
    // 4. Load Timetable for selected wing
    setTimetableImage(getTimetableImage(selectedWing));

    if (showHistory) {
      const allRecords = getDisciplinaryRecordsForToday();
      // Filter records reported by the current teacher
      setMyReports(allRecords.filter(r => r.reportedBy === teacherName));
    }
  }, [showHistory, teacherName, refreshTrigger, selectedWing]);

  // Update timetable when wing changes
  useEffect(() => {
      setTimetableImage(getTimetableImage(selectedWing));
  }, [selectedWing]);

  // Handle Auto-Launch from Smart Cover (QR URL)
  useEffect(() => {
      // Only proceed if authorized AND autoSelectedClassId is present
      if (isAuthorized && autoSelectedClassId && !selectedClass) {
          const allClasses = getClasses();
          const targetClass = allClasses.find(c => c.id === autoSelectedClassId);
          if (targetClass) {
              // Set wing automatically
              setSelectedWing(targetClass.wing);
              handleScan(targetClass);
          }
      }
  }, [autoSelectedClassId, isAuthorized]);

  const verifyTeacherPin = () => {
      const settings = getAppSettings();
      const validPin = settings.teacherAccessPin || '8899';
      
      if (pinInput === validPin) {
          trustDevice();
          setIsAuthorized(true);
      } else {
          setPinError(true);
          setPinInput('');
      }
  };

  const handleScan = (cls: ClassSection) => {
    // Re-fetch the class details from storage to ensure we have the latest student list
    const allClasses = getClasses();
    const latestClassData = allClasses.find(c => c.id === cls.id) || cls;

    setSelectedClass(latestClassData);
    setIsScanning(false);
    
    // Check if a log already exists for this class + session today
    const existingLog = getExistingLogForClass(latestClassData.id, session);
    
    if (existingLog) {
        // EDIT MODE: Load existing data
        setIsEditMode(true);
        setIsClassSubmitted(false); // Allow them to edit it, but don't show "Submitted" disabled state yet
        setTeacherName(existingLog.teacherName); // Set to the teacher who originally marked it (optional, but good for context)
        
        const loadedRecords: Record<string, StudentAttendanceRecord> = {};
        existingLog.records.forEach(r => {
            loadedRecords[r.studentId] = r;
        });
        
        // Ensure any *new* students added to class since then are initialized
        latestClassData.students.forEach(s => {
            if (!loadedRecords[s.id]) {
                loadedRecords[s.id] = { studentId: s.id, status: AttendanceStatus.PRESENT };
            }
        });
        
        setRecords(loadedRecords);
    } else {
        // NEW MODE
        setIsEditMode(false);
        setIsClassSubmitted(false);
        // Initialize records as Present
        const initialRecords: Record<string, StudentAttendanceRecord> = {};
        latestClassData.students.forEach(s => {
          initialRecords[s.id] = { studentId: s.id, status: AttendanceStatus.PRESENT };
        });
        setRecords(initialRecords);
    }
    
    setSubmittedOverlay(false);
  };

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    if (isClassSubmitted) return; // Prevent edits after submission
    setRecords(prev => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: { 
          ...current, 
          status, 
          reason: status === AttendanceStatus.PRESENT ? undefined : current.reason 
        }
      };
    });
  };

  const updateReason = (studentId: string, reason: string) => {
    if (isClassSubmitted) return;
    setRecords(prev => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: { ...current, reason }
      };
    });
  };

  const markAllPresent = () => {
    if (!selectedClass || isClassSubmitted) return;
    setIsMarkingAll(true);
    const newRecords: Record<string, StudentAttendanceRecord> = {};
    selectedClass.students.forEach(s => {
      newRecords[s.id] = { studentId: s.id, status: AttendanceStatus.PRESENT };
    });
    setRecords(newRecords);
    setTimeout(() => setIsMarkingAll(false), 300);
  };

  const handleSubmitAttendance = () => {
    if (!selectedClass) return;

    // Validation: Check if Late/Absent have reasons
    const missingReason = Object.values(records).find(
      (r: StudentAttendanceRecord) => (r.status === AttendanceStatus.ABSENT || r.status === AttendanceStatus.LATE) && !r.reason?.trim()
    );

    if (missingReason) {
      alert("Please provide a reason for all Late or Absent students.");
      return;
    }

    saveAttendanceLog({
      id: Date.now().toString(),
      classId: selectedClass.id,
      timestamp: Date.now(),
      session,
      teacherName,
      records: Object.values(records) as StudentAttendanceRecord[]
    });

    // 1. Show Overlay Animation
    setSubmittedOverlay(true);
    
    // 2. Set Persistent "Done" State
    setIsClassSubmitted(true);

    // 3. Remove Overlay after delay, but keep "isClassSubmitted" true
    setTimeout(() => {
        setSubmittedOverlay(false);
    }, 2000);
  };

  const handleSaveReport = () => {
    if (!reportingStudent || !selectedClass || !reportDescription.trim()) return;
    
    saveDisciplinaryRecord({
      id: Date.now().toString(),
      studentId: reportingStudent.id,
      studentName: reportingStudent.name,
      classId: selectedClass.id,
      className: `${selectedClass.grade} - ${selectedClass.section}`,
      reportedBy: teacherName,
      description: reportDescription,
      timestamp: Date.now(),
      escalatedToHOS: false // Starts as false
    });

    alert("Incident reported successfully. You can track its status in 'My Reports'.");
    setReportingStudent(null);
    setReportDescription('');
  };

  // Filter classes by Wing
  const filteredClassesByWing = availableClasses.filter(c => c.wing === selectedWing);

  // --- SECURITY INTERCEPTOR (PIN) ---
  if (!isAuthorized) {
      return (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
              <div className="bg-white max-w-sm w-full rounded-2xl p-8 shadow-2xl border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Teacher Authorization</h2>
                  <p className="text-sm text-slate-500 mb-6">
                      To prevent unauthorized access by students, please enter the Teacher PIN.
                      <br/>
                      <span className="font-semibold text-blue-600">You only need to do this once.</span>
                  </p>
                  
                  <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access PIN</label>
                      <input 
                        type="password" 
                        inputMode="numeric"
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                        placeholder="••••"
                        className={`w-full text-center text-2xl font-bold tracking-[0.5em] py-3 border-b-2 outline-none ${pinError ? 'border-rose-500 text-rose-600' : 'border-slate-300 focus:border-blue-500 text-slate-800'}`}
                      />
                      {pinError && <p className="text-xs text-rose-500 mt-2 font-bold animate-pulse">Incorrect PIN</p>}
                  </div>

                  <button 
                    onClick={verifyTeacherPin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                      <KeyRound className="w-4 h-4" />
                      Verify & Trust Device
                  </button>
                  <p className="text-xs text-slate-400 mt-4 italic">Contact Coordinator if you forgot the PIN.</p>
              </div>
          </div>
      );
  }

  if (isScanning) {
    return <QRScanner onScan={handleScan} onClose={() => setIsScanning(false)} />;
  }

  // Initial State: "Scan to Start" (If no class selected yet)
  if (!selectedClass) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 text-center pb-24">
        
        {/* Simplified Header for brevity */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative">
            
             {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setShowTimetable(true)} className={`p-2 text-slate-400 ${theme.hover.replace('bg', 'text')} hover:bg-slate-100 rounded-full relative group`}>
                    <Calendar className="w-6 h-6" />
                    <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">View {selectedWing} Timetable</span>
                </button>
                <button onClick={() => setShowHistory(true)} className={`p-2 text-slate-400 ${theme.hover.replace('bg', 'text')} hover:bg-slate-100 rounded-full`}><History className="w-6 h-6" /></button>
            </div>
            
            {/* Logout Button */}
            <div className="absolute top-4 left-4">
                 <button onClick={onLogout} className="flex items-center gap-1 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                     <LogOut className="w-3 h-3" />
                     Logout
                 </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-8">Prep Duty Check-in</h2>
            <p className="text-slate-500 text-sm mb-6">Select parameters to begin duty.</p>
            
            <div className="space-y-4 mb-6 text-left">
                {/* WING SELECTOR */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Wing</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        {(['MYP', 'MS', 'HS', 'HSS'] as Wing[]).map(wing => (
                            <button
                                key={wing}
                                onClick={() => {
                                    setSelectedWing(wing);
                                    // Reset manual class choice when wing changes
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${selectedWing === wing ? `${WING_THEME[wing].primary} text-white shadow` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                                {wing}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Session Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => !isMorningLocked && setSession('Morning')}
                      disabled={isMorningLocked}
                      className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${isMorningLocked ? 'bg-slate-100 text-slate-400' : session === 'Morning' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-600'}`}
                    >
                      {isMorningLocked ? <Lock className="w-3 h-3"/> : <Sun className="w-3 h-3"/>} Morning
                    </button>
                    <button 
                      onClick={() => setSession('Evening')}
                      className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 ${session === 'Evening' ? `${theme.light} ${theme.text} ${theme.border}` : 'bg-white text-slate-600'}`}
                    >
                      <Moon className="w-3 h-3"/> Evening
                    </button>
                  </div>
                </div>

                {/* Teacher Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                    <select 
                        value={teacherName} 
                        onChange={(e) => setTeacherName(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-800 text-sm"
                    >
                        {TEACHERS_LIST.map(t => (
                            <option key={t.id} value={t.code}>
                                {t.code} — {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Manual Class Selector (Filtered) - HIDDEN BY DEFAULT */}
                {showManualSelection && (
                    <div className="animate-in fade-in slide-in-from-top-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Class Manually</label>
                         <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                            {filteredClassesByWing.map(cls => (
                                <button
                                key={cls.id}
                                onClick={() => handleScan(cls)}
                                className={`flex flex-col items-center justify-center p-2 border rounded-lg hover:bg-slate-50 ${theme.hover.replace('bg', 'border')} transition-colors bg-white text-center`}
                                >
                                    <span className="text-xs font-bold text-slate-700">{cls.grade}</span>
                                    <span className="text-[10px] text-slate-500">Sec {cls.section}</span>
                                </button>
                            ))}
                         </div>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
                <button
                onClick={() => setIsScanning(true)}
                className={`w-full ${theme.primary} ${theme.hover} text-white font-bold py-5 px-6 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-xl shadow-slate-200 text-lg animate-pulse`}
                >
                    <QrCode className="w-8 h-8 mr-3" />
                    SCAN QR CODE
                </button>

                {!showManualSelection && (
                    <button 
                        onClick={() => setShowManualSelection(true)}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                        Trouble scanning? Select class manually.
                    </button>
                )}
            </div>
        </div>
      </div>
    );
  }

  // Attendance Form (Render logic remains same)
  // ... (Keeping existing attendance form render code from previous version, just ensuring types are correct)
  
  const filteredStudents = selectedClass.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const total = selectedClass.students.length;
  const present = Object.values(records).filter((r: StudentAttendanceRecord) => r.status === AttendanceStatus.PRESENT).length;
  const absent = Object.values(records).filter((r: StudentAttendanceRecord) => r.status === AttendanceStatus.ABSENT).length;
  const late = Object.values(records).filter((r: StudentAttendanceRecord) => r.status === AttendanceStatus.LATE).length;

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      {/* Timetable Modal */}
      {showTimetable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-4xl rounded-2xl p-2 relative">
                  <button onClick={() => setShowTimetable(false)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white z-10"><X className="w-6 h-6"/></button>
                  <h3 className={`text-center font-bold text-lg py-2 ${theme.text}`}>{selectedWing} Timetable</h3>
                  {timetableImage ? (
                      <img src={timetableImage} alt="Timetable" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                  ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400">No Timetable Uploaded for {selectedWing}</div>
                  )}
              </div>
          </div>
      )}

      {/* History Modal */}
      {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-xl">My Reports Today</h3>
                      <button onClick={() => setShowHistory(false)}><X className="w-6 h-6"/></button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                      {myReports.length === 0 ? <p className="text-slate-400 text-center py-8">No reports submitted by you today.</p> : (
                          myReports.map(r => (
                              <div key={r.id} className="border p-3 rounded-lg bg-slate-50">
                                  <div className="flex justify-between font-bold text-sm">
                                      <span>{r.studentName} ({r.className})</span>
                                      <span className={r.escalatedToHOS ? "text-emerald-600" : "text-amber-600"}>{r.escalatedToHOS ? "Reviewed" : "Sent"}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 italic">"{r.description}"</p>
                              </div>
                          ))
                      )}
                  </div>
             </div>
          </div>
      )}

      {/* Submitted Overlay */}
      {submittedOverlay && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold text-white mb-2">Submitted!</h2>
             </div>
           </div>
      )}

      {/* Incident Reporting Modal */}
       {reportingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Report Issue</h3>
                        <p className="text-slate-500 text-sm">Logging incident for <span className="font-semibold text-slate-800">{reportingStudent.name}</span></p>
                    </div>
                    <button onClick={() => setReportingStudent(null)} className="p-1 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Describe issue..."
                    className="w-full p-3 border border-slate-300 rounded-xl mb-4 h-32 resize-none"
                />

                <button 
                    onClick={handleSaveReport}
                    disabled={!reportDescription.trim()}
                    className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-colors"
                >
                    Save Report
                </button>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedClass(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="text-right">
              <h1 className="text-xl font-bold text-slate-900">{selectedClass.grade} - {selectedClass.section}</h1>
              <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                <span className={`font-medium ${theme.light} ${theme.text} px-2 rounded`}>{selectedClass.wing}</span>
                <span>•</span>
                <span className={`flex items-center ${session === 'Morning' ? 'text-amber-600' : theme.text}`}>
                {session === 'Morning' ? <Sun className="w-3 h-3 mr-1"/> : <Moon className="w-3 h-3 mr-1"/>}
                {session}
                </span>
              </div>
          </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
          <div className="bg-white p-2 rounded-lg border shadow-sm"><div className="text-xs text-slate-500">Total</div><div className="font-bold">{total}</div></div>
          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100"><div className="text-xs text-emerald-600">Present</div><div className="font-bold text-emerald-700">{present}</div></div>
          <div className="bg-rose-50 p-2 rounded-lg border border-rose-100"><div className="text-xs text-rose-600">Absent</div><div className="font-bold text-rose-700">{absent}</div></div>
          <div className="bg-amber-50 p-2 rounded-lg border border-amber-100"><div className="text-xs text-amber-600">Late</div><div className="font-bold text-amber-700">{late}</div></div>
      </div>
      
      {/* Tools */}
      <div className="flex gap-2 mb-4">
        <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isClassSubmitted}
            className={`flex-1 p-3 border rounded-lg outline-none focus:border-${selectedWing === 'MYP' ? 'blue' : selectedWing === 'MS' ? 'indigo' : selectedWing === 'HS' ? 'purple' : 'rose'}-500`}
        />
        <button
            onClick={markAllPresent}
            disabled={isClassSubmitted}
            className={`bg-emerald-100 text-emerald-800 px-4 rounded-lg font-medium whitespace-nowrap ${isMarkingAll ? 'scale-95' : ''} transition-transform`}
        >
            Mark All Present
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredStudents.map(student => {
            const record = records[student.id];
            if (!record) return null;
            return (
                <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                        <div className="font-medium text-slate-800">{student.name} <span className="text-xs text-slate-400">#{student.rollNumber}</span></div>
                        <button onClick={() => setReportingStudent({id: student.id, name: student.name})} className="text-rose-500 text-xs font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100"><AlertTriangle className="w-3 h-3"/> Report</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Status Buttons */}
                        {[AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE].map(status => (
                            <button
                                key={status}
                                onClick={() => updateStatus(student.id, status)}
                                disabled={isClassSubmitted}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide flex-1 ${
                                    record.status === status 
                                    ? (status === AttendanceStatus.PRESENT ? 'bg-emerald-500 text-white' : status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white')
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    {(record.status === AttendanceStatus.ABSENT || record.status === AttendanceStatus.LATE) && (
                        <input
                            type="text"
                            placeholder="Reason required..."
                            value={record.reason || ''}
                            disabled={isClassSubmitted}
                            onChange={(e) => updateReason(student.id, e.target.value)}
                            className="w-full mt-3 p-2 text-sm border border-slate-300 rounded-md outline-none focus:border-indigo-500"
                        />
                    )}
                </div>
            )
        })}
      </div>

      {/* Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t z-30">
        <div className="max-w-3xl mx-auto">
             <button
                onClick={handleSubmitAttendance}
                disabled={isClassSubmitted && !isEditMode}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${
                    isClassSubmitted 
                    ? 'bg-emerald-600 cursor-default' 
                    : `${theme.primary} ${theme.hover} active:scale-95 transition-all`
                }`}
            >
                {isClassSubmitted ? <CheckCircle className="w-5 h-5"/> : <Save className="w-5 h-5"/>}
                {isClassSubmitted ? (isEditMode ? "Updated" : "Submitted") : (isEditMode ? "Update Record" : "Submit Attendance")}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherView;