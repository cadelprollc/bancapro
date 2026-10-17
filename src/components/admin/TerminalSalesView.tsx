import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import {
  User,
  TerminalSalesSummary,
  TerminalSalesPerformance,
  TerminalSalesOperation,
  SalesAuditRecord,
} from '../../types/index';
import {
  TrendingUp,
  DollarSign,
  Trophy,
  Percent,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Building2,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  ArrowRight,
  ChevronRight,
  History,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface TerminalSalesViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type SortOption =
  | 'ventas_desc'
  | 'ventas_asc'
  | 'premios_desc'
  | 'comision_desc'
  | 'ganancia_desc'
  | 'ganancia_asc'
  | 'terminal_asc';

export const TerminalSalesView: React.FC<TerminalSalesViewProps> = ({ user, onNavigateTab }) => {
  // Navigation & Sub-views
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'audit'>('summary');

  // Date Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [commissionRate, setCommissionRate] = useState<number>(15); // 15% configurable

  // Data State
  const [summary, setSummary] = useState<TerminalSalesSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<SalesAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Sorting & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [alertFilter, setAlertFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('ventas_desc');

  // Terminal Detail Modal / Slide-over State
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalSalesPerformance | null>(null);
  const [terminalOperations, setTerminalOperations] = useState<TerminalSalesOperation[]>([]);
  const [loadingOps, setLoadingOps] = useState<boolean>(false);
  const [inspectedTicket, setInspectedTicket] = useState<TerminalSalesOperation | null>(null);

  // Calculate actual startDate and endDate based on datePreset
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (datePreset === 'today') {
      return { effectiveStart: todayStr, effectiveEnd: todayStr };
    }
    if (datePreset === 'yesterday') {
      const y = new Date(now.getTime() - 86400000);
      const yStr = y.toISOString().split('T')[0];
      return { effectiveStart: yStr, effectiveEnd: yStr };
    }
    if (datePreset === 'week') {
      // Monday of current week
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return { effectiveStart: monday.toISOString().split('T')[0], effectiveEnd: todayStr };
    }
    if (datePreset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { effectiveStart: firstDay.toISOString().split('T')[0], effectiveEnd: todayStr };
    }
    return {
      effectiveStart: customStartDate || todayStr,
      effectiveEnd: customEndDate || todayStr,
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch data from server
  const loadSummaryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, logsRes] = await Promise.all([
        api.getTerminalSalesPerformance({
          consorcioId: user.consorcioId,
          startDate: effectiveStart,
          endDate: effectiveEnd,
          commissionRate,
        }),
        api.getTerminalSalesAudit({
          consorcioId: user.consorcioId,
        }),
      ]);
      setSummary(sumRes);
      setAuditLogs(logsRes);
    } catch (err: any) {
      setError(err.message || 'Error cargando ventas por terminal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [effectiveStart, effectiveEnd, commissionRate, user.consorcioId]);

  // When a terminal is selected, load its detailed ticket operations
  const handleSelectTerminal = async (term: TerminalSalesPerformance) => {
    setSelectedTerminal(term);
    setLoadingOps(true);
    try {
      const ops = await api.getTerminalTicketsDetail(term.terminalCode, {
        consorcioId: user.consorcioId,
        startDate: effectiveStart,
        endDate: effectiveEnd,
      });
      setTerminalOperations(ops);
    } catch (err: any) {
      console.error('Error cargando operaciones de la terminal:', err);
    } finally {
      setLoadingOps(false);
    }
  };

  // Sorting and Filtering logic
  const displayedTerminals = useMemo(() => {
    if (!summary?.terminales) return [];

    let list = [...summary.terminales];

    // Search filter
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.terminalCode.toLowerCase().includes(s) ||
          t.bancaName.toLowerCase().includes(s) ||
          t.assignedUsername.toLowerCase().includes(s) ||
          (t.deviceId && t.deviceId.toLowerCase().includes(s))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.terminalStatus === statusFilter);
    }

    // Alert filter
    if (alertFilter !== 'ALL') {
      list = list.filter((t) => t.alerts.includes(alertFilter));
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'ventas_desc') return b.ventas - a.ventas;
      if (sortBy === 'ventas_asc') return a.ventas - b.ventas;
      if (sortBy === 'premios_desc') return b.premios - a.premios;
      if (sortBy === 'comision_desc') return b.comision - a.comision;
      if (sortBy === 'ganancia_desc') return b.gananciaNeta - a.gananciaNeta;
      if (sortBy === 'ganancia_asc') return a.gananciaNeta - b.gananciaNeta;
      if (sortBy === 'terminal_asc') return a.terminalCode.localeCompare(b.terminalCode);
      return 0;
    });

    return list;
  }, [summary, searchTerm, statusFilter, alertFilter, sortBy]);

  // Export to Excel / CSV (Requirement 9)
  const handleExportCSV = () => {
    if (!summary?.terminales) return;

    const headers = [
      'Terminal',
      'Banca',
      'Cajero',
      'Dispositivo',
      'Estado',
      'Ventas_RD',
      'Premios_RD',
      'Comision_Porc',
      'Comision_RD',
      'Ganancia_Neta_RD',
      'Tickets_Vendidos',
      'Tickets_Premiados',
      'Tickets_Anulados',
      'Monto_Anulado_RD',
      'Ultima_Venta',
      'Alertas',
    ];

    const rows = displayedTerminals.map((t) => [
      `"${t.terminalCode}"`,
      `"${t.bancaName.replace(/"/g, '""')}"`,
      `"${t.assignedUsername}"`,
      `"${t.deviceId || 'N/A'}"`,
      `"${t.terminalStatus}"`,
      t.ventas,
      t.premios,
      `${t.comisionPorcentaje}%`,
      t.comision,
      t.gananciaNeta,
      t.ticketsVendidos,
      t.ticketsPremiados,
      t.ticketsAnulados,
      t.montoAnulado,
      `"${t.ultimaVenta || 'N/A'}"`,
      `"${t.alerts.join('; ')}"`,
    ]);

    // Summary Totals row
    rows.push([
      '"TOTALES"',
      '"TODAS LAS BANCAS"',
      '""',
      '""',
      '""',
      summary.totales.ventasTotales,
      summary.totales.premiosTotales,
      `"${commissionRate}%"`,
      summary.totales.comisionesTotales,
      summary.totales.gananciaNeta,
      summary.totales.ticketsTotales,
      summary.totales.ticketsPremiados,
      0,
      0,
      '""',
      '""',
    ]);

    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Ventas_Por_Terminal_${effectiveStart}_al_${effectiveEnd}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report (Requirement 9)
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans print:p-0">
      {/* ========================================================
          1. HEADER & EXPORT ACTIONS
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Ventas por Terminal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control de ventas, premios, comisiones y rentabilidad neta por punto de venta
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Exportar Excel, PDF / Imprimir, Auditoría */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            title="Exportar a archivo Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-500/30 text-xs font-black hover:bg-blue-100 flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'summary' ? 'audit' : 'summary')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
              activeSubTab === 'audit'
                ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{activeSubTab === 'audit' ? 'Ver Resumen' : 'Auditoría de Ventas'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Header (Only visible on print) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h2 className="text-xl font-black uppercase text-slate-900">
          REPORTE DE VENTAS, PREMIOS Y GANANCIAS POR TERMINAL
        </h2>
        <p className="text-xs text-slate-600 font-bold mt-1">
          {summary?.consorcioName || 'Consorcio de Bancas'} · Período: {effectiveStart} al {effectiveEnd}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Comisión Aplicada: {commissionRate}% · Fórmula: Ganancia = Ventas - Premios - Comisión
        </p>
      </div>

      {/* ========================================================
          2. FILTROS POR FECHA & COMISIÓN (Requirement 3)
          ======================================================== */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Período:
            </span>

            {[
              { id: 'today', label: 'Hoy' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'week', label: 'Esta Semana' },
              { id: 'month', label: 'Este Mes' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => {
              const active = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDatePreset(p.id as DatePreset)}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Commission Configurator Pill */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Percent className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Comisión:
            </span>
            <select
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              className="text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="10">10%</option>
              <option value="12.5">12.5%</option>
              <option value="15">15% (Estándar)</option>
              <option value="18">18%</option>
              <option value="20">20%</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePreset === 'custom' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Desde:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Hasta:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <button
              type="button"
              onClick={loadSummaryData}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Filtrar
            </button>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold underline"
          >
            Descartar
          </button>
        </div>
      )}

      {/* ========================================================
          3. RESUMEN GENERAL DEL CONSORCIO (Requirement 5)
          ======================================================== */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Ventas Totales */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-black shrink-0">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                VENTAS TOTALES
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                RD$ {summary.totales.ventasTotales.toLocaleString()}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                {summary.totales.ticketsTotales} ticket(s) vendidos
              </span>
            </div>
          </div>

          {/* Card 2: Premios */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                PREMIOS
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                RD$ {summary.totales.premiosTotales.toLocaleString()}
              </h3>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                {summary.totales.ticketsPremiados} ticket(s) ganadores
              </span>
            </div>
          </div>

          {/* Card 3: Comisiones */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0">
              <Percent className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                COMISIONES ({commissionRate}%)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                RD$ {summary.totales.comisionesTotales.toLocaleString()}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                Pago a puntos y cajeros
              </span>
            </div>
          </div>

          {/* Card 4: Ganancia Neta */}
          <div
            className={`p-5 rounded-3xl border shadow-xs flex items-center gap-4 ${
              summary.totales.gananciaNeta >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-500/30'
                : 'bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/20 dark:to-red-950/20 border-rose-500/30'
            }`}
          >
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                summary.totales.gananciaNeta >= 0
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              }`}
            >
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  GANANCIA NETA
                </span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-md ${
                    summary.totales.gananciaNeta >= 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {summary.totales.margenGananciaPorcentaje}% margen
                </span>
              </div>
              <h3
                className={`text-xl sm:text-2xl font-black font-mono tabular-nums ${
                  summary.totales.gananciaNeta >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                RD$ {summary.totales.gananciaNeta.toLocaleString()}
              </h3>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                Ventas - Premios - Comisión
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. ALERTAS AUTOMÁTICAS (Requirement 7)
          ======================================================== */}
      {summary && summary.alertasTotales > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2.5 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>
                Alertas detectadas en terminales ({summary.alertasTotales} caso(s))
              </span>
            </div>
            {alertFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setAlertFilter('ALL')}
                className="text-xs font-bold text-amber-700 dark:text-amber-300 underline"
              >
                Mostrar todas las terminales
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {summary.terminales.some((t) => t.alerts.includes('GANANCIA_NEGATIVA')) && (
              <button
                type="button"
                onClick={() => setAlertFilter(alertFilter === 'GANANCIA_NEGATIVA' ? 'ALL' : 'GANANCIA_NEGATIVA')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                  alertFilter === 'GANANCIA_NEGATIVA'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25'
                }`}
              >
                🚨 Ganancia Negativa ({summary.terminales.filter((t) => t.alerts.includes('GANANCIA_NEGATIVA')).length})
              </button>
            )}

            {summary.terminales.some((t) => t.alerts.includes('PREMIOS_SUPERIORES')) && (
              <button
                type="button"
                onClick={() => setAlertFilter(alertFilter === 'PREMIOS_SUPERIORES' ? 'ALL' : 'PREMIOS_SUPERIORES')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                  alertFilter === 'PREMIOS_SUPERIORES'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                }`}
              >
                ⚠️ Premios Superiores a Ventas ({summary.terminales.filter((t) => t.alerts.includes('PREMIOS_SUPERIORES')).length})
              </button>
            )}

            {summary.terminales.some((t) => t.alerts.includes('SIN_VENTAS')) && (
              <button
                type="button"
                onClick={() => setAlertFilter(alertFilter === 'SIN_VENTAS' ? 'ALL' : 'SIN_VENTAS')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                  alertFilter === 'SIN_VENTAS'
                    ? 'bg-slate-700 text-white border-slate-800'
                    : 'bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                🛑 Sin Ventas en el Período ({summary.terminales.filter((t) => t.alerts.includes('SIN_VENTAS')).length})
              </button>
            )}

            {summary.terminales.some((t) => t.alerts.includes('MUCHAS_ANULACIONES')) && (
              <button
                type="button"
                onClick={() => setAlertFilter(alertFilter === 'MUCHAS_ANULACIONES' ? 'ALL' : 'MUCHAS_ANULACIONES')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                  alertFilter === 'MUCHAS_ANULACIONES'
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                🔄 Muchas Anulaciones ({summary.terminales.filter((t) => t.alerts.includes('MUCHAS_ANULACIONES')).length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. SUBTAB: AUDITORÍA DE VENTAS (Requirement 8)
          ======================================================== */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <span>Historial de Auditoría de Operaciones de Ventas</span>
              </h3>
              <p className="text-xs text-slate-500">
                Registro inmutable de pagos de premios, anulaciones de tickets y modificaciones operativas.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSummaryData}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Refrescar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Terminal / Banca</th>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Operación</th>
                  <th className="py-3 px-4">Valor Anterior</th>
                  <th className="py-3 px-4">Valor Nuevo</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      No hay registros de auditoría de ventas en este período.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-DO')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {log.adminUsername}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold">
                        Terminal {log.terminalCode} ({log.bancaName})
                      </td>
                      <td className="py-3 px-4 font-black text-blue-600 dark:text-cyan-400">
                        {log.ticketNumber ? `#${log.ticketNumber}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                            log.operation === 'ANULACION_TICKET'
                              ? 'bg-rose-500/15 text-rose-600'
                              : log.operation === 'PAGO_PREMIO'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-slate-500/15 text-slate-700'
                          }`}
                        >
                          {log.operation.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {String(log.previousValue)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {String(log.newValue)}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          6. TABLA PRINCIPAL: RESUMEN POR TERMINAL (Requirements 1, 6 & 10)
          ======================================================== */}
      {activeSubTab === 'summary' && (
        <div className="space-y-4">
          {/* Search & Sort Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar terminal, banca, cajero o dispositivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="INACTIVE">Inactivas</option>
                <option value="BLOQUEADO">Bloqueadas</option>
              </select>

              {/* Sort Dropdown (Requirement 6) */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ventas_desc">Mayor Venta ↓</option>
                  <option value="ventas_asc">Menor Venta ↑</option>
                  <option value="ganancia_desc">Mayor Ganancia ↓</option>
                  <option value="ganancia_asc">Menor Ganancia ↑</option>
                  <option value="premios_desc">Mayor Premios ↓</option>
                  <option value="comision_desc">Mayor Comisión ↓</option>
                  <option value="terminal_asc">Terminal (0001...) ↑</option>
                </select>
              </div>

              <button
                type="button"
                onClick={loadSummaryData}
                disabled={loading}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Terminal</th>
                    <th className="py-3.5 px-4">Banca / Cajero</th>
                    <th className="py-3.5 px-4 text-right">Ventas</th>
                    <th className="py-3.5 px-4 text-right">Premios</th>
                    <th className="py-3.5 px-4 text-right">Comisión ({commissionRate}%)</th>
                    <th className="py-3.5 px-4 text-right">Ganancia Neta</th>
                    <th className="py-3.5 px-4 text-center">Tickets</th>
                    <th className="py-3.5 px-4 text-center print:hidden">Alertas</th>
                    <th className="py-3.5 px-4 text-right print:hidden">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedTerminals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-bold">No se encontraron terminales para este criterio</p>
                      </td>
                    </tr>
                  ) : (
                    displayedTerminals.map((t) => (
                      <tr
                        key={t.terminalId}
                        onClick={() => handleSelectTerminal(t)}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        {/* 1. Terminal Code + Hardware Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {t.terminalCode}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                t.terminalStatus === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : t.terminalStatus === 'BLOQUEADO'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                              title={`Estado: ${t.terminalStatus}`}
                            />
                          </div>
                          {t.deviceId && (
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[110px]">
                              {t.deviceId}
                            </span>
                          )}
                        </td>

                        {/* 2. Banca / Cajero */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                            {t.bancaName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Cajero: {t.assignedUsername}
                          </span>
                        </td>

                        {/* 3. Ventas */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm tabular-nums">
                          RD$ {t.ventas.toLocaleString()}
                        </td>

                        {/* 4. Premios */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-sm tabular-nums">
                          RD$ {t.premios.toLocaleString()}
                        </td>

                        {/* 5. Comisión */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          RD$ {t.comision.toLocaleString()}
                        </td>

                        {/* 6. Ganancia Neta (Ventas - Premios - Comisión) */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm tabular-nums">
                          <span
                            className={`px-2.5 py-1 rounded-xl inline-block ${
                              t.gananciaNeta >= 0
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black'
                            }`}
                          >
                            RD$ {t.gananciaNeta.toLocaleString()}
                          </span>
                        </td>

                        {/* 7. Tickets */}
                        <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                          <span className="font-black text-slate-700 dark:text-slate-300">
                            {t.ticketsVendidos}
                          </span>
                          {t.ticketsPremiados > 0 && (
                            <span className="text-amber-600 font-bold ml-1">
                              ({t.ticketsPremiados} 🏆)
                            </span>
                          )}
                        </td>

                        {/* 8. Alertas */}
                        <td className="py-3.5 px-4 text-center print:hidden">
                          {t.alerts.length === 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              Normal
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {t.alerts.includes('GANANCIA_NEGATIVA') && (
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Ganancia negativa" />
                              )}
                              {t.alerts.includes('PREMIOS_SUPERIORES') && (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Premios superan ventas" />
                              )}
                              {t.alerts.includes('SIN_VENTAS') && (
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" title="Sin ventas" />
                              )}
                              {t.alerts.includes('MUCHAS_ANULACIONES') && (
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" title="Muchas anulaciones" />
                              )}
                            </div>
                          )}
                        </td>

                        {/* 9. Acción */}
                        <td className="py-3.5 px-4 text-right print:hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTerminal(t);
                            }}
                            className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 text-xs font-black hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1 ml-auto"
                          >
                            <span>Cuadre</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* BOTTOM TOTAL ROW (Requirement 1 & Objective Final) */}
                {summary && (
                  <tfoot className="bg-slate-900 text-white font-black border-t-2 border-slate-700">
                    <tr>
                      <td className="py-4 px-4 font-mono text-sm tracking-wider uppercase">
                        TOTAL
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-sans text-xs">
                        {displayedTerminals.length} Terminal(es)
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base tabular-nums">
                        RD$ {summary.totales.ventasTotales.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base text-amber-400 tabular-nums">
                        RD$ {summary.totales.premiosTotales.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base text-indigo-400 tabular-nums">
                        RD$ {summary.totales.comisionesTotales.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base text-emerald-400 tabular-nums">
                        RD$ {summary.totales.gananciaNeta.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs">
                        {summary.totales.ticketsTotales}
                      </td>
                      <td className="py-4 px-4 print:hidden" />
                      <td className="py-4 px-4 print:hidden" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. MODAL DETALLADO DE CUADRE Y OPERACIONES (Requirements 2 & 4)
          ======================================================== */}
      {selectedTerminal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="max-w-4xl w-full max-h-[92vh] bg-white dark:bg-[#0c1628] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/30">
                  {selectedTerminal.terminalCode}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedTerminal.bancaName}</span>
                    <span
                      className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                        selectedTerminal.terminalStatus === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {selectedTerminal.terminalStatus}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cajero: <strong>{selectedTerminal.assignedUsername}</strong> · Dispositivo:{' '}
                    <strong className="font-mono text-cyan-500">{selectedTerminal.deviceId || 'No asignado'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTerminal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Financial KPI Cards for this Terminal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Ventas</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white tabular-nums">
                    RD$ {selectedTerminal.ventas.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedTerminal.ticketsVendidos} ticket(s)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Premios</span>
                  <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                    RD$ {selectedTerminal.premios.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedTerminal.ticketsPremiados} ticket(s) ganador(es)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">
                    Comisión ({selectedTerminal.comisionPorcentaje}%)
                  </span>
                  <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                    RD$ {selectedTerminal.comision.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Pago de corretaje
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    selectedTerminal.gananciaNeta >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Ganancia Neta</span>
                  <span
                    className={`text-lg font-black font-mono tabular-nums ${
                      selectedTerminal.gananciaNeta >= 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    RD$ {selectedTerminal.gananciaNeta.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Resultado final
                  </span>
                </div>
              </div>

              {/* Extra Stats Bar (Tickets anulados, última venta) */}
              <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-3">
                <span className="text-slate-600 dark:text-slate-300">
                  Perdedores: <strong>{selectedTerminal.ticketsPerdedores}</strong> · Anulados:{' '}
                  <strong>{selectedTerminal.ticketsAnulados}</strong> (RD${selectedTerminal.montoAnulado})
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Última venta:{' '}
                  {selectedTerminal.ultimaVenta
                    ? new Date(selectedTerminal.ultimaVenta).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
                    : 'Sin ventas hoy'}
                </span>
              </div>

              {/* Operations Table (Requirement 4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    OPERACIONES Y JUGADAS REALIZADAS ({terminalOperations.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Filtro: {effectiveStart} al {effectiveEnd}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto max-h-[360px]">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Ticket</th>
                          <th className="py-2.5 px-3">Lotería</th>
                          <th className="py-2.5 px-3">Jugada</th>
                          <th className="py-2.5 px-3 text-right">Monto</th>
                          <th className="py-2.5 px-3 text-center">Resultado</th>
                          <th className="py-2.5 px-3 text-right">Premio</th>
                          <th className="py-2.5 px-3">Fecha y Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                        {loadingOps ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                              Cargando operaciones de la terminal...
                            </td>
                          </tr>
                        ) : terminalOperations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                              No hay transacciones registradas para esta terminal en el período seleccionado.
                            </td>
                          </tr>
                        ) : (
                          terminalOperations.map((op, idx) => (
                            <tr
                              key={`${op.ticketId}-${idx}`}
                              onClick={() => setInspectedTicket(op)}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                            >
                              <td className="py-2.5 px-3 font-black text-blue-600 dark:text-cyan-400">
                                #{op.ticketNumber}
                              </td>
                              <td className="py-2.5 px-3 font-sans font-extrabold text-slate-800 dark:text-slate-200">
                                {op.lotteryName}
                              </td>
                              <td className="py-2.5 px-3 font-sans font-bold">
                                {op.jugadaFormatted}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white tabular-nums">
                                RD$ {op.monto.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center font-sans">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    op.resultado === 'GANADOR' || op.resultado === 'PAGADO'
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : op.resultado === 'ANULADO'
                                      ? 'bg-rose-500/20 text-rose-600'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {op.resultado}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400 tabular-nums">
                                {op.premio > 0 ? `RD$ ${op.premio.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[10px] whitespace-nowrap">
                                {op.fecha} · {op.hora}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                Fórmula: Ganancia (RD${selectedTerminal.gananciaNeta.toLocaleString()}) = Ventas - Premios - Comisión
              </span>
              <button
                type="button"
                onClick={() => setSelectedTerminal(null)}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Inspection Popup (Requirement 4) */}
      {inspectedTicket && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Detalle de Operación</span>
              <h3 className="text-xl font-black font-mono text-slate-900 dark:text-white">
                Ticket #{inspectedTicket.ticketNumber}
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                Código Verificación: {inspectedTicket.verificationCode}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Lotería:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectedTicket.lotteryName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Jugada:</span>
                <span className="font-bold">{inspectedTicket.jugadaFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Monto Apostado:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">RD$ {inspectedTicket.monto}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Premio Ganado:</span>
                <span className="font-mono font-black text-amber-600">RD$ {inspectedTicket.premio}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Estado:</span>
                <span className="font-black text-emerald-600">{inspectedTicket.resultado}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Fecha y Hora:</span>
                <span className="font-mono">{inspectedTicket.fecha} {inspectedTicket.hora}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedTicket(null)}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
