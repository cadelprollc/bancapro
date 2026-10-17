import React, { useState, useEffect } from 'react';
import {
  User,
  Lottery,
  LotteryResult,
  Terminal,
  DashboardMetrics,
  AppNotification,
  Consorcio,
} from './types/index';
import { api } from './services/api';

// Design System & Layout
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/design-system/GlobalSearchModal';
import { NotificationsDrawer } from './components/design-system/NotificationsDrawer';

// Main Views
import { LoginView } from './components/LoginView';
import { ModernDashboard } from './components/dashboard/ModernDashboard';
import { PosView } from './components/pos/PosView';
import { DesktopPosView } from './components/pos/DesktopPosView';
import { LotteriesManagement } from './components/admin/LotteriesManagement';
import { ResultsView } from './components/common/ResultsView';
import { PublishResultsView } from './components/admin/PublishResultsView';
import { BancasCuadreView } from './components/admin/BancasCuadreView';
import { UsersManagementView } from './components/admin/UsersManagementView';
import { AdminReportsView } from './components/admin/AdminReportsView';
import { TerminalReportsView } from './components/terminal/TerminalReportsView';
import { TerminalCuadreView } from './components/terminal/TerminalCuadreView';
import { TerminalNavbar } from './components/terminal/TerminalNavbar';
import { SettingsView } from './components/terminal/SettingsView';
import { SupportView } from './components/common/SupportView';
import { TicketLookupView } from './components/common/TicketLookupView';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { SystemUpdatesManagement } from './components/admin/SystemUpdatesManagement';
import { DevicesManagementView } from './components/admin/DevicesManagementView';
import { TerminalSalesView } from './components/admin/TerminalSalesView';
import { WinnersPayoutView } from './components/admin/WinnersPayoutView';
import { AdminPermissionsView } from './components/admin/AdminPermissionsView';
import { GroupsManagement } from './components/admin/GroupsManagement';
import { UpdateNotificationModal } from './components/common/UpdateNotificationModal';
import { VenderLoteriasModule } from './components/seller/VenderLoteriasModule';
import { MasterSystemCustomizationView } from './components/admin/MasterSystemCustomizationView';
import { MobileDashboard } from './components/dashboard/MobileDashboard';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [manualUpdateModal, setManualUpdateModal] = useState(false);
  const [posConfig, setPosConfig] = useState<{ playType?: any; selectedLotteryId?: string } | null>(null);

  // Core Data
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      type: 'sale',
      title: 'Nueva venta confirmada',
      message: 'Ticket #TK-4587 emitido en Banca 08 por RD$ 300 (Palé).',
      timestamp: 'Hace 5 min',
      read: false,
      linkTab: 'sales',
    },
    {
      id: 'notif-2',
      type: 'prize',
      title: 'Premio pagado en efectivo',
      message: 'Premio de RD$ 2,400 acreditado en Terminal 0002.',
      timestamp: 'Hace 22 min',
      read: false,
      linkTab: 'reports',
    },
    {
      id: 'notif-3',
      type: 'terminal_blocked',
      title: 'Terminal 0003 autorizada',
      message: 'Dispositivo vinculado con token SHA-256 verificado.',
      timestamp: 'Hace 1 hora',
      read: false,
      linkTab: 'bancas',
    },
  ]);

  // Intelligent auto-detection of device (PC / Desktop vs Mobile / Tablet)
  const [posLayout, setPosLayout] = useState<'mobile' | 'desktop'>(() => {
    const saved = localStorage.getItem('bancapro_pos_layout');
    if (saved === 'desktop' || saved === 'mobile') return saved;
    if (typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
      return isMobile ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  // Full-screen PC POS Mode
  const [posFullScreen, setPosFullScreen] = useState<boolean>(() => {
    return localStorage.getItem('bancapro_pos_fullscreen') === 'true';
  });

  const handleTogglePosFullScreen = () => {
    setPosFullScreen((prev) => {
      const next = !prev;
      localStorage.setItem('bancapro_pos_fullscreen', String(next));
      if (next && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      return next;
    });
  };

  // Sync fullscreen change from browser (e.g. user pressed Esc or F11)
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && posFullScreen) {
        // Can optionally synchronize
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [posFullScreen]);

  // Responsive listener when device orientation or window size changes (if user hasn't explicitly locked preference)
  useEffect(() => {
    const handleResize = () => {
      const saved = localStorage.getItem('bancapro_pos_layout');
      if (!saved) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
        setPosLayout(isMobile ? 'mobile' : 'desktop');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSetPosLayout = (layout: 'mobile' | 'desktop') => {
    setPosLayout(layout);
    localStorage.setItem('bancapro_pos_layout', layout);
  };

  // Rule: El sistema debe reconocer automáticamente el tipo de terminal que fue asignado por el administrador.
  // Si la terminal fue configurada como PC, debe cargar automáticamente la interfaz diseñada para PC ('desktop').
  // Si la terminal fue configurada como Móvil, debe cargar automáticamente la interfaz móvil ('mobile').
  // La configuración está vinculada al registro de la terminal en la base de datos y no depende únicamente del navegador.
  useEffect(() => {
    if (!user) return;

    let targetType: 'PC' | 'MOVIL' | undefined = user.terminalType;

    if (user.terminalCode && terminals.length > 0) {
      const currentTerminal = terminals.find((t) => t.code === user.terminalCode);
      if (currentTerminal?.terminalType) {
        targetType = currentTerminal.terminalType;
      }
    }

    if (targetType) {
      const layout = targetType === 'PC' ? 'desktop' : 'mobile';
      setPosLayout(layout);
      localStorage.setItem('bancapro_pos_layout', layout);
    }
  }, [user, user?.terminalCode, user?.terminalType, terminals]);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('bancapro_token');
    if (token) {
      api
        .getMe()
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
            if (res.user.role === 'TERMINAL' || res.user.terminalCode) {
              setActiveTab('sales');
            }
          } else {
            localStorage.removeItem('bancapro_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('bancapro_token');
        })
        .finally(() => {
          setLoadingInitial(false);
        });
    } else {
      setLoadingInitial(false);
    }
  }, []);

  // Listen for session expiration event across the entire application
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem('bancapro_token');
    };
    window.addEventListener('bancapro:session-expired', handleSessionExpired);
    return () => window.removeEventListener('bancapro:session-expired', handleSessionExpired);
  }, []);

  // Fetch core data when user is logged in
  const fetchData = async () => {
    if (!user) return;
    try {
      const [m, l, r, t, u, c] = await Promise.allSettled([
        api.getDashboardMetrics(user.consorcioId),
        api.getLotteries(),
        api.getResults(),
        api.getTerminals(user.consorcioId),
        api.getUsers(user.consorcioId),
        api.getConsorcios(),
      ]);

      if (m.status === 'fulfilled') setDashboardMetrics(m.value);
      if (l.status === 'fulfilled') setLotteries(l.value);
      if (r.status === 'fulfilled') setResults(r.value);
      if (t.status === 'fulfilled') setTerminals(t.value);
      if (u.status === 'fulfilled') setUsersList(u.value);
      if (c.status === 'fulfilled') setConsorcios(c.value);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Periodic device status verification (Requirement 8)
  const [deviceLockout, setDeviceLockout] = useState<{
    locked: boolean;
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'TERMINAL') {
      setDeviceLockout(null);
      return;
    }

    const deviceId = localStorage.getItem('bancapro_device_uuid') || 'DEV-8F42-K29X';

    const checkDeviceHealth = async () => {
      try {
        const res = await api.verifyDeviceStatus({
          deviceId,
          terminalCode: user.terminalCode,
        });

        if (!res.allowed && (res.status === 'BLOQUEADO' || res.status === 'INACTIVE')) {
          setDeviceLockout({
            locked: true,
            status: res.status,
            message: res.message || 'Esta terminal ha sido desactivada por el administrador.',
          });
        } else {
          setDeviceLockout(null);
        }
      } catch (err: any) {
        console.warn('Device verification error:', err);
      }
    };

    checkDeviceHealth();
    const interval = setInterval(checkDeviceHealth, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (newUser: User) => {
    setUser(newUser);
    if (newUser.role === 'TERMINAL' || newUser.terminalCode) {
      if (newUser.terminalType) {
        const layout = newUser.terminalType === 'PC' ? 'desktop' : 'mobile';
        setPosLayout(layout);
        localStorage.setItem('bancapro_pos_layout', layout);
      }
      setActiveTab('sales');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    if (userData.id) {
      await api.updateUser(userData.id, userData);
    } else {
      await api.createUser(userData);
    }
    const fresh = await api.getUsers(user?.consorcioId);
    setUsersList(fresh);
  };

  const handleDeleteUser = async (userId: string) => {
    await api.deleteUser(userId);
    const fresh = await api.getUsers(user?.consorcioId);
    setUsersList(fresh);
  };

  const handleToggleUserStatus = async (userId: string, newStatus: string) => {
    await api.toggleUserStatus(userId, newStatus);
    const fresh = await api.getUsers(user?.consorcioId);
    setUsersList(fresh);
  };

  const handleLockTerminal = async (terminalId: string, currentlyActive: boolean) => {
    await api.updateTerminal(terminalId, { active: !currentlyActive });
    const fresh = await api.getTerminals(user?.consorcioId);
    setTerminals(fresh);
  };

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30 animate-pulse">
            ⚡
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Cargando sistema BancaPro SaaS Dominicana...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Fallback metrics if API not ready yet
  const effectiveMetrics: DashboardMetrics = dashboardMetrics || {
    ventasHoy: 48750,
    ventasVariacion: 12,
    jugadasCount: 342,
    jugadasVariacion: 8,
    premiosPagados: 22400,
    premiosVariacion: 15,
    comisiones: 6120,
    comisionesVariacion: 10,
    ventasPorLoteria: [
      { name: 'Quiniela', percentage: 32, amount: 15600, color: 'bg-blue-600' },
      { name: 'Palé', percentage: 24, amount: 11700, color: 'bg-indigo-600' },
      { name: 'Súper Palé', percentage: 18, amount: 8775, color: 'bg-purple-600' },
      { name: 'Tripleta', percentage: 16, amount: 7800, color: 'bg-amber-500' },
      { name: 'Otras', percentage: 10, amount: 4875, color: 'bg-slate-400' },
    ],
    terminalesSummary: {
      total: 5,
      activas: 3,
      pendientes: 1,
      bloqueadas: 1,
      desconectadas: 0,
    },
    actividadReciente: [
      {
        id: 'act-1',
        type: 'sale',
        description: 'Venta #4587',
        amount: 300,
        date: 'Hoy',
        time: '10:32 AM',
        icon: '🎟️',
      },
      {
        id: 'act-2',
        type: 'prize',
        description: 'Premio pagado Ticket #TK-9021',
        amount: 2400,
        date: 'Hoy',
        time: '10:15 AM',
        icon: '🏆',
      },
      {
        id: 'act-3',
        type: 'user',
        description: 'Usuario creado (Admin)',
        date: 'Hoy',
        time: '09:40 AM',
        icon: '👤',
      },
      {
        id: 'act-4',
        type: 'terminal',
        description: 'Terminal activada (Banca 08)',
        date: 'Hoy',
        time: '08:50 AM',
        icon: '🟢',
      },
    ],
    promotionalBanner: {
      title: 'Tu banca, siempre en tus manos',
      subtitle: 'Ahora con nuestro sistema puedes vender y consultar desde cualquier lugar.',
      buttonText: 'Ver más',
      enabled: true,
    },
  };

  const isTerminalUser = Boolean(user && (user.role === 'TERMINAL' || user.terminalCode));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-600 selection:text-white">
      {/* Permanent Sidebar on Desktop, Drawer on Mobile (Hidden for Terminal Users and in PC Fullscreen POS Mode) */}
      {!isTerminalUser && !(activeTab === 'sales' && posLayout === 'desktop' && posFullScreen) && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (posFullScreen) {
              setPosFullScreen(false);
              localStorage.setItem('bancapro_pos_fullscreen', 'false');
            }
            setActiveTab(tab);
          }}
          userRole={user.role}
          systemName="Banca La Express"
          consorcioName={user.consorcioId ? 'Consorcio Salomón' : 'Red Nacional'}
          isOpenMobile={isOpenMobileMenu}
          onCloseMobile={() => setIsOpenMobileMenu(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`${
          isTerminalUser || (activeTab === 'sales' && posLayout === 'desktop' && posFullScreen)
            ? 'w-full'
            : 'lg:pl-64'
        } flex flex-col flex-1 min-h-screen transition-all`}
      >
        {/* Top Header (Hidden for Terminal Users and in PC Fullscreen POS Mode) */}
        {!isTerminalUser && !(activeTab === 'sales' && posLayout === 'desktop' && posFullScreen) && (
          <Header
            user={user}
            onLogout={handleLogout}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onToggleMobileMenu={() => setIsOpenMobileMenu(true)}
            notifications={notifications}
          />
        )}

        {/* Dedicated Terminal Navbar for Cashier Users */}
        {isTerminalUser && (
          <TerminalNavbar
            user={user}
            activeTab={activeTab}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
            }}
            posLayout={posLayout}
            onTogglePosLayout={handleSetPosLayout}
            isFullScreen={posFullScreen}
            onToggleFullScreen={handleTogglePosFullScreen}
            onLogout={handleLogout}
          />
        )}

        {/* Dynamic Route Content */}
        <main
          className={
            isTerminalUser || activeTab === 'sales'
              ? posLayout === 'desktop'
                ? posFullScreen
                  ? 'flex-1 w-full p-2 sm:p-3 md:p-4 bg-slate-50 dark:bg-[#070d18]'
                  : 'flex-1 w-full p-2.5 sm:p-4 md:p-5'
                : 'flex-1 w-full p-2 sm:p-4 flex flex-col items-center justify-start'
              : 'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
          }
        >
          {/* TERMINAL: NAVEGACIÓN COMPLETA A VENDER LOTERÍAS, BALANCE, TICKETS Y GANADORES */}
          {isTerminalUser ? (
            activeTab === 'dashboard' ? (
              posLayout === 'mobile' ? (
                <MobileDashboard
                  user={user}
                  metrics={effectiveMetrics}
                  lotteries={lotteries}
                  results={results}
                  onNavigate={(tab, extra) => {
                    if (tab === 'sales' && extra) {
                      setPosConfig(extra);
                    }
                    setActiveTab(tab);
                  }}
                  onTogglePosLayout={handleSetPosLayout}
                  onLogout={handleLogout}
                />
              ) : (
                <VenderLoteriasModule
                  user={user}
                  onNavigateTab={setActiveTab}
                  posLayout={posLayout}
                  onTogglePosLayout={handleSetPosLayout}
                  isFullScreen={posFullScreen}
                  onToggleFullScreen={handleTogglePosFullScreen}
                  initialSubTab="vender"
                  onLogout={handleLogout}
                  hideTopHeader={true}
                />
              )
            ) : activeTab === 'reports' || activeTab === 'cuadre' || activeTab === 'balance' ? (
              <VenderLoteriasModule
                user={user}
                onNavigateTab={setActiveTab}
                posLayout={posLayout}
                onTogglePosLayout={handleSetPosLayout}
                initialSubTab="balance"
                onLogout={handleLogout}
                hideTopHeader={posLayout === 'desktop'}
              />
            ) : activeTab === 'results' || activeTab === 'ganadores' ? (
              <VenderLoteriasModule
                user={user}
                onNavigateTab={setActiveTab}
                posLayout={posLayout}
                onTogglePosLayout={handleSetPosLayout}
                initialSubTab="ganadores"
                onLogout={handleLogout}
                hideTopHeader={posLayout === 'desktop'}
              />
            ) : activeTab === 'recargas' ? (
              <VenderLoteriasModule
                user={user}
                onNavigateTab={setActiveTab}
                posLayout={posLayout}
                onTogglePosLayout={handleSetPosLayout}
                initialSubTab="recargas"
                onLogout={handleLogout}
                hideTopHeader={posLayout === 'desktop'}
              />
            ) : activeTab === 'productos' ? (
              <VenderLoteriasModule
                user={user}
                onNavigateTab={setActiveTab}
                posLayout={posLayout}
                onTogglePosLayout={handleSetPosLayout}
                initialSubTab="productos"
                onLogout={handleLogout}
                hideTopHeader={posLayout === 'desktop'}
              />
            ) : activeTab === 'lookup' || activeTab === 'tickets' ? (
              <VenderLoteriasModule
                user={user}
                onNavigateTab={setActiveTab}
                posLayout={posLayout}
                onTogglePosLayout={handleSetPosLayout}
                initialSubTab="tickets"
                onLogout={handleLogout}
                hideTopHeader={posLayout === 'desktop'}
              />
            ) : activeTab === 'settings' ? (
              <div className="w-full max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#0d172a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al Dashboard
                  </button>
                  <span className="text-xs font-bold text-slate-500">Configuración de Terminal #{user.terminalCode || user.username}</span>
                </div>
                <SettingsView user={user} onNavigateTab={setActiveTab} initialTab={posLayout === 'mobile' ? 'mobile_bluetooth' : undefined} />
              </div>
            ) : (activeTab === 'master-customization' || activeTab === 'customization') && user.role === 'SUPER_ADMIN' ? (
              <div className="w-full max-w-6xl mx-auto space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-[#0d172a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al Dashboard
                  </button>
                  <span className="text-xs font-bold text-amber-500 font-mono">👑 Súper Máster: Ajustes del Sistema</span>
                </div>
                <MasterSystemCustomizationView user={user} onNavigateTab={setActiveTab} />
              </div>
            ) : (
              // Modo Vender Loterías (POS principal)
              <VenderLoteriasModule
                user={user}
                onNavigateTab={setActiveTab}
                posLayout={posLayout}
                onTogglePosLayout={handleSetPosLayout}
                isFullScreen={posFullScreen}
                onToggleFullScreen={handleTogglePosFullScreen}
                initialSubTab="vender"
                onLogout={handleLogout}
                hideTopHeader={posLayout === 'desktop'}
              />
            )
          ) : (
            <>
              {/* 1. Dashboard Principal (Móvil vs Desktop) */}
              {activeTab === 'dashboard' && (
                posLayout === 'mobile' ? (
                  <MobileDashboard
                    user={user}
                    metrics={effectiveMetrics}
                    lotteries={lotteries}
                    results={results}
                    onNavigate={(tab, extra) => {
                      if (tab === 'sales' && extra) {
                        setPosConfig(extra);
                      }
                      setActiveTab(tab);
                    }}
                    onTogglePosLayout={handleSetPosLayout}
                    onLogout={handleLogout}
                  />
                ) : (
                  <ModernDashboard
                    metrics={effectiveMetrics}
                    lotteries={lotteries}
                    results={results}
                    userName={user.name || user.username}
                    onNavigate={(tab, extra) => {
                      if (tab === 'sales' && extra) {
                        setPosConfig(extra);
                      }
                      setActiveTab(tab);
                    }}
                    onRefresh={fetchData}
                  />
                )
              )}

              {/* 2. Módulo de Vender Loterías (Para administradores y vendedores) */}
              {(activeTab === 'sales' || activeTab === 'vender-loterias') && (
                <VenderLoteriasModule
                  user={user}
                  onNavigateTab={(tab) => {
                    if (posFullScreen) {
                      setPosFullScreen(false);
                      localStorage.setItem('bancapro_pos_fullscreen', 'false');
                    }
                    setActiveTab(tab);
                  }}
                  posLayout={posLayout}
                  onTogglePosLayout={handleSetPosLayout}
                  isFullScreen={posFullScreen}
                  onToggleFullScreen={handleTogglePosFullScreen}
                  initialSubTab="vender"
                  onLogout={handleLogout}
                />
              )}

              {/* 2.1. Módulo de Recargas Telefónicas */}
              {activeTab === 'recargas' && (
                <VenderLoteriasModule
                  user={user}
                  onNavigateTab={(tab) => {
                    if (posFullScreen) {
                      setPosFullScreen(false);
                      localStorage.setItem('bancapro_pos_fullscreen', 'false');
                    }
                    setActiveTab(tab);
                  }}
                  posLayout={posLayout}
                  onTogglePosLayout={handleSetPosLayout}
                  isFullScreen={posFullScreen}
                  onToggleFullScreen={handleTogglePosFullScreen}
                  initialSubTab="recargas"
                  onLogout={handleLogout}
                />
              )}

              {/* 2.2. Módulo de Productos & Servicios */}
              {activeTab === 'productos' && (
                <VenderLoteriasModule
                  user={user}
                  onNavigateTab={(tab) => {
                    if (posFullScreen) {
                      setPosFullScreen(false);
                      localStorage.setItem('bancapro_pos_fullscreen', 'false');
                    }
                    setActiveTab(tab);
                  }}
                  posLayout={posLayout}
                  onTogglePosLayout={handleSetPosLayout}
                  isFullScreen={posFullScreen}
                  onToggleFullScreen={handleTogglePosFullScreen}
                  initialSubTab="productos"
                  onLogout={handleLogout}
                />
              )}

          {/* 3. Loterías y Sorteos */}
          {activeTab === 'lotteries' && (
            <div className="space-y-6">
              <LotteriesManagement user={user} />
              <div className="pt-6">
                <PublishResultsView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
              </div>
            </div>
          )}

          {/* 3.1. Subir Números Ganadores por Sorteo y Día */}
          {activeTab === 'publish-results' && (
            <PublishResultsView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 4. Bancas, Terminales y Cuadre */}
          {activeTab === 'bancas' && (
            <BancasCuadreView
              terminals={terminals}
              onLockTerminal={handleLockTerminal}
              onNavigateSales={() => setActiveTab('sales')}
            />
          )}

          {/* 4.1. Cuadre de Terminal Individual */}
          {activeTab === 'cuadre' && (
            <TerminalCuadreView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 4.5. Control de Terminales y Dispositivos (Módulo de Activación) */}
          {activeTab === 'devices' && (
            <DevicesManagementView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 4.6. Ventas por Terminal (Módulo de Control de Ventas, Premios y Ganancias) */}
          {activeTab === 'terminal-sales' && (
            <TerminalSalesView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 4.7. Gestión de Grupos y Zonas */}
          {activeTab === 'groups' && (
            <GroupsManagement user={user} />
          )}

          {/* 5. Reportes */}
          {activeTab === 'reports' && (
            user.role === 'TERMINAL' ? (
              <TerminalReportsView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
            ) : (
              <AdminReportsView user={user} />
            )
          )}

          {/* 6. Gestión de Usuarios */}
          {activeTab === 'users' && (
            <UsersManagementView
              users={usersList}
              consorcios={consorcios}
              terminals={terminals}
              currentUserRole={user.role}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {/* 7. Configuración General & Impresoras */}
          {activeTab === 'settings' && <SettingsView user={user} onNavigateTab={setActiveTab} initialTab={posLayout === 'mobile' ? 'mobile_bluetooth' : undefined} />}

          {/* 8. Soporte Técnico & Diagnóstico */}
          {activeTab === 'support' && <SupportView />}

          {/* 9. Resultados Oficiales */}
          {activeTab === 'results' && <ResultsView />}

          {/* 10. Consulta de Tickets */}
          {activeTab === 'lookup' && <TicketLookupView user={user} />}

          {/* 10.5. Ganadores y Pago de Premios */}
          {activeTab === 'winners' && (
            <WinnersPayoutView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 10.6. Súper Admin: Permisos de Administradores */}
          {activeTab === 'admin-permissions' && (
            <AdminPermissionsView currentUser={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 11. Súper Admin: Consorcios SaaS */}
          {activeTab === 'consorcios' && user.role === 'SUPER_ADMIN' && (
            <SuperAdminDashboard user={user} />
          )}

          {/* 11.5. Súper Máster: Personalización Total del Sistema (Colores, Fondo de Pantalla, Logos Loterías) */}
          {(activeTab === 'master-customization' || activeTab === 'customization') && user.role === 'SUPER_ADMIN' && (
            <MasterSystemCustomizationView user={user} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 12. Súper Admin: Actualizaciones OTA */}
          {activeTab === 'updates' && user.role === 'SUPER_ADMIN' && (
            <SystemUpdatesManagement user={user} />
          )}
            </>
          )}
        </main>

        {/* Global Search Palette (Cmd+K) - Solo para administradores */}
        {!isTerminalUser && (
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={(tab) => setActiveTab(tab)}
            lotteries={lotteries}
          />
        )}

        {/* Notifications Drawer - Solo para administradores */}
        {!isTerminalUser && (
          <NotificationsDrawer
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAllAsRead={() => {
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            onClearAll={() => setNotifications([])}
            onSelectNotification={(notif) => {
              if (notif.linkTab) setActiveTab(notif.linkTab);
              setIsNotificationsOpen(false);
            }}
          />
        )}

        {/* Update Notification Modal */}
        {!isTerminalUser && (
          <UpdateNotificationModal
            user={user}
            forceShow={manualUpdateModal}
            onClose={() => setManualUpdateModal(false)}
            onUpdateCompleted={(newVer) => {
              localStorage.setItem('bancapro_app_version', newVer);
            }}
          />
        )}

        {/* Subtle Footer - Solo para administradores */}
        {!isTerminalUser && (
          <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#070d18]/50 text-center text-xs text-slate-400 print:hidden">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Banca La Express · Plataforma SaaS de Bancas de Lotería Dominicana</span>
              <span className="font-mono text-[11px]">
                Sesión: <strong className="text-slate-600 dark:text-slate-300">{user.name}</strong> ({user.role})
              </span>
            </div>
          </footer>
        )}

        {/* Unskippable Hardware Lockout Overlay (Requirement 5, 6, 8) */}
        {deviceLockout?.locked && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-500/50 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                  {deviceLockout.status === 'BLOQUEADO' ? 'TERMINAL BLOQUEADA' : 'TERMINAL DESACTIVADA'}
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">
                  {deviceLockout.message}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1 text-slate-600 dark:text-slate-300 font-mono">
                <p>Terminal: <strong>{user?.terminalCode || '—'}</strong></p>
                <p>Dispositivo: <strong>{localStorage.getItem('bancapro_device_uuid') || 'DEV-8F42-K29X'}</strong></p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const dId = localStorage.getItem('bancapro_device_uuid') || 'DEV-8F42-K29X';
                    const res = await api.verifyDeviceStatus({ deviceId: dId, terminalCode: user?.terminalCode });
                    if (res.allowed) setDeviceLockout(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Verificar Nuevamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
