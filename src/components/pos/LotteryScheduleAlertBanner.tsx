import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lottery } from '../../types/index';
import {
  getLotteryScheduleStatus,
  getLotteriesClosingSoon,
  LotteryScheduleStatus,
} from '../../utils/lotterySchedule';
import {
  AlertTriangle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface LotteryScheduleAlertBannerProps {
  lotteries: Lottery[];
  selectedLotteryIds?: string[];
  onSelectLottery?: (lotteryId: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  // Callback when a lottery closes in real-time
  onLotteryClosed?: (lottery: Lottery) => void;
  className?: string;
  compact?: boolean;
}

export const LotteryScheduleAlertBanner: React.FC<LotteryScheduleAlertBannerProps> = ({
  lotteries,
  selectedLotteryIds = [],
  onSelectLottery,
  soundEnabled = true,
  onToggleSound,
  onLotteryClosed,
  className = '',
  compact = false,
}) => {
  // Live ticking clock to keep countdowns accurate to the exact second
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [closedNotice, setClosedNotice] = useState<{ lotteryName: string; time: string } | null>(null);

  // Sound chime helper
  const playClosingAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [659.25, 587.33, 523.25, 659.25]; // E5, D5, C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.18);
      });
    } catch {
      // Audio not permitted or muted
    }
  };

  // Real-time second interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute status for all lotteries
  const lotteriesWithStatus = useMemo(() => {
    return lotteries.map((lot) => ({
      lottery: lot,
      status: getLotteryScheduleStatus(lot, currentDate),
    }));
  }, [lotteries, currentDate]);

  // Lotteries currently in the 5-minute closing window (diffSecs <= 300 && diffSecs > 0)
  const closingSoonList = useMemo(() => {
    return lotteriesWithStatus
      .filter((item) => item.status.isClosingSoon)
      .sort((a, b) => a.status.closingInSeconds - b.status.closingInSeconds);
  }, [lotteriesWithStatus]);

  // Track state transitions: when a lottery enters the 5-minute window or closes
  const prevClosingSoonRef = useRef<Set<string>>(new Set());
  const prevOpenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    const currentClosingIds = new Set(closingSoonList.map((item) => item.lottery.id));
    const currentOpenIds = new Set(lotteriesWithStatus.filter((item) => item.status.isOpen).map((item) => item.lottery.id));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevClosingSoonRef.current = currentClosingIds;
      prevOpenIdsRef.current = currentOpenIds;
      return;
    }

    // 1. Detect newly entering 5-minute window
    let newlyEnteredCount = 0;
    currentClosingIds.forEach((id) => {
      if (!prevClosingSoonRef.current.has(id)) {
        newlyEnteredCount++;
      }
    });

    if (newlyEnteredCount > 0 && soundEnabled) {
      playClosingAlertTone();
    }

    // 2. Detect lotteries that just closed (were open before, now closed)
    prevOpenIdsRef.current.forEach((prevId) => {
      if (!currentOpenIds.has(prevId)) {
        const closedLot = lotteries.find((l) => l.id === prevId);
        if (closedLot) {
          const sched = getLotteryScheduleStatus(closedLot, currentDate);
          setClosedNotice({
            lotteryName: closedLot.name,
            time: sched.formattedCloseTime,
          });
          if (onLotteryClosed) {
            onLotteryClosed(closedLot);
          }
        }
      }
    });

    prevClosingSoonRef.current = currentClosingIds;
    prevOpenIdsRef.current = currentOpenIds;
  }, [closingSoonList, lotteriesWithStatus, soundEnabled, onLotteryClosed, currentDate, lotteries]);

  // If no lotteries are closing soon and no closed notice, return null
  if (closingSoonList.length === 0 && !closedNotice) {
    return null;
  }

  return (
    <div className={`w-full space-y-2 select-none ${className}`}>
      {/* 1. Closed Notice Banner (triggers when a lottery transitions to closed) */}
      {closedNotice && (
        <div className="bg-rose-500/15 border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                  VENTA CERRADA
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  La lotería {closedNotice.lotteryName} ha finalizado su horario de ventas.
                </span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Cierre oficial: {closedNotice.time}. Ya no se aceptan más apuestas para este sorteo hoy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClosedNotice(null)}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Visual Notification: 'CIERRE PRÓXIMO' (5 minutos antes) */}
      {closingSoonList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-500/60 dark:border-amber-400/50 rounded-2xl shadow-lg shadow-amber-500/10 overflow-hidden animate-in fade-in duration-300 ring-2 ring-amber-500/20">
          {/* Main Top Header Bar */}
          <div className="px-3.5 sm:px-4 py-2.5 bg-amber-500/20 dark:bg-amber-950/40 flex items-center justify-between gap-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Pulsing Alert Icon */}
              <div className="relative shrink-0 flex items-center justify-center">
                <span className="absolute w-5 h-5 rounded-full bg-amber-500/40 animate-ping" />
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span>⚠️ CIERRE PRÓXIMO DE VENTAS</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                      5 MIN ANTES
                    </span>
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 truncate hidden sm:block">
                  {closingSoonList.length === 1
                    ? `El sorteo "${closingSoonList[0].lottery.name}" cerrará su recepción de apuestas en menos de 5 minutos.`
                    : `${closingSoonList.length} sorteos están a punto de cerrar su recepción de apuestas.`}
                </p>
              </div>
            </div>

            {/* Actions: Sound Toggle & Expand/Collapse */}
            <div className="flex items-center gap-1 shrink-0">
              {onToggleSound && (
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 transition-colors"
                  title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-bold transition-colors"
                title={isExpanded ? 'Minimizar aviso' : 'Expandir aviso'}
              >
                <span className="hidden md:inline">{isExpanded ? 'Ocultar' : 'Ver sorteos'}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Content: Cards of Lotteries Closing in <= 5 Minutes */}
          {isExpanded && (
            <div className="p-3 sm:p-3.5 space-y-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {closingSoonList.map(({ lottery, status }) => {
                  const isSelected = selectedLotteryIds.includes(lottery.id);
                  const isCriticallyClose = status.closingInSeconds <= 60; // Less than 1 minute

                  return (
                    <div
                      key={lottery.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isCriticallyClose
                          ? 'bg-rose-500/10 border-rose-500/50 shadow-xs ring-1 ring-rose-500/40'
                          : 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: lottery.color || '#F59E0B' }}
                          />
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase truncate">
                            {lottery.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                            Cierre: <strong className="font-mono">{status.formattedCloseTime}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Live Countdown Badge & Quick Select Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Countdown Badge */}
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-black text-xs shadow-xs ${
                            isCriticallyClose
                              ? 'bg-rose-600 text-white animate-bounce'
                              : 'bg-amber-500 text-slate-950 animate-pulse'
                          }`}
                          title={`Tiempo restante para el cierre de ${lottery.name}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{status.formattedCountdown}</span>
                        </div>

                        {/* Quick Bet / Select Action */}
                        {onSelectLottery && (
                          <button
                            type="button"
                            onClick={() => onSelectLottery(lottery.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-200 dark:hover:bg-slate-700'
                            }`}
                            title="Seleccionar esta lotería para apostar rápido"
                          >
                            <Zap className="w-3 h-3" />
                            <span>{isSelected ? 'Activo' : 'Apostar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative footer */}
              <div className="flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-300/80 px-1 pt-0.5">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>
                    El sistema bloqueará automáticamente la venta de estos sorteos tan pronto el contador llegue a cero.
                  </span>
                </span>
                <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  {closingSoonList.length} sorteo(s) en cierre próximo
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
