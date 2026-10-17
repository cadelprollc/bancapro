import React, { useState } from 'react';
import { HotPlayNumber, PlayType } from '../../types/index';
import { Flame, ArrowRight, TrendingUp } from 'lucide-react';

interface HotNumbersCardProps {
  hotNumbers?: HotPlayNumber[];
  onNavigateSales?: () => void;
  onNavigateTopes?: () => void;
  className?: string;
}

export const HotNumbersCard: React.FC<HotNumbersCardProps> = ({
  hotNumbers = [],
  onNavigateSales,
  onNavigateTopes,
  className = '',
}) => {
  const [displayCount, setDisplayCount] = useState<5 | 10>(10);
  const [selectedPlayType, setSelectedPlayType] = useState<PlayType | 'ALL'>('ALL');

  // Realistic default data matching user's uploaded reference image (IMG_2269.png)
  const defaultHotNumbers: HotPlayNumber[] = [
    { number: '25', numbers: ['25'], playType: 'QUINIELA', totalAmount: 200.0, ticketsCount: 4, rank: 1 },
    { number: '99', numbers: ['99'], playType: 'QUINIELA', totalAmount: 200.0, ticketsCount: 2, rank: 2 },
    { number: '24', numbers: ['24'], playType: 'QUINIELA', totalAmount: 160.0, ticketsCount: 2, rank: 3 },
    { number: '27', numbers: ['27'], playType: 'QUINIELA', totalAmount: 160.0, ticketsCount: 2, rank: 4 },
    { number: '13', numbers: ['13'], playType: 'QUINIELA', totalAmount: 150.0, ticketsCount: 2, rank: 5 },
    { number: '26', numbers: ['26'], playType: 'QUINIELA', totalAmount: 140.0, ticketsCount: 2, rank: 6 },
    { number: '42', numbers: ['42'], playType: 'QUINIELA', totalAmount: 100.0, ticketsCount: 2, rank: 7 },
    { number: '01', numbers: ['01'], playType: 'QUINIELA', totalAmount: 100.0, ticketsCount: 1, rank: 8 },
    { number: '31', numbers: ['31'], playType: 'QUINIELA', totalAmount: 80.0, ticketsCount: 2, rank: 9 },
    { number: '15-28', numbers: ['15', '28'], playType: 'PALE', totalAmount: 75.0, ticketsCount: 3, rank: 10 },
  ];

  const sourceData = hotNumbers && hotNumbers.length > 0 ? hotNumbers : defaultHotNumbers;

  // Filter by play type if selected
  const filtered = sourceData.filter((item) => {
    if (selectedPlayType === 'ALL') return true;
    return item.playType === selectedPlayType;
  });

  const items = filtered.slice(0, displayCount).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const totalLoadedAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

  // Helper for play type label display
  const getPlayTypeLabel = (type: PlayType) => {
    switch (type) {
      case 'QUINIELA':
        return 'Quiniela';
      case 'PALE':
        return 'Palé';
      case 'TRIPLETA':
        return 'Tripleta';
      case 'SUPER_PALE':
        return 'Súper Palé';
      default:
        return 'Quiniela';
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
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base text-rose-500">🔥</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Números calientes
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Mas jugado el dia de hoy
              </p>
            </div>
          </div>

          {/* Badge & Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDisplayCount((prev) => (prev === 10 ? 5 : 10))}
              className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs cursor-pointer"
              title="Alternar entre Top 10 y Top 5"
            >
              TOP {displayCount}
            </button>
          </div>
        </div>

        {/* Play Type Filter Tabs */}
        <div className="flex items-center justify-between pt-3 pb-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Jugadas más cargadas
          </span>

          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[11px] font-semibold">
            {(['ALL', 'QUINIELA', 'PALE', 'TRIPLETA'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedPlayType(t)}
                className={`px-2 py-0.5 rounded-md capitalize transition-all ${
                  selectedPlayType === t
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'Todas' : t === 'QUINIELA' ? 'Quiniela' : t === 'PALE' ? 'Palé' : 'Tripleta'}
              </button>
            ))}
          </div>
        </div>

        {/* Hot Numbers List */}
        <div className="space-y-2.5 mt-1">
          {items.map((item, idx) => (
            <div
              key={`${item.playType}-${item.number}-${idx}`}
              onClick={onNavigateTopes || onNavigateSales}
              className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 hover:border-blue-400/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99]"
            >
              {/* Left Column: Circular Blue Number Ball */}
              <div className="flex items-center gap-3">
                {item.numbers && item.numbers.length > 1 ? (
                  <div className="flex items-center -space-x-1.5">
                    {item.numbers.map((n, i) => (
                      <span
                        key={i}
                        className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                    {item.number}
                  </div>
                )}
              </div>

              {/* Center Column: Play Type Tag */}
              <div>
                <span className="inline-block px-3 py-1 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs">
                  {getPlayTypeLabel(item.playType)}
                </span>
              </div>

              {/* Right Column: Amount & Plays count */}
              <div className="text-right">
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                  RD${' '}
                  {item.totalAmount.toLocaleString('es-DO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs text-slate-400 font-medium block">
                  {item.ticketsCount} {item.ticketsCount === 1 ? 'jugada' : 'jugadas'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer: Summary & Link */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          <span className="text-[11px]">Total apostado: </span>
          <span className="font-mono font-black text-slate-900 dark:text-white">
            RD${' '}
            {totalLoadedAmount.toLocaleString('es-DO', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateTopes || onNavigateSales}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Monitorear topes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
