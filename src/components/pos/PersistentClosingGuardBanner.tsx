import React from 'react';
import { ShieldAlert, Clock, AlertTriangle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { BlockedLotteryInfo } from '../../utils/lotteryScheduleMiddleware';
import { Lottery } from '../../types/index';

interface PersistentClosingGuardBannerProps {
  blockedLotteries: BlockedLotteryInfo[];
  allLotteries: Lottery[];
  onSelectAlternativeLottery?: (lotteryId: string) => void;
  onDeselectBlockedLottery?: (lotteryId: string) => void;
  className?: string;
}

export const PersistentClosingGuardBanner: React.FC<PersistentClosingGuardBannerProps> = ({
  blockedLotteries,
  allLotteries,
  onSelectAlternativeLottery,
  onDeselectBlockedLottery,
  className = '',
}) => {
  if (!blockedLotteries || blockedLotteries.length === 0) {
    return null;
  }

  // Find first open lottery that is NOT blocked
  const openAlternatives = allLotteries.filter((l) => {
    return l.active && !blockedLotteries.some((b) => b.lottery.id === l.id);
  });

  const primary = blockedLotteries[0];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border-2 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden ${
        primary.isClosingSoon
          ? 'bg-amber-500/10 border-amber-500/60 dark:bg-amber-950/40 dark:border-amber-500 shadow-amber-500/10'
          : 'bg-rose-500/10 border-rose-500/60 dark:bg-rose-950/40 dark:border-rose-500 shadow-rose-500/10'
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div
        className={`px-3.5 py-2 flex items-center justify-between gap-2 text-white font-black text-xs uppercase tracking-wider ${
          primary.isClosingSoon
            ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600'
            : 'bg-gradient-to-r from-rose-600 to-red-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
          <span>
            {primary.isClosingSoon
              ? '⚠️ BLOQUEO DE SEGURIDAD: 5 MINUTOS ANTES DEL CIERRE'
              : '🔴 SORTEO CERRADO — ENTRADA DE JUGADAS BLOQUEADA'}
          </span>
        </div>

        {primary.isClosingSoon && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/30 font-mono text-xs font-black tracking-widest">
            <Clock className="w-3.5 h-3.5 animate-spin text-amber-200" style={{ animationDuration: '6s' }} />
            <span>{primary.formattedCountdown}</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-3.5 space-y-2.5">
        {blockedLotteries.map((b) => (
          <div
            key={b.lottery.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                  b.isClosingSoon
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {b.lottery.name}
                  </h4>
                  <span
                    className={`px-2 py-0.2 rounded-md font-mono text-[10px] font-black ${
                      b.isClosingSoon
                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                        : 'bg-rose-500/20 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    Cierre: {b.formattedCloseTime}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  {b.isClosingSoon ? (
                    <>
                      Por normativa oficial, las jugadas para esta lotería quedan <strong className="text-amber-700 dark:text-amber-400">estrictamente bloqueadas 5 minutos antes de la hora</strong>.
                    </>
                  ) : (
                    <>El horario de ventas ha finalizado para esta lotería.</>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Deselect Button */}
            {onDeselectBlockedLottery && (
              <button
                type="button"
                onClick={() => onDeselectBlockedLottery(b.lottery.id)}
                className="self-end sm:self-center shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                title="Quitar esta lotería de la selección para desbloquear los inputs"
              >
                Deseleccionar
              </button>
            )}
          </div>
        ))}

        {/* Action helper to switch to an open lottery */}
        {openAlternatives.length > 0 && onSelectAlternativeLottery && (
          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sorteos abiertos disponibles:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {openAlternatives.slice(0, 3).map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelectAlternativeLottery(alt.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold transition-colors flex items-center gap-1"
                >
                  <span>{alt.name}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
