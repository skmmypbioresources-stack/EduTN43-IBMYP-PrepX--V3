// Multi-Sheet Excel Attendance Register Generator with Rich Color Formatting
// Generates an official school Attendance Register with colored cell formatting

import * as XLSX from 'xlsx-js-style';
import { ClassSection, ClassAttendanceLog, AttendanceStatus, Student } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Clean Border
const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

// -------------------------------------------------------------
// STYLE DEFINITIONS FOR STATUS CODES & HEADERS
// -------------------------------------------------------------
const STYLES = {
  // Title & School Banner
  title: {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  subtitle: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1E293B' } },
    fill: { fgColor: { rgb: 'F1F5F9' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  },
  
  // Table Headers
  headerDark: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '334155' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: THIN_BORDER,
  },
  headerSlate: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'E2E8F0' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: THIN_BORDER,
  },
  headerMorning: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '1E40AF' } },
    fill: { fgColor: { rgb: 'DBEAFE' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  headerEvening: {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '3730A3' } },
    fill: { fgColor: { rgb: 'E0E7FF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },

  // Student Identity Columns
  rollCell: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '475569' } },
    fill: { fgColor: { rgb: 'F8FAFC' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  studentNameCell: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: THIN_BORDER,
  },

  // 🌟 ATTENDANCE STATUS COLORS (Present, Absent, Late, None)
  present: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1B5E20' } }, // Deep Forest Green
    fill: { fgColor: { rgb: 'E8F5E9' } }, // Soft Pastel Green
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  absent: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'B71C1C' } }, // Deep Crimson Red
    fill: { fgColor: { rgb: 'FFEBEE' } }, // Soft Light Red
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  late: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'B45309' } }, // Deep Amber / Orange
    fill: { fgColor: { rgb: 'FEF3C7' } }, // Soft Light Amber
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  none: {
    font: { name: 'Calibri', sz: 10, color: { rgb: '94A3B8' } }, // Muted Slate Gray
    fill: { fgColor: { rgb: 'F8FAFC' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  weekend: {
    font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '64748B' } },
    fill: { fgColor: { rgb: 'F1F5F9' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },

  // Summary Metrics Columns
  summaryPresent: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1B5E20' } },
    fill: { fgColor: { rgb: 'DCFCE7' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  summaryAbsent: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'B71C1C' } },
    fill: { fgColor: { rgb: 'FFE4E6' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  summaryLate: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'B45309' } },
    fill: { fgColor: { rgb: 'FEF3C7' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },
  summaryPercent: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '312E81' } },
    fill: { fgColor: { rgb: 'EEF2FF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  },

  // KPI Boxes in Individual Student Sheets
  kpiLabel: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '334155' } },
    fill: { fgColor: { rgb: 'F8FAFC' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: THIN_BORDER,
  },
  kpiValue: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: THIN_BORDER,
  }
};

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
  
  // Sort students numerically by roll number
  const students = [...(classData.students || [])].sort((a, b) => {
    const rA = parseInt(String(a.rollNumber || '0'), 10) || 0;
    const rB = parseInt(String(b.rollNumber || '0'), 10) || 0;
    if (rA && rB) return rA - rB;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Filter logs for this specific class
  const classLogs = allMonthlyLogs.filter(l => l.classId === classData.id);

  // -------------------------------------------------------------
  // 1. MASTER REGISTER SHEET (Overview of All Students in Class)
  // -------------------------------------------------------------
  const ws: any = {};
  let rowIndex = 0;

  const setCell = (r: number, c: number, value: any, style?: any) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    ws[cellRef] = {
      v: value,
      t: typeof value === 'number' ? 'n' : 's',
      s: style || {}
    };
  };

  // Header Title Banners (Rows 0-2)
  setCell(0, 0, 'GOOD SHEPHERD INTERNATIONAL SCHOOL (GSIS)', STYLES.title);
  setCell(1, 0, `MONTHLY ATTENDANCE REGISTER - ${classData.grade.toUpperCase()} (SECTION ${classData.section.toUpperCase()})`, STYLES.title);
  setCell(2, 0, `Wing: ${classData.wing}   |   Academic Period: ${monthName} ${year}   |   Total Students: ${students.length}`, STYLES.subtitle);
  
  rowIndex = 4; // Start table at Row 4

  // Table Column Headers (Row 4, 5, 6)
  setCell(rowIndex, 0, 'Roll #', STYLES.headerDark);
  setCell(rowIndex + 1, 0, '', STYLES.headerDark);
  setCell(rowIndex + 2, 0, '', STYLES.headerDark);

  setCell(rowIndex, 1, 'Student Name', STYLES.headerDark);
  setCell(rowIndex + 1, 1, '', STYLES.headerDark);
  setCell(rowIndex + 2, 1, '', STYLES.headerDark);

  let colIdx = 2;
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const dayName = DAYS_OF_WEEK[d.getDay()];

    setCell(rowIndex, colIdx, `Day ${day}`, STYLES.headerSlate);
    setCell(rowIndex, colIdx + 1, '', STYLES.headerSlate);

    setCell(rowIndex + 1, colIdx, dayName, STYLES.headerSlate);
    setCell(rowIndex + 1, colIdx + 1, '', STYLES.headerSlate);

    setCell(rowIndex + 2, colIdx, 'M', STYLES.headerMorning);
    setCell(rowIndex + 2, colIdx + 1, 'E', STYLES.headerEvening);

    colIdx += 2;
  }

  // Summary Column Headers
  setCell(rowIndex, colIdx, 'Present (P)', STYLES.summaryPresent);
  setCell(rowIndex + 1, colIdx, '', STYLES.summaryPresent);
  setCell(rowIndex + 2, colIdx, 'Total', STYLES.summaryPresent);

  setCell(rowIndex, colIdx + 1, 'Absent (A)', STYLES.summaryAbsent);
  setCell(rowIndex + 1, colIdx + 1, '', STYLES.summaryAbsent);
  setCell(rowIndex + 2, colIdx + 1, 'Total', STYLES.summaryAbsent);

  setCell(rowIndex, colIdx + 2, 'Late (L)', STYLES.summaryLate);
  setCell(rowIndex + 1, colIdx + 2, '', STYLES.summaryLate);
  setCell(rowIndex + 2, colIdx + 2, 'Total', STYLES.summaryLate);

  setCell(rowIndex, colIdx + 3, 'Attendance %', STYLES.summaryPercent);
  setCell(rowIndex + 1, colIdx + 3, '', STYLES.summaryPercent);
  setCell(rowIndex + 2, colIdx + 3, 'Rate', STYLES.summaryPercent);

  rowIndex += 3; // Now at first student row (Row 7)

  // Populate Student Rows with Color-Coded Statuses
  students.forEach((student) => {
    setCell(rowIndex, 0, student.rollNumber || '-', STYLES.rollCell);
    setCell(rowIndex, 1, student.name.toUpperCase(), STYLES.studentNameCell);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalSessions = 0;
    let currentCol = 2;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayLogs = classLogs.filter(l => new Date(l.timestamp).getDate() === day);
      dayLogs.sort((a, b) => b.timestamp - a.timestamp);

      const morningLog = dayLogs.find(l => l.session === 'Morning');
      const eveningLog = dayLogs.find(l => l.session === 'Evening');

      const findStatus = (log?: ClassAttendanceLog) => {
        if (!log) return undefined;
        return log.records.find(r => 
          r.studentId === student.id || 
          (r as any).studentName?.trim().toUpperCase() === student.name.trim().toUpperCase()
        )?.status;
      };

      const mStatus = findStatus(morningLog);
      const eStatus = findStatus(eveningLog);

      const getStyleAndCode = (status?: AttendanceStatus) => {
        if (!status) return { code: '-', style: STYLES.none };
        totalSessions++;
        if (status === AttendanceStatus.PRESENT) {
          totalPresent++;
          return { code: 'P', style: STYLES.present };
        }
        if (status === AttendanceStatus.ABSENT) {
          totalAbsent++;
          return { code: 'A', style: STYLES.absent };
        }
        if (status === AttendanceStatus.LATE) {
          totalLate++;
          return { code: 'L', style: STYLES.late };
        }
        return { code: '-', style: STYLES.none };
      };

      const mResult = getStyleAndCode(mStatus);
      const eResult = getStyleAndCode(eStatus);

      setCell(rowIndex, currentCol, mResult.code, mResult.style);
      setCell(rowIndex, currentCol + 1, eResult.code, eResult.style);

      currentCol += 2;
    }

    const pct = totalSessions > 0 ? `${Math.round(((totalPresent + totalLate) / totalSessions) * 100)}%` : '0%';
    setCell(rowIndex, currentCol, totalPresent, STYLES.summaryPresent);
    setCell(rowIndex, currentCol + 1, totalAbsent, STYLES.summaryAbsent);
    setCell(rowIndex, currentCol + 2, totalLate, STYLES.summaryLate);
    setCell(rowIndex, currentCol + 3, pct, STYLES.summaryPercent);

    rowIndex++;
  });

  const totalCols = 2 + (totalDaysInMonth * 2) + 4;
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIndex - 1, c: totalCols - 1 } });

  // Merges for Header Titles & Multi-Columns
  const masterMerges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } },
    { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } }, // Roll #
    { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } }, // Student Name
  ];

  let mCol = 2;
  for (let day = 1; day <= totalDaysInMonth; day++) {
    masterMerges.push({ s: { r: 4, c: mCol }, e: { r: 4, c: mCol + 1 } }); // Day header
    masterMerges.push({ s: { r: 5, c: mCol }, e: { r: 5, c: mCol + 1 } }); // Day Name
    mCol += 2;
  }
  masterMerges.push({ s: { r: 4, c: mCol }, e: { r: 5, c: mCol } }); // Total Present
  masterMerges.push({ s: { r: 4, c: mCol + 1 }, e: { r: 5, c: mCol + 1 } }); // Total Absent
  masterMerges.push({ s: { r: 4, c: mCol + 2 }, e: { r: 5, c: mCol + 2 } }); // Total Late
  masterMerges.push({ s: { r: 4, c: mCol + 3 }, e: { r: 5, c: mCol + 3 } }); // Attendance Rate %

  ws['!merges'] = masterMerges;

  // Set column widths for Master Sheet
  const masterColWidths: any[] = [{ wch: 10 }, { wch: 28 }];
  for (let day = 1; day <= totalDaysInMonth; day++) {
    masterColWidths.push({ wch: 5 }, { wch: 5 });
  }
  masterColWidths.push({ wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 15 });
  ws['!cols'] = masterColWidths;

  const masterSheetName = getSafeSheetName(`Class Register`, 'Master', usedSheetNames);
  XLSX.utils.book_append_sheet(wb, ws, masterSheetName);

  // -------------------------------------------------------------
  // 2. INDIVIDUAL STUDENT CALENDAR SHEETS (One Sheet per Student)
  // -------------------------------------------------------------
  students.forEach((student) => {
    const sws: any = {};
    let sRow = 0;

    const setSCell = (r: number, c: number, value: any, style?: any) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      sws[cellRef] = {
        v: value,
        t: typeof value === 'number' ? 'n' : 's',
        s: style || {}
      };
    };

    // Header Card
    setSCell(0, 0, 'GOOD SHEPHERD INTERNATIONAL SCHOOL', STYLES.title);
    setSCell(1, 0, 'INDIVIDUAL STUDENT ATTENDANCE REGISTER & CALENDAR', STYLES.title);
    
    setSCell(3, 0, 'Student Name:', STYLES.kpiLabel);
    setSCell(3, 1, student.name.toUpperCase(), STYLES.studentNameCell);

    setSCell(4, 0, 'Roll Number:', STYLES.kpiLabel);
    setSCell(4, 1, student.rollNumber || '-', STYLES.rollCell);

    setSCell(5, 0, 'Class & Section:', STYLES.kpiLabel);
    setSCell(5, 1, `${classData.grade} - Section ${classData.section} (${classData.wing})`, STYLES.kpiValue);

    setSCell(6, 0, 'Academic Month:', STYLES.kpiLabel);
    setSCell(6, 1, `${monthName} ${year}`, STYLES.kpiValue);

    // Calculate individual statistics
    let sPresent = 0;
    let sAbsent = 0;
    let sLate = 0;
    let sTotalSessions = 0;

    // Daily Calendar Table Header (Row 9)
    sRow = 9;
    setSCell(sRow, 0, 'Date', STYLES.headerDark);
    setSCell(sRow, 1, 'Day of Week', STYLES.headerDark);
    setSCell(sRow, 2, 'Morning Prep', STYLES.headerMorning);
    setSCell(sRow, 3, 'Evening Prep', STYLES.headerEvening);
    setSCell(sRow, 4, 'Daily Status', STYLES.headerDark);
    setSCell(sRow, 5, 'Notes / Remarks', STYLES.headerDark);
    sRow++;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, monthIndex, day);
      const dayName = DAYS_OF_WEEK[d.getDay()];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const formattedDate = `${String(day).padStart(2, '0')}-${monthName.substring(0, 3)}-${year}`;

      const dayLogs = classLogs.filter(l => new Date(l.timestamp).getDate() === day);
      dayLogs.sort((a, b) => b.timestamp - a.timestamp);

      const morningLog = dayLogs.find(l => l.session === 'Morning');
      const eveningLog = dayLogs.find(l => l.session === 'Evening');

      const findStatus = (log?: ClassAttendanceLog) => {
        if (!log) return undefined;
        return log.records.find(r => 
          r.studentId === student.id || 
          (r as any).studentName?.trim().toUpperCase() === student.name.trim().toUpperCase()
        );
      };

      const mRec = findStatus(morningLog);
      const eRec = findStatus(eveningLog);

      let mText = 'NO RECORD';
      let mStyle = isWeekend ? STYLES.weekend : STYLES.none;
      let eText = 'NO RECORD';
      let eStyle = isWeekend ? STYLES.weekend : STYLES.none;
      const notes: string[] = [];

      if (mRec) {
        sTotalSessions++;
        if (mRec.status === AttendanceStatus.PRESENT) { sPresent++; mText = 'PRESENT'; mStyle = STYLES.present; }
        else if (mRec.status === AttendanceStatus.ABSENT) { sAbsent++; mText = 'ABSENT'; mStyle = STYLES.absent; if (mRec.reason) notes.push(`M: ${mRec.reason}`); }
        else if (mRec.status === AttendanceStatus.LATE) { sLate++; mText = 'LATE'; mStyle = STYLES.late; if (mRec.reason) notes.push(`M Late: ${mRec.reason}`); }
      }

      if (eRec) {
        sTotalSessions++;
        if (eRec.status === AttendanceStatus.PRESENT) { sPresent++; eRec; eText = 'PRESENT'; eStyle = STYLES.present; }
        else if (eRec.status === AttendanceStatus.ABSENT) { sAbsent++; eText = 'ABSENT'; eStyle = STYLES.absent; if (eRec.reason) notes.push(`E: ${eRec.reason}`); }
        else if (eRec.status === AttendanceStatus.LATE) { sLate++; eText = 'LATE'; eStyle = STYLES.late; if (eRec.reason) notes.push(`E Late: ${eRec.reason}`); }
      }

      let dailyStatus = 'Unrecorded';
      let statusStyle = STYLES.none;
      if (mText === 'PRESENT' && eText === 'PRESENT') { dailyStatus = 'Full Day Present'; statusStyle = STYLES.present; }
      else if (mText === 'ABSENT' && eText === 'ABSENT') { dailyStatus = 'Full Day Absent'; statusStyle = STYLES.absent; }
      else if (mText === 'PRESENT' || eText === 'PRESENT') { dailyStatus = 'Present (Single Session)'; statusStyle = STYLES.present; }
      else if (mText === 'LATE' || eText === 'LATE') { dailyStatus = 'Late Arrival'; statusStyle = STYLES.late; }
      else if (mText === 'ABSENT' || eText === 'ABSENT') { dailyStatus = 'Absent'; statusStyle = STYLES.absent; }
      else if (isWeekend && sTotalSessions === 0) { dailyStatus = 'Weekend'; statusStyle = STYLES.weekend; }

      const dateCellStyle = {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: isWeekend ? 'F1F5F9' : 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: THIN_BORDER
      };

      const dayCellStyle = {
        font: { name: 'Calibri', sz: 10, color: { rgb: isWeekend ? '64748B' : '1E293B' } },
        fill: { fgColor: { rgb: isWeekend ? 'F1F5F9' : 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: THIN_BORDER
      };

      const notesCellStyle = {
        font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: THIN_BORDER
      };

      setSCell(sRow, 0, formattedDate, dateCellStyle);
      setSCell(sRow, 1, dayName, dayCellStyle);
      setSCell(sRow, 2, mText, mStyle);
      setSCell(sRow, 3, eText, eStyle);
      setSCell(sRow, 4, dailyStatus, statusStyle);
      setSCell(sRow, 5, notes.join('; ') || (isWeekend ? 'Weekend' : '-'), notesCellStyle);
      sRow++;
    }

    const attendancePct = sTotalSessions > 0 ? `${Math.round(((sPresent + sLate) / sTotalSessions) * 100)}%` : '0%';

    // KPI Summary Box on Right Side (Columns 3 & 4 at Row 3-7)
    setSCell(3, 3, 'Total Sessions Held:', STYLES.kpiLabel);
    setSCell(3, 4, sTotalSessions, STYLES.kpiValue);

    setSCell(4, 3, 'Sessions Present (P):', STYLES.kpiLabel);
    setSCell(4, 4, sPresent, STYLES.summaryPresent);

    setSCell(5, 3, 'Sessions Absent (A):', STYLES.kpiLabel);
    setSCell(5, 4, sAbsent, STYLES.summaryAbsent);

    setSCell(6, 3, 'Sessions Late (L):', STYLES.kpiLabel);
    setSCell(6, 4, sLate, STYLES.summaryLate);

    setSCell(7, 3, 'Net Attendance Rate:', STYLES.kpiLabel);
    setSCell(7, 4, attendancePct, STYLES.summaryPercent);

    sws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sRow - 1, c: 5 } });

    // Merges
    sws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    // Column Widths
    sws['!cols'] = [
      { wch: 16 }, // Date
      { wch: 14 }, // Day
      { wch: 20 }, // Morning
      { wch: 20 }, // Evening
      { wch: 26 }, // Daily Status
      { wch: 38 }  // Remarks
    ];

    // Sheet Name formatted as "Roll - StudentName" or "StudentName"
    const rawSheetLabel = student.rollNumber 
      ? `R${student.rollNumber}-${student.name}` 
      : student.name;
    const sheetName = getSafeSheetName(rawSheetLabel, `Student_${student.id}`, usedSheetNames);
    
    XLSX.utils.book_append_sheet(wb, sws, sheetName);
  });

  // Write and download the Excel file
  const fileName = `GSIS_Attendance_Register_${classData.grade.replace(/\s+/g, '_')}_${classData.section}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

