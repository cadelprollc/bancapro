import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Lottery, User } from '../../types/index';
import {
  Plus,
  Edit2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Calendar,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  getLotteryScheduleStatus,
  formatTime12,
  formatTime24,
  minutesTo12Hour,
  parseTimeToMinutes,
} from '../../utils/lotterySchedule';
import { ConsorcioPayoutLimitsSection } from './ConsorcioPayoutLimitsSection';

interface LotteriesManagementProps {
  user?: User | null;
}

export const LotteriesManagement: React.FC<LotteriesManagementProps> = ({ user }) => {
  const [activeSection, setActiveSection] = useState<'schedules' | 'payout_limits'>('schedules');
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLottery, setEditingLottery] = useState<Lottery | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('12:55');
  const [active, setActive] = useState(true);
  const [color, setColor] = useState('#16A34A');
  const [logoUrl, setLogoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filter / view states
  const [filterState, setFilterState] = useState<'ALL' | 'ABIERTA' | 'CERRADA' | 'DESACTIVADA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentClock, setCurrentClock] = useState<string>('');

  const fetchLotteries = async () => {
    setLoading(true);
    try {
      const data = await api.getLotteries();
      setLotteries(data);
    } catch (err: any) {
      console.error('Error cargando loterías', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotteries();
  }, []);

  // Live timer to re-evaluate schedules and show live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentClock(
        now.toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenCreate = () => {
    setEditingLottery(null);
    setName('');
    setCode('');
    setOpenTime('07:00');
    setCloseTime('12:55');
    setActive(true);
    setColor('#16A34A');
    setLogoUrl('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (lot: Lottery) => {
    setEditingLottery(lot);
    setName(lot.name);
    setCode(lot.code);
    setOpenTime(formatTime24(lot.openTime, '07:00'));
    setCloseTime(formatTime24(lot.closeTime || lot.drawTime, '12:55'));
    setActive(lot.active);
    setColor(lot.color || '#16A34A');
    setLogoUrl(lot.logoUrl || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const formattedOpen = formatTime12(openTime, '07:00 AM');
    const formattedClose = formatTime12(closeTime, '12:55 PM');

    try {
      if (editingLottery) {
        await api.updateLottery(editingLottery.id, {
          name: name.toUpperCase().trim(),
          code: code.toUpperCase().trim(),
          openTime: formattedOpen,
          closeTime: formattedClose,
          drawTime: formattedClose,
          active,
          color,
          logoUrl: logoUrl.trim() || undefined,
        });
      } else {
        if (!name || !code || !closeTime) {
          setFormError('Nombre, código y hora de cierre son obligatorios.');
          return;
        }
        await api.createLottery({
          name: name.toUpperCase().trim(),
          code: code.toUpperCase().trim(),
          openTime: formattedOpen,
          closeTime: formattedClose,
          drawTime: formattedClose,
          active,
          color,
          logoUrl: logoUrl.trim() || undefined,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        });
      }

      setShowModal(false);
      fetchLotteries();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la configuración de la lotería');
    }
  };

  const handleToggleActive = async (lot: Lottery) => {
    try {
      await api.updateLottery(lot.id, { active: !lot.active });
      fetchLotteries();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick preset helper for time
  const applyPresetSchedule = (presetOpen: string, presetClose: string) => {
    setOpenTime(presetOpen);
    setCloseTime(presetClose);
  };

  // Filtered lotteries
  const filteredLotteries = lotteries.filter((lot) => {
    const status = getLotteryScheduleStatus(lot);
    if (filterState !== 'ALL' && status.status !== filterState) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return lot.name.toLowerCase().includes(q) || lot.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate statistics
  const countOpen = lotteries.filter((l) => getLotteryScheduleStatus(l).status === 'ABIERTA').length;
  const countClosed = lotteries.filter((l) => getLotteryScheduleStatus(l).status === 'CERRADA').length;
  const countDisabled = lotteries.filter((l) => !l.active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSection('schedules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeSection === 'schedules'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Loterías & Horarios de Sorteos</span>
          <span className="text-[10px] bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded-full font-mono font-bold">
            {lotteries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('payout_limits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeSection === 'payout_limits'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-300" />
          <span>Topes Máximos de Pago (Quiniela, Palé, Tripleta)</span>
          <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/40 font-bold">
            Mitigación Financiera
          </span>
        </button>
      </div>

      {/* Financial Payout Limits Section (at Consortium Level) */}
      {activeSection === 'payout_limits' && (
        <ConsorcioPayoutLimitsSection user={user} onRefreshLotteries={fetchLotteries} />
      )}

      {/* Lotteries & Schedules Section */}
      {activeSection === 'schedules' && (
        <>
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">
                CONFIGURACIÓN DE LOTERÍAS Y HORARIOS
              </h2>
              <p className="text-xs text-neutral-500">
                Apertura y cierre automático de ventas según los horarios oficiales configurados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Live system clock indicator */}
          <div className="flex items-center gap-2 bg-neutral-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>HORA SISTEMA: {currentClock || '12:00:00 PM'}</span>
          </div>

          <button
            onClick={fetchLotteries}
            disabled={loading}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            title="Recargar loterías"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Lotería</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterState('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterState === 'ALL'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Loterías</div>
          <div className="text-2xl font-black mt-1">{lotteries.length}</div>
          <div className="text-[10px] mt-1 opacity-70">En la base de datos</div>
        </div>

        <div
          onClick={() => setFilterState('ABIERTA')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterState === 'ABIERTA'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span>🟢 ABIERTAS AHORA</span>
          </div>
          <div className="text-2xl font-black mt-1">{countOpen}</div>
          <div className="text-[10px] mt-1 text-emerald-800 font-medium">Disponibles en botón SORTEOS</div>
        </div>

        <div
          onClick={() => setFilterState('CERRADA')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterState === 'CERRADA'
              ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
              : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span>🔴 CERRADAS AHORA</span>
          </div>
          <div className="text-2xl font-black mt-1">{countClosed}</div>
          <div className="text-[10px] mt-1 text-rose-800 font-medium">Venta bloqueada automáticamente</div>
        </div>

        <div
          onClick={() => setFilterState('DESACTIVADA')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterState === 'DESACTIVADA'
              ? 'bg-neutral-600 text-white border-neutral-600 shadow-sm'
              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span>⚪ DESACTIVADAS</span>
          </div>
          <div className="text-2xl font-black mt-1">{countDisabled}</div>
          <div className="text-[10px] mt-1 text-neutral-500 font-medium">Inactivas manualmente</div>
        </div>
      </div>

      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o código (ej: REAL, LEIDSA)..."
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterState('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              filterState === 'ALL'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Todas ({lotteries.length})
          </button>
          <button
            onClick={() => setFilterState('ABIERTA')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              filterState === 'ABIERTA'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🟢 Abiertas ({countOpen})
          </button>
          <button
            onClick={() => setFilterState('CERRADA')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              filterState === 'CERRADA'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            🔴 Cerradas ({countClosed})
          </button>
          <button
            onClick={() => setFilterState('DESACTIVADA')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              filterState === 'DESACTIVADA'
                ? 'bg-neutral-700 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            ⚪ Desactivadas ({countDisabled})
          </button>
        </div>
      </div>

      {/* Lotteries Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLotteries.map((lot) => {
          const sched = getLotteryScheduleStatus(lot);

          return (
            <div
              key={lot.id}
              className={`bg-white rounded-2xl border shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                sched.isOpen
                  ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                  : !lot.active
                  ? 'border-neutral-200 opacity-75'
                  : 'border-red-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-neutral-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {lot.logoUrl ? (
                      <img
                        src={lot.logoUrl}
                        alt={lot.name}
                        className="w-8 h-8 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: lot.color || '#16A34A' }}
                      />
                    )}
                    <div>
                      <h3 className="font-black text-sm text-neutral-900 tracking-tight uppercase">
                        {lot.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-neutral-400 uppercase font-semibold">
                          CÓDIGO: {lot.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide border shadow-2xs ${sched.badgeColor}`}
                  >
                    {sched.statusLabel}
                  </span>
                </div>
              </div>

              {/* Schedule Info Body */}
              <div className="p-4 space-y-3 flex-1">
                {/* Visual Opening and Closing Window */}
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Hora Inicio de Venta:
                    </span>
                    <span className="font-mono font-bold text-neutral-900">
                      {sched.formattedOpenTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      Hora Cierre de Venta:
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      {sched.formattedCloseTime}
                    </span>
                  </div>
                </div>

                {/* Live Real-time Status Notice */}
                <div
                  className={`text-xs px-3 py-2 rounded-xl border flex items-center justify-between font-semibold ${
                    sched.isOpen
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : !lot.active
                      ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <span className="text-[11px]">
                    {sched.isOpen ? '🟢 En venta activa' : sched.status === 'CERRADA' ? '🔴 Fuera de horario' : '⚪ Desactivada'}
                  </span>
                  <span className="font-mono text-[11px] font-bold">
                    {sched.remainingText}
                  </span>
                </div>

                {/* Súper Palé notice */}
                <div className="text-[10px] text-neutral-400 italic">
                  {sched.isOpen
                    ? '✓ Disponible para selección individual y Súper Palé'
                    : '✗ Oculta en SORTEOS y bloqueada en servidor (Súper Palé impedido)'}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(lot)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    lot.active
                      ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/60'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border border-neutral-300'
                  }`}
                >
                  {lot.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{lot.active ? 'Activa' : 'Desactivada'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(lot)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Horario</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLotteries.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
          <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-neutral-700">No se encontraron loterías con los filtros seleccionados</p>
          <p className="text-xs text-neutral-400 mt-1">Pruebe a cambiar el estado o la búsqueda.</p>
        </div>
      )}
        </>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-sm tracking-tight uppercase">
                    {editingLottery ? `CONFIGURAR LOTERÍA: ${editingLottery.name}` : 'CREAR NUEVA LOTERÍA'}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    Establezca horarios individuales de inicio y cierre de venta
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white text-base font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  Nombre de la Lotería (ej: REAL, LEIDSA, GANA MÁS)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: REAL"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 font-black uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Code and Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Código Breve
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="REAL"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Color Distintivo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-8 rounded-lg cursor-pointer border border-neutral-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-neutral-300 font-mono font-bold uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Horario de Venta Configurado</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Apertura y Cierre Automáticos</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Hora de Inicio (Apertura)
                    </label>
                    <input
                      type="time"
                      required
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">
                      Formato 12h: {formatTime12(openTime, '07:00 AM')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Hora de Cierre (Límite)
                    </label>
                    <input
                      type="time"
                      required
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">
                      Formato 12h: {formatTime12(closeTime, '12:55 PM')}
                    </span>
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div>
                  <span className="text-[10px] text-neutral-500 font-semibold block mb-1">
                    Horarios Frecuentes Dominicanos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetSchedule('07:00', '12:55')}
                      className="px-2 py-1 rounded bg-white hover:bg-neutral-200 border border-neutral-200 text-[10px] font-semibold text-neutral-700"
                    >
                      REAL (7:00 AM - 12:55 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetSchedule('07:00', '14:30')}
                      className="px-2 py-1 rounded bg-white hover:bg-neutral-200 border border-neutral-200 text-[10px] font-semibold text-neutral-700"
                    >
                      GANA MÁS (7:00 AM - 2:30 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetSchedule('07:00', '19:55')}
                      className="px-2 py-1 rounded bg-white hover:bg-neutral-200 border border-neutral-200 text-[10px] font-semibold text-neutral-700"
                    >
                      LOTEKA (7:00 AM - 7:55 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetSchedule('07:00', '20:55')}
                      className="px-2 py-1 rounded bg-white hover:bg-neutral-200 border border-neutral-200 text-[10px] font-semibold text-neutral-700"
                    >
                      LEIDSA (7:00 AM - 8:55 PM)
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo / Emblema de la Lotería */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-neutral-600">
                  Logo / Emblema de la Lotería (URL o Data URI)
                </label>
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-9 h-9 rounded-xl object-contain bg-slate-100 p-0.5 border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                      🎰
                    </div>
                  )}
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://ejemplo.com/logo.png o pegar SVG/Base64"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono text-neutral-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Quitar logo"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Status active checkbox */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <label htmlFor="activeLot" className="text-xs font-bold text-neutral-800 block cursor-pointer">
                    Estado: {active ? '🟢 Activa para Ventas' : '⚪ Desactivada'}
                  </label>
                  <p className="text-[10px] text-neutral-400">
                    Si está desactivada, no se mostrará aunque esté dentro del horario.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="activeLot"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                >
                  Guardar Horario y Lotería
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
