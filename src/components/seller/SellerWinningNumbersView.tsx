import React, { useState, useEffect } from 'react';
import { User, LotteryResult, Lottery, Ticket } from '../../types';
import { api } from '../../services/api';
import {
  Award,
  Calendar,
  RefreshCw,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Ticket as TicketIcon,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { ThermalTicketModal } from '../pos/ThermalTicketModal';

interface SellerWinningNumbersViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const SellerWinningNumbersView: React.FC<SellerWinningNumbersViewProps> = ({ user, onNavigateTab }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');

  // Modal para ver ticket
  const [selectedTicketToView, setSelectedTicketToView] = useState<Ticket | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, lotsData, ticketsData] = await Promise.all([
        api.getResults(selectedDate).catch(() => []),
        api.getLotteries().catch(() => []),
        api.getTickets().catch(() => []),
      ]);
      setResults(resData || []);
      setLotteries(lotsData || []);

      // Filtrar tickets del vendedor o terminal para la fecha seleccionada
      const termCode = user.terminalCode || user.username;
      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      const filtered = (ticketsData || []).filter((t: Ticket) => {
        if (t.date !== selectedDate) return false;
        if (!isAdmin && termCode) {
          if (t.terminalCode !== termCode && t.userId !== user.id) return false;
        }
        return true;
      });

      setTickets(filtered);
    } catch (err) {
      console.warn('Error loading results and comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Mapa de resultados por lotería para comparación rápida
  const resultsByLottery = new Map<string, LotteryResult>();
  results.forEach((r) => {
    resultsByLottery.set(r.lotteryId, r);
  });

  // Identificar boletos ganadores y no ganadores
  const evaluatedTickets = tickets.map((t) => {
    const isVoided = t.status === 'ANULADO';
    const isWinner = t.totalWon > 0 || t.status === 'GANADOR' || t.status === 'PAGADO';
    return {
      ticket: t,
      isVoided,
      isWinner,
      wonAmount: t.totalWon || 0,
    };
  });

  const winnerTickets = evaluatedTickets.filter((item) => item.isWinner && !item.isVoided);
  const loserTickets = evaluatedTickets.filter((item) => !item.isWinner && !item.isVoided);

  const displayedList =
    ticketFilter === 'WINNERS'
      ? winnerTickets
      : ticketFilter === 'LOSERS'
      ? loserTickets
      : evaluatedTickets;

  const totalPrizeMoney = winnerTickets.reduce((sum, item) => sum + item.wonAmount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Date Selection */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Números Ganadores y Comparador de Boletos
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consulta los números oficiales de cada sorteo y compara automáticamente con las jugadas vendidas para identificar boletos premiados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            title="Refrescar resultados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onNavigateTab && (user?.role === 'SUPER_ADMIN' || user?.adminPermissions?.resultados) && (
            <button
              onClick={() => onNavigateTab('publish-results')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              title="Subir números ganadores oficiales de los sorteos"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Subir Números</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Resultados Oficiales de las Loterías */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span>Números Ganadores Oficiales de la Fecha ({selectedDate})</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {results.length} sorteos publicados
          </span>
        </div>

        {results.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#0d172a] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No se han publicado números oficiales para esta fecha todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {results.map((r) => {
              const lot = lotteries.find((l) => l.id === r.lotteryId);
              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {r.lotteryName || lot?.name || 'Sorteo'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {lot?.drawTime || 'Sorteo'}
                    </span>
                  </div>

                  {/* Bolos Ganadores (1ra, 2da, 3ra) */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                        1ra
                      </span>
                      <span className="font-mono text-lg font-black text-amber-600 dark:text-amber-300">
                        {r.primera}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <span className="text-[9px] uppercase font-bold text-blue-700 dark:text-blue-400 block">
                        2da
                      </span>
                      <span className="font-mono text-lg font-black text-blue-600 dark:text-blue-300">
                        {r.segunda}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <span className="text-[9px] uppercase font-bold text-purple-700 dark:text-purple-400 block">
                        3ra
                      </span>
                      <span className="font-mono text-lg font-black text-purple-600 dark:text-purple-300">
                        {r.tercera}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Comparador Inteligente de Boletos Jugados */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Comparativa de Boletos Vendidos vs. Números Oficiales
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identificación clara de tickets premiados y no ganadores para el vendedor.
            </p>
          </div>

          {/* Filtros de Boletos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTicketFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                ticketFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todos ({tickets.length})
            </button>
            <button
              onClick={() => setTicketFilter('WINNERS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors flex items-center gap-1 ${
                ticketFilter === 'WINNERS'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Premiados ({winnerTickets.length})</span>
            </button>
            <button
              onClick={() => setTicketFilter('LOSERS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                ticketFilter === 'LOSERS'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              No Ganadores ({loserTickets.length})
            </button>
          </div>
        </div>

        {/* Resumen de Premios Acertados */}
        {winnerTickets.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Se identificaron <strong>{winnerTickets.length} tickets premiados</strong> para esta jornada.
              </span>
            </div>
            <div className="font-mono font-black text-sm text-amber-700 dark:text-amber-300">
              Total Premios: RD$ {totalPrizeMoney.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}

        {/* Lista de Boletos Comparados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800 font-sans">
              <tr>
                <th className="px-4 py-3">Ticket #</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Lotería & Jugadas</th>
                <th className="px-4 py-3 text-right">Monto Jugado</th>
                <th className="px-4 py-3 text-center">Resultado</th>
                <th className="px-4 py-3 text-right">Premio Acertado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-sans">
                    No hay boletos en esta categoría para la fecha seleccionada.
                  </td>
                </tr>
              ) : (
                displayedList.map(({ ticket: t, isWinner, isVoided, wonAmount }) => {
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isWinner ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketToView(t)}
                          className="hover:underline text-blue-600 dark:text-cyan-400"
                        >
                          #{t.ticketNumber}
                        </button>
                        <div className="text-[10px] text-slate-400">*{t.verificationCode}*</div>
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {t.time}
                      </td>

                      <td className="px-4 py-3 font-sans text-xs">
                        <div className="space-y-0.5">
                          {t.plays.map((p, idx) => {
                            const lotRes = resultsByLottery.get(p.lotteryId);
                            const officialNumbers = lotRes
                              ? [lotRes.primera, lotRes.segunda, lotRes.tercera]
                              : [];
                            const hasMatch = p.numbers.some((num) => officialNumbers.includes(num));

                            return (
                              <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {p.lotteryName}:
                                </span>
                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                  {p.numbers.join('-')}
                                </span>
                                {hasMatch && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    ★ ACUERDO
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        RD$ {t.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isVoided ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            ✕ Anulado
                          </span>
                        ) : isWinner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                            <Trophy className="w-3 h-3" />
                            <span>PREMIADO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <XCircle className="w-3 h-3" />
                            <span>No Ganador</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-black">
                        {isWinner ? (
                          <span className="text-amber-600 dark:text-amber-400 text-sm">
                            RD$ {wonAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketToView(t)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Ver ticket completo"
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
      </div>

      {/* Modal de Ticket */}
      {selectedTicketToView && (
        <ThermalTicketModal
          ticket={selectedTicketToView}
          onClose={() => setSelectedTicketToView(null)}
        />
      )}
    </div>
  );
};
