import React, { useState, useEffect } from 'react';
import { User, Ticket } from '../../types';
import { api } from '../../services/api';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Ban,
  RotateCcw,
  Award,
  Wallet,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Printer,
  ChevronRight,
  Clock,
  User as UserIcon,
  Store,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Smartphone,
  Package,
} from 'lucide-react';
import { ThermalTicketModal } from '../pos/ThermalTicketModal';
import { RecargasModal } from '../pos/RecargasModal';
import { ProductosModal } from '../pos/ProductosModal';
import { printerService } from '../../services/printerService';

interface SellerBalanceViewProps {
  user: User;
  onSelectTicket?: (ticketNumber: string) => void;
}

export const SellerBalanceView: React.FC<SellerBalanceViewProps> = ({ user, onSelectTicket }) => {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const todayStr = new Date().toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedEndDate, setSelectedEndDate] = useState(todayStr);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    isAdmin ? 'ALL' : user.terminalCode || user.username || user.id
  );
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'VENTA' | 'ANULACION' | 'PAGO_PREMIO' | 'GANADOR' | 'DEVOLUCION'>('ALL');

  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movimientos' | 'ganadores'>('movimientos');

  // Modal para ver/reimprimir ticket del historial
  const [selectedTicketToView, setSelectedTicketToView] = useState<Ticket | null>(null);
  const [showRecargasModal, setShowRecargasModal] = useState<boolean>(false);
  const [showProductosModal, setShowProductosModal] = useState<boolean>(false);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSellerBalance({
        startDate: selectedDate,
        endDate: selectedEndDate,
        sellerId: selectedSellerId === 'ALL' ? undefined : selectedSellerId,
        terminalCode: selectedSellerId === 'ALL' ? undefined : selectedSellerId,
      });
      setBalanceData(data);
    } catch (err: any) {
      setError(err?.message || 'Error cargando el balance de ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [selectedDate, selectedEndDate, selectedSellerId]);

  const handleSetQuickDate = (mode: 'today' | 'yesterday') => {
    setDateRange(mode);
    if (mode === 'today') {
      setSelectedDate(todayStr);
      setSelectedEndDate(todayStr);
    } else {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setSelectedDate(yStr);
      setSelectedEndDate(yStr);
    }
  };

  const handleOpenTicketModal = async (ticketNumber: string) => {
    try {
      const tck = await api.getTicket(ticketNumber);
      if (tck) {
        setSelectedTicketToView(tck);
      }
    } catch (err) {
      console.warn('Error fetching ticket detail:', err);
    }
  };

  // Extraer o recalcular métricas clave de balance y rentabilidad
  const rawSummary = balanceData?.summary || {};
  const grossSold = Number(rawSummary.grossSold || 0);
  const voidedAmount = Number(rawSummary.voidedAmount || 0);
  const voidedCount = Number(rawSummary.voidedCount || 0);
  const refundAmount = Number(rawSummary.refundAmount || 0);
  const refundCount = Number(rawSummary.refundCount || 0);
  const netSold = Number(rawSummary.netSold || 0);
  const totalPrizes = Number(rawSummary.totalPrizes || 0);
  const paidPrizes = Number(rawSummary.paidPrizes || 0);
  const pendingPrizes = Number(rawSummary.pendingPrizes || 0);
  const commissionRate = Number(rawSummary.commissionRate || 8);
  const commissionAmount = Number(rawSummary.commissionAmount || Math.round((netSold * commissionRate) / 100));
  const ticketsCount = Number(rawSummary.ticketsCount || 0);
  const winningCount = Number(rawSummary.winningCount || 0);
  const paidCount = Number(rawSummary.paidCount || 0);

  // --- RECÁLCULO EXACTO DE SI LA TERMINAL ESTÁ PERDIENDO O EN NEGATIVO ---
  // Ejemplo: Si la terminal ha vendido RD$ 500 y hay tickets que hacen RD$ 1,000 en premios:
  // terminalResult = 500 - 1000 = -500 (La terminal está perdiendo con RD$ -500)
  const terminalResult = rawSummary.terminalResult !== undefined
    ? Number(rawSummary.terminalResult)
    : netSold - totalPrizes;

  const isTerminalLosing = terminalResult < 0;
  const lossAmount = isTerminalLosing ? Math.abs(terminalResult) : 0;
  const profitAmount = !isTerminalLosing ? terminalResult : 0;

  // Balance neto en caja (Efectivo físico: Ventas netas - Premios pagados en caja - Comisión)
  const netBalance = rawSummary.netBalance !== undefined
    ? Number(rawSummary.netBalance)
    : netSold - paidPrizes - commissionAmount;

  const isCashNegative = netBalance < 0;

  // Margen de ganancia o pérdida
  const profitMargin = netSold > 0 ? Math.round((terminalResult / netSold) * 100) : (totalPrizes > 0 ? -100 : 0);
  const prizeRatio = netSold > 0 ? Math.round((totalPrizes / netSold) * 100) : (totalPrizes > 0 ? 100 : 0);

  const movements = balanceData?.movements || [];
  const winningTickets = balanceData?.winningTickets || [];

  const filteredMovements = movementFilter === 'ALL'
    ? movements
    : movementFilter === 'GANADOR'
    ? movements.filter((m: any) => m.wonAmount > 0 || m.status === 'GANADOR' || m.status === 'GANADOR_PENDIENTE')
    : movements.filter((m: any) => m.type === movementFilter);

  // Impresión térmica del ticket oficial de balance
  const handlePrintBalanceReport = async () => {
    try {
      const termCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
      const pConfig = await printerService.getConfig(termCode);
      const is80 = pConfig.paperWidth === '80mm';
      const cols = is80 ? 48 : 32;
      const sep = '='.repeat(cols);
      const line = '-'.repeat(cols);

      const center = (txt: string) => {
        if (txt.length >= cols) return txt.slice(0, cols);
        const pad = Math.floor((cols - txt.length) / 2);
        return ' '.repeat(pad) + txt;
      };

      const padRow = (left: string, right: string) => {
        const space = cols - left.length - right.length;
        if (space <= 0) return `${left} ${right}`;
        return left + ' '.repeat(space) + right;
      };

      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });

      const ticketLines = [
        sep,
        center('BALANCE OFICIAL DE VENTAS'),
        center(isTerminalLosing ? '*** TERMINAL EN PERDIDA ***' : '*** TERMINAL EN GANANCIA ***'),
        center('BANCA LA EXPRESS · DOMINICANA'),
        sep,
        padRow('TERMINAL:', `#${termCode}`),
        padRow('VENDEDOR:', user.name || user.username),
        padRow('FECHA:', `${selectedDate}${selectedEndDate !== selectedDate ? ' al ' + selectedEndDate : ''}`),
        padRow('HORA EMISION:', timeStr),
        line,
        padRow('VENTAS BRUTAS:', `RD$ ${grossSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('ANULACIONES/DEV.:', `RD$ ${(voidedAmount + refundAmount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('VENTAS NETAS:', `RD$ ${netSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('TOTAL BOLETOS:', `${ticketsCount}`),
        line,
        padRow('TOTAL PREMIOS:', `RD$ ${totalPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('PREMIOS PAGADOS:', `RD$ ${paidPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('PREMIOS PENDIENTES:', `RD$ ${pendingPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('TICKETS GANADORES:', `${winningCount}`),
        line,
        sep,
        center(isTerminalLosing ? '>>> ESTADO: TERMINAL PIERDE <<<' : '>>> ESTADO: TERMINAL GANA <<<'),
        padRow(isTerminalLosing ? 'PERDIDA NETA:' : 'GANANCIA NETA:', `${isTerminalLosing ? '-RD$ ' : '+RD$ '}${Math.abs(terminalResult).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('MARGEN OPERATIVO:', `${profitMargin}%`),
        sep,
        padRow(`COMISION (${commissionRate}%):`, `RD$ ${commissionAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow(isCashNegative ? 'SALDO A REPONER CAJA:' : 'BALANCE A ENTREGAR:', `RD$ ${netBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        line,
        '',
        center('FIRMA CAJERO / VENDEDOR:'),
        center('________________________________'),
        '',
        sep,
        center('*** COMPROBANTE OFICIAL DE BALANCE ***'),
        ''
      ];

      const ticketText = ticketLines.join('\n');
      printerService.triggerHardwarePrint(ticketText, `BalanceVentas_${termCode}_${selectedDate}`, pConfig.paperWidth, pConfig.printDensity);
      setPrintNotice('🖨️ Reporte de balance enviado a la impresora térmica.');
      setTimeout(() => setPrintNotice(null), 3500);
    } catch (err: any) {
      setPrintNotice('Error imprimiendo: ' + (err?.message || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters Card */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-800/60">
              <Wallet className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Balance de Ventas del Vendedor
            </h2>
            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {isAdmin ? 'Modo Administrador' : `Terminal: #${user.terminalCode || user.username}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cálculo automático en tiempo real de ventas, premios ganadores, detección de pérdidas y balance de caja.
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Presets */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => handleSetQuickDate('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => handleSetQuickDate('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateRange === 'yesterday'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ayer
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedEndDate(e.target.value);
                setDateRange('custom');
              }}
              className="bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-none text-xs font-bold"
            />
          </div>

          {/* Admin Seller Selector */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <UserIcon className="w-3.5 h-3.5 text-blue-500" />
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-none text-xs font-bold cursor-pointer"
              >
                <option value="ALL">Todas las Terminales</option>
                {balanceData?.sellers?.map((s: any) => (
                  <option key={s.id} value={s.terminalCode || s.username || s.id}>
                    {s.name} (#{s.terminalCode || s.username})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-cyan-300">
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user.name || user.username}</span>
            </div>
          )}

          {/* Botón Recargas */}
          <button
            type="button"
            onClick={() => setShowRecargasModal(true)}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800/80 rounded-xl transition-all text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Vender Recargas Telefónicas Claro, Altice, Viva"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Recargas</span>
          </button>

          {/* Botón Productos */}
          <button
            type="button"
            onClick={() => setShowProductosModal(true)}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition-all text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Vender Productos, Pines Digitales y Servicios"
          >
            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Productos</span>
          </button>

          {/* Botón Imprimir Comprobante */}
          <button
            onClick={handlePrintBalanceReport}
            className="px-3.5 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Imprimir comprobante térmico de balance"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir Balance</span>
          </button>

          <button
            onClick={fetchBalance}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Refrescar balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {printNotice && (
        <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>{printNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-bold">
          {error}
        </div>
      )}

      {/* ========================================================
          BANNER DINÁMICO DE ESTADO OPERATIVO (PERDIENDO VS GANANDO)
          ======================================================== */}
      {isTerminalLosing ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-red-500/20 border-2 border-rose-500/50 text-rose-950 dark:text-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="p-3 rounded-2xl bg-rose-600 text-white shrink-0 shadow-lg shadow-rose-600/30">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-rose-600 text-white tracking-wider shadow-xs">
                  ⚠️ TERMINAL EN PÉRDIDA / EN NEGATIVO
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                  -RD$ {lossAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                La terminal ha vendido <strong className="font-mono text-slate-950 dark:text-white">RD$ {netSold.toLocaleString()}</strong>, pero acumula <strong className="font-mono text-rose-600 dark:text-rose-400">RD$ {totalPrizes.toLocaleString()}</strong> en premios de tickets premiados.
                El sistema recalcula que la terminal se encuentra <strong className="underline decoration-rose-500 decoration-2 font-black text-rose-700 dark:text-rose-300">perdiendo con RD$ -{lossAmount.toLocaleString()}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ganadores')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Ver {winningCount} Tickets Premiados</span>
            </button>
            <button
              type="button"
              onClick={handlePrintBalanceReport}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white tracking-wider">
                  TERMINAL EN GANANCIA
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  +RD$ {profitAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Las ventas netas (RD$ {netSold.toLocaleString()}) superan a los premios otorgados (RD$ {totalPrizes.toLocaleString()}). Margen de beneficio: <strong>{profitMargin}%</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={handlePrintBalanceReport}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Balance</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          2. RESUMEN KPI DEL BALANCE CON RECÁLCULO DE PÉRDIDAS
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* KPI 1: Total Vendido (Bruto) */}
        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ventas Brutas</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            RD$ {grossSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {ticketsCount} tickets emitidos
          </p>
        </div>

        {/* KPI 2: Anulaciones & Devoluciones */}
        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Anulaciones
            </span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            RD$ {(voidedAmount + refundAmount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {voidedCount + refundCount} cancelados
          </p>
        </div>

        {/* KPI 3: Ventas Netas */}
        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Ventas Netas
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            RD$ {netSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Total sin cancelaciones
          </p>
        </div>

        {/* KPI 4: Total Premios de Tickets Ganadores */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          totalPrizes > 0
            ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/30'
            : 'bg-white dark:bg-[#0d172a] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Premios
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            RD$ {totalPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {winningCount} ganador(es) ({paidCount} pagados)
          </p>
        </div>

        {/* KPI 5: Comisión del Vendedor */}
        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Comisión ({commissionRate}%)
            </span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            RD$ {commissionAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Ganancia vendedor
          </p>
        </div>

        {/* KPI 6: RESULTADO OPERATIVO (VENTAS VS PREMIOS) - Recálculo de pérdida */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 relative overflow-hidden ${
          isTerminalLosing
            ? 'bg-gradient-to-br from-rose-500/20 via-red-500/15 to-rose-500/5 border-rose-500/60 text-rose-950 dark:text-rose-100'
            : 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              {isTerminalLosing ? (
                <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  PERDIENDO
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  GANANCIA
                </span>
              )}
            </span>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
              isTerminalLosing
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {isTerminalLosing ? 'NEGATIVO' : 'POSITIVO'}
            </span>
          </div>

          <div className={`text-lg sm:text-xl font-black font-mono tabular-nums ${
            isTerminalLosing
              ? 'text-rose-700 dark:text-rose-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}>
            {isTerminalLosing ? `-RD$ ${lossAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : `+RD$ ${profitAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
          </div>

          <p className="text-[10px] font-mono opacity-80 truncate">
            {isTerminalLosing ? 'Premios superan ventas' : 'Ventas superan premios'}
          </p>
        </div>

        {/* KPI 7: Balance Físico de Caja a Entregar / Liquidar */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          isCashNegative
            ? 'bg-rose-600/15 border-rose-600/40 text-rose-950 dark:text-rose-100'
            : 'bg-teal-500/15 border-teal-500/40 text-teal-950 dark:text-teal-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isCashNegative ? 'Déficit de Caja' : 'Caja a Entregar'}
            </span>
            <Wallet className={`w-4 h-4 ${isCashNegative ? 'text-rose-600' : 'text-teal-600'}`} />
          </div>

          <div className={`text-lg sm:text-xl font-black font-mono tabular-nums ${
            isCashNegative ? 'text-rose-700 dark:text-rose-400' : 'text-teal-700 dark:text-teal-400'
          }`}>
            RD$ {netBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>

          <p className="text-[10px] font-mono opacity-85">
            {isCashNegative ? 'La banca debe reponer' : 'Efectivo en caja'}
          </p>
        </div>
      </div>

      {/* ========================================================
          3. TERMÓMETRO VISUAL: RENTABILIDAD & FÓRMULA DE RECÁLCULO
          ======================================================== */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Análisis de Rentabilidad: Ventas vs Premios
              </h3>
              <p className="text-[11px] text-slate-400">
                Fórmula de recálculo: Ventas Netas - Total Premios de Tickets = Resultado de la Terminal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-black font-mono px-3 py-1 rounded-xl ${
              isTerminalLosing
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}>
              {isTerminalLosing ? `PERDIENDO (-RD$ ${lossAmount.toLocaleString()})` : `GANANDO (+RD$ ${profitAmount.toLocaleString()})`}
            </span>
          </div>
        </div>

        {/* Ecuación Visual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              (+) Ventas Netas
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              RD$ {netSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              (-) Premios Generados
            </span>
            <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
              RD$ {totalPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-0.5 ${
            isTerminalLosing
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-100'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              (=) Estado Terminal
            </span>
            <span className={`text-base sm:text-lg font-black ${
              isTerminalLosing ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {isTerminalLosing ? `-RD$ ${lossAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : `+RD$ ${profitAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* Barra de progreso de premios vs ventas */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              Impacto de premios sobre ventas netas:
            </span>
            <span className={`font-mono font-black ${isTerminalLosing ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {prizeRatio}% otorgado en premios
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all ${
                isTerminalLosing ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, prizeRatio)}%` }}
              title={`Premios: ${prizeRatio}%`}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          4. TABS: HISTORIAL DE MOVIMIENTOS & TICKETS GANADORES
          ======================================================== */}
      <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('movimientos')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'movimientos'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Todos los Movimientos ({movements.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ganadores')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ganadores'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Tickets Ganadores ({winningTickets.length})</span>
            </button>
          </div>

          {/* Filtros de Tipo de Movimiento (cuando activeTab === 'movimientos') */}
          {activeTab === 'movimientos' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setMovementFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  movementFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setMovementFilter('VENTA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  movementFilter === 'VENTA'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                Ventas
              </button>
              <button
                onClick={() => setMovementFilter('ANULACION')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  movementFilter === 'ANULACION'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                }`}
              >
                Anulaciones
              </button>
              <button
                onClick={() => setMovementFilter('PAGO_PREMIO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  movementFilter === 'PAGO_PREMIO'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                }`}
              >
                Premios Pagados
              </button>
              <button
                onClick={() => setMovementFilter('GANADOR')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  movementFilter === 'GANADOR'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                }`}
              >
                Premios de Tickets
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: MOVIMIENTOS GENERALES */}
        {activeTab === 'movimientos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Hora / Fecha</th>
                  <th className="px-4 py-3">Tipo Movimiento</th>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Loterías</th>
                  <th className="px-4 py-3">Vendedor / Terminal</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-sans">
                      No se registran movimientos para esta terminal en la fecha seleccionada.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m: any) => {
                    const isSale = m.type === 'VENTA';
                    const isVoid = m.type === 'ANULACION';
                    const isPay = m.type === 'PAGO_PREMIO';

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{m.time}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{m.date}</div>
                        </td>

                        <td className="px-4 py-3">
                          {isSale && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              + VENTA
                            </span>
                          )}
                          {isVoid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                              ✕ ANULACIÓN
                            </span>
                          )}
                          {isPay && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                              🏆 {m.status === 'GANADOR_PENDIENTE' ? 'PREMIO GANADO' : 'PAGO PREMIO'}
                            </span>
                          )}
                          {m.type === 'DEVOLUCION' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                              ↺ DEVOLUCIÓN
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => handleOpenTicketModal(m.ticketNumber)}
                            className="hover:underline text-blue-600 dark:text-cyan-400 cursor-pointer"
                            title="Ver detalle del ticket"
                          >
                            #{m.ticketNumber}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-sans text-xs">
                          {m.lotteries?.join(', ') || 'Sorteo'}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {m.sellerName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Terminal #{m.terminalCode}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-black">
                          {isSale && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              RD$ {m.amount.toLocaleString()}
                            </span>
                          )}
                          {isVoid && (
                            <span className="text-rose-500 line-through">
                              RD$ {m.amount.toLocaleString()}
                            </span>
                          )}
                          {isPay && (
                            <span className="text-amber-600 dark:text-amber-400">
                              - RD$ {m.amount.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenTicketModal(m.ticketNumber)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Ver y reimprimir comprobante"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: DETALLE DE TICKETS GANADORES QUE IMPACTAN LA TERMINAL */}
        {activeTab === 'ganadores' && (
          <div className="overflow-x-auto">
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>
                  Tickets premiados registrados en esta terminal (Total en premios: <strong className="font-mono">RD$ {totalPrizes.toLocaleString()}</strong>)
                </span>
              </span>
              <span className="text-[11px] font-mono font-bold">
                {winningTickets.length} ticket(s)
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Hora / Fecha</th>
                  <th className="px-4 py-3">Loterías</th>
                  <th className="px-4 py-3 text-right">Monto Apostado</th>
                  <th className="px-4 py-3 text-right">Premio Ganado</th>
                  <th className="px-4 py-3 text-center">Estado Premio</th>
                  <th className="px-4 py-3 text-center">Ver Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {winningTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-sans">
                      No hay tickets premiados en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  winningTickets.map((wt: any) => (
                    <tr
                      key={wt.id}
                      className="hover:bg-amber-500/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => handleOpenTicketModal(wt.ticketNumber)}
                          className="hover:underline text-blue-600 dark:text-cyan-400 cursor-pointer"
                        >
                          #{wt.ticketNumber}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{wt.time}</div>
                        <div className="text-[10px] text-slate-400">{wt.date}</div>
                      </td>

                      <td className="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">
                        {wt.lotteries?.join(', ') || 'Sorteo'}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                        RD$ {wt.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                        RD$ {wt.totalWon.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {wt.status === 'PAGADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            ✓ PAGADO EN CAJA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 animate-pulse">
                            ● PREMIO PENDIENTE
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenTicketModal(wt.ticketNumber)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Ver y reimprimir comprobante"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Ticket y Reimpresión Térmica 58mm */}
      {selectedTicketToView && (
        <ThermalTicketModal
          ticket={selectedTicketToView}
          onClose={() => setSelectedTicketToView(null)}
        />
      )}

      {/* Modal de Recargas Telefónicas */}
      {showRecargasModal && (
        <RecargasModal
          isOpen={showRecargasModal}
          onClose={() => setShowRecargasModal(false)}
          user={user}
          onSuccess={() => fetchBalance()}
        />
      )}

      {/* Modal de Productos & Servicios */}
      {showProductosModal && (
        <ProductosModal
          isOpen={showProductosModal}
          onClose={() => setShowProductosModal(false)}
          user={user}
          onSuccess={() => fetchBalance()}
        />
      )}
    </div>
  );
};
