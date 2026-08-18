import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TeacherView from './pages/TeacherView';
import CoordinatorDashboard, { CoordinatorScope } from './pages/CoordinatorDashboard';
import HOSDashboard from './pages/HOSDashboard';
import { InstallPWA } from './components/InstallPWA';
import { QrCode, ClipboardList, Shield, GraduationCap, CalendarClock, Hand, Lock, ChevronRight, X, UserCog, Sparkles } from 'lucide-react';
import { getTimetableImage, hasAnyTimetable, getClasses } from './services/storageService';
import { Wing } from './types';

export type View = 'home' | 'teacher' | 'coordinator' | 'hos';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [showCover, setShowCover] = useState(true);
  
  // Timetable State
  const [activeCoverWing, setActiveCoverWing] = useState<Wing>('MYP');
  const [timetableImage, setTimetableImage] = useState<string | null>(null);

  // Coordinator Scope Selection
  const [selectedCoordScope, setSelectedCoordScope] = useState<CoordinatorScope>('MYP');
  const [showCoordSelector, setShowCoordSelector] = useState(false);

  // Direct Launch State (from URL QR Scan)
  const [directClassId, setDirectClassId] = useState<string | null>(null);

  // Security State
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetProtectedView, setTargetProtectedView] = useState<View | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    // 1. Robust Check for URL Parameters (QR Code Direct Launch from Mobile Phone)
    let detectedClassId: string | null = null;

    // Check search query (?classId=... or ?class=...)
    const params = new URLSearchParams(window.location.search);
    detectedClassId = params.get('classId') || params.get('class') || params.get('id');

    // Check hash query (#classId=... or #/classId=... or #/teacher?classId=...)
    if (!detectedClassId && window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#\/?/, '');
      if (cleanHash.includes('=')) {
        const hashParams = new URLSearchParams(cleanHash.includes('?') ? cleanHash.split('?')[1] : cleanHash);
        detectedClassId = hashParams.get('classId') || hashParams.get('class') || hashParams.get('id');
      } else if (cleanHash.startsWith('myp-') || cleanHash.startsWith('ms-') || cleanHash.startsWith('hs-') || cleanHash.startsWith('hss-')) {
        detectedClassId = cleanHash;
      }
    }

    // Check pathname (e.g. /qr/myp-1-a or /class/myp-1-a)
    if (!detectedClassId && window.location.pathname) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && (lastPart.startsWith('myp-') || lastPart.startsWith('ms-') || lastPart.startsWith('hs-') || lastPart.startsWith('hss-'))) {
        detectedClassId = lastPart;
      }
    }

    if (detectedClassId) {
        setDirectClassId(detectedClassId);
        
        // Smart Wing Detection from ID to show relevant timetable
        let detectedWing: Wing = 'MYP';
        const lowerId = detectedClassId.toLowerCase();
        if (lowerId.startsWith('hss')) detectedWing = 'HSS';
        else if (lowerId.startsWith('hs')) detectedWing = 'HS';
        else if (lowerId.startsWith('ms')) detectedWing = 'MS';
        
        loadCoverTimetable(detectedWing);
        // Automatically switch to teacher view for rapid mobile roll call
        setCurrentView('teacher');
        setShowCover(false);
    } else {
        // 2. Load Timetable if exists and not direct launching
        if (hasAnyTimetable()) {
            loadCoverTimetable('MYP'); // Default
            setShowCover(true);
        } else {
            setShowCover(false);
        }
    }
  }, []);

  const loadCoverTimetable = (wing: Wing) => {
      setActiveCoverWing(wing);
      const img = getTimetableImage(wing);
      setTimetableImage(img);
  };

  const handleSmartCoverClick = () => {
      setShowCover(false);
      // If a class ID was found in the URL, jump straight to Teacher View
      if (directClassId) {
          setCurrentView('teacher');
      }
  };

  const handleCoordinatorClick = () => {
      setShowCoordSelector(true);
  };

  const handleScopeSelection = (scope: CoordinatorScope) => {
      setSelectedCoordScope(scope);
      setShowCoordSelector(false);
      handleProtectedNavigation('coordinator');
  };

  const handleProtectedNavigation = (view: View) => {
      setTargetProtectedView(view);
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
  };

  const verifyPin = () => {
      // HARDCODED PIN FOR DEMO: 1234
      if (pinInput === '1234') {
          if (targetProtectedView) setCurrentView(targetProtectedView);
          setShowPinModal(false);
      } else {
          setPinError(true);
          setPinInput('');
      }
  };

  const handleTeacherLogout = () => {
      setCurrentView('home');
      setDirectClassId(null);
      // Show Timetable immediately upon logout
      loadCoverTimetable('MYP'); 
      setShowCover(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* GSIS Watermark Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden print:hidden">
         <div className="text-[30vw] font-black italic font-serif text-slate-200/50 transform -rotate-12 select-none whitespace-nowrap">
            GSIS
         </div>
      </div>

      <Navbar 
        currentView={currentView} 
        onChangeView={(view) => {
            if (view === 'home' || view === 'teacher') {
                setCurrentView(view);
            } else if (view === 'coordinator') {
                setShowCoordSelector(true); // Always ask scope first via Navbar too
            } else {
                handleProtectedNavigation(view);
            }
            setShowCover(false); 
        }} 
      />
      
      {/* Coordinator Scope Selector Modal */}
      {showCoordSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <UserCog className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Select Domain</h3>
                  <p className="text-sm text-slate-500 mb-6">Which wing are you coordinating?</p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => handleScopeSelection('MYP')}
                        className="w-full py-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all font-bold text-slate-700 flex items-center justify-center"
                      >
                          MYP Wing <span className="ml-2 text-xs font-normal text-slate-500">(Grades 1-5)</span>
                      </button>
                      <button 
                        onClick={() => handleScopeSelection('MS_HS')}
                        className="w-full py-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-slate-700 flex items-center justify-center"
                      >
                          MS & HS Wing <span className="ml-2 text-xs font-normal text-slate-500">(Grades 6-10)</span>
                      </button>
                      <button 
                        onClick={() => handleScopeSelection('HSS')}
                        className="w-full py-4 rounded-xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all font-bold text-slate-700 flex items-center justify-center"
                      >
                          HSS Wing <span className="ml-2 text-xs font-normal text-slate-500">(Grades 11-12)</span>
                      </button>
                  </div>
                  
                  <button onClick={() => setShowCoordSelector(false)} className="mt-6 text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
              </div>
          </div>
      )}

      {/* PIN Security Modal */}
      {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Restricted Access</h3>
                  <p className="text-sm text-slate-500 mb-6">Enter PIN to access Admin area.</p>
                  
                  <div className="mb-6">
                      <input 
                        type="password" 
                        inputMode="numeric"
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                        placeholder="••••"
                        className={`text-center text-3xl tracking-[1em] w-full border-b-2 py-2 outline-none font-bold text-slate-800 ${pinError ? 'border-rose-500 text-rose-600' : 'border-slate-300 focus:border-indigo-600'}`}
                        maxLength={4}
                        autoFocus
                      />
                      {pinError && <p className="text-xs text-rose-500 mt-2 font-bold animate-pulse">Incorrect PIN. Try again.</p>}
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowPinModal(false)}
                        className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={verifyPin}
                        className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                      >
                          Unlock
                      </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-4">(Default PIN: 1234)</p>
              </div>
          </div>
      )}

      <main className="relative z-10">
        {currentView === 'home' && (
          <>
             {/* Smart Cover / Timetable View */}
             {showCover ? (
                <div 
                    className="fixed inset-0 z-50 bg-slate-100 flex flex-col items-center justify-center animate-in fade-in duration-500"
                >
                    {/* Wing Selector Tabs for Cover */}
                    <div className="absolute top-20 z-50 flex gap-2 p-1 bg-white/80 backdrop-blur rounded-full shadow-lg">
                        {(['MYP', 'MS', 'HS', 'HSS'] as Wing[]).map(w => (
                            <button
                                key={w}
                                onClick={(e) => { e.stopPropagation(); loadCoverTimetable(w); }}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCoverWing === w ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>

                    <div onClick={handleSmartCoverClick} className="max-w-4xl w-full px-4 relative cursor-pointer flex flex-col items-center">
                        <div className="bg-white p-3 rounded-2xl shadow-2xl border-4 border-slate-900 rotate-1 hover:rotate-0 transition-transform duration-300 mb-12 w-full">
                            {timetableImage ? (
                                <img 
                                    src={timetableImage} 
                                    alt={`${activeCoverWing} Weekly Timetable`} 
                                    className="w-full h-auto rounded-xl max-h-[65vh] object-contain"
                                />
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
                                    <CalendarClock className="w-12 h-12 mb-2 opacity-50"/>
                                    <p>No Timetable Uploaded for {activeCoverWing}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center w-full animate-bounce">
                             <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border-2 border-white/20">
                                 {directClassId ? (
                                     <>
                                        <span>Proceed to Class</span>
                                        <ChevronRight className="w-5 h-5" />
                                     </>
                                 ) : (
                                     <>
                                        <Hand className="w-5 h-5" />
                                        <span>Tap to Enter App</span>
                                     </>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Login Cards View */
                <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-in slide-in-from-bottom-8 duration-500">
                     <div className="mb-10 inline-flex p-4 rounded-full bg-slate-200/80 backdrop-blur-sm shadow-inner">
                        <Shield className="w-12 h-12 text-blue-700" />
                     </div>
                     <h1 className="text-4xl md:text-6xl font-black italic font-serif tracking-tighter mb-4 drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900">
                       GSIS IBMYP - PrepX
                     </h1>
                     <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium">
                       Comprehensive Prep Attendance System for MYP, Middle School, High School & HSS.
                     </p>
        
                     <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
                        {/* Teacher Card */}
                        <div 
                          onClick={() => setCurrentView('teacher')}
                          className="group cursor-pointer bg-white/90 backdrop-blur p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col items-center hover:-translate-y-1"
                        >
                            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <QrCode className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Teacher</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Select Wing (MYP, MS, HS, HSS), Scan QR codes, and mark attendance instantly.
                            </p>
                        </div>
        
                        {/* Coordinator Card (LOCKED) */}
                        <div 
                          onClick={handleCoordinatorClick}
                          className="group cursor-pointer bg-white/90 backdrop-blur p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col items-center hover:-translate-y-1 relative overflow-hidden"
                        >
                             <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                 <Lock className="w-5 h-5" />
                             </div>
                            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ClipboardList className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Coordinator</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Access specific section data for MYP, MS/HS, or HSS wings. (PIN Required)
                            </p>
                        </div>
        
                        {/* HOS Card (LOCKED) */}
                        <div 
                          onClick={() => handleProtectedNavigation('hos')}
                          className="group cursor-pointer bg-white/90 backdrop-blur p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all flex flex-col items-center hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-purple-500 transition-colors">
                                 <Lock className="w-5 h-5" />
                             </div>
                            <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">HOS</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Aggregated Executive View across all wings (MYP, MS, HS, HSS). (PIN Required)
                            </p>
                        </div>
                     </div>
                     
                     {/* Desktop & Mobile App Install Banner */}
                     <div className="max-w-5xl mx-auto mb-10">
                        <InstallPWA variant="card" />
                     </div>
                     
                     {/* Button to show timetable again if needed */}
                     <button 
                         onClick={() => { loadCoverTimetable('MYP'); setShowCover(true); }}
                         className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors px-4 py-2 rounded-full hover:bg-white/50 backdrop-blur"
                     >
                         <CalendarClock className="w-4 h-4" />
                         View Weekly Timetable
                     </button>
                  </div>
             )}
          </>
        )}

        {currentView === 'teacher' && <TeacherView autoSelectedClassId={directClassId} onLogout={handleTeacherLogout} />}
        {currentView === 'coordinator' && <CoordinatorDashboard scope={selectedCoordScope} />}
        {currentView === 'hos' && <HOSDashboard />}
      </main>
    </div>
  );
};

export default App;