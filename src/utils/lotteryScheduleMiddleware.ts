import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Lottery } from '../types/index';
import { api } from '../services/api';
import { getLotteryScheduleStatus, LotteryScheduleStatus } from './lotterySchedule';

export interface BlockedLotteryInfo {
  lottery: Lottery;
  status: LotteryScheduleStatus;
  isClosingSoon: boolean;
  isClosed: boolean;
  closingInSeconds: number;
  formattedCountdown: string;
  formattedCloseTime: string;
  reason: string;
}

export interface SelectionScheduleGuardResult {
  isInputBlocked: boolean;
  blockedLotteries: BlockedLotteryInfo[];
  primaryBlockedLottery: BlockedLotteryInfo | null;
  blockingReason: string | null;
  formattedCountdown: string | null;
  hasOpenLotteriesAvailable: boolean;
}

/**
 * Checks whether a single lottery is blocked by the 5-minute pre-closing rule or is already closed.
 */
export function isLotteryBlockedBy5MinRule(
  lottery: Lottery,
  atDate = new Date()
): { isBlocked: boolean; isClosingSoon: boolean; isClosed: boolean; info: BlockedLotteryInfo } {
  const status = getLotteryScheduleStatus(lottery, atDate);
  const isClosingSoon = status.isClosingSoon; // <= 300 seconds (5 min) and > 0
  const isClosed = !status.isOpen || status.isClosed;
  const isBlocked = isClosingSoon || isClosed;

  let reason = '';
  if (isClosingSoon) {
    reason = `Bloqueo de seguridad: La lotería "${lottery.name}" cerrará en ${status.formattedCountdown} (cierre oficial: ${status.formattedCloseTime}). Por normativa los inputs de jugada se bloquean 5 minutos antes de la hora.`;
  } else if (isClosed) {
    reason = `La lotería "${lottery.name}" está cerrada para la venta (${status.formattedCloseTime}).`;
  }

  const info: BlockedLotteryInfo = {
    lottery,
    status,
    isClosingSoon,
    isClosed,
    closingInSeconds: status.closingInSeconds,
    formattedCountdown: status.formattedCountdown,
    formattedCloseTime: status.formattedCloseTime,
    reason,
  };

  return {
    isBlocked,
    isClosingSoon,
    isClosed,
    info,
  };
}

/**
 * Checks the full selection (standard or Super Palé) against the 5-minute closing guard.
 */
export function evaluateSelectionScheduleGuard(
  lotteries: Lottery[],
  selectedLotteryIds: string[],
  isSuperPaleMode: boolean,
  superPaleLotteries: [string, string],
  demoAlwaysOpen = false,
  atDate = new Date()
): SelectionScheduleGuardResult {
  if (demoAlwaysOpen) {
    return {
      isInputBlocked: false,
      blockedLotteries: [],
      primaryBlockedLottery: null,
      blockingReason: null,
      formattedCountdown: null,
      hasOpenLotteriesAvailable: true,
    };
  }

  const lotMap = new Map(lotteries.map((l) => [l.id, l]));
  const blockedList: BlockedLotteryInfo[] = [];

  const targetIds = isSuperPaleMode
    ? superPaleLotteries.filter(Boolean)
    : selectedLotteryIds;

  if (targetIds.length === 0) {
    return {
      isInputBlocked: true,
      blockedLotteries: [],
      primaryBlockedLottery: null,
      blockingReason: isSuperPaleMode
        ? 'Seleccione las 2 loterías para el Súper Palé.'
        : 'Seleccione al menos una lotería para habilitar la entrada de jugadas.',
      formattedCountdown: null,
      hasOpenLotteriesAvailable: lotteries.some((l) => getLotteryScheduleStatus(l, atDate).isOpen),
    };
  }

  for (const id of targetIds) {
    const lot = lotMap.get(id);
    if (!lot) continue;
    const check = isLotteryBlockedBy5MinRule(lot, atDate);
    if (check.isBlocked) {
      blockedList.push(check.info);
    }
  }

  const isInputBlocked = blockedList.length > 0;
  const primaryBlockedLottery = blockedList[0] || null;

  let blockingReason: string | null = null;
  let formattedCountdown: string | null = null;

  if (primaryBlockedLottery) {
    formattedCountdown = primaryBlockedLottery.formattedCountdown;
    if (primaryBlockedLottery.isClosingSoon) {
      blockingReason = `⚠️ BLOQUEO DE SEGURIDAD (5 MIN ANTES DE CIERRE): ${primaryBlockedLottery.lottery.name} cerrará a las ${primaryBlockedLottery.formattedCloseTime} (quedan ${primaryBlockedLottery.formattedCountdown}). Los inputs de jugada están bloqueados.`;
    } else {
      blockingReason = `🔴 SORTEO CERRADO: ${primaryBlockedLottery.lottery.name} ha cerrado su horario de ventas (${primaryBlockedLottery.formattedCloseTime}). Deselecciónela para continuar.`;
    }
  }

  const hasOpenLotteriesAvailable = lotteries.some((l) => {
    const check = isLotteryBlockedBy5MinRule(l, atDate);
    return !check.isBlocked;
  });

  return {
    isInputBlocked,
    blockedLotteries: blockedList,
    primaryBlockedLottery,
    blockingReason,
    formattedCountdown,
    hasOpenLotteriesAvailable,
  };
}

export interface UsePosScheduleGuardOptions {
  selectedLotteryIds: string[];
  isSuperPaleMode?: boolean;
  superPaleLotteries?: [string, string];
  demoAlwaysOpen?: boolean;
  pollIntervalMs?: number; // default: 20000 ms (20s)
  onLotteriesRefreshed?: (lotteries: Lottery[]) => void;
}

/**
 * React hook that implements the POS schedule middleware:
 * 1. Consults lottery schedules from the API periodically.
 * 2. Ticks every 1 second to update remaining countdown to close.
 * 3. Blocks play inputs 5 minutes before close.
 * 4. Exposes state for persistent visual alerts.
 */
export function usePosScheduleGuard({
  selectedLotteryIds,
  isSuperPaleMode = false,
  superPaleLotteries = ['', ''],
  demoAlwaysOpen = false,
  pollIntervalMs = 20000,
  onLotteriesRefreshed,
}: UsePosScheduleGuardOptions) {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);
  const [lastApiSync, setLastApiSync] = useState<Date | null>(null);

  // 1. Consult schedules from API
  const refreshSchedulesFromApi = useCallback(async () => {
    try {
      const data = await api.getLotteries();
      setLotteries(data);
      setLastApiSync(new Date());
      if (onLotteriesRefreshed) {
        onLotteriesRefreshed(data);
      }
    } catch (err) {
      console.warn('[ScheduleMiddleware] Error consultando horarios de lotería desde la API:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [onLotteriesRefreshed]);

  // Initial fetch and periodic polling
  useEffect(() => {
    refreshSchedulesFromApi();
    const interval = setInterval(refreshSchedulesFromApi, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refreshSchedulesFromApi, pollIntervalMs]);

  // 2. 1-second live clock tick for exact countdown calculation
  useEffect(() => {
    const tick = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // 3. Evaluate guard status against current selection
  const guard = useMemo(() => {
    return evaluateSelectionScheduleGuard(
      lotteries,
      selectedLotteryIds,
      isSuperPaleMode,
      superPaleLotteries,
      demoAlwaysOpen,
      liveNow
    );
  }, [lotteries, selectedLotteryIds, isSuperPaleMode, superPaleLotteries, demoAlwaysOpen, liveNow]);

  // List of all lotteries currently in the 5-minute pre-closing window across the system
  const allClosingSoonLotteries = useMemo(() => {
    return lotteries
      .map((l) => isLotteryBlockedBy5MinRule(l, liveNow))
      .filter((res) => res.isClosingSoon)
      .map((res) => res.info);
  }, [lotteries, liveNow]);

  // Play attempt validator
  const validateCanAddPlay = useCallback(
    (lotteryId: string, lottery2Id?: string): { allowed: boolean; errorMessage?: string } => {
      if (demoAlwaysOpen) return { allowed: true };

      const lotMap = new Map(lotteries.map((l) => [l.id, l]));
      const l1 = lotMap.get(lotteryId);
      if (!l1) {
        return { allowed: false, errorMessage: 'La lotería seleccionada no existe.' };
      }

      const c1 = isLotteryBlockedBy5MinRule(l1, new Date());
      if (c1.isBlocked) {
        return { allowed: false, errorMessage: c1.info.reason };
      }

      if (lottery2Id) {
        const l2 = lotMap.get(lottery2Id);
        if (!l2) {
          return { allowed: false, errorMessage: 'La segunda lotería para Súper Palé no existe.' };
        }
        const c2 = isLotteryBlockedBy5MinRule(l2, new Date());
        if (c2.isBlocked) {
          return { allowed: false, errorMessage: c2.info.reason };
        }
      }

      return { allowed: true };
    },
    [lotteries, demoAlwaysOpen]
  );

  return {
    lotteries,
    liveNow,
    loadingSchedule,
    lastApiSync,
    guard,
    isInputBlocked: guard.isInputBlocked,
    blockedLotteries: guard.blockedLotteries,
    primaryBlockedLottery: guard.primaryBlockedLottery,
    blockingReason: guard.blockingReason,
    formattedCountdown: guard.formattedCountdown,
    allClosingSoonLotteries,
    validateCanAddPlay,
    refreshSchedulesFromApi,
  };
}
