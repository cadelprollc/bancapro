import React, { useState } from 'react';
import { api } from '../../services/api';
import { Ticket, User } from '../../types/index';
import { Search, Award, CheckCircle2, AlertCircle, Ban, DollarSign, Printer, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThermalTicketModal } from '../pos/ThermalTicketModal';

interface TicketLookupViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const TicketLookupView: React.FC<TicketLookupViewProps> = ({ user, onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const data = await api.getTicket(searchQuery.trim());
      setTicket(data);
    } catch (err: any) {
      setTicket(null);
      setError(err.message || 'Ticket no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!ticket) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.payTicket(ticket.id);
      setTicket(res.ticket);
      setActionSuccess(`Premio de RD$${res.ticket.totalWon.toLocaleString()} pagado satisfactoriamente.`);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnul = async () => {
    if (!ticket) return;
    if (!confirm('¿Está seguro de anular este ticket? Esta acción no se puede deshacer.')) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.anulTicket(ticket.id);
      setTicket(res.ticket);
      setActionSuccess('Ticket anulado correctamente.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-1">
          Consulta y Validación de Tickets
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Ingrese el número de ticket (ej: TCK-20260926-1001-00001) o el código de verificación de 6 dígitos.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Número de ticket o código de seguridad..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-neutral-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Consultar'}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Ticket Details Display */}
      {ticket && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Status Header */}
          <div
            className={`p-4 flex items-center justify-between text-white ${
              ticket.status === 'GANADOR'
                ? 'bg-emerald-600'
                : ticket.status === 'PAGADO'
                ? 'bg-blue-600'
                : ticket.status === 'PERDEDOR'
                ? 'bg-neutral-700'
                : ticket.status === 'ANULADO'
                ? 'bg-red-700'
                : 'bg-amber-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  Estado del Ticket
                </span>
                <div className="font-extrabold text-base tracking-wide uppercase">
                  {ticket.status}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-[10px] uppercase opacity-80">Premio Total</div>
              <div className="text-xl font-extrabold tabular-nums">
                RD${ticket.totalWon.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-neutral-200 text-xs">
            <div>
              <span className="text-neutral-500 text-[11px] block">Número de Ticket</span>
              <span className="font-mono font-bold text-neutral-900">{ticket.ticketNumber}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[11px] block">Código Seguridad</span>
              <span className="font-mono font-extrabold bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800">
                {ticket.verificationCode}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 text-[11px] block">Terminal y Cajero</span>
              <span className="font-medium text-neutral-800">
                #{ticket.terminalCode} ({ticket.userName})
              </span>
            </div>
            <div>
              <span className="text-neutral-500 text-[11px] block">Fecha y Hora</span>
              <span className="font-mono text-neutral-800 tabular-nums">
                {ticket.date} · {ticket.time}
              </span>
            </div>
          </div>

          {/* Plays Breakdown */}
          <div className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
              Detalle de Jugadas y Aciertos
            </h3>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
              {ticket.plays.map((play, idx) => (
                <div key={idx} className="p-3 bg-neutral-50/50 hover:bg-neutral-50 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">
                        {play.lotteryName} {play.lottery2Name ? `+ ${play.lottery2Name}` : ''}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-700">
                        {play.playType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="font-mono font-bold text-sm tracking-wider text-neutral-900">
                      {play.numbers.join(' - ')}
                    </div>

                    {play.winningDetail && (
                      <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{play.winningDetail}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-neutral-600 text-[11px]">
                      Apostado: RD${play.amount.toLocaleString()}
                    </div>
                    {play.wonAmount > 0 ? (
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        Ganó: RD${play.wonAmount.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                        {play.status}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-200 font-mono">
              <span className="text-xs font-bold text-neutral-700">MONTO TOTAL JUGADO:</span>
              <span className="text-base font-extrabold text-neutral-900">
                RD${ticket.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-neutral-500" />
              <span>Ver Ticket Térmico</span>
            </button>

            <div className="flex items-center gap-2">
              {ticket.status === 'GANADOR' && (
                <button
                  onClick={handlePay}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{actionLoading ? 'Procesando...' : `PAGAR PREMIO RD$${ticket.totalWon.toLocaleString()}`}</span>
                </button>
              )}

              {(ticket.status === 'VIGENTE' || ticket.status === 'PENDIENTE') && (
                <button
                  onClick={handleAnul}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>Anular Ticket</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPrintModal && ticket && (
        <ThermalTicketModal
          ticket={ticket}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
