
import React, { useEffect, useState } from 'react';
import { Briefcase, AlertTriangle, Users, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { getLogsForToday, getDisciplinaryRecordsForToday, getClasses } from '../services/storageService';
import { ClassAttendanceLog, AttendanceStatus, DisciplinaryRecord, ClassSection, Wing } from '../types';

const HOSDashboard: React.FC = () => {
  const [logs, setLogs] = useState<ClassAttendanceLog[]>([]);
  const [discRecords, setDiscRecords] = useState<DisciplinaryRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);

  // Real-time Firebase Sync trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('storageService_classUpdate', handler);
    window.addEventListener('storageService_discUpdate', handler);
    window.addEventListener('storageService_logsUpdate', handler);
    return () => {
      window.removeEventListener('storageService_classUpdate', handler);
      window.removeEventListener('storageService_discUpdate', handler);
      window.removeEventListener('storageService_logsUpdate', handler);
    };
  }, []);

  useEffect(() => {
    setClasses(getClasses());
    setLogs(getLogsForToday());
    const allRecords = getDisciplinaryRecordsForToday();
    setDiscRecords(allRecords.filter(r => r.escalatedToHOS));
  }, [refreshTrigger]);

  const wings: Wing[] = ['MYP', 'MS', 'HS', 'HSS'];

  // Helper to generate chart data for a specific wing
  const getWingChartData = (wing: Wing) => {
    // Get all classes for this wing
    const wingClasses = classes.filter(c => c.wing === wing);
    
    // Sort logically (Grade 1 before 2, Section A before B)
    wingClasses.sort((a, b) => a.id.localeCompare(b.id));

    return wingClasses.map(cls => {
        // Find logs for this class. 
        // We prioritize showing the LATEST submission to represent current status.
        const clsLogs = logs.filter(l => l.classId === cls.id);
        
        let p = 0, a = 0, l = 0;
        let submitted = false;

        if (clsLogs.length > 0) {
            // Find the most recent log
            const latestLog = clsLogs.reduce((prev, current) => (prev.timestamp > current.timestamp) ? prev : current);
            
            latestLog.records.forEach(r => {
                if (r.status === AttendanceStatus.PRESENT) p++;
                if (r.status === AttendanceStatus.ABSENT) a++;
                if (r.status === AttendanceStatus.LATE) l++;
            });
            submitted = true;
        }

        return {
            name: `${cls.grade}-${cls.section}`, // X-Axis Label
            Present: p,
            Late: l,
            Absent: a,
            Strength: cls.students.length, // Total Capacity
            submitted: submitted
        };
    });
  };

  // --- Issues Log ---
  const attendanceIssues = logs.flatMap(log => {
    const className = classes.find(c => c.id === log.classId);
    return log.records
      .filter(r => r.status !== AttendanceStatus.PRESENT)
      .map(r => {
        const student = className?.students.find(s => s.id === r.studentId);
        return {
            id: r.studentId + log.id,
            studentName: student?.name || 'Unknown',
            className: className ? `${className.grade}-${className.section}` : log.classId,
            wing: className?.wing || '?',
            type: r.status === AttendanceStatus.ABSENT ? 'Absent' : 'Late',
            reason: r.reason || 'No reason',
            teacher: log.teacherName,
            time: new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
      });
  });

  const disciplinaryIssues = discRecords.map(r => {
      const cls = classes.find(c => c.id === r.classId);
      return {
        id: r.id,
        studentName: r.studentName,
        className: r.className,
        wing: cls?.wing || '?',
        type: 'Disciplinary',
        reason: r.description,
        teacher: r.reportedBy,
        time: new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
  });

  const allIssues = [...attendanceIssues, ...disciplinaryIssues].sort((a, b) => {
      const p = (t: string) => (t === 'Disciplinary' ? 3 : t === 'Absent' ? 2 : 1);
      return p(b.type) - p(a.type);
  });

  // Calculate top-level stats for the header cards
  const totalSubmissions = logs.length;
  const totalClasses = classes.length;
  const totalPresent = logs.reduce((sum, log) => sum + log.records.filter(r => r.status === AttendanceStatus.PRESENT).length, 0);
  const totalIssues = allIssues.length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 pb-20 relative">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-purple-600" /> HOS Executive View
            </h1>
            <p className="text-slate-500 mt-2">Real-time attendance & strength analytics across all wings.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
             <div className="text-center px-6 border-r border-slate-100">
                 <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Submissions</div>
                 <div className="font-black text-2xl text-slate-800">{totalSubmissions}/{totalClasses}</div>
             </div>
             <div className="text-center px-6 border-r border-slate-100">
                 <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Present</div>
                 <div className="font-black text-2xl text-emerald-600">{totalPresent}</div>
             </div>
             <div className="text-center px-6">
                 <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Issues</div>
                 <div className="font-black text-2xl text-rose-600">{totalIssues}</div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Main Charts Column */}
          <div className="lg:col-span-2 space-y-8">
              {wings.map(wing => {
                  const data = getWingChartData(wing);
                  // Only render if classes exist in this wing (to avoid empty blocks if data missing)
                  if (data.length === 0) return null;

                  return (
                    <div key={wing} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${wing === 'MYP' ? 'bg-blue-500' : wing === 'MS' ? 'bg-indigo-500' : wing === 'HS' ? 'bg-purple-500' : 'bg-pink-500'}`}></span>
                                {wing} Wing Overview
                             </h2>
                             <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                                 {data.filter(d => d.submitted).length} / {data.length} Submitted
                             </span>
                        </div>
                        
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{top: 20, right: 30, left: 0, bottom: 5}} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Legend wrapperStyle={{paddingTop: '0px'}} iconType="circle" iconSize={8} />
                                    
                                    {/* Bar 1: Total Strength (Light Gray) */}
                                    <Bar dataKey="Strength" fill="#e2e8f0" radius={[4,4,4,4]} barSize={12} name="Total Capacity" />
                                    
                                    {/* Bar 2: Present (Bright Green) */}
                                    <Bar dataKey="Present" fill="#10b981" radius={[4,4,4,4]} barSize={12} name="Present">
                                        <LabelList dataKey="Present" position="top" style={{fontSize: 10, fill: '#10b981', fontWeight: 'bold'}} />
                                    </Bar>

                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                  );
              })}
          </div>

          {/* Sidebar Issues List */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg overflow-hidden sticky top-24">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600"/> 
                    Critical Issues Log
                </h2>
                <div className="overflow-y-auto max-h-[70vh] space-y-4 pr-2 custom-scrollbar">
                    {allIssues.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2"/>
                            <p className="text-slate-400 font-medium">All Clear!</p>
                            <p className="text-xs text-slate-400">No critical issues reported today.</p>
                        </div>
                    ) : (
                        allIssues.map((issue, idx) => (
                            <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-3 last:border-0 hover:bg-slate-50/50 p-2 rounded-lg transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-slate-800 text-sm">{issue.studentName}</div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${issue.type==='Disciplinary'?'bg-rose-100 text-rose-700':issue.type==='Absent'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600'}`}>{issue.type}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium flex gap-2">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{issue.wing}</span>
                                    <span>{issue.className}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{issue.time}</span>
                                </div>
                                <div className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">"{issue.reason}"</div>
                                <div className="text-[10px] text-slate-400 text-right">Rep: {issue.teacher}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default HOSDashboard;
