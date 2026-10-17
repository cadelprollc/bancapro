import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Smartphone,
  Package,
  BarChart3,
  Trophy,
  Settings,
  Wallet,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
  Monitor,
  LogOut,
  Printer,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Crown,
} from 'lucide-react';
import { User, DashboardMetrics, Lottery, LotteryResult } from '../../types';
import { getLotteriesClosingSoon, getLotteryScheduleStatus } from '../../utils/lotterySchedule';
import { printerService } from '../../services/printerService';

interface MobileDashboardProps {
  user: User;
  metrics: DashboardMetrics;
  lotteries?: Lottery[];
  results?: LotteryResult[];
  onNavigate: (tab: string, extraData?: any) => void;
  onTogglePosLayout?: (layout: 'mobile' | 'desktop') => void;
  onLogout?: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  user,
  metrics,
  lotteries = [],
  results = [],
  onNavigate,
  onTogglePosLayout,
  onLogout,
}) => {
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [printerConnected, setPrinterConnected] = useState<boolean>(true);

  // Reloj en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('es-DO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentDateTime(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detectar estado de impresora
  useEffect(() => {
    printerService.getConfig(terminalCode).then((cfg) => {
      setPrinterConnected(Boolean(cfg.printerName));
    }).catch(() => setPrinterConnected(false));
  }, [terminalCode]);

  // Sorteos cerrando próximamente
  const closingSoonList = lotteries ? getLotteriesClosingSoon(lotteries) : [];
  const openLotteriesCount = lotteries ? lotteries.filter((l) => getLotteryScheduleStatus(l).isOpen).length : 0;

  // Cálculo de estado financiero rápido (Ventas - Premios)
  const ventasHoy = metrics?.ventasHoy || 0;
  const premiosPagados = metrics?.premiosPagados || 0;
  const balanceOperativo = ventasHoy - premiosPagados;
  const isLosing = balanceOperativo < 0;

  // 6 Módulos Principales del Dashboard Móvil según requerimiento del usuario:
  // 1. LOTERÍAS | 2. RECARGAS | 3. PRODUCTOS | 4. REPORTES | 5. GANADORES | 6. AJUSTES
  const mobileMenuItems = [
    {
      id: 'sales',
      title: 'Loterías',
      subtitle: 'Venta de boletos, quinielas, palé y tripletas',
      tag: 'Terminal POS',
      icon: Ticket,
      gradient: 'from-blue-600 to-indigo-600',
      shadowColor: 'shadow-blue-500/25',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/20',
      activeColor: 'border-blue-500/40',
      action: () => onNavigate('sales'),
    },
    {
      id: 'recargas',
      title: 'Recargas',
      subtitle: 'Claro, Altice, Viva y paqueticos de datos',
      tag: 'Saldo directo',
      icon: Smartphone,
      gradient: 'from-sky-500 to-blue-600',
      shadowColor: 'shadow-sky-500/25',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      activeColor: 'border-sky-500/40',
      action: () => onNavigate('recargas'),
    },
    {
      id: 'productos',
      title: 'Productos',
      subtitle: 'Pines digitales, deportes y facturas',
      tag: 'Multiservicios',
      icon: Package,
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/25',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      activeColor: 'border-emerald-500/40',
      action: () => onNavigate('productos'),
    },
    {
      id: 'reports',
      title: 'Reportes',
      subtitle: 'Balance de caja, ventas, cuadre y premios',
      tag: 'Finanzas & Arqueo',
      icon: BarChart3,
      gradient: 'from-purple-600 to-pink-600',
      shadowColor: 'shadow-purple-500/25',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      activeColor: 'border-purple-500/40',
      action: () => onNavigate('reports'),
    },
    {
      id: 'results',
      title: 'Ganadores',
      subtitle: 'Resultados oficiales y números premiados',
      tag: 'Sorteos en vivo',
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/25',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      activeColor: 'border-amber-500/40',
      action: () => onNavigate('results'),
    },
    {
      id: 'settings',
      title: 'Ajustes',
      subtitle: 'Impresora Bluetooth, código QR y configuración',
      tag: 'Impresión Móvil',
      icon: Settings,
      gradient: 'from-slate-600 to-slate-800',
      shadowColor: 'shadow-slate-500/25',
      badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
      activeColor: 'border-slate-500/40',
      action: () => onNavigate('settings'),
    },
  ];

  const handleItemClick = (action: () => void) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {}
    action();
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3.5 font-sans pb-10 animate-in fade-in duration-200">
      {/* 1. Header Superior Móvil Minimalista y Fresco */}
      <header className="bg-white/95 dark:bg-[#0d172a]/95 backdrop-blur-sm rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          {/* Identidad de la Banca */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-xl shadow-md shadow-blue-500/25 shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Banca La Express
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  EN LÍNEA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Terminal <strong className="text-slate-800 dark:text-slate-200 font-bold">#{terminalCode}</strong> · {user.name || user.username}
              </p>
            </div>
          </div>

          {/* Controles de Vista PC / Salir */}
          <div className="flex items-center gap-1.5">
            {onTogglePosLayout && (
              <button
                type="button"
                onClick={() => {
                  handleItemClick(() => onTogglePosLayout('desktop'));
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Cambiar a vista de computadora (PC)"
              >
                <Monitor className="w-4 h-4" />
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  handleItemClick(onLogout);
                }}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-barra de hora y estado de sorteos */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-semibold">{currentDateTime}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {openLotteriesCount} sorteos abiertos
            </span>
          </div>
        </div>
      </header>

      {/* 2. Banner de Cierre Próximo (Si hay sorteos por cerrar en <20 min) */}
      {closingSoonList.length > 0 && (
        <div
          onClick={() => handleItemClick(() => onNavigate('sales'))}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-black">Cierre Próximo: </span>
              <span className="font-bold">{closingSoonList[0].lottery.name}</span>
              <span className="font-mono font-black ml-1 text-amber-700 dark:text-amber-300">
                ({closingSoonList[0].status.formattedCountdown})
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
        </div>
      )}

      {/* 3. Tarjeta de Resumen Rápido de la Terminal */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-4.5 shadow-md border border-slate-800 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ventas del Turno
            </p>
            <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
              RD$ {ventasHoy.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => handleItemClick(() => onNavigate('reports'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 border border-white/10 shadow-2xs"
            >
              <span>Ver Cuadre</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            </button>
          </div>
        </div>

        {/* Métricas secundarias en 3 columnas */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Jugadas</p>
            <p className="text-sm font-black text-white mt-0.5 font-mono">{metrics?.jugadasCount || 0}</p>
          </div>

          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Premios</p>
            <p className="text-sm font-black text-amber-400 mt-0.5 font-mono">
              RD${Math.round(premiosPagados).toLocaleString()}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Estado</p>
            <p className={`text-xs font-black mt-1 ${isLosing ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isLosing ? '🔴 Pérdida' : '🟢 Positivo'}
            </p>
          </div>
        </div>
      </section>

      {/* 3.5. Consola Súper Máster: Personalización Total del Sistema */}
      {user.role === 'SUPER_ADMIN' && (
        <section
          onClick={() => handleItemClick(() => onNavigate('master-customization'))}
          className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300/50 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 border border-slate-950/15">
                  Súper Máster
                </span>
                <span className="text-[10px] font-bold text-slate-900">
                  Control Total
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-950 tracking-tight mt-0.5 truncate">
                Ajustar Todo el Sistema
              </h3>
              <p className="text-[11px] font-semibold text-slate-900/80 line-clamp-1">
                Cambiar color, fondo de pantalla y logos de loterías
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-950/15 flex items-center justify-center text-slate-950 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <ChevronRight className="w-5 h-5" />
          </div>
        </section>
      )}

      {/* 4. TÍTULO DE SECCIÓN Y CUADRÍCULA DE 6 BOTONES PRINCIPALES */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Módulos del Sistema
          </h2>
          <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400">
            Toque para acceder
          </span>
        </div>

        {/* Cuadrícula Adaptable de 2 Columnas con Botones Grandes, Claros y Separados */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.action)}
                className={`group relative flex flex-col justify-between p-4 rounded-3xl bg-white dark:bg-[#0d172a] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-150 active:scale-[0.97] text-left cursor-pointer min-h-[142px] sm:min-h-[155px] overflow-hidden ${item.activeColor}`}
              >
                {/* Indicador de toque sutil */}
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white shadow-md ${item.shadowColor} shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <span
                    className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.tag}
                  </span>
                </div>

                {/* Textos y Etiquetas */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                      {item.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Acceso Rápido Secundario: Consulta de Tickets */}
      <section className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 shadow-xs">
        <button
          type="button"
          onClick={() => handleItemClick(() => onNavigate('lookup'))}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Consultar o Pagar Ticket
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Verifica validez, estado y cobro de premios
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* 6. Footer de Estado del Dispositivo */}
      <footer className="text-center pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <span className="flex items-center gap-1 font-bold">
          <Printer className={`w-3.5 h-3.5 ${printerConnected ? 'text-emerald-500' : 'text-slate-400'}`} />
          {printerConnected ? 'Impresora 58mm Lista' : 'Impresora no detectada'}
        </span>
        <span>•</span>
        <span>Modo Móvil Optimizado</span>
      </footer>
    </div>
  );
};
