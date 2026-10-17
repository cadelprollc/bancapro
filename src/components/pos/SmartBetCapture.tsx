import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lottery, PlayType, User } from '../../types/index';
import {
  Sparkles,
  Zap,
  Dices,
  RotateCcw,
  Plus,
  Lock,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Link2,
  Smartphone,
  Package,
  Trash2,
  Check,
} from 'lucide-react';
import { getLotteryScheduleStatus } from '../../utils/lotterySchedule';
import {
  evaluateSelectionScheduleGuard,
  isLotteryBlockedBy5MinRule,
} from '../../utils/lotteryScheduleMiddleware';
import { PersistentClosingGuardBanner } from './PersistentClosingGuardBanner';
import { LigarModal, LigarMode, GeneratedLigarPlay } from './LigarModal';
import { getPresetLogoForLottery } from '../../utils/lotteryLogos';

export interface SmartBetCaptureProps {
  lotteries: Lottery[];
  selectedLotteryIds: string[];
  onSelectLotteryIds: (ids: string[]) => void;
  isSuperPaleMode: boolean;
  onToggleSuperPaleMode: (active: boolean) => void;
  superPaleLotteries: [string, string];
  onSelectSuperPaleLotteries: (lot1: string, lot2: string) => void;
  onAddPlay: (
    playType: PlayType,
    numbers: string[],
    amount: number,
    options?: {
      lotteryId?: string;
      lottery2Id?: string;
    }
  ) => Promise<void> | void;
  onAddMultiplePlays?: (
    plays: Array<{
      playType: PlayType;
      numbers: string[];
      amount: number;
      lotteryId?: string;
      lottery2Id?: string;
    }>,
    options?: {
      replaceBasketPlays?: boolean;
    }
  ) => Promise<void> | void;
  soundEnabled?: boolean;
  onPlayTone?: (freq?: number, duration?: number) => void;
  onHaptic?: (pattern?: number | number[]) => void;
  onOpenSorteosModal?: () => void;
  onOpenRecargas?: () => void;
  onOpenProductos?: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
  topeWarning?: string | null;
  layoutVariant?: 'mobile' | 'desktop';
  user?: User;
  pendingPlays?: Array<{
    playType: PlayType;
    numbers: string[];
    amount: number;
    lotteryId?: string;
    lotteryName?: string;
  }>;
}

export const SmartBetCapture: React.FC<SmartBetCaptureProps> = ({
  lotteries,
  selectedLotteryIds,
  onSelectLotteryIds,
  isSuperPaleMode,
  onToggleSuperPaleMode,
  superPaleLotteries,
  onSelectSuperPaleLotteries,
  onAddPlay,
  onAddMultiplePlays,
  soundEnabled = true,
  onPlayTone,
  onHaptic,
  onOpenSorteosModal,
  onOpenRecargas,
  onOpenProductos,
  errorMessage,
  onClearError,
  topeWarning,
  layoutVariant = 'mobile',
  user,
  pendingPlays = [],
}) => {
  // Input State: Numbers & Amount
  const [smartInput, setSmartInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('0');
  const [activeTarget, setActiveTarget] = useState<'numbers' | 'amount'>('numbers');
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Audio & Haptic Helper
  const triggerSensory = (keyId?: string, freq = 850, vibrationMs: number | number[] = 18) => {
    if (soundEnabled && onPlayTone) onPlayTone(freq);
    if (onHaptic) onHaptic(vibrationMs);
  };

  // Real-time Extraction and Automatic Play Detection
  const parsedData = useMemo(() => {
    const raw = smartInput.trim();
    let numPart = raw;
    let inlineAmt: number | null = null;

    if (raw.includes('*') || raw.includes('=') || raw.toLowerCase().includes('x')) {
      const parts = raw.split(/[*=xX]/);
      numPart = parts[0] || '';
      const amtCandidate = parseInt((parts[1] || '').replace(/\D/g, ''), 10);
      if (!isNaN(amtCandidate) && amtCandidate > 0) {
        inlineAmt = amtCandidate;
      }
    }

    const cleanDigits = numPart.replace(/\D/g, '').slice(0, 6);
    const len = cleanDigits.length;

    const pairs: string[] = [];
    for (let i = 0; i < len; i += 2) {
      pairs.push(cleanDigits.substring(i, Math.min(i + 2, len)));
    }

    let detectedType: PlayType | null = null;
    let isComplete = false;
    let typeLabel = '';
    let expectedDigits = 2;

    if (isSuperPaleMode) {
      detectedType = 'SUPER_PALE';
      expectedDigits = 4;
      isComplete = len === 4;
      typeLabel = 'SÚPER PALÉ';
    } else if (len <= 2) {
      detectedType = 'QUINIELA';
      expectedDigits = 2;
      isComplete = len === 2;
      typeLabel = 'QUINIELA';
    } else if (len <= 4) {
      detectedType = 'PALE';
      expectedDigits = 4;
      isComplete = len === 4;
      typeLabel = 'PALÉ';
    } else {
      detectedType = 'TRIPLETA';
      expectedDigits = 6;
      isComplete = len === 6;
      typeLabel = 'TRIPLETA';
    }

    return {
      cleanDigits,
      length: len,
      pairs,
      detectedType,
      isComplete,
      typeLabel,
      expectedDigits,
      inlineAmt,
    };
  }, [smartInput, isSuperPaleMode]);

  useEffect(() => {
    if (parsedData.inlineAmt !== null) {
      setAmountInput(String(parsedData.inlineAmt));
    }
  }, [parsedData.inlineAmt]);

  // POS Schedule Guard Middleware
  const [liveTick, setLiveTick] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scheduleGuard = useMemo(() => {
    return evaluateSelectionScheduleGuard(
      lotteries,
      selectedLotteryIds,
      isSuperPaleMode,
      superPaleLotteries,
      false,
      liveTick
    );
  }, [lotteries, selectedLotteryIds, isSuperPaleMode, superPaleLotteries, liveTick]);

  const isInputBlocked = scheduleGuard.isInputBlocked;
  const blockedLotteries = scheduleGuard.blockedLotteries;
  const primaryBlocked = scheduleGuard.primaryBlockedLottery;

  const openLotteries = useMemo(() => {
    return lotteries.filter((l) => getLotteryScheduleStatus(l, liveTick).isOpen);
  }, [lotteries, liveTick]);

  // Ligar Modal state
  const [showLigarModal, setShowLigarModal] = useState<boolean>(false);
  const [selectedLigarMode, setSelectedLigarMode] = useState<LigarMode>('PALE');

  const preloadedLigarNumbers = useMemo(() => {
    const digits = parsedData.cleanDigits;
    if (!digits) return [];
    const res: string[] = [];
    for (let i = 0; i < digits.length; i += 2) {
      if (i + 1 < digits.length) {
        res.push(digits.substring(i, i + 2));
      }
    }
    return res;
  }, [parsedData.cleanDigits]);

  const handleConfirmLigarPlays = async (
    generatedPlays: GeneratedLigarPlay[],
    options?: { replaceBasketPlays?: boolean }
  ) => {
    try {
      if (onAddMultiplePlays) {
        await onAddMultiplePlays(
          generatedPlays.map((p) => ({
            playType: p.playType,
            numbers: p.numbers,
            amount: p.amount,
            lotteryId: p.lotteryId,
            lottery2Id: p.lottery2Id,
          })),
          options
        );
      } else {
        for (const p of generatedPlays) {
          await onAddPlay(p.playType, p.numbers, p.amount, {
            lotteryId: p.lotteryId,
            lottery2Id: p.lottery2Id,
          });
        }
      }
      triggerSensory('add-success', 1350, [20, 40]);
      setSmartInput('');
      setAmountInput('0');
      setInputFeedback(`✓ ¡${generatedPlays.length} jugadas ligadas agregadas!`);
      setTimeout(() => setInputFeedback(null), 3000);
    } catch {
      setInputFeedback('Error registrando jugadas.');
    }
  };

  // Touch Keypad Handler
  const handleKeypadPress = (val: string) => {
    if (isInputBlocked) return;
    triggerSensory(`key-${val}`, 820, 16);

    if (activeTarget === 'amount') {
      if (val === 'clear') {
        setAmountInput('0');
      } else if (val === 'backspace') {
        const next = amountInput.slice(0, -1);
        setAmountInput(next && next !== '0' ? next : '0');
      } else if (/^[0-9]$/.test(val)) {
        if (amountInput === '0') {
          setAmountInput(val);
        } else {
          setAmountInput((prev) => (prev + val).slice(0, 6));
        }
      }
    } else {
      // Numbers target
      if (val === 'clear') {
        setSmartInput('');
      } else if (val === 'backspace') {
        setSmartInput((prev) => prev.slice(0, -1));
      } else if (/^[0-9]$/.test(val)) {
        setSmartInput((prev) => {
          const clean = prev.replace(/\D/g, '');
          if (clean.length >= 6) return prev;
          return clean + val;
        });
      }
    }
  };

  // Quick Amount Add (+10, +20, +50, +100, +500)
  const handleQuickAddAmount = (addVal: number) => {
    triggerSensory(`amt-${addVal}`, 900, 16);
    const curr = parseInt(amountInput || '0', 10);
    setAmountInput(String(curr + addVal));
  };

  // Lucky Numbers generator (Suerte)
  const handleLuckyNumbers = () => {
    triggerSensory('lucky', 1150, 25);
    const rand2 = () => String(Math.floor(Math.random() * 100)).padStart(2, '0');
    if (isSuperPaleMode || parsedData.detectedType === 'PALE') {
      const n1 = rand2();
      let n2 = rand2();
      while (n2 === n1) n2 = rand2();
      setSmartInput(`${n1}${n2}`);
    } else if (parsedData.detectedType === 'TRIPLETA') {
      const n1 = rand2();
      let n2 = rand2();
      let n3 = rand2();
      while (n2 === n1) n2 = rand2();
      while (n3 === n1 || n3 === n2) n3 = rand2();
      setSmartInput(`${n1}${n2}${n3}`);
    } else {
      setSmartInput(rand2());
    }
  };

  // Invert numbers (Virao)
  const handleInvertNumbers = () => {
    triggerSensory('virao', 1050, 25);
    const digits = parsedData.cleanDigits;
    if (digits.length === 2) {
      setSmartInput(`${digits[1]}${digits[0]}`);
    } else if (digits.length === 4) {
      setSmartInput(`${digits.substring(2, 4)}${digits.substring(0, 2)}`);
    } else if (digits.length === 6) {
      setSmartInput(`${digits.substring(4, 6)}${digits.substring(2, 4)}${digits.substring(0, 2)}`);
    }
  };

  // Clear inputs
  const handleClearAll = () => {
    triggerSensory('clear', 520, 20);
    setSmartInput('');
    setAmountInput('0');
    setActiveTarget('numbers');
    if (onClearError) onClearError();
  };

  // Submit Play
  const handleCommitPlay = async () => {
    if (isInputBlocked && primaryBlocked) {
      triggerSensory('error', 380, [40, 50, 40]);
      setInputFeedback(scheduleGuard.blockingReason || 'Sorteo bloqueado por cierre.');
      return;
    }

    if (!parsedData.detectedType || !parsedData.isComplete) {
      triggerSensory('error', 380, [30, 40, 30]);
      setInputFeedback(`Faltan dígitos: Ingrese ${parsedData.expectedDigits} dígitos para ${parsedData.typeLabel}.`);
      return;
    }

    const amt = parseInt(amountInput || '0', 10);
    if (isNaN(amt) || amt <= 0) {
      triggerSensory('error', 380, [30, 40, 30]);
      setInputFeedback('⚠️ Asigne el monto en RD$ para la jugada.');
      setActiveTarget('amount');
      return;
    }

    if (isSuperPaleMode) {
      if (!superPaleLotteries[0] || !superPaleLotteries[1] || superPaleLotteries[0] === superPaleLotteries[1]) {
        triggerSensory('error', 380, [30, 40, 30]);
        setInputFeedback('Seleccione 2 sorteos diferentes para Súper Palé.');
        return;
      }
      await onAddPlay('SUPER_PALE', parsedData.pairs, amt, {
        lotteryId: superPaleLotteries[0],
        lottery2Id: superPaleLotteries[1],
      });
    } else {
      if (selectedLotteryIds.length === 0) {
        triggerSensory('error', 380, [30, 40, 30]);
        setInputFeedback('Seleccione al menos una lotería arriba.');
        return;
      }
      await onAddPlay(parsedData.detectedType, parsedData.pairs, amt);
    }

    triggerSensory('add-success', 1280, [15, 30]);
    setSmartInput('');
    setAmountInput('0');
    setActiveTarget('numbers');
    setInputFeedback(null);
  };

  return (
    <div className="w-full space-y-3 font-sans select-none">
      {/* 1. SELECCIÓN DIRECTA DE LOTERÍAS (En Móvil: Botones grandes y visibles sin modals) */}
      {layoutVariant === 'mobile' && !isSuperPaleMode && (
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
              <span>Loterías</span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                ({selectedLotteryIds.length} seleccionada{selectedLotteryIds.length !== 1 ? 's' : ''})
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectLotteryIds(openLotteries.map((l) => l.id))}
                className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Todas
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => onSelectLotteryIds([])}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Carrusel Horizontal de Loterías con Logo Oficial */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {lotteries.map((lot) => {
              const st = getLotteryScheduleStatus(lot, liveTick);
              const isSelected = selectedLotteryIds.includes(lot.id);
              const logo = lot.logoUrl || getPresetLogoForLottery(lot.name);

              return (
                <button
                  key={lot.id}
                  type="button"
                  disabled={!st.isOpen}
                  onClick={() => {
                    if (isSelected) {
                      onSelectLotteryIds(selectedLotteryIds.filter((id) => id !== lot.id));
                    } else {
                      onSelectLotteryIds([...selectedLotteryIds, lot.id]);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    !st.isOpen
                      ? 'opacity-35 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={lot.name}
                      className="w-5 h-5 object-contain rounded-md bg-white p-0.5 shrink-0"
                    />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${st.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                  )}
                  <span className="truncate max-w-[130px]">{lot.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SELECTOR DE TIPO DE JUGADA (Pestañas Claras: Quiniela, Palé, Tripleta, Súper Palé) */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-black">
        <button
          type="button"
          onClick={() => {
            onToggleSuperPaleMode(false);
            if (parsedData.cleanDigits.length > 2) {
              setSmartInput(parsedData.cleanDigits.slice(0, 2));
            }
          }}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
            !isSuperPaleMode && parsedData.detectedType === 'QUINIELA'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎱 Quiniela</span>
          <span className="text-[9px] opacity-75 font-normal">2 dígitos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleSuperPaleMode(false);
            if (parsedData.cleanDigits.length < 3) {
              // Si tenía 2 dígitos, mantiene y espera los otros 2
            }
          }}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
            !isSuperPaleMode && parsedData.detectedType === 'PALE'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎲 Palé</span>
          <span className="text-[9px] opacity-75 font-normal">4 dígitos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleSuperPaleMode(false);
          }}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
            !isSuperPaleMode && parsedData.detectedType === 'TRIPLETA'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>💎 Tripleta</span>
          <span className="text-[9px] opacity-75 font-normal">6 dígitos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleSuperPaleMode(true);
            if (openLotteries.length >= 2 && (!superPaleLotteries[0] || !superPaleLotteries[1])) {
              onSelectSuperPaleLotteries(openLotteries[0].id, openLotteries[1].id);
            }
          }}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
            isSuperPaleMode
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
              : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
          }`}
        >
          <span>⚡ Súper Palé</span>
          <span className="text-[9px] opacity-75 font-normal">Cruza 2</span>
        </button>
      </div>

      {/* Sorteos para Súper Palé (si está activo) */}
      {isSuperPaleMode && (
        <div className="p-2.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-300/60 dark:border-purple-800/60 grid grid-cols-2 gap-2 text-xs animate-in fade-in">
          <div>
            <label className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 block mb-1">
              1er Sorteo:
            </label>
            <select
              value={superPaleLotteries[0] || ''}
              onChange={(e) => onSelectSuperPaleLotteries(e.target.value, superPaleLotteries[1])}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 font-bold text-xs"
            >
              <option value="" disabled>Seleccione 1er Sorteo</option>
              {lotteries.map((l) => (
                <option key={l.id} value={l.id} disabled={l.id === superPaleLotteries[1]}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 block mb-1">
              2do Sorteo:
            </label>
            <select
              value={superPaleLotteries[1] || ''}
              onChange={(e) => onSelectSuperPaleLotteries(superPaleLotteries[0], e.target.value)}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 font-bold text-xs"
            >
              <option value="" disabled>Seleccione 2do Sorteo</option>
              {lotteries.map((l) => (
                <option key={l.id} value={l.id} disabled={l.id === superPaleLotteries[0]}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. ENTRADA DIRECTA Y LIMPIA DE NÚMEROS Y MONTO (Sin teclado virtual por defecto ni montos rápidos) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Campo Números */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <label htmlFor="smart-numbers-input" className="uppercase tracking-tight text-[11px] font-black">
                {parsedData.typeLabel || 'NÚMEROS'} ({parsedData.cleanDigits.length}/{parsedData.expectedDigits})
              </label>
              {smartInput && (
                <button
                  type="button"
                  onClick={() => setSmartInput('')}
                  className="text-[11px] text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                >
                  Borrar
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                id="smart-numbers-input"
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                disabled={isInputBlocked}
                value={smartInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9*=\-]/g, '').slice(0, 10);
                  setSmartInput(val);
                }}
                onFocus={() => setActiveTarget('numbers')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (parseInt(amountInput || '0', 10) <= 0) {
                      amountRef.current?.focus();
                    } else {
                      handleCommitPlay();
                    }
                  }
                }}
                placeholder={isSuperPaleMode ? "00-00" : parsedData.detectedType === 'TRIPLETA' ? "00-00-00" : parsedData.detectedType === 'PALE' ? "00-00" : "00"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wider outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
              {parsedData.pairs.length > 0 && (
                <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
                  {parsedData.pairs.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-cyan-300 font-mono text-xs font-black"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campo Monto (RD$) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <label htmlFor="smart-amount-input" className="uppercase tracking-tight text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                Monto (RD$)
              </label>
              {amountInput !== '0' && amountInput !== '' && (
                <button
                  type="button"
                  onClick={() => setAmountInput('0')}
                  className="text-[11px] text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                >
                  Cero
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono font-bold text-xs text-slate-400 select-none">
                RD$
              </span>
              <input
                id="smart-amount-input"
                ref={amountRef}
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                disabled={isInputBlocked}
                value={amountInput === '0' ? '' : amountInput}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAmountInput(cleaned || '0');
                }}
                onFocus={() => setActiveTarget('amount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCommitPlay();
                  }
                }}
                placeholder="0"
                className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wide outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Mensaje de Feedback */}
        {inputFeedback && (
          <p className="text-xs font-bold text-blue-600 dark:text-cyan-400 text-center animate-in fade-in py-0.5">
            {inputFeedback}
          </p>
        )}

        {/* Botón Principal: AGREGAR JUGADA */}
        <button
          type="button"
          disabled={isInputBlocked || !parsedData.isComplete || parseInt(amountInput || '0', 10) <= 0}
          onClick={handleCommitPlay}
          className={`w-full min-h-[48px] rounded-xl font-black text-sm tracking-wide text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            isInputBlocked
              ? 'bg-amber-600 cursor-not-allowed opacity-80'
              : parsedData.isComplete && parseInt(amountInput || '0', 10) > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-500/40'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isInputBlocked ? (
            <>
              <Lock className="w-4 h-4 text-white" />
              <span>SORTEO CERRADO</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>AGREGAR JUGADA</span>
              {parseInt(amountInput || '0', 10) > 0 && (
                <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded-lg">
                  RD$ {amountInput}
                </span>
              )}
            </>
          )}
        </button>

        {/* Botones de Acción Rápida: Suerte, Virar, Ligar, Limpiar */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs font-bold">
          <button
            type="button"
            onClick={handleLuckyNumbers}
            className="py-2 px-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95 border border-amber-200/80 dark:border-amber-900"
            title="Generar números de la suerte al azar"
          >
            <Dices className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px]">Suerte</span>
          </button>

          <button
            type="button"
            onClick={handleInvertNumbers}
            disabled={parsedData.cleanDigits.length < 2}
            className="py-2 px-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-40 border border-slate-200/80 dark:border-slate-700"
            title="Invertir números (Virao)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[11px]">Virar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLigarMode('PALE');
              setShowLigarModal(true);
            }}
            className="py-2 px-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            title="Ligar números en combinaciones de Palé y Tripleta"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px]">Ligar</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="py-2 px-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95 border border-slate-200/80 dark:border-slate-700"
            title="Limpiar entrada"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[11px]">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Modal Ligar */}
      {showLigarModal && (
        <LigarModal
          isOpen={showLigarModal}
          onClose={() => setShowLigarModal(false)}
          initialMode={selectedLigarMode}
          preloadedNumbers={preloadedLigarNumbers}
          basketPlays={pendingPlays}
          lotteries={lotteries}
          selectedLotteryIds={selectedLotteryIds}
          superPaleLotteries={superPaleLotteries}
          onConfirmLigarPlays={handleConfirmLigarPlays}
          user={
            user || {
              id: 'usr-1',
              username: 'cajero',
              name: 'Cajero',
              role: 'SELLER' as any,
              active: true,
              createdAt: '',
            }
          }
          onPlayTone={onPlayTone}
        />
      )}
    </div>
  );
};
