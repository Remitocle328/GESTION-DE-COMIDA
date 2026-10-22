import { Student } from '../data';

const STORAGE_KEY = 'pension_app_students_v3';
const META_KEY = 'pension_app_storage_meta';

// Retorna lista vacía para nueva instalación limpia
export function getInitialEnrichedStudents(): Student[] {
  return [];
}

/**
 * Loads students from device memory (localStorage)
 */
export function loadStudentsFromStorage(): Student[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    
    // Si no hay datos guardados previamente, iniciar con lista vacía
    const initial: Student[] = [];
    saveStudentsToStorage(initial);
    return initial;
  } catch (err) {
    console.error('Error loading students from device storage:', err);
    return [];
  }
}

/**
 * Saves students to device memory (localStorage)
 */
export function saveStudentsToStorage(students: Student[]): boolean {
  try {
    const json = JSON.stringify(students);
    localStorage.setItem(STORAGE_KEY, json);
    
    const meta = {
      lastSaved: new Date().toISOString(),
      count: students.length,
      bytes: new Blob([json]).size
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    return true;
  } catch (err) {
    console.error('Failed to save to device storage:', err);
    return false;
  }
}

/**
 * Exports data to a downloadable JSON file on the mobile device
 */
export function exportDataAsJSON(students: Student[]): void {
  const exportPayload = {
    app: 'Control de Comedor y Comidas PWA',
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    totalStudents: students.length,
    students
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `respaldo_comedor_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Validates and imports student data from a JSON string
 */
export function importDataFromJSON(jsonString: string): Student[] {
  const parsed = JSON.parse(jsonString);
  const studentsList: Student[] = Array.isArray(parsed) ? parsed : (parsed.students || []);

  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    throw new Error('El archivo no contiene una lista válida de personas o estudiantes.');
  }

  // Validate each record has id and student name
  const validated: Student[] = studentsList.map((s, idx) => {
    if (!s.student || typeof s.student !== 'string') {
      throw new Error(`El registro #${idx + 1} no tiene un nombre válido.`);
    }
    return {
      id: s.id ? String(s.id) : String(Date.now() + idx),
      student: s.student.trim(),
      subjects: s.subjects || {},
      schedule: s.schedule || {},
      phone: s.phone || '',
      role: s.role || 'Estudiante',
      isWorker: !!s.isWorker,
      breakfastDays: Array.isArray(s.breakfastDays) ? s.breakfastDays : [],
      lunchDays: Array.isArray(s.lunchDays) ? s.lunchDays : [],
      dinnerDays: Array.isArray(s.dinnerDays) ? s.dinnerDays : [],
      pensionStatus: s.pensionStatus || 'active',
      pensionPlan: s.pensionPlan || 'solo_almuerzo',
      pensionPrice: typeof s.pensionPrice === 'number' ? s.pensionPrice : 180000,
      pensionDueDate: s.pensionDueDate || '',
      notes: s.notes || '',
      avatarColor: s.avatarColor || ''
    };
  });

  saveStudentsToStorage(validated);
  return validated;
}

/**
 * Resets storage back to default initial state (empty)
 */
export function resetStorageToDefaults(): Student[] {
  const fresh: Student[] = [];
  saveStudentsToStorage(fresh);
  try {
    localStorage.removeItem('meal_attendance_daily_v1');
    localStorage.removeItem('meal_status_v2');
    localStorage.removeItem('meal_absence_notices_v1');
  } catch (e) {
    console.error(e);
  }
  return fresh;
}

/**
 * Returns memory usage statistics on the mobile phone
 */
export function getStorageMemoryStats(): { count: number; sizeKB: number; lastSaved: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const metaRaw = localStorage.getItem(META_KEY);
    const meta = metaRaw ? JSON.parse(metaRaw) : null;

    return {
      count: meta?.count ?? (raw ? JSON.parse(raw).length : 0),
      sizeKB: Math.round((new Blob([raw]).size / 1024) * 10) / 10,
      lastSaved: meta?.lastSaved ?? null
    };
  } catch {
    return { count: 0, sizeKB: 0, lastSaved: null };
  }
}
