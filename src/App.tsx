import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils,
  Sun,
  Moon,
  Users,
  CalendarCheck,
  Search,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Trash2,
  Edit3,
  Phone,
  Plus,
  RotateCcw,
  Download,
  Share2,
  HardDrive,
  Calendar as CalendarIcon,
  Filter,
  CheckCheck,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Student, PersonRole } from './data';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StudentFormModal } from './components/StudentFormModal';
import { BackupModal } from './components/BackupModal';
import {
  loadStudentsFromStorage,
  saveStudentsToStorage,
  getStorageMemoryStats
} from './services/storage';

export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena';
type View = 'meals' | 'students' | 'history';

const DAYS_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

function getDayName(dateObj: Date): string {
  return DAYS_ES[dateObj.getDay()];
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = getDayName(date);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${dayName}, ${d} de ${monthNames[m - 1]} de ${y}`;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('meals');

  // Selected Date (default: today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Current Meal (auto-selected by current time)
  const [currentMeal, setCurrentMeal] = useState<MealType>(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Desayuno';
    if (hour < 17) return 'Almuerzo';
    return 'Cena';
  });

  // Attendance Records: { [dateKey]: { Desayuno: { [id]: boolean }, Almuerzo: { [id]: boolean }, Cena: { [id]: boolean } } }
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<MealType, Record<string, boolean>>>>(() => {
    try {
      const stored = localStorage.getItem('meal_attendance_daily_v1');
      if (stored) return JSON.parse(stored);

      // Legacy fallback: migrate 'meal_status_v2' if present
      const legacy = localStorage.getItem('meal_status_v2');
      const today = new Date().toISOString().split('T')[0];
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        return { [today]: parsedLegacy };
      }
      return {};
    } catch {
      return {};
    }
  });

  // Save attendance to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('meal_attendance_daily_v1', JSON.stringify(attendanceRecords));
    } catch (e) {
      console.error('Error saving meal attendance:', e);
    }
  }, [attendanceRecords]);

  // Students list
  const [students, setStudents] = useState<Student[]>(() => loadStudentsFromStorage());

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'pending' | 'eaten'>('all');

  // Modals & Confirmation dialogs
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Safety confirmation dialogs for meals
  const [mealToUnmark, setMealToUnmark] = useState<{ student: Student; meal: MealType } | null>(null);
  const [showConfirmClearAllMeals, setShowConfirmClearAllMeals] = useState(false);

  // Active status for the selected date and meal
  const currentMealStatus = useMemo(() => {
    return attendanceRecords[selectedDate]?.[currentMeal] || {};
  }, [attendanceRecords, selectedDate, currentMeal]);

  // Day name for the selected date
  const selectedDayName = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return getDayName(new Date(y, m - 1, d));
  }, [selectedDate]);

  // Filter students who are registered for the current meal on this day
  const studentsAssignedToMeal = useMemo(() => {
    return students.filter(student => {
      if (currentMeal === 'Desayuno') {
        const days = student.breakfastDays || [];
        // If not explicitly set, show all to avoid omitting comensales
        return days.length === 0 || days.includes(selectedDayName);
      }
      if (currentMeal === 'Almuerzo') {
        const days = student.lunchDays || [];
        return days.length === 0 || days.includes(selectedDayName);
      }
      if (currentMeal === 'Cena') {
        const days = student.dinnerDays || [];
        return days.length === 0 || days.includes(selectedDayName);
      }
      return true;
    });
  }, [students, currentMeal, selectedDayName]);

  // Filtered students for display in meal tracker
  const displayedStudents = useMemo(() => {
    return studentsAssignedToMeal.filter(s => {
      const matchesSearch =
        s.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      const hasEaten = !!currentMealStatus[s.id];
      if (attendanceFilter === 'pending') return !hasEaten;
      if (attendanceFilter === 'eaten') return hasEaten;
      return true;
    });
  }, [studentsAssignedToMeal, currentMealStatus, searchTerm, attendanceFilter]);

  // Statistics
  const eatenCount = useMemo(() => {
    return studentsAssignedToMeal.filter(s => !!currentMealStatus[s.id]).length;
  }, [studentsAssignedToMeal, currentMealStatus]);

  const pendingCount = studentsAssignedToMeal.length - eatenCount;
  const progressPercent = studentsAssignedToMeal.length > 0
    ? Math.round((eatenCount / studentsAssignedToMeal.length) * 100)
    : 0;

  // Toggle meal attendance
  const handleToggleMeal = (student: Student) => {
    const alreadyEaten = !!currentMealStatus[student.id];

    if (alreadyEaten) {
      // Prompt safety confirmation dialog to prevent accidental unmarking ("sin querer queriendo")
      setMealToUnmark({ student, meal: currentMeal });
    } else {
      // Mark as eaten immediately
      setAttendanceRecords(prev => {
        const dayRecord = prev[selectedDate] || { Desayuno: {}, Almuerzo: {}, Cena: {} };
        const mealRecord = dayRecord[currentMeal] || {};
        return {
          ...prev,
          [selectedDate]: {
            ...dayRecord,
            [currentMeal]: {
              ...mealRecord,
              [student.id]: true
            }
          }
        };
      });
    }
  };

  // Confirm unmarking
  const handleConfirmUnmark = () => {
    if (!mealToUnmark) return;
    const { student, meal } = mealToUnmark;

    setAttendanceRecords(prev => {
      const dayRecord = prev[selectedDate] || { Desayuno: {}, Almuerzo: {}, Cena: {} };
      const mealRecord = { ...(dayRecord[meal] || {}) };
      delete mealRecord[student.id];

      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          [meal]: mealRecord
        }
      };
    });

    setMealToUnmark(null);
  };

  // Select all or clear all
  const handleSelectAllToggle = () => {
    const allDone = studentsAssignedToMeal.length > 0 && studentsAssignedToMeal.every(s => currentMealStatus[s.id]);

    if (allDone) {
      setShowConfirmClearAllMeals(true);
    } else {
      setAttendanceRecords(prev => {
        const dayRecord = prev[selectedDate] || { Desayuno: {}, Almuerzo: {}, Cena: {} };
        const updatedMeal = { ...(dayRecord[currentMeal] || {}) };
        studentsAssignedToMeal.forEach(s => {
          updatedMeal[s.id] = true;
        });

        return {
          ...prev,
          [selectedDate]: {
            ...dayRecord,
            [currentMeal]: updatedMeal
          }
        };
      });
    }
  };

  const handleConfirmClearAll = () => {
    setAttendanceRecords(prev => {
      const dayRecord = prev[selectedDate] || { Desayuno: {}, Almuerzo: {}, Cena: {} };
      return {
        ...prev,
        [selectedDate]: {
          ...dayRecord,
          [currentMeal]: {}
        }
      };
    });
    setShowConfirmClearAllMeals(false);
  };

  // Student Save handler
  const handleSaveStudent = (newOrUpdated: Student) => {
    setStudents(prev => {
      const exists = prev.some(s => s.id === newOrUpdated.id);
      const next = exists
        ? prev.map(s => s.id === newOrUpdated.id ? newOrUpdated : s)
        : [...prev, newOrUpdated];
      saveStudentsToStorage(next);
      return next;
    });
    setStudentToEdit(null);
  };

  // Student Delete handler
  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => {
      const next = prev.filter(s => s.id !== studentId);
      saveStudentsToStorage(next);
      return next;
    });

    // Remove from attendance records
    setAttendanceRecords(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(d => {
        ['Desayuno', 'Almuerzo', 'Cena'].forEach(m => {
          const mealType = m as MealType;
          if (copy[d]?.[mealType]?.[studentId]) {
            delete copy[d][mealType][studentId];
          }
        });
      });
      return copy;
    });

    setStudentToDelete(null);
    setStudentToEdit(null);
  };

  // Share WhatsApp report
  const handleSendWhatsAppReport = () => {
    const dateFormatted = formatDateDisplay(selectedDate);
    const eatenList = studentsAssignedToMeal.filter(s => !!currentMealStatus[s.id]);
    const pendingList = studentsAssignedToMeal.filter(s => !currentMealStatus[s.id]);

    let text = `*REPORTE DE ASISTENCIA AL COMEDOR*\n`;
    text += `*Jornada:* ${currentMeal.toUpperCase()}\n`;
    text += `*Fecha:* ${dateFormatted}\n\n`;
    text += `*Total Comensales:* ${studentsAssignedToMeal.length}\n`;
    text += `*Ya Comieron:* ${eatenList.length} (${progressPercent}%)\n`;
    text += `*Pendientes:* ${pendingList.length}\n\n`;

    if (eatenList.length > 0) {
      text += `*YA COMIERON:*\n`;
      eatenList.forEach(s => {
        text += `• ${s.student}\n`;
      });
      text += `\n`;
    }

    if (pendingList.length > 0) {
      text += `*PENDIENTES:*\n`;
      pendingList.forEach(s => {
        text += `• ${s.student}\n`;
      });
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Quick Date Setters
  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline and Install helpers */}
      <OfflineIndicator />

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Utensils size={20} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Control de Comedor
              </h1>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Desayuno, Almuerzo y Cena
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              onClick={() => setIsBackupModalOpen(true)}
              title="Memoria & Copia de seguridad"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            >
              <HardDrive size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pb-28 space-y-4">
        {/* ========================================================================= */}
        {/* VIEW 1: CONTROL DE COMIDAS (MAIN) */}
        {/* ========================================================================= */}
        {currentView === 'meals' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Date Selector Banner */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                    Fecha de Asistencia
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={setToday}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  Ayer
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => e.target.value && setSelectedDate(e.target.value)}
                  className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Meal Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              {(['Desayuno', 'Almuerzo', 'Cena'] as MealType[]).map(meal => {
                const isActive = currentMeal === meal;
                return (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => setCurrentMeal(meal)}
                    className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                      isActive
                        ? meal === 'Desayuno'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                          : meal === 'Almuerzo'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                          : 'bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {meal === 'Desayuno' && <Sun size={15} />}
                      {meal === 'Almuerzo' && <Utensils size={15} />}
                      {meal === 'Cena' && <Moon size={15} />}
                      <span>{meal}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Meal Summary KPI Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Control de {currentMeal}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {eatenCount} de {studentsAssignedToMeal.length} comensales registrados
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendWhatsAppReport}
                    title="Enviar reporte por WhatsApp"
                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold transition flex items-center gap-1.5 text-xs shadow-xs"
                  >
                    <Share2 size={15} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAllToggle}
                    className={`px-3 py-2 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-1.5 ${
                      studentsAssignedToMeal.length > 0 && studentsAssignedToMeal.every(s => currentMealStatus[s.id])
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <CheckCheck size={15} />
                    <span>
                      {studentsAssignedToMeal.length > 0 && studentsAssignedToMeal.every(s => currentMealStatus[s.id])
                        ? 'Limpiar'
                        : 'Marcar Todos'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Comieron: {eatenCount}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Faltan: {pendingCount}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar comensal por nombre..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex rounded-xl bg-slate-200/60 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    attendanceFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Todos ({studentsAssignedToMeal.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    attendanceFilter === 'pending'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Faltan ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('eaten')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    attendanceFilter === 'eaten'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Comieron ({eatenCount})
                </button>
              </div>
            </div>

            {/* Diners Meal Attendance List */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {displayedStudents.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
                    <Utensils size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      No se encontraron comensales para {currentMeal}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchTerm ? 'Prueba con otra búsqueda' : 'Registra o asigna comensales en la pestaña Personas'}
                    </p>
                  </div>
                ) : (
                  displayedStudents.map(student => {
                    const hasEaten = !!currentMealStatus[student.id];

                    return (
                      <motion.div
                        key={student.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        onClick={() => handleToggleMeal(student)}
                        className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          hasEaten
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar Circle */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                              hasEaten
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40'
                            }`}
                          >
                            {student.student.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-xs sm:text-sm font-black truncate ${
                                  hasEaten
                                    ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80'
                                    : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {student.student}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {student.role || 'Estudiante'}
                              </span>

                              {student.notes && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-[180px]">
                                  {student.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Checkbox Button */}
                        <div className="shrink-0 flex items-center gap-2">
                          {hasEaten ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-xs">
                              <CheckCircle2 size={16} />
                              <span className="hidden sm:inline">Comió</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-600 font-bold text-xs transition">
                              <Circle size={16} />
                              <span className="hidden sm:inline">Marcar</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PERSONAS (COMENSALES) */}
        {/* ========================================================================= */}
        {currentView === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header & Add Button */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Directorio de Comensales
                </h2>
                <p className="text-xs text-slate-500">
                  {students.length} personas registradas en la memoria local
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStudentToEdit(null);
                  setIsStudentModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition"
              >
                <Plus size={16} />
                <span>Registrar Persona</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar comensal por nombre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {students
                .filter(s =>
                  s.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map(student => {
                  return (
                    <div
                      key={student.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">
                            {student.student.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {student.student}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {student.role || 'Estudiante'}
                              </span>
                              {student.phone && (
                                <a
                                  href={`https://wa.me/${student.phone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                >
                                  <Phone size={10} />
                                  <span>{student.phone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setStudentToEdit(student);
                              setIsStudentModalOpen(true);
                            }}
                            title="Editar comensal"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(student)}
                            title="Eliminar de la memoria"
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Meal Days Tag summary */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Sun size={12} className="text-amber-500" />
                          <span className="font-bold text-slate-500">Desayunos:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.breakfastDays?.length ? `${student.breakfastDays.length} días` : 'Ninguno'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Utensils size={12} className="text-indigo-500" />
                          <span className="font-bold text-slate-500">Almuerzos:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.lunchDays?.length ? `${student.lunchDays.length} días` : 'Todos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Moon size={12} className="text-rose-500" />
                          <span className="font-bold text-slate-500">Cenas:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.dinnerDays?.length ? `${student.dinnerDays.length} días` : 'Ninguna'}
                          </span>
                        </div>
                      </div>

                      {student.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg italic">
                          Observación: {student.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: HISTORIAL Y REPORTES */}
        {/* ========================================================================= */}
        {currentView === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Historial de Comidas Servidas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registros almacenados en este dispositivo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition"
                >
                  <Download size={14} />
                  <span>Descargar Copia</span>
                </button>
              </div>

              {/* Day details */}
              <div className="space-y-3 pt-2">
                {Object.keys(attendanceRecords).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No hay registros de asistencia anteriores aún.
                  </div>
                ) : (
                  Object.keys(attendanceRecords)
                    .sort((a, b) => b.localeCompare(a))
                    .map(dateKey => {
                      const dayData = attendanceRecords[dateKey] || {};
                      const dCount = Object.keys(dayData.Desayuno || {}).length;
                      const aCount = Object.keys(dayData.Almuerzo || {}).length;
                      const cCount = Object.keys(dayData.Cena || {}).length;
                      const totalDay = dCount + aCount + cCount;

                      return (
                        <div
                          key={dateKey}
                          onClick={() => {
                            setSelectedDate(dateKey);
                            setCurrentView('meals');
                          }}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                              {formatDateDisplay(dateKey)}
                            </span>
                            <div className="flex gap-3 text-[11px] mt-1 text-slate-500">
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                <Sun size={11} /> {dCount} Desayunos
                              </span>
                              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                                <Utensils size={11} /> {aCount} Almuerzos
                              </span>
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                                <Moon size={11} /> {cCount} Cenas
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              {totalDay} platos
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Ver día
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Storage Info Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Memoria Local Segura
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Tus datos se guardan en el navegador sin intermediarios
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Gestionar Respaldo
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM NAVIGATION (3 PURE TABS) */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 py-2 px-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            type="button"
            onClick={() => setCurrentView('meals')}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentView === 'meals'
                ? 'text-indigo-600 dark:text-indigo-400 scale-105 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl ${
                currentView === 'meals' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''
              }`}
            >
              <Utensils size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-wider">Comidas</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('students')}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentView === 'students'
                ? 'text-indigo-600 dark:text-indigo-400 scale-105 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl ${
                currentView === 'students' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''
              }`}
            >
              <Users size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-wider">Personas</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentView === 'history'
                ? 'text-indigo-600 dark:text-indigo-400 scale-105 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl ${
                currentView === 'history' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''
              }`}
            >
              <CalendarCheck size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-wider">Historial</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRMACIÓN PARA DESMARCAR COMIDA ("Sin querer queriendo") */}
      {/* ========================================================================= */}
      {mealToUnmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¿Desmarcar comida?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Confirmación de seguridad
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p>
                <strong className="text-slate-900 dark:text-white font-black">
                  {mealToUnmark.student.student}
                </strong>{' '}
                ya estaba registrado como que{' '}
                <strong className="text-amber-700 dark:text-amber-400">
                  ya comió su {mealToUnmark.meal}
                </strong>.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ¿Deseas desmarcarlo para que vuelva a figurar como pendiente?
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setMealToUnmark(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
              >
                Mantener Marcado
              </button>
              <button
                type="button"
                onClick={handleConfirmUnmark}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-95"
              >
                Sí, Desmarcar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMACIÓN PARA DESMARCAR A TODOS */}
      {/* ========================================================================= */}
      {showConfirmClearAllMeals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¿Desmarcar a todos?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Jornada de {currentMeal}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Esta acción desmarcará a todas las personas en {currentMeal}. Todos volverán al estado pendiente.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmClearAllMeals(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-95"
              >
                Sí, Desmarcar Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMACIÓN PARA ELIMINAR A UNA PERSONA DE LA MEMORIA */}
      {/* ========================================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-rose-200 dark:border-rose-900/60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  ¿Eliminar a {studentToDelete.student}?
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Se borrará de la memoria del teléfono
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Rol:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {studentToDelete.role || 'Estudiante'}
                </span>
              </div>
              {studentToDelete.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">WhatsApp / Teléfono:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {studentToDelete.phone}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Esta acción eliminará de forma definitiva a esta persona de la lista de comensales y de los registros guardados en este dispositivo.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudent(studentToDelete.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FORMULARIO AGREGAR / EDITAR COMENSAL */}
      {/* ========================================================================= */}
      <StudentFormModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        onSave={handleSaveStudent}
        onDelete={handleDeleteStudent}
        initialStudent={studentToEdit}
      />

      {/* ========================================================================= */}
      {/* MODAL 5: COPIA DE SEGURIDAD & MEMORIA */}
      {/* ========================================================================= */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        students={students}
        onDataUpdated={newStudents => {
          setStudents(newStudents);
        }}
      />
    </div>
  );
}
