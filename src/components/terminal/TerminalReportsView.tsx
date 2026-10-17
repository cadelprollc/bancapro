import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Ticket } from '../../types/index';
import {
  Calendar,
  DollarSign,
  Award,
  TrendingUp,
  TrendingDown,
  Ticket as TicketIcon,
  Search,
  Eye,
  Filter,
  ArrowLeft,
  Printer,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { ThermalTicketModal } from '../pos/ThermalTicketModal';
import { printerService } from '../../services/printerService';

interface TerminalReportsViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const TerminalReportsView: React.FC<TerminalReportsViewProps> = ({ user, onNavigateTab }) => {
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GANADOR' | 'PAGADO' | 'PERDEDOR' | 'PENDIENTE'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getTerminalReport(terminalCode, startDate, endDate);
      setReport(data);
    } catch (err: any) {
      console.error('Error obteniendo reporte de terminal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [terminalCode, startDate, endDate]);

  // Set quick date preset
  const setQuickDate = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    if (preset === 'today') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
      setStartDate(y);
      setEndDate(y);
    } else if (preset === 'week') {
      const start = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(today);
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(today);
    }
  };

  // Calculations
  const tickets: Ticket[] = report?.tickets || [];
  const totalSold = report?.totalSold || 0;
  const totalPrizes = report?.totalPrizes || 0;
  const netProfit = report?.netProfit || (totalSold - totalPrizes);
  const isWinning = netProfit >= 0;

  // Additional stats
  const ticketsGanadores = tickets.filter((t) => t.status === 'GANADOR' || t.status === 'PAGADO');
  const ticketsPagados = tickets.filter((t) => t.status === 'PAGADO');
  const ticketsPendientesPago = tickets.filter((t) => t.status === 'GANADOR');
  const prizesPaid = ticketsPagados.reduce((sum, t) => sum + (t.totalWon || 0), 0);
  const prizesPending = ticketsPendientesPago.reduce((sum, t) => sum + (t.totalWon || 0), 0);

  const commissionRate = 0.10; // 10% de comisión de la terminal
  const commissionAmount = Math.round(totalSold * commissionRate);
  const netBalanceToDeliver = totalSold - prizesPaid - commissionAmount;

  // Ratio de retorno de premios (% de las ventas que se fue en premios)
  const prizeRatio = totalSold > 0 ? Math.round((totalPrizes / totalSold) * 100) : 0;
  // Margen de beneficio neto (% que queda de ganancia o pérdida)
  const profitMargin = totalSold > 0 ? Math.round((netProfit / totalSold) * 100) : 0;

  // Breakdown by Lottery
  const lotteryBreakdown: Record<string, { name: string; sold: number; prizes: number; net: number; count: number }> = {};
  // Breakdown by Play Type
  const playTypeBreakdown: Record<string, { name: string; sold: number; prizes: number; net: number; count: number }> = {};

  tickets.forEach((t) => {
    t.plays?.forEach((p) => {
      // Lottery
      const lotName = p.lotteryName || 'Lotería';
      if (!lotteryBreakdown[lotName]) {
        lotteryBreakdown[lotName] = { name: lotName, sold: 0, prizes: 0, net: 0, count: 0 };
      }
      lotteryBreakdown[lotName].sold += p.amount || 0;
      lotteryBreakdown[lotName].count += 1;

      // Play Type
      const playType = p.playType || 'QUINIELA';
      if (!playTypeBreakdown[playType]) {
        playTypeBreakdown[playType] = { name: playType, sold: 0, prizes: 0, net: 0, count: 0 };
      }
      playTypeBreakdown[playType].sold += p.amount || 0;
      playTypeBreakdown[playType].count += 1;
    });

    if (t.totalWon > 0 && t.plays && t.plays.length > 0) {
      const primaryLot = t.plays[0].lotteryName || 'Lotería';
      if (lotteryBreakdown[primaryLot]) {
        lotteryBreakdown[primaryLot].prizes += t.totalWon;
        lotteryBreakdown[primaryLot].net = lotteryBreakdown[primaryLot].sold - lotteryBreakdown[primaryLot].prizes;
      }
      const primaryType = t.plays[0].playType || 'QUINIELA';
      if (playTypeBreakdown[primaryType]) {
        playTypeBreakdown[primaryType].prizes += t.totalWon;
        playTypeBreakdown[primaryType].net = playTypeBreakdown[primaryType].sold - playTypeBreakdown[primaryType].prizes;
      }
    }
  });

  // Imprimir Ticket Térmico de Reporte de Ganancias / Pérdidas
  const handlePrintFinancialReport = async () => {
    try {
      const pConfig = await printerService.getConfig(terminalCode);
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
        center('REPORTE FINANCIERO DE TERMINAL'),
        center('VENTAS, PREMIOS Y GANANCIAS/PERDIDAS'),
        center('BANCA LA EXPRESS · DOMINICANA'),
        sep,
        padRow('TERMINAL:', `#${terminalCode}`),
        padRow('CAJERO:', user.name || 'Cajero Principal'),
        padRow('PERIODO:', `${startDate} al ${endDate}`),
        padRow('HORA IMPRESION:', timeStr),
        line,
        padRow('CUANTO SE HA VENDIDO:', `RD$ ${totalSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('TICKETS EMITIDOS:', `${report?.ticketsCount || 0}`),
        padRow('JUGADAS REGISTRADAS:', `${report?.totalPlays || 0}`),
        line,
        padRow('CUANTO HUBO DE PREMIOS:', `RD$ ${totalPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('PREMIOS PAGADOS:', `RD$ ${prizesPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('PREMIOS PENDIENTES:', `RD$ ${prizesPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('TICKETS GANADORES:', `${report?.winningTickets || 0}`),
        line,
        sep,
        center(isWinning ? '*** RESULTADO: LA BANCA GANA ***' : '*** RESULTADO: LA BANCA PIERDE ***'),
        padRow(isWinning ? 'GANANCIA NETA:' : 'PERDIDA NETA:', `${isWinning ? '+' : '-'}RD$ ${Math.abs(netProfit).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('MARGEN DE RENTABILIDAD:', `${profitMargin}%`),
        sep,
        padRow('COMISION TERMINAL (10%):', `RD$ ${commissionAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('BALANCE A ENTREGAR:', `RD$ ${netBalanceToDeliver.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        line,
        '',
        center('FIRMA SUPERVISOR / CAJERO:'),
        center('________________________________'),
        '',
        sep,
        center('*** COMPROBANTE OFICIAL DE REPORTE ***'),
        ''
      ];

      const ticketText = ticketLines.join('\n');
      printerService.triggerHardwarePrint(ticketText, `ReporteFinanciero_${terminalCode}_${startDate}`, pConfig.paperWidth, pConfig.printDensity);

      setPrintNotice('🖨️ Reporte financiero enviado a la impresora térmica exitosamente.');
      setTimeout(() => setPrintNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      setPrintNotice('Error imprimiendo reporte: ' + (err?.message || 'Error desconocido'));
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDIENTE') {
        if (t.status !== 'PENDIENTE' && t.status !== 'VIGENTE') return false;
      } else if (t.status !== statusFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.verificationCode?.toLowerCase().includes(q) ||
        t.plays?.some((p) => p.lotteryName?.toLowerCase().includes(q) || p.numbers?.join('-').includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      {/* 1. Header with Title & Date Filters */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('sales')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              title="Volver a la Terminal de Ventas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">📈</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Reporte de Ventas, Premios y Rentabilidad
              </h1>
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Terminal #{terminalCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cajero: <strong className="text-slate-800 dark:text-slate-200">{user.name || user.username}</strong> · Visualización detallada de cuánto se vendió, cuánto hubo de premios y si la banca gana o pierde
            </p>
          </div>
        </div>

        {/* Action Buttons: Print Report & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrintFinancialReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            title="Imprimir ticket térmico de reporte financiero"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimir en Ticket</span>
          </button>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar & Presets */}
      <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Rango:</span>
          <button
            onClick={() => setQuickDate('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              startDate === today && endDate === today
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setQuickDate('yesterday')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            Ayer
          </button>
          <button
            onClick={() => setQuickDate('week')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => setQuickDate('month')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            Este Mes
          </button>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Print Notice Banner */}
      {printNotice && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Printer className="w-4 h-4 shrink-0 text-blue-500" />
          <span>{printNotice}</span>
        </div>
      )}

      {/* ========================================================
          2. LAS 3 MÉTRICAS PRINCIPALES EXIGIDAS:
          - CUÁNTO SE HA VENDIDO
          - CUÁNTO HUBO DE PREMIOS
          - CUÁNTO GANA O PIERDE
          ======================================================== */}
      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. CUÁNTO SE HA VENDIDO */}
            <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Cuánto se ha Vendido
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Total Ventas Netas
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {report.ticketsCount} tickets
                </span>
              </div>

              <div className="my-4">
                <div className="font-mono text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  RD$ {totalSold.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ingreso total registrado por la terminal en el corte
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Jugadas:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{report.totalPlays || 0} jugadas</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase block">Promedio Ticket:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    RD$ {report.ticketsCount > 0 ? Math.round(totalSold / report.ticketsCount).toLocaleString() : '0'}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. CUÁNTO HUBO DE PREMIOS */}
            <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-amber-500/30 dark:border-amber-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between bg-amber-500/5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/40 dark:border-amber-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                      Cuánto hubo de Premios
                    </span>
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Premios Determinados
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {report.winningTickets} ganadores
                </span>
              </div>

              <div className="my-4">
                <div className="font-mono text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                  RD$ {totalPrizes.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
                  Monto total ganado por los clientes ({prizeRatio}% de las ventas)
                </p>
              </div>

              <div className="pt-3 border-t border-amber-200/40 dark:border-amber-900/40 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-amber-700/80 dark:text-amber-400/80 text-[10px] uppercase block">Pagados en Caja:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">RD$ {prizesPaid.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="text-amber-700/80 dark:text-amber-400/80 text-[10px] uppercase block">Por Pagar:</span>
                  <strong className="text-amber-600 dark:text-amber-400">RD$ {prizesPending.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* 3. CUÁNTO GANA O PIERDE (ESTADO FINANCIERO DESTACADO) */}
            <div
              className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
                isWinning
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-400/30'
                  : 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/30'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      isWinning
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-rose-600 text-white shadow-sm'
                    }`}
                  >
                    {isWinning ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block">
                      Cuánto Gana o Pierde
                    </span>
                    <span className="text-xs font-bold">
                      {isWinning ? 'Rentabilidad a Favor' : 'Déficit del Período'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isWinning
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white shadow-xs animate-pulse'
                  }`}
                >
                  {isWinning ? 'GANA' : 'PIERDE'}
                </span>
              </div>

              <div className="my-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black tabular-nums tracking-tight">
                    {isWinning ? '+' : '-'}RD$ {Math.abs(netProfit).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
                  {isWinning ? (
                    <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Margen neto positivo: +{profitMargin}% sobre ventas
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Alerta: Los premios superaron a las ventas
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 dark:border-white/10 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="opacity-70 text-[10px] uppercase block">Comisión (10%):</span>
                  <strong>RD$ {commissionAmount.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="opacity-70 text-[10px] uppercase block">A Entregar:</span>
                  <strong>RD$ {netBalanceToDeliver.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Comparativa Visual Gráfica (Barra de Distribución Financiera) */}
          <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Termómetro de Rentabilidad: Ventas vs Premios vs Beneficio</span>
              </span>
              <span className="font-mono font-bold text-slate-500">
                Total Operado: RD$ {totalSold.toLocaleString()}
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-200 dark:border-slate-700">
              {/* Premios Bar */}
              <div
                className="h-full bg-amber-500 rounded-l-full transition-all flex items-center justify-center text-[10px] font-black text-slate-950 font-mono"
                style={{ width: `${Math.min(100, prizeRatio)}%` }}
                title={`Premios Otorgados: ${prizeRatio}%`}
              >
                {prizeRatio > 12 && `${prizeRatio}% Premios`}
              </div>
              {/* Ganancia / Pérdida Bar */}
              <div
                className={`h-full rounded-r-full transition-all flex items-center justify-center text-[10px] font-black text-white font-mono ${
                  isWinning ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
                style={{ width: `${Math.max(0, 100 - prizeRatio)}%` }}
                title={isWinning ? `Ganancia Neta: ${profitMargin}%` : 'Pérdida'}
              >
                {100 - prizeRatio > 12 && (isWinning ? `${profitMargin}% Ganancia` : 'Pérdida')}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Premios: RD$ {totalPrizes.toLocaleString()} ({prizeRatio}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isWinning ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                <span>{isWinning ? 'Ganancia Neta' : 'Pérdida Neta'}: RD$ {Math.abs(netProfit).toLocaleString()} ({profitMargin}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. DESGLOSE POR LOTERÍA & DESGLOSE POR TIPO DE JUGADA
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Desglose por Lotería */}
        <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Ventas, Premios y Rentabilidad por Sorteo</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {Object.keys(lotteryBreakdown).length} sorteos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2">Sorteo</th>
                  <th className="px-3 py-2 text-right">Vendido</th>
                  <th className="px-3 py-2 text-right">Premios</th>
                  <th className="px-3 py-2 text-right">Gana / Pierde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.keys(lotteryBreakdown).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      No hay registros en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  Object.values(lotteryBreakdown).map((lot) => {
                    const diff = lot.sold - lot.prizes;
                    const lotWins = diff >= 0;
                    return (
                      <tr key={lot.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {lot.name}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                          RD$ {lot.sold.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-600 tabular-nums">
                          RD$ {lot.prizes.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-black tabular-nums">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              lotWins
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {lotWins ? '+' : '-'}RD$ {Math.abs(diff).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desglose por Tipo de Jugada */}
        <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Rendimiento por Modalidad de Jugada</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Quiniela / Palé / Tripleta
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2">Modalidad</th>
                  <th className="px-3 py-2 text-right">Vendido</th>
                  <th className="px-3 py-2 text-right">Premios</th>
                  <th className="px-3 py-2 text-right">Gana / Pierde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.keys(playTypeBreakdown).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      No hay registros en el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  Object.values(playTypeBreakdown).map((pt) => {
                    const diff = pt.sold - pt.prizes;
                    const ptWins = diff >= 0;
                    return (
                      <tr key={pt.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {pt.name}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                          RD$ {pt.sold.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-600 tabular-nums">
                          RD$ {pt.prizes.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-black tabular-nums">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              ptWins
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {ptWins ? '+' : '-'}RD$ {Math.abs(diff).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. TABLA DETALLADA DE TICKETS DEL PERÍODO
          ======================================================== */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-blue-500" />
              <span>Tickets Emitidos en el Período</span>
            </h3>
            <p className="text-xs text-slate-400">
              Mostrando {filteredTickets.length} de {tickets.length} tickets
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Tabs */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('GANADOR')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'GANADOR'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Ganadores
              </button>
              <button
                onClick={() => setStatusFilter('PAGADO')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'PAGADO'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Pagados
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none w-36 sm:w-48 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Número Ticket</th>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Jugadas</th>
                <th className="px-4 py-3 text-right">Vendido (RD$)</th>
                <th className="px-4 py-3 text-right">Premio (RD$)</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron tickets en el período con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {t.ticketNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 tabular-nums">
                      {t.date} {t.time}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {t.plays.length} jugada{t.plays.length > 1 ? 's' : ''}
                      </span>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {t.plays.map((p) => `${p.lotteryName}: ${p.numbers.join('-')}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      RD$ {t.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {t.totalWon > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-black">
                          RD$ {t.totalWon.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          t.status === 'GANADOR'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : t.status === 'PAGADO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : t.status === 'PERDEDOR'
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : t.status === 'ANULADO'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Ticket</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <ThermalTicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};
