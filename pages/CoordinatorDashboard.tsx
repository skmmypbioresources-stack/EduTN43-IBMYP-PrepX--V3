import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, AlertCircle, TrendingUp, Users, Calendar, Download, PlusCircle, X, ShieldAlert, ArrowUpRight, CheckCircle, Loader2, Save, Trash2, UserPlus, Search, Settings, Lock, Unlock, Image as ImageIcon, UploadCloud, QrCode, Printer, Archive, Database, RefreshCcw, KeyRound, Clock, User, FileBarChart, PenSquare, LayoutGrid, RotateCcw, AlertTriangle, ArrowRightLeft, Shuffle, ListPlus, ArrowUpDown, Sparkles, Check, Edit3, Globe, ExternalLink } from 'lucide-react';
import { getLogsForToday, getLogsByMonth, saveDisciplinaryRecord, getDisciplinaryRecordsForToday, escalateDisciplinaryRecord, getClasses, addStudentToClass, deleteStudentFromClass, updateStudentInClass, moveStudentToClass, reorderClassRollNumbers, bulkAddStudentsToClass, syncRosterWithOfficial, getAppSettings, saveAppSettings, saveTimetableImage, getTimetableImage, createBackupData, exportAllLogsToCSV, factoryReset, getAttendanceLogs, getDisciplinaryRecords, addNewClass, updateClassDetails, deleteClass, getTrashClasses, restoreClass, permanentlyDeleteClass, getQRTargetBaseUrl, setQRTargetBaseUrl } from '../services/storageService';
import { exportClassMonthlyAttendanceWorkbook } from '../services/excelExportService';
import { printQRCardsSheet, generateClassQRDataUrl } from '../services/qrPrintService';
import { ClassAttendanceLog, AttendanceStatus, DisciplinaryRecord, ClassSection, Student, StudentAttendanceRecord, Wing } from '../types';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

// Scope Definition
export type CoordinatorScope = 'MYP' | 'MS_HS' | 'HSS';

interface CoordinatorDashboardProps {
    scope: CoordinatorScope;
}

const QRCardItem: React.FC<{ cls: ClassSection; baseUrl: string }> = ({ cls, baseUrl }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);
    generateClassQRDataUrl(cls.id, baseUrl)
      .then(url => {
        if (isMounted) {
          setQrUrl(url);
          setIsGenerating(false);
        }
      })
      .catch(err => {
        console.error("Failed to generate QR code:", err);
        if (isMounted) setIsGenerating(false);
      });
    return () => {
      isMounted = false;
    };
  }, [cls.id, baseUrl]);

  const handleDownloadSingle = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_Card_${cls.grade.replace(/\s+/g, '_')}_${cls.section}.png`;
    a.click();
  };

  const targetDirectUrl = `${baseUrl}/?classId=${encodeURIComponent(cls.id)}&creator=SKM`;

  return (
    <div className="border-2 border-slate-900 p-5 text-center bg-white rounded-2xl flex flex-col items-center justify-between shadow-sm hover:shadow-md transition-all relative group">
      <div className="absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
        {cls.wing}
      </div>
      
      <div>
        <h3 className="font-black text-2xl uppercase tracking-tight text-slate-900">{cls.grade}</h3>
        <div className="bg-slate-900 text-white px-3.5 py-1 rounded-full font-black text-xs inline-block my-1.5 tracking-wider">
          SEC {cls.section}
        </div>
      </div>

      <div className="my-2 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
        {qrUrl ? (
          <img 
            src={qrUrl} 
            alt={`QR Code for ${cls.grade} ${cls.section}`} 
            className="w-36 h-36 rounded" 
          />
        ) : (
          <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-[10px] font-medium">Generating QR...</span>
          </div>
        )}
      </div>

      <div className="w-full space-y-2 mt-1">
        <div>
          <p className="text-[10px] text-slate-700 font-extrabold tracking-wider uppercase">SCAN TO ENTER CLASS - SKM</p>
          <p className="text-[10px] text-slate-400 font-semibold">{cls.students?.length || 0} Students &middot; PrepX v2.0</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadSingle}
            disabled={!qrUrl}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Download PNG image of this QR code"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Download PNG
          </button>
          <a
            href={targetDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border border-slate-200"
            title="Test this QR direct launch link in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ scope }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'classes' | 'students' | 'reports' | 'timetable' | 'settings' | 'qrcards'>('daily');
  const [logs, setLogs] = useState<ClassAttendanceLog[]>([]);
  const [disciplinaryLogs, setDisciplinaryLogs] = useState<DisciplinaryRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  
  // Filtered Classes based on Scope
  const [scopeClasses, setScopeClasses] = useState<ClassSection[]>([]);
  
  // Monthly View State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClassId, setSelectedClassId] = useState('');
  const [monthlyLogs, setMonthlyLogs] = useState<ClassAttendanceLog[]>([]);

  // Student Report State
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportClassId, setReportClassId] = useState('');
  const [reportStudentId, setReportStudentId] = useState('');

  // Disciplinary Modal State
  const [isLoggingIncident, setIsLoggingIncident] = useState(false);
  const [incidentClassId, setIncidentClassId] = useState('');
  const [incidentStudentId, setIncidentStudentId] = useState('');
  const [incidentReporter, setIncidentReporter] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View Details Modal State
  const [viewingLog, setViewingLog] = useState<ClassAttendanceLog | null>(null);

  // Class Management State
  const [isEditingClass, setIsEditingClass] = useState<ClassSection | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSection, setNewClassSection] = useState('');
  const [editClassGrade, setEditClassGrade] = useState('');
  const [editClassSection, setEditClassSection] = useState('');
  
  // Class Deletion Security State
  const [showTrash, setShowTrash] = useState(false);
  const [trashClasses, setTrashClasses] = useState<ClassSection[]>([]);
  const [classToDelete, setClassToDelete] = useState<ClassSection | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Escalation State
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Student Management State
  const [manageClassId, setManageClassId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [transferringStudent, setTransferringStudent] = useState<{ student: Student; sourceClassId: string } | null>(null);
  const [targetTransferClassId, setTargetTransferClassId] = useState('');
  const [editingStudent, setEditingStudent] = useState<{ student: Student; classId: string } | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentRoll, setEditStudentRoll] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  
  // Settings State
  const [isMorningLocked, setIsMorningLocked] = useState(true);
  const [teacherAccessPin, setTeacherAccessPin] = useState('8899');

  // Timetable State
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [uploadWing, setUploadWing] = useState<Wing>('MYP');

  // QR Code Configuration State
  const [qrBaseUrl, setQrBaseUrl] = useState<string>(getQRTargetBaseUrl());
  const [isEditingQRUrl, setIsEditingQRUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [qrUrlNotice, setQrUrlNotice] = useState<string | null>(null);

  // Real-time Firebase Sync trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPrintingQR, setIsPrintingQR] = useState(false);

  useEffect(() => {
    const handler = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('storageService_classUpdate', handler);
    window.addEventListener('storageService_settingsUpdate', handler);
    window.addEventListener('storageService_timetableUpdate', handler);
    window.addEventListener('storageService_discUpdate', handler);
    window.addEventListener('storageService_logsUpdate', handler);
    window.addEventListener('storageService_trashUpdate', handler);
    return () => {
      window.removeEventListener('storageService_classUpdate', handler);
      window.removeEventListener('storageService_settingsUpdate', handler);
      window.removeEventListener('storageService_timetableUpdate', handler);
      window.removeEventListener('storageService_discUpdate', handler);
      window.removeEventListener('storageService_logsUpdate', handler);
      window.removeEventListener('storageService_trashUpdate', handler);
    };
  }, []);

  // --- FILTER HELPER ---
  const isClassInScope = (classId: string) => {
      const cls = classes.find(c => c.id === classId);
      if (cls) {
          if (scope === 'MYP') return cls.wing === 'MYP';
          if (scope === 'MS_HS') return cls.wing === 'MS' || cls.wing === 'HS';
          if (scope === 'HSS') return cls.wing === 'HSS';
          return false;
      }
      // Robust fallback of ID prefix in case parsing/loading classes has slight timing delay
      const idLower = classId.toLowerCase();
      if (scope === 'MYP') return idLower.startsWith('myp');
      if (scope === 'MS_HS') return idLower.startsWith('ms') || (idLower.startsWith('hs') && !idLower.startsWith('hss'));
      if (scope === 'HSS') return idLower.startsWith('hss');
      return false;
  };

  const isWingInScope = (wing: string) => {
    if (scope === 'MYP') return wing === 'MYP';
    if (scope === 'MS_HS') return wing === 'MS' || wing === 'HS';
    if (scope === 'HSS') return wing === 'HSS';
    return false;
  }

  useEffect(() => {
    // 1. Load All Classes
    const allCls = getClasses();
    setClasses(allCls);
    
    // 2. Filter classes for this coordinator's scope
    const filteredCls = allCls.filter(c => {
        if (scope === 'MYP') return c.wing === 'MYP';
        if (scope === 'MS_HS') return c.wing === 'MS' || c.wing === 'HS';
        if (scope === 'HSS') return c.wing === 'HSS';
        return false;
    });
    setScopeClasses(filteredCls);

    // 3. Set Defaults if list exists, and ensure selected values belong to current scope
    if (filteredCls.length > 0) {
        const isClassValidInScope = (id: string) => filteredCls.some(c => c.id === id);
        if (!selectedClassId || !isClassValidInScope(selectedClassId)) {
            setSelectedClassId(filteredCls[0].id);
        }
        if (!incidentClassId || !isClassValidInScope(incidentClassId)) {
            setIncidentClassId(filteredCls[0].id);
        }
        if (!manageClassId || !isClassValidInScope(manageClassId)) {
            setManageClassId(filteredCls[0].id);
        }
        if (!reportClassId || !isClassValidInScope(reportClassId)) {
            setReportClassId(filteredCls[0].id);
        }
    }
    
    // Load Settings
    const settings = getAppSettings();
    setIsMorningLocked(settings.isMorningLocked);
    setTeacherAccessPin(settings.teacherAccessPin || '8899');
    setQrBaseUrl(getQRTargetBaseUrl());
    
    // Set default upload wing based on scope
    if (scope === 'MYP') setUploadWing('MYP');
    else if (scope === 'HSS') setUploadWing('HSS');
    else setUploadWing('MS');

    // Load initial timetable for that default
    setTimetableImage(getTimetableImage(uploadWing));

    // Load Trash
    if (activeTab === 'classes') {
        const allTrash = getTrashClasses();
        // Filter trash by scope too!
        setTrashClasses(allTrash.filter(c => isWingInScope(c.wing)));
    }
  }, [scope, activeTab, showTrash, refreshTrigger]); // Re-run if scope, tab or sync triggers change

  useEffect(() => {
      // When upload wing selection changes, load that image
      setTimetableImage(getTimetableImage(uploadWing));
  }, [uploadWing]);

  useEffect(() => {
    refreshDailyData();
    refreshMonthlyData();
  }, [selectedMonth, selectedYear, selectedClassId, classes, refreshTrigger]); // Add classes and refreshTrigger to dependency to ensure filters and sync work

  const refreshDailyData = () => {
    // Filter Daily Logs by Scope
    const allLogs = getLogsForToday();
    const filteredLogs = allLogs.filter(l => isClassInScope(l.classId));
    setLogs(filteredLogs);

    // Filter Disciplinary Logs by Scope
    const allDiscLogs = getDisciplinaryRecordsForToday();
    const filteredDisc = allDiscLogs.filter(l => isClassInScope(l.classId));
    setDisciplinaryLogs(filteredDisc);
  };

  const refreshMonthlyData = () => {
    const mLogs = getLogsByMonth(selectedMonth, selectedYear);
    // Only logs for current selected class (which is already scoped by dropdown options)
    setMonthlyLogs(mLogs.filter(l => l.classId === selectedClassId));
  };

  // --- Daily Data Processing (Scoped) ---
  const totalStats = logs.reduce((acc, log) => {
    log.records.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) acc.present++;
      else if (r.status === AttendanceStatus.ABSENT) acc.absent++;
      else if (r.status === AttendanceStatus.LATE) acc.late++;
    });
    return acc;
  }, { present: 0, late: 0, absent: 0 });

  const pieData = [
    { name: 'Present', value: totalStats.present },
    { name: 'Late', value: totalStats.late },
    { name: 'Absent', value: totalStats.absent },
  ];

  const totalLogsExpected = scopeClasses.length * (isMorningLocked ? 1 : 2); // 1 session (Evening only) if Morning is locked, else 2 sessions
  const progress = totalLogsExpected > 0 ? Math.round((logs.length / totalLogsExpected) * 100) : 0;
  
  // Helper wrappers
  const handleAddStudent = () => {
      if (!newStudentName.trim()) { alert("Please enter the student's name"); return; }
      
      const currentStudents = getStudentsForManagement();
      const nextRoll = newStudentRoll.trim() 
        ? parseInt(newStudentRoll) 
        : (currentStudents.reduce((max, s) => Math.max(max, s.rollNumber || 0), 0) + 1);
        
      addStudentToClass(manageClassId, newStudentName, nextRoll);
      setNewStudentName(''); 
      setNewStudentRoll('');
      setClasses(getClasses()); // Reload
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
      if (confirm(`Are you sure you want to remove "${studentName}" from this class?`)) {
          deleteStudentFromClass(manageClassId, studentId);
          setClasses(getClasses());
      }
  };

  const handleStartTransfer = (student: Student) => {
      setTransferringStudent({ student, sourceClassId: manageClassId });
      // Pick first alternative class in scope
      const otherClasses = scopeClasses.filter(c => c.id !== manageClassId);
      if (otherClasses.length > 0) {
        setTargetTransferClassId(otherClasses[0].id);
      }
  };

  const handleExecuteTransfer = () => {
      if (!transferringStudent || !targetTransferClassId) return;
      moveStudentToClass(transferringStudent.sourceClassId, targetTransferClassId, transferringStudent.student.id);
      setTransferringStudent(null);
      setTargetTransferClassId('');
      setClasses(getClasses());
  };

  const handleStartEdit = (student: Student) => {
      setEditingStudent({ student, classId: manageClassId });
      setEditStudentName(student.name);
      setEditStudentRoll(student.rollNumber.toString());
  };

  const handleSaveEdit = () => {
      if (!editingStudent || !editStudentName.trim() || !editStudentRoll.trim()) return;
      updateStudentInClass(editingStudent.classId, editingStudent.student.id, editStudentName, parseInt(editStudentRoll));
      setEditingStudent(null);
      setClasses(getClasses());
  };

  const handleSortAndRenumber = () => {
      if (confirm("Sort all students in this class alphabetically and assign sequential roll numbers (1, 2, 3...)?")) {
          reorderClassRollNumbers(manageClassId);
          setClasses(getClasses());
      }
  };

  const handleBulkAdd = () => {
      const names = bulkNamesText.split('\n').map(n => n.trim()).filter(Boolean);
      if (names.length === 0) {
          alert("Please paste at least one student name (one per line).");
          return;
      }
      bulkAddStudentsToClass(manageClassId, names);
      setBulkNamesText('');
      setIsBulkAdding(false);
      setClasses(getClasses());
  };

  const handleSyncOfficialRoster = async () => {
      if (confirm("Sync classes and student rosters with the official school dataset? This will update student lists while preserving system stability.")) {
          setIsSyncingRoster(true);
          try {
              await syncRosterWithOfficial(false);
              setClasses(getClasses());
              setSyncNotice("Official student roster synchronized successfully!");
              setTimeout(() => setSyncNotice(null), 4000);
          } catch (e) {
              console.error(e);
              alert("Error syncing roster. Please try again.");
          } finally {
              setIsSyncingRoster(false);
          }
      }
  };
  const handleTimetableUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => { 
              const base64 = reader.result as string;
              setTimetableImage(base64); 
              saveTimetableImage(base64, uploadWing); 
              alert(`Uploaded timetable for ${uploadWing}!`); 
          };
          reader.readAsDataURL(file);
      }
  };
  const handleSaveIncident = () => {
    const cls = classes.find(c => c.id === incidentClassId);
    const student = cls?.students.find(s => s.id === incidentStudentId);
    if (!student || !cls || !incidentReporter.trim() || !incidentDescription.trim()) { alert("Fill all fields."); return; }
    setIsSavingIncident(true);
    setTimeout(() => {
        saveDisciplinaryRecord({
            id: Date.now().toString(), studentId: student.id, studentName: student.name,
            classId: cls.id, className: `${cls.grade} - ${cls.section}`, reportedBy: incidentReporter,
            description: incidentDescription, timestamp: Date.now(), escalatedToHOS: false
        });
        setIsSavingIncident(false); setSaveSuccess(true);
        setTimeout(() => { setSaveSuccess(false); setIsLoggingIncident(false); setIncidentDescription(''); setIncidentReporter(''); refreshDailyData(); }, 1000);
    }, 600);
  };
  const handleEscalate = (id: string) => { setProcessingId(id); setTimeout(() => { escalateDisciplinaryRecord(id); refreshDailyData(); setProcessingId(null); }, 600); };
  const handlePrintQR = async () => {
    setIsPrintingQR(true);
    try {
      const wingLabel = scope === 'MYP' ? 'MYP' : scope === 'HSS' ? 'HSS' : 'MS/HS';
      await printQRCardsSheet(scopeClasses, wingLabel, qrBaseUrl);
    } catch (e) {
      console.error("Print failed:", e);
      window.print();
    } finally {
      setIsPrintingQR(false);
    }
  };

  const handleSaveQRUrl = (urlToSet: string) => {
    setQRTargetBaseUrl(urlToSet);
    const updated = getQRTargetBaseUrl();
    setQrBaseUrl(updated);
    setIsEditingQRUrl(false);
    setQrUrlNotice("Target URL updated! All QR codes now point to this address.");
    setTimeout(() => setQrUrlNotice(null), 4000);
  };

  const handleResetQRUrl = () => {
    setQRTargetBaseUrl(window.location.origin);
    setQrBaseUrl(window.location.origin);
    setIsEditingQRUrl(false);
    setQrUrlNotice("Target URL reset to current origin.");
    setTimeout(() => setQrUrlNotice(null), 4000);
  };
  const handleFactoryReset = () => { if (confirm("DANGER: RESET ALL DATA?")) { if (confirm("Did you download CSV backup?")) { factoryReset(); } } };
  const handleExportCSV = () => { exportAllLogsToCSV(); };
  const handleExportMonthlyExcel = () => {
    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass) {
      alert("Please select a class to export.");
      return;
    }
    const allMonthly = getLogsByMonth(selectedMonth, selectedYear);
    exportClassMonthlyAttendanceWorkbook(currentClass, selectedMonth, selectedYear, allMonthly);
  };
  const toggleMorningLock = () => { const s = !isMorningLocked; setIsMorningLocked(s); const set = getAppSettings(); saveAppSettings({ ...set, isMorningLocked: s }); };
  const updateTeacherPin = (p: string) => { setTeacherAccessPin(p); if (p.length===4) { const set = getAppSettings(); saveAppSettings({ ...set, teacherAccessPin: p }); } };
  const createBackup = () => createBackupData();

  // CLASS MANAGEMENT
  const handleCreateClass = () => {
      if (!newClassGrade.trim() || !newClassSection.trim()) return;
      // Determine Wing from Scope if possible, else default to first available
      let targetWing: Wing = 'MYP';
      if (scope === 'HSS') targetWing = 'HSS';
      else if (scope === 'MS_HS') targetWing = 'MS';
      
      addNewClass(targetWing, newClassGrade, newClassSection);
      setNewClassGrade(''); setNewClassSection('');
      setIsAddingClass(false);
      setClasses(getClasses()); // Reload
  };

  const handleUpdateClass = () => {
      if (!isEditingClass || !editClassGrade.trim() || !editClassSection.trim()) return;
      updateClassDetails(isEditingClass.id, editClassGrade, editClassSection);
      setIsEditingClass(null);
      setClasses(getClasses()); // Reload
  };
  
  const initiateDeleteClass = (cls: ClassSection) => {
      setClassToDelete(cls);
      setDeleteConfirmText('');
  }

  const handleConfirmDelete = () => {
      if (classToDelete && deleteConfirmText === 'DELETE') {
          deleteClass(classToDelete.id);
          setClassToDelete(null);
          setDeleteConfirmText('');
          setClasses(getClasses()); // Reload
      }
  }

  const handleRestoreClass = (id: string) => {
      restoreClass(id);
      setClasses(getClasses()); // Reload
      // Reload trash to UI update
      const allTrash = getTrashClasses();
      setTrashClasses(allTrash.filter(c => isWingInScope(c.wing)));
  }

  const handlePermanentDelete = (id: string) => {
      if(confirm("This is PERMANENT. Are you absolutely sure?")) {
          permanentlyDeleteClass(id);
          // Reload trash
          const allTrash = getTrashClasses();
          setTrashClasses(allTrash.filter(c => isWingInScope(c.wing)));
      }
  }

  // Helper getters for selects
  const getStudentsForIncident = () => classes.find(c => c.id === incidentClassId)?.students || [];
  const getStudentsForManagement = () => classes.find(c => c.id === manageClassId)?.students || [];
  const getStudentsForReport = () => classes.find(c => c.id === reportClassId)?.students || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 pb-20">
      
      {/* Scope Header */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-lg flex justify-between items-center print:hidden">
          <div>
              <h2 className="text-lg font-bold">Coordinator Panel</h2>
              <p className="text-indigo-200 text-sm">
                  Scope: <span className="font-bold text-white bg-indigo-700 px-2 py-0.5 rounded">{scope === 'MS_HS' ? 'Middle School & High School' : scope === 'HSS' ? 'Higher Secondary' : 'MYP Wing'}</span>
              </p>
          </div>
          <div className="text-right text-xs text-indigo-300">
              Classes Managed: {scopeClasses.length}
          </div>
      </div>

      <style>{`
        @media print {
            body * { visibility: hidden; }
            #printable-qr-grid, #printable-qr-grid * { visibility: visible; }
            #printable-qr-grid { position: absolute; left: 0; top: 0; width: 100%; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 1rem !important; }
        }
      `}</style>

      {/* Class Edit Modal */}
      {isEditingClass && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Edit Class Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade Name</label>
                        <input value={editClassGrade} onChange={e => setEditClassGrade(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. Grade 6" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section Name</label>
                        <input value={editClassSection} onChange={e => setEditClassSection(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. Einstein" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleUpdateClass} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold">Update</button>
                        <button onClick={() => setIsEditingClass(null)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded font-bold">Cancel</button>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* Class Delete Double Check Modal */}
      {classToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl text-center">
                <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Double Security Check</h3>
                <p className="text-sm text-slate-500 mb-6">
                    You are about to delete <span className="font-bold text-slate-800">{classToDelete.grade} - {classToDelete.section}</span>.
                    <br/>
                    This will move the class to the Trash Bin.
                </p>
                
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Type "DELETE" to confirm</label>
                    <input 
                      type="text" 
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full text-center text-xl font-bold tracking-widest py-3 border-2 border-slate-200 rounded-lg outline-none focus:border-rose-500 text-slate-800 uppercase"
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                      onClick={() => { setClassToDelete(null); setDeleteConfirmText(''); }}
                      className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl"
                    >
                        Cancel
                    </button>
                    <button 
                      onClick={handleConfirmDelete}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className="flex-1 py-3 bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg"
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Add Class Modal */}
      {isAddingClass && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Add New Class</h3>
                <p className="text-xs text-slate-500 mb-4">Will be added to your current wing with 25 empty student slots.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade Name</label>
                        <input value={newClassGrade} onChange={e => setNewClassGrade(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. MYP 6" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section Name</label>
                        <input value={newClassSection} onChange={e => setNewClassSection(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. Red" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateClass} className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold">Create Class</button>
                        <button onClick={() => setIsAddingClass(false)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded font-bold">Cancel</button>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* View Details Modal */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold">{classes.find(c => c.id === viewingLog.classId)?.grade} - {classes.find(c => c.id === viewingLog.classId)?.section}</h3>
                    <button onClick={() => setViewingLog(null)}><X className="w-6 h-6"/></button>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <h4 className="font-bold text-rose-800 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Absent / Late Issues</h4>
                        {viewingLog.records.filter(r => r.status !== AttendanceStatus.PRESENT).length === 0 ? <p className="text-sm text-rose-400">No issues reported.</p> : (
                            <ul className="space-y-2">
                                {viewingLog.records.filter(r => r.status !== AttendanceStatus.PRESENT).map(r => {
                                    const st = classes.find(c => c.id === viewingLog.classId)?.students.find(s => s.id === r.studentId);
                                    return (
                                        <li key={r.studentId} className="flex justify-between text-sm border-b border-rose-100 pb-1">
                                            <span>{st?.name}</span>
                                            <span className="font-bold flex items-center gap-2">
                                                <span className={`px-2 rounded text-[10px] uppercase ${r.status===AttendanceStatus.ABSENT?'bg-rose-200 text-rose-800':'bg-amber-200 text-amber-800'}`}>{r.status}</span>
                                                <span className="italic text-slate-500 font-normal">"{r.reason}"</span>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                 </div>
                 <div className="mt-4 text-center">
                    <button onClick={() => setViewingLog(null)} className="text-slate-500 hover:text-slate-800 text-sm">Close</button>
                 </div>
            </div>
        </div>
      )}

      {/* Incident Modal */}
      {isLoggingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Log Incident</h3>
                <div className="space-y-4">
                    <select value={incidentClassId} onChange={e => setIncidentClassId(e.target.value)} className="w-full p-2 border rounded">
                        {scopeClasses.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                    </select>
                    <select value={incidentStudentId} onChange={e => setIncidentStudentId(e.target.value)} className="w-full p-2 border rounded">
                        <option value="">Select Student</option>
                        {getStudentsForIncident().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input placeholder="Reported By" value={incidentReporter} onChange={e => setIncidentReporter(e.target.value)} className="w-full p-2 border rounded"/>
                    <textarea placeholder="Description" value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} className="w-full p-2 border rounded h-24"/>
                    <button onClick={handleSaveIncident} className="w-full bg-rose-600 text-white py-2 rounded">Save</button>
                    <button onClick={() => setIsLoggingIncident(false)} className="w-full text-slate-500 py-2">Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 print:hidden pb-2">
         {['daily', 'monthly', 'classes', 'students', 'reports', 'timetable', 'qrcards', 'settings'].map(t => (
             <button 
                key={t} 
                onClick={() => { setActiveTab(t as any); setShowTrash(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
             >
                 {t.charAt(0).toUpperCase() + t.slice(1)}
             </button>
         ))}
         <button onClick={() => setIsLoggingIncident(true)} className="ml-auto bg-rose-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Log Incident</button>
      </div>

      {activeTab === 'daily' && (
          <div className="space-y-6">
             {/* Stats */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm flex items-center justify-between"><span>Submitted</span><span className="text-[10px] text-slate-400 font-medium normal-case ml-2">({scopeClasses.length} class{scopeClasses.length !== 1 ? 'es' : ''} × {isMorningLocked ? '1 sess' : '2 sess'})</span></p><p className="text-3xl font-bold text-indigo-600">{logs.length}/{totalLogsExpected}</p></div>
                 <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Present</p><p className="text-3xl font-bold text-emerald-600">{totalStats.present}</p></div>
                 <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Absent</p><p className="text-3xl font-bold text-rose-600">{totalStats.absent}</p></div>
                 <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Late</p><p className="text-3xl font-bold text-amber-600">{totalStats.late}</p></div>
             </div>
             
             {/* Incident Queue */}
             <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                 <div className="p-4 bg-rose-50 border-b border-rose-100 font-bold text-rose-800">Incident Review ({disciplinaryLogs.length})</div>
                 {disciplinaryLogs.map(l => (
                     <div key={l.id} className="p-4 border-b flex justify-between items-center">
                         <div><p className="font-bold">{l.studentName} ({l.className})</p><p className="text-sm italic">"{l.description}"</p></div>
                         {!l.escalatedToHOS ? <button onClick={() => handleEscalate(l.id)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded">Escalate</button> : <span className="text-xs text-emerald-600 font-bold">Escalated</span>}
                     </div>
                 ))}
             </div>

             {/* Detailed Logs Table */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr><th>Time</th><th>Class</th><th>Teacher</th><th>Summary</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {logs.map(log => {
                            const className = classes.find(c => c.id === log.classId);
                            return (
                                <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="px-6 py-4">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                    <td className="px-6 py-4 font-bold">{className?.grade} - {className?.section}</td>
                                    <td className="px-6 py-4">{log.teacherName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 text-xs font-bold">
                                            <span className="text-emerald-600">P: {log.records.filter(r=>r.status===AttendanceStatus.PRESENT).length}</span>
                                            <span className="text-rose-600">A: {log.records.filter(r=>r.status===AttendanceStatus.ABSENT).length}</span>
                                            <span className="text-amber-600">L: {log.records.filter(r=>r.status===AttendanceStatus.LATE).length}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><button onClick={() => setViewingLog(log)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">View Details</button></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
             </div>
          </div>
      )}

      {/* CLASS MANAGEMENT TAB - NEW */}
      {activeTab === 'classes' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
             <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <LayoutGrid className="w-6 h-6 text-indigo-600"/> 
                     {showTrash ? `Trash Bin (${trashClasses.length})` : `Manage Sections (${scope})`}
                 </h3>
                 
                 <div className="flex gap-2">
                     {showTrash ? (
                        <button 
                            onClick={() => setShowTrash(false)}
                            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-200"
                        >
                            <RefreshCcw className="w-4 h-4"/> Back to Active
                        </button>
                     ) : (
                        <>
                            <button 
                                onClick={() => setShowTrash(true)}
                                className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-rose-100 border border-rose-100"
                            >
                                <Trash2 className="w-4 h-4"/> View Trash
                            </button>
                            <button 
                                onClick={() => setIsAddingClass(true)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700"
                            >
                                <PlusCircle className="w-4 h-4"/> Add New Class
                            </button>
                        </>
                     )}
                 </div>
             </div>
             
             {showTrash ? (
                // TRASH VIEW
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Deleted classes can be restored here.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trashClasses.map(cls => (
                            <div key={cls.id} className="border border-rose-200 bg-rose-50/50 p-4 rounded-xl flex flex-col justify-between opacity-75 hover:opacity-100 transition-opacity">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-lg text-slate-600 line-through">{cls.grade}</h4>
                                        <span className="bg-rose-200 text-rose-800 text-xs px-2 py-1 rounded font-bold uppercase">DELETED</span>
                                    </div>
                                    <p className="text-slate-500 font-bold mb-4">Section: {cls.section}</p>
                                </div>
                                <div className="flex gap-2 mt-auto pt-4 border-t border-rose-100">
                                    <button 
                                        onClick={() => handleRestoreClass(cls.id)}
                                        className="flex-1 bg-emerald-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-700"
                                    >
                                        <RotateCcw className="w-3 h-3"/> Restore
                                    </button>
                                    <button 
                                        onClick={() => handlePermanentDelete(cls.id)}
                                        className="flex-1 bg-slate-800 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-black"
                                    >
                                        <X className="w-3 h-3"/> Forever
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {trashClasses.length === 0 && <p className="text-center text-slate-400 py-10">Trash bin is empty.</p>}
                </div>
             ) : (
                // ACTIVE CLASSES VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {scopeClasses.map(cls => (
                         <div key={cls.id} className="border p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
                             <div>
                                 <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-black text-lg text-slate-800">{cls.grade}</h4>
                                     <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold uppercase">{cls.wing}</span>
                                 </div>
                                 <p className="text-indigo-600 font-bold mb-4">Section: {cls.section}</p>
                                 <p className="text-xs text-slate-400 mb-4">{cls.students.length} Students</p>
                             </div>
                             <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                                 <button 
                                    onClick={() => {
                                        setIsEditingClass(cls);
                                        setEditClassGrade(cls.grade);
                                        setEditClassSection(cls.section);
                                    }}
                                    className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100"
                                 >
                                     <PenSquare className="w-3 h-3"/> Rename
                                 </button>
                                 <button 
                                    onClick={() => initiateDeleteClass(cls)}
                                    className="flex-1 bg-rose-50 text-rose-600 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-rose-100"
                                 >
                                     <Trash2 className="w-3 h-3"/> Delete
                                 </button>
                             </div>
                         </div>
                     ))}
                     {scopeClasses.length === 0 && <p className="col-span-3 text-center text-slate-400 py-10">No classes found in this wing.</p>}
                </div>
             )}
         </div>
      )}

      {/* STUDENTS TAB - FULL ROSTER & SHUFFLING ENGINE */}
      {activeTab === 'students' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Manage Students & Class Shuffling
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Scope: <span className="font-semibold text-indigo-700">{scope === 'MYP' ? 'MYP Wing (Grades 1-5)' : scope}</span> · Edit rosters, move students between sections, and manage roll numbers.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setIsBulkAdding(!isBulkAdding)}
                        className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                    >
                        <ListPlus className="w-4 h-4 text-slate-500" /> {isBulkAdding ? 'Close Bulk Add' : 'Bulk Add'}
                    </button>
                    <button 
                        onClick={handleSortAndRenumber}
                        className="px-3 py-2 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
                        title="Sort this class alphabetically and assign sequential roll numbers 1..N"
                    >
                        <ArrowUpDown className="w-4 h-4 text-indigo-500" /> Auto-Renumber
                    </button>
                    <button 
                        onClick={handleSyncOfficialRoster}
                        disabled={isSyncingRoster}
                        className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Sync and restore official school roster from document"
                    >
                        {isSyncingRoster ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} 
                        Sync Official Roster
                    </button>
                </div>
            </div>

            {/* Sync Feedback Alert */}
            {syncNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> {syncNotice}
                </div>
            )}

            {/* Bulk Add Panel */}
            {isBulkAdding && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <ListPlus className="w-4 h-4 text-indigo-600" /> Paste Student Names (One per line)
                        </label>
                        <span className="text-xs text-slate-500">Target: {classes.find(c => c.id === manageClassId)?.grade} - {classes.find(c => c.id === manageClassId)?.section}</span>
                    </div>
                    <textarea 
                        rows={4}
                        value={bulkNamesText}
                        onChange={(e) => setBulkNamesText(e.target.value)}
                        placeholder="ALEXANDER SMITH&#10;BELLA JOHNSON&#10;CHRISTOPHER LEE"
                        className="w-full p-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setIsBulkAdding(false)} 
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleBulkAdd}
                            className="px-4 py-1.5 text-xs bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
                        >
                            Add All Students
                        </button>
                    </div>
                </div>
            )}

            {/* Class Selector & Quick Badges */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Class & Section</label>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {getStudentsForManagement().length} Students in Selected Class
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {scopeClasses.map(c => {
                        const isSelected = c.id === manageClassId;
                        return (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setManageClassId(c.id);
                                    setStudentSearchTerm('');
                                }}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isSelected 
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                            >
                                <span>{c.grade} - {c.section}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {c.students?.length || 0}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Controls Row: Search & Add Student */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Search */}
                <div className="lg:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Students</label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            placeholder="Search by name or roll number..."
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                {/* Add New Student Form */}
                <div className="lg:col-span-8 flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Student Name</label>
                        <input 
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="STUDENT FULL NAME"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="w-full sm:w-28">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Roll No (Opt)</label>
                        <input 
                            type="number"
                            value={newStudentRoll}
                            onChange={(e) => setNewStudentRoll(e.target.value)}
                            placeholder={((getStudentsForManagement().reduce((max, s) => Math.max(max, s.rollNumber || 0), 0)) + 1).toString()}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button 
                        onClick={handleAddStudent}
                        className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                        <UserPlus className="w-4 h-4" /> Add Student
                    </button>
                </div>
            </div>

            {/* Students List Grid */}
            {(() => {
                const allStudents = getStudentsForManagement();
                const filtered = allStudents.filter(s => 
                    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                    s.rollNumber.toString().includes(studentSearchTerm)
                );

                if (filtered.length === 0) {
                    return (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600">No students found</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {studentSearchTerm ? 'Try adjusting your search query' : 'Add students using the form above or sync with official roster'}
                            </p>
                        </div>
                    );
                }

                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filtered.map(s => (
                            <div 
                                key={s.id} 
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                                        {s.rollNumber}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate uppercase">{s.name}</p>
                                        <p className="text-[11px] text-slate-400">Roll #{s.rollNumber}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Shuffle / Transfer Button */}
                                    <button 
                                        onClick={() => handleStartTransfer(s)}
                                        title="Move / Shuffle student to another class"
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                    </button>

                                    {/* Edit Button */}
                                    <button 
                                        onClick={() => handleStartEdit(s)}
                                        title="Edit student details"
                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>

                                    {/* Delete Button */}
                                    <button 
                                        onClick={() => handleDeleteStudent(s.id, s.name)}
                                        title="Delete student"
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Transfer / Move Student Modal */}
            {transferringStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Move Student Between Classes
                            </h4>
                            <button onClick={() => setTransferringStudent(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border space-y-1">
                            <p className="text-xs text-slate-400 font-bold uppercase">Student to Move</p>
                            <p className="font-bold text-slate-800 text-base">{transferringStudent.student.name}</p>
                            <p className="text-xs text-slate-500">
                                Current Class: <span className="font-semibold text-slate-700">{classes.find(c => c.id === transferringStudent.sourceClassId)?.grade} - {classes.find(c => c.id === transferringStudent.sourceClassId)?.section} (Roll #{transferringStudent.student.rollNumber})</span>
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Target Destination Class</label>
                            <select 
                                value={targetTransferClassId} 
                                onChange={(e) => setTargetTransferClassId(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                            >
                                {scopeClasses.filter(c => c.id !== transferringStudent.sourceClassId).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.grade} - {c.section} ({c.students?.length || 0} students)
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-slate-400 mt-1">
                                The student will be automatically assigned the next available roll number in the target class.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setTransferringStudent(null)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleExecuteTransfer}
                                disabled={!targetTransferClassId}
                                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" /> Move Student
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-amber-600" /> Edit Student Information
                            </h4>
                            <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Student Name</label>
                                <input 
                                    value={editStudentName}
                                    onChange={(e) => setEditStudentName(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg text-sm uppercase font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Roll Number</label>
                                <input 
                                    type="number"
                                    value={editStudentRoll}
                                    onChange={(e) => setEditStudentRoll(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg text-sm font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setEditingStudent(null)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className="px-5 py-2 text-sm bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-sm flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* REPORTS TAB - RESTORED */}
      {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileBarChart className="w-5 h-5 text-indigo-600"/> Individual Student Report</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                      <select value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))} className="w-full p-2 border rounded">
                           {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Class</label>
                      <select value={reportClassId} onChange={e => setReportClassId(e.target.value)} className="w-full p-2 border rounded">
                          {scopeClasses.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Student</label>
                      <select value={reportStudentId} onChange={e => setReportStudentId(e.target.value)} className="w-full p-2 border rounded">
                          <option value="">Select Student...</option>
                          {getStudentsForReport().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  </div>
              </div>
              
              {reportStudentId && (
                  <div className="border-t pt-6 animate-in fade-in">
                       {/* Calculate Stats on the fly for demo */}
                       {(() => {
                           // This is heavy, normally backend does this. 
                           // We filter ALL logs for this student in this year.
                           const allLogs = getAttendanceLogs(); 
                           const studLogs = allLogs.filter(l => new Date(l.timestamp).getFullYear() === reportYear && l.records.some(r => r.studentId === reportStudentId));
                           
                           let p=0, a=0, l=0;
                           const history: {date: string, status: string, reason: string}[] = [];
                           
                           studLogs.forEach(log => {
                               const rec = log.records.find(r => r.studentId === reportStudentId);
                               if(rec) {
                                   if(rec.status===AttendanceStatus.PRESENT) p++;
                                   if(rec.status===AttendanceStatus.ABSENT) { a++; history.push({date: new Date(log.timestamp).toLocaleDateString(), status: 'Absent', reason: rec.reason||''}); }
                                   if(rec.status===AttendanceStatus.LATE) { l++; history.push({date: new Date(log.timestamp).toLocaleDateString(), status: 'Late', reason: rec.reason||''}); }
                               }
                           });
                           
                           const discHistory = getDisciplinaryRecords().filter(r => r.studentId === reportStudentId && new Date(r.timestamp).getFullYear() === reportYear);

                           return (
                               <div className="space-y-6">
                                   <div className="grid grid-cols-3 gap-4 text-center">
                                       <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                           <div className="text-2xl font-bold text-emerald-600">{p}</div>
                                           <div className="text-xs text-emerald-800 font-bold uppercase">Present</div>
                                       </div>
                                       <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                           <div className="text-2xl font-bold text-rose-600">{a}</div>
                                           <div className="text-xs text-rose-800 font-bold uppercase">Absent</div>
                                       </div>
                                       <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                           <div className="text-2xl font-bold text-amber-600">{l}</div>
                                           <div className="text-xs text-amber-800 font-bold uppercase">Late</div>
                                       </div>
                                   </div>
                                   
                                   <div className="grid md:grid-cols-2 gap-6">
                                       <div>
                                           <h4 className="font-bold text-slate-700 mb-2">Attendance Issues</h4>
                                           <div className="max-h-60 overflow-y-auto border rounded-xl p-4 space-y-2">
                                               {history.length === 0 ? <p className="text-slate-400 text-sm">Perfect Attendance.</p> : history.map((h, i) => (
                                                   <div key={i} className="flex justify-between text-sm border-b pb-2">
                                                       <span>{h.date}</span>
                                                       <span className={`font-bold ${h.status==='Absent'?'text-rose-600':'text-amber-600'}`}>{h.status} <span className="text-slate-500 font-normal italic">"{h.reason}"</span></span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                       <div>
                                            <h4 className="font-bold text-slate-700 mb-2">Disciplinary Record</h4>
                                            <div className="max-h-60 overflow-y-auto border rounded-xl p-4 space-y-2">
                                               {discHistory.length === 0 ? <p className="text-slate-400 text-sm">Clean Record.</p> : discHistory.map((d, i) => (
                                                   <div key={i} className="text-sm border-b pb-2">
                                                       <div className="flex justify-between font-bold">
                                                           <span>{new Date(d.timestamp).toLocaleDateString()}</span>
                                                           <span className="text-rose-600">{d.escalatedToHOS ? 'Escalated' : 'Logged'}</span>
                                                       </div>
                                                       <p className="italic text-slate-600">"{d.description}"</p>
                                                   </div>
                                               ))}
                                            </div>
                                       </div>
                                   </div>
                                   <div className="text-center pt-4">
                                       <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold">Print Student Report</button>
                                   </div>
                               </div>
                           );
                       })()}
                  </div>
              )}
          </div>
      )}

      {/* TIMETABLE TAB - UPDATED FOR MULTI-WING */}
      {activeTab === 'timetable' && (
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center">
              <h3 className="font-bold text-lg mb-4">Weekly Timetable Management</h3>
              <p className="text-slate-500 mb-6 text-center max-w-md">Upload the Prep Duty roster for the specific wing.</p>
              
              {/* Wing Selector for Upload */}
              <div className="mb-6 w-full max-w-xs">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 text-center">Select Wing to Upload For</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['MYP', 'MS', 'HS', 'HSS'] as Wing[]).map(w => (
                        <button
                            key={w}
                            onClick={() => setUploadWing(w)}
                            className={`flex-1 py-1 text-xs font-bold rounded ${uploadWing === w ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            {w}
                        </button>
                    ))}
                  </div>
              </div>

              {timetableImage ? (
                  <div className="mb-6 relative group">
                      <img src={timetableImage} alt={`Timetable for ${uploadWing}`} className="max-w-md rounded shadow-lg border" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                          <p className="text-white font-bold">{uploadWing} Timetable</p>
                      </div>
                  </div>
              ) : (
                  <div className="w-64 h-40 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-6">
                      <p className="text-slate-400">No {uploadWing} Timetable</p>
                  </div>
              )}
              
              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2">
                  <UploadCloud className="w-5 h-5" />
                  Upload {uploadWing} Timetable
                  <input type="file" accept="image/*" className="hidden" onChange={handleTimetableUpload} />
              </label>
          </div>
      )}

      {/* QR Cards Tab - Scoped */}
      {activeTab === 'qrcards' && (
          <div className="space-y-6">
              {/* QR Target Base URL Configuration Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="space-y-1">
                          <div className="flex items-center gap-2">
                              <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                                  Mobile Scan Destination
                              </span>
                              {qrBaseUrl.includes('ais-dev-') && (
                                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                                      <AlertTriangle className="w-3 h-3" /> Dev Environment URL
                                  </span>
                              )}
                          </div>
                          <div className="flex items-center gap-2 font-mono text-sm text-slate-200 break-all">
                              <Globe className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                              <span className="font-semibold text-white">{qrBaseUrl}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                              Phones scanning these QR codes will immediately open this URL directly into the teacher's classroom view.
                          </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                          <a 
                            href={`${qrBaseUrl}/?creator=SKM`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                            title="Verify link works in browser"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Test Link
                          </a>
                          <button 
                            onClick={() => {
                              setCustomUrlInput(qrBaseUrl);
                              setIsEditingQRUrl(!isEditingQRUrl);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> {isEditingQRUrl ? 'Cancel' : 'Change Target URL'}
                          </button>
                      </div>
                  </div>

                  {/* Warning for ais-dev session */}
                  {qrBaseUrl.includes('ais-dev-') && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800 text-xs text-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                              <span>
                                  <strong>Notice for Mobile Cameras:</strong> Internal preview URLs (<code>ais-dev-...</code>) return <em>Page Not Found</em> on phones. Set your live Vercel domain or public preview URL below.
                              </span>
                          </div>
                          <button 
                            onClick={() => handleSaveQRUrl(window.location.origin.replace('ais-dev-', 'ais-pre-'))}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-lg border border-amber-500/40 cursor-pointer self-start sm:self-auto whitespace-nowrap"
                          >
                            Use Public URL
                          </button>
                      </div>
                  )}

                  {/* Edit Form */}
                  {isEditingQRUrl && (
                      <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl space-y-3">
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                              Set Custom Web Domain or Deployment URL
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                              <input 
                                type="url" 
                                value={customUrlInput}
                                onChange={(e) => setCustomUrlInput(e.target.value)}
                                placeholder="https://your-school-app.vercel.app"
                                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                              <button 
                                onClick={() => handleSaveQRUrl(customUrlInput)}
                                disabled={!customUrlInput.trim()}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-4 h-4" /> Save Target URL
                              </button>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 pt-1">
                              <span>Quick presets:</span>
                              <button 
                                onClick={() => handleSaveQRUrl(window.location.origin.replace('ais-dev-', 'ais-pre-'))}
                                className="text-indigo-400 hover:text-indigo-300 underline"
                              >
                                Public Preview Domain
                              </button>
                              <span>&middot;</span>
                              <button 
                                onClick={handleResetQRUrl}
                                className="text-slate-300 hover:text-white underline"
                              >
                                Current Browser Domain
                              </button>
                          </div>
                      </div>
                  )}

                  {qrUrlNotice && (
                      <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          {qrUrlNotice}
                      </div>
                  )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <div>
                      <div className="flex items-center gap-2">
                          <QrCode className="w-6 h-6 text-indigo-600" />
                          <h3 className="text-xl font-bold text-slate-900">Classroom QR Cards ({scope})</h3>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                          High-resolution QR entry codes for all {scopeClasses.length} classes. Print and stick on classroom entrance doors.
                      </p>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                          onClick={handlePrintQR} 
                          disabled={isPrintingQR || scopeClasses.length === 0}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all cursor-pointer"
                      >
                          {isPrintingQR ? (
                              <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Preparing A4 Sheet...
                              </>
                          ) : (
                              <>
                                  <Printer className="w-4 h-4" />
                                  Print QR Cards (A4)
                              </>
                          )}
                      </button>
                  </div>
              </div>

              {scopeClasses.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                      <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-lg font-bold text-slate-700">No Classes in Scope</h4>
                      <p className="text-sm text-slate-500">Add classes in the 'Classes' tab to generate QR entrance cards.</p>
                  </div>
              ) : (
                  <div id="printable-qr-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {scopeClasses.map(cls => (
                          <QRCardItem key={cls.id} cls={cls} baseUrl={qrBaseUrl} />
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* Settings Tab - Same for all coords */}
      {activeTab === 'settings' && (
          <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
                  <div>
                      <h3 className="font-bold mb-4">Prep Access & Timing</h3>
                      <button onClick={toggleMorningLock} className={`px-4 py-2 rounded w-full font-bold flex items-center justify-center gap-2 ${isMorningLocked ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isMorningLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          {isMorningLocked ? "Morning Prep Locked (Click to Unlock)" : "Morning Prep Open (Click to Lock)"}
                      </button>
                  </div>

                  <div>
                      <h4 className="font-bold text-sm text-slate-500 uppercase mb-2">Teacher PIN</h4>
                      <input 
                        type="text" 
                        value={teacherAccessPin} 
                        onChange={(e) => updateTeacherPin(e.target.value)}
                        className="border p-2 rounded w-full font-mono text-center tracking-widest text-lg font-bold"
                        maxLength={4}
                      />
                      <p className="text-xs text-slate-400 mt-1 text-center">4-digit code used by teachers on classroom phones</p>
                  </div>

                  <div>
                      <h4 className="font-bold text-sm text-slate-500 uppercase mb-2">QR Code Target URL</h4>
                      <div className="flex gap-2">
                          <input 
                            type="url" 
                            value={qrBaseUrl} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setQrBaseUrl(val);
                              setQRTargetBaseUrl(val);
                            }}
                            className="border p-2 rounded flex-1 font-mono text-xs text-slate-700"
                            placeholder="https://your-app.vercel.app"
                          />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Domain encoded inside printed classroom QR cards for mobile phones</p>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                   <h3 className="font-bold mb-4">Data & Reports</h3>
                   <button onClick={handleExportMonthlyExcel} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg mb-2 text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                       <FileBarChart className="w-4 h-4" /> Download Excel Register (Multi-Sheet .xlsx)
                   </button>
                   <button onClick={handleExportCSV} className="w-full border p-2 rounded-lg mb-2 text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                       <Download className="w-4 h-4 text-slate-500" /> Download Full CSV
                   </button>
                   <button onClick={createBackup} className="w-full border p-2 rounded-lg mb-2 text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                       <Database className="w-4 h-4 text-slate-500" /> Download System Backup
                   </button>
                   <button onClick={handleFactoryReset} className="w-full bg-rose-50 text-rose-600 p-2 rounded text-sm font-bold hover:bg-rose-100">Factory Reset</button>
              </div>
          </div>
      )}
      
      {/* Monthly View */}
       {activeTab === 'monthly' && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <div className="flex flex-wrap items-end gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="border p-2 rounded w-24">
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="border p-2 rounded w-32">
                        {Array.from({length: 12}, (_, i) => i).map(m => (
                            <option key={m} value={m}>{new Date(2026, m).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class</label>
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="border p-2 rounded w-full">
                        {scopeClasses.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportMonthlyExcel} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-colors cursor-pointer"
                        title="Download multi-sheet Excel file with 1 sheet per student"
                    >
                        <FileBarChart className="w-4 h-4"/> Download Excel (.xlsx)
                    </button>
                    <button 
                        onClick={handleExportCSV} 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5"/> CSV
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto border rounded-xl">
                 <table className="w-full text-sm border-collapse">
                     <thead>
                         <tr>
                             <th className="p-3 border bg-slate-100 sticky left-0 z-10 w-48 text-left">Student</th>
                             {Array.from({length: new Date(selectedYear, selectedMonth + 1, 0).getDate()}, (_, i) => i + 1).map(d => (
                                 <th key={d} className="p-2 border bg-slate-50 text-xs w-10 text-center">{d}</th>
                             ))}
                         </tr>
                     </thead>
                     <tbody>
                         {classes.find(c => c.id === selectedClassId)?.students.map(student => (
                             <tr key={student.id} className="hover:bg-slate-50">
                                 <td className="p-2 border sticky left-0 bg-white font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[12rem]">{student.name}</td>
                                 {Array.from({length: new Date(selectedYear, selectedMonth + 1, 0).getDate()}, (_, i) => i + 1).map(d => {
                                     // Find logs for this day
                                     const dayLogs = monthlyLogs.filter(l => new Date(l.timestamp).getDate() === d);
                                     // Sort logs by timestamp descending so that the latest submission/update is picked first
                                     dayLogs.sort((a, b) => b.timestamp - a.timestamp);
                                     // Check for Morning and Evening
                                     const morningLog = dayLogs.find(l => l.session === 'Morning');
                                     const eveningLog = dayLogs.find(l => l.session === 'Evening');
                                     
                                     const mStatus = morningLog?.records.find(r => r.studentId === student.id)?.status;
                                     const eStatus = eveningLog?.records.find(r => r.studentId === student.id)?.status;
                                     
                                     const getCode = (s?: AttendanceStatus) => s === AttendanceStatus.PRESENT ? 'P' : s === AttendanceStatus.ABSENT ? 'A' : s === AttendanceStatus.LATE ? 'L' : '-';
                                     const getColor = (s?: AttendanceStatus) => s === AttendanceStatus.ABSENT ? 'text-rose-600 font-bold' : s === AttendanceStatus.LATE ? 'text-amber-600 font-bold' : 'text-slate-400';

                                     return (
                                         <td key={d} className="border text-center text-[10px] p-0 h-8">
                                             <div className="flex flex-col h-full">
                                                 <div className={`flex-1 border-b flex items-center justify-center ${getColor(mStatus)} bg-slate-50/50`}>{getCode(mStatus)}</div>
                                                 <div className={`flex-1 flex items-center justify-center ${getColor(eStatus)}`}>{getCode(eStatus)}</div>
                                             </div>
                                         </td>
                                     );
                                 })}
                             </tr>
                         ))}
                     </tbody>
                 </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;