import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, AdminGranularPermissions, DEFAULT_ADMIN_PERMISSIONS, Consorcio } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  KeyRound,
  FileText,
  DollarSign,
  TrendingUp,
  Store,
  Layers,
  Award,
  CircleDot,
  Settings,
  Lock,
  Search,
  Check,
  X,
  History,
} from 'lucide-react';
import { Card, Button, Badge } from '../design-system';

interface AdminPermissionsViewProps {
  currentUser: User;
  onNavigateTab?: (tab: string) => void;
}

export const AdminPermissionsView: React.FC<AdminPermissionsViewProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [permissions, setPermissions] = useState<AdminGranularPermissions>({ ...DEFAULT_ADMIN_PERMISSIONS });
  const [initialPermissions, setInitialPermissions] = useState<AdminGranularPermissions>({ ...DEFAULT_ADMIN_PERMISSIONS });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'permisos' | 'auditoria'>('permisos');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminUsers, logs] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminAuditLogs(),
      ]);
      setAdmins(adminUsers);
      setAuditLogs(logs);

      if (adminUsers.length > 0) {
        // Default to first non-superadmin admin or first admin
        const target = adminUsers.find((u) => u.role === 'ADMIN') || adminUsers[0];
        setSelectedAdminId(target.id);
        const userPerms: AdminGranularPermissions = {
          ...DEFAULT_ADMIN_PERMISSIONS,
          ...(target.adminPermissions || {}),
        };
        setPermissions(userPerms);
        setInitialPermissions(userPerms);
      }
    } catch (err: any) {
      console.error('Error cargando administradores:', err);
      setFeedback({ success: false, message: 'Error cargando datos de administradores.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAdmin = (adminId: string) => {
    setSelectedAdminId(adminId);
    setFeedback(null);
    const target = admins.find((u) => u.id === adminId);
    if (target) {
      const userPerms: AdminGranularPermissions = {
        ...DEFAULT_ADMIN_PERMISSIONS,
        ...(target.adminPermissions || {}),
      };
      setPermissions(userPerms);
      setInitialPermissions(userPerms);
    }
  };

  const handleToggle = (key: keyof AdminGranularPermissions) => {
    if (!isSuperAdmin) return;
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Presets
  const applyPreset = (preset: 'total' | 'ventas_reportes' | 'caja' | 'auditor' | 'limpiar') => {
    if (!isSuperAdmin) return;
    let next: AdminGranularPermissions;

    switch (preset) {
      case 'total':
        next = {
          dashboard: true,
          ventas: true,
          tickets: true,
          sorteos: true,
          resultados: true,
          ganadores: true,
          pagoPremios: true,
          bancas: true,
          terminales: true,
          usuarios: true,
          supervisores: true,
          colectores: true,
          grupos: true,
          topes: true,
          reportes: true,
          cuadres: true,
          comisiones: true,
          anulaciones: true,
          devoluciones: true,
          loterias: true,
          configuracionConsorcio: true,
          configuracionPremios: true,
          configuracionSistema: false,
        };
        break;
      case 'ventas_reportes':
        next = {
          ...DEFAULT_ADMIN_PERMISSIONS,
          dashboard: true,
          ventas: true,
          tickets: true,
          reportes: true,
          cuadres: true,
          ganadores: true,
          pagoPremios: false,
          resultados: false,
          usuarios: false,
          terminales: false,
          topes: false,
          configuracionConsorcio: false,
          configuracionPremios: false,
          configuracionSistema: false,
        };
        break;
      case 'caja':
        next = {
          ...DEFAULT_ADMIN_PERMISSIONS,
          dashboard: true,
          ventas: true,
          tickets: true,
          ganadores: true,
          pagoPremios: true,
          cuadres: true,
          anulaciones: true,
          devoluciones: false,
          reportes: false,
          resultados: false,
          terminales: false,
          usuarios: false,
          topes: false,
          configuracionConsorcio: false,
          configuracionPremios: false,
          configuracionSistema: false,
        };
        break;
      case 'auditor':
        next = {
          ...DEFAULT_ADMIN_PERMISSIONS,
          dashboard: true,
          ventas: false,
          tickets: true,
          sorteos: true,
          resultados: false,
          ganadores: true,
          pagoPremios: false,
          bancas: true,
          terminales: true,
          usuarios: false,
          supervisores: false,
          colectores: false,
          grupos: true,
          topes: false,
          reportes: true,
          cuadres: true,
          comisiones: true,
          anulaciones: false,
          devoluciones: false,
          loterias: false,
          configuracionConsorcio: false,
          configuracionPremios: false,
          configuracionSistema: false,
        };
        break;
      case 'limpiar':
        next = Object.keys(DEFAULT_ADMIN_PERMISSIONS).reduce((acc, k) => {
          acc[k as keyof AdminGranularPermissions] = false;
          return acc;
        }, {} as AdminGranularPermissions);
        break;
    }

    setPermissions(next);
  };

  const handleSave = async () => {
    if (!selectedAdminId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.updateAdminPermissions(selectedAdminId, permissions);
      setFeedback({ success: true, message: res.message });
      setInitialPermissions({ ...permissions });
      // Update local state list
      setAdmins((prev) =>
        prev.map((a) => (a.id === selectedAdminId ? { ...a, adminPermissions: permissions } : a))
      );
      // Reload audit logs
      const updatedLogs = await api.getAdminAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error guardando permisos.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedAdmin = admins.find((u) => u.id === selectedAdminId);
  const hasChanges = JSON.stringify(permissions) !== JSON.stringify(initialPermissions);

  // Group definitions for the 23 permissions
  const categories: {
    name: string;
    description: string;
    icon: any;
    color: string;
    items: { key: keyof AdminGranularPermissions; label: string; desc: string }[];
  }[] = [
    {
      name: 'Operaciones & Ventas',
      description: 'Acceso a la terminal de ventas, emisión y control de tickets',
      icon: DollarSign,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      items: [
        { key: 'dashboard', label: 'Dashboard Principal', desc: 'Visualización de métricas en tiempo real de la empresa' },
        { key: 'ventas', label: 'Terminal de Ventas (POS)', desc: 'Emisión de jugadas, quinielas, palés y tripletas' },
        { key: 'tickets', label: 'Consulta de Tickets', desc: 'Búsqueda, verificación por código y reimpresión' },
        { key: 'anulaciones', label: 'Anulación de Tickets', desc: 'Permiso para anular tickets emitidos antes de sorteos' },
        { key: 'devoluciones', label: 'Devoluciones y Reembolsos', desc: 'Gestión de devoluciones autorizadas' },
      ],
    },
    {
      name: 'Sorteos & Resultados',
      description: 'Control de loterías, sorteos oficiales y números ganadores',
      icon: CircleDot,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      items: [
        { key: 'sorteos', label: 'Monitoreo de Sorteos', desc: 'Visualización de sorteos en vivo y cierres programados' },
        { key: 'resultados', label: 'Subir Números Ganadores por Día', desc: 'Control Súper Admin: Permite al Administrador registrar los números ganadores oficiales de cada sorteo por día y desencadenar el recálculo automático de premios' },
        { key: 'loterias', label: 'Catálogo de Loterías', desc: 'Configuración y horarios de apertura y cierre de sorteos' },
      ],
    },
    {
      name: 'Premios & Liquidación',
      description: 'Detección automática de ganadores y autorización de desembolso',
      icon: Award,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      items: [
        { key: 'ganadores', label: 'Módulo de Ganadores', desc: 'Consulta de tickets ganadores determinados automáticamente' },
        { key: 'pagoPremios', label: 'Pago de Premios', desc: 'Autorización y marcado de tickets como PAGADO en efectivo' },
        { key: 'configuracionPremios', label: 'Planes de Premios', desc: 'Multiplicadores de pago para Quinielas, Palé y Tripletas' },
      ],
    },
    {
      name: 'Estructura Comercial & Bancas',
      description: 'Puntos de venta, terminales de cajero y personal operativo',
      icon: Store,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      items: [
        { key: 'bancas', label: 'Gestión de Bancas', desc: 'Visualización y control de puntos de venta físicos' },
        { key: 'terminales', label: 'Terminales & Dispositivos', desc: 'Alta, vinculación y bloqueo de terminales' },
        { key: 'grupos', label: 'Grupos y Zonas', desc: 'Agrupación de bancas con topes y planes independientes' },
        { key: 'usuarios', label: 'Gestión de Usuarios', desc: 'Creación y asignación de cajeros y operadores' },
        { key: 'supervisores', label: 'Supervisores', desc: 'Control de personal de supervisión de zona' },
        { key: 'colectores', label: 'Colectores de Ruta', desc: 'Rutas y liquidación de cobradores' },
      ],
    },
    {
      name: 'Control Financiero & Cuadre',
      description: 'Límites de riesgo, balances diarios y comisiones',
      icon: TrendingUp,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      items: [
        { key: 'topes', label: 'Límites de Venta (Topes)', desc: 'Topes por número, terminal, grupo y lotería' },
        { key: 'reportes', label: 'Reportes y Analíticas', desc: 'Reportes de ventas, premios y márgenes netos' },
        { key: 'cuadres', label: 'Cuadre Diario de Caja', desc: 'Cierre y conciliación de caja por terminal y banca' },
        { key: 'comisiones', label: 'Gestión de Comisiones', desc: 'Porcentajes de comisión de ventas para bancas y cajeros' },
      ],
    },
    {
      name: 'Configuración Avanzada',
      description: 'Personalización de la empresa y configuración del sistema',
      icon: Settings,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      items: [
        { key: 'configuracionConsorcio', label: 'Configuración del Consorcio', desc: 'Logos, colores corporativos y encabezados de ticket' },
        { key: 'configuracionSistema', label: 'Configuración del Sistema', desc: 'Backups y parámetros globales del sistema (Restringido)' },
      ],
    },
  ];

  const totalAssigned = Object.values(permissions).filter(Boolean).length;
  const totalKeys = Object.keys(DEFAULT_ADMIN_PERMISSIONS).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb */}
      <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Configuración → Administradores → Permisos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Control de Permisos de Administradores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Como Súper Administrador, usted tiene la máxima autoridad para asignar o retirar permisos a cada administrador de consorcio.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('permisos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'permisos'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Asignación de Permisos</span>
          </button>
          <button
            onClick={() => setActiveSubTab('auditoria')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'auditoria'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditoría de Acciones</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeSubTab === 'permisos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT COLUMN: SELECCIÓN DE ADMINISTRADOR (Cols: 4)
              ======================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <Card variant="default">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Administradores del Sistema
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Seleccione un usuario para auditar o modificar sus facultades
                  </p>
                </div>
                <Badge variant="purple" size="sm">
                  {admins.length} Usuarios
                </Badge>
              </div>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Admins list */}
              <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {admins
                  .filter((a) =>
                    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.username?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((adm) => {
                    const isSelected = adm.id === selectedAdminId;
                    const isMaster = adm.role === 'SUPER_ADMIN';
                    const activeCount = adm.adminPermissions
                      ? Object.values(adm.adminPermissions).filter(Boolean).length
                      : isMaster
                      ? totalKeys
                      : Object.values(DEFAULT_ADMIN_PERMISSIONS).filter(Boolean).length;

                    return (
                      <button
                        key={adm.id}
                        onClick={() => handleSelectAdmin(adm.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-sm ring-1 ring-purple-500/20'
                            : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMaster
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'bg-purple-600 text-white shadow-xs'
                            }`}
                          >
                            {isMaster ? '👑' : adm.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {adm.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              @{adm.username} · {adm.consorcioName || 'Consorcio Central'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isMaster
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                : activeCount > 15
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            }`}
                          >
                            {isMaster ? 'TOTAL' : `${activeCount}/${totalKeys}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </Card>

            {/* Selected Admin Summary Card */}
            {selectedAdmin && (
              <Card variant="default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {selectedAdmin.role === 'SUPER_ADMIN' ? '👑' : <Users className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedAdmin.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rol: <strong className="text-purple-600 dark:text-purple-400">{selectedAdmin.role}</strong> · Estado:{' '}
                      <span className="text-emerald-500 font-semibold">{selectedAdmin.status || 'ACTIVO'}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Consorcio:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedAdmin.consorcioName || 'Todos'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Permisos Habilitados:</span>
                    <strong className="text-purple-600 dark:text-purple-400">
                      {totalAssigned} de {totalKeys} funciones
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Nivel de Acceso:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {totalAssigned === totalKeys
                        ? 'Acceso Irrestricto'
                        : totalAssigned > 12
                        ? 'Administrador Operativo Alto'
                        : 'Administrador Restringido'}
                    </strong>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ========================================================
              RIGHT COLUMN: MATRIZ DE PERMISOS GRANULARES (Cols: 8)
              ======================================================== */}
          <div className="lg:col-span-8 space-y-5">
            {/* Action Bar & Quick Presets */}
            <div className="bg-white dark:bg-[#0d172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Plantillas Rápidas de Autorización
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => applyPreset('total')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 transition-colors"
                  >
                    ✓ Acceso Total
                  </button>
                  <button
                    onClick={() => applyPreset('ventas_reportes')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition-colors"
                  >
                    📊 Solo Ventas & Reportes
                  </button>
                  <button
                    onClick={() => applyPreset('caja')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition-colors"
                  >
                    💵 Operativo de Caja
                  </button>
                  <button
                    onClick={() => applyPreset('auditor')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors"
                  >
                    🔍 Auditor
                  </button>
                  <button
                    onClick={() => applyPreset('limpiar')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 transition-colors"
                  >
                    ✗ Limpiar
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={saving || !hasChanges || selectedAdmin?.role === 'SUPER_ADMIN'}
                  icon={<Save className="w-4 h-4" />}
                  className="bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25"
                >
                  {saving ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Permisos al Día'}
                </Button>
              </div>
            </div>

            {selectedAdmin?.role === 'SUPER_ADMIN' && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-xs flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>
                  <strong>Cuenta Principal de Súper Administrador:</strong> Esta cuenta posee facultades globales irrevocables sobre todo el sistema y no puede ser restringida.
                </span>
              </div>
            )}

            {/* Categorized Permissions Grid */}
            <div className="space-y-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const activeInCat = cat.items.filter((item) => permissions[item.key]).length;

                return (
                  <Card key={cat.name} variant="default" className="overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cat.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {cat.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {activeInCat} de {cat.items.length} activos
                      </span>
                    </div>

                    {/* Permissions list */}
                    <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {cat.items.map((item) => {
                        const isChecked = !!permissions[item.key];
                        const isSuperOnly = item.key === 'configuracionSistema';

                        return (
                          <div
                            key={item.key}
                            onClick={() => handleToggle(item.key)}
                            className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'bg-purple-50/40 dark:bg-purple-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                            }`}
                          >
                            <div className="pr-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    isChecked
                                      ? 'text-purple-700 dark:text-purple-300'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {isSuperOnly && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                    Restringido
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.desc}
                              </p>
                            </div>

                            {/* Toggle Switch */}
                            <div className="shrink-0 flex items-center">
                              <button
                                type="button"
                                disabled={selectedAdmin?.role === 'SUPER_ADMIN'}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                  isChecked ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              >
                                <div
                                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                    isChecked ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
            AUDITORÍA DE ACCIONES ADMINISTRATIVAS
            ======================================================== */
        <Card variant="default">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <span>Registro de Auditoría de Acciones Administrativas</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bitácora inalterable de asignaciones, revocaciones y cambios de permisos realizados por la autoridad
              </p>
            </div>
            <Badge variant="purple" size="md">
              {auditLogs.length} Registros
            </Badge>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Autoridad</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Usuario Afectado</th>
                  <th className="py-2.5 px-3">Detalles de Operación</th>
                  <th className="py-2.5 px-3">Dispositivo / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hay registros de auditoría aún.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-DO')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.userName}
                        </span>
                        <span className="block text-[10px] text-purple-600 dark:text-purple-400">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.action === 'ASIGNAR_PERMISO'
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : log.action === 'REVOCAR_PERMISO'
                              ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                              : 'bg-purple-500/15 text-purple-600 border-purple-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.targetUserName || 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300 max-w-xs">
                        {log.details}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {log.device || 'PC Escritorio'} {log.ip ? `· ${log.ip}` : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
