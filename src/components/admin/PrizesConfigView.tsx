import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PrizeConfig } from '../../types/index';
import { Award, Save, CheckCircle2, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

export const PrizesConfigView: React.FC = () => {
  const [config, setConfig] = useState<PrizeConfig>({
    quiniela_primera: 60,
    quiniela_segunda: 8,
    quiniela_tercera: 4,
    pale_primera_segunda: 1000,
    pale_primera_tercera: 1000,
    pale_segunda_tercera: 100,
    tripleta_tres: 20000,
    tripleta_dos: 100,
    super_pale: 3000,
    super_pale_allow_inverse: true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await api.getPrizes();
      if (data) setConfig(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);

    try {
      const updated = await api.updatePrizes(config);
      setConfig(updated);
      setSuccess('Configuración de premios actualizada y guardada en la base de datos.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error guardando configuración de premios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">
            Configuración de Multiplicadores y Tablas de Premios
          </h2>
          <p className="text-xs text-neutral-500">
            Define cuánto paga cada modalidad por cada RD$1.00 apostado. Los cambios se aplican automáticamente a futuros sorteos.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Guardando...' : 'Guardar Premios en BD'}</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. QUINIELA */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-wider">
                1. Modalidad Quiniela
              </h3>
              <p className="text-[11px] text-neutral-500">
                Acierto de 1 número en 1ra, 2da o 3ra posición
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
              Por cada RD$1
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                Premio en Primera (1ra)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-emerald-600">RD$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.quiniela_primera}
                  onChange={(e) => setConfig({ ...config, quiniela_primera: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-emerald-300 text-emerald-950 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$60 por RD$1</span>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-800 mb-1">
                Premio en Segunda (2da)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-blue-600">RD$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.quiniela_segunda}
                  onChange={(e) => setConfig({ ...config, quiniela_segunda: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-blue-300 text-blue-950 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$8 por RD$1</span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <label className="block text-xs font-bold text-amber-800 mb-1">
                Premio en Tercera (3ra)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-amber-600">RD$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.quiniela_tercera}
                  onChange={(e) => setConfig({ ...config, quiniela_tercera: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-amber-300 text-amber-950 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$4 por RD$1</span>
            </div>
          </div>
        </div>

        {/* 2. PALE */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-wider">
                2. Modalidad Palé
              </h3>
              <p className="text-[11px] text-neutral-500">
                Acierto de 2 números en el mismo sorteo
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
              Por cada RD$1
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                1ra y 2da
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.pale_primera_segunda}
                  onChange={(e) => setConfig({ ...config, pale_primera_segunda: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-neutral-300 text-neutral-900 bg-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$1,000 por RD$1</span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                1ra y 3ra
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.pale_primera_tercera}
                  onChange={(e) => setConfig({ ...config, pale_primera_tercera: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-neutral-300 text-neutral-900 bg-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$1,000 por RD$1</span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                2da y 3ra
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.pale_segunda_tercera}
                  onChange={(e) => setConfig({ ...config, pale_segunda_tercera: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-neutral-300 text-neutral-900 bg-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$100 por RD$1</span>
            </div>
          </div>
        </div>

        {/* 3. TRIPLETA & SUPER PALE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tripleta */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-wider">
                3. Modalidad Tripleta
              </h3>
              <p className="text-[11px] text-neutral-500">
                Acierto de 3 o 2 números entre 1ra, 2da y 3ra
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tripleta 3 Aciertos (Todos los números)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={config.tripleta_tres}
                    onChange={(e) => setConfig({ ...config, tripleta_tres: Number(e.target.value) })}
                    className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-neutral-300 text-neutral-900 bg-white"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$20,000 por RD$1</span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tripleta 2 Aciertos (Cualquiera de dos)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={config.tripleta_dos}
                    onChange={(e) => setConfig({ ...config, tripleta_dos: Number(e.target.value) })}
                    className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-neutral-300 text-neutral-900 bg-white"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$100 por RD$1</span>
              </div>
            </div>
          </div>

          {/* Súper Palé */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>4. Modalidad Súper Palé</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Primera de Lotería 1 + Primera de Lotería 2
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Premio Súper Palé
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-amber-600">RD$</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={config.super_pale}
                    onChange={(e) => setConfig({ ...config, super_pale: Number(e.target.value) })}
                    className="w-full pl-10 pr-3 py-1.5 text-base font-mono font-bold rounded border border-amber-300 text-amber-950 bg-white"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">Estándar: RD$3,000 por RD$1</span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowInverse"
                    checked={config.super_pale_allow_inverse}
                    onChange={(e) => setConfig({ ...config, super_pale_allow_inverse: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="allowInverse" className="text-xs font-semibold text-neutral-800">
                    Aceptar Combinación Inversa
                  </label>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Si el cliente juega 10-33 en REAL+LOTEKA, gana tanto si sale 10 en REAL y 33 en LOTEKA, como si sale 33 en REAL y 10 en LOTEKA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
