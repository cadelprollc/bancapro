import React from 'react';
import { User } from '../../types';
import {
  Ticket,
  Calculator,
  Award,
  Trophy,
  BarChart3,
  Printer,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  LogOut,
  Sparkles,
  Wallet,
  Search,
  Package,
  LayoutDashboard,
  Settings,
  ArrowLeft,
} from 'lucide-react';

interface TerminalNavbarProps {
  user: User;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  posLayout: 'mobile' | 'desktop';
  onTogglePosLayout: (layout: 'mobile' | 'desktop') => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onLogout?: () => void;
}

export const TerminalNavbar: React.FC<TerminalNavbarProps> = ({
  user,
  activeTab,
  onNavigateTab,
  posLayout,
  onTogglePosLayout,
  isFullScreen,
  onToggleFullScreen,
  onLogout,
}) => {
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');

  const navItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      shortLabel: 'Inicio',
      icon: LayoutDashboard,
    },
    {
      id: 'sales',
      label: 'Vender Loterías',
      shortLabel: 'Loterías',
      icon: Ticket,
    },
    {
      id: 'recargas',
      label: 'Recargas Telefónicas',
      shortLabel: 'Recargas',
      icon: Smartphone,
    },
    {
      id: 'productos',
      label: 'Productos & Servicios',
      shortLabel: 'Productos',
      icon: Package,
    },
    {
      id: 'reports',
      label: 'Reportes y Cuadre',
      shortLabel: 'Reportes',
      icon: Wallet,
    },
    {
      id: 'results',
      label: 'Números Ganadores',
      shortLabel: 'Ganadores',
      icon: Trophy,
    },
    {
      id: 'settings',
      label: 'Ajustes',
      shortLabel: 'Ajustes',
      icon: Settings,
    },
    ...(user.role === 'SUPER_ADMIN'
      ? [
          {
            id: 'master-customization',
            label: 'Ajustes Súper Máster',
            shortLabel: 'Súper Máster',
            icon: Sparkles,
          },
        ]
      : []),
  ];

  // 1. MODO MÓVIL:
  // - En la pantalla de inicio (dashboard): Ocultar esta barra para que MobileDashboard sea limpio,
  //   sin duplicar cabeceras ni amontonar botones.
  // - En los submódulos (ventas, recargas, productos, reportes, ganadores, ajustes):
  //   Mostrar una barra superior compacta, cómoda y fresca con botón directo "← Inicio".
  if (posLayout === 'mobile') {
    if (activeTab === 'dashboard') {
      return null;
    }

    const currentItem = navItems.find((item) => item.id === activeTab) || {
      id: activeTab,
      label: activeTab === 'lookup' ? 'Consultar Tickets' : 'Módulo',
      shortLabel: activeTab === 'lookup' ? 'Tickets' : 'Módulo',
      icon: Ticket,
    };
    const CurrentIcon = currentItem.icon;

    return (
      <header className="w-full bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-xs sticky top-0 z-40 px-3 py-2 animate-in fade-in duration-150">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Botón Cómodo para Volver al Dashboard */}
          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
            title="Volver al Dashboard Principal"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          {/* Nombre del Módulo Actual */}
          <div className="flex items-center gap-1.5 truncate">
            <CurrentIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-black text-white tracking-tight truncate">
              {currentItem.label}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
              #{terminalCode}
            </span>
          </div>

          {/* Controles: Cambiar a PC y Salir */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onTogglePosLayout('desktop')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Cambiar a vista de computadora (PC)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Terminal Identity & Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-xs shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-black tracking-tight text-white">
                  Terminal #{terminalCode}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  EN LÍNEA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {user.name || user.username} {user.consorcioId ? `· Consorcio` : ''}
              </p>
            </div>
          </div>

          {/* Quick logout & fullscreen for mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => onTogglePosLayout(posLayout === 'desktop' ? 'mobile' : 'desktop')}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              title="Cambiar vista PC / Móvil"
            >
              {posLayout === 'desktop' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 text-xs"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Every terminal sees Cuadre, Winning Numbers, Winning Tickets, Reports) */}
        <nav className="flex items-center overflow-x-auto w-full md:w-auto scrollbar-none py-1 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/40 ring-1 ring-blue-400'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Switcher, Fullscreen, Logout */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Switcher PC / Móvil */}
          <div className="flex items-center p-0.5 bg-slate-800 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onTogglePosLayout('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                (posLayout as string) === 'desktop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo pantalla grande para PC con teclado numérico"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC</span>
            </button>
            <button
              type="button"
              onClick={() => onTogglePosLayout('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                (posLayout as string) === 'mobile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo móvil táctil optimizado para celular / tablet"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Móvil</span>
            </button>
          </div>

          {/* Fullscreen */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-bold transition-colors"
              title="Cerrar sesión de la terminal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
