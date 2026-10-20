import React, { useState } from 'react';
import { Download, Share2, Check, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'menu' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedFeedback, setInstalledFeedback] = useState(false);

  // If already installed and running in standalone mode, suppress button
  if (isInstalled) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <Check size={16} />
          <span>Aplicación Instalada (Modo PWA)</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledFeedback(true);
        setTimeout(() => setInstalledFeedback(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Manual guidance when browser doesn't trigger beforeinstallprompt yet
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
          title="Instalar como App PWA"
        >
          <Download size={14} />
          <span>Instalar</span>
        </button>
      )}

      {variant === 'menu' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-4 rounded bg-indigo-600 text-white font-bold text-sm shadow-engineering active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <Smartphone size={20} />
            <div className="text-left">
              <div className="font-black text-sm">Instalar Aplicación (PWA)</div>
              <div className="text-[10px] text-indigo-100 font-medium">Uso sin conexión y acceso rápido</div>
            </div>
          </div>
          <Download size={18} />
        </button>
      )}

      {variant === 'banner' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded p-3 flex items-center justify-between gap-3 text-xs mb-4">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-medium">
            <Smartphone size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Instala la app para acceso directo y funcionamiento sin internet.</span>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-bold uppercase text-[10px] tracking-wider transition-colors"
          >
            Instalar
          </button>
        </div>
      )}

      {/* iOS & Manual Installation Guidance Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-neutral-100 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="text-indigo-600" size={20} />
                Instalar Aplicación
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Puedes instalar esta app directamente en la pantalla de inicio de tu teléfono o computadora:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded text-xs text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  En <strong>iPhone / iPad (Safari)</strong>: Toca el botón <strong>Compartir</strong> (<Share2 size={12} className="inline mx-1" />) en la barra de Safari.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  Desliza hacia abajo y presiona <strong>&quot;Agregar a inicio&quot;</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  En <strong>Chrome / Android / PC</strong>: Haz clic en el icono de instalación de la barra de direcciones o menú de tres puntos &gt; <strong>&quot;Instalar aplicación&quot;</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {installedFeedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <Check size={16} />
          <span>¡Aplicación instalada con éxito!</span>
        </div>
      )}
    </>
  );
};
