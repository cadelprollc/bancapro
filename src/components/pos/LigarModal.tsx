import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lottery, PlayType, User } from '../../types';
import {
  X,
  Link2,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Dices,
} from 'lucide-react';
import { getLotteryScheduleStatus } from '../../utils/lotterySchedule';
import { isLotteryBlockedBy5MinRule } from '../../utils/lotteryScheduleMiddleware';

export type LigarMode = 'PALE' | 'TRIPLETA' | 'SUPER_PALE';

export interface GeneratedLigarPlay {
  playType: PlayType;
  numbers: string[];
  amount: number;
  lotteryId: string;
  lotteryName: string;
  lottery2Id?: string;
  lottery2Name?: string;
}

export interface BasketPlayItem {
  playType: PlayType;
  numbers: string[];
  amount: number;
  lotteryId?: string;
  lotteryName?: string;
  tempId?: string;
}

export interface LigarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: LigarMode;
  preloadedNumbers?: string[];
  basketPlays?: BasketPlayItem[];
  lotteries: Lottery[];
  selectedLotteryIds: string[];
  superPaleLotteries?: [string, string];
  onConfirmLigarPlays: (plays: GeneratedLigarPlay[], options?: { replaceBasketPlays?: boolean }) => void;
  user: User;
  onPlayTone?: (freq?: number, duration?: number) => void;
}

// Algoritmo combinatorio de combinaciones k de N elementos únicos
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export const LigarModal: React.FC<LigarModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'PALE',
  preloadedNumbers = [],
  basketPlays = [],
  lotteries,
  selectedLotteryIds,
  superPaleLotteries = ['', ''],
  onConfirmLigarPlays,
  user,
  onPlayTone,
}) => {
  const [mode, setMode] = useState<LigarMode>(initialMode);
  // Lista de números de 2 dígitos únicos seleccionados para ligar
  const [numbersList, setNumbersList] = useState<string[]>([]);
  // Entrada rápida para tipear números (ej. '05', '10')
  const [quickInput, setQuickInput] = useState<string>('');
  // Monto por combinación (por defecto RD$2 según regla oficial, editable)
  const [amountPerCombo, setAmountPerCombo] = useState<number>(2);
  // Loterías seleccionadas para Pale y Tripleta
  const [targetLotteryIds, setTargetLotteryIds] = useState<string[]>([]);
  // Loterías para Súper Palé (deben ser 2 distintas)
  const [superLot1, setSuperLot1] = useState<string>('');
  const [superLot2, setSuperLot2] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Opción para reemplazar las jugadas de quiniela originales en el ticket por las combinaciones ligadas
  const [replaceBasketQuinielas, setReplaceBasketQuinielas] = useState<boolean>(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Extraer números de jugadas que ya estén agregadas en el ticket (quinielas y otras jugadas del ticket)
  const basketNumbers = useMemo(() => {
    const nums: string[] = [];
    basketPlays.forEach((p) => {
      p.numbers.forEach((n) => {
        const clean = n.replace(/\D/g, '').padStart(2, '0').slice(-2);
        if (clean.length === 2 && !nums.includes(clean)) {
          nums.push(clean);
        }
      });
    });
    return nums;
  }, [basketPlays]);

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setAmountPerCombo(2); // Default RD$2 editable
      setReplaceBasketQuinielas(false); // Los números agregados NO se borran, se quedan y se suman las ligadas

      // Prioridad 1: Si hay jugadas ya agregadas en el ticket, cargarlas como fuente principal de ligar
      // Prioridad 2: Preloaded numbers del input actual
      let initialNums: string[] = [];
      if (basketNumbers.length > 0) {
        initialNums = [...basketNumbers];
      } else if (preloadedNumbers.length > 0) {
        initialNums = Array.from(
          new Set(
            preloadedNumbers
              .map((n) => n.replace(/\D/g, '').padStart(2, '0').slice(-2))
              .filter((n) => n.length === 2)
          )
        );
      }
      setNumbersList(initialNums);

      // Loterías abiertas disponibles
      const openLots = lotteries.filter((l) => {
        const s = getLotteryScheduleStatus(l);
        return s.isOpen && !isLotteryBlockedBy5MinRule(l).isBlocked;
      });

      // Loterías por defecto: si las jugadas del ticket tienen lotería, sincronizarla
      const basketLotteryIds = Array.from(
        new Set(basketPlays.map((p) => p.lotteryId).filter(Boolean) as string[])
      );

      if (basketLotteryIds.length > 0) {
        setTargetLotteryIds(basketLotteryIds);
      } else if (selectedLotteryIds.length > 0) {
        setTargetLotteryIds(selectedLotteryIds);
      } else if (openLots.length > 0) {
        setTargetLotteryIds([openLots[0].id]);
      } else {
        setTargetLotteryIds([]);
      }

      // Súper Palé inicial
      if (superPaleLotteries[0] && superPaleLotteries[1]) {
        setSuperLot1(superPaleLotteries[0]);
        setSuperLot2(superPaleLotteries[1]);
      } else if (openLots.length >= 2) {
        setSuperLot1(openLots[0].id);
        setSuperLot2(openLots[1].id);
      }

      // Enfocar input para agregar números
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialMode, preloadedNumbers, basketPlays, basketNumbers, lotteries, selectedLotteryIds, superPaleLotteries]);

  // Loterías abiertas válidas
  const availableLotteries = useMemo(() => {
    return lotteries.filter((l) => {
      const st = getLotteryScheduleStatus(l);
      return st.isOpen && !isLotteryBlockedBy5MinRule(l).isBlocked;
    });
  }, [lotteries]);

  // Requisitos mínimos según modo
  const minRequiredNumbers = mode === 'TRIPLETA' ? 3 : 2;

  // Agregar número a la lista
  const handleAddNumber = (numStr: string) => {
    const clean = numStr.replace(/\D/g, '');
    if (clean.length === 0) return;
    const formatted = clean.padStart(2, '0').slice(-2);

    if (numbersList.includes(formatted)) {
      setErrorMsg(`El número ${formatted} ya está en la lista de números a ligar.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (onPlayTone) onPlayTone(1100, 0.04);
    setNumbersList((prev) => [...prev, formatted]);
    setQuickInput('');
    setErrorMsg(null);
  };

  // Remover número de la lista
  const handleRemoveNumber = (numToRemove: string) => {
    if (onPlayTone) onPlayTone(600, 0.04);
    setNumbersList((prev) => prev.filter((n) => n !== numToRemove));
  };

  // Manejar tipeo en input rápido
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (quickInput.trim()) {
        // Puede ser uno o varios separados por espacio
        const nums = quickInput.split(/[\s,.-]+/).filter(Boolean);
        nums.forEach((n) => handleAddNumber(n));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Si escribe 2 dígitos continuos directamente, agregar automáticamente
    const onlyDigits = val.replace(/\D/g, '');
    if (onlyDigits.length === 2) {
      handleAddNumber(onlyDigits);
    } else {
      setQuickInput(val);
    }
  };

  // Generar combinaciones matemáticas únicas
  const generatedCombinations = useMemo(() => {
    if (numbersList.length < minRequiredNumbers) {
      return [];
    }
    const k = mode === 'TRIPLETA' ? 3 : 2;
    return getCombinations(numbersList, k);
  }, [numbersList, minRequiredNumbers, mode]);

  // Lista de jugadas finales a registrar según sorteos seleccionados
  const finalPlaysToRegister = useMemo<GeneratedLigarPlay[]>(() => {
    if (generatedCombinations.length === 0 || amountPerCombo <= 0) {
      return [];
    }

    const lotMap = new Map(lotteries.map((l) => [l.id, l]));

    if (mode === 'SUPER_PALE') {
      if (!superLot1 || !superLot2 || superLot1 === superLot2) {
        return [];
      }
      const l1 = lotMap.get(superLot1);
      const l2 = lotMap.get(superLot2);
      if (!l1 || !l2) return [];

      return generatedCombinations.map((combo) => ({
        playType: 'SUPER_PALE',
        numbers: combo,
        amount: amountPerCombo,
        lotteryId: superLot1,
        lotteryName: l1.name,
        lottery2Id: superLot2,
        lottery2Name: l2.name,
      }));
    }

    // Modo PALE o TRIPLETA regular (multiplicado por cada lotería elegida)
    if (targetLotteryIds.length === 0) {
      return [];
    }

    const plays: GeneratedLigarPlay[] = [];
    for (const lotId of targetLotteryIds) {
      const lot = lotMap.get(lotId);
      if (!lot) continue;

      for (const combo of generatedCombinations) {
        plays.push({
          playType: mode === 'TRIPLETA' ? 'TRIPLETA' : 'PALE',
          numbers: combo,
          amount: amountPerCombo,
          lotteryId: lotId,
          lotteryName: lot.name,
        });
      }
    }

    return plays;
  }, [generatedCombinations, amountPerCombo, mode, superLot1, superLot2, targetLotteryIds, lotteries]);

  // Costo total de todas las jugadas generadas
  const totalCost = useMemo(() => {
    return finalPlaysToRegister.reduce((sum, p) => sum + p.amount, 0);
  }, [finalPlaysToRegister]);

  // Confirmar y enviar jugadas al ticket de venta
  const handleConfirm = () => {
    if (numbersList.length < minRequiredNumbers) {
      setErrorMsg(
        `Debe seleccionar al menos ${minRequiredNumbers} números para ligar en modo ${
          mode === 'TRIPLETA' ? 'Tripleta' : 'Palé'
        }.`
      );
      return;
    }

    if (amountPerCombo <= 0) {
      setErrorMsg('El valor de la apuesta debe ser mayor a RD$ 0.');
      return;
    }

    if (mode === 'SUPER_PALE') {
      if (!superLot1 || !superLot2 || superLot1 === superLot2) {
        setErrorMsg('Para Súper Palé debe seleccionar 2 loterías diferentes.');
        return;
      }
    } else {
      if (targetLotteryIds.length === 0) {
        setErrorMsg('Seleccione al menos una lotería para registrar las jugadas.');
        return;
      }
    }

    if (finalPlaysToRegister.length === 0) {
      setErrorMsg('No se generaron combinaciones válidas.');
      return;
    }

    if (onPlayTone) onPlayTone(1250, 0.09);
    onConfirmLigarPlays(finalPlaysToRegister, {
      replaceBasketPlays: basketPlays.length > 0 ? replaceBasketQuinielas : false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            HEADER DEL MODAL LIGAR
            ======================================================== */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-black text-xl shadow-xs">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Función LIGAR
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  Combinatoria Automática
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium">
                Combina quinielas en Palé, Tripleta o Súper Palé con monto personalizable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            SELECTOR DE MODO (3 OPCIONES)
            ======================================================== */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
            {/* Opción 1: Ligar Palé */}
            <button
              type="button"
              onClick={() => {
                setMode('PALE');
                setErrorMsg(null);
                if (onPlayTone) onPlayTone(900, 0.04);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'PALE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ligar Palé</span>
              <span className="text-[10px] opacity-75 font-normal sm:ml-1">(2 en 2)</span>
            </button>

            {/* Opción 2: Ligar Tripleta */}
            <button
              type="button"
              onClick={() => {
                setMode('TRIPLETA');
                setErrorMsg(null);
                if (onPlayTone) onPlayTone(950, 0.04);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'TRIPLETA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ligar Tripleta</span>
              <span className="text-[10px] opacity-75 font-normal sm:ml-1">(3 en 3)</span>
            </button>

            {/* Opción 3: Ligar Súper Palé */}
            <button
              type="button"
              onClick={() => {
                setMode('SUPER_PALE');
                setErrorMsg(null);
                if (onPlayTone) onPlayTone(1050, 0.04);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'SUPER_PALE'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Ligar Súper Palé</span>
              <span className="text-[10px] opacity-75 font-normal sm:ml-1">(2 Loterías)</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CUERPO SCROLLABLE DEL MODAL
            ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Mensaje de error / advertencia */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-600 p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* SECCIÓN 1: NÚMEROS A LIGAR */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Números a Ligar ({numbersList.length} seleccionados)</span>
                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-cyan-400 lowercase">
                  (mínimo {minRequiredNumbers})
                </span>
              </label>

              {numbersList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNumbersList([]);
                    if (onPlayTone) onPlayTone(500, 0.04);
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {/* Aviso y píldoras si hay números provenientes de las jugadas del ticket */}
            {basketNumbers.length > 0 && (
              <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-800 dark:text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <span>Números detectados en las jugadas del Ticket ({basketNumbers.length}):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNumbersList((prev) => Array.from(new Set([...prev, ...basketNumbers])));
                      if (onPlayTone) onPlayTone(1100, 0.04);
                    }}
                    className="text-[10px] font-black uppercase text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    + Agregar Todos
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {basketNumbers.map((bn) => {
                    const isIncluded = numbersList.includes(bn);
                    return (
                      <button
                        key={bn}
                        type="button"
                        onClick={() => {
                          if (isIncluded) {
                            handleRemoveNumber(bn);
                          } else {
                            handleAddNumber(bn);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                          isIncluded
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-300 border-blue-300 dark:border-blue-800 hover:border-blue-500'
                        }`}
                      >
                        {isIncluded ? `✓ ${bn}` : `+ ${bn}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags / Bolos visuales de los números seleccionados */}
            <div className="flex items-center gap-2 flex-wrap min-h-[46px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {numbersList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No hay números agregados. Escriba dígitos abajo para ligar (ej: 05, 10, 23, 33).
                </span>
              ) : (
                numbersList.map((num) => (
                  <span
                    key={num}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-cyan-300 font-mono font-black text-sm shadow-2xs group"
                  >
                    <span>{num}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNumber(num)}
                      className="p-0.5 rounded-full hover:bg-rose-500 hover:text-white text-slate-400 transition-colors ml-0.5 cursor-pointer"
                      title={`Eliminar número ${num}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Input para agregar números rápidamente */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={4}
                  value={quickInput}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Escriba número (ej: 05, 10) y presione Enter o espacio..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (quickInput.trim()) {
                    handleAddNumber(quickInput.trim());
                  }
                }}
                disabled={!quickInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Botones de números populares para ligar de forma instantánea */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="font-semibold text-slate-400">Ejemplos rápidos:</span>
              {['05', '10', '23', '33', '14', '77'].map((exampleNum) => (
                <button
                  key={exampleNum}
                  type="button"
                  onClick={() => handleAddNumber(exampleNum)}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                    numbersList.includes(exampleNum)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  +{exampleNum}
                </button>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: APUESTA POR COMBINACIÓN */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                2. Apuesta por Combinación (RD$)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Valor oficial: RD$ 2 (editable)
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  RD$
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountPerCombo || ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setAmountPerCombo(isNaN(v) ? 0 : Math.max(1, v));
                  }}
                  className="w-full pl-11 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-base font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botones rápidos de montos */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[2, 5, 10, 20, 25, 50].map((presetAmt) => (
                  <button
                    key={presetAmt}
                    type="button"
                    onClick={() => {
                      setAmountPerCombo(presetAmt);
                      if (onPlayTone) onPlayTone(850, 0.03);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${
                      amountPerCombo === presetAmt
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    RD${presetAmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SELECCIÓN DE LOTERÍAS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              3. Sorteos Oficiales
            </label>

            {mode === 'SUPER_PALE' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                    Primera Lotería (Cruza A)
                  </label>
                  <select
                    value={superLot1}
                    onChange={(e) => setSuperLot1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccione 1ra Lotería...</option>
                    {availableLotteries.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.id === superLot2}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">
                    Segunda Lotería (Cruza B)
                  </label>
                  <select
                    value={superLot2}
                    onChange={(e) => setSuperLot2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccione 2da Lotería...</option>
                    {availableLotteries.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.id === superLot1}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-1.5 text-[11px]">
                  <span className="text-slate-500">
                    Sorteos abiertos ({targetLotteryIds.length} seleccionados):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetLotteryIds(availableLotteries.map((l) => l.id))}
                      className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Todos abiertos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setTargetLotteryIds([])}
                      className="font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto pr-1">
                  {availableLotteries.map((l) => {
                    const isSelected = targetLotteryIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setTargetLotteryIds((prev) =>
                            prev.includes(l.id) ? prev.filter((id) => id !== l.id) : [...prev, l.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 4: VISTA PREVIA EN VIVO DE COMBINACIONES */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Vista Previa de Combinaciones
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {generatedCombinations.length} combinaciones únicas generadas
                  </p>
                </div>
              </div>

              {/* Cálculo del Total */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a Pagar</span>
                <span className="font-mono text-base font-black text-emerald-400">
                  RD$ {totalCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Listado de combinaciones generadas */}
            {generatedCombinations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium">
                {numbersList.length < minRequiredNumbers ? (
                  <span>
                    Seleccione al menos {minRequiredNumbers} números de quiniela para generar las
                    combinaciones automáticamente.
                  </span>
                ) : (
                  <span>No hay combinaciones para mostrar.</span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {generatedCombinations.map((combo, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-1 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500">#{index + 1}</span>
                      <span className="font-mono font-black text-white tracking-wider">
                        {combo.join('-')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">
                      RD${amountPerCombo}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Resumen de cálculo matemático */}
            {generatedCombinations.length > 0 && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <span>
                  Fórmula:{' '}
                  <strong className="text-slate-200">
                    {generatedCombinations.length} combinaciones
                  </strong>{' '}
                  {mode !== 'SUPER_PALE' && targetLotteryIds.length > 1 && (
                    <span>× {targetLotteryIds.length} sorteos</span>
                  )}{' '}
                  × <strong className="text-emerald-400">RD${amountPerCombo}</strong> ={' '}
                  <strong className="text-emerald-400 font-mono">RD${totalCost}</strong>
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                  Sin combinaciones duplicadas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            FOOTER CON BOTONES DE CONFIRMACIÓN Y CANCELACIÓN
            ======================================================== */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {basketPlays.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Se conservan las {basketPlays.length} jugada(s) del ticket y se suman las ligadas
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none hover:text-slate-700 dark:hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={replaceBasketQuinielas}
                    onChange={(e) => setReplaceBasketQuinielas(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 rounded-sm"
                  />
                  <span>Reemplazar en vez de sumar</span>
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={finalPlaysToRegister.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {finalPlaysToRegister.length > 0
                ? `Confirmar e Insertar al Ticket (${finalPlaysToRegister.length} jugadas - RD$ ${totalCost})`
                : 'Seleccione números para ligar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
