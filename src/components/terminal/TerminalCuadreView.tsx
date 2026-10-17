import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Ticket, LotteryResult } from '../../types/index';
import {
  DollarSign,
  Award,
  TrendingUp,
  Printer,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  FileText,
  Clock,
  ShieldCheck,
  Percent,
  Check,
  Eye,
  Trophy,
  Sparkles,
  BarChart3,
  Smartphone,
  Package,
} from 'lucide-react';
import { printerService } from '../../services/printerService';
import { ThermalTicketModal } from '../pos/ThermalTicketModal';
import { RecargasModal } from '../pos/RecargasModal';
import { ProductosModal } from '../pos/ProductosModal';

interface TerminalCuadreViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const TerminalCuadreView: React.FC<TerminalCuadreViewProps> = ({ user, onNavigateTab }) => {
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [showRecargasModal, setShowRecargasModal] = useState(false);
  const [showProductosModal, setShowProductosModal] = useState(false);

  // Arqueo de caja
  const [efectivoContado, setEfectivoContado] = useState<string>('');
  const [showDenomCalc, setShowDenomCalc] = useState(false);
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    25: 0,
    10: 0,
  });

  // Turno & Cierre
  const [cuadreCerrado, setCuadreCerrado] = useState(false);
  const [cerrandoTurno, setCerrandoTurno] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTicketListTab, setActiveTicketListTab] = useState<'ventas' | 'premios' | 'ganadores' | 'sorteos' | 'anulados'>('ventas');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dayResults, setDayResults] = useState<LotteryResult[]>([]);
  const [winningTickets, setWinningTickets] = useState<Ticket[]>([]);
  const [payingTicketId, setPayingTicketId] = useState<string | null>(null);

  // Load Cuadre Data
  const loadCuadre = async () => {
    setLoading(true);
    try {
      const [data, resData, winData] = await Promise.all([
        api.getTerminalReport(terminalCode, selectedDate, selectedDate),
        api.getResults(selectedDate).catch(() => []),
        api.getWinningTickets({ date: selectedDate, terminalCode }).catch(() => []),
      ]);
      setReportData(data);
      setDayResults(resData || []);
      setWinningTickets(winData || []);

      // Check if previously closed in storage
      const savedClosed = localStorage.getItem(`bancapro_cuadre_closed_${terminalCode}_${selectedDate}`);
      if (savedClosed === 'true') {
        setCuadreCerrado(true);
      } else {
        setCuadreCerrado(false);
      }
    } catch (err: any) {
      console.error('Error al cargar cuadre:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayWinningTicket = async (t: Ticket) => {
    setPayingTicketId(t.id);
    try {
      await api.payWinningTicket(t.id);
      setNotice(`✅ ¡Premio de RD$ ${t.totalWon.toLocaleString()} pagado exitosamente para el Ticket #${t.ticketNumber}!`);
      loadCuadre();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setNotice('❌ Error al pagar premio: ' + (err?.message || 'Error desconocido'));
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setPayingTicketId(null);
    }
  };

  useEffect(() => {
    loadCuadre();
  }, [terminalCode, selectedDate]);

  // Derived financials
  const allTickets: Ticket[] = reportData?.tickets || [];
  const ticketsValidos = allTickets.filter((t) => t.status !== 'ANULADO');
  const ticketsAnulados = allTickets.filter((t) => t.status === 'ANULADO');
  const ticketsPagados = allTickets.filter((t) => t.status === 'PAGADO');

  const ventasBrutas = allTickets.reduce((sum, t) => sum + (t.status !== 'ANULADO' ? t.totalAmount : 0), 0) +
    ticketsAnulados.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalAnulado = ticketsAnulados.reduce((sum, t) => sum + t.totalAmount, 0);
  const ventasNetas = reportData?.totalSold || 0;
  const premiosPagados = ticketsPagados.reduce((sum, t) => sum + t.totalWon, 0);
  const totalPremiosGenerados = reportData?.totalPrizes || ticketsValidos.reduce((sum, t) => sum + (t.totalWon || 0), 0);
  const comisionRate = 0.10; // 10% de comisión de la terminal
  const comisionTerminal = Math.round(ventasNetas * comisionRate);
  const balanceAEntregar = ventasNetas - premiosPagados - comisionTerminal;
  // Recálculo de si la terminal está perdiendo: Ventas Netas - Total Premios
  const resultadoTerminal = ventasNetas - totalPremiosGenerados;
  const isTerminalPerdiendo = resultadoTerminal < 0;

  // Calculadora de denominaciones
  const totalBilletes = Object.entries(denominations).reduce(
    (acc, [denom, count]) => acc + Number(denom) * (Number(count) || 0),
    0
  );

  const handleApplyDenominations = () => {
    setEfectivoContado(totalBilletes.toString());
    setShowDenomCalc(false);
    setNotice(`Arqueo calculado de RD$ ${totalBilletes.toLocaleString()} aplicado a caja.`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Efectivo contado y diferencia
  const contadoNum = efectivoContado ? parseFloat(efectivoContado) : balanceAEntregar;
  const diferencia = contadoNum - balanceAEntregar;

  // Imprimir Ticket Térmico Oficial de Cuadre
  const handlePrintCuadre = async () => {
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
      const timeStr = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      const ticketLines = [
        sep,
        center('CUADRE DE CAJA DIARIO'),
        center('BANCA LA EXPRESS · DOMINICANA'),
        sep,
        padRow('TERMINAL:', `#${terminalCode}`),
        padRow('CAJERO:', user.name || 'Cajero Principal'),
        padRow('FECHA:', selectedDate),
        padRow('HORA CUADRE:', timeStr),
        padRow('ESTADO:', cuadreCerrado ? 'TURNO CERRADO' : 'EN OPERACIÓN'),
        line,
        padRow('VENTAS BRUTAS:', `RD$ ${ventasBrutas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow(`ANULACIONES (${ticketsAnulados.length}):`, `-RD$ ${totalAnulado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        line,
        padRow('VENTAS NETAS:', `RD$ ${ventasNetas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('TOTAL PREMIOS:', `RD$ ${totalPremiosGenerados.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow(isTerminalPerdiendo ? 'RESULTADO OPERATIVO:' : 'RESULTADO OPERATIVO:', isTerminalPerdiendo ? `PERDIENDO (-RD$ ${Math.abs(resultadoTerminal).toLocaleString('es-DO', { minimumFractionDigits: 2 })})` : `GANANDO (+RD$ ${resultadoTerminal.toLocaleString('es-DO', { minimumFractionDigits: 2 })})`),
        padRow(`PREMIOS PAGADOS (${ticketsPagados.length}):`, `-RD$ ${premiosPagados.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow(`COMISIÓN (${comisionRate * 100}%):`, `-RD$ ${comisionTerminal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        sep,
        padRow('TOTAL A ENTREGAR:', `RD$ ${balanceAEntregar.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('EFECTIVO REPORTADO:', `RD$ ${contadoNum.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('DIFERENCIA:', `${diferencia === 0 ? 'RD$ 0.00 (EXACTO)' : diferencia > 0 ? `+RD$ ${diferencia.toLocaleString('es-DO')} (SOBRANTE)` : `-RD$ ${Math.abs(diferencia).toLocaleString('es-DO')} (FALTANTE)`}`),
        line,
        center('RESUMEN DE OPERACIONES:'),
        padRow('TICKETS VENDIDOS:', `${ticketsValidos.length}`),
        padRow('TICKETS ANULADOS:', `${ticketsAnulados.length}`),
        padRow('TICKETS PAGADOS:', `${ticketsPagados.length}`),
        line,
        '',
        center('FIRMA DEL CAJERO'),
        center('________________________________'),
        '',
        sep,
        center('*** COMPROBANTE OFICIAL DE CUADRE ***'),
        ''
      ];

      const ticketText = ticketLines.join('\n');
      printerService.triggerHardwarePrint(ticketText, `Cuadre_${terminalCode}_${selectedDate}`, pConfig.paperWidth, pConfig.printDensity);

      setNotice('🖨️ Ticket de cuadre enviado a la impresora térmica exitosamente.');
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotice('Error imprimiendo ticket de cuadre: ' + (err?.message || 'Error desconocido'));
    }
  };

  // Cerrar Turno / Cuadre
  const handleCerrarTurno = () => {
    setCerrandoTurno(true);
    setTimeout(() => {
      setCuadreCerrado(true);
      setCerrandoTurno(false);
      localStorage.setItem(`bancapro_cuadre_closed_${terminalCode}_${selectedDate}`, 'true');
      setNotice('🔒 ¡Turno de caja cerrado exitosamente! Imprimiendo comprobante final.');
      handlePrintCuadre();
      setTimeout(() => setNotice(null), 5000);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Navigation */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('sales')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Volver a la Terminal de Ventas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">📊</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Cuadre de Caja de Terminal
              </h1>
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                #{terminalCode}
              </span>
              {cuadreCerrado ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> CERRADO
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> EN VIVO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cajero: <strong className="text-slate-800 dark:text-slate-200">{user.name || user.username}</strong> · Balance, arqueo y liquidación de turno
            </p>
          </div>
        </div>

        {/* Date Selector & Print Cuadre Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={loadCuadre}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Actualizar datos del cuadre"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Botón Recargas */}
          <button
            type="button"
            onClick={() => setShowRecargasModal(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800/80 rounded-xl transition-all text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Vender Recargas Telefónicas Claro, Altice, Viva"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Recargas</span>
          </button>

          {/* Botón Productos */}
          <button
            type="button"
            onClick={() => setShowProductosModal(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition-all text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Vender Productos, Pines Digitales y Servicios"
          >
            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Productos</span>
          </button>

          <button
            onClick={handlePrintCuadre}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            title="Imprimir ticket térmico con el cuadre oficial"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cuadre</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {isTerminalPerdiendo && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-950 dark:text-rose-100 flex items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider">
                  ⚠️ TERMINAL EN PÉRDIDA
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                  -RD$ {Math.abs(resultadoTerminal).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                La terminal ha vendido <strong className="font-mono text-slate-900 dark:text-white">RD$ {ventasNetas.toLocaleString()}</strong> y acumula <strong className="font-mono text-rose-600 dark:text-rose-400">RD$ {totalPremiosGenerados.toLocaleString()}</strong> en premios. El sistema recalcula que la terminal está <strong className="text-rose-700 dark:text-rose-300 font-black">perdiendo con saldo negativo de -RD$ {Math.abs(resultadoTerminal).toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ventas Netas */}
        <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Ventas Netas</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
            RD${ventasNetas.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>{ticketsValidos.length} tickets válidos</span>
            {totalAnulado > 0 && <span className="text-rose-500">(-RD${totalAnulado.toLocaleString()} anulados)</span>}
          </div>
        </div>

        {/* 2. Premios Pagados en Caja */}
        <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Premios Pagados</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            RD${premiosPagados.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {ticketsPagados.length} tickets pagados en ventanilla
          </div>
        </div>

        {/* 3. Comisión Terminal */}
        <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Comisión ({comisionRate * 100}%)</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400 tabular-nums">
            RD${comisionTerminal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ganancia de la terminal
          </div>
        </div>

        {/* 4. Balance a Entregar */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          balanceAEntregar >= 0
            ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/40 text-slate-900 dark:text-white'
            : 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent border-rose-500/40 text-slate-900 dark:text-white'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Total a Entregar
            </span>
            <span className={`p-2 rounded-xl text-white ${balanceAEntregar >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${balanceAEntregar >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            RD${balanceAEntregar.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
            Efectivo neto requerido en caja
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Arqueo de Caja & Conciliación, Right = Desglose Contable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Arqueo y Conteo de Efectivo */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>💰 ARQUEO DE EFECTIVO EN CAJA</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ingrese el monto físico contado o use el calculador de billetes
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDenomCalc(!showDenomCalc)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors"
            >
              {showDenomCalc ? 'Ocultar Billetes' : 'Desglose Billetes'}
            </button>
          </div>

          {/* Calculador de Billetes RD$ */}
          {showDenomCalc && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Conteo por Denominación Dominicana:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[2000, 1000, 500, 200, 100, 50, 25, 10].map((denom) => (
                  <div key={denom} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold font-mono text-slate-400 block">
                      RD${denom}
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={denominations[denom] || ''}
                      onChange={(e) =>
                        setDenominations((prev) => ({
                          ...prev,
                          [denom]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-full text-xs font-mono font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-400 block font-mono text-right">
                      = RD${((denominations[denom] || 0) * denom).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Total Contado: <strong className="text-blue-600 font-mono text-sm">RD${totalBilletes.toLocaleString()}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleApplyDenominations}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Aplicar Monto a Caja
                </button>
              </div>
            </div>
          )}

          {/* Input de Efectivo Contado */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Efectivo Físico Reportado por el Cajero (RD$):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-400">
                RD$
              </span>
              <input
                type="number"
                step="0.01"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                placeholder={balanceAEntregar.toString()}
                className="w-full pl-12 pr-4 py-3 text-base font-mono font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Resultado de la Conciliación (Diferencia) */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            diferencia === 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : diferencia > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="space-y-0.5">
              <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                {diferencia === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>CUADRE EXACTO (SIN DIFERENCIAS)</span>
                  </>
                ) : diferencia > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>SOBRANTE EN CAJA</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>FALTANTE EN CAJA</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                {diferencia === 0
                  ? 'El efectivo contado coincide exactamente con el balance calculado.'
                  : diferencia > 0
                  ? 'Hay más dinero físico reportado que el requerido por las ventas registradas.'
                  : 'Falta dinero en caja con respecto a los tickets emitidos.'}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase block text-slate-500">Diferencia:</span>
              <span className={`text-base font-black font-mono tabular-nums ${
                diferencia === 0 ? 'text-emerald-700 dark:text-emerald-400' : diferencia > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
              }`}>
                {diferencia === 0
                  ? 'RD$ 0.00'
                  : diferencia > 0
                  ? `+RD$ ${diferencia.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
                  : `-RD$ ${Math.abs(diferencia).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>

          {/* Botón de Cierre de Turno */}
          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-slate-500">
              Turno iniciado: <strong>08:00 AM</strong> · {ticketsValidos.length} tickets operados
            </span>

            {cuadreCerrado ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Turno de caja cerrado</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCerrarTurno}
                disabled={cerrandoTurno}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{cerrandoTurno ? 'Cerrando Turno...' : '🔒 Cerrar Turno / Cuadre'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Desglose Contable Oficial */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋 ESTADO DE CUENTA DIARIO</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Terminal #{terminalCode}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Ventas Brutas ({allTickets.length} tickets):</span>
              <strong className="text-slate-900 dark:text-white tabular-nums">
                RD$ {ventasBrutas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-rose-500">(-) Cancelaciones / Anulados ({ticketsAnulados.length}):</span>
              <span className="text-rose-600 font-bold tabular-nums">
                -RD$ {totalAnulado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 bg-slate-50 dark:bg-slate-900/60 px-2 rounded-lg font-bold">
              <span className="text-slate-800 dark:text-slate-200">(=) Ventas Netas:</span>
              <span className="text-blue-600 dark:text-blue-400 text-sm tabular-nums">
                RD$ {ventasNetas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-amber-600">(-) Premios Pagados en Caja ({ticketsPagados.length}):</span>
              <span className="text-amber-600 font-bold tabular-nums">
                -RD$ {premiosPagados.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-purple-600">(-) Comisión de la Terminal ({comisionRate * 100}%):</span>
              <span className="text-purple-600 font-bold tabular-nums">
                -RD$ {comisionTerminal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>TOTAL EFECTIVO A ENTREGAR:</span>
                <span className="text-amber-400 text-base font-black tabular-nums">
                  RD$ {balanceAEntregar.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Efectivo Contado:</span>
                <span>RD$ {contadoNum.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Diferencia:</span>
                <span className={diferencia === 0 ? 'text-emerald-400 font-bold' : diferencia > 0 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                  {diferencia === 0 ? 'Exacto' : `RD$ ${diferencia.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintCuadre}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>Imprimir Resumen en Cabezal Térmico</span>
          </button>
        </div>
      </div>

      {/* Tabs of Tickets in this Cuadre (Ventas, Premios, Ganadores, Sorteos, Anulados) */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTicketListTab('ventas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTicketListTab === 'ventas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ventas ({ticketsValidos.length})
            </button>
            <button
              onClick={() => setActiveTicketListTab('premios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTicketListTab === 'premios'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Premios Pagados ({ticketsPagados.length})
            </button>
            <button
              onClick={() => setActiveTicketListTab('ganadores')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTicketListTab === 'ganadores'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Tikes Ganadores ({winningTickets.length})</span>
            </button>
            <button
              onClick={() => setActiveTicketListTab('sorteos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTicketListTab === 'sorteos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Números Ganadores ({dayResults.length})</span>
            </button>
            <button
              onClick={() => setActiveTicketListTab('anulados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTicketListTab === 'anulados'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Anulados ({ticketsAnulados.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ver Reporte Completo</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB: NÚMEROS GANADORES DEL DÍA */}
        {activeTicketListTab === 'sorteos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Resultados y Números Ganadores Oficiales de la Fecha ({selectedDate})
              </h4>
            </div>

            {dayResults.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No hay sorteos con números oficiales publicados para esta fecha todavía.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayResults.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase truncate">
                        {r.lotteryName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{r.drawDate}</span>
                    </div>

                    <div className="flex items-center justify-around gap-2 pt-1">
                      <div className="text-center">
                        <span className="text-[9px] font-bold text-amber-500 uppercase block mb-1">1er Premio</span>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center font-mono shadow-sm">
                          {r.primera}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">2do Premio</span>
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center font-mono shadow-sm">
                          {r.segunda}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] font-bold text-amber-700 uppercase block mb-1">3er Premio</span>
                        <div className="w-9 h-9 rounded-full bg-amber-800/40 text-amber-900 dark:text-amber-200 font-black text-xs flex items-center justify-center font-mono shadow-sm">
                          {r.tercera}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: TIKES GANADORES DE LA TERMINAL */}
        {activeTicketListTab === 'ganadores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Ticket #</th>
                  <th className="px-4 py-2.5">Hora</th>
                  <th className="px-4 py-2.5">Jugada Premiada</th>
                  <th className="px-4 py-2.5 text-right">Apostado</th>
                  <th className="px-4 py-2.5 text-right">Premio (RD$)</th>
                  <th className="px-4 py-2.5 text-center">Estado Cobro</th>
                  <th className="px-4 py-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {winningTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No hay tickets ganadores registrados en esta terminal para la fecha seleccionada.
                    </td>
                  </tr>
                ) : (
                  winningTickets.map((t) => {
                    const isPaid = t.status === 'PAGADO';
                    return (
                      <tr key={t.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                          {t.ticketNumber}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">
                          {t.time}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">
                            {t.plays.map((p) => `${p.lotteryName}: ${p.numbers.join('-')}`).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                          RD${t.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums text-sm">
                          RD${t.totalWon.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse'
                            }`}
                          >
                            {isPaid ? 'PAGADO' : 'PENDIENTE COBRO'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => handlePayWinningTicket(t)}
                              disabled={payingTicketId === t.id}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>{payingTicketId === t.id ? 'Pagando...' : 'Pagar Premio'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Comprobante</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABS ESTÁNDAR: VENTAS, PREMIOS PAGADOS, ANULADOS */}
        {activeTicketListTab !== 'sorteos' && activeTicketListTab !== 'ganadores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Ticket #</th>
                  <th className="px-4 py-2.5">Hora</th>
                  <th className="px-4 py-2.5">Jugadas</th>
                  <th className="px-4 py-2.5 text-right">Monto</th>
                  <th className="px-4 py-2.5 text-right">Premio</th>
                  <th className="px-4 py-2.5 text-center">Estado</th>
                  <th className="px-4 py-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(activeTicketListTab === 'ventas' ? ticketsValidos : activeTicketListTab === 'premios' ? ticketsPagados : ticketsAnulados).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No se registran tickets en esta categoría para la fecha seleccionada.
                    </td>
                  </tr>
                ) : (
                  (activeTicketListTab === 'ventas' ? ticketsValidos : activeTicketListTab === 'premios' ? ticketsPagados : ticketsAnulados).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        {t.ticketNumber}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {t.time}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-xs">
                          {t.plays.map((p) => `${p.lotteryName}: ${p.numbers.join('-')}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        RD${t.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                        {t.totalWon > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">RD${t.totalWon.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'GANADOR' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'PAGADO' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'ANULADO' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
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

      {selectedTicket && (
        <ThermalTicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Modal de Recargas Telefónicas */}
      {showRecargasModal && (
        <RecargasModal
          isOpen={showRecargasModal}
          onClose={() => setShowRecargasModal(false)}
          user={user}
          onSuccess={() => loadCuadre()}
        />
      )}

      {/* Modal de Productos & Servicios */}
      {showProductosModal && (
        <ProductosModal
          isOpen={showProductosModal}
          onClose={() => setShowProductosModal(false)}
          user={user}
          onSuccess={() => loadCuadre()}
        />
      )}
    </div>
  );
};
