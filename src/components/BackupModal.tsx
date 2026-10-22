import React, { useRef, useState } from 'react';
import { X, HardDrive, Download, Upload, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Student } from '../data';
import { exportDataAsJSON, importDataFromJSON, resetStorageToDefaults, getStorageMemoryStats } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onDataUpdated: (newStudents: Student[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  students,
  onDataUpdated
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<Student[] | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const stats = getStorageMemoryStats();

  const handleExport = () => {
    try {
      exportDataAsJSON(students);
      setSuccessMessage('Copia de seguridad descargada exitosamente en el dispositivo.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage('Error al exportar: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importDataFromJSON(text);
        // Ask for confirmation before overwriting
        setPendingImport(imported);
      } catch (err: any) {
        setErrorMessage('Error al leer el archivo: ' + err.message);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    onDataUpdated(pendingImport);
    setSuccessMessage(`Se restauraron exitosamente ${pendingImport.length} personas en el dispositivo.`);
    setPendingImport(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleReset = () => {
    const defaults = resetStorageToDefaults();
    onDataUpdated(defaults);
    setShowResetConfirm(false);
    setSuccessMessage('Memoria local vaciada exitosamente.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <HardDrive size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Memoria del Teléfono & Respaldo
              </h3>
              <p className="text-xs text-slate-500">
                Almacenamiento 100% local y seguro en tu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 font-bold">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Device memory stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Personas Guardadas
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {students.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Espacio en Teléfono
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                {stats.sizeKB} KB
              </span>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Todos los comensales y registros de asistencia al comedor quedan permanentemente guardados en el almacenamiento interno de tu teléfono (PWA), sin requerir conexión a internet ni servidores externos.
          </p>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition"
            >
              <Download size={16} />
              <span>Descargar Copia de Seguridad (JSON)</span>
            </button>

            {/* Import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Upload size={16} />
              <span>Restaurar Copia desde el Teléfono</span>
            </button>
          </div>

          {/* Reset section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold mx-auto transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Vaciar todos los datos (Empezar de cero)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation to restore from file */}
      <ConfirmModal
        isOpen={!!pendingImport}
        title="¿Restaurar copia de seguridad?"
        message={pendingImport ? `Se reemplazarán los datos actuales por los ${pendingImport.length} comensales de la copia.` : ''}
        confirmText="Sí, restaurar"
        cancelText="Cancelar"
        onConfirm={handleConfirmImport}
        onClose={() => setPendingImport(null)}
      />

      {/* Confirmation to wipe all data */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="¿Vaciar todos los datos?"
        message="Se eliminarán todos los comensales y registros guardados en la memoria de este teléfono."
        confirmText="Sí, vaciar"
        cancelText="Cancelar"
        onConfirm={handleReset}
        onClose={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
