import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AdminAuditLog, User } from '../../types';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, Button, Badge } from '../design-system';

interface AuditLogsViewProps {
  currentUser: User;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminAuditLogs(currentUser.consorcioId);
      setLogs(data);
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      log.userName.toLowerCase().includes(q) ||
      (log.targetUserName && log.targetUserName.toLowerCase().includes(q)) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Fecha y Hora', 'Usuario', 'Rol', 'Consorcio', 'Accion', 'Usuario Afectado', 'Detalles', 'Dispositivo', 'IP'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('es-DO')}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.consorcioName || ''}"`,
      `"${l.action}"`,
      `"${l.targetUserName || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.device || ''}"`,
      `"${l.ip || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_administrativa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Auditoría & Cumplimiento</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Registro de Auditoría Administrativa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historial inalterable de asignación y revocación de permisos, publicación de sorteos y liquidaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={exportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Exportar CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={loadLogs}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* 2. Filters Card */}
      <Card variant="default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="ALL">Todas las Acciones</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Usuario Responsable</th>
                <th className="py-2.5 px-3">Consorcio</th>
                <th className="py-2.5 px-3">Acción Realizada</th>
                <th className="py-2.5 px-3">Usuario / Recurso Afectado</th>
                <th className="py-2.5 px-3">Detalle de Operación</th>
                <th className="py-2.5 px-3">IP / Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron registros de auditoría con los criterios especificados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPermAction = log.action.includes('PERMISO');
                  const isPrize = log.action.includes('PREMIO');
                  const isResult = log.action.includes('RESULTADO');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-DO')}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.userName}
                        </span>
                        <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          {log.userRole}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {log.consorcioName || 'Consorcio Central'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.action === 'ASIGNAR_PERMISO'
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : log.action === 'REVOCAR_PERMISO'
                              ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                              : isPrize
                              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              : isResult
                              ? 'bg-blue-500/15 text-blue-600 border-blue-500/30'
                              : 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {log.targetUserName || 'N/A'}
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300 max-w-sm">
                        {log.details}
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {log.device || 'PC'} {log.ip ? `· ${log.ip}` : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
