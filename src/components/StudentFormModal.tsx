import React, { useState } from 'react';
import { X, User, Save, Trash2, AlertCircle, CheckSquare } from 'lucide-react';
import { Student, PersonRole } from '../data';
import { ConfirmModal } from './ConfirmModal';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  onDelete?: (id: string) => void;
  initialStudent?: Student | null;
}

const ALL_DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const WEEKDAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialStudent
}) => {
  if (!isOpen) return null;

  const isEditing = !!initialStudent;

  const [studentName, setStudentName] = useState(initialStudent?.student || '');
  const [phone, setPhone] = useState(initialStudent?.phone || '');
  const [role, setRole] = useState<PersonRole>(initialStudent?.role || 'Estudiante');
  const [breakfastDays, setBreakfastDays] = useState<string[]>(initialStudent?.breakfastDays || []);
  const [lunchDays, setLunchDays] = useState<string[]>(
    initialStudent?.lunchDays || ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  );
  const [dinnerDays, setDinnerDays] = useState<string[]>(initialStudent?.dinnerDays || []);
  const [notes, setNotes] = useState(initialStudent?.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleDay = (day: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(day)) {
      setList(list.filter(d => d !== day));
    } else {
      setList([...list, day]);
    }
  };

  const setPreset = (type: 'all' | 'lunch_only' | 'breakfast_lunch' | 'all_meals_weekdays') => {
    if (type === 'all') {
      setBreakfastDays([...ALL_DAYS]);
      setLunchDays([...ALL_DAYS]);
      setDinnerDays([...ALL_DAYS]);
    } else if (type === 'lunch_only') {
      setBreakfastDays([]);
      setLunchDays([...WEEKDAYS]);
      setDinnerDays([]);
    } else if (type === 'breakfast_lunch') {
      setBreakfastDays([...WEEKDAYS]);
      setLunchDays([...WEEKDAYS]);
      setDinnerDays([]);
    } else if (type === 'all_meals_weekdays') {
      setBreakfastDays([...WEEKDAYS]);
      setLunchDays([...WEEKDAYS]);
      setDinnerDays([...WEEKDAYS]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Por favor ingrese el nombre de la persona');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');

    const newOrUpdatedStudent: Student = {
      id: initialStudent?.id || String(Date.now()),
      student: studentName.trim().toUpperCase(),
      phone: cleanedPhone,
      role,
      breakfastDays,
      lunchDays,
      dinnerDays,
      notes: notes.trim(),
      subjects: initialStudent?.subjects || {},
      schedule: initialStudent?.schedule || {}
    };

    onSave(newOrUpdatedStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-neutral-800 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isEditing ? 'Editar Comensal' : 'Registrar Nuevo Comensal'}
              </h3>
              <p className="text-xs text-slate-500">
                Control de comidas en la memoria del teléfono
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-sm">
          {/* Nombre Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: BREIDY DAVID SUAREZ"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Rol y Teléfono WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Rol / Ocupación
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as PersonRole)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="Estudiante">Estudiante</option>
                <option value="Trabajador">Trabajador</option>
                <option value="Docente">Docente</option>
                <option value="Residente">Residente</option>
                <option value="Invitado">Invitado</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <img
                  src="/assets/aistudio/whatsapp-3_da26a587.svg"
                  alt="WhatsApp"
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                <span>WhatsApp / Teléfono</span>
              </label>
              <input
                type="tel"
                placeholder="Ej: 573024686505"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Código país + número (ej. 57...)</span>
            </div>
          </div>

          {/* Atajos rápidos de comidas */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2.5">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <span>Plantillas Rápidas de Comidas</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreset('lunch_only')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
              >
                Solo Almuerzo (Lun-Vie)
              </button>
              <button
                type="button"
                onClick={() => setPreset('breakfast_lunch')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
              >
                Desayuno + Almuerzo (Lun-Vie)
              </button>
              <button
                type="button"
                onClick={() => setPreset('all_meals_weekdays')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
              >
                3 Comidas (Lun-Vie)
              </button>
              <button
                type="button"
                onClick={() => setPreset('all')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
              >
                Todos los días (Lun-Dom)
              </button>
            </div>
          </div>

          {/* Días con Comida */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} className="text-indigo-500" />
              Asignación de Comidas por Día
            </h4>

            {/* Desayuno */}
            <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  Desayunos:
                </span>
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBreakfastDays([...WEEKDAYS])}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
                  >
                    Lun-Vie
                  </button>
                  <span className="text-amber-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBreakfastDays([...ALL_DAYS])}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
                  >
                    Todos
                  </button>
                  <span className="text-amber-300">|</span>
                  <button
                    type="button"
                    onClick={() => setBreakfastDays([])}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(day => {
                  const active = breakfastDays.includes(day);
                  return (
                    <button
                      key={`b-${day}`}
                      type="button"
                      onClick={() => toggleDay(day, breakfastDays, setBreakfastDays)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                        active
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Almuerzo */}
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/60 dark:border-indigo-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                  Almuerzos:
                </span>
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setLunchDays([...WEEKDAYS])}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Lun-Vie
                  </button>
                  <span className="text-indigo-300">|</span>
                  <button
                    type="button"
                    onClick={() => setLunchDays([...ALL_DAYS])}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Todos
                  </button>
                  <span className="text-indigo-300">|</span>
                  <button
                    type="button"
                    onClick={() => setLunchDays([])}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(day => {
                  const active = lunchDays.includes(day);
                  return (
                    <button
                      key={`l-${day}`}
                      type="button"
                      onClick={() => toggleDay(day, lunchDays, setLunchDays)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cena */}
            <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                  Cenas:
                </span>
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDinnerDays([...WEEKDAYS])}
                    className="text-rose-600 dark:text-rose-400 hover:underline font-bold"
                  >
                    Lun-Vie
                  </button>
                  <span className="text-rose-300">|</span>
                  <button
                    type="button"
                    onClick={() => setDinnerDays([...ALL_DAYS])}
                    className="text-rose-600 dark:text-rose-400 hover:underline font-bold"
                  >
                    Todos
                  </button>
                  <span className="text-rose-300">|</span>
                  <button
                    type="button"
                    onClick={() => setDinnerDays([])}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(day => {
                  const active = dinnerDays.includes(day);
                  return (
                    <button
                      key={`d-${day}`}
                      type="button"
                      onClick={() => toggleDay(day, dinnerDays, setDinnerDays)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                        active
                          ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notas / Alergias */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Notas u Observaciones (Dieta, alergias, horario)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: No toma lácteos. Llega normalmente a las 12:30."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-xs"
            />
          </div>

          {/* Delete confirmation section if editing */}
          {isEditing && onDelete && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
              >
                <Trash2 size={14} /> Eliminar persona de la memoria local
              </button>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition text-xs"
            >
              <Save size={16} />
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Persona'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation modal before deleting */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={initialStudent ? `¿Eliminar a ${initialStudent.student}?` : '¿Eliminar persona?'}
        message="Se borrará definitivamente de la lista de comensales y de la memoria del teléfono."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (initialStudent && onDelete) {
            onDelete(initialStudent.id);
            setShowDeleteConfirm(false);
            onClose();
          }
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
