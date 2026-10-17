import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../services/api';
import { Lottery, PlayType, Ticket, User, TerminalCreditStatus } from '../../types/index';
import {
  Printer,
  Trash2,
  AlertCircle,
  Clock,
  Check,
  X,
  Copy,
  RotateCcw,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Layers,
  Volume2,
  VolumeX,
  History,
  Info,
  DollarSign,
  Smartphone,
  Monitor,
  Zap,
  Dices,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Shuffle,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CreditCard,
  LogOut,
  Calculator,
  Award,
  Trophy,
  BarChart3,
  Settings,
  Package,
} from 'lucide-react';
import { ThermalTicketModal } from './ThermalTicketModal';
import { SmartBetCapture } from './SmartBetCapture';
import { RecargasModal } from './RecargasModal';
import { ProductosModal } from './ProductosModal';
import { getLotteryScheduleStatus, isPlayLotteryClosed } from '../../utils/lotterySchedule';
import { isLotteryBlockedBy5MinRule } from '../../utils/lotteryScheduleMiddleware';
import { LotteryScheduleAlertBanner } from './LotteryScheduleAlertBanner';
import { printerService } from '../../services/printerService';
import { RecentTicketsSliderWidget } from './RecentTicketsSliderWidget';
import { getPresetLogoForLottery } from '../../utils/lotteryLogos';

interface DesktopPosViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
  onSwitchToMobile?: () => void;
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

// Interactive Audio Engine using Web Audio API
const playTone = (freq = 800, duration = 0.07, type: OscillatorType = 'sine') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // audio not supported or muted
  }
};

const playChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.15);
    });
  } catch {
    // muted
  }
};

export const DesktopPosView: React.FC<DesktopPosViewProps> = ({
  user,
  onNavigateTab,
  onSwitchToMobile,
  isFullScreen,
  onToggleFullScreen,
  initialPlayType,
  initialLotteryId,
  onLogout,
  externalLotteries,
  hideDuplicateHeader = false,
}) => {
  // Lotteries Data
  const [lotteries, setLotteries] = useState<Lottery[]>(externalLotteries || []);
  const [selectedLotteryIds, setSelectedLotteryIds] = useState<string[]>(
    initialLotteryId ? [initialLotteryId] : []
  );

  useEffect(() => {
    if (externalLotteries && externalLotteries.length > 0) {
      setLotteries(externalLotteries);
    }
  }, [externalLotteries]);
  const [lotteryFilter, setLotteryFilter] = useState<'TODAS' | 'POPULARES' | 'TARDE' | 'NOCHE' | 'AMERICANAS'>('TODAS');
  const [lotterySearch, setLotterySearch] = useState('');
  const [demoAlwaysOpen, setDemoAlwaysOpen] = useState(false);

  // Super Palé Mode
  const [isSuperPaleMode, setIsSuperPaleMode] = useState<boolean>(initialPlayType === 'SUPER_PALE');
  const [superPaleLot1, setSuperPaleLot1] = useState<string>('');
  const [superPaleLot2, setSuperPaleLot2] = useState<string>('');

  // Live Clock & Sound
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Input states & UI Mode
  const [entryMode, setEntryMode] = useState<'express' | 'visual'>('express');
  const [expressInput, setExpressInput] = useState<string>('');
  const [playType, setPlayType] = useState<PlayType>(initialPlayType || 'QUINIELA');

  // Visual balls input
  const [ball1, setBall1] = useState<string>('');
  const [ball2, setBall2] = useState<string>('');
  const [ball3, setBall3] = useState<string>('');
  const [activeBallIndex, setActiveBallIndex] = useState<1 | 2 | 3>(1);

  // Amount: siempre en 0 por defecto para que el cajero o cajera asigne el monto
  const [amount, setAmount] = useState<string>('0');

  // Plays Basket
  const [pendingPlays, setPendingPlays] = useState<PendingPlay[]>([]);

  // Alerts & Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Terminal Credit Limit & Real-time Sales Risk Monitoring
  const [creditStatus, setCreditStatus] = useState<TerminalCreditStatus | null>(null);

  // Ticket & Modals
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showRecentModal, setShowRecentModal] = useState<boolean>(false);
  const [showRecargasModal, setShowRecargasModal] = useState<boolean>(false);
  const [showProductosModal, setShowProductosModal] = useState<boolean>(false);

  // Input References
  const expressInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Live digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch lotteries and recent tickets
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getLotteries();
        setLotteries(data);

        // Pre-select first open lottery if none selected
        const openLots = data.filter((l) => getLotteryStatus(l).isOpen);
        if (openLots.length > 0 && selectedLotteryIds.length === 0) {
          setSelectedLotteryIds([openLots[0].id]);
        }
      } catch (err) {
        console.error('Error cargando loterías:', err);
      }
    };
    loadData();
    loadRecentTickets();
    loadCreditStatus();
    const interval = setInterval(() => {
      loadData();
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

  const loadRecentTickets = async () => {
    try {
      const tickets = await api.getTickets();
      if (tickets && Array.isArray(tickets)) {
        const myTickets = tickets
          .filter((t) => t.userId === user.id || t.terminalCode === (user.terminalCode || user.username))
          .slice(-10)
          .reverse();
        setRecentTickets(myTickets);
        if (myTickets.length > 0 && !lastTicket) {
          setLastTicket(myTickets[0]);
        }
      }
    } catch (err) {
      console.error('Error cargando tickets recientes:', err);
    }
  };

  // Focus management
  useEffect(() => {
    if (showPrintModal || showRecentModal) return;
    if (entryMode === 'express') {
      expressInputRef.current?.focus();
    }
  }, [entryMode, showPrintModal, showRecentModal]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPrintModal || showRecentModal) return;

      // F9 or Ctrl+Enter: Print / Sell
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        handleCommitTicket(false);
        return;
      }

      // F10: Impresión Rápida directa 58mm (sin diálogos intermedios)
      if (e.key === 'F10') {
        e.preventDefault();
        handleCommitTicket(true);
        return;
      }

      // F2: Clear basket
      if (e.key === 'F2') {
        e.preventDefault();
        handleClearPlays();
        return;
      }

      // F4: Repeat last ticket
      if (e.key === 'F4') {
        e.preventDefault();
        handleRepeatLastTicket();
        return;
      }

      // F8: Invert numbers (Virao)
      if (e.key === 'F8') {
        e.preventDefault();
        handleInvertNumbers();
        return;
      }

      // F6: Abrir Mi Cuadre
      if (e.key === 'F6') {
        e.preventDefault();
        onNavigateTab?.('cuadre');
        return;
      }

      // F7: Abrir Números Ganadores / Resultados
      if (e.key === 'F7') {
        e.preventDefault();
        onNavigateTab?.('results');
        return;
      }

      // F9: Abrir Recargas Telefónicas
      if (e.key === 'F9') {
        e.preventDefault();
        setShowRecargasModal(true);
        return;
      }

      // F10: Abrir Productos & Servicios
      if (e.key === 'F10') {
        e.preventDefault();
        setShowProductosModal(true);
        return;
      }

      // F11: Pantalla Completa Toggle
      if (e.key === 'F11') {
        e.preventDefault();
        if (onToggleFullScreen) onToggleFullScreen();
        return;
      }

      // Escape: Salir de Pantalla Completa si está activa
      if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
        if (onToggleFullScreen) onToggleFullScreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate lottery schedule status
  const getLotteryStatus = (lot: Lottery) => {
    if (demoAlwaysOpen) {
      return {
        isOpen: true,
        isClosed: false,
        isClosingSoon: false,
        closingInMinutes: 999,
        closingInSeconds: 99999,
        formattedCountdown: '99:99',
        status: 'ABIERTA' as const,
        statusLabel: '🟢 ABIERTA',
        text: 'Abierta (Modo Demo)',
        color: 'text-emerald-500',
        formattedCloseTime: lot.closeTime || '11:59 PM',
      };
    }
    const sched = getLotteryScheduleStatus(lot);
    return {
      isOpen: sched.isOpen,
      isClosed: sched.isClosed,
      isClosingSoon: sched.isClosingSoon,
      closingInMinutes: sched.closingInMinutes,
      closingInSeconds: sched.closingInSeconds,
      formattedCountdown: sched.formattedCountdown,
      status: sched.status,
      statusLabel: sched.statusLabel,
      text: sched.isOpen
        ? sched.remainingText
        : sched.status === 'DESACTIVADA'
        ? 'Desactivada'
        : `Cerró (${sched.formattedCloseTime})`,
      color: sched.badgeTextColor,
      formattedCloseTime: sched.formattedCloseTime,
    };
  };

  // If a selected lottery closes dynamically, auto-deselect it and notify cashier
  useEffect(() => {
    if (demoAlwaysOpen || selectedLotteryIds.length === 0 || lotteries.length === 0) return;
    const lotMap = new Map(lotteries.map((l) => [l.id, l]));
    const closedSelected: Lottery[] = [];
    const openSelected: string[] = [];

    for (const id of selectedLotteryIds) {
      const lot = lotMap.get(id);
      if (lot) {
        const s = getLotteryScheduleStatus(lot);
        if (s.isOpen) {
          openSelected.push(id);
        } else {
          closedSelected.push(lot);
        }
      }
    }

    if (closedSelected.length > 0) {
      setSelectedLotteryIds(openSelected);
      setErrorMessage(
        `🔴 Horario cerrado: ${closedSelected.map((l) => l.name).join(', ')} ha cerrado ventas (${closedSelected[0].closeTime || closedSelected[0].drawTime}). Deseleccionada automáticamente.`
      );
    }
  }, [currentTimeStr, lotteries, selectedLotteryIds, demoAlwaysOpen]);

  // Dynamically detect closed plays in basket
  const closedPlaysInBasket = useMemo(() => {
    if (demoAlwaysOpen || pendingPlays.length === 0) return [];
    const now = new Date();
    return pendingPlays.filter((p) => isPlayLotteryClosed(p, lotteries, now).isClosed);
  }, [pendingPlays, lotteries, currentTimeStr, demoAlwaysOpen]);

  // Dynamically evaluate credit limit risk for current ticket
  const isCreditExceeded = useMemo(() => {
    if (!creditStatus || creditStatus.creditLimit <= 0) return false;
    const currentTicketTotal = pendingPlays.reduce((sum, p) => sum + (p.amount || 0), 0);
    return currentTicketTotal > creditStatus.availableCredit;
  }, [creditStatus, pendingPlays]);

  // Remove plays whose lottery has closed dynamically
  const handleRemoveClosedPlays = () => {
    if (pendingPlays.length === 0) return;
    const now = new Date();
    const remaining = pendingPlays.filter((p) => !isPlayLotteryClosed(p, lotteries, now).isClosed);
    const removedCount = pendingPlays.length - remaining.length;
    setPendingPlays(remaining);
    if (soundEnabled) playTone(500, 0.08);
    setSuccessMessage(`✓ Se removieron ${removedCount} jugada(s) de sorteos cerrados de la canasta.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Toggle lottery selection
  const handleToggleLottery = (lotteryId: string) => {
    if (soundEnabled) playTone(900, 0.04);

    const lot = lotteries.find((l) => l.id === lotteryId);
    if (!lot) return;

    if (!demoAlwaysOpen) {
      const st = getLotteryScheduleStatus(lot);
      if (!st.isOpen) {
        setErrorMessage(`La lotería "${lot.name}" ya cerró su horario de ventas (${st.formattedCloseTime}). No se pueden registrar jugadas.`);
        return;
      }
    }

    if (isSuperPaleMode) {
      if (!superPaleLot1 || (superPaleLot1 && superPaleLot2)) {
        setSuperPaleLot1(lotteryId);
        setSuperPaleLot2('');
      } else if (superPaleLot1 === lotteryId) {
        setSuperPaleLot1('');
      } else {
        setSuperPaleLot2(lotteryId);
      }
      return;
    }

    setSelectedLotteryIds((prev) =>
      prev.includes(lotteryId) ? prev.filter((id) => id !== lotteryId) : [...prev, lotteryId]
    );
  };

  const handleSelectAllLotteries = () => {
    if (soundEnabled) playTone(1100, 0.05);
    const openIds = lotteries.filter((l) => getLotteryStatus(l).isOpen).map((l) => l.id);
    setSelectedLotteryIds(openIds);
  };

  const handleClearLotteries = () => {
    if (soundEnabled) playTone(600, 0.05);
    setSelectedLotteryIds([]);
  };

  // Toggle Super Pale
  const handleToggleSuperPale = () => {
    if (soundEnabled) playTone(1000, 0.06);
    const nextMode = !isSuperPaleMode;
    setIsSuperPaleMode(nextMode);
    if (nextMode) {
      setPlayType('SUPER_PALE');
    } else {
      setPlayType('QUINIELA');
    }
    setErrorMessage(null);
  };

  // Virao (invert last 2-digit play)
  const handleInvertNumbers = () => {
    if (pendingPlays.length === 0) return;
    const last = pendingPlays[pendingPlays.length - 1];
    if (last.numbers.length === 2) {
      const inverted = [last.numbers[1], last.numbers[0]];
      addPlayToBasket(last.playType, inverted, last.amount);
      if (soundEnabled) playTone(1200, 0.08);
      setSuccessMessage(`¡Virao agregado! ${inverted.join('-')} por RD$${last.amount}`);
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  // Random Lucky Play generator
  const handleLuckyNumbers = () => {
    const amt = parseInt(amount || '0', 10);
    if (amt <= 0) {
      setErrorMessage('Por favor asigne primero el monto para generar la jugada rápida.');
      return;
    }
    if (soundEnabled) playTone(1300, 0.08);
    const rand2 = () => String(Math.floor(Math.random() * 100)).padStart(2, '0');
    if (playType === 'QUINIELA') {
      const n1 = rand2();
      setExpressInput(`${n1}*${amount}`);
      addPlayToBasket('QUINIELA', [n1], amt);
    } else if (playType === 'PALE' || playType === 'SUPER_PALE') {
      const n1 = rand2();
      let n2 = rand2();
      while (n2 === n1) n2 = rand2();
      setExpressInput(`${n1}-${n2}*${amount}`);
      addPlayToBasket(playType, [n1, n2], amt);
    } else if (playType === 'TRIPLETA') {
      const n1 = rand2();
      let n2 = rand2();
      let n3 = rand2();
      while (n2 === n1) n2 = rand2();
      while (n3 === n1 || n3 === n2) n3 = rand2();
      setExpressInput(`${n1}-${n2}-${n3}*${amount}`);
      addPlayToBasket('TRIPLETA', [n1, n2, n3], amt);
    }
  };

  // Parse Express Notation (e.g. "25*50", "12-45*100", "12 45 100", "01-02-03*25", "25=100")
  const handleAddExpressPlay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const raw = expressInput.trim();
    if (!raw) return;

    let numbersStr = '';
    let amountVal = 0;

    if (raw.includes('*') || raw.includes('=') || raw.toLowerCase().includes('x')) {
      const parts = raw.split(/[*=xX]/);
      numbersStr = parts[0].trim();
      amountVal = parseInt(parts[1]?.replace(/\D/g, '') || '0', 10);
    } else {
      numbersStr = raw;
      amountVal = parseInt(amount || '0', 10);
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMessage('⚠️ Debe asignar el monto de la jugada (el monto actual está en RD$ 0). Ingrese ej. 25*50 o asigne el monto.');
      return;
    }

    const cleaned = numbersStr.replace(/[^0-9]/g, ' ');
    const parts = cleaned.split(/\s+/).filter(Boolean);

    let numbers: string[] = [];
    if (parts.length === 1 && parts[0].length % 2 === 0 && parts[0].length >= 2) {
      for (let i = 0; i < parts[0].length; i += 2) {
        numbers.push(parts[0].substring(i, i + 2));
      }
    } else {
      numbers = parts.map((p) => p.padStart(2, '0').slice(-2));
    }

    if (numbers.length === 0) {
      setErrorMessage('Formato de números no válido. Ejemplos: 25*50, 12-45*100, 01-02-03*25');
      return;
    }

    let detectedType: PlayType = playType;
    if (isSuperPaleMode) {
      detectedType = 'SUPER_PALE';
    } else if (numbers.length === 1) {
      detectedType = 'QUINIELA';
    } else if (numbers.length === 2) {
      detectedType = 'PALE';
    } else if (numbers.length >= 3) {
      detectedType = 'TRIPLETA';
      numbers = numbers.slice(0, 3);
    }

    addPlayToBasket(detectedType, numbers, amountVal);
    setExpressInput('');
    setAmount('0');
    expressInputRef.current?.focus();
  };

  // Add play to basket
  const addPlayToBasket = (type: PlayType, numbers: string[], amt: number) => {
    if (amt <= 0) {
      setErrorMessage('El monto de la jugada debe ser mayor a RD$ 0.');
      return;
    }

    if (isSuperPaleMode || type === 'SUPER_PALE') {
      if (!superPaleLot1 || !superPaleLot2) {
        setErrorMessage('Para jugar Súper Palé debe seleccionar 2 loterías.');
        return;
      }
      if (numbers.length !== 2) {
        setErrorMessage('El Súper Palé requiere exactamente 2 números.');
        return;
      }

      const l1 = lotteries.find((l) => l.id === superPaleLot1);
      const l2 = lotteries.find((l) => l.id === superPaleLot2);
      if (!l1 || !l2) {
        setErrorMessage('Uno de los sorteos seleccionados para Súper Palé no está disponible.');
        return;
      }

      if (!demoAlwaysOpen) {
        const check1 = isLotteryBlockedBy5MinRule(l1, new Date());
        const check2 = isLotteryBlockedBy5MinRule(l2, new Date());
        if (check1.isBlocked || check2.isBlocked) {
          const reason = check1.isBlocked ? check1.info.reason : check2.info.reason;
          setErrorMessage(reason);
          return;
        }
      }

      const newPlay: PendingPlay = {
        tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        lotteryId: superPaleLot1,
        lotteryName: l1?.name || 'Lotería 1',
        lottery2Id: superPaleLot2,
        lottery2Name: l2?.name || 'Lotería 2',
        playType: 'SUPER_PALE',
        numbers,
        amount: amt,
      };

      if (soundEnabled) playTone(1200, 0.08);
      setPendingPlays((prev) => [...prev, newPlay]);
      setAmount('0');
      setSuccessMessage(`⚡ Súper Palé: ${numbers.join('-')} por RD$${amt}`);
      setTimeout(() => setSuccessMessage(null), 2500);
      return;
    }

    if (selectedLotteryIds.length === 0) {
      setErrorMessage('Seleccione al menos un sorteo en el panel izquierdo.');
      return;
    }

    // Verify open status and 5-minute pre-closing guard
    if (!demoAlwaysOpen) {
      for (const lId of selectedLotteryIds) {
        const lot = lotteries.find((l) => l.id === lId);
        if (!lot) {
          setErrorMessage('Sorteo no disponible.');
          return;
        }
        const check = isLotteryBlockedBy5MinRule(lot, new Date());
        if (check.isBlocked) {
          setErrorMessage(check.info.reason);
          return;
        }
      }
    }

    const newItems: PendingPlay[] = selectedLotteryIds.map((lId) => {
      const lot = lotteries.find((l) => l.id === lId);
      return {
        tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${lId}`,
        lotteryId: lId,
        lotteryName: lot?.name || 'Lotería',
        playType: type,
        numbers,
        amount: amt,
      };
    });

    if (soundEnabled) playTone(1100, 0.08);
    setPendingPlays((prev) => [...prev, ...newItems]);
    setAmount('0');
    setSuccessMessage(`✓ Agregado: ${numbers.join('-')} en ${newItems.length} sorteo(s)`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Remove single play
  const handleRemovePlay = (tempId: string) => {
    if (soundEnabled) playTone(450, 0.05);
    setPendingPlays((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  // Clear all plays (F2)
  const handleClearPlays = () => {
    if (pendingPlays.length === 0) return;
    if (soundEnabled) playTone(400, 0.1);
    setPendingPlays([]);
    setErrorMessage(null);
    setSuccessMessage('Canasta limpiada');
    setTimeout(() => setSuccessMessage(null), 1500);
  };

  // Repeat last ticket (F4)
  const handleRepeatLastTicket = () => {
    if (!lastTicket || !lastTicket.plays || lastTicket.plays.length === 0) {
      setErrorMessage('No hay ticket previo registrado para repetir.');
      return;
    }
    if (soundEnabled) playTone(1300, 0.08);
    const regenerated: PendingPlay[] = lastTicket.plays.map((p) => ({
      tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lotteryId: p.lotteryId,
      lotteryName: p.lotteryName,
      lottery2Id: p.lottery2Id,
      lottery2Name: p.lottery2Name,
      playType: p.playType,
      numbers: [...p.numbers],
      amount: p.amount,
    }));

    setPendingPlays(regenerated);
    setSuccessMessage(`✓ Copiadas ${regenerated.length} jugadas del Ticket #${lastTicket.ticketNumber}`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Confirm and sell ticket (F9 / F10 Quick Print)
  const handleCommitTicket = async (directQuickPrint58mm = false) => {
    if (pendingPlays.length === 0) {
      setErrorMessage('No hay jugadas en el ticket para imprimir.');
      return;
    }

    // Risk control: Pre-check terminal credit limit and available balance
    if (creditStatus && creditStatus.creditLimit > 0) {
      const ticketTotal = pendingPlays.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (ticketTotal > creditStatus.availableCredit) {
        setErrorMessage(
          `⚠️ Límite de crédito diario excedido en la terminal #${creditStatus.terminalCode}. Saldo disponible: RD$${creditStatus.availableCredit.toLocaleString()} | Total requerido: RD$${ticketTotal.toLocaleString()}. Venta bloqueada por control de riesgo.`
        );
        return;
      }
    }

    if (!demoAlwaysOpen) {
      const lotMap = new Map(lotteries.map((l) => [l.id, l]));
      for (const p of pendingPlays) {
        const lot1 = lotMap.get(p.lotteryId);
        if (!lot1) {
          setErrorMessage('Una lotería del ticket ya no está disponible.');
          return;
        }
        const check1 = isLotteryBlockedBy5MinRule(lot1, new Date());
        if (check1.isBlocked) {
          setErrorMessage(`⚠️ Venta bloqueada: ${check1.info.reason}`);
          return;
        }

        if (p.playType === 'SUPER_PALE') {
          const lot2 = p.lottery2Id ? lotMap.get(p.lottery2Id) : undefined;
          if (!lot2) {
            setErrorMessage('La segunda lotería del Súper Palé no está disponible.');
            return;
          }
          const check2 = isLotteryBlockedBy5MinRule(lot2, new Date());
          if (check2.isBlocked) {
            setErrorMessage(`⚠️ Venta bloqueada para Súper Palé: ${check2.info.reason}`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payloadPlays = pendingPlays.map((p) => ({
        lotteryId: p.lotteryId,
        lottery2Id: p.lottery2Id,
        playType: p.playType,
        numbers: p.numbers,
        amount: p.amount,
      }));

      const effectiveTerminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
      const createdTicket = await api.sellTicket({
        plays: payloadPlays,
        terminalCode: effectiveTerminalCode,
      });

      if (soundEnabled) playChime();

      setLastTicket(createdTicket);
      setPendingPlays([]);
      loadRecentTickets();
      loadCreditStatus();
      window.dispatchEvent(new CustomEvent('bancapro:ticket-created', { detail: createdTicket }));

      if (directQuickPrint58mm) {
        // Direct 58mm thermal print detecting USB/Bluetooth and auto-formatting
        const printRes = await printerService.directThermalPrint58mm(createdTicket, user.terminalCode || user.username || '1001');
        setSuccessMessage(`⚡ Ticket #${createdTicket.ticketNumber} vendido e impreso en 58mm (${printRes.printerName}).`);
        setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setShowPrintModal(true);

        // Optional thermal printer auto-print
        try {
          const termCode = user.terminalCode || user.username || '1001';
          const pConfig = await printerService.getConfig(termCode);
          if (pConfig.autoPrintOnSale && pConfig.printerConnected) {
            await printerService.directThermalPrint58mm(createdTicket, termCode);
          }
        } catch (printErr) {
          console.warn('Auto print notice:', printErr);
        }
      }
    } catch (err: any) {
      console.error('Error procesando venta:', err);
      setErrorMessage(err.message || 'Error procesando la venta del ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter lotteries by category and search
  const filteredLotteries = lotteries.filter((lot) => {
    const matchesSearch =
      lot.name.toLowerCase().includes(lotterySearch.toLowerCase()) ||
      lot.code.toLowerCase().includes(lotterySearch.toLowerCase());
    if (!matchesSearch) return false;

    if (lotteryFilter === 'TODAS') return true;
    if (lotteryFilter === 'POPULARES') {
      const pop = ['lot-real', 'lot-ganamas', 'lot-leidsa', 'lot-nacional', 'lot-loteka', 'lot-ny-dia', 'lot-ny-noche'];
      return pop.includes(lot.id);
    }
    if (lotteryFilter === 'TARDE') {
      return (
        lot.name.toLowerCase().includes('tarde') ||
        lot.name.toLowerCase().includes('dia') ||
        lot.name.toLowerCase().includes('12:') ||
        lot.name.toLowerCase().includes('1:') ||
        lot.name.toLowerCase().includes('2:') ||
        lot.name.toLowerCase().includes('real') ||
        lot.name.toLowerCase().includes('gana')
      );
    }
    if (lotteryFilter === 'NOCHE') {
      return (
        lot.name.toLowerCase().includes('noche') ||
        lot.name.toLowerCase().includes('leidsa') ||
        lot.name.toLowerCase().includes('loteka') ||
        lot.name.toLowerCase().includes('suerte noche') ||
        lot.name.toLowerCase().includes('8:') ||
        lot.name.toLowerCase().includes('7:')
      );
    }
    if (lotteryFilter === 'AMERICANAS') {
      return (
        lot.name.toLowerCase().includes('new york') ||
        lot.name.toLowerCase().includes('ny') ||
        lot.name.toLowerCase().includes('florida') ||
        lot.name.toLowerCase().includes('georgia')
      );
    }
    return true;
  });

  const totalAmount = pendingPlays.reduce((sum, p) => sum + p.amount, 0);

  // Quick game modes configuration
  const gameModes: { type: PlayType; label: string; mult: string; icon: string; badgeColor: string }[] = [
    { type: 'QUINIELA', label: 'Quiniela', mult: 'x60', icon: '🎱', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { type: 'PALE', label: 'Palé', mult: 'x1,000', icon: '🎲', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { type: 'TRIPLETA', label: 'Tripleta', mult: 'x20,000', icon: '💎', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { type: 'SUPER_PALE', label: 'Súper Palé', mult: 'x3,000', icon: '⚡', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  ];

  return (
    <div className="flex flex-col gap-3 font-sans pb-12 animate-in fade-in duration-300">
      {/* ========================================================
          1. TOP BAR COMPACTA O COMPLETA
          ======================================================== */}
      {hideDuplicateHeader ? (
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-extrabold text-slate-900 dark:text-white">
                Terminal {user.terminalCode || user.username}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold">
              {selectedLotteryIds.length} sorteo(s) en ticket
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real-time Terminal Credit Limit & Available Balance */}
            {creditStatus && creditStatus.creditLimit > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                title="Límite y crédito disponible para ventas"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Disp:</span>
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
            )}

            {/* Botón Recargas */}
            <button
              type="button"
              onClick={() => setShowRecargasModal(true)}
              className="px-2.5 py-1 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-cyan-300 border-blue-200 dark:border-blue-800 shadow-2xs hover:bg-blue-100 cursor-pointer active:scale-95"
              title="Vender Recargas Telefónicas Claro, Altice, Viva (F9)"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Recargas</span>
              <span className="text-[9px] font-mono opacity-60">F9</span>
            </button>

            {/* Botón Productos */}
            <button
              type="button"
              onClick={() => setShowProductosModal(true)}
              className="px-2.5 py-1 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs hover:bg-emerald-100 cursor-pointer active:scale-95"
              title="Vender Productos, Pines Digitales y Servicios (F10)"
            >
              <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Productos</span>
              <span className="text-[9px] font-mono opacity-60">F10</span>
            </button>

            {/* Test 24/7 Switch */}
            <button
              onClick={() => setDemoAlwaysOpen(!demoAlwaysOpen)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                demoAlwaysOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
              title="Activa todos los sorteos sin restricción de horario para pruebas"
            >
              <Sparkles className="w-3 h-3" />
              <span>{demoAlwaysOpen ? 'Modo 24/7' : 'Sorteos 24/7'}</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-xl text-xs font-medium border transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-400 dark:border-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm backdrop-blur-md">
          {/* Left: Terminal status & Cashier */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/25 shrink-0">
              <div className="w-full h-full bg-white dark:bg-[#070d18] rounded-[10px] flex items-center justify-center font-black text-blue-600 dark:text-cyan-400 text-base">
                ⚡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  Terminal {user.terminalCode || user.username}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> EN LÍNEA
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/25">
                  <Monitor className="w-3 h-3" /> VERSIÓN PC {isFullScreen ? '· PANTALLA COMPLETA' : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cajero: <strong className="text-slate-700 dark:text-slate-200">{user.name}</strong> · Banca La Express
              </p>
            </div>
          </div>

          {/* Center: Live Digital Clock, Credit Status Widget & Demo Switch */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
              <span>{currentTimeStr || '12:00:00 PM'}</span>
            </div>

            {/* Real-time Terminal Credit Limit & Available Balance */}
            {creditStatus && creditStatus.creditLimit > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs" title="Límite de crédito configurado y saldo disponible en tiempo real">
                <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Límite:</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      RD${creditStatus.creditLimit.toLocaleString()}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Disp:</span>
                    <span className={`text-xs font-mono font-black ${
                      creditStatus.riskLevel === 'EXCEEDED' ? 'text-rose-600 dark:text-rose-400' :
                      creditStatus.riskLevel === 'HIGH' ? 'text-amber-600 dark:text-amber-400' :
                      'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      RD${creditStatus.availableCredit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        creditStatus.riskLevel === 'EXCEEDED' ? 'bg-rose-600' :
                        creditStatus.riskLevel === 'HIGH' ? 'bg-amber-500' :
                        creditStatus.riskLevel === 'MEDIUM' ? 'bg-blue-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, creditStatus.creditUsedPercent || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test / 24h Toggle */}
            <button
              onClick={() => setDemoAlwaysOpen(!demoAlwaysOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                demoAlwaysOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
              }`}
              title="Activa todos los sorteos sin restricción de horario para pruebas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{demoAlwaysOpen ? 'Modo 24/7 Activo' : 'Sorteos 24/7'}</span>
            </button>
          </div>

          {/* Right: Quick actions & Layout Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Navegación rápida de Terminal: Cuadre, Números Ganadores, Tikes Ganadores, Recargas, Productos, Reportes */}
            {onNavigateTab && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Botón Recargas */}
                <button
                  type="button"
                  onClick={() => setShowRecargasModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-cyan-300 dark:hover:bg-blue-900/80 text-xs font-black border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  title="Vender Recargas Telefónicas Claro, Altice, Viva (F9)"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Recargas</span>
                  <span className="text-[9px] font-mono opacity-60 ml-0.5">F9</span>
                </button>

                {/* Botón Productos */}
                <button
                  type="button"
                  onClick={() => setShowProductosModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:hover:bg-emerald-900/80 text-xs font-black border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  title="Vender Productos, Pines y Facturas (F10)"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Productos</span>
                  <span className="text-[9px] font-mono opacity-60 ml-0.5">F10</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('cuadre')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                  title="Ver mi cuadre de caja, ventas netas y arqueo (F6)"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-500" />
                  <span>Mi Cuadre</span>
                  <span className="text-[9px] font-mono opacity-60 ml-0.5">F6</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('results')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                  title="Consultar resultados oficiales y números ganadores (F7)"
                >
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  <span>Números Ganadores</span>
                  <span className="text-[9px] font-mono opacity-60 ml-0.5">F7</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('winners')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black border border-amber-500/30 transition-colors shadow-2xs cursor-pointer"
                  title="Ver tikes ganadores de mi terminal y pagar premios"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tikes Ganadores</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('reports')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                  title="Ver reporte de cuánto se ha vendido, premios y cuánto gana o pierde"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden xl:inline">Reportes</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('settings')}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Configuración de impresora térmica"
                >
                  <Printer className="w-4 h-4 text-cyan-500" />
                </button>
              </div>
            )}

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-400 dark:border-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Botón de Pantalla Completa para PC */}
            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isFullScreen
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25 ring-1 ring-amber-500/30 shadow-xs'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-cyan-400 border-blue-200 dark:border-cyan-500/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                }`}
                title={isFullScreen ? 'Salir de pantalla completa' : 'Ocupar toda la pantalla de la PC'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Salir Pantalla Completa</span>
                    <span className="sm:hidden">Salir</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">Pantalla Completa</span>
                    <span className="sm:hidden">PC Full</span>
                  </>
                )}
              </button>
            )}

            {/* Segmented Version Switcher: PC vs Móvil */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-extrabold text-xs shadow-xs">
                <Monitor className="w-3.5 h-3.5" />
                <span>Versión PC</span>
              </div>
              {onSwitchToMobile && (
                <button
                  onClick={onSwitchToMobile}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-colors"
                  title="Cambiar a Versión Móvil táctil para celular/tablet"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Versión Móvil</span>
                </button>
              )}
            </div>

            {/* Cerrar Sesión (Acceso rápido para terminal) */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs border border-rose-200 dark:border-rose-900/40 transition-colors shadow-2xs"
                title="Cerrar sesión de la terminal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            )}

            {/* Volver al Panel solo para administradores cuando estén en pantalla completa */}
            {user.role !== 'TERMINAL' && isFullScreen && onNavigateTab && (
              <button
                onClick={() => {
                  if (onToggleFullScreen) onToggleFullScreen();
                  onNavigateTab('dashboard');
                }}
                className="hidden lg:flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Salir de la terminal e ir al panel administrativo"
              >
                <span>Volver al Panel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(errorMessage.includes('Sesión') || errorMessage.includes('conectar') || errorMessage.includes('servidor') || errorMessage.includes('401')) && (
              <button
                onClick={async () => {
                  try {
                    setErrorMessage(null);
                    const termUser = user.username || user.terminalCode || '1001';
                    const pass = user.role === 'SUPER_ADMIN' ? 'super123' : user.role === 'ADMIN' ? 'admin123' : '1234';
                    await api.login(termUser, pass, '123D123400');
                    setSuccessMessage('Sesión restablecida exitosamente. Procesando ticket...');
                    setTimeout(() => {
                      handleCommitTicket();
                    }, 400);
                  } catch {
                    window.dispatchEvent(new CustomEvent('bancapro:session-expired'));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] shadow-xs transition-colors flex items-center gap-1"
                title="Reconectar y reintentar venta sin perder las jugadas"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reconectar y Vender</span>
              </button>
            )}
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Notificación Dinámica de 'Cierre próximo' solo cuando no esté embebido en VenderLoteriasModule */}
      {!hideDuplicateHeader && (
        <LotteryScheduleAlertBanner
          lotteries={lotteries}
          selectedLotteryIds={selectedLotteryIds}
          onSelectLottery={handleToggleLottery}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onLotteryClosed={(closedLot) => {
            setErrorMessage(`🔴 La lotería "${closedLot.name}" ha finalizado su horario de venta oficial (${closedLot.closeTime || closedLot.drawTime}).`);
          }}
        />
      )}

      {/* ========================================================
          WIDGET: ÚLTIMOS 5 TICKETS EMITIDOS (LISTA DESLIZANTE CON REIMPRESIÓN RÁPIDA)
          ======================================================== */}
      <RecentTicketsSliderWidget
        user={user}
        tickets={recentTickets}
        onTicketReprinted={(ticket) => {
          setLastTicket(ticket);
        }}
      />

      {/* ========================================================
          2. MAIN 3-COLUMN LAYOUT (DESKTOP POWERHOUSE)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ========================================================
            COLUMNA 1: MATRIZ DE SORTEOS (Cols: 3.5)
            ======================================================== */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          {/* Header of Sorteos */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Sorteos Oficiales
                </h2>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                  {selectedLotteryIds.length} seleccionado(s)
                </span>
              </div>
            </div>

            {/* Súper Palé Toggle Button */}
            <button
              onClick={handleToggleSuperPale}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                isSuperPaleMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-2 ring-purple-500/40'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-500/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SÚPER PALÉ</span>
              <span className={`w-2 h-2 rounded-full ${isSuperPaleMode ? 'bg-amber-300 animate-ping' : 'bg-slate-400'}`} />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
            {(['TODAS', 'POPULARES', 'TARDE', 'NOCHE', 'AMERICANAS'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setLotteryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  lotteryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'POPULARES' ? '🔥 Populares' : cat}
              </button>
            ))}
          </div>

          {/* Search & Batch Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar sorteo (Real, Gana Más...)"
                value={lotterySearch}
                onChange={(e) => setLotterySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            {!isSuperPaleMode && (
              <>
                <button
                  onClick={handleSelectAllLotteries}
                  className="px-2.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-cyan-400 text-[11px] font-bold rounded-xl transition-colors shrink-0"
                  title="Marcar todas las abiertas"
                >
                  Todas
                </button>
                <button
                  onClick={handleClearLotteries}
                  className="px-2 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 text-[11px] font-bold rounded-xl transition-colors shrink-0"
                  title="Desmarcar"
                >
                  ✕
                </button>
              </>
            )}
          </div>

          {/* Súper Palé Cruzado Visual Builder */}
          {isSuperPaleMode && (
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/40 rounded-xl p-3 text-xs flex flex-col gap-2">
              <span className="font-extrabold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Súper Palé Cruzado: Seleccione 2 Sorteos
              </span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div
                  className={`p-2 rounded-xl border transition-all ${
                    superPaleLot1
                      ? 'bg-purple-600 text-white border-purple-400 font-extrabold shadow-sm'
                      : 'border-dashed border-purple-400/50 text-purple-400/70'
                  }`}
                >
                  1ra: {lotteries.find((l) => l.id === superPaleLot1)?.name || 'Elegir 1ra'}
                </div>
                <div
                  className={`p-2 rounded-xl border transition-all ${
                    superPaleLot2
                      ? 'bg-purple-600 text-white border-purple-400 font-extrabold shadow-sm'
                      : 'border-dashed border-purple-400/50 text-purple-400/70'
                  }`}
                >
                  2da: {lotteries.find((l) => l.id === superPaleLot2)?.name || 'Elegir 2da'}
                </div>
              </div>
            </div>
          )}

          {/* Sorteos List Grid */}
          <div className="overflow-y-auto pr-1 space-y-1.5 max-h-[520px] xl:max-h-[640px] 2xl:max-h-[740px] scrollbar-thin">
            {filteredLotteries.map((lot) => {
              const status = getLotteryStatus(lot);
              const isSelected = isSuperPaleMode
                ? superPaleLot1 === lot.id || superPaleLot2 === lot.id
                : selectedLotteryIds.includes(lot.id);

              return (
                <div
                  key={lot.id}
                  onClick={() => {
                    if (!status.isOpen) {
                      setErrorMessage(`La lotería "${lot.name}" ya cerró su venta (${status.formattedCloseTime}). No se pueden registrar jugadas.`);
                      return;
                    }
                    handleToggleLottery(lot.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none flex items-center justify-between gap-2.5 ${
                    !status.isOpen
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      : isSelected
                      ? isSuperPaleMode
                        ? 'bg-purple-500/15 border-purple-500 text-purple-900 dark:text-purple-100 shadow-sm'
                        : 'bg-blue-500/15 border-blue-500 text-blue-900 dark:text-cyan-100 shadow-sm ring-1 ring-blue-500/40'
                      : status.isClosingSoon
                      ? 'bg-amber-500/15 border-amber-500/60 dark:bg-amber-950/30 text-slate-900 dark:text-white ring-2 ring-amber-500/30 hover:border-amber-500'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckSquare
                          className={`w-4 h-4 ${isSuperPaleMode ? 'text-purple-500' : 'text-blue-500'}`}
                        />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const logoSrc = lot.logoUrl || getPresetLogoForLottery(lot.name) || (lot.code ? getPresetLogoForLottery(lot.code) : undefined);
                          return logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={lot.name}
                              className="w-5 h-5 rounded-md object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: lot.color || '#2563EB' }}
                            />
                          );
                        })()}
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase truncate">
                          {lot.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Cierre: {lot.drawTime || lot.closeTime}
                      </span>
                    </div>
                  </div>

                  {status.isClosingSoon ? (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 bg-amber-500 text-slate-950 border border-amber-600 animate-pulse flex items-center gap-1 shadow-xs"
                      title={`Cierre próximo en ${status.formattedCountdown}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{status.formattedCountdown}</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        status.isOpen
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {status.isOpen ? 'ABIERTA' : 'CERRÓ'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            COLUMNA 2: CENTRO DE COMANDO & CAPTURA INTELIGENTE (Cols: 4.5)
            ======================================================== */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
          <SmartBetCapture
            lotteries={lotteries}
            selectedLotteryIds={selectedLotteryIds}
            onSelectLotteryIds={setSelectedLotteryIds}
            isSuperPaleMode={isSuperPaleMode}
            onToggleSuperPaleMode={setIsSuperPaleMode}
            superPaleLotteries={[superPaleLot1, superPaleLot2]}
            onSelectSuperPaleLotteries={(lot1, lot2) => {
              setSuperPaleLot1(lot1);
              setSuperPaleLot2(lot2);
            }}
            onAddPlay={async (type, numbers, amt, options) => {
              if (type === 'SUPER_PALE' || isSuperPaleMode) {
                const l1 = options?.lotteryId || superPaleLot1;
                const l2 = options?.lottery2Id || superPaleLot2;
                if (!l1 || !l2) {
                  setErrorMessage('Para jugar Súper Palé debe seleccionar 2 loterías.');
                  return;
                }
                const lotObj1 = lotteries.find((l) => l.id === l1);
                const lotObj2 = lotteries.find((l) => l.id === l2);
                const newPlay: PendingPlay = {
                  tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  lotteryId: l1,
                  lotteryName: lotObj1?.name || 'Lotería 1',
                  lottery2Id: l2,
                  lottery2Name: lotObj2?.name || 'Lotería 2',
                  playType: 'SUPER_PALE',
                  numbers,
                  amount: amt,
                };
                if (soundEnabled) playTone(1200, 0.08);
                setPendingPlays((prev) => [...prev, newPlay]);
                setSuccessMessage(`⚡ Súper Palé: ${numbers.join('-')} por RD$${amt}`);
                setTimeout(() => setSuccessMessage(null), 2500);
              } else {
                addPlayToBasket(type, numbers, amt);
              }
            }}
            onAddMultiplePlays={async (batchPlays, options) => {
              const newPlays: PendingPlay[] = batchPlays.map((bp) => {
                const lot1 = lotteries.find((l) => l.id === bp.lotteryId);
                const lot2 = bp.lottery2Id ? lotteries.find((l) => l.id === bp.lottery2Id) : undefined;
                return {
                  tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  lotteryId: bp.lotteryId || (selectedLotteryIds[0] || ''),
                  lotteryName: lot1?.name || 'Lotería',
                  lottery2Id: bp.lottery2Id,
                  lottery2Name: lot2?.name,
                  playType: bp.playType,
                  numbers: bp.numbers,
                  amount: bp.amount,
                };
              });
              if (soundEnabled) playTone(1250, 0.1);
              if (options?.replaceBasketPlays) {
                // Si el cajero seleccionó ligar las quinielas ya agregadas en el ticket, reemplazar las quinielas individuales por las jugadas combinadas en el mismo ticket
                setPendingPlays((prev) => {
                  const filtered = prev.filter((p) => p.playType !== 'QUINIELA');
                  return [...filtered, ...newPlays];
                });
              } else {
                setPendingPlays((prev) => [...prev, ...newPlays]);
              }
              const totalAmt = newPlays.reduce((sum, p) => sum + p.amount, 0);
              setSuccessMessage(`⚡ ¡Ligar exitoso! Se procesaron ${newPlays.length} jugadas ligadas en el ticket (RD$${totalAmt}).`);
              setTimeout(() => setSuccessMessage(null), 3500);
            }}
            pendingPlays={pendingPlays}
            user={user}
            soundEnabled={soundEnabled}
            onPlayTone={(freq, dur) => playTone(freq, dur)}
            onOpenRecargas={() => setShowRecargasModal(true)}
            onOpenProductos={() => setShowProductosModal(true)}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            layoutVariant="desktop"
          />
        </div>

        {/* ========================================================
            COLUMNA 3: TICKET DIGITAL EN VIVO (Cols: 4.5)
            ======================================================== */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[580px] xl:min-h-[640px] 2xl:min-h-[740px]">
          {/* Header of Receipt */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Ticket en Vivo
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {pendingPlays.length} jugada(s) agregadas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Botón de Impresión Directa 58mm con autodetección USB/Bluetooth */}
                <button
                  onClick={async () => {
                    if (lastTicket) {
                      const res = await printerService.directThermalPrint58mm(lastTicket, user.terminalCode || '1001');
                      setSuccessMessage(`⚡ Ticket #${lastTicket.ticketNumber} enviado a Impresión Térmica Directa 58mm (${res.printerName}).`);
                      setTimeout(() => setSuccessMessage(null), 3500);
                    }
                  }}
                  disabled={!lastTicket}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-900 dark:text-cyan-200 text-[11px] font-black border border-amber-500/30 dark:border-cyan-500/30 flex items-center gap-1 disabled:opacity-40 transition-all shadow-xs"
                  title="Detecta impresora conectada vía USB/Bluetooth y formatea el ticket automáticamente en 58mm"
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Impresión Directa [58mm]</span>
                </button>

                {/* F4: Repetir último */}
                <button
                  onClick={handleRepeatLastTicket}
                  disabled={!lastTicket}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 disabled:opacity-40 transition-colors"
                  title="Repetir último ticket vendido (F4)"
                >
                  <RotateCcw className="w-3 h-3 text-blue-500" />
                  <span>Repetir [F4]</span>
                </button>
              </div>
            </div>

            {/* Closed plays warning banner */}
            {closedPlaysInBasket.length > 0 && (
              <div className="p-3 my-2 bg-rose-500/15 border-2 border-rose-500/40 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠️ {closedPlaysInBasket.length} jugada(s) de sorteos cerrados</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveClosedPlays}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg shadow-xs flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover cerradas</span>
                  </button>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  El horario de ventas ha finalizado para algunos sorteos. Debe removerlas para procesar la venta.
                </p>
              </div>
            )}

            {/* List of Plays */}
            <div className="py-3 space-y-2 max-h-[340px] xl:max-h-[420px] 2xl:max-h-[500px] overflow-y-auto scrollbar-thin">
              {pendingPlays.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-2">
                  <Flame className="w-8 h-8 mx-auto opacity-30 text-blue-500" />
                  <p className="text-xs font-bold">Canasta vacía</p>
                  <p className="text-[11px] text-slate-500">
                    Seleccione sorteos y escriba sus números para agregar al ticket.
                  </p>
                </div>
              ) : (
                pendingPlays.map((p) => {
                  const playClosedInfo = !demoAlwaysOpen
                    ? isPlayLotteryClosed(p, lotteries, new Date())
                    : { isClosed: false, closedLotteryNames: [] };
                  const isPlayClosed = playClosedInfo.isClosed;

                  return (
                    <div
                      key={p.tempId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isPlayClosed
                          ? 'bg-rose-500/10 border-rose-500/60 dark:bg-rose-950/30 ring-1 ring-rose-500/40'
                          : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isPlayClosed
                                ? 'bg-rose-600 text-white'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400'
                            }`}
                          >
                            {isPlayClosed ? 'SORTEO CERRADO' : p.playType}
                          </span>
                          <span
                            className={`text-xs font-extrabold truncate ${
                              isPlayClosed
                                ? 'text-rose-700 dark:text-rose-300 line-through'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {p.lotteryName} {p.lottery2Name ? `+ ${p.lottery2Name}` : ''}
                          </span>
                        </div>

                        {/* Number Balls */}
                        <div className="flex items-center gap-1 mt-1">
                          {p.numbers.map((n, idx) => (
                            <span
                              key={idx}
                              className={`w-6 h-6 rounded-full font-mono font-black text-xs flex items-center justify-center shadow-xs ${
                                isPlayClosed
                                  ? 'bg-rose-700 text-white opacity-70'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-black ${
                            isPlayClosed
                              ? 'text-rose-600 dark:text-rose-400 line-through'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          RD$ {p.amount}
                        </span>
                        <button
                          onClick={() => handleRemovePlay(p.tempId)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="Eliminar jugada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Total & Checkout Bar */}
          <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                TOTAL A COBRAR:
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                RD$ {totalAmount.toLocaleString('es-DO')}
              </span>
            </div>

            {/* Credit Limit Exceeded Risk Warning Banner */}
            {isCreditExceeded && creditStatus && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="block font-black">Límite de Crédito Insuficiente</span>
                  <span className="text-[11px] font-normal block mt-0.5">
                    Saldo disponible para ventas: <strong>RD${creditStatus.availableCredit.toLocaleString()}</strong>.
                    Total de este ticket: <strong>RD${totalAmount.toLocaleString()}</strong>.
                    Reduzca jugadas o contacte a administración para aumentar el límite.
                  </span>
                </div>
              </div>
            )}

            {/* Giant Sell Button & Quick Print Button */}
            <div className="space-y-2">
              <button
                onClick={() => handleCommitTicket(false)}
                disabled={submitting || pendingPlays.length === 0 || closedPlaysInBasket.length > 0 || isCreditExceeded}
                className={`w-full py-3.5 rounded-xl text-white font-black text-sm tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  closedPlaysInBasket.length > 0 || isCreditExceeded
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                }`}
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : closedPlaysInBasket.length > 0 ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>⚠️ Remover cerradas para vender</span>
                  </>
                ) : isCreditExceeded ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>⛔ Crédito Insuficiente (RD${creditStatus?.availableCredit.toLocaleString()} disp.)</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    <span>CONFIRMAR Y VENDER TICKET</span>
                  </>
                )}
              </button>

              {/* Botón de Impresión Rápida Directa en 58mm */}
              <button
                onClick={() => handleCommitTicket(true)}
                disabled={submitting || pendingPlays.length === 0 || closedPlaysInBasket.length > 0 || isCreditExceeded}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide uppercase shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300"
                title="Vender e imprimir directamente al formato de 58mm predefinido en CSS, omitiendo diálogos intermedios"
              >
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>⚡ Impresión Rápida (58mm Directo)</span>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleClearPlays}
                disabled={pendingPlays.length === 0}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40"
              >
                Limpiar [F2]
              </button>

              <button
                onClick={() => setShowRecentModal(true)}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>Historial</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. THERMAL TICKET MODAL
          ======================================================== */}
      {showPrintModal && lastTicket && (
        <ThermalTicketModal
          ticket={lastTicket}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* ========================================================
          4. RECENT TICKETS MODAL
          ======================================================== */}
      {showRecentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 shadow-2xl text-slate-900 dark:text-white space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <h3 className="font-extrabold text-base">Últimos Tickets Vendidos</h3>
              </div>
              <button
                onClick={() => setShowRecentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
              {recentTickets.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  No hay tickets emitidos en esta sesión.
                </p>
              ) : (
                recentTickets.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Ticket #{t.ticketNumber}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {t.time} · {t.plays?.length || 0} jugada(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-600">
                        RD$ {t.totalAmount}
                      </span>
                      <button
                        onClick={() => {
                          setLastTicket(t);
                          setShowRecentModal(false);
                          setShowPrintModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 hover:bg-blue-100"
                        title="Reimprimir ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
  );
};
