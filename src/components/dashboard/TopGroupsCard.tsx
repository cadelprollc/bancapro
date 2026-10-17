import React, { useState } from 'react';
import { TopGroupItem } from '../../types/index';
import { Layers, ArrowRight, Store, TrendingUp, Building2, Ticket, Award } from 'lucide-react';

interface TopGroupsCardProps {
  topGroups?: TopGroupItem[];
  onNavigateGroups?: () => void;
  className?: string;
}

export const TopGroupsCard: React.FC<TopGroupsCardProps> = ({
  topGroups = [],
  onNavigateGroups,
  className = '',
}) => {
  const [period, setPeriod] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  // Fallback data matching realistic Dominican lottery consorcio structure
  const defaultTopGroups: TopGroupItem[] = [
    {
      groupId: 'grp-centro',
      groupName: 'Grupo Centro & Colonial',
      description: 'Bancas zona centro y Ciudad Colonial',
      salesAmount: 17550.0,
      ticketsCount: 120,
      terminalsCount: 8,
      prizesAmount: 7370.0,
      netProfit: 7890.0,
      rank: 1,
      percentage: 36,
      status: 'ACTIVE',
      prizePlanName: 'Plan Diamante 65x',
    },
    {
      groupId: 'grp-este',
      groupName: 'Grupo Este & Charles',
      description: 'Bancas zona oriental, San Isidro y Las Américas',
      salesAmount: 12180.0,
      ticketsCount: 89,
      terminalsCount: 6,
      prizesAmount: 5360.0,
      netProfit: 5240.0,
      rank: 2,
      percentage: 25,
      status: 'ACTIVE',
      prizePlanName: 'Plan Oro 62x',
    },
    {
      groupId: 'grp-norte',
      groupName: 'Grupo Norte & Cibao',
      description: 'Bancas Santiago, Villa Mella y autopista Duarte',
      salesAmount: 9260.0,
      ticketsCount: 68,
      terminalsCount: 5,
      prizesAmount: 3800.0,
      netProfit: 4260.0,
      rank: 3,
      percentage: 19,
      status: 'ACTIVE',
      prizePlanName: 'Plan Plata 60x',
    },
    {
      groupId: 'grp-metro',
      groupName: 'Grupo Metro & Kennedy',
      description: 'Bancas polígono central, Piantini y Naco',
      salesAmount: 6340.0,
      ticketsCount: 41,
      terminalsCount: 4,
      prizesAmount: 2410.0,
      netProfit: 3100.0,
      rank: 4,
      percentage: 13,
      status: 'ACTIVE',
      prizePlanName: 'Plan Platino 65x',
    },
    {
      groupId: 'grp-sur',
      groupName: 'Grupo Sur & Herrera',
      description: 'Bancas Santo Domingo Oeste, Herrera y San Cristóbal',
      salesAmount: 3420.0,
      ticketsCount: 24,
      terminalsCount: 3,
      prizesAmount: 1370.0,
      netProfit: 1610.0,
      rank: 5,
      percentage: 7,
      status: 'ACTIVE',
      prizePlanName: 'Plan Estándar 60x',
    },
  ];

  const sourceData = topGroups && topGroups.length > 0 ? topGroups : defaultTopGroups;

  // Multiplier for interactive simulation by period
  const multiplier = period === 'semana' ? 6.2 : period === 'mes' ? 24.5 : 1.0;
  const items = sourceData.slice(0, 5).map((item, idx) => ({
    ...item,
    rank: idx + 1,
    salesAmount: Math.round(item.salesAmount * multiplier * 100) / 100,
    ticketsCount: Math.round(item.ticketsCount * multiplier),
    netProfit: item.netProfit ? Math.round(item.netProfit * multiplier * 100) / 100 : undefined,
  }));

  const totalTopSales = items.reduce((sum, item) => sum + item.salesAmount, 0);

  // Rank badge styling
  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 font-black ring-2 ring-amber-400/20';
      case 2:
        return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-bold';
      case 3:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300/80 font-bold';
      case 4:
      case 5:
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200 font-bold';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between transition-all ${className}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/70 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Top 5 Grupos
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Grupos y zonas con mayor volumen de ventas
              </p>
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 rounded-lg border border-blue-200 dark:border-blue-800 shadow-2xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              TOP 5 GRUPOS
            </span>
          </div>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center justify-between pt-3 pb-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ranking por Recaudación
          </span>

          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[11px] font-semibold">
            {(['hoy', 'semana', 'mes'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                  period === p
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p === 'hoy' ? 'Hoy' : p === 'semana' ? '7 Días' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-2.5 mt-1">
          {items.map((item) => {
            const pct = item.percentage ?? (totalTopSales > 0 ? Math.round((item.salesAmount / totalTopSales) * 100) : 0);
            return (
              <div
                key={item.groupId || item.groupName}
                onClick={onNavigateGroups}
                className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 hover:border-blue-400/40 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left Column: Rank Badge + Group Name + Terminals/Tickets */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 shadow-2xs ${getRankBadgeStyle(
                        item.rank
                      )}`}
                    >
                      {item.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.groupName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300 font-semibold">
                          <Store className="w-3 h-3 text-blue-500" />
                          {item.terminalsCount} bancas
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Ticket className="w-3 h-3 text-emerald-500" />
                          {item.ticketsCount} tickets
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Sales Amount & Percentage */}
                  <div className="text-right shrink-0 pl-2">
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white block">
                      RD${' '}
                      {item.salesAmount.toLocaleString('es-DO', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                      {pct}% del top
                    </span>
                  </div>
                </div>

                {/* Progress bar visualizing percentage of top */}
                <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rank === 1
                        ? 'bg-amber-500'
                        : item.rank === 2
                        ? 'bg-blue-500'
                        : item.rank === 3
                        ? 'bg-indigo-500'
                        : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Footer: Summary & Action */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          <span className="text-[11px]">Total Top 5 Grupos: </span>
          <span className="font-mono font-black text-slate-900 dark:text-white">
            RD${' '}
            {totalTopSales.toLocaleString('es-DO', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {onNavigateGroups && (
          <button
            type="button"
            onClick={onNavigateGroups}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos los grupos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
