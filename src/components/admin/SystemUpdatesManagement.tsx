import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SystemUpdate, TerminalUpdateStatus, SystemBackup, User } from '../../types/index';
import {
  RefreshCw,
  Plus,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Download,
  Upload,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  ArrowUpRight,
  Server,
  Layers,
  FileCode,
  Check,
  History,
  Lock,
  Database,
  Terminal as TerminalIcon,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface SystemUpdatesManagementProps {
  user: User;
}

export const SystemUpdatesManagement: React.FC<SystemUpdatesManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'terminals' | 'releases' | 'history' | 'backups' | 'preview'>('terminals');
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [terminalsStatus, setTerminalsStatus] = useState<TerminalUpdateStatus[]>([]);
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterConsorcio, setFilterConsorcio] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'updated' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Release Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [version, setVersion] = useState('v1.2.0');
  const [title, setTitle] = useState('');
  const [notesList, setNotesList] = useState<string[]>([
    'Nueva función de reportes consolidados y exportación.',
    'Mejoras en velocidad de impresión de tickets térmicos.',
    'Corrección de errores en cálculo de topes.',
    'Mejoras de seguridad y cifrado en comunicaciones con el servidor.',
  ]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [packageName, setPackageName] = useState('bancapro-v1.2.0.bundle');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [submittingRelease, setSubmittingRelease] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Backup modal / trigger
  const [backupDescription, setBackupDescription] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Terminal manual simulation
  const [updatingTerminalCode, setUpdatingTerminalCode] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [upds, terms, bcks] = await Promise.all([
        api.getSystemUpdates(),
        api.getTerminalUpdateStatuses(),
        api.getBackups(),
      ]);
      setUpdates(upds);
      setTerminalsStatus(terms);
      setBackups(bcks);
    } catch (err: any) {
      console.error('Error cargando datos de actualizaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    setNotesList([...notesList, newNoteInput.trim()]);
    setNewNoteInput('');
  };

  const handleRemoveNote = (idx: number) => {
    setNotesList(notesList.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setPackageName(file.name);
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanVer = version.trim();
    if (!cleanVer) {
      setFormError('Debe indicar el número de versión (ej: v1.1.0).');
      return;
    }
    if (!title.trim()) {
      setFormError('Debe ingresar un título para la versión.');
      return;
    }
    if (notesList.length === 0) {
      setFormError('Agregue al menos una novedad o cambio a la versión.');
      return;
    }

    setSubmittingRelease(true);
    try {
      await api.createSystemUpdate({
        version: cleanVer,
        title: title.trim(),
        releaseNotes: notesList,
        isMandatory,
        status: publishImmediately ? 'PUBLISHED' : 'INACTIVE',
        packageUrl: `/packages/${packageName || `bancapro-${cleanVer}.bundle`}`,
        minSupportedVersion: 'v1.0.0',
      });

      setShowCreateModal(false);
      showFeedback(`¡Versión ${cleanVer} creada y publicada exitosamente!`);
      // Reset form
      setTitle('');
      setNotesList([
        'Nueva función de reportes.',
        'Mejoras en impresión de tickets.',
        'Corrección de errores.',
        'Mejoras de seguridad.',
      ]);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error creando la versión.');
    } finally {
      setSubmittingRelease(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await api.toggleSystemUpdateStatus(id);
      showFeedback(
        `Estado de actualización cambiado a: ${currentStatus === 'PUBLISHED' ? 'INACTIVA' : 'PUBLICADA'}`
      );
      await loadData();
    } catch (err: any) {
      alert('Error cambiando estado: ' + err.message);
    }
  };

  const handleDeleteUpdate = async (id: string, ver: string) => {
    if (!confirm(`¿Está seguro de eliminar el registro de la versión ${ver}?`)) return;
    try {
      await api.deleteSystemUpdate(id);
      showFeedback(`Versión ${ver} eliminada del catálogo.`);
      await loadData();
    } catch (err: any) {
      alert('Error eliminando actualización: ' + err.message);
    }
  };

  const handleSimulateTerminalUpdate = async (terminalCode: string) => {
    setUpdatingTerminalCode(terminalCode);
    try {
      const published = updates.filter((u) => u.status === 'PUBLISHED')[0];
      const targetVer = published?.version || 'v1.1.0';
      await api.simulateTerminalUpdate(terminalCode, targetVer);
      showFeedback(`Terminal #${terminalCode} actualizada a ${targetVer} correctamente.`);
      await loadData();
    } catch (err: any) {
      alert('Error simulando actualización: ' + err.message);
    } finally {
      setUpdatingTerminalCode(null);
    }
  };

  const handleCreateManualBackup = async () => {
    setCreatingBackup(true);
    try {
      const desc = backupDescription || `Respaldo manual de seguridad (${new Date().toLocaleDateString('es-DO')})`;
      const bck = await api.createBackup(desc);
      showFeedback(`Respaldo generado con éxito: ${bck.filename}`);
      setBackupDescription('');
      await loadData();
    } catch (err: any) {
      alert('Error creando respaldo: ' + err.message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (bckId: string, filename: string) => {
    if (!confirm(`ADVERTENCIA: ¿Desea restaurar el sistema al punto de respaldo "${filename}"?\n\nLos registros se sincronizarán exactamente con ese punto de guardado.`)) {
      return;
    }
    setRestoringBackupId(bckId);
    try {
      const res = await api.restoreBackup(bckId);
      showFeedback(res.message);
      await loadData();
    } catch (err: any) {
      alert('Error restaurando respaldo: ' + err.message);
    } finally {
      setRestoringBackupId(null);
    }
  };

  // Stats calculation
  const totalTerminals = terminalsStatus.length;
  const updatedTerminalsCount = terminalsStatus.filter((t) => t.isUpToDate).length;
  const pendingTerminalsCount = totalTerminals - updatedTerminalsCount;
  const updateCoveragePct = totalTerminals > 0 ? Math.round((updatedTerminalsCount / totalTerminals) * 100) : 100;
  const activeRelease = updates.find((u) => u.status === 'PUBLISHED');

  // Filtered terminals
  const filteredTerminals = terminalsStatus.filter((t) => {
    const matchesSearch =
      t.terminalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.terminalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.consorcioName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConsorcio = filterConsorcio === 'all' || t.consorcioId === filterConsorcio;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'updated' && t.isUpToDate) ||
      (filterStatus === 'pending' && !t.isUpToDate);

    return matchesSearch && matchesConsorcio && matchesStatus;
  });

  const uniqueConsorcios = Array.from(
    new Set(terminalsStatus.map((t) => JSON.stringify({ id: t.consorcioId, name: t.consorcioName })))
  ).map((s) => JSON.parse(s));

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{feedbackMessage}</span>
        </div>
      )}

      {/* Main Header / Banner */}
      <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            🔄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight uppercase">
                SISTEMA DE ACTUALIZACIONES CENTRALIZADO
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-400 text-neutral-950 uppercase">
                OTA / Servidor Central
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Despliegue centralizado de versiones, detección automática en terminales, control de versiones e integridad criptográfica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Versión</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Versión Publicada</span>
            <Rocket className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {activeRelease ? activeRelease.version : 'Ninguna'}
          </div>
          <div className="text-[11px] text-indigo-600 font-bold mt-0.5 truncate">
            {activeRelease?.title || 'Sin versión activa'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Terminales Red</span>
            <TerminalIcon className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {totalTerminals}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
            Dispositivos registrados
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
            <span>Actualizadas</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {updatedTerminalsCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
            ✅ Al día con última versión
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center justify-between">
            <span>Pendientes</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
            {pendingTerminalsCount}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-0.5">
            ⚠️ Versión anterior
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Cobertura de Red</span>
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {updateCoveragePct}%
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${updateCoveragePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('terminals')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'terminals'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          <span>1. Control por Terminal ({terminalsStatus.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('releases')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'releases'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>2. Gestión de Versiones ({updates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>3. Historial Central</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'backups'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>4. Seguridad y Respaldos ({backups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>5. Vista Previa de Terminal</span>
        </button>
      </div>

      {/* TAB 1: CONTROL POR TERMINAL (User requirement 3) */}
      {activeTab === 'terminals' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código de terminal, nombre o consorcio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterConsorcio}
                onChange={(e) => setFilterConsorcio(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos los Consorcios</option>
                {uniqueConsorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos los Estados</option>
                <option value="updated">✅ Solo Actualizadas</option>
                <option value="pending">⚠️ Solo Pendientes</option>
              </select>
            </div>
          </div>

          {/* Terminals Table */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Estado de Versión por Dispositivo ({filteredTerminals.length} terminales)
              </div>
              <div className="text-[11px] text-neutral-500">
                Versión oficial activa:{' '}
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {activeRelease?.version || 'v1.1.0'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Consorcio</th>
                    <th className="py-3 px-4">Terminal</th>
                    <th className="py-3 px-4">Versión Instalada</th>
                    <th className="py-3 px-4">Versión Servidor</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha de Actualización</th>
                    <th className="py-3 px-4">Última Detección</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredTerminals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-400">
                        No se encontraron terminales con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredTerminals.map((term) => (
                      <tr key={term.terminalId} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-900">{term.consorcioName}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Código: {term.consorcioCode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
                            <TerminalIcon className="w-3 h-3 text-neutral-400" />
                            #{term.terminalCode}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                            {term.terminalName}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              term.isUpToDate
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {term.installedVersion}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-neutral-600">
                          {term.latestVersion}
                        </td>
                        <td className="py-3 px-4">
                          {term.isUpToDate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Actualizada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 text-[11px]">
                          {term.updatedAt ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              <span>{new Date(term.updatedAt).toLocaleString('es-DO')}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Pre-instalada v1.0.0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {term.lastCheckAt
                            ? new Date(term.lastCheckAt).toLocaleTimeString('es-DO', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'Reciente'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!term.isUpToDate && (
                            <button
                              onClick={() => handleSimulateTerminalUpdate(term.terminalCode)}
                              disabled={updatingTerminalCode === term.terminalCode}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold uppercase transition-all shadow-2xs"
                              title="Simular actualización remota directa"
                            >
                              {updatingTerminalCode === term.terminalCode ? (
                                <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                              ) : (
                                <Download className="w-3 h-3 inline mr-1" />
                              )}
                              Actualizar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE VERSIONES Y LANZAMIENTOS (User requirement 1) */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
              Catálogo de Versiones Publicadas ({updates.length})
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Nueva Versión</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {updates.map((upd) => (
              <div
                key={upd.id}
                className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {upd.status === 'PUBLISHED' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                    OFICIAL ACTIVA
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-lg font-black text-neutral-900 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-neutral-200">
                      {upd.version}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        upd.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {upd.status === 'PUBLISHED' ? 'Publicada' : 'Inactiva'}
                    </span>
                    {upd.isMandatory ? (
                      <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                        <Lock className="w-2.5 h-2.5" /> Obligatoria
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full uppercase">
                        Opcional
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-neutral-900 text-sm">{upd.title}</h4>

                  <div className="mt-3 bg-neutral-50 rounded-2xl p-3 border border-neutral-100 text-xs text-neutral-700 space-y-1.5">
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
                      Novedades del paquete:
                    </div>
                    {upd.releaseNotes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-[11px] text-neutral-400 space-y-0.5 font-mono">
                    <div className="truncate">Paquete: {upd.packageUrl}</div>
                    <div className="truncate text-[10px]">Hash SHA-256: {upd.packageHash}</div>
                    <div className="text-[10px] text-neutral-500 font-sans mt-1">
                      Publicado por: <span className="font-bold text-neutral-700">{upd.publishedBy}</span> el{' '}
                      {new Date(upd.publishedAt).toLocaleDateString('es-DO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(upd.id, upd.status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      upd.status === 'PUBLISHED'
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {upd.status === 'PUBLISHED' ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-amber-600" />
                        <span>Desactivar</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-emerald-600" />
                        <span>Publicar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteUpdate(upd.id, upd.version)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                    title="Eliminar versión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HISTORIAL CENTRALIZADO (User requirement 4) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-black text-neutral-900 text-sm uppercase">
                Historial de Actualizaciones del Sistema
              </h3>
              <p className="text-xs text-neutral-500">
                Auditoría completa de despliegues, versiones publicadas, terminales impactadas y autores.
              </p>
            </div>
            <div className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-mono font-bold text-neutral-700">
              {updates.length} Registros
            </div>
          </div>

          <div className="space-y-4">
            {updates.map((upd) => {
              const updatedCount = terminalsStatus.filter((t) => t.installedVersion === upd.version).length;
              const pendingCount = totalTerminals - updatedCount;

              return (
                <div
                  key={upd.id}
                  className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm bg-neutral-900 text-white px-2.5 py-0.5 rounded-lg">
                        {upd.version}
                      </span>
                      <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">{upd.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          upd.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {upd.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 flex items-center gap-3">
                      <span>
                        Autor: <strong className="text-neutral-800">{upd.publishedBy}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(upd.publishedAt).toLocaleDateString('es-DO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Terminal deployment progress */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-neutral-200 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">Terminales con esta versión:</span>
                      <div className="font-mono font-bold text-emerald-700 text-base">{updatedCount}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">Terminales pendientes:</span>
                      <div className="font-mono font-bold text-amber-700 text-base">{pendingCount}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">Tipo de Actualización:</span>
                      <div className="font-bold text-neutral-800">
                        {upd.isMandatory ? '🔒 Obligatoria (Requiere reinicio)' : '🟢 Opcional / Recomendada'}
                      </div>
                    </div>
                  </div>

                  {/* Changes */}
                  <div className="text-xs text-neutral-600">
                    <span className="font-bold text-neutral-700 text-[11px] uppercase">Cambios Realizados:</span>
                    <ul className="mt-1 space-y-1 pl-4 list-disc text-[11px]">
                      {upd.releaseNotes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SEGURIDAD Y RESPALDOS (User requirement 5) */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-md border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase">Garantía de Integridad y Respaldo</h4>
                <p className="text-xs text-emerald-200 max-w-xl">
                  Antes de publicar o aplicar cualquier actualización importante, el servidor genera automáticamente un snapshot completo.
                  <strong> Los datos de ventas, tickets, clientes, resultados, usuarios, consorcios, terminales, grupos y configuraciones permanecen siempre intactos.</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Descripción del respaldo manual..."
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                className="text-xs bg-emerald-950/60 text-white placeholder-emerald-400/60 px-3 py-2 rounded-xl border border-emerald-700 w-full md:w-64 focus:outline-none"
              />
              <button
                onClick={handleCreateManualBackup}
                disabled={creatingBackup}
                className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black uppercase whitespace-nowrap shadow-sm transition-all"
              >
                {creatingBackup ? <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> : <HardDrive className="w-4 h-4 inline mr-1" />}
                Crear Respaldo
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-black text-neutral-900 text-sm uppercase">
                  Puntos de Restauración y Respaldos del Servidor ({backups.length})
                </h3>
                <p className="text-xs text-neutral-500">
                  Historial de snapshots de seguridad generados automáticamente antes de cada versión.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Archivo / Versión</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Registros Respaldados</th>
                    <th className="py-3 px-4">Tamaño</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Autor</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {backups.map((bck) => (
                    <tr key={bck.id} className="hover:bg-neutral-50/70">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-neutral-900 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          {bck.filename}
                        </div>
                        <span className="text-[10px] font-mono bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded">
                          {bck.version}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 font-medium">
                        {bck.description}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-neutral-600">
                        <span>{bck.recordsCount.tickets} tickets</span> •{' '}
                        <span>{bck.recordsCount.terminals} term.</span> •{' '}
                        <span>{bck.recordsCount.groups} grupos</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                        {(bck.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-4 text-neutral-600 text-[11px]">
                        {new Date(bck.createdAt).toLocaleString('es-DO')}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 font-bold text-[11px]">
                        {bck.createdBy}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRestoreBackup(bck.id, bck.filename)}
                          disabled={restoringBackupId === bck.id}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold uppercase transition-all shadow-2xs flex items-center gap-1 ml-auto"
                          title="Restaurar base de datos a este punto"
                        >
                          <RotateCcw className={`w-3 h-3 ${restoringBackupId === bck.id ? 'animate-spin' : ''}`} />
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VISTA PREVIA DE NOTIFICACIÓN DE TERMINAL */}
      {activeTab === 'preview' && (
        <div className="bg-neutral-100 p-6 rounded-3xl border border-neutral-300 space-y-4">
          <div className="text-center max-w-lg mx-auto">
            <h3 className="font-black text-neutral-900 text-base uppercase">
              Simulador de Pantalla de Actualización en Terminal
            </h3>
            <p className="text-xs text-neutral-600 mt-1">
              Así es como las terminales ven la notificación de actualización cuando abren el sistema o cuando detectan una nueva versión en tiempo real:
            </p>
          </div>

          {/* Realistic Terminal Preview Card */}
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-900 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-black">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    BancaPro Update Service
                  </div>
                  <h4 className="font-black text-base text-white uppercase">
                    🚀 NUEVA ACTUALIZACIÓN DISPONIBLE
                  </h4>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 bg-neutral-800/90 rounded-xl p-2 border border-neutral-700 text-xs">
                <div className="flex-1 text-center">
                  <div className="text-[9px] text-neutral-400 uppercase font-bold">Versión Instalada</div>
                  <div className="font-mono font-bold text-neutral-200">v1.0.0</div>
                </div>
                <div className="text-emerald-400 font-bold">→</div>
                <div className="flex-1 text-center">
                  <div className="text-[9px] text-emerald-400 uppercase font-bold">Nueva Versión</div>
                  <div className="font-mono font-bold text-emerald-300">
                    {activeRelease?.version || 'v1.1.0'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h5 className="font-black text-xs uppercase text-neutral-900">
                {activeRelease?.title || 'Actualización de Sistema'}
              </h5>

              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-xs text-neutral-700 space-y-1">
                <div className="text-[10px] font-bold text-neutral-500 uppercase">Novedades:</div>
                {(activeRelease?.releaseNotes || [
                  'Nueva función de reportes.',
                  'Mejoras en impresión de tickets.',
                  'Corrección de errores.',
                  'Mejoras de seguridad.',
                ]).map((note, i) => (
                  <div key={i} className="flex items-start gap-1 text-[11px]">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs uppercase text-center"
                >
                  [ACTUALIZAR MÁS TARDE]
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase text-center shadow-md shadow-emerald-600/20"
                >
                  [ACTUALIZAR AHORA]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW RELEASE MODAL (User requirement 1) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 text-base uppercase">
                    Crear y Publicar Nueva Versión
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Súper Admin: Configuración centralizada de actualización para todas las terminales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Número de Versión *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="v1.2.0 (o v2.0.0)"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Ejemplos: v1.0.0, v1.1.0, v1.2.0, v2.0.0
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Tipo de Instalación
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-bold">Actualización Obligatoria</span>
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    {isMandatory
                      ? '⚠️ Bloquea el uso de la terminal hasta actualizar'
                      : '🟢 Permite al cajero actualizar de inmediato o posponer'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                  Título Descriptivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Actualización de Rendimiento y Nuevos Reportes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Release Notes Editor */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                  Escribir Novedades de la Actualización *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Escriba un cambio o mejora y presione Agregar..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-neutral-800"
                  >
                    Agregar
                  </button>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 space-y-2 max-h-40 overflow-y-auto">
                  {notesList.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 text-xs"
                    >
                      <span className="text-neutral-800">• {note}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(idx)}
                        className="text-neutral-400 hover:text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package upload / bundle */}
              <div className="border border-neutral-200 rounded-2xl p-3.5 bg-neutral-50/70 space-y-2">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                  Subir Archivo o Paquete de Actualización (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Seleccionar Archivo</span>
                    <input
                      type="file"
                      accept=".bundle,.zip,.tar,.pkg,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs font-mono text-neutral-600 truncate">
                    {uploadedFileName || packageName}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  El servidor generará automáticamente la firma digital SHA-256 para validación de autenticidad en cada terminal.
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span>Publicar inmediatamente a toda la red</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRelease}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                  >
                    {submittingRelease ? (
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                    ) : (
                      <Rocket className="w-4 h-4 inline mr-1" />
                    )}
                    Publicar Versión
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
