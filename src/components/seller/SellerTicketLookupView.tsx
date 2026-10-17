import React, { useState } from 'react';
import { User, Ticket } from '../../types';
import { api } from '../../services/api';
import {
  Search,
  Receipt,
  User as UserIcon,
  Calendar,
  Clock,
  Printer,
  Award,
  CheckCircle2,
  Ban,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThermalTicketModal } from '../pos/ThermalTicketModal';
import { printerService } from '../../services/printerService';

interface SellerTicketLookupViewProps {
  user: User;
}

export const SellerTicketLookupView: React.FC<SellerTicketLookupViewProps> = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const found = await api.getTicket(searchQuery.trim());
      setTicket(found);
    } catch (err: any) {
      setTicket(null);
      setError(err?.message || 'No se encontró ningún ticket con ese número o código de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!ticket) return;
    if (ticket.status === 'PAGADO') {
      setError('Este ticket ya fue pagado anteriormente. No se puede cobrar dos veces.');
      return;
    }
    if (ticket.status !== 'GANADOR' && ticket.status !== 'PENDIENTE DE PAGO') {
      setError('Este ticket no tiene premios pendientes para cobrar.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.payTicket(ticket.id);
      setTicket(res.ticket);
      setActionSuccess(`¡Premio de RD$ ${ticket.totalWon.toLocaleString()} pagado en efectivo exitosamente!`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pago del ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnul = async () => {
    if (!ticket) return;
    if (ticket.status === 'ANULADO') {
      setError('El ticket ya se encuentra anulado.');
      return;
    }

    const confirmAnul = window.confirm(
      `¿Está seguro que desea anular el Ticket #${ticket.ticketNumber} por valor de RD$ ${ticket.totalAmount}?`
    );
    if (!confirmAnul) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.anulTicket(ticket.id);
      setTicket(res.ticket);
      setActionSuccess(`Ticket #${ticket.ticketNumber} anulado con éxito.`);
    } catch (err: any) {
      setError(err?.message || 'Error al anular el ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickThermalPrint = async () => {
    if (!ticket) return;
    try {
      const termCode = user.terminalCode || user.username || '1001';
      const res = await printerService.directThermalPrint58mm(ticket, termCode);
      setActionSuccess(`Reimpresión enviada: ${res.message}`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setError('Error al reimprimir: ' + err?.message);
    }
  };

  const handleCopyVerification = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.verificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Search Input */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
              <Search className="w-5 h-5" />
            </span>
            <span>Consulta de Tickets y Verificación</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Busca cualquier ticket por número o código de seguridad. Verifica vendedor, jugadas, premios, y reimprime sin registrar nueva venta.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-3xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ingrese número de ticket (ej: TCK-20261011-...) o código de seguridad (*7A39B2*)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Consultar</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Resultado del Ticket Encontrado */}
      {ticket && (
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6 p-6">
          {/* Header Ticket Information */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  #{ticket.ticketNumber}
                </span>

                {/* Status Badges */}
                {ticket.status === 'VIGENTE' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>ACTIVO / VIGENTE</span>
                  </span>
                )}
                {ticket.status === 'GANADOR' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                    <Award className="w-3.5 h-3.5" />
                    <span>PREMIADO (PENDIENTE COBRO)</span>
                  </span>
                )}
                {ticket.status === 'PAGADO' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>PREMIO PAGADO EN CAJA</span>
                  </span>
                )}
                {ticket.status === 'ANULADO' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                    <span>BOLETO ANULADO</span>
                  </span>
                )}
              </div>

              {/* Vendedor y Fecha */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Vendedor: <strong className="text-slate-800 dark:text-slate-200">{ticket.userName || 'Vendedor'}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fecha: <strong className="text-slate-800 dark:text-slate-200">{ticket.date}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hora: <strong className="text-slate-800 dark:text-slate-200">{ticket.time}</strong></span>
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                  Terminal #{ticket.terminalCode}
                </span>
              </div>
            </div>

            {/* Código de Verificación Monospace */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Código de Control
                </span>
                <span className="font-mono font-black text-sm tracking-widest text-slate-900 dark:text-white">
                  *{ticket.verificationCode}*
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyVerification}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="Copiar código"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Banner de Premio si es Ganador */}
          {ticket.totalWon > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                    {ticket.status === 'PAGADO' ? 'Premio Pagado' : '¡Ticket Premiado!'}
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    RD$ {ticket.totalWon.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {ticket.status === 'GANADOR' && (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pagar Premio en Efectivo</span>
                </button>
              )}
            </div>
          )}

          {/* Tabla de Jugadas */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Desglose de Jugadas Realizadas
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Lotería / Sorteo</th>
                    <th className="px-4 py-2.5">Modalidad</th>
                    <th className="px-4 py-2.5">Números</th>
                    <th className="px-4 py-2.5 text-right">Monto Jugado</th>
                    <th className="px-4 py-2.5 text-right">Premio Acertado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {ticket.plays.map((play, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                        {play.lotteryName} {play.lottery2Name ? `+ ${play.lottery2Name}` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 uppercase font-sans text-[11px]">
                        {play.playType.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 font-black text-sm text-slate-900 dark:text-white tracking-widest">
                        {play.numbers.join(' - ')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        RD$ {play.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-black">
                        {play.wonAmount && play.wonAmount > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            RD$ {play.wonAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900/60 font-mono text-xs border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-sans font-black text-slate-700 dark:text-slate-300 uppercase">
                      Total Pagado por el Cliente:
                    </td>
                    <td className="px-4 py-3 text-right font-black text-base text-slate-900 dark:text-white">
                      RD$ {ticket.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-base text-amber-600 dark:text-amber-400">
                      {ticket.totalWon > 0 ? `RD$ ${ticket.totalWon.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Bar (Reimprimir térmico, anulación, etc.) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón de Reimpresión Térmica 58mm directa sin registrar venta nueva */}
              <button
                type="button"
                onClick={handleQuickThermalPrint}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                title="Reimprime el ticket en formato térmico 58mm sin registrar ninguna nueva venta"
              >
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Reimpresión Rápida 58mm</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                title="Abrir vista previa del ticket"
              >
                <Printer className="w-4 h-4 text-cyan-500" />
                <span>Ver Comprobante</span>
              </button>
            </div>

            {ticket.status === 'VIGENTE' && (
              <button
                type="button"
                onClick={handleAnul}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 transition-colors"
                title="Anular ticket antes de que cierre el sorteo"
              >
                <Ban className="w-4 h-4 text-rose-500" />
                <span>Anular Boleto</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ticket Térmico */}
      {showPrintModal && ticket && (
        <ThermalTicketModal
          ticket={ticket}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
