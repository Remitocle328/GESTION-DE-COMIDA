import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils,
  Users,
  CalendarCheck,
  Search,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Trash2,
  Edit3,
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
import { Student, PersonRole, MealType } from './data';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StudentFormModal } from './components/StudentFormModal';
import { BackupModal } from './components/BackupModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { ConfirmModal } from './components/ConfirmModal';
import {
  loadStudentsFromStorage,
  saveStudentsToStorage,
  getStorageMemoryStats
} from './services/storage';

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

  // Auto-refresh date and meal when resuming app or crossing midnight
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();
      const currentAutoMeal: MealType = hour < 11 ? 'Desayuno' : hour < 17 ? 'Almuerzo' : 'Cena';

      setSelectedDate(prev => {
        // If the day advanced, automatically update to today's date
        return prev < todayStr ? todayStr : prev;
      });
      setCurrentMeal(currentAutoMeal);
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

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
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string>(() => {
    try {
      return localStorage.getItem('dining_whatsapp_group_link') || '';
    } catch {
      return '';
    }
  });

  const handleSaveWhatsAppGroupLink = (link: string) => {
    setWhatsappGroupLink(link);
    try {
      if (link) {
        localStorage.setItem('dining_whatsapp_group_link', link);
      } else {
        localStorage.removeItem('dining_whatsapp_group_link');
      }
    } catch {
      // ignore
    }
  };

  // Safety confirmation dialogs for meals
  const [mealToUnmark, setMealToUnmark] = useState<{ student: Student; meal: MealType } | null>(null);
  const [showConfirmClearAllMeals, setShowConfirmClearAllMeals] = useState(false);
  const [showConfirmMarkAllMeals, setShowConfirmMarkAllMeals] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  };

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
      // Prompt safety confirmation dialog to prevent accidental unmarking
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

  // Select all or clear all with clean confirmation
  const handleSelectAllToggle = () => {
    const allDone = studentsAssignedToMeal.length > 0 && studentsAssignedToMeal.every(s => currentMealStatus[s.id]);

    if (allDone) {
      setShowConfirmClearAllMeals(true);
    } else {
      setShowConfirmMarkAllMeals(true);
    }
  };

  const handleConfirmMarkAll = () => {
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
    setShowConfirmMarkAllMeals(false);
    showToast(`Comida registrada para todos en ${currentMeal}`);
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

  // Helper to generate beautifully styled WhatsApp report
  const generateWhatsAppReportText = () => {
    const dateFormatted = formatDateDisplay(selectedDate);
    const eatenList = studentsAssignedToMeal.filter(s => !!currentMealStatus[s.id]);
    const pendingList = studentsAssignedToMeal.filter(s => !currentMealStatus[s.id]);

    const total = studentsAssignedToMeal.length;
    const eaten = eatenList.length;
    const pending = pendingList.length;
    const percent = total > 0 ? Math.round((eaten / total) * 100) : 0;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const lines: string[] = [
      `REPORTE DE ASISTENCIA AL COMEDOR`,
      `Jornada: ${currentMeal.toUpperCase()}`,
      `Fecha: ${dateFormatted}`,
      `Hora: ${timeFormatted}`,
      ``,
      `Total asignados: ${total}`,
      `Ya comieron: ${eaten} (${percent}%)`,
      `Faltan por comer: ${pending} (${100 - percent}%)`,
      ``,
      `Ya comieron:`,
      ``
    ];

    if (eatenList.length > 0) {
      eatenList.forEach((s) => {
        const extraRole = s.role ? ` (${s.role})` : '';
        lines.push(`${s.student}${extraRole}`);
      });
    } else {
      lines.push(`Ninguno registrado aún`);
    }

    lines.push(``);
    lines.push(`Faltan por comer:`);
    lines.push(``);

    if (pendingList.length > 0) {
      pendingList.forEach((s) => {
        const extraRole = s.role ? ` (${s.role})` : '';
        lines.push(`${s.student}${extraRole}`);
      });
    } else if (total > 0) {
      lines.push(`Todos los comensales han comido (${total}/${total})`);
    }

    return lines.join('\r\n');
  };

  // Share WhatsApp report
  const handleSendWhatsAppReport = async () => {
    if (studentsAssignedToMeal.length === 0) {
      showToast('No hay comensales asignados a este turno');
      return;
    }

    const reportText = generateWhatsAppReportText();

    // Silently copy to clipboard so the user always has a pristine backup ready to paste
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).catch(() => {});
    }

    // On mobile devices, try native share API first to preserve rich formatting and newlines flawlessly
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `Reporte ${currentMeal} - ${formatDateDisplay(selectedDate)}`,
          text: reportText,
        });
        showToast('Reporte compartido con éxito');
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Direct WhatsApp Web / Mobile URL using api.whatsapp.com with CRLF encoding
    const encoded = encodeURIComponent(reportText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Reporte preparado y copiado al portapapeles');
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
                Gestor Diario PWA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              title="Respaldo y memoria local"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <HardDrive size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pb-24 space-y-4">
        {/* ========================================================================= */}
        {/* VIEW 1: CONTROL DE COMIDAS (HOY / FECHA SELECCIONADA) */}
        {/* ========================================================================= */}
        {currentView === 'meals' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Date Selector Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={setToday}
                  className="px-2.5 py-1.5 rounded-xl font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
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
                    <span>{meal}</span>
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
                    onClick={() => setIsWhatsAppModalOpen(true)}
                    title="Avisos y Reportes de WhatsApp"
                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold transition flex items-center gap-1.5 text-xs shadow-xs active:scale-95 border border-emerald-200/50 dark:border-emerald-800/40"
                  >
                    <img
                      src="/assets/aistudio/whatsapp-3_da26a587.svg"
                      alt="WhatsApp"
                      className="w-5 h-5 object-contain shrink-0"
                    />
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
                {students.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-xs">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Users size={28} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                        Comienza agregando tus comensales
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Aún no tienes comensales registrados. Registra a las personas para controlar sus comidas diarias (desayunos, almuerzos y cenas).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentToEdit(null);
                        setIsStudentModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
                    >
                      <Plus size={16} />
                      <span>Registrar Primer Comensal</span>
                    </button>
                  </div>
                ) : displayedStudents.length === 0 ? (
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
              {students.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Users size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      Directorio vacío
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      No hay comensales ni estudiantes registrados todavía. Presiona el botón para agregar al primer integrante.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentToEdit(null);
                      setIsStudentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
                  >
                    <Plus size={16} />
                    <span>Registrar Nueva Persona</span>
                  </button>
                </div>
              ) : (
                students
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
                                  title="Enviar mensaje de WhatsApp"
                                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                                >
                                  <img
                                    src="/assets/aistudio/whatsapp-3_da26a587.svg"
                                    alt="WhatsApp"
                                    className="w-4 h-4 object-contain shrink-0"
                                  />
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
                          <span className="font-bold text-slate-500">Desayunos:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.breakfastDays?.length ? `${student.breakfastDays.length} días` : 'Ninguno'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-500">Almuerzos:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {student.lunchDays?.length ? `${student.lunchDays.length} días` : 'Todos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                })
              )}

              {students.length > 0 &&
                students.filter(s =>
                  s.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase()))
                ).length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                    No se encontraron comensales que coincidan con &ldquo;{searchTerm}&rdquo;.
                  </div>
                )}
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
                      const dayData = attendanceRecords[dateKey] || { Desayuno: {}, Almuerzo: {}, Cena: {} };
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
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {dCount} Desayunos
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                {aCount} Almuerzos
                              </span>
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {cCount} Cenas
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
      {/* CONFIRMACIÓN: DESMARCAR A UNA PERSONA */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={!!mealToUnmark}
        title={mealToUnmark ? `¿Desmarcar a ${mealToUnmark.student.student}?` : ''}
        message={mealToUnmark ? `Volverá a figurar como pendiente en ${mealToUnmark.meal}.` : ''}
        confirmText="Sí, desmarcar"
        cancelText="Cancelar"
        onConfirm={handleConfirmUnmark}
        onClose={() => setMealToUnmark(null)}
      />

      {/* ========================================================================= */}
      {/* CONFIRMACIÓN: DESMARCAR A TODOS EN LA JORNADA */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={showConfirmClearAllMeals}
        title={`¿Desmarcar a todos en ${currentMeal}?`}
        message="Todos los comensales volverán al estado pendiente."
        confirmText="Sí, desmarcar todos"
        cancelText="Cancelar"
        onConfirm={handleConfirmClearAll}
        onClose={() => setShowConfirmClearAllMeals(false)}
      />

      {/* ========================================================================= */}
      {/* CONFIRMACIÓN: MARCAR A TODOS EN LA JORNADA */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={showConfirmMarkAllMeals}
        title={`¿Marcar a todos en ${currentMeal}?`}
        message={`Se registrará la comida para los ${studentsAssignedToMeal.length} comensales.`}
        confirmText="Sí, marcar todos"
        cancelText="Cancelar"
        onConfirm={handleConfirmMarkAll}
        onClose={() => setShowConfirmMarkAllMeals(false)}
      />

      {/* ========================================================================= */}
      {/* CONFIRMACIÓN: ELIMINAR A UNA PERSONA DE LA MEMORIA */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title={studentToDelete ? `¿Eliminar a ${studentToDelete.student}?` : ''}
        message="Se borrará definitivamente de la lista de comensales y de la memoria del teléfono."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (studentToDelete) {
            handleDeleteStudent(studentToDelete.id);
          }
        }}
        onClose={() => setStudentToDelete(null)}
      />

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

      {/* ========================================================================= */}
      {/* MODAL 6: AVISOS & REPORTE PARA WHATSAPP */}
      {/* ========================================================================= */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        currentMeal={currentMeal}
        selectedDate={selectedDate}
        formatDateDisplay={formatDateDisplay}
        studentsAssignedToMeal={studentsAssignedToMeal}
        currentMealStatus={currentMealStatus}
        groupLink={whatsappGroupLink}
        onSaveGroupLink={handleSaveWhatsAppGroupLink}
        onToast={showToast}
      />

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border border-slate-700/50 dark:border-slate-200 backdrop-blur-md max-w-sm pointer-events-none"
          >
            <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
