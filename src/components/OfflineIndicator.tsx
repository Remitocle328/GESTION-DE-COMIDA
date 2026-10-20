import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 rounded-full bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-black shadow-lg animate-pulse">
      <WifiOff size={14} />
      <span>Modo sin conexión — Datos locales activos</span>
    </div>
  );
};
