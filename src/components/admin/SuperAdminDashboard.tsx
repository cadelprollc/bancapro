import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Consorcio,
  ConsorcioPermissions,
  VisualCustomization,
  DeviceRegistration,
  Invoice,
  User,
  AuditLog
} from '../../types/index';
import {
  Building2,
  Shield,
  Plus,
  Edit2,
  DollarSign,
  Monitor,
  CheckCircle2,
  XCircle,
  FileText,
  Sliders,
  Palette,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Check,
  Lock,
  Layers,
  Activity,
  Trash2,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { InvoicesView } from './InvoicesView';
import { SystemUpdatesManagement } from './SystemUpdatesManagement';

interface SuperAdminDashboardProps {
  user: User;
  onSelectConsorcioContext?: (consorcioId: string | null) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onSelectConsorcioContext }) => {
  const [activeSubTab, setActiveSubTab] = useState<'consorcios' | 'facturacion' | 'personalizacion' | 'dispositivos' | 'auditoria' | 'actualizaciones'>('consorcios');
  const [metrics, setMetrics] = useState<any>(null);
  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Create / Edit Consorcio Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConsorcio, setEditingConsorcio] = useState<Consorcio | null>(null);

  // Consortium Inspection Modal (Requirement 22)
  const [inspectingConsorcio, setInspectingConsorcio] = useState<Consorcio | null>(null);
  const [inspectingTerminals, setInspectingTerminals] = useState<any[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Form states for Consorcio
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [password, setPassword] = useState('');
  const [costPerTerminal, setCostPerTerminal] = useState('500');
  const [authorizedTerminalsCount, setAuthorizedTerminalsCount] = useState('5');
  const [permissions, setPermissions] = useState<ConsorcioPermissions>({
    monitoring: true,
    monitoringFunctions: true,
    terminals: true,
    lotteries: true,
    results: true,
    topes: true,
    prizes: true,
    reports: true,
    createTerminals: false, // Default false!
    editTerminals: true,
    disableTerminals: true,
    invoices: true,
    visualCustomization: true,
  });
  const [primaryColor, setPrimaryColor] = useState('#16a34a');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Customization Tab States
  const [globalCustom, setGlobalCustom] = useState<VisualCustomization>({
    commercialName: 'BancaPro - Red Nacional',
    primaryColor: '#16a34a',
    secondaryColor: '#0f172a',
    bgColor: '#f8fafc',
    ticketHeader: 'BANCA DE LOTERÍA LA FAVORITA',
    ticketFooter: 'Los tickets tienen vigencia de 30 días calendario.',
  });
  const [selectedConsorcioForCustom, setSelectedConsorcioForCustom] = useState<string>('');
  const [savingCustom, setSavingCustom] = useState(false);
  const [customSavedNotice, setCustomSavedNotice] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, cList, dList, gCust] = await Promise.all([
        api.getSuperAdminMetrics().catch(() => null),
        api.getConsorcios().catch(() => []),
        api.getDevices().catch(() => []),
        api.getCustomization().catch(() => null),
      ]);
      setMetrics(m);
      setConsorcios(cList);
      setDevices(dList);
      if (gCust) setGlobalCustom(gCust);
      if (cList.length > 0 && !selectedConsorcioForCustom) {
        setSelectedConsorcioForCustom(cList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateConsorcio = () => {
    setEditingConsorcio(null);
    setName('');
    setCode(String(Math.floor(1000 + Math.random() * 9000)));
    setAdminName('');
    setAdminUsername('');
    setPassword('salomon123');
    setCostPerTerminal('500');
    setAuthorizedTerminalsCount('5');
    setPermissions({
      monitoring: true,
      monitoringFunctions: true,
      terminals: true,
      lotteries: true,
      results: true,
      topes: true,
      prizes: true,
      reports: true,
      createTerminals: false, // DEFAULT FALSE!
      editTerminals: true,
      disableTerminals: true,
      invoices: true,
      visualCustomization: true,
    });
    setPrimaryColor('#16a34a');
    setSecondaryColor('#0f172a');
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEditConsorcio = (c: Consorcio) => {
    setEditingConsorcio(c);
    setName(c.name);
    setCode(c.code);
    setAdminName(c.adminName);
    setAdminUsername(c.adminUsername);
    setPassword('');
    setCostPerTerminal(String(c.costPerTerminal));
    setAuthorizedTerminalsCount(String(c.authorizedTerminalsCount));
    setPermissions(c.permissions);
    setPrimaryColor(c.customization?.primaryColor || '#16a34a');
    setSecondaryColor(c.customization?.secondaryColor || '#0f172a');
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleSaveConsorcio = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingConsorcio) {
        await api.updateConsorcio(editingConsorcio.id, {
          name,
          costPerTerminal: Number(costPerTerminal),
          authorizedTerminalsCount: Number(authorizedTerminalsCount),
          permissions,
          customization: {
            ...editingConsorcio.customization,
            commercialName: name,
            primaryColor,
            secondaryColor,
          },
        });
      } else {
        if (!name || !code || !adminName || !adminUsername || !password) {
          setFormError('Por favor complete todos los campos obligatorios.');
          return;
        }
        await api.createConsorcio({
          name,
          code,
          adminName,
          adminUsername,
          passwordPlain: password,
          costPerTerminal: Number(costPerTerminal),
          authorizedTerminalsCount: Number(authorizedTerminalsCount),
          permissions,
          customization: {
            commercialName: name,
            primaryColor,
            secondaryColor,
          },
        });
      }

      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error guardando consorcio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('¿Desea cambiar el estado activo/suspendido de este consorcio?')) return;
    try {
      await api.toggleConsorcioStatus(id);
      await loadData();
    } catch (err: any) {
      alert('Error cambiando estado: ' + err.message);
    }
  };

  const handleInspectConsorcio = async (c: Consorcio) => {
    setInspectingConsorcio(c);
    setLoadingInspect(true);
    try {
      const terms = await api.getTerminals(c.id);
      setInspectingTerminals(terms);
    } catch (err: any) {
      alert('Error cargando terminales del consorcio: ' + err.message);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleGenerateInvoiceFromInspect = async () => {
    if (!inspectingConsorcio) return;
    const now = new Date();
    const monthName = `${now.toLocaleDateString('es-DO', { month: 'long' })} ${now.getFullYear()}`;
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    try {
      await api.generateMonthlyInvoice(inspectingConsorcio.id, capitalizedMonth);
      alert(`Factura para ${inspectingConsorcio.name} generada exitosamente para el período ${capitalizedMonth}.`);
      await loadData();
    } catch (err: any) {
      alert('Error generando factura: ' + err.message);
    }
  };

  const handleUnbindDevice = async (termId?: string) => {
    if (!termId) return;
    if (!confirm('¿Confirma que desea desvincular este dispositivo de la terminal?')) return;
    try {
      await api.unbindDevice(termId);
      await loadData();
    } catch (err: any) {
      alert('Error desvinculando dispositivo: ' + err.message);
    }
  };

  const handleSaveGlobalCustom = async () => {
    setSavingCustom(true);
    try {
      await api.updateGlobalCustomization(globalCustom);
      setCustomSavedNotice(true);
      setTimeout(() => setCustomSavedNotice(false), 3000);
    } catch (err: any) {
      alert('Error guardando personalización global: ' + err.message);
    } finally {
      setSavingCustom(false);
    }
  };

  const handleSaveConsorcioCustom = async () => {
    if (!selectedConsorcioForCustom) return;
    setSavingCustom(true);
    const targetCons = consorcios.find((c) => c.id === selectedConsorcioForCustom);
    if (!targetCons) return;

    try {
      await api.updateConsorcioCustomization(selectedConsorcioForCustom, targetCons.customization);
      setCustomSavedNotice(true);
      setTimeout(() => setCustomSavedNotice(false), 3000);
      await loadData();
    } catch (err: any) {
      alert('Error guardando personalización del consorcio: ' + err.message);
    } finally {
      setSavingCustom(false);
    }
  };

  const filteredConsorcios = consorcios.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.includes(searchTerm) ||
      c.adminUsername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Super Admin Banner */}
      <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-2xl shadow-md">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight uppercase">
                PANEL DEL SÚPER ADMIN
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 uppercase">
                Control General Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Administración de consorcios, facturación automatizada por terminal, permisos independientes y control de dispositivos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateConsorcio}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Consorcio</span>
          </button>
        </div>
      </div>

      {/* Super Admin Metrics Grid (Requirement 22) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Consorcios</span>
            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {metrics?.totalConsorcios || consorcios.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
            {metrics?.activeConsorcios ?? consorcios.filter((c) => c.status === 'ACTIVE').length} activos
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Terminales</span>
            <Monitor className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {metrics?.totalTerminals || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
            {metrics?.activeTerminals || 0} facturables
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center justify-between">
            <span>Facturación Mes</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-700 mt-1 font-mono">
            RD${(metrics?.monthlyBilling || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Cobro por terminal</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center justify-between">
            <span>Pendiente Cobro</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 mt-1 font-mono">
            RD${(metrics?.pendingInvoicesAmount || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-700 font-bold mt-0.5">
            {metrics?.pendingInvoicesCount || 0} facturas pendientes
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Ventas Globales</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-neutral-900 mt-1 font-mono">
            RD${(metrics?.globalSalesAmount || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Toda la red nacional</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>Dispositivos</span>
            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {devices.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
            {devices.filter((d) => d.status === 'AUTHORIZED').length} autorizados
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('consorcios')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'consorcios'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Consorcios ({consorcios.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('facturacion')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'facturacion'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Facturación Global</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dispositivos')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'dispositivos'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>3. Dispositivos & Candados ({devices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('personalizacion')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'personalizacion'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>4. Personalización Visual</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auditoria')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'auditoria'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>5. Auditoría</span>
        </button>

        <button
          onClick={() => setActiveSubTab('actualizaciones')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'actualizaciones'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>🔄 ACTUALIZACIONES</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: CONSORCIOS MANAGEMENT
          ======================================================== */}
      {activeSubTab === 'consorcios' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código o admin..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>

            <div className="text-xs text-neutral-500 font-bold">
              Mostrando {filteredConsorcios.length} de {consorcios.length} consorcios
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConsorcios.map((c) => {
              const activeCount = c.authorizedTerminalsCount;
              const monthlyCost = activeCount * c.costPerTerminal;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                          CÓDIGO ÚNICO: #{c.code}
                        </span>
                        <h3 className="text-base font-black text-neutral-900 mt-1 uppercase leading-tight">
                          {c.name}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? '🟢 Activo' : '🔴 Suspendido'}
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-2xl space-y-1.5 text-xs text-neutral-600 border border-neutral-100">
                      <div className="flex justify-between">
                        <span>Admin Principal:</span>
                        <strong className="text-neutral-900 font-mono">@{c.adminUsername}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Costo por Terminal:</span>
                        <strong className="text-neutral-900 font-mono">RD${c.costPerTerminal}/mes</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Terminales Autorizadas:</span>
                        <strong className="text-neutral-900 font-mono">{c.authorizedTerminalsCount} terminales</strong>
                      </div>
                      <div className="flex justify-between border-t border-neutral-200/60 pt-1.5 text-neutral-900 font-bold">
                        <span>Total Facturación Mes:</span>
                        <span className="font-mono text-emerald-700 font-black">
                          RD${monthlyCost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Permissions Badges Checklist */}
                    <div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Permisos Concedidos:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            c.permissions.createTerminals
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-400 line-through'
                          }`}
                        >
                          Crear Terminales ({c.permissions.createTerminals ? 'SI' : 'NO'})
                        </span>
                        {c.permissions.invoices && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            Facturas
                          </span>
                        )}
                        {c.permissions.topes && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                            Topes
                          </span>
                        )}
                        {c.permissions.results && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                            Resultados
                          </span>
                        )}
                        {c.permissions.monitoring && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                            Monitoreo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-neutral-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleInspectConsorcio(c)}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Terminales & Facturación ({c.code})</span>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditConsorcio(c)}
                        className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Editar & Permisos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          c.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: FACTURACIÓN GLOBAL
          ======================================================== */}
      {activeSubTab === 'facturacion' && (
        <InvoicesView user={user} />
      )}

      {/* ========================================================
          SUB-TAB 3: DISPOSITIVOS & CANDADOS (HARDWARE LOCK)
          ======================================================== */}
      {activeSubTab === 'dispositivos' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-4 border-neutral-100">
            <div>
              <h3 className="text-base font-black text-neutral-900 uppercase">
                Control de Dispositivos Registrados (Hardware Locks)
              </h3>
              <p className="text-xs text-neutral-500">
                Cada terminal instalada genera un ID único vinculado a su consorcio. Un dispositivo no puede usarse en otra terminal si no está asignado.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-neutral-100 text-neutral-800">
              {devices.length} dispositivos en el sistema
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-black tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID Dispositivo</th>
                  <th className="py-3 px-4">Consorcio</th>
                  <th className="py-3 px-4">Terminal Asociada</th>
                  <th className="py-3 px-4">Nombre / Modelo</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4">Última Actividad</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-neutral-400">
                      No hay dispositivos registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  devices.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-mono font-black text-neutral-900">
                        📱 {d.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-800">
                        Cód: {d.consorcioCode}
                      </td>
                      <td className="py-3 px-4">
                        {d.terminalCode ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold">
                            Terminal {d.terminalCode}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Pendiente de asignación</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {d.deviceName || 'Terminal Web / Móvil'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            d.status === 'AUTHORIZED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.status === 'AUTHORIZED' ? 'Autorizado' : d.status === 'PENDING' ? 'Pendiente' : 'Revocado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400 text-[11px]">
                        {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('es-DO') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {d.terminalId ? (
                          <button
                            type="button"
                            onClick={() => handleUnbindDevice(d.terminalId)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition-colors"
                            title="Desvincular y liberar dispositivo"
                          >
                            Desvincular
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Libre</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: PERSONALIZACIÓN VISUAL (PRIORIDAD GLOBAL & CONSORCIO)
          ======================================================== */}
      {activeSubTab === 'personalizacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Card 1: Personalización Global */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 uppercase">
                  Prioridad 1: Configuración Global
                </span>
                <h3 className="text-sm font-black text-neutral-900 uppercase mt-1">
                  Apariencia Predeterminada de la Plataforma
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Nombre Comercial Predeterminado
                </label>
                <input
                  type="text"
                  value={globalCustom.commercialName || ''}
                  onChange={(e) => setGlobalCustom((p) => ({ ...p, commercialName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    Color Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={globalCustom.primaryColor || '#16a34a'}
                      onChange={(e) => setGlobalCustom((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="w-9 h-9 p-0.5 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={globalCustom.primaryColor || '#16a34a'}
                      onChange={(e) => setGlobalCustom((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 border rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">
                    Color Secundario / Barra
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={globalCustom.secondaryColor || '#0f172a'}
                      onChange={(e) => setGlobalCustom((p) => ({ ...p, secondaryColor: e.target.value }))}
                      className="w-9 h-9 p-0.5 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={globalCustom.secondaryColor || '#0f172a'}
                      onChange={(e) => setGlobalCustom((p) => ({ ...p, secondaryColor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 border rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Encabezado de Ticket Predeterminado
                </label>
                <input
                  type="text"
                  value={globalCustom.ticketHeader || ''}
                  onChange={(e) => setGlobalCustom((p) => ({ ...p, ticketHeader: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Pie de Ticket Predeterminado
                </label>
                <input
                  type="text"
                  value={globalCustom.ticketFooter || ''}
                  onChange={(e) => setGlobalCustom((p) => ({ ...p, ticketFooter: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveGlobalCustom}
                disabled={savingCustom}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-wider shadow-xs transition-colors"
              >
                {savingCustom ? 'Guardando...' : 'Guardar Configuración Global'}
              </button>
            </div>
          </div>

          {/* Card 2: Personalización por Consorcio */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 uppercase">
                  Prioridad 2: Consorcio Específico (Sobrescribe Global)
                </span>
                <h3 className="text-sm font-black text-neutral-900 uppercase mt-1">
                  Personalización Individual de Consorcio
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">
                  Seleccionar Consorcio
                </label>
                <select
                  value={selectedConsorcioForCustom}
                  onChange={(e) => setSelectedConsorcioForCustom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-neutral-50"
                >
                  {consorcios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Código {c.code})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const targetCons = consorcios.find((c) => c.id === selectedConsorcioForCustom);
                if (!targetCons) return null;

                return (
                  <>
                    <div>
                      <label className="block font-bold text-neutral-700 uppercase mb-1">
                        Nombre Comercial del Consorcio
                      </label>
                      <input
                        type="text"
                        value={targetCons.customization?.commercialName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConsorcios((prev) =>
                            prev.map((c) =>
                              c.id === targetCons.id
                                ? { ...c, customization: { ...c.customization, commercialName: val } }
                                : c
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-neutral-700 uppercase mb-1">
                          Color Primario
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={targetCons.customization?.primaryColor || '#16a34a'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConsorcios((prev) =>
                                prev.map((c) =>
                                  c.id === targetCons.id
                                    ? { ...c, customization: { ...c.customization, primaryColor: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-9 h-9 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <span className="font-mono text-neutral-600 font-bold">
                            {targetCons.customization?.primaryColor || '#16a34a'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 uppercase mb-1">
                          Color Secundario
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={targetCons.customization?.secondaryColor || '#0f172a'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConsorcios((prev) =>
                                prev.map((c) =>
                                  c.id === targetCons.id
                                    ? { ...c, customization: { ...c.customization, secondaryColor: val } }
                                    : c
                                )
                              );
                            }}
                            className="w-9 h-9 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <span className="font-mono text-neutral-600 font-bold">
                            {targetCons.customization?.secondaryColor || '#0f172a'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveConsorcioCustom}
                      disabled={savingCustom}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-xs transition-colors"
                    >
                      {savingCustom ? 'Guardando...' : `Guardar Cambios para ${targetCons.name}`}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: AUDITORÍA & HISTORIAL DE SEGURIDAD
          ======================================================== */}
      {activeSubTab === 'auditoria' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-100">
            <div>
              <h3 className="text-base font-black text-neutral-900 uppercase">
                Historial de Seguridad y Vinculaciones
              </h3>
              <p className="text-xs text-neutral-500">
                Registro inmutable de asignaciones y desvinculaciones de terminales y dispositivos.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {(metrics?.recentActivities || []).map((log: AuditLog) => (
              <div
                key={log.id}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 font-mono text-[10px]">
                      {log.action}
                    </span>
                    <span>{log.details}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Ejecutado por: <strong>{log.userName}</strong>
                  </div>
                </div>
                <div className="font-mono text-neutral-400 text-[10px]">
                  {new Date(log.timestamp).toLocaleString('es-DO')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 6: ACTUALIZACIONES CENTRALIZADAS (REQ 1 - 6)
          ======================================================== */}
      {activeSubTab === 'actualizaciones' && (
        <SystemUpdatesManagement user={user} />
      )}

      {/* ========================================================
          MODAL: CREAR / EDITAR CONSORCIO
          ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-neutral-200 overflow-hidden animate-in fade-in">
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black uppercase tracking-tight">
                  {editingConsorcio ? 'Editar Consorcio & Permisos' : 'Crear Nuevo Consorcio'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsorcio} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Nombre del Consorcio *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Consorcio de Bancas Salomón"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Código Único del Consorcio *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingConsorcio}
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    placeholder="Ej: 1230"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Código irrepetible que identifica la instalación del consorcio.
                  </span>
                </div>
              </div>

              {!editingConsorcio && (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                  <div className="text-xs font-black uppercase text-neutral-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Administrador Principal del Consorcio</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Nombre Admin
                      </label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Ej: Admin Salomón"
                        className="w-full px-3 py-2 text-xs rounded-xl border"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Usuario Admin
                      </label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Ej: salomon"
                        className="w-full px-3 py-2 text-xs rounded-xl border font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Contraseña Inicial
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs rounded-xl border font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Terminals Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Costo Mensual por Terminal (RD$) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={costPerTerminal}
                    onChange={(e) => setCostPerTerminal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Monto base por terminal activa facturado mensualmente.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Terminales Autorizadas Inicialmente *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={authorizedTerminalsCount}
                    onChange={(e) => setAuthorizedTerminalsCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Se generarán automáticamente (0001, 0002, etc.).
                  </span>
                </div>
              </div>

              {/* SYSTEM OF PERMISSIONS (Requirements 4 & 5) */}
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-900 tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Permisos Concedidos al Administrador:</span>
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    * Crear Terminales desactivado por defecto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    { key: 'monitoring', label: 'Monitoreo de jugadas' },
                    { key: 'monitoringFunctions', label: 'Funciones de monitoreo' },
                    { key: 'terminals', label: 'Terminales' },
                    { key: 'lotteries', label: 'Configuración de loterías' },
                    { key: 'results', label: 'Publicar resultados' },
                    { key: 'topes', label: 'Topes de ventas' },
                    { key: 'prizes', label: 'Premios' },
                    { key: 'reports', label: 'Reportes consolidados' },
                    { key: 'createTerminals', label: '⭐ CREAR TERMINALES (Control de cobro)', highlight: true },
                    { key: 'editTerminals', label: 'Editar terminales' },
                    { key: 'disableTerminals', label: 'Desactivar terminales' },
                    { key: 'invoices', label: 'Facturas' },
                    { key: 'visualCustomization', label: 'Configuración visual' },
                  ].map((p) => {
                    const isChecked = !!(permissions as any)[p.key];

                    return (
                      <label
                        key={p.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                          p.highlight
                            ? isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-rose-50/60 border-rose-200 text-rose-900 font-bold'
                            : isChecked
                            ? 'bg-white border-neutral-300 text-neutral-900'
                            : 'bg-neutral-100/60 border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              [p.key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px]">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider shadow-md"
                >
                  {submitting ? 'Guardando...' : editingConsorcio ? 'Guardar Cambios' : 'Crear Consorcio & Terminales'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL: INSPECCIONAR CONSORCIO AISLADO (Requirement 22)
          ======================================================== */}
      {inspectingConsorcio && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-neutral-200 overflow-hidden animate-in fade-in">
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {inspectingConsorcio.name}
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono">
                    Código Único Consorcio: #{inspectingConsorcio.code} · Admin: @{inspectingConsorcio.adminUsername}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingConsorcio(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Billing Summary Bar for this Consortium */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Costo Mensual Unitario
                  </span>
                  <div className="text-xl font-black font-mono text-neutral-900 mt-1">
                    RD${inspectingConsorcio.costPerTerminal.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-neutral-400">Por terminal autorizada</span>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Terminales Facturables
                  </span>
                  <div className="text-xl font-black font-mono text-neutral-900 mt-1">
                    {inspectingTerminals.filter((t) => t.active).length} / {inspectingTerminals.length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">Activas en sistema</span>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Total Facturación Mensual
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-800 mt-1">
                    RD${(
                      inspectingTerminals.filter((t) => t.active).length * inspectingConsorcio.costPerTerminal
                    ).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    {inspectingTerminals.filter((t) => t.active).length} × RD${inspectingConsorcio.costPerTerminal}
                  </span>
                </div>
              </div>

              {/* Terminals Table isolated for this consortium */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-neutral-600" />
                    <span>Terminales Exclusivas del Consorcio ({inspectingTerminals.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleGenerateInvoiceFromInspect}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generar Factura Mensual Ahora</span>
                  </button>
                </div>

                {loadingInspect ? (
                  <div className="p-6 text-center text-xs text-neutral-500 font-bold">
                    Cargando terminales del consorcio...
                  </div>
                ) : inspectingTerminals.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-neutral-200">
                    No hay terminales creadas para este consorcio aún.
                  </div>
                ) : (
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-black text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Nombre</th>
                          <th className="py-2.5 px-3">Usuario</th>
                          <th className="py-2.5 px-3">Dispositivo Autorizado</th>
                          <th className="py-2.5 px-3 text-right">Costo / Mes</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                        {inspectingTerminals.map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-50/70">
                            <td className="py-2.5 px-3 font-mono font-black text-neutral-900">
                              #{t.code}
                            </td>
                            <td className="py-2.5 px-3 font-bold">{t.name}</td>
                            <td className="py-2.5 px-3 font-mono text-neutral-600">{t.username}</td>
                            <td className="py-2.5 px-3">
                              {t.deviceId ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                                  <Smartphone className="w-3 h-3 text-emerald-600" />
                                  <span>{t.deviceId}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                                  Sin Dispositivo
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                              RD${inspectingConsorcio.costPerTerminal}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  t.active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {t.active ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-3 border-t border-neutral-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingConsorcio(null)}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
