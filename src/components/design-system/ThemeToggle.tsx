import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { toggleTheme, isDark, autoNightReason, autoNightConfig } = useTheme();

  const tooltip = autoNightConfig?.autoNightEnabled
    ? `${isDark ? 'Modo Noche' : 'Modo Día'} (${autoNightReason}) · Clic para alternar manual`
    : (isDark ? 'Cambiar a Modo Día ☀️' : 'Cambiar a Modo Noche 🌙');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={tooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-300 font-medium text-xs border ${
        isDark
          ? 'bg-slate-900/90 text-amber-300 border-slate-700/80 hover:bg-slate-800 hover:border-amber-400/50 shadow-sm shadow-amber-900/20'
          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-white hover:text-blue-600 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 transition-transform duration-300 rotate-0 scale-100 fill-amber-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
      {autoNightConfig?.autoNightEnabled && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
          title="Modo Noche Automático activo"
        />
      )}
      {showLabel && (
        <span className="hidden sm:inline font-semibold">
          {isDark ? '🌙 Modo Noche' : '☀️ Modo Día'}
        </span>
      )}
    </button>
  );
};
