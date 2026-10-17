import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../services/api';
import { Lottery, PlayType, Ticket, User, TerminalCreditStatus } from '../../types/index';
import {
  Printer,
  Trash2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Menu,
  Clock,
  X,
  Settings,
  ArrowRight,
  ArrowLeft,
  Monitor,
  Smartphone,
  Dices,
  Shuffle,
  ShoppingBag,
  ChevronUp,
  CheckCircle2,
  Zap,
  Search,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  CreditCard,
  LogOut,
  Package,
} from 'lucide-react';
import { ThermalTicketModal } from './ThermalTicketModal';
import { SmartBetCapture } from './SmartBetCapture';
import { SettingsView } from '../terminal/SettingsView';
import { RecargasModal } from './RecargasModal';
import { ProductosModal } from './ProductosModal';
import {
  getLotteryScheduleStatus,
  getLotteriesClosingSoon,
  validateBasketPlaysOpen,
  isPlayLotteryClosed,
  LotteryScheduleStatus,
} from '../../utils/lotterySchedule';
import { isLotteryBlockedBy5MinRule } from '../../utils/lotteryScheduleMiddleware';
import { LotteryScheduleAlertBanner } from './LotteryScheduleAlertBanner';
import { printerService } from '../../services/printerService';
import { RecentTicketsSliderWidget } from './RecentTicketsSliderWidget';
import { getPresetLogoForLottery } from '../../utils/lotteryLogos';

interface PosViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
  posLayout?: 'mobile' | 'desktop';
  onTogglePosLayout?: (layout: 'mobile' | 'desktop') => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  initialPlayType?: PlayType;
  initialLotteryId?: string;
  onLogout?: () => void;
  externalLotteries?: Lottery[];
  hideDuplicateHeader?: boolean;
}

interface PendingPlay {
  tempId: string;
  lotteryId: string;
  lotteryName: string;
  lottery2Id?: string;
  lottery2Name?: string;
  playType: PlayType;
  numbers: string[];
  amount: number;
}

// Hardware Vibration Haptic Helper (Supported on Android touch POS, smartphones, and tablets)
const triggerHardwareHaptic = (pattern: number | number[] = 18) => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration unsupported or muted
  }
};

// Subtle Tactile Audio Feedback using Web Audio API
const playTapTone = (freq = 850, duration = 0.04) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio unsupported or muted
  }
};

const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.12);
    });
  } catch {
    // silent
  }
};

const playWarningChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [587.33, 440];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.15);
    });
  } catch {
    // silent
  }
};

export const PosView: React.FC<PosViewProps> = ({
  user,
  onNavigateTab,
  posLayout: externalLayout,
  onTogglePosLayout,
  isFullScreen,
  onToggleFullScreen,
  initialPlayType,
  initialLotteryId,
  onLogout,
  externalLotteries,
  hideDuplicateHeader = false,
}) => {
  // Layout mode: 'mobile' (touch-first) or 'desktop' (full screen counter)
  const [internalMode, setInternalMode] = useState<'mobile' | 'desktop'>(() => {
    const saved = localStorage.getItem('bancapro_pos_layout');
    if (saved === 'desktop' || saved === 'mobile') return saved;
    return typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'desktop' : 'mobile';
  });

  const posMode = externalLayout || internalMode;

  const handleSetPosMode = (mode: 'mobile' | 'desktop') => {
    setInternalMode(mode);
    localStorage.setItem('bancapro_pos_layout', mode);
    if (onTogglePosLayout) {
      onTogglePosLayout(mode);
    }
  };

  // Lotteries
  const [lotteries, setLotteries] = useState<Lottery[]>(externalLotteries || []);
  const [selectedLotteryIds, setSelectedLotteryIds] = useState<string[]>(
    initialLotteryId ? [initialLotteryId] : []
  );

  useEffect(() => {
    if (externalLotteries && externalLotteries.length > 0) {
      setLotteries(externalLotteries);
    }
  }, [externalLotteries]);

  // Unified Super Palé & lottery cross mode
  const [superPaleActive, setSuperPaleActive] = useState<boolean>(initialPlayType === 'SUPER_PALE');
  const [superPaleLotteries, setSuperPaleLotteries] = useState<[string, string]>(['', '']);

  // Basket & Floating Cart State
  const [pendingPlays, setPendingPlays] = useState<PendingPlay[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Bottom Sheets & Modals
  const [showSorteosSheet, setShowSorteosSheet] = useState<boolean>(false);
  const [showDrawerMenu, setShowDrawerMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showRecargasModal, setShowRecargasModal] = useState<boolean>(false);
  const [showProductosModal, setShowProductosModal] = useState<boolean>(false);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);

  // Status & Audio
  const [liveTime, setLiveTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [printerConnected, setPrinterConnected] = useState<boolean>(true);
  const [lotterySearch, setLotterySearch] = useState<string>('');

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [topeWarning, setTopeWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Terminal Credit Limit & Real-time Sales Risk Monitoring
  const [creditStatus, setCreditStatus] = useState<TerminalCreditStatus | null>(null);

  // Haptic-like visual feedback tracking state (instantaneous key highlight / ripple)
  const [lastTappedKey, setLastTappedKey] = useState<string | null>(null);

  // Trigger sensory feedback (both audio tone and visual/hardware haptic animation)
  const activateSensoryHaptic = (keyId: string, freq = 850, vibrationMs: number | number[] = 18) => {
    setLastTappedKey(keyId);
    if (soundEnabled) playTapTone(freq);
    triggerHardwareHaptic(vibrationMs);

    setTimeout(() => {
      setLastTappedKey((prev) => (prev === keyId ? null : prev));
    }, 160);
  };

  // Digital live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch lotteries and credit status on mount
  useEffect(() => {
    const loadLotteries = async () => {
      try {
        const data = await api.getLotteries();
        setLotteries(data);
        const openList = data.filter((l) => getLotteryScheduleStatus(l).isOpen);
        if (openList.length > 0 && selectedLotteryIds.length === 0) {
          setSelectedLotteryIds([openList[0].id]);
        }
        if (openList.length >= 2) {
          setSuperPaleLotteries([openList[0].id, openList[1].id]);
        }
      } catch (err) {
        console.error('Error cargando loterías:', err);
      }
    };
    loadLotteries();
    loadCreditStatus();
    // Poll API periodically to sync live lottery schedules and credit status
    const interval = setInterval(() => {
      loadLotteries();
      loadCreditStatus();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadCreditStatus = async () => {
    try {
      const termCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
      const status = await api.getTerminalCreditStatus(termCode);
      setCreditStatus(status);
    } catch (err) {
      console.error('Error cargando estado de crédito de la terminal:', err);
    }
  };

  // Fetch printer connection
  useEffect(() => {
    printerService
      .getConfig(user.terminalCode || '1001')
      .then((cfg) => setPrinterConnected(cfg.printerConnected))
      .catch(console.error);
  }, [user.terminalCode, showSettingsModal]);

  // If a selected lottery closes, update selection safely
  useEffect(() => {
    if (selectedLotteryIds.length === 0 || lotteries.length === 0) return;
    const lotMap = new Map(lotteries.map((l) => [l.id, l]));
    const stillOpen = selectedLotteryIds.filter((id) => {
      const lot = lotMap.get(id);
      return lot ? getLotteryScheduleStatus(lot).isOpen : false;
    });

    if (stillOpen.length !== selectedLotteryIds.length) {
      setSelectedLotteryIds(stillOpen);
    }
  }, [liveTime, lotteries, selectedLotteryIds]);

  // Dynamic detection of lotteries closing in 5 minutes or less
  const closingSoonLotteries = useMemo(() => {
    return getLotteriesClosingSoon(lotteries, new Date());
  }, [lotteries, liveTime]);

  // Sound & haptic alert when a lottery enters the 5-minute closing window
  const prevClosingSoonIdsRef = useRef<string[]>([]);
  useEffect(() => {
    const currentIds = closingSoonLotteries.map((c: { lottery: Lottery; status: LotteryScheduleStatus }) => c.lottery.id);
    const newlyEntering = currentIds.filter((id: string) => !prevClosingSoonIdsRef.current.includes(id));
    if (newlyEntering.length > 0 && soundEnabled) {
      playWarningChime();
      activateSensoryHaptic('closing-soon-alert', 650, [25, 40, 25]);
    }
    prevClosingSoonIdsRef.current = currentIds;
  }, [closingSoonLotteries, soundEnabled]);

  // Remove plays whose lottery has closed dynamically
  const handleRemoveClosedPlays = () => {
    const now = new Date();
    const lotMap = new Map(lotteries.map((l) => [l.id, l]));
    setPendingPlays((prev) =>
      prev.filter((p) => {
        const lot1 = lotMap.get(p.lotteryId);
        const lot2 = p.lottery2Id ? lotMap.get(p.lottery2Id) : null;
        const s1 = lot1 ? getLotteryScheduleStatus(lot1, now) : null;
        const s2 = lot2 ? getLotteryScheduleStatus(lot2, now) : null;
        return (s1?.isOpen ?? false) && (p.lottery2Id ? (s2?.isOpen ?? false) : true);
      })
    );
    setErrorMessage(null);
    showToast('Jugadas de sorteos cerrados eliminadas.');
  };

  // Dynamically detect closed plays in basket
  const closedPlaysInBasket = useMemo(() => {
    if (pendingPlays.length === 0) return [];
    const now = new Date();
    return pendingPlays.filter((p) => isPlayLotteryClosed(p, lotteries, now).isClosed);
  }, [pendingPlays, lotteries, liveTime]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2200);
  };

  const addPlayToBasket = async (
    type: PlayType,
    numbers: string[],
    amount: number,
    options?: { lotteryId?: string; lottery2Id?: string }
  ) => {
    const lotMap = new Map(lotteries.map((l) => [l.id, l]));

    try {
      if (type === 'SUPER_PALE' || superPaleActive) {
        const l1Id = options?.lotteryId || superPaleLotteries[0] || (selectedLotteryIds.length >= 2 ? selectedLotteryIds[0] : '');
        const l2Id = options?.lottery2Id || superPaleLotteries[1] || (selectedLotteryIds.length >= 2 ? selectedLotteryIds[1] : '');

        if (!l1Id || !l2Id || l1Id === l2Id) {
          setErrorMessage('Para jugar Súper Palé seleccione exactamente 2 sorteos en el panel superior.');
          setShowSorteosSheet(true);
          return;
        }

        const lot1 = lotMap.get(l1Id);
        const lot2 = lotMap.get(l2Id);
        if (!lot1 || !lot2) {
          setErrorMessage('Uno de los sorteos seleccionados no está disponible.');
          return;
        }

        const check1 = isLotteryBlockedBy5MinRule(lot1, new Date());
        const check2 = isLotteryBlockedBy5MinRule(lot2, new Date());
        if (check1.isBlocked || check2.isBlocked) {
          const blockedInfo = check1.isBlocked ? check1.info : check2.info;
          setErrorMessage(blockedInfo.reason);
          playWarningChime();
          return;
        }

        // Check topes
        for (const num of numbers) {
          const check = await api.checkTope({
            lotteryId: lot1.id,
            number: num,
            playType: 'SUPER_PALE',
            requestedAmount: amount,
            terminalId: user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001'),
          });
          if (!check.allowed) {
            setTopeWarning(check.reason || `Tope alcanzado para el número ${num} en Súper Palé.`);
            return;
          }
        }

        const newPlay: PendingPlay = {
          tempId: `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          lotteryId: lot1.id,
          lotteryName: lot1.name,
          lottery2Id: lot2.id,
          lottery2Name: lot2.name,
          playType: 'SUPER_PALE',
          numbers,
          amount,
        };

        activateSensoryHaptic('add-success', 1280, [15, 30]);
        setPendingPlays((prev) => [...prev, newPlay]);
        showToast(`⚡ Súper Palé: ${numbers.join('-')} (RD$${amount})`);
      } else {
        if (selectedLotteryIds.length === 0) {
          setErrorMessage('Seleccione al menos un sorteo activo.');
          setShowSorteosSheet(true);
          return;
        }

        // Dynamic validation: check open status, 5-minute pre-closing guard & topes
        for (const lotId of selectedLotteryIds) {
          const lot = lotMap.get(lotId);
          if (!lot) {
            setErrorMessage('Sorteo no disponible.');
            playWarningChime();
            return;
          }
          const check = isLotteryBlockedBy5MinRule(lot, new Date());
          if (check.isBlocked) {
            setErrorMessage(check.info.reason);
            playWarningChime();
            return;
          }

          for (const num of numbers) {
            const check = await api.checkTope({
              lotteryId: lot.id,
              number: num,
              playType: type,
              requestedAmount: amount,
              terminalId: user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001'),
            });
            if (!check.allowed) {
              setTopeWarning(check.reason || `Tope alcanzado para ${num} en ${lot.name}.`);
              return;
            }
          }
        }

        const newBatch: PendingPlay[] = selectedLotteryIds.map((lId) => {
          const lot = lotMap.get(lId);
          return {
            tempId: `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${lId}`,
            lotteryId: lId,
            lotteryName: lot?.name || 'Lotería',
            playType: type,
            numbers,
            amount,
          };
        });

        activateSensoryHaptic('add-success', 1200, [15, 30]);
        setPendingPlays((prev) => [...prev, ...newBatch]);
        showToast(`✓ Agregado: ${numbers.join('-')} en ${newBatch.length} sorteo(s)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error validando la jugada.');
    }
  };

  // Remove play from basket
  const handleRemovePlay = (tempId: string) => {
    activateSensoryHaptic('trash', 450, 20);
    setPendingPlays((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  // Clear entire basket
  const handleClearBasket = () => {
    activateSensoryHaptic('clear-basket', 400, 30);
    setPendingPlays([]);
    showToast('Canasta limpiada');
  };

  // Impresión Rápida directa al formato 58mm para el último ticket vendido
  const handleQuickPrintLastTicket = async () => {
    if (!lastTicket) {
      setErrorMessage('No hay ticket reciente para imprimir.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    activateSensoryHaptic('quick-print', 1100, 25);
    const res = await printerService.directThermalPrint58mm(lastTicket, user.terminalCode || user.username || '1001');
    setSuccessToast(`⚡ Ticket #${lastTicket.ticketNumber} impreso directamente en 58mm (${res.printerName}).`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Commit and sell ticket (supports direct 58mm quick print without intermediate dialogs)
  const handleCommitSale = async (directQuickPrint58mm = false) => {
    if (pendingPlays.length === 0) {
      setErrorMessage('La canasta de jugadas está vacía.');
      return;
    }

    // Risk control: Pre-check terminal credit limit and available balance
    if (creditStatus && creditStatus.creditLimit > 0) {
      const currentBasketTotal = pendingPlays.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (currentBasketTotal > creditStatus.availableCredit) {
        setErrorMessage(
          `⚠️ Límite de crédito diario excedido en la terminal #${creditStatus.terminalCode}. Saldo disponible: RD$${creditStatus.availableCredit.toLocaleString()} | Total requerido: RD$${currentBasketTotal.toLocaleString()}. Venta bloqueada por control de riesgo.`
        );
        playWarningChime();
        return;
      }
    }

    // Dynamic validation of closing time for all plays in basket
    const basketCheck = validateBasketPlaysOpen(pendingPlays, lotteries, new Date());
    if (!basketCheck.valid) {
      const closedNames = basketCheck.closedLotteryNames.join(', ');
      setErrorMessage(
        `⚠️ Venta bloqueada: La lotería (${closedNames}) ha cerrado su horario de ventas. Retire las jugadas cerradas de la canasta para continuar.`
      );
      playWarningChime();
      return;
    }

    // 5-minute pre-closing guard validation across basket plays
    const nowSale = new Date();
    const lotMapSale = new Map(lotteries.map((l) => [l.id, l]));
    for (const p of pendingPlays) {
      const lot1 = lotMapSale.get(p.lotteryId);
      const lot2 = p.lottery2Id ? lotMapSale.get(p.lottery2Id) : null;
      if (lot1) {
        const c1 = isLotteryBlockedBy5MinRule(lot1, nowSale);
        if (c1.isBlocked) {
          setErrorMessage(`⚠️ Venta bloqueada: ${c1.info.reason} Retire las jugadas afectadas para continuar.`);
          playWarningChime();
          return;
        }
      }
      if (lot2) {
        const c2 = isLotteryBlockedBy5MinRule(lot2, nowSale);
        if (c2.isBlocked) {
          setErrorMessage(`⚠️ Venta bloqueada: ${c2.info.reason} Retire las jugadas afectadas para continuar.`);
          playWarningChime();
          return;
        }
      }
    }

    setSubmitting(true);
    setErrorMessage(null);
    setTopeWarning(null);

    try {
      const playsToSend = pendingPlays.map((p) => ({
        lotteryId: p.lotteryId,
        lottery2Id: p.lottery2Id,
        playType: p.playType,
        numbers: p.numbers,
        amount: p.amount,
      }));

      const effectiveTerminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
      const ticket = await api.sellTicket({
        plays: playsToSend,
        terminalCode: effectiveTerminalCode,
      });

      if (soundEnabled) playSuccessChime();
      triggerHardwareHaptic([20, 50, 40, 50, 90]);

      setLastTicket(ticket);
      setPendingPlays([]);
      setIsCartOpen(false);
      loadCreditStatus();
      window.dispatchEvent(new CustomEvent('bancapro:ticket-created', { detail: ticket }));

      if (directQuickPrint58mm) {
        // Dispara la función de impresión térmica directa 58mm detectando USB/Bluetooth
        setShowPrintModal(false);
        const res = await printerService.directThermalPrint58mm(ticket, user.terminalCode || user.username || '1001');
        setSuccessToast(`⚡ Ticket #${ticket.ticketNumber} vendido e impreso en 58mm (${res.printerName}).`);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setShowPrintModal(true);

        // Auto-print check
        try {
          const termCode = user.terminalCode || user.username || '1001';
          const pConfig = await printerService.getConfig(termCode);
          if (pConfig.autoPrintOnSale && pConfig.printerConnected) {
            await printerService.directThermalPrint58mm(ticket, termCode);
          }
        } catch (printErr) {
          console.warn('Auto print aviso:', printErr);
        }
      }
    } catch (err: any) {
      activateSensoryHaptic('sale-error', 350, [40, 50, 40]);
      setErrorMessage(err.message || 'Error registrando la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Atajos de Teclado POS (F10: Impresión Rápida directa en formato 58mm, F9: Venta Estándar)
  useEffect(() => {
    const handlePosKeyDown = (e: KeyboardEvent) => {
      if (posMode === 'desktop') return; // DesktopPosView tiene sus propios atajos

      // F10: Impresión Rápida directa 58mm sin diálogos intermedios
      if (e.key === 'F10') {
        e.preventDefault();
        if (pendingPlays.length > 0) {
          handleCommitSale(true);
        } else if (lastTicket) {
          handleQuickPrintLastTicket();
        }
      }

      // F9: Confirmar y vender ticket (flujo estándar)
      if (e.key === 'F9') {
        e.preventDefault();
        if (pendingPlays.length > 0) {
          handleCommitSale(false);
        }
      }
    };

    window.addEventListener('keydown', handlePosKeyDown);
    return () => window.removeEventListener('keydown', handlePosKeyDown);
  }, [posMode, pendingPlays, lastTicket, submitting, soundEnabled, user]);

  // Filter and sort lotteries for the bottom sheet: closing soon first, then open, then closed
  const sortedLotteriesForSheet = useMemo(() => {
    return [...lotteries].sort((a, b) => {
      const sa = getLotteryScheduleStatus(a, new Date());
      const sb = getLotteryScheduleStatus(b, new Date());
      if (sa.isClosingSoon && !sb.isClosingSoon) return -1;
      if (!sa.isClosingSoon && sb.isClosingSoon) return 1;
      if (sa.isOpen && !sb.isOpen) return -1;
      if (!sa.isOpen && sb.isOpen) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [lotteries, liveTime]);

  const openLotteries = lotteries.filter((l: Lottery) => getLotteryScheduleStatus(l, new Date()).isOpen);
  const filteredSheetLotteries = sortedLotteriesForSheet.filter((l: Lottery) =>
    l.name.toLowerCase().includes(lotterySearch.toLowerCase()) ||
    l.code.toLowerCase().includes(lotterySearch.toLowerCase())
  );

  // Total amount in basket
  const basketTotal = pendingPlays.reduce((sum, p) => sum + p.amount, 0);

  // Credit limit risk validation for current basket
  const isCreditExceeded = Boolean(
    creditStatus &&
    creditStatus.creditLimit > 0 &&
    basketTotal > creditStatus.availableCredit
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 dark:from-[#050b14] dark:via-[#091122] dark:to-[#0c182e] p-2 sm:p-4 flex flex-col items-center justify-start font-sans select-none animate-in fade-in duration-300">
      {/* ========================================================
          MOBILE CONTAINER (Responsive Clean Betting Layout)
          ======================================================== */}
      <div className="w-full max-w-[460px] bg-white/85 dark:bg-[#0c1628]/90 backdrop-blur-xl rounded-[28px] shadow-xl shadow-blue-500/5 border border-slate-200/80 dark:border-slate-800/80 flex flex-col min-h-[92dvh] relative overflow-hidden pb-28">
        {/* ========================================================
            1. TOP BAR (Glassmorphism & High-Hit Target Header)
            ======================================================== */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          {/* Left: Terminal Monogram, Back button & Clock */}
          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  activateSensoryHaptic('back-dash', 700, 15);
                  onNavigateTab('dashboard');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer shadow-2xs"
                title="Volver al Dashboard Principal"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-sm shadow-blue-500/30 shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-blue-600 dark:text-cyan-400 text-xs">
                ⚡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {liveTime || '12:00:00 PM'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                {user.terminalCode || user.username} · {user.name}
              </p>
            </div>
          </div>

          {/* Center: Live Terminal Credit Status */}
          {creditStatus && creditStatus.creditLimit > 0 && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 font-mono text-[10px] shadow-2xs"
              title={`Límite de Crédito: RD$${creditStatus.creditLimit.toLocaleString()} | Ventas hoy: RD$${creditStatus.currentSalesToday.toLocaleString()}`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Disponible</span>
                <span
                  className={`font-black ${
                    creditStatus.riskLevel === 'EXCEEDED'
                      ? 'text-rose-600 dark:text-rose-400'
                      : creditStatus.riskLevel === 'HIGH'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  RD${creditStatus.availableCredit.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Right Action Icons with Touch Target Hitboxes >= 44x44px */}
          <div className="flex items-center gap-1.5">
            {/* Sound toggle button */}
            <button
              type="button"
              onClick={() => {
                activateSensoryHaptic('sound-toggle', 800, 15);
                setSoundEnabled(!soundEnabled);
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 active:brightness-125 transition-all"
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonido'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-500" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Printer status & settings button */}
            <button
              type="button"
              onClick={() => {
                activateSensoryHaptic('printer-btn', 750, 15);
                setShowSettingsModal(true);
              }}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 active:brightness-125 transition-all"
              title="Ajustes de Impresora"
            >
              <Printer className="w-5 h-5" />
              <span
                className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  printerConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </button>

            {/* Botón rápido de Recargas */}
            <button
              type="button"
              onClick={() => {
                activateSensoryHaptic('recargas-btn', 820, 15);
                setShowRecargasModal(true);
              }}
              className="min-w-[40px] min-h-[40px] px-2 flex items-center justify-center gap-1 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 font-black text-xs border border-blue-200 dark:border-blue-800 shadow-2xs active:scale-95 transition-all"
              title="Vender Recargas Telefónicas"
            >
              <Smartphone className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">Recargas</span>
            </button>

            {/* Botón rápido de Productos */}
            <button
              type="button"
              onClick={() => {
                activateSensoryHaptic('productos-btn', 820, 15);
                setShowProductosModal(true);
              }}
              className="min-w-[40px] min-h-[40px] px-2 flex items-center justify-center gap-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800 shadow-2xs active:scale-95 transition-all"
              title="Vender Productos & Pines"
            >
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">Productos</span>
            </button>

            {/* Drawer menu button */}
            <button
              type="button"
              onClick={() => {
                activateSensoryHaptic('menu-btn', 700, 15);
                setShowDrawerMenu(true);
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 active:brightness-125 transition-all"
              title="Menú"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Notifications / Error Banner */}
        {errorMessage && (
          <div className="mx-3 mt-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(errorMessage.includes('Sesión') || errorMessage.includes('conectar') || errorMessage.includes('servidor') || errorMessage.includes('401')) && (
                <button
                  onClick={async () => {
                    try {
                      setErrorMessage(null);
                      const termUser = user.username || user.terminalCode || '1001';
                      const pass = user.role === 'SUPER_ADMIN' ? 'super123' : user.role === 'ADMIN' ? 'admin123' : '1234';
                      await api.login(termUser, pass, '123D123400');
                      setSuccessToast('Sesión restablecida. Procesando ticket...');
                      setTimeout(() => {
                        handleCommitSale();
                      }, 400);
                    } catch {
                      window.dispatchEvent(new CustomEvent('bancapro:session-expired'));
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-xs transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reconectar</span>
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-rose-500 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {topeWarning && (
          <div className="mx-3 mt-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span className="leading-tight">{topeWarning}</span>
          </div>
        )}

        {successToast && (
          <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successToast}</span>
          </div>
        )}

        {/* ========================================================
            2-5. CAPTURA INTELIGENTE DE APUESTAS (Único Input Inteligente y Estado Unificado)
            ======================================================== */}
        <div className="p-2 sm:p-3 shrink-0">
          <SmartBetCapture
            lotteries={lotteries}
            selectedLotteryIds={selectedLotteryIds}
            onSelectLotteryIds={setSelectedLotteryIds}
            isSuperPaleMode={superPaleActive}
            onToggleSuperPaleMode={(active) => {
              setSuperPaleActive(active);
              if (active && (!superPaleLotteries[0] || !superPaleLotteries[1])) {
                const openList = lotteries.filter((l) => getLotteryScheduleStatus(l).isOpen);
                if (openList.length >= 2) {
                  setSuperPaleLotteries([openList[0].id, openList[1].id]);
                } else {
                  setShowSorteosSheet(true);
                }
              }
            }}
            superPaleLotteries={superPaleLotteries}
            onSelectSuperPaleLotteries={(lot1, lot2) => setSuperPaleLotteries([lot1, lot2])}
            onAddPlay={addPlayToBasket}
            onAddMultiplePlays={async (batchPlays, options) => {
              const newPlays: PendingPlay[] = batchPlays.map((bp) => {
                const lot1 = lotteries.find((l) => l.id === bp.lotteryId);
                const lot2 = bp.lottery2Id ? lotteries.find((l) => l.id === bp.lottery2Id) : undefined;
                return {
                  tempId: `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  lotteryId: bp.lotteryId || (selectedLotteryIds[0] || ''),
                  lotteryName: lot1?.name || 'Lotería',
                  lottery2Id: bp.lottery2Id,
                  lottery2Name: lot2?.name,
                  playType: bp.playType,
                  numbers: bp.numbers,
                  amount: bp.amount,
                };
              });
              activateSensoryHaptic('add-success', 1250, [20, 35]);
              if (options?.replaceBasketPlays) {
                setPendingPlays((prev) => {
                  const filtered = prev.filter((p) => p.playType !== 'QUINIELA');
                  return [...filtered, ...newPlays];
                });
              } else {
                setPendingPlays((prev) => [...prev, ...newPlays]);
              }
              const totalAmt = newPlays.reduce((sum, p) => sum + p.amount, 0);
              showToast(`⚡ ¡Ligar exitoso! ${newPlays.length} jugadas ligadas en el ticket (RD$${totalAmt})`);
            }}
            pendingPlays={pendingPlays}
            user={user}
            soundEnabled={soundEnabled}
            onPlayTone={playTapTone}
            onHaptic={triggerHardwareHaptic}
            onOpenSorteosModal={() => setShowSorteosSheet(true)}
            onOpenRecargas={() => {
              activateSensoryHaptic('recargas-smart', 820, 15);
              setShowRecargasModal(true);
            }}
            onOpenProductos={() => {
              activateSensoryHaptic('productos-smart', 820, 15);
              setShowProductosModal(true);
            }}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            topeWarning={topeWarning}
            layoutVariant="mobile"
          />
        </div>

        {/* ========================================================
            TICKET EN VIVO (Visible directamente en pantalla si hay jugadas)
            ======================================================== */}
        {pendingPlays.length > 0 && (
          <div className="mx-2 sm:mx-3 my-2 p-3 rounded-2xl bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-black pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Ticket en Curso ({pendingPlays.length} jugada{pendingPlays.length !== 1 ? 's' : ''})</span>
              </span>
              <button
                type="button"
                onClick={handleClearBasket}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                Vaciar
              </button>
            </div>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {pendingPlays.map((p) => (
                <div
                  key={p.tempId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-cyan-300 shrink-0">
                      {p.playType}
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                      {p.numbers.join('-')}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      ({p.lotteryName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      RD$ {p.amount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlay(p.tempId)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      title="Eliminar jugada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            6. BARRA INFERIOR DE COBRO E IMPRESIÓN DIRECTA
            ======================================================== */}
        <div className="fixed sm:absolute bottom-3 left-3 right-3 z-30">
          <div className="w-full min-h-[64px] p-3 sm:px-4 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {pendingPlays.length === 0 ? 'Ticket Vacío' : `${pendingPlays.length} jugada(s) agregadas`}
              </span>
              <span className="font-mono text-xl font-black text-emerald-400 tabular-nums">
                RD$ {basketTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {pendingPlays.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleCommitSale(false)}
                  disabled={submitting || isCreditExceeded}
                  className={`min-h-[46px] px-5 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                    isCreditExceeded
                      ? 'bg-rose-600 border-rose-800'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>{submitting ? 'Emitiendo...' : 'IMPRIMIR TICKET'}</span>
                </button>
              ) : lastTicket ? (
                <button
                  type="button"
                  onClick={handleQuickPrintLastTicket}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reimprimir último ticket vendido"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reimprimir #{lastTicket.ticketNumber}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* ========================================================
            7. BOTTOM SHEET: FLOATING CART DETAILS
            ======================================================== */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end transition-opacity animate-in fade-in duration-200">
            <div className="flex-1" onClick={() => setIsCartOpen(false)} />

            <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#0c1628] rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Grab handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

              {/* Sheet Header */}
              <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Canasta de Jugadas
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {pendingPlays.length} jugada(s) pendientes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pendingPlays.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearBasket}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-black active:scale-95 transition-all"
                    >
                      Vaciar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Plays List with High-Hit Delete Buttons */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
                {/* Warning if closed plays in basket */}
                {closedPlaysInBasket.length > 0 && (
                  <div className="p-3 mb-2 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>⚠️ {closedPlaysInBasket.length} jugada(s) de sorteos cerrados</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveClosedPlays}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-xl shadow-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover cerradas</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      El horario de ventas finalizó para uno o más sorteos. Elimine las jugadas cerradas para procesar la venta.
                    </p>
                  </div>
                )}

                {pendingPlays.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                      No hay jugadas en el ticket todavía
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Escriba los números y el monto y presione "+ AGREGAR JUGADA".
                    </p>
                  </div>
                ) : (
                  pendingPlays.map((p) => {
                    const playCheck = isPlayLotteryClosed(p, lotteries, new Date());
                    const isClosed = playCheck.isClosed;

                    return (
                      <div
                        key={p.tempId}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs ${
                          isClosed
                            ? 'bg-rose-500/10 border-rose-500/60 dark:bg-rose-950/30 ring-1 ring-rose-500/40'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                                isClosed
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-cyan-400'
                              }`}
                            >
                              {isClosed ? 'SORTEO CERRADO' : p.playType.replace('_', ' ')}
                            </span>
                            <span
                              className={`text-xs font-bold truncate ${
                                isClosed
                                  ? 'text-rose-700 dark:text-rose-300 line-through'
                                  : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {p.lotteryName} {p.lottery2Name ? `+ ${p.lottery2Name}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {p.numbers.map((num, i) => (
                              <span
                                key={i}
                                className={`w-9 h-9 rounded-full font-mono font-black text-sm flex items-center justify-center shadow-xs ${
                                  isClosed
                                    ? 'bg-rose-700 text-white opacity-70'
                                    : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                                }`}
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-mono text-base font-black tabular-nums ${
                              isClosed
                                ? 'text-rose-600 dark:text-rose-400 line-through'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            RD${p.amount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePlay(p.tempId)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl active:scale-90 transition-all"
                            title="Eliminar jugada"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sheet Checkout Footer */}
              <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400">
                    Total a Cobrar:
                  </span>
                  <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    RD$ {basketTotal.toLocaleString()}
                  </span>
                </div>

                {/* Credit Limit Exceeded Risk Warning Banner */}
                {isCreditExceeded && creditStatus && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <span className="block font-black">Límite de Crédito Insuficiente</span>
                      <span className="text-[11px] font-normal block mt-0.5">
                        Saldo disponible para ventas: <strong>RD${creditStatus.availableCredit.toLocaleString()}</strong>.
                        Total de este ticket: <strong>RD${basketTotal.toLocaleString()}</strong>.
                        Reduzca jugadas o contacte al administrador para aumentar el límite de crédito.
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {/* Botón de Impresión Rápida Directa en 58mm (omitiendo diálogos) */}
                  <button
                    type="button"
                    onClick={() => handleCommitSale(true)}
                    disabled={pendingPlays.length === 0 || submitting || closedPlaysInBasket.length > 0 || isCreditExceeded}
                    className="w-full min-h-[52px] py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-1 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    title="Vender e imprimir directamente al formato de 58mm predefinido en CSS, omitiendo diálogos intermedios"
                  >
                    <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
                    <span>
                      {closedPlaysInBasket.length > 0
                        ? '⚠️ REMOVER CERRADAS PARA VENDER'
                        : isCreditExceeded
                        ? '⛔ CRÉDITO INSUFICIENTE PARA VENTA'
                        : '⚡ IMPRESIÓN RÁPIDA (58MM DIRECTO) [F10]'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCommitSale(false)}
                    disabled={pendingPlays.length === 0 || submitting || closedPlaysInBasket.length > 0 || isCreditExceeded}
                    className={`w-full min-h-[50px] py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-md border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      closedPlaysInBasket.length > 0 || isCreditExceeded
                        ? 'bg-rose-600 border-b-rose-800'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 border-b-emerald-800'
                    }`}
                  >
                    <Printer className="w-5 h-5" />
                    <span>
                      {submitting
                        ? 'PROCESANDO VENTA...'
                        : closedPlaysInBasket.length > 0
                        ? '⚠️ REMOVER CERRADAS PARA CONTINUAR'
                        : isCreditExceeded
                        ? '⛔ LÍMITE DE CRÉDITO EXCEDIDO'
                        : 'CONFIRMAR Y VENDER TICKET [F9]'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            8. BOTTOM SHEET: SORTEOS PICKER & SÚPER PALÉ CONFIG
            ======================================================== */}
        {showSorteosSheet && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end transition-opacity animate-in fade-in duration-200">
            <div className="flex-1" onClick={() => setShowSorteosSheet(false)} />

            <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#0c1628] rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Grab handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

              {/* Sheet Header */}
              <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Sorteos Disponibles
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {openLotteries.length} sorteo(s) abiertos hoy
                  </p>
                </div>

                {/* Súper Palé Toggle Switch */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Súper Palé
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !superPaleActive;
                      setSuperPaleActive(next);
                      activateSensoryHaptic('toggle-super', 900, 20);
                    }}
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
                      superPaleActive ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        superPaleActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Search & Batch Actions */}
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar sorteo..."
                    value={lotterySearch}
                    onChange={(e) => setLotterySearch(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                {!superPaleActive && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        activateSensoryHaptic('select-all-lots', 850, 15);
                        setSelectedLotteryIds(openLotteries.map((l) => l.id));
                      }}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 text-xs font-black shrink-0 active:scale-95 transition-transform"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        activateSensoryHaptic('clear-lots', 500, 15);
                        setSelectedLotteryIds([]);
                      }}
                      className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-black shrink-0 active:scale-95 transition-transform"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>

              {/* Súper Palé Helper */}
              {superPaleActive && (
                <div className="mx-5 my-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Seleccione exactamente 2 sorteos para jugar Súper Palé cruzado.</span>
                </div>
              )}

              {/* Sorteos List with Enhanced Touch Targets */}
              <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
                {filteredSheetLotteries.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No hay sorteos abiertos que coincidan
                    </p>
                  </div>
                ) : (
                  filteredSheetLotteries.map((lot: Lottery) => {
                    const isSelected = selectedLotteryIds.includes(lot.id);
                    const sched = getLotteryScheduleStatus(lot);

                    return (
                      <div
                        key={lot.id}
                        onClick={() => {
                          if (!sched.isOpen) {
                            activateSensoryHaptic('error', 380, 25);
                            showToast(`⚠️ "${lot.name}" cerró ventas a las ${sched.formattedCloseTime}.`);
                            return;
                          }
                          activateSensoryHaptic(`lot-${lot.id}`, 900, 20);
                          if (superPaleActive) {
                            if (selectedLotteryIds.length === 2 && !isSelected) {
                              setSelectedLotteryIds([selectedLotteryIds[1], lot.id]);
                            } else if (isSelected) {
                              setSelectedLotteryIds(selectedLotteryIds.filter((id) => id !== lot.id));
                            } else {
                              setSelectedLotteryIds([...selectedLotteryIds, lot.id]);
                            }
                          } else {
                            setSelectedLotteryIds((prev) =>
                              prev.includes(lot.id) ? prev.filter((id) => id !== lot.id) : [...prev, lot.id]
                            );
                          }
                        }}
                        className={`min-h-[58px] p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 border-b-2 active:border-b-0 active:translate-y-0.5 active:scale-[0.98] ${
                          !sched.isOpen
                            ? 'opacity-40 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed border-b-slate-300'
                            : isSelected
                            ? superPaleActive
                              ? 'bg-purple-500/15 border-purple-500 text-purple-900 dark:text-purple-100 shadow-xs border-b-purple-700'
                              : 'bg-blue-500/15 border-blue-500 text-blue-900 dark:text-cyan-100 shadow-xs ring-1 ring-blue-500/30 border-b-blue-700'
                            : sched.isClosingSoon
                            ? 'bg-amber-500/15 border-amber-500/60 dark:bg-amber-950/30 border-b-amber-600 ring-2 ring-amber-500/30'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {(() => {
                            const logoSrc = lot.logoUrl || getPresetLogoForLottery(lot.name) || (lot.code ? getPresetLogoForLottery(lot.code) : undefined);
                            return logoSrc ? (
                              <img
                                src={logoSrc}
                                alt={lot.name}
                                className="w-7 h-7 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: lot.color || '#2563EB' }}
                              />
                            );
                          })()}
                          <div className="truncate">
                            <span className="text-xs sm:text-sm font-extrabold uppercase text-slate-900 dark:text-white block truncate">
                              {lot.name}
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-slate-400">
                              Cierre: {sched.formattedCloseTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sched.isClosingSoon && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 border border-amber-600 animate-pulse flex items-center gap-1 shadow-xs">
                              <Clock className="w-3 h-3" />
                              <span>Cierra {sched.formattedCountdown}</span>
                            </span>
                          )}

                          {!sched.isOpen && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              CERRADA
                            </span>
                          )}

                          {sched.isOpen && isSelected && (
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs ${
                                superPaleActive ? 'bg-purple-600' : 'bg-blue-600'
                              }`}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Confirm Bottom Bar */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-500">
                  {selectedLotteryIds.length} sorteo(s) elegido(s)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSorteosSheet(false)}
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            9. HAMBURGER QUICK DRAWER
            ======================================================== */}
        {showDrawerMenu && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
            <div className="flex-1" onClick={() => setShowDrawerMenu(false)} />

            <div className="w-[300px] bg-white dark:bg-[#0c1628] h-full shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/30">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Banca La Express
                      </h4>
                      <p className="text-[10px] text-slate-400">Terminal {user.terminalCode || user.username}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDrawerMenu(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDrawerMenu(false);
                        onNavigateTab('dashboard');
                      }}
                      className="w-full min-h-[48px] text-left px-4 py-3 rounded-2xl text-xs font-black text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-3 border border-slate-200 dark:border-slate-700 active:scale-98 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                      <span>Ir al Dashboard Móvil</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      handleSetPosMode('desktop');
                    }}
                    className="w-full min-h-[48px] text-left px-4 py-3 rounded-2xl text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-500/10 hover:bg-blue-500/20 flex items-center gap-3 border border-blue-500/20 active:scale-98 transition-all"
                  >
                    <Monitor className="w-5 h-5 text-blue-500" />
                    <span>Cambiar a Modo PC Pro</span>
                  </button>

                  {/* Opciones de la Terminal: Recargas, Productos, Cuadre, Números Ganadores, Tikes Ganadores, Reporte */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      setShowRecargasModal(true);
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-blue-700 dark:text-cyan-300 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 flex items-center gap-3 active:scale-98 transition-all border border-blue-200/60 dark:border-blue-900/40"
                  >
                    <Smartphone className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                    <span>Recargas Telefónicas (Claro, Altice, Viva)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      setShowProductosModal(true);
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 flex items-center gap-3 active:scale-98 transition-all border border-emerald-200/60 dark:border-emerald-900/40"
                  >
                    <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Productos, Pines & Servicios</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      onNavigateTab?.('cuadre');
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 active:scale-98 transition-all"
                  >
                    <span className="text-base">📊</span>
                    <span>Mi Cuadre de Caja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      onNavigateTab?.('results');
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 active:scale-98 transition-all"
                  >
                    <span className="text-base">🎱</span>
                    <span>Números Ganadores del Día</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      onNavigateTab?.('winners');
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-3 active:scale-98 transition-all"
                  >
                    <span className="text-base">🏆</span>
                    <span>Tikes Ganadores</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      onNavigateTab?.('reports');
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-3 active:scale-98 transition-all"
                  >
                    <span className="text-base">📈</span>
                    <span>Reporte (Gana o Pierde)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      onNavigateTab?.('lookup');
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 active:scale-98 transition-all"
                  >
                    <span className="text-base">🔍</span>
                    <span>Consultar / Verificar Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDrawerMenu(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 active:scale-98 transition-all"
                  >
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span>Ajustes de Impresora</span>
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDrawerMenu(false);
                        onLogout();
                      }}
                      className="w-full min-h-[46px] text-left px-4 py-2.5 rounded-2xl text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 flex items-center gap-3 active:scale-98 transition-all border border-rose-200 dark:border-rose-900/40 mt-2"
                    >
                      <LogOut className="w-5 h-5 text-rose-500" />
                      <span>Cerrar Sesión</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-400">
                  Cajero: <strong className="text-slate-600 dark:text-slate-300">{user.name}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            10. MODALES: THERMAL TICKET & SETTINGS
            ======================================================== */}
        {showPrintModal && lastTicket && (
          <ThermalTicketModal
            ticket={lastTicket}
            onClose={() => setShowPrintModal(false)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
            <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-50 dark:bg-slate-900 shadow-2xl p-2 sm:p-4 border border-slate-200 dark:border-slate-800">
              <SettingsView
                user={user}
                isModal={true}
                onClose={() => setShowSettingsModal(false)}
              />
            </div>
          </div>
        )}

        {/* Modales de Recargas y Productos */}
        <RecargasModal
          isOpen={showRecargasModal}
          onClose={() => setShowRecargasModal(false)}
          user={user}
        />

        <ProductosModal
          isOpen={showProductosModal}
          onClose={() => setShowProductosModal(false)}
          user={user}
        />
      </div>
    </div>
  );
};
