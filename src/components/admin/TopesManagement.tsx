import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SalesCap, Lottery, Terminal, PlayType } from '../../types/index';
import { Plus, Trash2, ShieldAlert, CheckCircle2, Search, Sliders, DollarSign } from 'lucide-react';

export const TopesManagement: React.FC = () => {
  const [topes, setTopes] = useState<SalesCap[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [lotteryId, setLotteryId] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [playType, setPlayType] = useState<string>('QUINIELA');
  const [terminalId, setTerminalId] = useState('');
  const [date, setDate] = useState('');
  const [maxAmount, setMaxAmount] = useState('5000');
  const [formError, setFormError] = useState<string | null>(null);

  // Live Calculator / Checker states
  const [checkNumber, setCheckNumber] = useState('10');
  const [checkLotteryId, setCheckLotteryId] = useState('');
  const [checkPlayType, setCheckPlayType] = useState<PlayType>('QUINIELA');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [capsData, lotData, termData] = await Promise.all([
        api.getTopes(),
        api.getLotteries(),
        api.getTerminals(),
      ]);
      setTopes(capsData);
      setLotteries(lotData);
      setTerminals(termData);
      if (lotData.length > 0 && !checkLotteryId) {
        setCheckLotteryId(lotData[0].id);
      }
    } catch (err: any) {
      console.error('Error cargando topes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTope = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = Number(maxAmount);
    if (!amt || amt <= 0) {
      setFormError('Ingrese un monto límite válido mayor a 0');
      return;
    }

    try {
      const lot = lotteries.find((l) => l.id === lotteryId);
      const term = terminals.find((t) => t.id === terminalId);

      await api.createTope({
        lotteryId: lotteryId || undefined,
        lotteryName: lot?.name,
        number: numberInput ? numberInput.padStart(2, '0').slice(-2) : undefined,
        playType: (playType as PlayType) || undefined,
        terminalId: terminalId || undefined,
        terminalCode: term?.code,
        date: date || undefined,
        maxAmount: amt,
        active: true,
      });

      setShowModal(false);
      setNumberInput('');
      setMaxAmount('5000');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error creando tope');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desea eliminar este tope de venta?')) return;
    try {
      await api.deleteTope(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckTope = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkNumber) return;
    setChecking(true);
    try {
      const res = await api.checkTope({
        lotteryId: checkLotteryId,
        number: checkNumber,
        playType: checkPlayType,
        requestedAmount: 0,
      });
      setCheckResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">
            Control de Topes de Venta (Límites por Número y Jugada)
          </h2>
          <p className="text-xs text-neutral-500">
            Configure topes máximos por Lotería, Número, Tipo de Jugada, Terminal o Fecha
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Configurar Nuevo Tope</span>
        </button>
      </div>

      {/* CHECKER TOOL: Consultar vendido vs disponible */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4 text-emerald-600" />
          <span>Consultar Disponibilidad de Tope (Vendido vs Restante)</span>
        </h3>

        <form onSubmit={handleCheckTope} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Número (2 dígitos)
            </label>
            <input
              type="text"
              maxLength={2}
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="10"
              className="w-full px-3 py-1.5 text-sm font-mono font-bold rounded-lg border border-neutral-300 text-center"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Lotería
            </label>
            <select
              value={checkLotteryId}
              onChange={(e) => setCheckLotteryId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white"
            >
              {lotteries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Tipo de Jugada
            </label>
            <select
              value={checkPlayType}
              onChange={(e) => setCheckPlayType(e.target.value as PlayType)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white"
            >
              <option value="QUINIELA">Quiniela</option>
              <option value="PALE">Palé</option>
              <option value="TRIPLETA">Tripleta</option>
              <option value="SUPER_PALE">Súper Palé</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={checking}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
          >
            {checking ? 'Verificando...' : 'Consultar Tope'}
          </button>
        </form>

        {checkResult && (
          <div className="mt-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-neutral-500 block text-[11px]">Número Consultado:</span>
              <span className="font-bold text-sm text-neutral-900">{checkNumber} ({checkPlayType})</span>
            </div>

            <div>
              <span className="text-neutral-500 block text-[11px]">Límite Máximo Configurado:</span>
              <span className="font-bold text-neutral-900">
                {checkResult.maxAllowed === Infinity ? 'Sin límite' : `RD$${checkResult.maxAllowed.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block text-[11px]">Vendido Hoy:</span>
              <span className="font-bold text-amber-700">
                RD${checkResult.currentSold.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block text-[11px]">Disponible para Vender:</span>
              <span className={`font-bold text-base ${checkResult.remaining <= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {checkResult.remaining === Infinity ? 'Ilimitado' : `RD$${checkResult.remaining.toLocaleString()}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Topes List Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            Reglas de Topes Activas en el Sistema
          </h3>
          <span className="text-xs text-neutral-500">{topes.length} topes registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase font-semibold text-[10px] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Tipo Jugada</th>
                <th className="px-4 py-3">Lotería</th>
                <th className="px-4 py-3">Terminal</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Tope Máximo</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {topes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                    No hay topes configurados. Las ventas son libres hasta que se establezca un límite.
                  </td>
                </tr>
              ) : (
                topes.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-base text-neutral-900">
                      {t.number || <span className="text-xs text-neutral-400 font-sans font-normal">Todos los números</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neutral-800">
                        {t.playType ? t.playType.replace('_', ' ') : 'Todos'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {t.lotteryName || (t.lotteryId ? t.lotteryId : 'Todas las loterías')}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">
                      {t.terminalCode ? `#${t.terminalCode}` : 'Todas'}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600 tabular-nums">
                      {t.date || 'Permanente'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-sm text-neutral-900 tabular-nums">
                      RD${t.maxAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                        title="Eliminar tope"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to create a new tope */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Nuevo Tope de Venta</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTope} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Número Específico (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 10"
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300 font-mono text-center font-bold"
                  />
                  <span className="text-[10px] text-neutral-400">Dejar vacío para todos</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Tipo de Jugada
                  </label>
                  <select
                    value={playType}
                    onChange={(e) => setPlayType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white font-medium"
                  >
                    <option value="">Todas las jugadas</option>
                    <option value="QUINIELA">Quiniela</option>
                    <option value="PALE">Palé</option>
                    <option value="TRIPLETA">Tripleta</option>
                    <option value="SUPER_PALE">Súper Palé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Lotería
                </label>
                <select
                  value={lotteryId}
                  onChange={(e) => setLotteryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white"
                >
                  <option value="">Todas las Loterías</option>
                  {lotteries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Terminal
                  </label>
                  <select
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white"
                  >
                    <option value="">Todas las terminales</option>
                    {terminals.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.code} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Fecha (opcional)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Monto Máximo Permitido (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-10 pr-3 py-2 text-sm font-mono font-bold rounded border border-neutral-300 text-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Crear Tope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
