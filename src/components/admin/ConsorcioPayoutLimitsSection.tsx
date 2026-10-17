import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Consorcio,
  ConsorcioPayoutLimits,
  DEFAULT_CONSORCIO_PAYOUT_LIMITS,
  User,
} from '../../types/index';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Calculator,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Check,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface ConsorcioPayoutLimitsSectionProps {
  user?: User | null;
  onRefreshLotteries?: () => void;
}

export const ConsorcioPayoutLimitsSection: React.FC<ConsorcioPayoutLimitsSectionProps> = ({
  user,
}) => {
  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);
  const [selectedConsorcioId, setSelectedConsorcioId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form values for Payout Limits
  const [limits, setLimits] = useState<ConsorcioPayoutLimits>({
    ...DEFAULT_CONSORCIO_PAYOUT_LIMITS,
  });

  // Risk statistics calculated by backend
  const [riskStats, setRiskStats] = useState<{
    today: string;
    totalExposure: number;
    totalExposureLimit: number;
    totalExposurePercent: number;
    quinielaExposure: number;
    quinielaLimit: number;
    quinielaPercent: number;
    paleExposure: number;
    paleLimit: number;
    palePercent: number;
    tripletaExposure: number;
    tripletaLimit: number;
    tripletaPercent: number;
    superPaleExposure: number;
    superPaleLimit: number;
    superPalePercent: number;
    openTicketsCount: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'CAPPED';
  } | null>(null);

  // Interactive Live Simulator State
  const [simPlayType, setSimPlayType] = useState<'QUINIELA' | 'PALE' | 'TRIPLETA'>('QUINIELA');
  const [simBetAmount, setSimBetAmount] = useState<number>(500);

  // Load Consorcios
  const fetchConsorcios = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getConsorcios();
      setConsorcios(data || []);
      if (data && data.length > 0) {
        // If current user is tied to a consorcio, pick that one; otherwise pick the first
        const defaultId = user?.consorcioId || data[0].id;
        setSelectedConsorcioId(defaultId);
        loadConsorcioLimits(defaultId);
      }
    } catch (err: any) {
      console.error('Error cargando consorcios', err);
      setErrorMessage(err.message || 'Error al obtener la lista de consorcios.');
    } finally {
      setLoading(false);
    }
  };

  // Load Payout limits for a specific consorcio
  const loadConsorcioLimits = async (consId: string) => {
    if (!consId) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.getConsorcioPayoutLimits(consId);
      if (res && res.limits) {
        setLimits({ ...DEFAULT_CONSORCIO_PAYOUT_LIMITS, ...res.limits });
        setRiskStats(res.riskStats || null);
      }
    } catch (err: any) {
      console.error('Error cargando topes de pago del consorcio', err);
      // Fallback to local consorcio limits if available
      const found = consorcios.find((c) => c.id === consId);
      if (found && found.payoutLimits) {
        setLimits({ ...DEFAULT_CONSORCIO_PAYOUT_LIMITS, ...found.payoutLimits });
      } else {
        setLimits({ ...DEFAULT_CONSORCIO_PAYOUT_LIMITS });
      }
      setErrorMessage(err.message || 'Error cargando datos de topes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsorcios();
  }, []);

  const handleConsorcioChange = (newId: string) => {
    setSelectedConsorcioId(newId);
    loadConsorcioLimits(newId);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConsorcioId) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.updateConsorcioPayoutLimits(selectedConsorcioId, limits);
      if (res && res.limits) {
        setLimits({ ...DEFAULT_CONSORCIO_PAYOUT_LIMITS, ...res.limits });
        if (res.riskStats) setRiskStats(res.riskStats);
      }
      setSuccessMessage('¡Topes máximos de pago y mitigación de riesgos guardados exitosamente!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error guardando topes de pago', err);
      setErrorMessage(err.message || 'Error al guardar los topes de pago.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (presetType: 'CONSERVATIVE' | 'STANDARD' | 'AGGRESSIVE') => {
    if (presetType === 'CONSERVATIVE') {
      setLimits((prev) => ({
        ...prev,
        quinielaMaxPayoutPerDraw: 200000,
        quinielaMaxPayoutPerTicket: 40000,
        paleMaxPayoutPerDraw: 500000,
        paleMaxPayoutPerCombination: 200000,
        tripletaMaxPayoutPerDraw: 1000000,
        tripletaMaxPayoutPerCombination: 400000,
        superPaleMaxPayoutPerDraw: 600000,
        totalDrawExposureLimit: 1500000,
        riskMitigationAction: 'BLOCK_SALES',
        autoAlertThresholdPercent: 75,
        enabled: true,
      }));
    } else if (presetType === 'STANDARD') {
      setLimits((prev) => ({
        ...prev,
        quinielaMaxPayoutPerDraw: 350000,
        quinielaMaxPayoutPerTicket: 60000,
        paleMaxPayoutPerDraw: 800000,
        paleMaxPayoutPerCombination: 300000,
        tripletaMaxPayoutPerDraw: 1500000,
        tripletaMaxPayoutPerCombination: 600000,
        superPaleMaxPayoutPerDraw: 1000000,
        totalDrawExposureLimit: 2500000,
        riskMitigationAction: 'BLOCK_SALES',
        autoAlertThresholdPercent: 80,
        enabled: true,
      }));
    } else if (presetType === 'AGGRESSIVE') {
      setLimits((prev) => ({
        ...prev,
        quinielaMaxPayoutPerDraw: 700000,
        quinielaMaxPayoutPerTicket: 120000,
        paleMaxPayoutPerDraw: 1800000,
        paleMaxPayoutPerCombination: 600000,
        tripletaMaxPayoutPerDraw: 3000000,
        tripletaMaxPayoutPerCombination: 1200000,
        superPaleMaxPayoutPerDraw: 2000000,
        totalDrawExposureLimit: 5000000,
        riskMitigationAction: 'WARN_ADMIN',
        autoAlertThresholdPercent: 85,
        enabled: true,
      }));
    }
    setSuccessMessage('Valores de la plantilla aplicados. Recuerde hacer clic en "Guardar Cambios".');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const selectedConsorcio = consorcios.find((c) => c.id === selectedConsorcioId);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Simulator Calculations
  let simMultiplier = 60;
  let simCap = limits.quinielaMaxPayoutPerTicket;
  let simCapLabel = 'Tope por Boleto de Quiniela';

  if (simPlayType === 'QUINIELA') {
    simMultiplier = 60;
    simCap = limits.quinielaMaxPayoutPerTicket;
    simCapLabel = 'Tope Individual por Boleto';
  } else if (simPlayType === 'PALE') {
    simMultiplier = 1000;
    simCap = limits.paleMaxPayoutPerCombination;
    simCapLabel = 'Tope por Combinación de Palé';
  } else if (simPlayType === 'TRIPLETA') {
    simMultiplier = 20000;
    simCap = limits.tripletaMaxPayoutPerCombination;
    simCapLabel = 'Tope por Combinación de Tripleta';
  }

  const simPotentialPrize = (simBetAmount || 0) * simMultiplier;
  const simIsExceeded = limits.enabled && simPotentialPrize > simCap;
  const simMaxRecommendedBet = Math.floor(simCap / simMultiplier);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Consorcio Selection */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">
                  TOPES MÁXIMOS DE PAGO POR TIPO DE JUGADA
                </h2>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300">
                  Riesgo Financiero Consorcio
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Configure límites máximos de desembolso por Quiniela, Palé y Tripleta para blindar el flujo de caja del consorcio.
              </p>
            </div>
          </div>
        </div>

        {/* Consorcio Selector & Live Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
            <Building2 className="w-4 h-4 text-neutral-500" />
            <label className="text-[11px] font-bold text-neutral-600 uppercase">Consorcio:</label>
            <select
              value={selectedConsorcioId}
              onChange={(e) => handleConsorcioChange(e.target.value)}
              disabled={loading || saving}
              className="bg-white text-xs font-black text-neutral-900 rounded-lg px-2.5 py-1 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {consorcios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) {c.status === 'SUSPENDED' ? '⛔ [Suspendido]' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadConsorcioLimits(selectedConsorcioId)}
            disabled={loading || saving}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            title="Recargar límites"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Guardando...' : 'Guardar Topes'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Global Financial Exposure Meter Card */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-neutral-900 tracking-wider">
                Exposición Financiera Acumulada Hoy ({riskStats?.today || new Date().toISOString().split('T')[0]})
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  !limits.enabled
                    ? 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    : riskStats?.status === 'CAPPED'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                    : riskStats?.status === 'CRITICAL'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : riskStats?.status === 'WARNING'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {!limits.enabled
                  ? 'Mitigación Desactivada'
                  : riskStats?.status === 'CAPPED'
                  ? '🔴 Tope Alcanzado'
                  : riskStats?.status === 'CRITICAL'
                  ? '🟠 Alerta de Riesgo'
                  : riskStats?.status === 'WARNING'
                  ? '🟡 Monitoreo Preventivo'
                  : '🟢 Exposición Segura'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Consorcio: <span className="font-bold text-neutral-800">{selectedConsorcio?.name}</span> | Código: <span className="font-mono font-bold text-neutral-800">{selectedConsorcio?.code}</span>
            </p>
          </div>

          {/* Master Enable Toggle */}
          <div className="flex items-center gap-3 bg-neutral-50 px-3.5 py-1.5 rounded-xl border border-neutral-200">
            <span className="text-xs font-bold text-neutral-700">
              {limits.enabled ? '🟢 Mitigación Activa' : '⚪ Mitigación Pausada'}
            </span>
            <button
              type="button"
              onClick={() => setLimits((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                limits.enabled ? 'bg-emerald-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  limits.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-neutral-600">
              Compromiso Potencial de Premios: <span className="font-mono font-black text-neutral-900">RD$ {(riskStats?.totalExposure || 0).toLocaleString()}</span>
            </span>
            <span className="font-bold text-neutral-600">
              Tope Global por Sorteo: <span className="font-mono font-black text-amber-700">RD$ {(limits.totalDrawExposureLimit || 2500000).toLocaleString()}</span> ({riskStats?.totalExposurePercent || 0}%)
            </span>
          </div>

          <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden border border-neutral-200">
            <div
              className={`h-full transition-all duration-500 ${
                (riskStats?.totalExposurePercent || 0) >= 100
                  ? 'bg-rose-600'
                  : (riskStats?.totalExposurePercent || 0) >= (limits.autoAlertThresholdPercent || 80)
                  ? 'bg-amber-500'
                  : (riskStats?.totalExposurePercent || 0) >= 60
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, riskStats?.totalExposurePercent || 0)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1.5 font-mono">
            <span>0% Seguro</span>
            <span className="text-yellow-600 font-bold">60% Precaución</span>
            <span className="text-amber-600 font-bold">Umbral de Alerta: {limits.autoAlertThresholdPercent || 80}%</span>
            <span className="text-rose-600 font-bold">100% Límite Máximo</span>
          </div>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-xs font-black tracking-wide uppercase">Plantillas Rápidas de Protección Financiera</span>
            <p className="text-[11px] text-neutral-300">
              Aplique parámetros óptimos ajustados al volumen y capacidad de reserva de este consorcio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset('CONSERVATIVE')}
            className="px-3 py-1.5 rounded-xl bg-neutral-700/80 hover:bg-neutral-700 text-xs font-bold border border-neutral-600 transition-all hover:border-amber-400"
          >
            🛡️ Conservador (Alta Cobertura)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('STANDARD')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black border border-amber-400 transition-all shadow-xs"
          >
            ⚖️ Estándar Dominicano
          </button>
          <button
            type="button"
            onClick={() => applyPreset('AGGRESSIVE')}
            className="px-3 py-1.5 rounded-xl bg-neutral-700/80 hover:bg-neutral-700 text-xs font-bold border border-neutral-600 transition-all hover:border-emerald-400"
          >
            🚀 Alto Volumen (Grandes Bancas)
          </button>
        </div>
      </div>

      {/* Main 3 Play Types Grid: QUINIELA, PALÉ, TRIPLETA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. QUINIELA CARD */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">QUINIELA</h3>
                  <span className="text-[10px] text-neutral-400 font-semibold">1 Número | Paga 60x, 8x, 4x</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                {riskStats?.quinielaPercent || 0}% de uso
              </span>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Tope de Pago Máximo por Sorteo (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={limits.quinielaMaxPayoutPerDraw || 350000}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        quinielaMaxPayoutPerDraw: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-12 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Límite total acumulado de premios a pagar en Quiniela por sorteo.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Tope Máximo por Boleto Individual (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={limits.quinielaMaxPayoutPerTicket || 60000}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        quinielaMaxPayoutPerTicket: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-12 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Máximo premio que un solo ticket puede reclamar en Quiniela (Equiv. a jugada de RD$ {Math.floor((limits.quinielaMaxPayoutPerTicket || 60000) / 60)} a 1ra).
                </span>
              </div>
            </div>
          </div>

          {/* Exposure bar */}
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 font-medium">Exposición Hoy:</span>
              <span className="font-mono font-bold text-neutral-900">
                RD$ {(riskStats?.quinielaExposure || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${Math.min(100, riskStats?.quinielaPercent || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. PALÉ CARD */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">PALÉ</h3>
                  <span className="text-[10px] text-neutral-400 font-semibold">2 Números | Paga 1,000x, 100x</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                {riskStats?.palePercent || 0}% de uso
              </span>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Tope de Pago Máximo por Sorteo (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="5000"
                    step="10000"
                    value={limits.paleMaxPayoutPerDraw || 800000}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        paleMaxPayoutPerDraw: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-12 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Límite total acumulado de premios a pagar en Palés para un sorteo.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Tope Máximo por Combinación (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={limits.paleMaxPayoutPerCombination || 300000}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        paleMaxPayoutPerCombination: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-12 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Tope de premio ante una misma combinación (ej: 05-20). Venta máx permitida: RD$ {Math.floor((limits.paleMaxPayoutPerCombination || 300000) / 1000)}.
                </span>
              </div>
            </div>
          </div>

          {/* Exposure bar */}
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 font-medium">Exposición Hoy:</span>
              <span className="font-mono font-bold text-neutral-900">
                RD$ {(riskStats?.paleExposure || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.min(100, riskStats?.palePercent || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. TRIPLETA CARD (CRITICAL RISK) */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-rose-400 transition-colors ring-1 ring-rose-100">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
                  3
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">TRIPLETA</h3>
                    <span className="bg-rose-100 text-rose-800 text-[9px] font-black uppercase px-1.5 py-0.2 rounded border border-rose-200">
                      Alto Riesgo
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-semibold">3 Números | Paga 20,000x, 100x</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                {riskStats?.tripletaPercent || 0}% de uso
              </span>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Tope de Pago Máximo por Sorteo (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={limits.tripletaMaxPayoutPerDraw || 1500000}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        tripletaMaxPayoutPerDraw: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-12 pr-3 py-1.5 text-xs rounded-xl border border-rose-300 font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Blindaje ante aciertos de 3 aciertos (paga RD$ 20,000 por cada peso apostado).
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Tope Máximo por Combinación (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    value={limits.tripletaMaxPayoutPerCombination || 600000}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        tripletaMaxPayoutPerCombination: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-12 pr-3 py-1.5 text-xs rounded-xl border border-rose-300 font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Límite por combinación idéntica (ej: 10-25-88). Venta máx recomendada: RD$ {Math.floor((limits.tripletaMaxPayoutPerCombination || 600000) / 20000)}.
                </span>
              </div>
            </div>
          </div>

          {/* Exposure bar */}
          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 font-medium">Exposición Hoy:</span>
              <span className="font-mono font-bold text-neutral-900">
                RD$ {(riskStats?.tripletaExposure || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-rose-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-600 h-full rounded-full"
                style={{ width: `${Math.min(100, riskStats?.tripletaPercent || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Súper Palé, Global Cap and Risk Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mitigation Policy and Enforcement Rules */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
              Regla de Mitigación y Acción Automática en Terminales
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Acción del Servidor al Alcanzar el Tope:
              </label>
              <select
                value={limits.riskMitigationAction}
                onChange={(e) =>
                  setLimits((prev) => ({
                    ...prev,
                    riskMitigationAction: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-bold bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="BLOCK_SALES">
                  🛡️ BLOQUEAR VENTAS (Estricto): Rechaza de inmediato jugadas que sobrepasen el tope
                </option>
                <option value="WARN_ADMIN">
                  ⚠️ ADVERTIR AL ADMINISTRADOR (Monitoreo): Permite la venta pero genera alerta prioritaria
                </option>
                <option value="REDUCE_MAX_BET">
                  📉 REDUCIR APUESTA MÁXIMA (Dinámico): Limita la jugada al remanente permitido
                </option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Umbral de Alerta Preventiva: <span className="font-mono text-amber-700">{limits.autoAlertThresholdPercent}%</span>
                </label>
                <span className="text-[10px] text-neutral-400">Dispara advertencias al aproximarse</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={limits.autoAlertThresholdPercent}
                onChange={(e) =>
                  setLimits((prev) => ({
                    ...prev,
                    autoAlertThresholdPercent: Number(e.target.value),
                  }))
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-0.5">
                <span>50% Temprano</span>
                <span>80% Recomendado</span>
                <span>95% Extremo</span>
              </div>
            </div>

            {/* Súper Palé and Global Exposure inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Tope Súper Palé (RD$)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={limits.superPaleMaxPayoutPerDraw || 1000000}
                  onChange={(e) =>
                    setLimits((prev) => ({
                      ...prev,
                      superPaleMaxPayoutPerDraw: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Exposición Global Máx (RD$)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={limits.totalDrawExposureLimit || 2500000}
                  onChange={(e) =>
                    setLimits((prev) => ({
                      ...prev,
                      totalDrawExposureLimit: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-bold text-amber-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator & Tester */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
              Simulador de Validación de Topes en Vivo
            </h3>
          </div>

          <div className="space-y-3.5">
            <p className="text-[11px] text-neutral-500">
              Pruebe cómo responderá la terminal POS ante una jugada específica con los topes configurados:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Tipo de Jugada
                </label>
                <select
                  value={simPlayType}
                  onChange={(e) => setSimPlayType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-bold bg-white"
                >
                  <option value="QUINIELA">Quiniela (x60)</option>
                  <option value="PALE">Palé (x1,000)</option>
                  <option value="TRIPLETA">Tripleta (x20,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Monto Apostado (RD$)
                </label>
                <input
                  type="number"
                  min="5"
                  step="25"
                  value={simBetAmount}
                  onChange={(e) => setSimBetAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-mono font-black"
                />
              </div>
            </div>

            {/* Simulation Result Card */}
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                !limits.enabled
                  ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                  : simIsExceeded
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Premio Potencial Estimado:</span>
                <span className="font-mono font-black text-sm">
                  RD$ {simPotentialPrize.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{simCapLabel}:</span>
                <span className="font-mono font-bold">
                  RD$ {simCap.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-current/20 flex items-center gap-2">
                {!limits.enabled ? (
                  <>
                    <Info className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-xs font-bold">
                      Control desactivado: La venta pasaría sin restricciones de pago.
                    </span>
                  </>
                ) : simIsExceeded ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div className="text-xs">
                      <span className="font-black">❌ VENTA RECHAZADA POR TOPE:</span>{' '}
                      El premio superaría el tope por RD$ {(simPotentialPrize - simCap).toLocaleString()}.{' '}
                      <span className="block text-[10px] mt-0.5">
                        Apuesta máxima permitida: RD$ {simMaxRecommendedBet.toLocaleString()}.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold">
                      ✅ VENTA AUTORIZADA: Dentro de los márgenes seguros de liquidez.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Footer Bar */}
      <div className="bg-neutral-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-xs font-black uppercase tracking-wide">
              Confirmación de Topes para {selectedConsorcio?.name || 'Consorcio Seleccionado'}
            </span>
            <p className="text-[10px] text-neutral-400">
              Última actualización:{' '}
              {limits.updatedAt
                ? new Date(limits.updatedAt).toLocaleString('es-DO')
                : 'Configuración inicial por defecto'}{' '}
              {limits.updatedBy ? `por ${limits.updatedBy}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => loadConsorcioLimits(selectedConsorcioId)}
            disabled={loading || saving}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-colors"
          >
            Descartar Cambios
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Guardando...' : 'Guardar Topes de Pago'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
