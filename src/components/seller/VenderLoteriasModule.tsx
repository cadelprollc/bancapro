import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Lottery } from '../../types';
import {
  Ticket,
  Wallet,
  Search,
  Trophy,
  Printer,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Clock,
  ShieldAlert,
  Lock,
  RefreshCw,
  Volume2,
  VolumeX,
  ChevronUp,
  Package,
  ArrowLeft,
  LayoutDashboard,
  CheckCircle2,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { DesktopPosView } from '../pos/DesktopPosView';
import { PosView } from '../pos/PosView';
import { SellerBalanceView } from './SellerBalanceView';
import { SellerTicketLookupView } from './SellerTicketLookupView';
import { SellerWinningNumbersView } from './SellerWinningNumbersView';
import { RecargasView } from '../pos/RecargasView';
import { ProductosView } from '../pos/ProductosView';
import { RecargasModal } from '../pos/RecargasModal';
import { ProductosModal } from '../pos/ProductosModal';
import { printerService } from '../../services/printerService';
import { api } from '../../services/api';
import { getLotteryScheduleStatus } from '../../utils/lotterySchedule';
import { isLotteryBlockedBy5MinRule } from '../../utils/lotteryScheduleMiddleware';

interface VenderLoteriasModuleProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
  posLayout?: 'desktop' | 'mobile';
  onTogglePosLayout?: (layout: 'desktop' | 'mobile') => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onLogout?: () => void;
  initialSubTab?: 'vender' | 'balance' | 'tickets' | 'ganadores' | 'recargas' | 'productos';
  hideTopHeader?: boolean;
}

export const VenderLoteriasModule: React.FC<VenderLoteriasModuleProps> = ({
  user,
  onNavigateTab,
  posLayout = 'desktop',
  onTogglePosLayout,
  isFullScreen = false,
  onToggleFullScreen,
  onLogout,
  initialSubTab = 'vender',
  hideTopHeader = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vender' | 'balance' | 'tickets' | 'ganadores' | 'recargas' | 'productos'>(initialSubTab);
  const [currentLayout, setCurrentLayout] = useState<'desktop' | 'mobile'>(posLayout);
  const [printerNotice, setPrinterNotice] = useState<string | null>(null);
  const [showQuickRecargas, setShowQuickRecargas] = useState<boolean>(false);
  const [showQuickProductos, setShowQuickProductos] = useState<boolean>(false);
  const [showSecondaryMenu, setShowSecondaryMenu] = useState<boolean>(false);

  // --- HORARIOS DESDE LA API Y VALIDACIÓN EN TIEMPO REAL ---
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(true);
  const [lastApiSync, setLastApiSync] = useState<Date | null>(null);
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(true);
  const [isScheduleBannerOpen, setIsScheduleBannerOpen] = useState<boolean>(false);

  // Audio warning chime helper for 5-minute pre-closing alert
  const playClosingAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [784, 659.25, 523.25, 659.25]; // G5, E5, C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.22);
      });
    } catch {
      // Audio not permitted or muted
    }
  };

  // Consulta de horarios de loterías desde la API
  const fetchLotterySchedules = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsLoadingSchedules(true);
      const data = await api.getLotteries();
      if (Array.isArray(data)) {
        setLotteries(data);
        setLastApiSync(new Date());
      }
    } catch (err) {
      console.warn('[VenderLoteriasModule] Error consultando horarios de lotería desde la API:', err);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  // Polling periódico cada 20s y carga inicial
  useEffect(() => {
    fetchLotterySchedules();
    const interval = setInterval(() => {
      fetchLotterySchedules();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchLotterySchedules]);

  // Reloj en vivo de 1 segundo para el contador regresivo exacto
  useEffect(() => {
    const clock = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Evaluación de estado de cada lotería en tiempo real
  const lotteriesWithStatus = useMemo(() => {
    return lotteries.map((lot) => ({
      lottery: lot,
      status: getLotteryScheduleStatus(lot, liveNow),
      guard: isLotteryBlockedBy5MinRule(lot, liveNow),
    }));
  }, [lotteries, liveNow]);

  // Loterías que se encuentran a 5 minutos o menos del cierre (Cierre próximo)
  const closingSoonList = useMemo(() => {
    return lotteriesWithStatus
      .filter((item) => item.status.isClosingSoon)
      .sort((a, b) => a.status.closingInSeconds - b.status.closingInSeconds);
  }, [lotteriesWithStatus]);

  // Loterías abiertas regulares (más de 5 minutos para el cierre)
  const openLotteriesList = useMemo(() => {
    return lotteriesWithStatus.filter((item) => item.status.isOpen && !item.status.isClosingSoon);
  }, [lotteriesWithStatus]);

  // Alarma sonora cuando una lotería entra por primera vez en los 5 minutos de cierre
  const prevClosingIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  useEffect(() => {
    const currentClosingIds = new Set(closingSoonList.map((c) => c.lottery.id));
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      prevClosingIdsRef.current = currentClosingIds;
      return;
    }

    let newlyEntered = false;
    currentClosingIds.forEach((id) => {
      if (!prevClosingIdsRef.current.has(id)) {
        newlyEntered = true;
      }
    });

    if (newlyEntered && soundAlertsEnabled) {
      playClosingAlertChime();
    }

    prevClosingIdsRef.current = currentClosingIds;
  }, [closingSoonList, soundAlertsEnabled]);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const terminalCode = user.terminalCode || user.username || '1001';

  const handleSelectSubTab = (tabId: 'vender' | 'balance' | 'tickets' | 'ganadores') => {
    setActiveSubTab(tabId);
    if (onNavigateTab) {
      const tabMap: Record<string, string> = {
        vender: 'sales',
        balance: 'cuadre',
        tickets: 'lookup',
        ganadores: 'results',
      };
      onNavigateTab(tabMap[tabId] || tabId);
    }
  };

  const handleSwitchLayout = (layout: 'desktop' | 'mobile') => {
    setCurrentLayout(layout);
    if (onTogglePosLayout) {
      onTogglePosLayout(layout);
    }
  };

  const handleQuickPrinterDetect = async () => {
    try {
      const res = await printerService.autoDetectAndConnect58mm(terminalCode, false);
      setPrinterNotice(`🖨️ ${res.printer.name} conectada.`);
      setTimeout(() => setPrinterNotice(null), 3000);
    } catch (e: any) {
      setPrinterNotice('⚠️ Error detectando impresora.');
      setTimeout(() => setPrinterNotice(null), 3000);
    }
  };

  // Pestañas limpias y directas sin numeración mecánica
  const navTabs = [
    { id: 'vender', label: 'Vender Loterías', shortLabel: 'Loterías', icon: Ticket },
    { id: 'recargas', label: 'Recargas Telefónicas', shortLabel: 'Recargas', icon: Smartphone },
    { id: 'productos', label: 'Productos & Servicios', shortLabel: 'Productos', icon: Package },
    { id: 'balance', label: 'Cuadre de Ventas', shortLabel: 'Cuadre', icon: Wallet },
    { id: 'tickets', label: 'Consultar Tickets', shortLabel: 'Tickets', icon: Search },
    { id: 'ganadores', label: 'Resultados Oficiales', shortLabel: 'Resultados', icon: Trophy },
  ];

  return (
    <div className="w-full flex flex-col space-y-3 font-sans">
      {/* 1. Barra de Navegación Minimalista del Módulo Vender Loterías */}
      {!hideTopHeader && (
        <header className="w-full bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-2 sm:px-3 shadow-xs flex flex-wrap items-center justify-between gap-2 sticky top-1 z-30">
          {/* Identidad Compacta */}
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                title="Volver al Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0">
                ⚡
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  Ventas
                </h1>
                <span className="font-mono text-[10px] text-slate-400">
                  #{terminalCode}
                </span>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN RÁPIDA PRIORIZADOS (Segmented Control Limpio) */}
          <nav className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar max-w-full order-3 sm:order-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectSubTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Controles Secundarios & Alerta Rápida */}
          <div className="flex items-center gap-1.5 shrink-0 justify-end order-2 sm:order-3">
            {/* Pill de Cierre Próximo (Si aplica) */}
            {closingSoonList.length > 0 && (
              <button
                type="button"
                onClick={() => setIsScheduleBannerOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[11px] font-black animate-pulse hover:bg-amber-500/25 transition-all cursor-pointer"
                title="Ver detalle de sorteos cerrando"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {closingSoonList[0].lottery.name} ({closingSoonList[0].status.formattedCountdown})
                </span>
              </button>
            )}

            {/* Menú de Opciones Secundarias (Oculta elementos secundarios) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSecondaryMenu((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showSecondaryMenu
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-300 border-blue-300 dark:border-blue-700 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                }`}
                title="Opciones y herramientas del sistema"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Ajustes</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Dropdown de Elementos Secundarios */}
              {showSecondaryMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {user.bancaName || 'Terminal Activo'} · #{terminalCode}
                    </p>
                  </div>

                  {/* Switcher PC / Móvil */}
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Diseño POS</span>
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleSwitchLayout('desktop')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          currentLayout === 'desktop'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>PC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchLayout('mobile')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          currentLayout === 'mobile'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Móvil</span>
                      </button>
                    </div>
                  </div>

                  {/* Impresora 58mm */}
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickPrinterDetect();
                      setShowSecondaryMenu(false);
                    }}
                    className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Printer className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Detectar Impresora 58mm</span>
                    </span>
                  </button>

                  {/* Pantalla Completa */}
                  {onToggleFullScreen && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleFullScreen();
                        setShowSecondaryMenu(false);
                      }}
                      className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        {isFullScreen ? (
                          <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        <span>{isFullScreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</span>
                      </span>
                    </button>
                  )}

                  {/* Refrescar Horarios */}
                  <button
                    type="button"
                    onClick={() => {
                      fetchLotterySchedules(true);
                    }}
                    disabled={isLoadingSchedules}
                    className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isLoadingSchedules ? 'animate-spin' : ''}`} />
                      <span>Sincronizar Horarios API</span>
                    </span>
                  </button>

                  {/* Alerta Sonora */}
                  <button
                    type="button"
                    onClick={() => setSoundAlertsEnabled((prev) => !prev)}
                    className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors text-left border-t border-slate-100 dark:border-slate-800 pt-1.5"
                  >
                    <span className="flex items-center gap-2">
                      {soundAlertsEnabled ? (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Sonido de Alertas</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {soundAlertsEnabled ? 'Activado' : 'Mute'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 2. VALIDACIÓN VISUAL: BANNER COLAPSABLE DE CIERRE PRÓXIMO */}
      {closingSoonList.length > 0 && isScheduleBannerOpen && (
        <section
          role="alert"
          aria-live="assertive"
          className="w-full rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 p-3 sm:p-4 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <span>Validación de Horarios: Cierre Próximo</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    Bloqueo a los 5 min
                  </span>
                </h3>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                  Los inputs de jugada se bloquean automáticamente 5 minutos antes del cierre oficial.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setSoundAlertsEnabled((prev) => !prev)}
                className="p-1 rounded-lg border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs"
                title={soundAlertsEnabled ? 'Silenciar alerta sonora' : 'Activar sonido'}
              >
                {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleBannerOpen(false)}
                className="p-1 rounded-lg text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 text-xs cursor-pointer"
                title="Minimizar aviso"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tarjetas compactas de sorteos cerrando próximamente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2.5">
            {closingSoonList.map(({ lottery, status }) => (
              <div
                key={lottery.id}
                className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-300/60 dark:border-amber-500/30 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: lottery.color || '#F59E0B' }}
                    />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {lottery.name}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Cierre: {status.formattedCloseTime}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{status.formattedCountdown}</span>
                  </span>
                  <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" title="Inputs bloqueados">
                    <Lock className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sorteos abiertos alternativos sugeridos */}
          {openLotteriesList.length > 0 && (
            <div className="pt-2 mt-2 border-t border-amber-500/20 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Sorteos abiertos disponibles:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {openLotteriesList.slice(0, 4).map(({ lottery, status }) => (
                  <span
                    key={lottery.id}
                    className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                  >
                    {lottery.name} <span className="font-mono text-slate-400">({status.formattedCloseTime})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Printer Toast Notice */}
      {printerNotice && (
        <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span>{printerNotice}</span>
        </div>
      )}

      {/* 3. Renderizado del Sub-Módulo Seleccionado */}
      <main className="w-full flex-1">
        {/* SUB-TAB 1: VENDER LOTERÍAS (POS) */}
        {activeSubTab === 'vender' && (
          currentLayout === 'desktop' ? (
            <DesktopPosView
              user={user}
              externalLotteries={lotteries}
              hideDuplicateHeader={true}
              onNavigateTab={(tab) => {
                if (tab === 'cuadre') setActiveSubTab('balance');
                else if (tab === 'winners') setActiveSubTab('ganadores');
                else if (tab === 'results') setActiveSubTab('ganadores');
                else if (tab === 'reports') setActiveSubTab('balance');
                else if (tab === 'lookup') setActiveSubTab('tickets');
                else if (onNavigateTab) onNavigateTab(tab);
              }}
              onSwitchToMobile={() => handleSwitchLayout('mobile')}
              isFullScreen={isFullScreen}
              onToggleFullScreen={onToggleFullScreen}
              onLogout={onLogout}
            />
          ) : (
            <PosView
              user={user}
              externalLotteries={lotteries}
              hideDuplicateHeader={true}
              onNavigateTab={(tab) => {
                if (tab === 'cuadre') setActiveSubTab('balance');
                else if (tab === 'winners') setActiveSubTab('ganadores');
                else if (tab === 'results') setActiveSubTab('ganadores');
                else if (tab === 'reports') setActiveSubTab('balance');
                else if (tab === 'lookup') setActiveSubTab('tickets');
                else if (onNavigateTab) onNavigateTab(tab);
              }}
              posLayout="mobile"
              onTogglePosLayout={handleSwitchLayout}
              isFullScreen={isFullScreen}
              onToggleFullScreen={onToggleFullScreen}
              onLogout={onLogout}
            />
          )
        )}

        {/* SUB-TAB: RECARGAS TELEFÓNICAS */}
        {activeSubTab === 'recargas' && (
          <RecargasView user={user} onNavigateTab={(tab) => handleSelectSubTab(tab as any)} />
        )}

        {/* SUB-TAB: PRODUCTOS & SERVICIOS */}
        {activeSubTab === 'productos' && (
          <ProductosView user={user} onNavigateTab={(tab) => handleSelectSubTab(tab as any)} />
        )}

        {/* SUB-TAB 2: BALANCE DE VENTAS */}
        {activeSubTab === 'balance' && (
          <SellerBalanceView user={user} />
        )}

        {/* SUB-TAB 3: CONSULTAR TICKETS */}
        {activeSubTab === 'tickets' && (
          <SellerTicketLookupView user={user} />
        )}

        {/* SUB-TAB 4: RESULTADOS OFICIALES */}
        {activeSubTab === 'ganadores' && (
          <SellerWinningNumbersView user={user} onNavigateTab={onNavigateTab} />
        )}
      </main>

      {/* Modales de Acceso Rápido */}
      <RecargasModal
        isOpen={showQuickRecargas}
        onClose={() => setShowQuickRecargas(false)}
        user={user}
      />

      <ProductosModal
        isOpen={showQuickProductos}
        onClose={() => setShowQuickProductos(false)}
        user={user}
      />
    </div>
  );
};
