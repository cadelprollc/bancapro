import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Lottery, LotteryResult, User, Consorcio } from '../../types/index';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Send,
  Trophy,
  ArrowRight,
  Building2,
  Layers,
  Dices,
  RotateCcw,
  Check,
  Calendar,
  Globe,
  Store,
  Clock,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublishResultsViewProps {
  user?: User;
  onNavigateTab?: (tab: string) => void;
}

interface ConsorcioImpact {
  consorcioId: string;
  consorcioName: string;
  ticketsEvaluated: number;
  winnersCount: number;
  prizeAwarded: number;
}

export const PublishResultsView: React.FC<PublishResultsViewProps> = ({ user, onNavigateTab }) => {
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const hasResultsPermission = isSuperAdmin || Boolean(user?.adminPermissions?.resultados);

  // Super Admin: Control de Permiso a Administradores
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminsWithAccessCount, setAdminsWithAccessCount] = useState<number>(0);
  const [togglingPermission, setTogglingPermission] = useState<boolean>(false);

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [selectedLotteryId, setSelectedLotteryId] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'single'>('matrix');

  // Multi-Consorcio Target
  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);
  const [targetConsorcioId, setTargetConsorcioId] = useState<string>('ALL');

  // Single mode inputs
  const [primera, setPrimera] = useState('');
  const [segunda, setSegunda] = useState('');
  const [tercera, setTercera] = useState('');

  // Matrix inputs (lotteryId -> { primera, segunda, tercera })
  const [matrixInputs, setMatrixInputs] = useState<Record<string, { primera: string; segunda: string; tercera: string }>>({});

  const [loading, setLoading] = useState(false);
  const [submittingLotteryId, setSubmittingLotteryId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    recalc?: {
      ticketsEvaluated: number;
      winnersCount: number;
      totalPrizeAwarded: number;
      consorciosAffected?: ConsorcioImpact[];
    };
  } | null>(null);

  const [resultsList, setResultsList] = useState<LotteryResult[]>([]);

  const loadData = async () => {
    try {
      const [lots, res, consList, adminList] = await Promise.all([
        api.getLotteries().catch(() => []),
        api.getResults(date).catch(() => []),
        isSuperAdmin ? api.getConsorcios().catch(() => []) : Promise.resolve([]),
        isSuperAdmin ? api.getAdminUsers().catch(() => []) : Promise.resolve([]),
      ]);

      setLotteries(lots || []);
      setResultsList(res || []);
      setConsorcios(consList || []);

      if (isSuperAdmin && adminList) {
        setAdminUsers(adminList);
        const count = adminList.filter((a) => a.role === 'ADMIN' && a.adminPermissions?.resultados).length;
        setAdminsWithAccessCount(count);
      }

      if (lots && lots.length > 0 && !selectedLotteryId) {
        setSelectedLotteryId(lots[0].id);
      }

      // Pre-fill matrix with existing results for this date
      const prefill: Record<string, { primera: string; segunda: string; tercera: string }> = {};
      (lots || []).forEach((lot) => {
        const found = (res || []).find((r) => r.lotteryId === lot.id);
        prefill[lot.id] = {
          primera: found?.primera || '',
          segunda: found?.segunda || '',
          tercera: found?.tercera || '',
        };
      });
      setMatrixInputs(prefill);
    } catch {
      // fallback
    }
  };

  const handleToggleAdminsPermission = async (grant: boolean) => {
    setTogglingPermission(true);
    setFeedback(null);
    try {
      const res = await api.toggleAdminResultsPermission({ enabled: grant });
      setFeedback({ success: true, message: res.message });
      const admins = await api.getAdminUsers().catch(() => []);
      setAdminUsers(admins);
      const count = admins.filter((a) => a.role === 'ADMIN' && a.adminPermissions?.resultados).length;
      setAdminsWithAccessCount(count);
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error al modificar permisos de administradores.' });
    } finally {
      setTogglingPermission(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date, isSuperAdmin]);

  const handleMatrixInputChange = (lotteryId: string, field: 'primera' | 'segunda' | 'tercera', val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setMatrixInputs((prev) => ({
      ...prev,
      [lotteryId]: {
        ...(prev[lotteryId] || { primera: '', segunda: '', tercera: '' }),
        [field]: clean,
      },
    }));
  };

  // Quick single publish (from single view or from a row in the matrix)
  const handlePublishSingle = async (lotId: string, p1: string, p2: string, p3: string) => {
    setFeedback(null);
    if (!lotId) {
      setFeedback({ success: false, message: 'Seleccione una lotería válida.' });
      return;
    }

    if (p1.length !== 2 || p2.length !== 2 || p3.length !== 2) {
      setFeedback({
        success: false,
        message: 'Debe ingresar números de 2 dígitos válidos (00 a 99) para 1ra, 2da y 3ra.',
      });
      return;
    }

    setSubmittingLotteryId(lotId);
    setLoading(true);

    try {
      const response = await api.publishResults({
        lotteryId: lotId,
        drawDate: date,
        primera: p1,
        segunda: p2,
        tercera: p3,
        targetConsorcioId: isSuperAdmin ? targetConsorcioId : user?.consorcioId,
      });

      setFeedback({
        success: true,
        message: response.message,
        recalc: response.recalculation,
      });

      if (response.recalculation && response.recalculation.winnersCount > 0) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      if (lotId === selectedLotteryId) {
        setPrimera('');
        setSegunda('');
        setTercera('');
      }

      loadData();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error al publicar los resultados' });
    } finally {
      setLoading(false);
      setSubmittingLotteryId(null);
    }
  };

  // Batch publish: Publish all filled lotteries at once and charge to each consortium
  const handlePublishAllBatch = async () => {
    setFeedback(null);
    const itemsToPublish: Array<{ lotteryId: string; primera: string; segunda: string; tercera: string }> = [];

    for (const lot of lotteries) {
      const entry = matrixInputs[lot.id];
      if (entry && entry.primera.length === 2 && entry.segunda.length === 2 && entry.tercera.length === 2) {
        itemsToPublish.push({
          lotteryId: lot.id,
          primera: entry.primera,
          segunda: entry.segunda,
          tercera: entry.tercera,
        });
      }
    }

    if (itemsToPublish.length === 0) {
      setFeedback({
        success: false,
        message: 'Complete los 3 números (2 dígitos cada uno) en al menos una lotería para publicar.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.publishBatchResults({
        drawDate: date,
        targetConsorcioId: isSuperAdmin ? targetConsorcioId : user?.consorcioId,
        items: itemsToPublish,
      });

      setFeedback({
        success: true,
        message: response.message,
        recalc: response.recalculation,
      });

      if (response.recalculation && response.recalculation.winnersCount > 0) {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.45 },
        });
      }

      loadData();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error al publicar los resultados en lote' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to fill demo numbers
  const handleFillDemoNumbers = () => {
    const updated = { ...matrixInputs };
    lotteries.forEach((lot) => {
      const existing = (resultsList || []).find((r) => r.lotteryId === lot.id);
      if (existing) {
        updated[lot.id] = {
          primera: existing.primera,
          segunda: existing.segunda,
          tercera: existing.tercera,
        };
      } else {
        const r1 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const r2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const r3 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        updated[lot.id] = { primera: r1, segunda: r2, tercera: r3 };
      }
    });
    setMatrixInputs(updated);
  };

  const handleClearMatrix = () => {
    const cleared: Record<string, { primera: string; segunda: string; tercera: string }> = {};
    lotteries.forEach((l) => {
      cleared[l.id] = { primera: '', segunda: '', tercera: '' };
    });
    setMatrixInputs(cleared);
  };

  const targetConsorcioLabel = targetConsorcioId === 'ALL'
    ? 'Todos los Consorcios (SaaS Global)'
    : consorcios.find((c) => c.id === targetConsorcioId)?.name || targetConsorcioId;

  const filledCount = lotteries.filter((l) => {
    const entry = matrixInputs[l.id];
    return entry && entry.primera.length === 2 && entry.segunda.length === 2 && entry.tercera.length === 2;
  }).length;

  // Si el usuario es un Administrador y el Super Admin no le ha otorgado permiso, mostrar pantalla de bloqueo
  if (!hasResultsPermission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
            <Lock className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-amber-300 dark:border-amber-800">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Función Exclusiva • Súper Administrador</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Subir Números Ganadores por Sorteo y Día
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              La subida y publicación de números ganadores oficiales de cada sorteo está reservada por defecto exclusivamente para el <strong>Súper Administrador</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-left space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>¿Cómo obtener acceso como Administrador?</span>
              </p>
              <p>
                El <strong>Súper Administrador</strong> puede otorgarle acceso a su cuenta habilitando el permiso <em>"Registro y publicación de números ganadores"</em> en el módulo de Permisos de Administradores.
              </p>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab && onNavigateTab('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Volver al Inicio
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('lotteries')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Consultar Catálogo de Sorteos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* SÚPER ADMIN: CONTROL DE PERMISOS PARA ADMINISTRADORES */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl p-4 sm:p-5 border border-blue-500/30 dark:border-blue-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Permiso a Administradores para Subir Números Ganadores
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  adminsWithAccessCount > 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {adminsWithAccessCount > 0
                    ? `${adminsWithAccessCount} Administrador(es) Autorizado(s)`
                    : 'Acceso Restringido a Solo Súper Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Por defecto solo usted (Súper Admin) puede subir números ganadores por sorteo y día. Puede autorizar o revocar el acceso a los administradores con un solo clic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {adminsWithAccessCount > 0 ? (
              <button
                onClick={() => handleToggleAdminsPermission(false)}
                disabled={togglingPermission}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                title="Bloquear a los administradores para que solo el Super Admin pueda subir números"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{togglingPermission ? 'Actualizando...' : 'Revocar Acceso a Admins'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleAdminsPermission(true)}
                disabled={togglingPermission}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                title="Permitir que los administradores suban números ganadores por sorteo"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{togglingPermission ? 'Actualizando...' : 'Otorgar Permiso a Admins'}</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('admin-permissions')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Configurar permisos por cada administrador"
              >
                Gestionar por Admin
              </button>
            )}
          </div>
        </div>
      )}

      {/* ADMINISTRADOR CON PERMISO OTORGADO */}
      {!isSuperAdmin && hasResultsPermission && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Permiso Concedido por el Súper Administrador</p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Usted cuenta con autorización del Súper Administrador para subir y publicar números ganadores en cada sorteo por día.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
            Autorizado
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Módulo de Resultados Oficiales & Liquidación</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Publicación de Resultados y Recálculo Automático
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Al publicar los números ganadores, el sistema evalúa inmediatamente todos los tickets, determina ganadores, calcula premios y actualiza el cuadre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Fecha:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriz Completa</span>
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Individual</span>
            </button>
          </div>
        </div>
      </div>

      {/* SÚPER ADMIN: CONTROL DE CARGO A CONSORCIOS */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center font-bold border border-cyan-400/30 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 uppercase tracking-wider">
                  Súper Admin
                </span>
                <span className="text-sm font-extrabold text-white">
                  Destino de Liquidación & Cargo a Consorcios
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Elija si estos resultados aplicarán a nivel global a todos los consorcios o si se cargarán a un consorcio específico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/40 p-1.5 rounded-xl border border-white/10">
            <span className="text-xs font-semibold text-blue-200 pl-2">Cargar a:</span>
            <select
              value={targetConsorcioId}
              onChange={(e) => setTargetConsorcioId(e.target.value)}
              className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="ALL">🌐 Todos los Consorcios (SaaS Global)</option>
              {consorcios.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* FEEDBACK & AUDITORÍA BANNER */}
      {feedback && (
        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-3 animate-in fade-in duration-200 ${
            feedback.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              {feedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            {onNavigateTab && feedback.recalc && feedback.recalc.winnersCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('winners')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Ver Ganadores & Pagar Premios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {feedback.recalc && (
            <div className="space-y-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              {/* Resumen General */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Tickets Evaluados
                  </span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {feedback.recalc.ticketsEvaluated.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    Ganadores Determinados
                  </span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {feedback.recalc.winnersCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                    Premios Totales Asignados
                  </span>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                    RD$ {feedback.recalc.totalPrizeAwarded.toLocaleString('es-DO')}
                  </p>
                </div>
              </div>

              {/* Desglose por Consorcio Cargado */}
              {feedback.recalc.consorciosAffected && feedback.recalc.consorciosAffected.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
                    🏢 Impacto y Liquidación Imputada por Consorcio:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {feedback.recalc.consorciosAffected.map((aff) => (
                      <div
                        key={aff.consorcioId}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{aff.consorcioName}</p>
                          <p className="text-[10px] text-slate-500">
                            {aff.ticketsEvaluated} tickets · {aff.winnersCount} ganadores
                          </p>
                        </div>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          RD$ {aff.prizeAwarded.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VISTA 1: MATRIZ DE TODAS LAS LOTERÍAS (BATCH) */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          {/* Top Bar inside Matrix */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎱</span> Matriz Oficial de Loterías ({lotteries.length} Sorteos)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete los números ganadores y presione publicar para liquidar masivamente con cargo a{' '}
                <strong className="text-blue-600 dark:text-cyan-400">{targetConsorcioLabel}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleFillDemoNumbers}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Rellenar sorteos vacíos con números aleatorios para demostración o prueba"
              >
                <Dices className="w-3.5 h-3.5 text-blue-500" />
                <span>Rellenar Aleatorio</span>
              </button>

              <button
                type="button"
                onClick={handleClearMatrix}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold transition-colors"
                title="Limpiar entradas de la matriz"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePublishAllBatch}
                disabled={loading || filledCount === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {loading ? 'Calculando Ganadores...' : `Publicar Todo (${filledCount}) y Cargar`}
                </span>
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500">
                  <th className="py-3 px-3">Lotería / Sorteo</th>
                  <th className="py-3 px-3">Horario</th>
                  <th className="py-3 px-3">Estado Actual</th>
                  <th className="py-3 px-3 text-center">1ra (Primera)</th>
                  <th className="py-3 px-3 text-center">2da (Segunda)</th>
                  <th className="py-3 px-3 text-center">3ra (Tercera)</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {lotteries.map((lot) => {
                  const published = resultsList.find((r) => r.lotteryId === lot.id);
                  const entry = matrixInputs[lot.id] || { primera: '', segunda: '', tercera: '' };
                  const isReady = entry.primera.length === 2 && entry.segunda.length === 2 && entry.tercera.length === 2;
                  const isCurrentSubmitting = submittingLotteryId === lot.id;

                  return (
                    <tr
                      key={lot.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {lot.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {lot.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {lot.drawTime || '12:30 PM'}
                        </span>
                      </td>

                      {/* Current Status */}
                      <td className="py-3 px-3">
                        {published ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px]">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>
                              {published.primera} - {published.segunda} - {published.tercera}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* 1ra */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={entry.primera}
                          onChange={(e) => handleMatrixInputChange(lot.id, 'primera', e.target.value)}
                          placeholder="00"
                          className="w-14 text-center py-1.5 font-mono text-base font-black rounded-lg border-2 border-emerald-400/80 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      {/* 2da */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={entry.segunda}
                          onChange={(e) => handleMatrixInputChange(lot.id, 'segunda', e.target.value)}
                          placeholder="00"
                          className="w-14 text-center py-1.5 font-mono text-base font-black rounded-lg border-2 border-blue-400/80 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* 3ra */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={entry.tercera}
                          onChange={(e) => handleMatrixInputChange(lot.id, 'tercera', e.target.value)}
                          placeholder="00"
                          className="w-14 text-center py-1.5 font-mono text-base font-black rounded-lg border-2 border-amber-400/80 bg-amber-50/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePublishSingle(lot.id, entry.primera, entry.segunda, entry.tercera)}
                          disabled={!isReady || loading}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-[11px] font-bold disabled:opacity-30 transition-colors"
                        >
                          {isCurrentSubmitting ? 'Guardando...' : published ? 'Actualizar' : 'Publicar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: PUBLICACIÓN INDIVIDUAL POR FORMULARIO */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0d172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Registrar Números de una Lotería</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePublishSingle(selectedLotteryId, primera, segunda, tercera);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lotería Oficial
                </label>
                <select
                  value={selectedLotteryId}
                  onChange={(e) => setSelectedLotteryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                >
                  {lotteries.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name} ({lot.drawTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Numbers Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Números Ganadores Oficiales (2 dígitos cada uno)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* 1ra */}
                  <div className="text-center">
                    <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
                      1ra (Primera)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={primera}
                      onChange={(e) => setPrimera(e.target.value.replace(/\D/g, ''))}
                      placeholder="00"
                      className="w-full text-center py-2.5 text-2xl font-mono font-bold rounded-xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                  </div>

                  {/* 2da */}
                  <div className="text-center">
                    <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400 block mb-1">
                      2da (Segunda)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={segunda}
                      onChange={(e) => setSegunda(e.target.value.replace(/\D/g, ''))}
                      placeholder="00"
                      className="w-full text-center py-2.5 text-2xl font-mono font-bold rounded-xl border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                  </div>

                  {/* 3ra */}
                  <div className="text-center">
                    <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400 block mb-1">
                      3ra (Tercera)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={tercera}
                      onChange={(e) => setTercera(e.target.value.replace(/\D/g, ''))}
                      placeholder="00"
                      className="w-full text-center py-2.5 text-2xl font-mono font-bold rounded-xl border-2 border-amber-500 bg-amber-50/40 dark:bg-amber-950/40 text-amber-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Calculando Ganadores...' : 'Publicar y Cargar Premios'}</span>
              </button>
            </form>
          </div>

          {/* Historial rápido (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0d172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Resultados Registrados para {date}
                </h3>
                <span className="text-xs text-slate-500">
                  {resultsList.length} sorteo{resultsList.length === 1 ? '' : 's'} publicado{resultsList.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {resultsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No hay números publicados para esta fecha todavía.
                  </div>
                ) : (
                  resultsList.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {r.lotteryName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Publicado por {r.publishedBy} · Cargo: {r.targetConsorcioId === 'ALL' ? 'Todos los Consorcios' : r.targetConsorcioId || 'Global'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                        <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          {r.primera}
                        </span>
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                          {r.segunda}
                        </span>
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center">
                          {r.tercera}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
