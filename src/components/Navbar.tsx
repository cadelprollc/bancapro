import React, { useState, useEffect } from 'react';
import { User } from '../types/index';
import { LogOut, Monitor, Smartphone, UserCheck } from 'lucide-react';

interface NavbarProps {
  user: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  posLayout?: 'mobile' | 'desktop';
  onTogglePosLayout?: (layout: 'mobile' | 'desktop') => void;
  onCheckUpdates?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onLogout,
  posLayout = 'mobile',
  onTogglePosLayout,
  onCheckUpdates,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const appVersion = localStorage.getItem('bancapro_app_version') || 'v1.1.0';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const terminalTabs = [
    { id: 'pos', label: 'Venta de Tickets' },
    { id: 'reports', label: 'Mis Ventas y Cuadre' },
    { id: 'lookup', label: 'Consultar / Pagar' },
    { id: 'results', label: 'Resultados del Día' },
    { id: 'settings', label: '⚙️ Ajustes' },
  ];

  // Super Admin has master tabs (Requirement 22 & 23)
  const superAdminTabs = [
    { id: 'superadmin', label: '👑 Panel Súper Admin' },
    { id: 'updates', label: '🔄 Actualizaciones' },
    { id: 'groups', label: '🏢 Grupos' },
    { id: 'invoices', label: 'Facturas' },
    { id: 'terminals', label: 'Terminales' },
    { id: 'monitoring', label: 'Monitoreo de Jugadas' },
    { id: 'lotteries', label: 'Loterías' },
    { id: 'results-admin', label: 'Publicar Resultados' },
    { id: 'topes', label: 'Topes de Venta' },
    { id: 'prizes', label: 'Premios' },
    { id: 'admin-reports', label: 'Reportes Globales' },
    { id: 'master-customization', label: '🎨 Ajustes del Sistema' },
    { id: 'pos', label: 'Venta Rápida' },
    { id: 'settings', label: '⚙️ Ajustes' },
  ];

  // Consorcio Admin tabs filtered by specific permissions (Requirement 4 & 8)
  const userPermissions = (user as any).permissions || {};
  const consorcioAdminTabs: Array<{ id: string; label: string }> = [
    { id: 'pos', label: 'Venta Rápida' },
    { id: 'groups', label: '🏢 Grupos' },
  ];

  if (userPermissions.monitoring !== false) {
    consorcioAdminTabs.push({ id: 'monitoring', label: 'Monitoreo de Jugadas' });
  }
  if (userPermissions.terminals !== false) {
    consorcioAdminTabs.push({ id: 'terminals', label: 'Terminales' });
  }
  if (userPermissions.lotteries !== false) {
    consorcioAdminTabs.push({ id: 'lotteries', label: 'Configuración Loterías' });
  }
  if (userPermissions.results !== false) {
    consorcioAdminTabs.push({ id: 'results-admin', label: 'Publicar Resultados' });
  }
  if (userPermissions.topes !== false) {
    consorcioAdminTabs.push({ id: 'topes', label: 'Topes de Venta' });
  }
  if (userPermissions.prizes !== false) {
    consorcioAdminTabs.push({ id: 'prizes', label: 'Premios' });
  }
  if (userPermissions.reports !== false) {
    consorcioAdminTabs.push({ id: 'admin-reports', label: 'Reportes Empresa' });
  }
  if (userPermissions.invoices !== false) {
    consorcioAdminTabs.push({ id: 'invoices', label: 'Facturas' });
  }
  consorcioAdminTabs.push({ id: 'settings', label: '⚙️ Ajustes' });
  consorcioAdminTabs.push({ id: 'lookup', label: 'Consultar Ticket' });

  const tabs =
    user.role === 'SUPER_ADMIN'
      ? superAdminTabs
      : user.role === 'ADMIN'
      ? consorcioAdminTabs
      : terminalTabs;

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            B
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap">
            BancaPro <span className="text-emerald-700 font-semibold text-xs tracking-normal uppercase ml-1 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">RD</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Pos View Toggle (if on sales tab) */}
        {activeTab === 'pos' && onTogglePosLayout && (
          <div className="hidden md:flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs shrink-0">
            <button
              onClick={() => onTogglePosLayout('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                posLayout === 'mobile'
                  ? 'bg-neutral-900 text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Interfaz Móvil Táctil (Android POS)"
            >
              <Smartphone className="w-3 h-3" />
              <span>📱 Móvil</span>
            </button>
            <button
              onClick={() => onTogglePosLayout('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                posLayout === 'desktop'
                  ? 'bg-neutral-900 text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Interfaz Mostrador Pro (PC / Teclado)"
            >
              <Monitor className="w-3 h-3" />
              <span>🖥️ Mostrador PC</span>
            </button>
          </div>
        )}

        {/* Zone 3: Time, User Profile & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Version badge */}
          <button
            onClick={onCheckUpdates}
            title="Verificar actualizaciones del sistema"
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-[10px] font-mono font-bold text-neutral-600 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{appVersion}</span>
          </button>

          <div className="hidden sm:flex flex-col text-right">
            <span className="font-mono text-xs font-semibold tabular-nums text-neutral-800">
              {currentTime}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">
              {user.role === 'SUPER_ADMIN' ? (
                <span className="text-amber-600 font-bold">👑 Súper Administrador Global</span>
              ) : user.role === 'ADMIN' ? (
                <span className="text-indigo-600 font-bold">
                  {user.name} (Admin Consorcio)
                </span>
              ) : (
                `Terminal #${user.terminalCode || user.username}`
              )}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-neutral-100 overflow-x-auto bg-neutral-50 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 transition-colors ${
                isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
