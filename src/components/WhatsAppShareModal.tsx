import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  Edit3,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  Sliders,
  Info,
  CheckCircle2
} from 'lucide-react';
import { MealType, Student } from '../data';
import { ConfirmModal } from './ConfirmModal';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMeal: MealType;
  selectedDate: string;
  formatDateDisplay: (dateStr: string) => string;
  studentsAssignedToMeal: Student[];
  currentMealStatus: Record<string, boolean>;
  groupLink: string;
  onSaveGroupLink: (link: string) => void;
  onToast: (msg: string) => void;
}

export type MessageOptionId = 'desayuno' | 'almuerzo' | 'cena' | 'reporte';

const TEMPLATES_STORAGE_KEY = 'dining_whatsapp_custom_templates_v4';

// Format date cleanly in Spanish: e.g. Jueves 22 de octubre de 2026
export const formatUserFriendlyDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${dayNames[date.getDay()]} ${d} de ${monthNames[m - 1]} de ${y}`;
  } catch {
    return dateStr;
  }
};

// Default canonical templates representing the clean structure desired by the user
export const CANONICAL_TEMPLATES: Record<MessageOptionId, string> = {
  desayuno: [
    `DESAYUNO LISTO`,
    ``,
    `Muy buenos días, Dios me los bendiga.`,
    ``,
    `Ya el desayuno está listo. El que guste puede ir bajando, por favor. Gracias.`,
    ``,
    `{fecha}`
  ].join('\r\n'),

  almuerzo: [
    `ALMUERZO LISTO`,
    ``,
    `Muy buenas tardes, Dios me los bendiga.`,
    ``,
    `Ya el almuerzo está listo. El que guste puede ir bajando, por favor. Gracias.`,
    ``,
    `{fecha}`
  ].join('\r\n'),

  cena: [
    `CENA LISTA`,
    ``,
    `Muy buenas noches, Dios me los bendiga.`,
    ``,
    `Ya la cena está lista. El que guste puede ir bajando, por favor. Gracias.`,
    ``,
    `{fecha}`
  ].join('\r\n'),

  reporte: [
    `REPORTE DE {servicio}`,
    ``,
    `{fecha}, {hora}`,
    ``,
    `Total asignados: {total}`,
    `Ya comieron: {comieron}`,
    `Faltan por comer: {faltan}`,
    ``,
    `Ya comieron:`,
    ``,
    `{lista_comieron}`,
    ``,
    `Faltan por comer:`,
    ``,
    `{lista_faltan}`
  ].join('\r\n')
};

interface TemplateContext {
  cleanDate: string;
  currentTime: string;
  mealUpper: string;
  mealNormal: string;
  total: number;
  eaten: number;
  pending: number;
  eatenListStr: string;
  pendingListStr: string;
}

// Replaces template placeholders with actual dynamic live data
export const evaluateTemplateWithContext = (rawTemplate: string, ctx: TemplateContext): string => {
  return rawTemplate
    .replace(/\{fecha\}/gi, ctx.cleanDate)
    .replace(/\{hora\}/gi, ctx.currentTime)
    .replace(/\{servicio\}/gi, ctx.mealUpper)
    .replace(/\{servicio_normal\}/gi, ctx.mealNormal)
    .replace(/\{total\}/gi, String(ctx.total))
    .replace(/\{comieron\}/gi, String(ctx.eaten))
    .replace(/\{faltan\}/gi, String(ctx.pending))
    .replace(/\{lista_comieron\}/gi, ctx.eatenListStr)
    .replace(/\{lista_faltan\}/gi, ctx.pendingListStr);
};

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  currentMeal,
  selectedDate,
  studentsAssignedToMeal,
  currentMealStatus,
  groupLink,
  onSaveGroupLink,
  onToast,
}) => {
  // Option selection (Desayuno, Almuerzo, Cena, Reporte)
  const defaultOption: MessageOptionId = 
    currentMeal === 'Desayuno' ? 'desayuno' :
    currentMeal === 'Almuerzo' ? 'almuerzo' : 'cena';

  const [selectedOption, setSelectedOption] = useState<MessageOptionId>(defaultOption);
  const [activeTab, setActiveTab] = useState<'message' | 'template'>('message');

  const [tempGroupLink, setTempGroupLink] = useState(groupLink || '');
  const [showConfigLink, setShowConfigLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
  });

  // Stored template structures from localStorage
  const [savedTemplates, setSavedTemplates] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Current template structure being edited in "Plantilla Base" mode
  const [templateText, setTemplateText] = useState<string>('');

  // Active message text ready to be sent for current option
  const [activeMessageText, setActiveMessageText] = useState<string>('');

  // Draft cache for the messages so users don't lose tweaks switching options
  const [messageDrafts, setMessageDrafts] = useState<Partial<Record<MessageOptionId, string>>>({});

  const cleanDate = useMemo(() => formatUserFriendlyDate(selectedDate), [selectedDate]);

  // Compute live attendance statistics and formatted lists
  const templateContext = useMemo<TemplateContext>(() => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const eatenList = studentsAssignedToMeal.filter(s => !!currentMealStatus[s.id]);
    const pendingList = studentsAssignedToMeal.filter(s => !currentMealStatus[s.id]);
    const total = studentsAssignedToMeal.length;
    const eaten = eatenList.length;
    const pending = pendingList.length;

    const eatenListStr = eatenList.length > 0 
      ? eatenList.map(s => s.student).join('\r\n')
      : 'Ninguno registrado aún';

    const pendingListStr = pendingList.length > 0
      ? pendingList.map(s => s.student).join('\r\n')
      : 'Todos han comido';

    return {
      cleanDate,
      currentTime,
      mealUpper: currentMeal.toUpperCase(),
      mealNormal: currentMeal,
      total,
      eaten,
      pending,
      eatenListStr,
      pendingListStr
    };
  }, [studentsAssignedToMeal, currentMealStatus, cleanDate, currentMeal]);

  // Get active raw template for a given option
  const getRawTemplateFor = useCallback((opt: MessageOptionId): string => {
    if (savedTemplates[opt] && savedTemplates[opt].trim()) {
      return savedTemplates[opt];
    }
    return CANONICAL_TEMPLATES[opt];
  }, [savedTemplates]);

  // Compute resolved text for an option
  const computeResolvedText = useCallback((opt: MessageOptionId): string => {
    const raw = getRawTemplateFor(opt);
    return evaluateTemplateWithContext(raw, templateContext);
  }, [getRawTemplateFor, templateContext]);

  // When modal opens, initialize cleanly without interfering with user edits
  useEffect(() => {
    if (isOpen) {
      const initialOpt = currentMeal === 'Desayuno' ? 'desayuno' : currentMeal === 'Almuerzo' ? 'almuerzo' : 'cena';
      setSelectedOption(initialOpt);
      setActiveTab('message');
      const resolved = computeResolvedText(initialOpt);
      setActiveMessageText(resolved);
      setTemplateText(getRawTemplateFor(initialOpt));
      setMessageDrafts({ [initialOpt]: resolved });
      setTempGroupLink(groupLink || '');
      setShowConfigLink(false);
      setCopied(false);
    }
  }, [isOpen]); // Only run on modal open

  if (!isOpen) return null;

  const total = studentsAssignedToMeal.length;
  const eaten = studentsAssignedToMeal.filter(s => !!currentMealStatus[s.id]).length;

  const optionCards: Record<MessageOptionId, { title: string; subtitle: string }> = {
    desayuno: {
      title: 'Desayuno Listo',
      subtitle: 'Aviso para el desayuno'
    },
    almuerzo: {
      title: 'Almuerzo Listo',
      subtitle: 'Aviso para el almuerzo'
    },
    cena: {
      title: 'Cena Lista',
      subtitle: 'Aviso para la cena'
    },
    reporte: {
      title: `Reporte de ${currentMeal}`,
      subtitle: `${eaten} de ${total} ya comieron`
    }
  };

  const currentOptionInfo = optionCards[selectedOption];
  const hasCustomTemplate = !!savedTemplates[selectedOption];

  // Option selection handler
  const handleSelectOption = (opt: MessageOptionId) => {
    if (opt === selectedOption) return;

    // Save current active draft
    setMessageDrafts(prev => ({
      ...prev,
      [selectedOption]: activeMessageText
    }));

    setSelectedOption(opt);
    setTemplateText(getRawTemplateFor(opt));

    if (messageDrafts[opt] !== undefined) {
      setActiveMessageText(messageDrafts[opt]!);
    } else {
      const fresh = evaluateTemplateWithContext(getRawTemplateFor(opt), templateContext);
      setActiveMessageText(fresh);
      setMessageDrafts(prev => ({ ...prev, [opt]: fresh }));
    }
  };

  // Direct editing handler for active message
  const handleMessageChange = (newVal: string) => {
    setActiveMessageText(newVal);
    setMessageDrafts(prev => ({
      ...prev,
      [selectedOption]: newVal
    }));
  };

  // Direct editing handler for template structure
  const handleTemplateChange = (newVal: string) => {
    setTemplateText(newVal);
  };

  // Insert a tag into the template textarea
  const handleInsertTag = (tag: string) => {
    setTemplateText(prev => {
      const updated = prev + tag;
      return updated;
    });
    onToast(`Variable ${tag} agregada a la plantilla`);
  };

  // Save the modified template structure permanently
  const handleSaveTemplateStructure = () => {
    if (!templateText.trim()) {
      onToast('La plantilla no puede estar vacía');
      return;
    }

    try {
      const updated = {
        ...savedTemplates,
        [selectedOption]: templateText
      };
      setSavedTemplates(updated);
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));

      // Re-evaluate the active message with the new template
      const recomputed = evaluateTemplateWithContext(templateText, templateContext);
      setActiveMessageText(recomputed);
      setMessageDrafts(prev => ({
        ...prev,
        [selectedOption]: recomputed
      }));

      onToast('Plantilla base guardada con éxito');
      setActiveTab('message');
    } catch {
      onToast('Error al guardar la plantilla');
    }
  };

  // Restore the original canonical blueprint
  const handleResetTemplateToOriginal = () => {
    const canonical = CANONICAL_TEMPLATES[selectedOption];
    setTemplateText(canonical);

    const updated = { ...savedTemplates };
    delete updated[selectedOption];
    setSavedTemplates(updated);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    const recomputed = evaluateTemplateWithContext(canonical, templateContext);
    setActiveMessageText(recomputed);
    setMessageDrafts(prev => ({
      ...prev,
      [selectedOption]: recomputed
    }));

    onToast('Plantilla restablecida a la estructura recomendada');
  };

  // Refresh live attendance numbers in the current message
  const handleRefreshAttendance = () => {
    const recomputed = evaluateTemplateWithContext(getRawTemplateFor(selectedOption), templateContext);
    setActiveMessageText(recomputed);
    setMessageDrafts(prev => ({
      ...prev,
      [selectedOption]: recomputed
    }));
    onToast('Conteo de asistencia actualizado');
  };

  // Quick text snippet insertion
  const handleInsertSnippet = (snippet: string) => {
    setActiveMessageText(prev => {
      const trimmed = prev.trimEnd();
      const updated = trimmed ? `${trimmed}\r\n${snippet}\r\n` : `${snippet}\r\n`;
      setMessageDrafts(d => ({ ...d, [selectedOption]: updated }));
      return updated;
    });
    onToast('Elemento agregado al mensaje');
  };

  // Clipboard copy
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(activeMessageText);
      setCopied(true);
      onToast('Mensaje copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast('Error al copiar el texto');
    }
  };

  // Native share or direct WhatsApp link
  const handleSendToWhatsApp = async () => {
    if (!activeMessageText.trim()) {
      onToast('El mensaje está vacío');
      return;
    }

    try {
      await navigator.clipboard.writeText(activeMessageText);
    } catch {}

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: currentOptionInfo.title,
          text: activeMessageText,
        });
        onToast('Compartido con éxito');
        onClose();
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    const encoded = encodeURIComponent(activeMessageText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onToast('Abriendo WhatsApp...');
    onClose();
  };

  const handleOpenGroupLink = () => {
    if (!groupLink) {
      setShowConfigLink(true);
      return;
    }

    navigator.clipboard.writeText(activeMessageText).catch(() => {});
    onToast('Mensaje copiado. Abriendo el grupo de WhatsApp...');

    const link = document.createElement('a');
    link.href = groupLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    let sanitized = tempGroupLink.trim();
    if (sanitized && !sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
      sanitized = `https://${sanitized}`;
    }
    onSaveGroupLink(sanitized);
    setShowConfigLink(false);
    onToast('Enlace del grupo guardado');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 p-2 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/50 shadow-sm shrink-0">
              <img
                src="/assets/aistudio/whatsapp-3_da26a587.svg"
                alt="WhatsApp"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Avisos y Reportes de WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Estructura de plantilla inteligente con variables y edición libre
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {(Object.keys(optionCards) as MessageOptionId[]).map((key) => {
              const item = optionCards[key];
              const isSelected = selectedOption === key;
              const hasCustom = !!savedTemplates[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectOption(key)}
                  className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {hasCustom && (
                        <span 
                          title="Tiene plantilla personalizada guardada" 
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        >
                          EDITADA
                        </span>
                      )}
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {item.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Group Link Status Bar */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
              <span className="truncate">
                {groupLink ? (
                  <>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Grupo vinculado:</span>{' '}
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      {groupLink.replace(/^https?:\/\//, '')}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">Sin enlace de grupo guardado</span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfigLink(!showConfigLink)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
            >
              {groupLink ? 'Cambiar' : 'Vincular Grupo'}
            </button>
          </div>

          {/* Group link config form */}
          {showConfigLink && (
            <form onSubmit={handleSaveLink} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:indigo-900/40 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Enlace de invitación del Grupo de WhatsApp:
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfigLink(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                value={tempGroupLink}
                onChange={e => setTempGroupLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                {groupLink && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: '¿Quitar enlace del grupo?',
                        message: 'Se desvinculará el grupo de WhatsApp guardado.',
                        confirmText: 'Sí, quitar',
                        onConfirm: () => {
                          onSaveGroupLink('');
                          setTempGroupLink('');
                          setShowConfigLink(false);
                          onToast('Enlace de grupo eliminado');
                        },
                      });
                    }}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Quitar enlace
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Guardar Enlace
                </button>
              </div>
            </form>
          )}

          {/* Mode Switcher: Mensaje Listo vs Estructura de Plantilla */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('message')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'message'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 size={13} className={activeTab === 'message' ? 'text-emerald-500' : ''} />
                <span>Mensaje Listo para Enviar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateText(getRawTemplateFor(selectedOption));
                  setActiveTab('template');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'template'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sliders size={13} />
                <span>Configurar Plantilla Base</span>
              </button>
            </div>

            {hasCustomTemplate && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                Plantilla personalizada
              </span>
            )}
          </div>

          {/* TAB 1: MENSAJE LISTO PARA ENVIAR */}
          {activeTab === 'message' ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Vista previa generada</span>
                  <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                    100% editable
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedOption === 'reporte' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: '¿Actualizar datos del reporte?',
                          message: 'Se actualizarán las cifras y listas con la asistencia actual.',
                          confirmText: 'Sí, actualizar',
                          onConfirm: handleRefreshAttendance,
                        });
                      }}
                      title="Actualizar datos con la asistencia en vivo"
                      className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Actualizar datos</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: '¿Restablecer este mensaje?',
                        message: 'Volverá a la plantilla predeterminada.',
                        confirmText: 'Sí, restablecer',
                        onConfirm: handleResetTemplateToOriginal,
                      });
                    }}
                    title="Restablecer este mensaje a la plantilla original"
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>

              {/* Quick helper buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">Agregar:</span>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('*Menú del día:* [Escribe el menú]')}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} className="text-emerald-500" />
                  <span>Menú del día</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('*Hora límite:* ')}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} className="text-emerald-500" />
                  <span>Hora límite</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('*Nota:* ')}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} className="text-emerald-500" />
                  <span>Nota</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: '¿Borrar todo el texto?',
                      message: 'Se vaciará el contenido actual del mensaje.',
                      confirmText: 'Sí, borrar',
                      onConfirm: () => {
                        setActiveMessageText('');
                        setMessageDrafts(prev => ({ ...prev, [selectedOption]: '' }));
                      },
                    });
                  }}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium shrink-0 flex items-center gap-1 ml-auto cursor-pointer"
                  title="Borrar todo para escribir desde cero"
                >
                  <Trash2 size={11} />
                  <span>Borrar todo</span>
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={activeMessageText}
                  onChange={e => handleMessageChange(e.target.value)}
                  rows={9}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Escribe o retoca el texto a enviar..."
                  className="w-full bg-slate-900 dark:bg-black text-slate-100 font-mono text-xs sm:text-[12px] p-3.5 rounded-2xl border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none leading-relaxed resize-y shadow-inner transition block cursor-text select-text"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{activeMessageText.length} caracteres • {activeMessageText.split('\n').length} líneas</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Formato WhatsApp (negritas con *palabra*)</span>
              </div>
            </div>
          ) : (
            /* TAB 2: CONFIGURACIÓN DE PLANTILLA BASE (ESTRUCTURA) */
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <Info size={14} className="shrink-0" />
                  <span>Estructura de la plantilla para {currentOptionInfo.title}</span>
                </div>
                <p className="text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
                  Esta es la maqueta estructural. Las palabras entre llaves como <code className="font-mono bg-white/70 dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600">{'{fecha}'}</code> o <code className="font-mono bg-white/70 dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-600">{'{servicio}'}</code> se sustituyen automáticamente al momento de enviar por el día y la hora real en curso.
                </p>
              </div>

              {/* Available variable tokens */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Toca para insertar variables en tu plantilla:
                </label>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{fecha}')}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono text-[11px] transition"
                  >
                    + {'{fecha}'} <span className="font-sans text-[10px] opacity-75">(Día actual)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{hora}')}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono text-[11px] transition"
                  >
                    + {'{hora}'} <span className="font-sans text-[10px] opacity-75">(Hora actual)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{servicio}')}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-mono text-[11px] transition"
                  >
                    + {'{servicio}'} <span className="font-sans text-[10px] opacity-75">(MAYÚSCULA)</span>
                  </button>

                  {selectedOption === 'reporte' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('{total}')}
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-[11px] transition"
                      >
                        + {'{total}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('{comieron}')}
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-[11px] transition"
                      >
                        + {'{comieron}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('{faltan}')}
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-[11px] transition"
                      >
                        + {'{faltan}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('{lista_comieron}')}
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-[11px] transition"
                      >
                        + {'{lista_comieron}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('{lista_faltan}')}
                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-[11px] transition"
                      >
                        + {'{lista_faltan}'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Template Textarea */}
              <div className="relative">
                <textarea
                  value={templateText}
                  onChange={e => handleTemplateChange(e.target.value)}
                  rows={9}
                  spellCheck={false}
                  placeholder="Define aquí la estructura de tu plantilla..."
                  className="w-full bg-slate-900 dark:bg-black text-amber-200 font-mono text-xs sm:text-[12px] p-3.5 rounded-2xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none leading-relaxed resize-y shadow-inner transition block"
                />
              </div>

              {/* Action buttons for template */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: '¿Restablecer estructura base?',
                      message: 'Se restaurará la plantilla original predeterminada.',
                      confirmText: 'Sí, restablecer',
                      onConfirm: handleResetTemplateToOriginal,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Restablecer estructura</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('message')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplateStructure}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Save size={13} />
                    <span>Guardar Plantilla Base</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          {groupLink ? (
            <button
              type="button"
              onClick={handleOpenGroupLink}
              title="Copia el mensaje y abre directamente el enlace de tu grupo de WhatsApp"
              className="flex-1 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer"
            >
              <ExternalLink size={16} />
              <span>Copiar y Abrir Grupo</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleSendToWhatsApp}
            title="Abre WhatsApp con el mensaje listo para enviar a cualquier chat o grupo"
            className="flex-1 py-2.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 cursor-pointer"
          >
            <img
              src="/assets/aistudio/whatsapp-3_da26a587.svg"
              alt="WhatsApp"
              className="w-5 h-5 object-contain shrink-0"
            />
            <span>Enviar a WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Confirmation modal for all actions */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
