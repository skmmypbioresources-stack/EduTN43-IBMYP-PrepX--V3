// Multi-Sheet Excel Attendance Register Generator
// Generates an official school Attendance Register with individual sheets for each student like a calendar

import * as XLSX from 'xlsx';
import { ClassSection, ClassAttendanceLog, AttendanceStatus, Student } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Sanitize Excel sheet name (Max 31 chars, no invalid characters, unique)
const getSafeSheetName = (rawName: string, fallbackId: string, usedNames: Set<string>): string => {
  let clean = rawName.replace(/[\\/\?\*\[\]\:]/g, ' ').trim();
  if (!clean) clean = fallbackId;
  if (clean.length > 28) clean = clean.substring(0, 28);
  
  let candidate = clean;
  let counter = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${clean.substring(0, 24)} (${counter++})`;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
};

export const exportClassMonthlyAttendanceWorkbook = (
  classData: ClassSection,
  monthIndex: number,
  year: number,
  allMonthlyLogs: ClassAttendanceLog[]
) => {
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  const monthName = MONTH_NAMES[monthIndex] || 'Month';
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const students = classData.students || [];

  // Filter logs for this specific class
  const classLogs = allMonthlyLogs.filter(l => l.classId === classData.id);

  // -------------------------------------------------------------
  // 1. MASTER REGISTER SHEET (Overview of All Students in Class)
  // -------------------------------------------------------------
  const masterRows: any[][] = [];

  // Header Title
  masterRows.push(['GOOD SHEPHERD INTERNATIONAL SCHOOL (GSIS)']);
  masterRows.push([`MONTHLY ATTENDANCE REGISTER - ${classData.grade} (SECTION ${classData.section})`]);
  masterRows.push([`Wing: ${classData.wing}`, `Academic Period: ${monthName} ${year}`, `Total Students: ${students.length}`]);
  masterRows.push([]); // blank

  // Table Column Headers
  const headerRow1: any[] = ['Roll #', 'Student Name'];
  const headerRow2: any[] = ['', ''];
  const subHeaderRow: any[] = ['', ''];

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const dayName = DAYS_OF_WEEK[d.getDay()];
    headerRow1.push(`Day ${day}`, '');
    headerRow2.push(dayName, '');
    subHeaderRow.push('Morning', 'Evening');
  }

  headerRow1.push('Total Present', 'Total Absent', 'Total Late', 'Attendance %');
  headerRow2.push('', '', '', '');
  subHeaderRow.push('', '', '', '');

  masterRows.push(headerRow1);
  masterRows.push(headerRow2);
  masterRows.push(subHeaderRow);

  // Student Rows in Master Register
  students.forEach((student) => {
    const row: any[] = [student.rollNumber || '-', student.name];
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalSessions = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayLogs = classLogs.filter(l => new Date(l.timestamp).getDate() === day);
      // Sort newest first
      dayLogs.sort((a, b) => b.timestamp - a.timestamp);

      const morningLog = dayLogs.find(l => l.session === 'Morning');
      const eveningLog = dayLogs.find(l => l.session === 'Evening');

      const mRec = morningLog?.records.find(r => r.studentId === student.id);
      const eRec = eveningLog?.records.find(r => r.studentId === student.id);

      const getCode = (rec?: { status: AttendanceStatus }) => {
        if (!rec) return '-';
        totalSessions++;
        if (rec.status === AttendanceStatus.PRESENT) {
          totalPresent++;
          return 'P';
        }
        if (rec.status === AttendanceStatus.ABSENT) {
          totalAbsent++;
          return 'A';
        }
        if (rec.status === AttendanceStatus.LATE) {
          totalLate++;
          return 'L';
        }
        return '-';
      };

      row.push(getCode(mRec));
      row.push(getCode(eRec));
    }

    const pct = totalSessions > 0 ? `${Math.round(((totalPresent + totalLate) / totalSessions) * 100)}%` : '0%';
    row.push(totalPresent, totalAbsent, totalLate, pct);
    masterRows.push(row);
  });

  const masterWs = XLSX.utils.aoa_to_sheet(masterRows);

  // Set column widths for Master Sheet
  const masterColWidths: any[] = [{ wch: 8 }, { wch: 26 }];
  for (let day = 1; day <= totalDaysInMonth; day++) {
    masterColWidths.push({ wch: 5 }, { wch: 5 });
  }
  masterColWidths.push({ wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 15 });
  masterWs['!cols'] = masterColWidths;

  const masterSheetName = getSafeSheetName(`Class Register`, 'Master', usedSheetNames);
  XLSX.utils.book_append_sheet(wb, masterWs, masterSheetName);

  // -------------------------------------------------------------
  // 2. INDIVIDUAL STUDENT CALENDAR SHEETS (One Sheet per Student)
  // -------------------------------------------------------------
  students.forEach((student) => {
    const studentRows: any[][] = [];

    // Header Card
    studentRows.push(['GOOD SHEPHERD INTERNATIONAL SCHOOL']);
    studentRows.push(['INDIVIDUAL STUDENT ATTENDANCE REGISTER & CALENDAR']);
    studentRows.push([]);
    studentRows.push(['Student Name:', student.name.toUpperCase()]);
    studentRows.push(['Roll Number:', student.rollNumber || '-']);
    studentRows.push(['Class & Section:', `${classData.grade} - Section ${classData.section} (${classData.wing})`]);
    studentRows.push(['Academic Month:', `${monthName} ${year}`]);
    studentRows.push([]);

    // Calculate individual statistics
    let sPresent = 0;
    let sAbsent = 0;
    let sLate = 0;
    let sTotalSessions = 0;

    const calendarRows: any[][] = [];
    calendarRows.push(['Date', 'Day of Week', 'Morning Prep Session', 'Evening Prep Session', 'Daily Attendance Status', 'Notes / Remarks']);

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, monthIndex, day);
      const dayName = DAYS_OF_WEEK[d.getDay()];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const formattedDate = `${String(day).padStart(2, '0')}-${monthName.substring(0, 3)}-${year}`;

      const dayLogs = classLogs.filter(l => new Date(l.timestamp).getDate() === day);
      dayLogs.sort((a, b) => b.timestamp - a.timestamp);

      const morningLog = dayLogs.find(l => l.session === 'Morning');
      const eveningLog = dayLogs.find(l => l.session === 'Evening');

      const mRec = morningLog?.records.find(r => r.studentId === student.id);
      const eRec = eveningLog?.records.find(r => r.studentId === student.id);

      let mText = 'NO RECORD';
      let eText = 'NO RECORD';
      const notes: string[] = [];

      if (mRec) {
        sTotalSessions++;
        if (mRec.status === AttendanceStatus.PRESENT) { sPresent++; mText = 'PRESENT'; }
        else if (mRec.status === AttendanceStatus.ABSENT) { sAbsent++; mText = 'ABSENT'; if (mRec.reason) notes.push(`M: ${mRec.reason}`); }
        else if (mRec.status === AttendanceStatus.LATE) { sLate++; mText = 'LATE'; if (mRec.reason) notes.push(`M Late: ${mRec.reason}`); }
      }

      if (eRec) {
        sTotalSessions++;
        if (eRec.status === AttendanceStatus.PRESENT) { sPresent++; eText = 'PRESENT'; }
        else if (eRec.status === AttendanceStatus.ABSENT) { sAbsent++; eText = 'ABSENT'; if (eRec.reason) notes.push(`E: ${eRec.reason}`); }
        else if (eRec.status === AttendanceStatus.LATE) { sLate++; eText = 'LATE'; if (eRec.reason) notes.push(`E Late: ${eRec.reason}`); }
      }

      let dailyStatus = 'Unrecorded';
      if (mText === 'PRESENT' && eText === 'PRESENT') dailyStatus = 'Full Day Present (100%)';
      else if (mText === 'ABSENT' && eText === 'ABSENT') dailyStatus = 'Full Day Absent (0%)';
      else if (mText === 'PRESENT' || eText === 'PRESENT') dailyStatus = 'Partial / Half Day (50%)';
      else if (mText === 'LATE' || eText === 'LATE') dailyStatus = 'Late Arrival';
      else if (isWeekend && sTotalSessions === 0) dailyStatus = 'Weekend';

      calendarRows.push([
        formattedDate,
        dayName,
        mText,
        eText,
        dailyStatus,
        notes.join('; ') || (isWeekend ? 'Weekend' : '-')
      ]);
    }

    const attendancePct = sTotalSessions > 0 ? `${Math.round(((sPresent + sLate) / sTotalSessions) * 100)}%` : '0%';

    // KPI Summary Box
    studentRows.push(['ATTENDANCE SUMMARY KPI', 'METRIC VALUE']);
    studentRows.push(['Total Prep Sessions Held:', sTotalSessions]);
    studentRows.push(['Sessions Present (P):', sPresent]);
    studentRows.push(['Sessions Absent (A):', sAbsent]);
    studentRows.push(['Sessions Late (L):', sLate]);
    studentRows.push(['Net Attendance Rate:', attendancePct]);
    studentRows.push([]);
    studentRows.push(['DAILY ATTENDANCE CALENDAR MATRIX']);

    // Append Daily Calendar Table
    calendarRows.forEach(r => studentRows.push(r));

    const studentWs = XLSX.utils.aoa_to_sheet(studentRows);

    // Auto Column Widths for student sheet
    studentWs['!cols'] = [
      { wch: 16 }, // Date
      { wch: 14 }, // Day
      { wch: 22 }, // Morning
      { wch: 22 }, // Evening
      { wch: 26 }, // Daily Status
      { wch: 35 }  // Remarks
    ];

    // Sheet Name formatted as "Roll - StudentName" or "StudentName"
    const rawSheetLabel = student.rollNumber 
      ? `R${student.rollNumber}-${student.name}` 
      : student.name;
    const sheetName = getSafeSheetName(rawSheetLabel, `Student_${student.id}`, usedSheetNames);
    
    XLSX.utils.book_append_sheet(wb, studentWs, sheetName);
  });

  // Write and download the Excel file
  const fileName = `GSIS_Attendance_Register_${classData.grade.replace(/\s+/g, '_')}_${classData.section}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
