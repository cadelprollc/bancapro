import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Lottery, Terminal, PlayType, User } from '../../types/index';
import { Search, Filter, RefreshCw, DollarSign, Award, Clock, Building2 } from 'lucide-react';

interface PlaysMonitoringViewProps {
  user?: User;
}

export const PlaysMonitoringView: React.FC<PlaysMonitoringViewProps> = ({ user }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [terminalCode, setTerminalCode] = useState('');
  const [lotteryId, setLotteryId] = useState('');
  const [playType, setPlayType] = useState<string>('');
  const [numberFilter, setNumberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [consorcioIdFilter, setConsorcioIdFilter] = useState('ALL');
  const [consorcios, setConsorcios] = useState<any[]>([]);

  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [plays, setPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadDependencies = async () => {
    try {
      const [lots, terms, consList] = await Promise.all([
        api.getLotteries(),
        api.getTerminals(),
        isSuperAdmin ? api.getConsorcios().catch(() => []) : Promise.resolve([]),
      ]);
      setLotteries(lots);
      setTerminals(terms);
      if (consList && consList.length > 0) {
        setConsorcios(consList);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchPlays = async () => {
    setLoading(true);
    try {
      const data = await api.getPlays({
        date: date || undefined,
        terminalCode: terminalCode || undefined,
        lotteryId: lotteryId || undefined,
        playType: (playType as PlayType) || undefined,
        number: numberFilter ? numberFilter.padStart(2, '0').slice(-2) : undefined,
        status: statusFilter || undefined,
        consorcioId: isSuperAdmin && consorcioIdFilter !== 'ALL' ? consorcioIdFilter : undefined,
      } as any);
      setPlays(data);
    } catch (err: any) {
      console.error('Error fetching plays', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    fetchPlays();
  }, [date, terminalCode, lotteryId, playType, numberFilter, statusFilter, consorcioIdFilter]);

  const totalAmount = plays.reduce((acc, p) => acc + p.amount, 0);
  const totalWon = plays.reduce((acc, p) => acc + (p.wonAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">
            Monitoreo en Tiempo Real de Jugadas
          </h2>
          <p className="text-xs text-neutral-500">
            Audite cada número, combinación, terminal y lotería jugada en el sistema
          </p>
        </div>

        <button
          onClick={fetchPlays}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Actualizando...' : 'Refrescar'}</span>
        </button>
      </div>

      {/* Deep Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtros de Búsqueda</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Consorcio (Super Admin only) */}
          {isSuperAdmin && consorcios.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Consorcio</label>
              <select
                value={consorcioIdFilter}
                onChange={(e) => setConsorcioIdFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 bg-white font-bold"
              >
                <option value="ALL">Todos los consorcios</option>
                {consorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 font-mono"
            />
          </div>

          {/* Terminal */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Terminal</label>
            <select
              value={terminalCode}
              onChange={(e) => setTerminalCode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 bg-white"
            >
              <option value="">Todas las terminales</option>
              {terminals.map((t) => (
                <option key={t.id} value={t.code}>
                  #{t.code} ({t.name})
                </option>
              ))}
            </select>
          </div>

          {/* Lottery */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Lotería</label>
            <select
              value={lotteryId}
              onChange={(e) => setLotteryId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 bg-white"
            >
              <option value="">Todas las loterías</option>
              {lotteries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Play Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Tipo de Jugada</label>
            <select
              value={playType}
              onChange={(e) => setPlayType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 bg-white"
            >
              <option value="">Todos los tipos</option>
              <option value="QUINIELA">Quiniela</option>
              <option value="PALE">Palé</option>
              <option value="TRIPLETA">Tripleta</option>
              <option value="SUPER_PALE">Súper Palé</option>
            </select>
          </div>

          {/* Number */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Número (2 dígitos)</label>
            <input
              type="text"
              maxLength={2}
              value={numberFilter}
              onChange={(e) => setNumberFilter(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 05"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 font-mono text-center font-bold"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="GANADOR">Ganador</option>
              <option value="PERDEDOR">Perdedor</option>
            </select>
          </div>
        </div>

        {/* Live Filter Metrics Summary */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="text-neutral-500">
            Jugadas Encontradas: <span className="font-bold text-neutral-900">{plays.length}</span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-neutral-500 mr-1.5">Monto Apostado:</span>
              <span className="font-bold text-neutral-900">RD${totalAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500 mr-1.5">Premios Otorgados:</span>
              <span className="font-bold text-emerald-700">RD${totalWon.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plays Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold text-[10px] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Terminal</th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Lotería</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 font-mono">Números</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Premio</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {plays.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400">
                    No se encontraron jugadas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                plays.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-neutral-500 tabular-nums">
                      {p.time || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-800">
                      #{p.terminalCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">
                      {p.ticketNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {p.lotteryName} {p.lottery2Name ? `+ ${p.lottery2Name}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neutral-700">
                        {p.playType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sm tracking-wider text-neutral-900">
                      {p.numbers.join(' - ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-neutral-900">
                      RD${p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {p.wonAmount > 0 ? (
                        <span className="text-emerald-700">RD${p.wonAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          p.status === 'GANADOR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PERDEDOR'
                            ? 'bg-neutral-100 text-neutral-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
