import React, { useState } from 'react';
import { User, ProductoTransaction } from '../../types';
import { ProductosModal } from './ProductosModal';
import { Package, ArrowLeft, History, CheckCircle2 } from 'lucide-react';

interface ProductosViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const ProductosView: React.FC<ProductosViewProps> = ({ user, onNavigateTab }) => {
  const [history, setHistory] = useState<ProductoTransaction[]>([
    {
      id: 'prod-demo-1',
      transactionNumber: 'PRD-8129401',
      productId: 'prod-betcris',
      productName: 'Betcris Deportes',
      category: 'RECARGAS_DEPORTIVAS',
      customerReference: 'USER_CRIS_9942',
      amount: 500,
      terminalCode: user.terminalCode || '1001',
      cashierName: user.name || user.username || 'Cajero',
      date: new Date().toISOString().split('T')[0],
      time: '09:40 AM',
      status: 'COMPLETADO',
      authCode: 'AUT-331902',
    },
    {
      id: 'prod-demo-2',
      transactionNumber: 'PRD-8129402',
      productId: 'prod-freefire',
      productName: 'Free Fire Diamantes',
      category: 'PINES_DIGITALES',
      customerReference: 'ID_FF_88310',
      amount: 150,
      terminalCode: user.terminalCode || '1001',
      cashierName: user.name || user.username || 'Cajero',
      date: new Date().toISOString().split('T')[0],
      time: '10:55 AM',
      pinCode: 'FF92-KL41-MN88',
      status: 'COMPLETADO',
      authCode: 'AUT-449102',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleSuccess = (newTx: ProductoTransaction) => {
    setHistory((prev) => [newTx, ...prev]);
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
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                🛍️
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Módulo de Productos & Servicios
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Venta de pines digitales, recargas deportivas, facturas y loterías instantáneas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>Vender Producto</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Productos Vendidos</span>
          <div className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-1">
            {history.length}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Monto Facturado</span>
          <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            RD$ {totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Categorías Disponibles</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">DEPORTES</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">PINES</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">FACTURAS</span>
          </div>
        </div>
      </div>

      {/* Historial de Ventas */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Historial de Productos Vendidos
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">{history.length} ventas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Transacción</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Referencia / Cuenta</th>
                <th className="px-4 py-3">PIN / Autorización</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Hora</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{h.transactionNumber}</td>
                  <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{h.productName}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{h.customerReference}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {h.pinCode || h.authCode}
                  </td>
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

      {/* Modal de Productos */}
      <ProductosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
