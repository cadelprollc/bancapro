import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types/index';
import { DollarSign, Award, TrendingUp, Ticket as TicketIcon, Filter, Layers, MapPin, Sparkles, Building2 } from 'lucide-react';

interface AdminReportsViewProps {
  user?: User;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ user }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [consorcioIdFilter, setConsorcioIdFilter] = useState('ALL');
  const [consorcios, setConsorcios] = useState<any[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'general' | 'terminals' | 'lotteries' | 'playTypes'>('general');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isSuperAdmin) {
      api.getConsorcios().then((list) => setConsorcios(list || [])).catch(() => {});
    }
  }, [isSuperAdmin]);

  const fetchAdminReport = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminReport(
        startDate,
        endDate,
        isSuperAdmin && consorcioIdFilter !== 'ALL' ? consorcioIdFilter : undefined
      );
      setReport(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReport();
  }, [consorcioIdFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Filters */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">
            Reportes Consolidados de la Empresa
          </h2>
          <p className="text-xs text-neutral-500">
            Métricas ejecutivas de ventas, premios, utilidades y balance por dimensión
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && consorcios.length > 0 && (
            <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-500 pl-1">Consorcio:</span>
              <select
                value={consorcioIdFilter}
                onChange={(e) => setConsorcioIdFilter(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-neutral-300 font-bold bg-white text-neutral-800"
              >
                <option value="ALL">Todos los Consorcios</option>
                {consorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-600">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 font-mono text-neutral-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-600">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 font-mono text-neutral-800"
            />
          </div>

          <button
            onClick={fetchAdminReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{loading ? 'Consultando...' : 'Filtrar'}</span>
          </button>
        </div>
      </div>

      {/* Global Summary KPI Banner */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Vendido</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-neutral-900 tabular-nums">
              RD${report.totalSold.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Ingresos brutos del consorcio
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Premios</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-amber-700 tabular-nums">
              RD${report.totalPrizes.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {report.winningTicketsCount} tickets premiados
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">¿Cuánto Gana o Pierde?</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className={`font-mono text-2xl font-black tabular-nums ${report.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {report.netProfit >= 0 ? '+' : '-'}RD${Math.abs(report.netProfit).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                report.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {report.netProfit >= 0 ? 'GANA' : 'PIERDE'}
              </span>
              <span className="text-[11px] text-neutral-400">
                Balance a favor de la banca
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Tickets</span>
              <TicketIcon className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-neutral-900 tabular-nums">
              {report.totalTickets}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Emitidos por todas las terminales
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Margen de Ganancia</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="font-mono text-2xl font-bold text-purple-700 tabular-nums">
              {report.totalSold > 0 ? `${Math.round((report.netProfit / report.totalSold) * 100)}%` : '0%'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Rentabilidad sobre ventas
            </div>
          </div>
        </div>
      )}

      {/* Report Dimension Tabs */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-neutral-50/60 p-2 gap-2">
          <button
            onClick={() => setActiveReportTab('terminals')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeReportTab === 'terminals' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Reporte por Terminal</span>
          </button>

          <button
            onClick={() => setActiveReportTab('lotteries')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeReportTab === 'lotteries' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Reporte por Lotería</span>
          </button>

          <button
            onClick={() => setActiveReportTab('playTypes')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeReportTab === 'playTypes' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reporte por Tipo de Jugada</span>
          </button>
        </div>

        <div className="p-4">
          {/* TAB 1: REPORT BY TERMINAL */}
          {activeReportTab === 'terminals' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Código Terminal</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3 text-center">Tickets</th>
                    <th className="px-4 py-3 text-right">Ventas Totales</th>
                    <th className="px-4 py-3 text-right">Premios Pagados</th>
                    <th className="px-4 py-3 text-right">Resultado Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {!report || report.byTerminal.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                        No hay datos de terminales registrados en este período.
                      </td>
                    </tr>
                  ) : (
                    report.byTerminal.map((term: any) => (
                      <tr key={term.code} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                          #{term.code}
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-800">
                          {term.name}
                        </td>
                        <td className="px-4 py-3 text-center font-mono tabular-nums">
                          {term.count}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 tabular-nums">
                          RD${term.sold.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 tabular-nums">
                          RD${term.prizes.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-sm tabular-nums">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black ${
                            term.net >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <span>{term.net >= 0 ? 'GANA' : 'PIERDE'}:</span>
                            <span>{term.net >= 0 ? '+' : '-'}RD${Math.abs(term.net).toLocaleString()}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: REPORT BY LOTTERY */}
          {activeReportTab === 'lotteries' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Lotería</th>
                    <th className="px-4 py-3 text-center">Jugadas Realizadas</th>
                    <th className="px-4 py-3 text-right">Total Vendido</th>
                    <th className="px-4 py-3 text-right">Total Premios</th>
                    <th className="px-4 py-3 text-center">Ganadores</th>
                    <th className="px-4 py-3 text-right">Balance Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {!report || report.byLottery.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                        No hay datos de loterías registrados.
                      </td>
                    </tr>
                  ) : (
                    report.byLottery.map((lot: any) => {
                      const net = lot.sold - lot.prizes;
                      return (
                        <tr key={lot.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-neutral-900 uppercase">
                            {lot.name}
                          </td>
                          <td className="px-4 py-3 text-center font-mono tabular-nums">
                            {lot.playsCount}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 tabular-nums">
                            RD${lot.sold.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 tabular-nums">
                            RD${lot.prizes.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700 tabular-nums">
                            {lot.winners}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sm tabular-nums">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black ${
                              net >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              <span>{net >= 0 ? 'GANA' : 'PIERDE'}:</span>
                              <span>{net >= 0 ? '+' : '-'}RD${Math.abs(net).toLocaleString()}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: REPORT BY PLAY TYPE */}
          {activeReportTab === 'playTypes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Tipo de Jugada</th>
                    <th className="px-4 py-3 text-center">Jugadas Registradas</th>
                    <th className="px-4 py-3 text-right">Monto Vendido</th>
                    <th className="px-4 py-3 text-right">Premios Otorgados</th>
                    <th className="px-4 py-3 text-center">Aciertos Ganadores</th>
                    <th className="px-4 py-3 text-right">Resultado Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report && Object.entries(report.byPlayType).map(([typeKey, data]: [string, any]) => {
                    const net = data.sold - data.prizes;
                    return (
                      <tr key={typeKey} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-neutral-900 uppercase">
                          {typeKey.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-center font-mono tabular-nums">
                          {data.playsCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 tabular-nums">
                          RD${data.sold.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 tabular-nums">
                          RD${data.prizes.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700 tabular-nums">
                          {data.winners}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-sm tabular-nums">
                          <span className={net >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                            RD${net.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
