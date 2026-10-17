import React, { useState } from 'react';
import { User, RecargaTransaction } from '../../types';
import { RecargasModal } from './RecargasModal';
import { Smartphone, Zap, ArrowLeft, History, CheckCircle2, RefreshCw } from 'lucide-react';

interface RecargasViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const RecargasView: React.FC<RecargasViewProps> = ({ user, onNavigateTab }) => {
  const [history, setHistory] = useState<RecargaTransaction[]>([
    {
      id: 'rec-demo-1',
      transactionNumber: 'REC-9824101',
      operator: 'CLARO',
      phoneNumber: '(809) 555-4821',
      type: 'SALDO',
      amount: 200,
      terminalCode: user.terminalCode || '1001',
      cashierName: user.name || user.username || 'Cajero',
      date: new Date().toISOString().split('T')[0],
      time: '10:14 AM',
      status: 'COMPLETADO',
      authCode: 'AUT-882190',
    },
    {
      id: 'rec-demo-2',
      transactionNumber: 'REC-9824102',
      operator: 'ALTICE',
      phoneNumber: '(829) 441-9032',
      type: 'PAQUETICO',
      packageName: 'Paquetico Libre 3D',
      amount: 100,
      terminalCode: user.terminalCode || '1001',
      cashierName: user.name || user.username || 'Cajero',
      date: new Date().toISOString().split('T')[0],
      time: '11:25 AM',
      status: 'COMPLETADO',
      authCode: 'AUT-771249',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleSuccess = (newRec: RecargaTransaction) => {
    setHistory((prev) => [newRec, ...prev]);
  };

  const totalAmount = history.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#0d172a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs font-bold active:scale-95 shrink-0"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Inicio</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                📱
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Módulo de Recargas Telefónicas
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Venta de saldo y paqueticos de internet para Claro, Altice y Viva
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>Nueva Recarga</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Recargas Hoy</span>
          <div className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-1">
            {history.length}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Volumen Recargado</span>
          <div className="font-mono text-2xl font-black text-blue-600 dark:text-cyan-400 mt-1">
            RD$ {totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Operadoras Conectadas</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">CLARO</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">ALTICE</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">VIVA</span>
          </div>
        </div>
      </div>

      {/* Historial de Recargas */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Historial de Recargas del Turno
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">{history.length} operaciones</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Transacción</th>
                <th className="px-4 py-3">Operadora</th>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Tipo / Paquete</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Hora</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{h.transactionNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      h.operator === 'CLARO' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                      h.operator === 'ALTICE' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400' :
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>
                      {h.operator}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{h.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{h.packageName || 'Saldo Regular'}</td>
                  <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white">RD$ {h.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-400">{h.time}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      COMPLETADO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Recargas */}
      <RecargasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
