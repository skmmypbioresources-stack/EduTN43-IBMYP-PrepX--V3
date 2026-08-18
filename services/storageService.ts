import { ClassAttendanceLog, DisciplinaryRecord, ClassSection, Student, SessionType, Wing } from '../types';
import { ALL_CLASSES_INITIAL, MYP_CLASSES } from '../constants';
import { db, auth } from './firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';

const STORAGE_KEY = 'myp_prep_attendance_logs';
const DISC_STORAGE_KEY = 'myp_disciplinary_logs';
const CLASS_DATA_KEY = 'myp_class_data_v2';
const TRASH_CLASS_KEY = 'myp_class_trash_v1';
const SETTINGS_KEY = 'myp_app_settings_v1';
const TIMETABLE_PREFIX = 'myp_prep_timetable_v2_';
const TRUSTED_DEVICE_KEY = 'myp_prep_device_trusted_v1';

const OFFICIAL_MYP_CLASS_IDS = new Set(MYP_CLASSES.map(c => c.id));

// --- Error Handling & ABAC validation context ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Active Firebase Synchronizer Subscriptions ---

const ROSTER_SYNC_VERSION_KEY = 'myp_official_roster_sync_v6';
let isMainClassesSeeded = false;

// 1. Classes Sync
onSnapshot(collection(db, "classes"), async (snapshot) => {
  if (snapshot.empty && !isMainClassesSeeded) {
    isMainClassesSeeded = true;
    console.log("Firestore classes collection is empty. Seeding from initial data...");
    const currentLocalClasses = localStorage.getItem(CLASS_DATA_KEY);
    const listToSeed = currentLocalClasses ? JSON.parse(currentLocalClasses) : ALL_CLASSES_INITIAL;
    for (const cls of listToSeed) {
      try {
        await setDoc(doc(db, "classes", cls.id), cls);
      } catch (e) {
        console.error("Failed to seed class:", cls.id, e);
      }
    }
  } else {
    const classesList: ClassSection[] = [];
    const obsoleteDocIdsToDelete: string[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data() as ClassSection;
      // If this is an obsolete or unapproved MYP class (like old myp3-c), mark for deletion
      if (data.wing === 'MYP' && !OFFICIAL_MYP_CLASS_IDS.has(data.id)) {
        obsoleteDocIdsToDelete.push(docSnap.id);
      } else {
        classesList.push(data);
      }
    });

    // Clean up obsolete classes in Firestore asynchronously
    for (const oldId of obsoleteDocIdsToDelete) {
      console.log(`Purging obsolete Firestore classroom document: ${oldId}`);
      deleteDoc(doc(db, "classes", oldId)).catch(() => {});
    }

    // Ensure all 12 official MYP classes exist and have accurate official rosters
    for (const officialCls of MYP_CLASSES) {
      const targetIndex = classesList.findIndex(c => c.id === officialCls.id);
      if (targetIndex === -1) {
        classesList.push(JSON.parse(JSON.stringify(officialCls)));
        setDoc(doc(db, "classes", officialCls.id), officialCls).catch(() => {});
      } else {
        const target = classesList[targetIndex];
        const hasDummy = target.students.some(s => 
          s.name.startsWith('VACANT') || 
          s.name.startsWith('STUDENT MYP') || 
          s.name.startsWith('STUDENT ')
        );
        if (hasDummy || target.students.length === 0) {
          classesList[targetIndex].students = JSON.parse(JSON.stringify(officialCls.students));
          setDoc(doc(db, "classes", target.id), classesList[targetIndex]).catch(() => {});
        }
      }
    }

    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classesList));
    window.dispatchEvent(new Event('storageService_classUpdate'));
  }
}, (error) => {
  console.warn("Firestore collection listen failed (expected if initializing):", error);
});

// 2. Trash Classes Sync
onSnapshot(collection(db, "trash_classes"), (snapshot) => {
  const list: ClassSection[] = [];
  snapshot.forEach(docSnap => {
    list.push(docSnap.data() as ClassSection);
  });
  localStorage.setItem(TRASH_CLASS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('storageService_trashUpdate'));
}, (error) => {
  console.warn(error);
});

// 3. Attendance Logs Sync
onSnapshot(collection(db, "attendance_logs"), (snapshot) => {
  const logsList: ClassAttendanceLog[] = [];
  snapshot.forEach(docSnap => {
    logsList.push(docSnap.data() as ClassAttendanceLog);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logsList));
  window.dispatchEvent(new Event('storageService_logsUpdate'));
}, (error) => {
  console.warn(error);
});

// 4. Disciplinary Records Sync
onSnapshot(collection(db, "disciplinary_records"), (snapshot) => {
  const recordsList: DisciplinaryRecord[] = [];
  snapshot.forEach(docSnap => {
    recordsList.push(docSnap.data() as DisciplinaryRecord);
  });
  localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(recordsList));
  window.dispatchEvent(new Event('storageService_discUpdate'));
}, (error) => {
  console.warn(error);
});

// 5. App Settings Sync
onSnapshot(doc(db, "settings", "global"), (snap) => {
  if (snap.exists()) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(snap.data()));
    window.dispatchEvent(new Event('storageService_settingsUpdate'));
  } else {
    const defaultSettings = { isMorningLocked: true, teacherAccessPin: '8899' };
    setDoc(doc(db, "settings", "global"), defaultSettings).catch(e => console.error(e));
  }
}, (error) => {
  console.warn(error);
});

// 6. Timetables Sync
onSnapshot(collection(db, "timetables"), (snapshot) => {
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    localStorage.setItem(`${TIMETABLE_PREFIX}${docSnap.id}`, data.image || "");
  });
  window.dispatchEvent(new Event('storageService_timetableUpdate'));
}, (error) => {
  console.warn(error);
});


// --- Timetable Management (Wing Specific) ---

export const saveTimetableImage = (imageBase64: string, wing: Wing): void => {
  try {
    localStorage.setItem(`${TIMETABLE_PREFIX}${wing}`, imageBase64);
    setDoc(doc(db, "timetables", wing), { wing, image: imageBase64 })
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `timetables/${wing}`));
  } catch (e) {
    console.error("Storage full or error", e);
    alert("Image too large for local browser storage. Please compress the image or try a smaller screenshot.");
  }
};

export const getTimetableImage = (wing: Wing): string | null => {
  return localStorage.getItem(`${TIMETABLE_PREFIX}${wing}`);
};

export const hasAnyTimetable = (): boolean => {
  const wings: Wing[] = ['MYP', 'MS', 'HS', 'HSS'];
  return wings.some(w => localStorage.getItem(`${TIMETABLE_PREFIX}${w}`) !== null);
};

// --- App Settings (Session Locking & PINs) ---

export interface AppSettings {
  isMorningLocked: boolean;
  teacherAccessPin: string;
}

export const getAppSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return { isMorningLocked: true, teacherAccessPin: '8899' };
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.teacherAccessPin) parsed.teacherAccessPin = '8899';
    return parsed;
  } catch (e) {
    return { isMorningLocked: true, teacherAccessPin: '8899' };
  }
};

export const saveAppSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  setDoc(doc(db, "settings", "global"), settings)
    .catch(error => handleFirestoreError(error, OperationType.WRITE, "settings/global"));
};

// --- Trusted Device Logic ---

export const isDeviceTrusted = (): boolean => {
  return localStorage.getItem(TRUSTED_DEVICE_KEY) === 'true';
};

export const trustDevice = (): void => {
  localStorage.setItem(TRUSTED_DEVICE_KEY, 'true');
};

export const untrustDevice = (): void => {
  localStorage.removeItem(TRUSTED_DEVICE_KEY);
};


// --- Class & Student Management (Dynamic Data) ---

export const getClasses = (): ClassSection[] => {
  const stored = localStorage.getItem(CLASS_DATA_KEY);
  if (!stored) {
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(ALL_CLASSES_INITIAL));
    return ALL_CLASSES_INITIAL;
  }
  try {
    let classes: ClassSection[] = JSON.parse(stored);
    
    // Purge any obsolete MYP classes (e.g., old myp3-c or extra sections not in official list)
    const initialCount = classes.length;
    classes = classes.filter(c => c.wing !== 'MYP' || OFFICIAL_MYP_CLASS_IDS.has(c.id));
    let modified = classes.length !== initialCount;

    // Safety check: Ensure all 12 official MYP classes are present with their official student roster
    for (const officialCls of MYP_CLASSES) {
      const idx = classes.findIndex(c => c.id === officialCls.id);
      if (idx === -1) {
        classes.push(JSON.parse(JSON.stringify(officialCls)));
        modified = true;
      } else {
        const hasOldOrDummy = classes[idx].students.some(s => 
          s.name.startsWith('VACANT') || 
          s.name.startsWith('STUDENT MYP') || 
          s.name.startsWith('STUDENT ')
        );
        if (hasOldOrDummy || classes[idx].students.length === 0) {
          classes[idx].students = JSON.parse(JSON.stringify(officialCls.students));
          modified = true;
        }
      }
    }
    
    if (modified) {
      localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));
    }
    return classes;
  } catch (e) {
    console.error("Failed to parse class data", e);
    return ALL_CLASSES_INITIAL;
  }
};

export const addNewClass = (wing: Wing, grade: string, sectionName: string): void => {
  const classes = getClasses();
  
  const newStudents: Student[] = [];
  for(let i=1; i<=25; i++) {
    newStudents.push({
      id: `${wing.toLowerCase()}-${grade.replace(/\s+/g,'').toLowerCase()}-${sectionName.toLowerCase()}-${Date.now()}-${i}`,
      rollNumber: i,
      name: `STUDENT ${i}`
    });
  }

  const newClass: ClassSection = {
    id: `${wing.toLowerCase()}-${grade.replace(/\s+/g,'').toLowerCase()}-${sectionName.replace(/\s+/g,'').toLowerCase()}-${Date.now()}`,
    wing: wing,
    grade: grade,
    section: sectionName,
    students: newStudents
  };

  classes.push(newClass);
  localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

  setDoc(doc(db, "classes", newClass.id), newClass)
    .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${newClass.id}`));
};

export const updateClassDetails = (classId: string, newGrade: string, newSection: string): void => {
  const classes = getClasses();
  const index = classes.findIndex(c => c.id === classId);
  if (index !== -1) {
    classes[index].grade = newGrade;
    classes[index].section = newSection;
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

    setDoc(doc(db, "classes", classId), classes[index])
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

// --- TRASH BIN LOGIC ---

export const getTrashClasses = (): ClassSection[] => {
  const stored = localStorage.getItem(TRASH_CLASS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const deleteClass = (classId: string): void => {
  const classes = getClasses();
  const trash = getTrashClasses();
  
  const classToDelete = classes.find(c => c.id === classId);
  if (classToDelete) {
    trash.push(classToDelete);
    localStorage.setItem(TRASH_CLASS_KEY, JSON.stringify(trash));
    
    const filtered = classes.filter(c => c.id !== classId);
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(filtered));

    setDoc(doc(db, "trash_classes", classId), classToDelete)
      .then(() => deleteDoc(doc(db, "classes", classId)))
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

export const restoreClass = (classId: string): void => {
  const classes = getClasses();
  const trash = getTrashClasses();
  
  const classToRestore = trash.find(c => c.id === classId);
  if (classToRestore) {
    classes.push(classToRestore);
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));
    
    const newTrash = trash.filter(c => c.id !== classId);
    localStorage.setItem(TRASH_CLASS_KEY, JSON.stringify(newTrash));

    setDoc(doc(db, "classes", classId), classToRestore)
      .then(() => deleteDoc(doc(db, "trash_classes", classId)))
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

export const permanentlyDeleteClass = (classId: string): void => {
  const trash = getTrashClasses();
  const newTrash = trash.filter(c => c.id !== classId);
  localStorage.setItem(TRASH_CLASS_KEY, JSON.stringify(newTrash));

  deleteDoc(doc(db, "trash_classes", classId))
    .catch(error => handleFirestoreError(error, OperationType.DELETE, `trash_classes/${classId}`));
};

export const addStudentToClass = (classId: string, name: string, rollNumber: number): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    const newStudent: Student = {
      id: `${classId}-${rollNumber}-${Date.now()}`,
      rollNumber: rollNumber,
      name: name.trim().toUpperCase()
    };
    
    classes[classIndex].students.push(newStudent);
    classes[classIndex].students.sort((a, b) => a.rollNumber - b.rollNumber);
    
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

    setDoc(doc(db, "classes", classId), classes[classIndex])
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

export const updateStudentInClass = (classId: string, studentId: string, name: string, rollNumber: number): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    const student = classes[classIndex].students.find(s => s.id === studentId);
    if (student) {
      student.name = name.trim().toUpperCase();
      student.rollNumber = Number(rollNumber);
      classes[classIndex].students.sort((a, b) => a.rollNumber - b.rollNumber);
      
      localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

      setDoc(doc(db, "classes", classId), classes[classIndex])
        .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
    }
  }
};

export const moveStudentToClass = (sourceClassId: string, targetClassId: string, studentId: string): void => {
  const classes = getClasses();
  const sourceIndex = classes.findIndex(c => c.id === sourceClassId);
  const targetIndex = classes.findIndex(c => c.id === targetClassId);
  
  if (sourceIndex !== -1 && targetIndex !== -1 && sourceClassId !== targetClassId) {
    const student = classes[sourceIndex].students.find(s => s.id === studentId);
    if (student) {
      // Remove from source class
      classes[sourceIndex].students = classes[sourceIndex].students.filter(s => s.id !== studentId);
      
      // Calculate next available roll number in target class
      const maxRoll = classes[targetIndex].students.reduce((max, s) => Math.max(max, s.rollNumber || 0), 0);
      const transferredStudent: Student = {
        ...student,
        id: `${targetClassId}-${maxRoll + 1}-${Date.now()}`,
        rollNumber: maxRoll + 1
      };
      
      // Add to target class
      classes[targetIndex].students.push(transferredStudent);
      classes[targetIndex].students.sort((a, b) => a.rollNumber - b.rollNumber);
      
      localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

      setDoc(doc(db, "classes", sourceClassId), classes[sourceIndex])
        .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${sourceClassId}`));
      setDoc(doc(db, "classes", targetClassId), classes[targetIndex])
        .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${targetClassId}`));
    }
  }
};

export const reorderClassRollNumbers = (classId: string): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    // Sort alphabetically by student name
    classes[classIndex].students.sort((a, b) => a.name.localeCompare(b.name));
    // Assign sequential 1..N roll numbers
    classes[classIndex].students.forEach((s, idx) => {
      s.rollNumber = idx + 1;
    });

    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

    setDoc(doc(db, "classes", classId), classes[classIndex])
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

export const bulkAddStudentsToClass = (classId: string, studentNames: string[]): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    let currentMaxRoll = classes[classIndex].students.reduce((max, s) => Math.max(max, s.rollNumber || 0), 0);
    
    studentNames.forEach((rawName) => {
      const cleanName = rawName.trim().toUpperCase();
      if (cleanName) {
        currentMaxRoll++;
        classes[classIndex].students.push({
          id: `${classId}-${currentMaxRoll}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          rollNumber: currentMaxRoll,
          name: cleanName
        });
      }
    });

    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

    setDoc(doc(db, "classes", classId), classes[classIndex])
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

export const syncRosterWithOfficial = async (forceReset = false): Promise<void> => {
  let classes = getClasses();
  
  // 1. Delete all obsolete MYP classes from Firestore
  for (const cls of classes) {
    if (cls.wing === 'MYP' && !OFFICIAL_MYP_CLASS_IDS.has(cls.id)) {
      try {
        console.log("Deleting obsolete class from Firestore:", cls.id);
        await deleteDoc(doc(db, "classes", cls.id));
      } catch (e) {
        console.warn("Failed to delete obsolete class:", cls.id, e);
      }
    }
  }

  // 2. Filter classes
  const nonMypClasses = classes.filter(c => c.wing !== 'MYP');
  classes = [...JSON.parse(JSON.stringify(MYP_CLASSES)), ...nonMypClasses];

  localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));
  localStorage.setItem(ROSTER_SYNC_VERSION_KEY, 'v6');
  
  // Push all official classes to Firestore
  for (const cls of classes) {
    try {
      await setDoc(doc(db, "classes", cls.id), cls);
    } catch (e) {
      console.warn("Firestore sync error for class:", cls.id, e);
    }
  }

  window.dispatchEvent(new Event('storageService_classUpdate'));
};

export const deleteStudentFromClass = (classId: string, studentId: string): void => {
  const classes = getClasses();
  const classIndex = classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    classes[classIndex].students = classes[classIndex].students.filter(s => s.id !== studentId);
    localStorage.setItem(CLASS_DATA_KEY, JSON.stringify(classes));

    setDoc(doc(db, "classes", classId), classes[classIndex])
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `classes/${classId}`));
  }
};

// --- Attendance Logs ---

const parseTimestamp = (t: any): number => {
  if (!t) return Date.now();
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    if (/^\d+$/.test(t)) return Number(t);
    const d = new Date(t);
    return isNaN(d.getTime()) ? Date.now() : d.getTime();
  }
  if (t && typeof t === 'object') {
    if (typeof t.toDate === 'function') {
      return t.toDate().getTime();
    }
    if (typeof t.seconds === 'number') {
      return t.seconds * 1000;
    }
  }
  return Date.now();
};

const isSameDayOfLog = (t1: any, t2: any): boolean => {
  const d1 = new Date(parseTimestamp(t1));
  const d2 = new Date(parseTimestamp(t2));
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
};

export const saveAttendanceLog = (log: ClassAttendanceLog): void => {
  const existingLogs = getAttendanceLogs();
  
  const duplicates = existingLogs.filter(l => {
    return l.classId === log.classId && isSameDayOfLog(l.timestamp, log.timestamp) && l.session === log.session;
  });

  const filtered = existingLogs.filter(l => {
    const isSameClass = l.classId === log.classId;
    const isSameDay = isSameDayOfLog(l.timestamp, log.timestamp);
    const isSameSession = l.session === log.session;
    return !(isSameClass && isSameDay && isSameSession);
  });

  filtered.push(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // Asynchronously clean up duplicates and save the new record in Firestore
  duplicates.forEach((dup) => {
    deleteDoc(doc(db, "attendance_logs", dup.id)).catch(e => console.error(e));
  });

  setDoc(doc(db, "attendance_logs", log.id), log)
    .catch(error => handleFirestoreError(error, OperationType.WRITE, `attendance_logs/${log.id}`));
};

export const getAttendanceLogs = (): ClassAttendanceLog[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const rawLogs = JSON.parse(stored) as ClassAttendanceLog[];
    return rawLogs.map(log => ({
      ...log,
      timestamp: parseTimestamp(log.timestamp)
    }));
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
};

export const getLogsForToday = (): ClassAttendanceLog[] => {
  const logs = getAttendanceLogs();
  const now = Date.now();
  return logs.filter(l => isSameDayOfLog(l.timestamp, now));
};

export const getExistingLogForClass = (classId: string, session: SessionType): ClassAttendanceLog | undefined => {
  const logs = getLogsForToday();
  return logs.find(l => l.classId === classId && l.session === session);
};

export const getLogsByMonth = (monthIndex: number, year: number): ClassAttendanceLog[] => {
  const logs = getAttendanceLogs();
  return logs.filter(l => {
    const d = new Date(l.timestamp);
    return d.getMonth() === monthIndex && d.getFullYear() === year;
  });
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DISC_STORAGE_KEY);
  localStorage.removeItem(CLASS_DATA_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(TRUSTED_DEVICE_KEY);
  localStorage.removeItem(TRASH_CLASS_KEY);
  ['MYP', 'MS', 'HS', 'HSS'].forEach(w => localStorage.removeItem(`${TIMETABLE_PREFIX}${w}`));
};


// --- Disciplinary Records ---

export const saveDisciplinaryRecord = (record: DisciplinaryRecord): void => {
  const records = getDisciplinaryRecords();
  if (record.escalatedToHOS === undefined) {
    record.escalatedToHOS = false;
  }
  records.push(record);
  localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(records));

  setDoc(doc(db, "disciplinary_records", record.id), record)
    .catch(error => handleFirestoreError(error, OperationType.WRITE, `disciplinary_records/${record.id}`));
};

export const escalateDisciplinaryRecord = (id: string): void => {
  const records = getDisciplinaryRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index].escalatedToHOS = true;
    localStorage.setItem(DISC_STORAGE_KEY, JSON.stringify(records));

    setDoc(doc(db, "disciplinary_records", id), records[index])
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `disciplinary_records/${id}`));
  }
};

export const getDisciplinaryRecords = (): DisciplinaryRecord[] => {
  const stored = localStorage.getItem(DISC_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse disciplinary logs", e);
    return [];
  }
};

export const getDisciplinaryRecordsForToday = (): DisciplinaryRecord[] => {
  const records = getDisciplinaryRecords();
  const now = Date.now();
  return records.filter(r => isSameDayOfLog(r.timestamp, now));
};

// --- DATA BACKUP & ARCHIVAL ---

export const exportAllLogsToCSV = () => {
  const logs = getAttendanceLogs();
  const classes = getClasses();
  
  let csvContent = "Date,Time,Session,Wing,Class,Teacher,Student Name,Roll No,Status,Reason\n";
  
  logs.forEach(log => {
    const cls = classes.find(c => c.id === log.classId);
    const className = cls ? `${cls.grade}-${cls.section}` : log.classId;
    const wingName = cls ? cls.wing : 'Unknown';
    const dateStr = new Date(log.timestamp).toLocaleDateString();
    const timeStr = new Date(log.timestamp).toLocaleTimeString();
    
    log.records.forEach(rec => {
      const student = cls?.students.find(s => s.id === rec.studentId);
      const studentName = student ? student.name : rec.studentId;
      const rollNo = student ? student.rollNumber : '';
      const reason = rec.reason ? `"${rec.reason.replace(/"/g, '""')}"` : '';
      
      csvContent += `${dateStr},${timeStr},${log.session},${wingName},${className},"${log.teacherName}","${studentName}",${rollNo},${rec.status},${reason}\n`;
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FULL_PREPX_ARCHIVE_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const createBackupData = () => {
  const backup = {
    logs: getAttendanceLogs(),
    disciplinary: getDisciplinaryRecords(),
    classes: getClasses(),
    trash: getTrashClasses(),
    settings: getAppSettings(),
    timestamp: new Date().toISOString()
  };
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `PREPX_SYSTEM_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const factoryReset = () => {
  clearAllData();
  getClasses(); 
  window.location.reload();
};
