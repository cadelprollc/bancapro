import React, { useState, useEffect } from 'react';
import { Search, User, Store, Ticket, Hash, CircleDot, BarChart3, ArrowRight } from 'lucide-react';
import { Lottery } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, extraData?: any) => void;
  lotteries?: Lottery[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  lotteries = [],
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items based on query
  const q = query.trim().toLowerCase();

  const quickNav = [
    { title: 'Venta de Tickets (POS)', tab: 'sales', icon: <Ticket className="w-4 h-4 text-blue-500" />, desc: 'Nueva jugada de Quiniela, Palé, Tripleta' },
    { title: 'Bancas y Terminales', tab: 'bancas', icon: <Store className="w-4 h-4 text-emerald-500" />, desc: 'Bancas activas, terminales y cuadre' },
    { title: 'Gestión de Usuarios', tab: 'users', icon: <User className="w-4 h-4 text-purple-500" />, desc: 'Administradores, supervisores y cajeros' },
    { title: 'Loterías y Sorteos', tab: 'lotteries', icon: <CircleDot className="w-4 h-4 text-amber-500" />, desc: 'Horarios, apertura y cierre' },
    { title: 'Resultados y Ganadores', tab: 'results', icon: <Hash className="w-4 h-4 text-rose-500" />, desc: 'Publicar o consultar premios' },
    { title: 'Reportes y Finanzas', tab: 'reports', icon: <BarChart3 className="w-4 h-4 text-cyan-500" />, desc: 'Ventas, comisiones y balances' },
  ];

  const matchedLotteries = lotteries.filter(
    (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white z-10 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar loterías, números, usuarios, tickets, bancas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-base text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md hover:bg-slate-200"
            >
              Limpiar
            </button>
          )}
          <kbd className="ml-3 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results / Navigation */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Matching Lotteries */}
          {q && matchedLotteries.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Loterías Coincidentes
              </p>
              <div className="space-y-1">
                {matchedLotteries.map((lot) => (
                  <button
                    key={lot.id}
                    onClick={() => {
                      onNavigate('sales', { selectedLotteryId: lot.id });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        🎱
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{lot.name}</p>
                        <p className="text-xs text-slate-400">
                          Cierre: {lot.drawTime || lot.closeTime || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      Jugar ahora <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Modules */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              {q ? 'Módulos Sugeridos' : 'Acceso Rápido al Sistema'}
            </p>
            <div className="space-y-1">
              {quickNav
                .filter(
                  (item) =>
                    !q ||
                    item.title.toLowerCase().includes(q) ||
                    item.desc.toLowerCase().includes(q)
                )
                .map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      onNavigate(item.tab);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Presiona <strong>ESC</strong> para salir</span>
          <span className="text-[11px] text-slate-400">BancaPro SaaS Enterprise</span>
        </div>
      </div>
    </div>
  );
};
