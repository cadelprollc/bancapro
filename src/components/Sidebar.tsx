import React from 'react';
import {
  Home,
  Ticket,
  CircleDot,
  Store,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  Building2,
  RefreshCw,
  X,
  Smartphone,
  TrendingUp,
  Trophy,
  ShieldCheck,
  Award,
  Layers,
  Package,
  Palette,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
  systemName?: string;
  consorcioName?: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  systemName = 'Banca La Express',
  consorcioName,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdminOrSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // 1. Sección Operación Diaria
  const operationItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'sales', label: 'Vender Loterías', icon: Ticket },
    { id: 'recargas', label: 'Recargas Telefónicas', icon: Smartphone },
    { id: 'productos', label: 'Productos & Servicios', icon: Package },
    { id: 'lotteries', label: 'Loterías & Horarios', icon: CircleDot },
    { id: 'winners', label: 'Ganadores & Premios', icon: Trophy },
    { id: 'bancas', label: 'Bancas', icon: Store },
  ];

  // 2. Sección Control & Gestión
  const managementItems = [
    ...(isAdminOrSuper
      ? [
          { id: 'publish-results', label: 'Subir Números Ganadores', icon: Award },
          { id: 'groups', label: 'Grupos & Zonas', icon: Layers },
          { id: 'terminal-sales', label: 'Ventas por Terminal', icon: TrendingUp },
          { id: 'devices', label: 'Terminales / Dispositivos', icon: Smartphone },
        ]
      : []),
    { id: 'reports', label: 'Reportes Financieros', icon: BarChart3 },
  ];

  // 3. Sección Sistema & Administración
  const adminItems = [
    { id: 'users', label: 'Usuarios', icon: Users },
    ...(isSuperAdmin
      ? [
          { id: 'master-customization', label: 'Personalización Súper Máster', icon: Palette },
          { id: 'admin-permissions', label: 'Permisos Administradores', icon: ShieldCheck },
          { id: 'consorcios', label: 'Consorcios SaaS', icon: Building2 },
          { id: 'updates', label: 'Actualizaciones OTA', icon: RefreshCw },
        ]
      : []),
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'support', label: 'Soporte Técnico', icon: HelpCircle },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#070d18] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/20">
              ⚡
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {systemName}
              </h1>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {consorcioName || 'Sistema Administrativo'}
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items Organized by Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {/* 1. OPERACIÓN */}
          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Operación
            </p>
            <div className="space-y-0.5">
              {operationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CONTROL & GESTIÓN */}
          {managementItems.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Control & Gestión
              </p>
              <div className="space-y-0.5">
                {managementItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ADMINISTRACIÓN */}
          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Administración
            </p>
            <div className="space-y-0.5">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info Strip */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sistema en línea
            </span>
            <span className="font-mono text-[10px] text-slate-400">Consorcio Activo</span>
          </div>
        </div>
      </aside>
    </>
  );
};
