import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Ticket, User, Lottery } from '../../types';
import {
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../design-system';
import confetti from 'canvas-confetti';

interface WinnersPayoutViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const WinnersPayoutView: React.FC<WinnersPayoutViewProps> = ({
  user,
  onNavigateTab,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lotteryFilter, setLotteryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [winningTickets, setWinningTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingTicketId, setPayingTicketId] = useState<string | null>(null);

  // Modal payout confirmation
  const [ticketToPay, setTicketToPay] = useState<Ticket | null>(null);
  const [ticketDetailModal, setTicketDetailModal] = useState<Ticket | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lots, tickets] = await Promise.all([
        api.getLotteries().catch(() => []),
        api.getWinningTickets({
          date: selectedDate,
          status: statusFilter,
          lotteryId: lotteryFilter,
          consorcioId: user.consorcioId,
        }),
      ]);
      setLotteries(lots || []);
      setWinningTickets(tickets || []);
    } catch (err: any) {
      console.error('Error cargando tickets ganadores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, statusFilter, lotteryFilter]);

  const handlePayTicket = async (ticket: Ticket) => {
    setPayingTicketId(ticket.id);
    try {
      const res = await api.payWinningTicket(ticket.id);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setFeedback({
        success: true,
        message: `¡Premio de RD$${ticket.totalWon.toLocaleString()} pagado con éxito para el Ticket #${ticket.ticketNumber}!`,
      });
      setTicketToPay(null);
      // Update local state
      setWinningTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: 'PAGADO', paidAt: new Date().toISOString() } : t))
      );
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error al procesar el pago del ticket.' });
    } finally {
      setPayingTicketId(null);
    }
  };

  // Filtered tickets by search
  const filteredTickets = winningTickets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.verificationCode.toLowerCase().includes(q) ||
      t.terminalCode.toLowerCase().includes(q) ||
      (t.userName && t.userName.toLowerCase().includes(q))
    );
  });

  // Calculate summary metrics
  const totalAwarded = winningTickets.reduce((sum, t) => sum + (t.totalWon || 0), 0);
  const pendingPayout = winningTickets
    .filter((t) => t.status === 'GANADOR' || t.status === 'PENDIENTE DE PAGO')
    .reduce((sum, t) => sum + (t.totalWon || 0), 0);
  const totalPaid = winningTickets
    .filter((t) => t.status === 'PAGADO')
    .reduce((sum, t) => sum + (t.totalWon || 0), 0);
  const winnersCount = winningTickets.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Liquidación Automática & Detección de Premios</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.role === 'TERMINAL' || user.terminalCode
                  ? `Tickets Ganadores - Terminal #${user.terminalCode || user.username}`
                  : 'Ganadores y Pago de Premios'}
              </h1>
              {(user.role === 'TERMINAL' || user.terminalCode) && (
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Taquilla de Pagos
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user.role === 'TERMINAL' || user.terminalCode
                ? 'Consulte los tickets premiados pertenecientes a su terminal y liquide pagos en efectivo.'
                : 'Los resultados oficiales se cotejan automáticamente contra cada jugada según las reglas configuradas.'}
            </p>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* 2. Pipeline Process Graphic */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-4 text-white shadow-md border border-blue-700/40">
        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-2">
          Flujo Automático Idempotente de Detección de Ganadores
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-amber-300 text-sm">1. Sorteo</span>
            <span className="text-[10px] text-blue-100">Publicación oficial</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-cyan-300 text-sm">2. Búsqueda</span>
            <span className="text-[10px] text-blue-100">Tickets de la fecha</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-blue-300 text-sm">3. Cotejo</span>
            <span className="text-[10px] text-blue-100">Jugadas vs Resultados</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-emerald-300 text-sm">4. Ganadores</span>
            <span className="text-[10px] text-blue-100">Aciertos 1ra, 2da, 3ra</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-amber-300 text-sm">5. Cálculo</span>
            <span className="text-[10px] text-blue-100">Planes dinámicos</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-purple-300 text-sm">6. Cuadre</span>
            <span className="text-[10px] text-blue-100">Balance en tiempo real</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="block font-black text-green-300 text-sm">7. Desembolso</span>
            <span className="text-[10px] text-blue-100">Marcado como PAGADO</span>
          </div>
        </div>
      </div>

      {/* 3. Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Premios Determinados</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            RD$ {totalAwarded.toLocaleString()}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-cyan-400 font-bold mt-1">
            {winnersCount} tickets con aciertos
          </p>
        </div>

        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-amber-500/30 p-4 shadow-sm bg-amber-500/5">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Premios Pendientes de Pago</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            RD$ {pendingPayout.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Por cobrar en taquilla
          </p>
        </div>

        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-emerald-500/30 p-4 shadow-sm bg-emerald-500/5">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Premios Ya Pagados</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            RD$ {totalPaid.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Efectivo desembolsado
          </p>
        </div>

        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Tasa de Efectividad de Pago</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {totalAwarded > 0 ? `${Math.round((totalPaid / totalAwarded) * 100)}%` : '0%'}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Liquidación al día
          </p>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <Card variant="default">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por # ticket, código de seguridad o terminal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status and Lottery filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="GANADOR">GANADOR (Pendiente de Pago)</option>
              <option value="PAGADO">PAGADO</option>
            </select>

            <select
              value={lotteryFilter}
              onChange={(e) => setLotteryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">Todas las Loterías</option>
              {lotteries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2.5 px-3">Ticket</th>
                <th className="py-2.5 px-3">Terminal / Cajero</th>
                <th className="py-2.5 px-3">Jugada Ganadora</th>
                <th className="py-2.5 px-3">Monto Apostado</th>
                <th className="py-2.5 px-3 text-right">Premio Calculado</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <span>No se encontraron tickets premiados con los filtros seleccionados.</span>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const winningPlay = t.plays.find((p) => p.status === 'GANADOR') || t.plays[0];
                  const isPaid = t.status === 'PAGADO';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-blue-600 dark:text-cyan-400 text-sm">
                          #{t.ticketNumber}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Cod: {t.verificationCode} · {t.date} {t.time}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Terminal {t.terminalCode}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {t.bancaName || 'Banca Central'} · {t.userName}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-sans max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-500/15 text-blue-600 dark:text-cyan-400">
                            {winningPlay?.playType}
                          </span>
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                            {winningPlay?.numbers.join('-')}
                          </span>
                        </div>
                        {winningPlay?.winningDetail && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            {winningPlay.winningDetail}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        RD$ {t.totalAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          RD$ {t.totalWon.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-600 border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {isPaid ? '✓ PAGADO' : '● PENDIENTE DE PAGO'}
                        </span>
                        {t.paidAt && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            {new Date(t.paidAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setTicketDetailModal(t)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            title="Ver desglose completo de jugadas"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {!isPaid ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setTicketToPay(t)}
                              icon={<DollarSign className="w-3.5 h-3.5" />}
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1"
                            >
                              Pagar
                            </Button>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 px-2 py-1">
                              Liquidado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Modal to Pay Prize */}
      {ticketToPay && (
        <Modal
          isOpen={true}
          onClose={() => setTicketToPay(null)}
          title="Confirmar Pago de Premio"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Monto a Desembolsar
              </span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                RD$ {ticketToPay.totalWon.toLocaleString()}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Ticket <strong className="text-slate-900 dark:text-white">#{ticketToPay.ticketNumber}</strong> · Código de Seguridad:{' '}
                <strong className="text-slate-900 dark:text-white">{ticketToPay.verificationCode}</strong>
              </p>
            </div>

            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 border p-3 rounded-xl border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Terminal Vendedora:</span>
                <strong className="text-slate-900 dark:text-white">#{ticketToPay.terminalCode} ({ticketToPay.bancaName || 'Banca'})</strong>
              </div>
              <div className="flex justify-between">
                <span>Cajero / Operador:</span>
                <strong className="text-slate-900 dark:text-white">{ticketToPay.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Fecha de Emisión:</span>
                <strong className="text-slate-900 dark:text-white">{ticketToPay.date} {ticketToPay.time}</strong>
              </div>
              <div className="flex justify-between">
                <span>Aciertos:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {ticketToPay.plays.filter((p) => p.status === 'GANADOR').length} jugada(s) premiada(s)
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Al confirmar, el ticket se registrará como <strong>PAGADO</strong>, se actualizará el balance de caja y el cuadre diario de la terminal.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setTicketToPay(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => handlePayTicket(ticketToPay)}
                disabled={payingTicketId === ticketToPay.id}
                icon={<Check className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {payingTicketId === ticketToPay.id ? 'Procesando Pago...' : 'Confirmar y Pagar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ticket Details Breakdown Modal */}
      {ticketDetailModal && (
        <Modal
          isOpen={true}
          onClose={() => setTicketDetailModal(null)}
          title={`Detalle de Ticket #${ticketDetailModal.ticketNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-500">Terminal & Banca</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  #{ticketDetailModal.terminalCode} · {ticketDetailModal.bancaName || 'Banca Central'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Estado</p>
                <p className={`font-black ${ticketDetailModal.status === 'PAGADO' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {ticketDetailModal.status}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Premio Total</p>
                <p className="font-black text-emerald-500 text-base">
                  RD$ {ticketDetailModal.totalWon.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Jugadas Emitidas
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                {ticketDetailModal.plays.map((play, idx) => {
                  const isWinner = play.status === 'GANADOR';
                  return (
                    <div
                      key={idx}
                      className={`p-3 text-xs flex items-center justify-between ${
                        isWinner ? 'bg-emerald-500/10' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {play.lotteryName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-cyan-400">
                            {play.playType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {play.numbers.join(' - ')}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Apostado: RD$ {play.amount}
                          </span>
                        </div>
                        {play.winningDetail && (
                          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ★ {play.winningDetail}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {isWinner ? (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            RD$ {play.wonAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No premiado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setTicketDetailModal(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
