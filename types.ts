export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late'
}

export interface Student {
  id: string;
  name: string;
  rollNumber: number;
}

export type Wing = 'MYP' | 'MS' | 'HS' | 'HSS';

export interface ClassSection {
  id: string;
  wing: Wing; // New Field
  grade: string; // e.g., "MYP 1", "Grade 6"
  section: string; // e.g., "A"
  students: Student[];
}

export interface StudentAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  reason?: string; // Required if Late or Absent
}

export type SessionType = 'Morning' | 'Evening';

export interface ClassAttendanceLog {
  id: string;
  classId: string;
  timestamp: number;
  session: SessionType;
  teacherName: string;
  records: StudentAttendanceRecord[];
}

export interface DisciplinaryRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  reportedBy: string;
  description: string;
  timestamp: number;
  escalatedToHOS?: boolean;
}

export interface DailySummary {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  aiAnalysis?: string;
}