import React, { useState } from 'react';
import { useTheme, AutoNightModeType } from '../../context/ThemeContext';
import {
  Moon,
  Sun,
  Clock,
  Laptop,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Eye,
  Info,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface AutoNightModeSettingsProps {
  embedded?: boolean;
}

export const AutoNightModeSettings: React.FC<AutoNightModeSettingsProps> = ({ embedded = false }) => {
  const {
    theme,
    isDark,
    setTheme,
    autoNightConfig,
    updateAutoNightConfig,
    isAutoNightActive,
    autoNightReason,
    isNightTime,
    systemPrefersDark,
    currentTimeStr,
  } = useTheme();

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showSaveSuccess = (message: string) => {
    setSavedNotice(message);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleToggleAutoNight = (enabled: boolean) => {
    updateAutoNightConfig({ autoNightEnabled: enabled });
    showSaveSuccess(
      enabled
        ? '🌙 Modo Noche Automático ACTIVADO. La pantalla se adaptará para reducir la fatiga visual.'
        : '☀️ Modo Noche Automático DESACTIVADO. Se usará el tema manual fijo.'
    );
  };

  const handleSetMode = (mode: AutoNightModeType) => {
    updateAutoNightConfig({ autoNightMode: mode });
    showSaveSuccess('Modo de activación actualizado con éxito.');
  };

  const handlePreset = (start: string, end: string, label: string) => {
    updateAutoNightConfig({
      nightStartHour: start,
      nightEndHour: end,
      autoNightEnabled: true,
      autoNightMode: 'schedule',
    });
    showSaveSuccess(`Horario configurado: ${label} (${start} - ${end})`);
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-4 sm:p-6 max-w-4xl mx-auto'}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Confort Visual & Ergonomía</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Moon className="w-6 h-6 text-amber-300 fill-amber-300" />
              <span>Modo Noche Automático</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Protege la vista de los cajeros y administradores adaptando automáticamente el contraste y los colores durante jornadas nocturnas o según las preferencias del sistema.
            </p>
          </div>

          {/* Master Toggle Switch */}
          <div className="flex flex-col sm:items-end gap-2 bg-white/10 dark:bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                {autoNightConfig.autoNightEnabled ? 'Activado' : 'Desactivado'}
              </span>
              <button
                type="button"
                onClick={() => handleToggleAutoNight(!autoNightConfig.autoNightEnabled)}
                className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                  autoNightConfig.autoNightEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={autoNightConfig.autoNightEnabled}
              >
                <span
                  className={`pointer-events-none inline-flex items-center justify-center h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                    autoNightConfig.autoNightEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {autoNightConfig.autoNightEnabled ? (
                    <Moon className="w-4 h-4 text-slate-900 fill-slate-900" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
            <span className="text-[11px] text-slate-300 font-mono">
              Hora local: <strong>{currentTimeStr || '--:--:--'}</strong>
            </span>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Live Status Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isAutoNightActive
          ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30'
          : 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${
              isDark
                ? 'bg-slate-900 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/20'
                : 'bg-white text-blue-600 border border-blue-200 shadow-sm'
            }`}>
              {isDark ? <Moon className="w-5 h-5 fill-amber-300" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                  Estado Actual de la Pantalla:
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isDark
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-blue-600 text-white font-black'
                }`}>
                  {isDark ? '🌙 Modo Oscuro Activo' : '☀️ Modo Claro Activo'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                {autoNightConfig.autoNightEnabled
                  ? autoNightReason
                  : `Modo manual fijo (${autoNightConfig.manualTheme === 'dark' ? 'Oscuro' : 'Claro'}). Active el Modo Noche Automático para automatizar según jornada o sistema.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{currentTimeStr || 'Detectando'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Activation Criteria Section */}
      {autoNightConfig.autoNightEnabled && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Criterio de Activación Automática</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Seleccione cómo debe el sistema determinar el momento exacto para activar el modo nocturno.
            </p>
          </div>

          {/* 3 Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. SCHEDULE */}
            <div
              onClick={() => handleSetMode('schedule')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                autoNightConfig.autoNightMode === 'schedule'
                  ? 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/15 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-black">
                    <Clock className="w-5 h-5" />
                  </div>
                  {autoNightConfig.autoNightMode === 'schedule' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      ✓
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Por Hora del Día
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Se activa automáticamente durante las horas de la noche configuradas (ej. 19:00 a 06:30).
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Estado actual:</span>
                <span className={isNightTime ? 'text-amber-500 font-bold' : 'text-blue-500 font-bold'}>
                  {isNightTime ? '🌙 En horario nocturno' : '☀️ Fuera de horario'}
                </span>
              </div>
            </div>

            {/* 2. SYSTEM */}
            <div
              onClick={() => handleSetMode('system')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                autoNightConfig.autoNightMode === 'system'
                  ? 'border-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/15 shadow-md shadow-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                    <Laptop className="w-5 h-5" />
                  </div>
                  {autoNightConfig.autoNightMode === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      ✓
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Preferencia del Sistema
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Sigue automáticamente el tema oscuro o claro de Windows, macOS, Android o iOS.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Dispositivo:</span>
                <span className={systemPrefersDark ? 'text-purple-400 font-bold' : 'text-slate-500 font-bold'}>
                  {systemPrefersDark ? '🌙 SO en Modo Oscuro' : '☀️ SO en Modo Claro'}
                </span>
              </div>
            </div>

            {/* 3. SMART HYBRID */}
            <div
              onClick={() => handleSetMode('smart')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                autoNightConfig.autoNightMode === 'smart'
                  ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-md shadow-amber-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {autoNightConfig.autoNightMode === 'smart' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                      ✓
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Modo Inteligente</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950">
                    TOP
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Activa el Modo Noche si es horario nocturno O si el sistema del usuario está en modo oscuro.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>Protección:</span>
                <span className="font-bold">Máxima adaptabilidad</span>
              </div>
            </div>
          </div>

          {/* Schedule Configuration Detail (Visible for 'schedule' and 'smart') */}
          {(autoNightConfig.autoNightMode === 'schedule' || autoNightConfig.autoNightMode === 'smart') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Configuración de Horario de Jornada Nocturna</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Formato 24 Horas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>🌙 Inicio de Jornada Nocturna (Atardecer)</span>
                  </label>
                  <input
                    type="time"
                    value={autoNightConfig.nightStartHour}
                    onChange={(e) => updateAutoNightConfig({ nightStartHour: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    A partir de esta hora el sistema cambiará automáticamente a tema oscuro.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>☀️ Fin de Jornada Nocturna (Amanecer)</span>
                  </label>
                  <input
                    type="time"
                    value={autoNightConfig.nightEndHour}
                    onChange={(e) => updateAutoNightConfig({ nightEndHour: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    A partir de esta hora el sistema retornará al tema claro diurno.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Plantillas Rápidas de Horario para Loterías:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePreset('19:00', '06:30', 'Turno Estándar')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                  >
                    🌙 Turno Estándar (19:00 - 06:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset('18:00', '23:00', 'Cierre Vespertino')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                  >
                    🌆 Cierre Vespertino (18:00 - 23:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset('18:30', '07:00', 'Jornada Extendida')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                  >
                    ⚡ Jornada Extendida (18:30 - 07:00)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Selection (When Auto Night is OFF) */}
      {!autoNightConfig.autoNightEnabled && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Tema Fijo Manual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Al estar desactivado el Modo Noche Automático, seleccione el tema constante de su preferencia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition-all ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Modo Claro Fijo</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition-all ${
                theme === 'dark'
                  ? 'border-amber-500 bg-slate-950 text-amber-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Moon className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Modo Oscuro Fijo</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Health Info Footer */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
            Beneficios Ergonómicos del Modo Noche en Terminales POS
          </span>
          <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
            Las jornadas de ventas prolongadas en ambientes con iluminación tenue provocan fatiga visual digital, cefalea y resequedad ocular. El Modo Noche Automático reduce la emisión de luz brillante y equilibra el contraste cromático de los números de sorteos, optimizando el confort visual del operador.
          </p>
        </div>
      </div>
    </div>
  );
};
