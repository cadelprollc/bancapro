import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LotteryResult, Lottery, User } from '../../types/index';
import { Calendar, Award, RefreshCw, AlertCircle, Search, Layers, Clock, ArrowLeft } from 'lucide-react';
import { getPresetLogoForLottery } from '../../utils/lotteryLogos';

interface ResultsViewProps {
  onNavigateTab?: (tab: string) => void;
  user?: User;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ onNavigateTab, user }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [filterMode, setFilterMode] = useState<'date' | 'all'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchResults = async (targetDate?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const queryDate = filterMode === 'date' ? (targetDate || date) : undefined;
      const [resData, lotData] = await Promise.all([
        api.getResults(queryDate).catch(() => []),
        api.getLotteries().catch(() => []),
      ]);
      setResults(resData || []);
      setLotteries(lotData || []);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'No fue posible obtener los resultados en este momento. Intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [date, filterMode]);

  // Map lotteries for fast lookup
  const lotteryMap = new Map(lotteries.map((l) => [l.id, l]));

  // Filter results by search query
  const filteredResults = results.filter((res) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      res.lotteryName.toLowerCase().includes(q) ||
      res.primera.includes(q) ||
      res.segunda.includes(q) ||
      res.tercera.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl">🎱</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Resultados Oficiales de Loterías
              </h1>
              {user && (user.role === 'TERMINAL' || user.terminalCode) && (
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Terminal #{user.terminalCode || user.username}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Sorteos certificados y números ganadores en tiempo real
            </p>
          </div>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('date')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'date'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Por Fecha
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todos los Recientes
            </button>
          </div>

          {filterMode === 'date' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>
          )}

          <button
            onClick={() => fetchResults()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
            title="Actualizar resultados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchResults()}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filtrar por lotería o número..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0d172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#0d172a] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-3">
            <Award className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay resultados registrados para este criterio
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {filterMode === 'date'
                ? `Aún no se han publicado sorteos para la fecha ${date}. Puede consultar los sorteos más recientes.`
                : 'No se encontraron resultados que coincidan con la búsqueda.'}
            </p>
            {filterMode === 'date' && (
              <button
                onClick={() => setFilterMode('all')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 text-xs font-bold transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Ver todos los sorteos recientes
              </button>
            )}
          </div>
        ) : (
          filteredResults.map((res) => {
            const lot = lotteryMap.get(res.lotteryId);
            const lotColor = lot?.color || '#2563EB';

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Header of Card */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      {(() => {
                        const logoSrc = lot?.logoUrl || getPresetLogoForLottery(res.lotteryName) || (lot?.code ? getPresetLogoForLottery(lot.code) : undefined);
                        return logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={res.lotteryName}
                            className="w-7 h-7 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: lotColor }}
                          />
                        );
                      })()}
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                        {res.lotteryName}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-cyan-400 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60">
                      {res.drawDate}
                    </span>
                  </div>

                  {/* Winning Balls */}
                  <div className="py-6 grid grid-cols-3 gap-3 text-center">
                    {/* 1ra Premio */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                        1er Premio
                      </span>
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white font-mono font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform tabular-nums ring-2 ring-emerald-500/30">
                        {res.primera || '--'}
                      </div>
                    </div>

                    {/* 2da Premio */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-cyan-400 tracking-wider">
                        2do Premio
                      </span>
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-mono font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform tabular-nums ring-2 ring-blue-500/30">
                        {res.segunda || '--'}
                      </div>
                    </div>

                    {/* 3ra Premio */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                        3er Premio
                      </span>
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 text-white font-mono font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform tabular-nums ring-2 ring-amber-500/30">
                        {res.tercera || '--'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="truncate max-w-[140px]">Por: {res.publishedBy || 'Oficial'}</span>
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {res.publishedAt
                      ? new Date(res.publishedAt).toLocaleTimeString('es-DO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Hora oficial'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
