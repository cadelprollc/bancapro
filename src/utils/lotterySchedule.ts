import { Lottery, LotteryStatus } from '../types/index';

/**
 * Universal time parser that understands:
 * - 12-hour format: "07:00 AM", "7:00 AM", "12:55 PM", "12:55:00 PM"
 * - 24-hour format: "07:00", "12:55", "18:55", "16:55:00"
 * Returns total minutes from midnight (0 to 1439), or null if invalid.
 */
export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const str = timeStr.trim();
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[4]?.toUpperCase();

  if (ampm === 'PM') {
    if (hours < 12) hours += 12;
  } else if (ampm === 'AM') {
    if (hours === 12) hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into 12-hour AM/PM string (e.g. 775 -> "12:55 PM")
 */
export function minutesTo12Hour(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(norm / 60);
  const mins = norm % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
}

/**
 * Formats minutes from midnight into 24-hour HH:MM string (e.g. 775 -> "12:55")
 */
export function minutesTo24Hour(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(norm / 60);
  const mins = norm % 60;
  return `${String(hours24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Formats any input time string nicely into 12-hour AM/PM format
 */
export function formatTime12(timeStr?: string, fallback = '12:55 PM'): string {
  if (!timeStr) return fallback;
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  return minutesTo12Hour(mins);
}

/**
 * Formats any input time string nicely into 24-hour HH:MM format for <input type="time">
 */
export function formatTime24(timeStr?: string, fallback = '12:55'): string {
  if (!timeStr) return fallback;
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  return minutesTo24Hour(mins);
}

export interface LotteryScheduleStatus {
  isOpen: boolean;
  isClosed: boolean;
  isClosingSoon: boolean; // True when closing in <= 5 minutes (300 seconds) and > 0 seconds
  closingInMinutes: number; // Remaining minutes to close (0 if closed)
  closingInSeconds: number; // Remaining seconds to close
  formattedCountdown: string; // e.g. "04:35", "01:20", "00:45"
  status: LotteryStatus;
  statusLabel: string; // '🟢 ABIERTA' | '⚠️ CIERRE PRÓXIMO' | '🔴 CERRADA' | '⚪ DESACTIVADA'
  badgeColor: string;
  badgeTextColor: string;
  reason?: string;
  openMinutes: number;
  closeMinutes: number;
  formattedOpenTime: string;
  formattedCloseTime: string;
  remainingText: string;
}

/**
 * Computes live operational status of a lottery based on configured schedule:
 * - Active flag (if false -> ⚪ DESACTIVADA)
 * - Hora de inicio de venta (openTime, default 07:00 AM)
 * - Hora de cierre de venta (closeTime, default 12:55 PM or drawTime)
 * - Current time (dynamic validation of closing status and 5-minute closing soon notice)
 */
export function getLotteryScheduleStatus(lottery: Lottery, atDate = new Date()): LotteryScheduleStatus {
  const openM = parseTimeToMinutes(lottery.openTime) ?? 420;
  const closeM = parseTimeToMinutes(lottery.closeTime) ?? parseTimeToMinutes(lottery.drawTime) ?? 775;
  const formattedOpen = minutesTo12Hour(openM);
  const formattedClose = minutesTo12Hour(closeM);

  // If deactivated by administrator
  if (!lottery.active) {
    return {
      isOpen: false,
      isClosed: true,
      isClosingSoon: false,
      closingInMinutes: 0,
      closingInSeconds: 0,
      formattedCountdown: '00:00',
      status: 'DESACTIVADA',
      statusLabel: '⚪ DESACTIVADA',
      badgeColor: 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      badgeTextColor: 'text-neutral-500 dark:text-slate-400',
      reason: 'Lotería desactivada por la administración.',
      openMinutes: openM,
      closeMinutes: closeM,
      formattedOpenTime: formattedOpen,
      formattedCloseTime: formattedClose,
      remainingText: 'Desactivada',
    };
  }

  const nowSeconds = atDate.getHours() * 3600 + atDate.getMinutes() * 60 + atDate.getSeconds();
  const nowMinutes = atDate.getHours() * 60 + atDate.getMinutes();

  // Helper to format MM:SS countdown
  const formatSecsToCountdown = (secs: number): string => {
    const safe = Math.max(0, secs);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Standard same-day sales window (e.g. 07:00 AM to 12:55 PM, or 07:00 AM to 08:55 PM)
  if (openM <= closeM) {
    // Before opening time
    if (nowMinutes < openM) {
      const diffM = openM - nowMinutes;
      const h = Math.floor(diffM / 60);
      const m = diffM % 60;
      const timeWait = h > 0 ? `${h}h ${m}m` : `${m} min`;
      return {
        isOpen: false,
        isClosed: true,
        isClosingSoon: false,
        closingInMinutes: 0,
        closingInSeconds: 0,
        formattedCountdown: '00:00',
        status: 'CERRADA',
        statusLabel: '🔴 CERRADA',
        badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        badgeTextColor: 'text-rose-600 dark:text-rose-400',
        reason: `Venta no iniciada (Abre a las ${formattedOpen}).`,
        openMinutes: openM,
        closeMinutes: closeM,
        formattedOpenTime: formattedOpen,
        formattedCloseTime: formattedClose,
        remainingText: `Abre a las ${formattedOpen} (en ${timeWait})`,
      };
    }

    const closeSecs = closeM * 60;

    // Past closing time (Closed)
    if (nowSeconds >= closeSecs) {
      return {
        isOpen: false,
        isClosed: true,
        isClosingSoon: false,
        closingInMinutes: 0,
        closingInSeconds: 0,
        formattedCountdown: '00:00',
        status: 'CERRADA',
        statusLabel: '🔴 CERRADA',
        badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        badgeTextColor: 'text-rose-600 dark:text-rose-400',
        reason: `Venta cerrada (Cerró a las ${formattedClose}).`,
        openMinutes: openM,
        closeMinutes: closeM,
        formattedOpenTime: formattedOpen,
        formattedCloseTime: formattedClose,
        remainingText: `Cerró a las ${formattedClose}`,
      };
    }

    // Inside open window
    const diffSecs = closeSecs - nowSeconds;
    const diffMins = Math.ceil(diffSecs / 60);
    const isClosingSoon = diffSecs <= 300 && diffSecs > 0; // <= 5 minutes (300 seconds)
    const countdown = formatSecsToCountdown(diffSecs);

    if (isClosingSoon) {
      return {
        isOpen: true,
        isClosed: false,
        isClosingSoon: true,
        closingInMinutes: diffMins,
        closingInSeconds: diffSecs,
        formattedCountdown: countdown,
        status: 'ABIERTA',
        statusLabel: '⚠️ CIERRE PRÓXIMO',
        badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30 animate-pulse',
        badgeTextColor: 'text-amber-600 dark:text-amber-400',
        reason: `Cierre inminente a las ${formattedClose} (Quedan ${countdown}).`,
        openMinutes: openM,
        closeMinutes: closeM,
        formattedOpenTime: formattedOpen,
        formattedCloseTime: formattedClose,
        remainingText: `⚠️ Cierra en ${countdown}`,
      };
    }

    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    const remainingText = h > 0 ? `Cierra en ${h}h ${m}m` : `Cierra en ${m} min`;

    return {
      isOpen: true,
      isClosed: false,
      isClosingSoon: false,
      closingInMinutes: diffMins,
      closingInSeconds: diffSecs,
      formattedCountdown: countdown,
      status: 'ABIERTA',
      statusLabel: '🟢 ABIERTA',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      badgeTextColor: 'text-emerald-600 dark:text-emerald-400',
      openMinutes: openM,
      closeMinutes: closeM,
      formattedOpenTime: formattedOpen,
      formattedCloseTime: formattedClose,
      remainingText,
    };
  } else {
    // Overnight window (e.g. 10:00 PM to 02:00 AM)
    const isOvernightOpen = nowMinutes >= openM || nowMinutes < closeM;
    if (isOvernightOpen) {
      let diffSecs = 0;
      if (nowMinutes >= openM) {
        diffSecs = (1440 * 60 - nowSeconds) + (closeM * 60);
      } else {
        diffSecs = (closeM * 60) - nowSeconds;
      }

      const diffMins = Math.ceil(diffSecs / 60);
      const isClosingSoon = diffSecs <= 300 && diffSecs > 0;
      const countdown = formatSecsToCountdown(diffSecs);

      if (isClosingSoon) {
        return {
          isOpen: true,
          isClosed: false,
          isClosingSoon: true,
          closingInMinutes: diffMins,
          closingInSeconds: diffSecs,
          formattedCountdown: countdown,
          status: 'ABIERTA',
          statusLabel: '⚠️ CIERRE PRÓXIMO',
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30 animate-pulse',
          badgeTextColor: 'text-amber-600 dark:text-amber-400',
          reason: `Cierre inminente a las ${formattedClose} (Quedan ${countdown}).`,
          openMinutes: openM,
          closeMinutes: closeM,
          formattedOpenTime: formattedOpen,
          formattedCloseTime: formattedClose,
          remainingText: `⚠️ Cierra en ${countdown}`,
        };
      }

      return {
        isOpen: true,
        isClosed: false,
        isClosingSoon: false,
        closingInMinutes: diffMins,
        closingInSeconds: diffSecs,
        formattedCountdown: countdown,
        status: 'ABIERTA',
        statusLabel: '🟢 ABIERTA',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        badgeTextColor: 'text-emerald-600 dark:text-emerald-400',
        openMinutes: openM,
        closeMinutes: closeM,
        formattedOpenTime: formattedOpen,
        formattedCloseTime: formattedClose,
        remainingText: `Cierra a las ${formattedClose}`,
      };
    } else {
      return {
        isOpen: false,
        isClosed: true,
        isClosingSoon: false,
        closingInMinutes: 0,
        closingInSeconds: 0,
        formattedCountdown: '00:00',
        status: 'CERRADA',
        statusLabel: '🔴 CERRADA',
        badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        badgeTextColor: 'text-rose-600 dark:text-rose-400',
        reason: `Venta cerrada (Horario: ${formattedOpen} - ${formattedClose}).`,
        openMinutes: openM,
        closeMinutes: closeM,
        formattedOpenTime: formattedOpen,
        formattedCloseTime: formattedClose,
        remainingText: `Cerrada hasta ${formattedOpen}`,
      };
    }
  }
}

/**
 * Returns all lotteries currently in the 5-minute closing soon window
 */
export function getLotteriesClosingSoon(lotteries: Lottery[], atDate = new Date()): { lottery: Lottery; status: LotteryScheduleStatus }[] {
  const result: { lottery: Lottery; status: LotteryScheduleStatus }[] = [];
  for (const lot of lotteries) {
    const status = getLotteryScheduleStatus(lot, atDate);
    if (status.isClosingSoon) {
      result.push({ lottery: lot, status });
    }
  }
  return result.sort((a, b) => a.status.closingInSeconds - b.status.closingInSeconds);
}

/**
 * Validates a basket of plays to ensure none of the involved lotteries have closed
 */
export function validateBasketPlaysOpen(
  plays: { lotteryId: string; lotteryName?: string; lottery2Id?: string; lottery2Name?: string }[],
  lotteries: Lottery[],
  atDate = new Date()
): { valid: boolean; closedLotteryNames: string[]; closedPlaysCount: number } {
  const lotMap = new Map(lotteries.map((l) => [l.id, l]));
  const closedSet = new Set<string>();
  let closedCount = 0;

  for (const p of plays) {
    const lot1 = lotMap.get(p.lotteryId);
    const lot2 = p.lottery2Id ? lotMap.get(p.lottery2Id) : null;
    let isPlayClosed = false;

    if (lot1) {
      const s1 = getLotteryScheduleStatus(lot1, atDate);
      if (!s1.isOpen) {
        closedSet.add(lot1.name);
        isPlayClosed = true;
      }
    }
    if (lot2) {
      const s2 = getLotteryScheduleStatus(lot2, atDate);
      if (!s2.isOpen) {
        closedSet.add(lot2.name);
        isPlayClosed = true;
      }
    }

    if (isPlayClosed) {
      closedCount++;
    }
  }

  const closedLotteryNames = Array.from(closedSet);
  return {
    valid: closedLotteryNames.length === 0,
    closedLotteryNames,
    closedPlaysCount: closedCount,
  };
}

/**
 * Checks if a specific individual play belongs to a closed lottery
 */
export function isPlayLotteryClosed(
  play: { lotteryId: string; lottery2Id?: string },
  lotteries: Lottery[],
  atDate = new Date()
): { isClosed: boolean; closedLotteryNames: string[]; reason?: string } {
  const lotMap = new Map(lotteries.map((l) => [l.id, l]));
  const lot1 = lotMap.get(play.lotteryId);
  const lot2 = play.lottery2Id ? lotMap.get(play.lottery2Id) : null;
  const closedNames: string[] = [];

  if (lot1) {
    const s1 = getLotteryScheduleStatus(lot1, atDate);
    if (!s1.isOpen) {
      closedNames.push(lot1.name);
    }
  }
  if (lot2) {
    const s2 = getLotteryScheduleStatus(lot2, atDate);
    if (!s2.isOpen) {
      closedNames.push(lot2.name);
    }
  }

  const isClosed = closedNames.length > 0;
  return {
    isClosed,
    closedLotteryNames: closedNames,
    reason: isClosed ? `La lotería (${closedNames.join(' + ')}) ha cerrado su horario de ventas.` : undefined,
  };
}

