import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  DeviceRegistration,
  DeviceAuditLog,
  Terminal,
  User,
  TerminalDeviceType,
} from '../../types/index';
import {
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Plus,
  Copy,
  Check,
  Search,
  History,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  TrendingUp,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  DollarSign,
  CreditCard,
  Percent,
} from 'lucide-react';

interface DevicesManagementViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const DevicesManagementView: React.FC<DevicesManagementViewProps> = ({ user, onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<'terminals' | 'activate' | 'audit'>('terminals');

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [auditLogs, setAuditLogs] = useState<DeviceAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Quick Credit Limit Adjustment modal
  const [adjustingCreditTerminal, setAdjustingCreditTerminal] = useState<Terminal | null>(null);
  const [quickCreditLimit, setQuickCreditLimit] = useState<string>('50000');

  // Form state for "Activar Terminales"
  const [targetDeviceCode, setTargetDeviceCode] = useState<string>('');
  const [selectedTerminalCode, setSelectedTerminalCode] = useState<string>('');
  const [selectedTerminalType, setSelectedTerminalType] = useState<TerminalDeviceType | null>(null);
  const [activationCreditLimit, setActivationCreditLimit] = useState<string>('50000');
  const [typeError, setTypeError] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [activationResult, setActivationResult] = useState<{
    device: DeviceRegistration;
    activationCode: string;
    terminalType: TerminalDeviceType;
  } | null>(null);

  // Edit Terminal Modal state
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editTerminalType, setEditTerminalType] = useState<TerminalDeviceType>('PC');
  const [editBalanceLimit, setEditBalanceLimit] = useState<string>('50000');
  const [editContactPhone, setEditContactPhone] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editActive, setEditActive] = useState<boolean>(true);

  // Emergency block confirmation modal
  const [terminalToBlock, setTerminalToBlock] = useState<Terminal | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');

  // Detail Modal for Technical Info
  const [selectedTerminalDetail, setSelectedTerminalDetail] = useState<Terminal | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Permission checks
  const canEditTerminals =
    user.role === 'SUPER_ADMIN' || (user as any).permissions?.editTerminals !== false;

  const canDeactivateTerminals =
    user.role === 'SUPER_ADMIN' || (user as any).permissions?.disableTerminals !== false;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [termList, devList, logs] = await Promise.all([
        api.getTerminals(user.consorcioId),
        api.getDevices(user.consorcioId).catch(() => [] as DeviceRegistration[]),
        api.getDeviceAuditLogs(user.consorcioId).catch(() => [] as DeviceAuditLog[]),
      ]);
      setTerminals(termList);
      setDevices(devList);
      setAuditLogs(logs);

      if (termList.length > 0 && !selectedTerminalCode) {
        setSelectedTerminalCode(termList[0].code);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando terminales y dispositivos.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    showNotification(`¡${label} copiado al portapapeles!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Helper to auto-generate code if needed
  const handleGenerateDeviceCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let r1 = '';
    let r2 = '';
    for (let i = 0; i < 4; i++) r1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) r2 += chars.charAt(Math.floor(Math.random() * chars.length));
    setTargetDeviceCode(`DEV-${r1}-${r2}`);
  };

  // Submit Activation from Admin
  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeError(null);

    // Obligatory validation requirement:
    // "Una terminal no debe poder activarse si el administrador no selecciona primero si funcionará como PC o Móvil."
    if (!selectedTerminalType) {
      setTypeError('Debe seleccionar obligatoriamente cómo funcionará la terminal: 💻 Versión PC o 📱 Versión Móvil.');
      return;
    }

    if (!targetDeviceCode.trim() || !selectedTerminalCode) {
      setError('Por favor ingrese o genere el código de activación y elija la terminal.');
      return;
    }

    setActionLoading(true);
    setError(null);

    const term = terminals.find((t) => t.code === selectedTerminalCode);

    try {
      const res = await api.activateDevice({
        deviceId: targetDeviceCode.trim().toUpperCase(),
        consorcioId: user.consorcioId,
        terminalCode: selectedTerminalCode,
        terminalType: selectedTerminalType,
        bancaName: term?.name || `Banca ${selectedTerminalCode}`,
        assignedUsername: term?.username || selectedTerminalCode,
        replaceExisting,
      });

      // Configure initial credit limit if specified
      if (term && activationCreditLimit) {
        try {
          await api.updateTerminalCreditLimit(term.id, Number(activationCreditLimit));
        } catch (creditErr) {
          console.warn('Aviso configurando límite de crédito:', creditErr);
        }
      }

      setActivationResult({
        ...res,
        terminalType: selectedTerminalType,
      });
      showNotification(`¡Terminal ${selectedTerminalCode} activada con éxito como ${selectedTerminalType === 'PC' ? '💻 Versión PC' : '📱 Versión Móvil'}!`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error activando la terminal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Change Terminal Type (with audit record & permission check)
  const handleQuickChangeType = async (term: Terminal, newType: TerminalDeviceType) => {
    if (!canEditTerminals) {
      alert('No tiene el permiso correspondiente para cambiar el tipo de terminal. Contacte a su Súper Administrador.');
      return;
    }

    const prevType = term.terminalType || 'PC';
    if (prevType === newType) return;

    const confirmMsg = `¿Confirma cambiar la terminal #${term.code} (${term.name}) de ${prevType === 'PC' ? '💻 PC' : '📱 Móvil'} a ${newType === 'PC' ? '💻 Versión PC' : '📱 Versión Móvil'}?\n\nAl ingresar, el cajero cargará automáticamente la interfaz ${newType === 'PC' ? 'diseñada para PC' : 'móvil'}. Este cambio quedará registrado en la auditoría.`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await api.changeTerminalType(term.id, newType);
      showNotification(`Tipo de terminal #${term.code} actualizado a ${newType === 'PC' ? '💻 Versión PC' : '📱 Versión Móvil'}.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error actualizando tipo de terminal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Terminal Modal
  const handleOpenEditModal = (term: Terminal) => {
    if (!canEditTerminals) {
      alert('No tiene el permiso correspondiente para editar terminales.');
      return;
    }
    setEditingTerminal(term);
    setEditName(term.name);
    setEditLocation(term.location || '');
    setEditTerminalType(term.terminalType || 'PC');
    setEditBalanceLimit(String(term.creditLimit !== undefined ? term.creditLimit : (term.balanceLimit || 50000)));
    setEditContactPhone(term.contactPhone || '');
    setEditPassword('');
    setEditActive(term.active);
  };

  // Quick Credit Limit Adjustment Modal
  const handleOpenQuickCreditModal = (term: Terminal) => {
    if (!canEditTerminals) {
      alert('No tiene permiso para modificar límites de crédito.');
      return;
    }
    setAdjustingCreditTerminal(term);
    setQuickCreditLimit(String(term.creditLimit !== undefined ? term.creditLimit : (term.balanceLimit || 50000)));
  };

  const handleSaveQuickCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCreditTerminal) return;
    const newLimit = Number(quickCreditLimit);
    if (isNaN(newLimit) || newLimit < 0) {
      alert('Por favor ingrese un monto de límite de crédito válido.');
      return;
    }

    setActionLoading(true);
    try {
      await api.updateTerminalCreditLimit(adjustingCreditTerminal.id, newLimit);
      showNotification(`Límite de crédito de #${adjustingCreditTerminal.code} configurado a RD$${newLimit.toLocaleString()}. Saldo disponible para ventas recalculado en tiempo real.`);
      setAdjustingCreditTerminal(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error actualizando límite de crédito.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Terminal Edits
  const handleSaveTerminalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerminal) return;

    if (!canEditTerminals) {
      setError('No tiene permiso para editar terminales.');
      return;
    }

    setActionLoading(true);
    try {
      await api.updateTerminal(editingTerminal.id, {
        name: editName,
        location: editLocation,
        terminalType: editTerminalType,
        creditLimit: Number(editBalanceLimit),
        balanceLimit: Number(editBalanceLimit),
        contactPhone: editContactPhone,
        active: editActive,
        passwordPlain: editPassword.trim() ? editPassword.trim() : undefined,
      } as any);

      showNotification(`Terminal #${editingTerminal.code} actualizada correctamente.`);
      setEditingTerminal(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error actualizando la terminal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Terminal Active / Inactive
  const handleToggleTerminalStatus = async (term: Terminal) => {
    if (!canDeactivateTerminals) {
      alert('No tiene el permiso correspondiente para activar o desactivar terminales.');
      return;
    }

    const newActiveState = !term.active;
    const confirmMsg = newActiveState
      ? `¿Desea reactivar la terminal #${term.code} (${term.name})? Podrá emitir tickets de inmediato.`
      : `¿Confirma bloquear/desactivar la terminal #${term.code} (${term.name})? El cajero no podrá vender hasta que sea reactivada.`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await api.updateTerminal(term.id, { active: newActiveState });
      showNotification(`Terminal #${term.code} ${newActiveState ? 'reactivada' : 'bloqueada'} exitosamente.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado de la terminal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats calculation including real-time Credit Limit and Risk Control
  const totalTerminalsCount = terminals.length;
  const activeTerminalsCount = terminals.filter((t) => t.active).length;
  const pcTerminalsCount = terminals.filter((t) => (t.terminalType || 'PC') === 'PC').length;
  const movilTerminalsCount = terminals.filter((t) => t.terminalType === 'MOVIL').length;
  const totalCreditLimit = terminals.reduce((sum, t) => sum + (t.creditLimit !== undefined ? t.creditLimit : (t.balanceLimit || 50000)), 0);
  const totalSalesToday = terminals.reduce((sum, t) => sum + (t.currentSalesToday || 0), 0);
  const totalAvailableCredit = terminals.reduce((sum, t) => sum + (t.availableCredit !== undefined ? t.availableCredit : Math.max(0, (t.creditLimit || t.balanceLimit || 50000) - (t.currentSalesToday || 0))), 0);
  const highRiskTerminalsCount = terminals.filter((t) => t.riskLevel === 'HIGH' || t.riskLevel === 'EXCEEDED' || (t.availableCredit !== undefined && t.availableCredit <= 0)).length;
  const overallPercentUsed = totalCreditLimit > 0 ? Math.min(100, Math.round((totalSalesToday / totalCreditLimit) * 100)) : 0;

  // Filtered terminals list
  const filteredTerminals = terminals.filter((term) => {
    const matchesSearch =
      term.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (term.location && term.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (term.deviceId && term.deviceId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && term.active) ||
      (statusFilter === 'INACTIVE' && !term.active);

    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'PC' && (term.terminalType || 'PC') === 'PC') ||
      (typeFilter === 'MOVIL' && term.terminalType === 'MOVIL');

    const matchesRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'LOW' && (term.riskLevel === 'LOW' || !term.riskLevel)) ||
      (riskFilter === 'MEDIUM' && term.riskLevel === 'MEDIUM') ||
      (riskFilter === 'HIGH' && term.riskLevel === 'HIGH') ||
      (riskFilter === 'EXCEEDED' && (term.riskLevel === 'EXCEEDED' || (term.availableCredit !== undefined && term.availableCredit <= 0)));

    return matchesSearch && matchesStatus && matchesType && matchesRisk;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Control y Activación de Terminales
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asignación obligatoria de tipo (💻 Versión PC / 📱 Versión Móvil), tokens y auditoría inmutable
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('terminals')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'terminals'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Lista de Terminales ({totalTerminalsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('activate');
              setActivationResult(null);
              setTypeError(null);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'activate'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Activar Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Auditoría</span>
          </button>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('terminal-sales')}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black transition-all flex items-center gap-2 shadow-xs shrink-0"
          >
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Ventas por Terminal</span>
          </button>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Quick Summary Stat Cards with Credit Limit & Real-time Risk Monitoring */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Terminales Activas</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {activeTerminalsCount}/{totalTerminalsCount}
            </h3>
            <p className="text-[10px] text-slate-400">
              {pcTerminalsCount} 💻 PC · {movilTerminalsCount} 📱 Móvil
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Límite Total de Crédito</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              RD${totalCreditLimit.toLocaleString()}
            </h3>
            <p className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold">
              Riesgo máximo autorizado
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ventas Hoy (Crédito Usado)</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              RD${totalSalesToday.toLocaleString()}
            </h3>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
              {overallPercentUsed}% del límite consumido
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
            highRiskTerminalsCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
          }`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Saldo Disponible Global</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              RD${totalAvailableCredit.toLocaleString()}
            </h3>
            <p className={`text-[10px] font-bold ${
              highRiskTerminalsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {highRiskTerminalsCount > 0 ? `⚠️ ${highRiskTerminalsCount} en riesgo crítico` : '🟢 Sin alertas de riesgo'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB 1: LISTA DE TERMINALES (Terminal, Banca, Tipo, Límite, Saldo, Estado, Acciones)
          ======================================================== */}
      {activeTab === 'terminals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          {/* Table Controls (Search & Filters) */}
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código, banca o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="PC">💻 Versión PC</option>
                <option value="MOVIL">📱 Versión Móvil</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="INACTIVE">Inactivas / Bloqueadas</option>
              </select>

              {/* Risk Filter (Control de Riesgo de Crédito) */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Todos los Riesgos</option>
                <option value="LOW">🟢 Bajo Riesgo (&lt;70%)</option>
                <option value="MEDIUM">🟡 Riesgo Medio (70%-90%)</option>
                <option value="HIGH">🔴 Alto Riesgo (&gt;90%)</option>
                <option value="EXCEEDED">⛔ Crédito Agotado</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                title="Recargar datos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('activate');
                  setActivationResult(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Activar Terminal</span>
              </button>
            </div>
          </div>

          {/* Table: Terminal | Banca | Tipo | Límite de Crédito | Saldo Disp. & Riesgo | Estado | Acciones */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Terminal</th>
                  <th className="py-3 px-4">Banca</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-right">Límite de Crédito</th>
                  <th className="py-3 px-4 text-center">Saldo Disponible / Riesgo</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredTerminals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No se encontraron terminales con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredTerminals.map((term) => {
                    const isPC = (term.terminalType || 'PC') === 'PC';
                    const effectiveLimit = term.creditLimit !== undefined ? term.creditLimit : (term.balanceLimit || 50000);
                    const salesToday = term.currentSalesToday || 0;
                    const available = term.availableCredit !== undefined ? term.availableCredit : Math.max(0, effectiveLimit - salesToday);
                    const percentUsed = term.creditUsedPercent !== undefined ? term.creditUsedPercent : (effectiveLimit > 0 ? Math.min(100, Math.round((salesToday / effectiveLimit) * 100)) : 0);
                    const risk = term.riskLevel || (salesToday >= effectiveLimit ? 'EXCEEDED' : percentUsed >= 90 ? 'HIGH' : percentUsed >= 70 ? 'MEDIUM' : 'LOW');

                    return (
                      <tr
                        key={term.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Terminal (ej: 0001) */}
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-600 dark:text-cyan-400 font-black tracking-wide">
                              {term.code}
                            </span>
                            {term.deviceId && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                                {term.deviceId}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-normal font-sans">
                            ID: {term.id}
                          </span>
                        </td>

                        {/* 2. Banca (ej: Banca 01) */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {term.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-sans">
                            <span>Usuario: <strong className="font-mono text-slate-600 dark:text-slate-300">{term.username}</strong></span>
                            {term.location && <span>• {term.location}</span>}
                          </div>
                        </td>

                        {/* 3. Tipo (💻 PC / 📱 Móvil) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            {isPC ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                                <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>💻 PC</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>📱 Móvil</span>
                              </span>
                            )}

                            {/* Quick Switch Button (PC <-> Móvil) */}
                            {canEditTerminals && (
                              <button
                                type="button"
                                onClick={() => handleQuickChangeType(term, isPC ? 'MOVIL' : 'PC')}
                                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors cursor-pointer"
                                title={`Cambiar a versión ${isPC ? 'Móvil' : 'PC'}`}
                              >
                                Cambiar a {isPC ? '📱 Móvil' : '💻 PC'}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 4. Límite de Crédito (Configuración de Riesgo) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                              RD${effectiveLimit.toLocaleString()}
                            </span>
                            {canEditTerminals && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuickCreditModal(term)}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                                title="Configurar Límite de Crédito"
                              >
                                <Edit2 className="w-3 h-3 text-blue-500" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Ventas hoy: RD${salesToday.toLocaleString()}
                          </span>
                        </td>

                        {/* 5. Saldo Disponible en Tiempo Real & Control de Riesgo */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 font-mono text-xs font-black">
                              <span className={
                                risk === 'EXCEEDED' ? 'text-rose-600 dark:text-rose-400' :
                                risk === 'HIGH' ? 'text-amber-600 dark:text-amber-400' :
                                'text-emerald-600 dark:text-emerald-400'
                              }>
                                RD${available.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">disp.</span>
                            </div>

                            {/* Risk Progress Bar */}
                            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  risk === 'EXCEEDED' ? 'bg-rose-600' :
                                  risk === 'HIGH' ? 'bg-amber-500' :
                                  risk === 'MEDIUM' ? 'bg-blue-500' :
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, percentUsed)}%` }}
                              />
                            </div>

                            {/* Visual Risk Badge */}
                            <div className="text-[9px] font-bold">
                              {risk === 'EXCEEDED' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black">
                                  ⛔ Bloqueada (100%)
                                </span>
                              ) : risk === 'HIGH' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                  🔴 Riesgo Alto ({percentUsed}%)
                                </span>
                              ) : risk === 'MEDIUM' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                                  🟡 Moderado ({percentUsed}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                  🟢 Seguro ({percentUsed}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. Estado (Activa / Inactiva) */}
                        <td className="py-3.5 px-4 text-center">
                          {term.active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Activa</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Bloqueada / Inactiva</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Acciones: Límite / Editar / Bloquear */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ajustar Límite de Crédito Rápido */}
                            {canEditTerminals && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuickCreditModal(term)}
                                className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Configurar Límite de Crédito de Riesgo"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                <span className="hidden xl:inline">Límite</span>
                              </button>
                            )}

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(term)}
                              disabled={!canEditTerminals}
                              className={`min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 ${
                                !canEditTerminals ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Editar configuración completa de la terminal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            {/* Bloquear / Desbloquear */}
                            <button
                              type="button"
                              onClick={() => handleToggleTerminalStatus(term)}
                              disabled={!canDeactivateTerminals}
                              className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                term.active
                                  ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                              } ${!canDeactivateTerminals ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={term.active ? 'Bloquear terminal' : 'Reactivar terminal'}
                            >
                              {term.active ? (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Bloquear</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Reactivar</span>
                                </>
                              )}
                            </button>

                            {/* Detalle */}
                            <button
                              type="button"
                              onClick={() => setSelectedTerminalDetail(term)}
                              className="min-h-[44px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                              title="Ver ficha técnica y token de activación"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ACTIVAR TERMINALES (Selector Obligatorio: PC vs Móvil)
          ======================================================== */}
      {activeTab === 'activate' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo Activar Terminales</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span>ACTIVACIÓN Y ASIGNACIÓN DE DISPOSITIVO</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure cómo operará la terminal (PC o Móvil), genere el código de activación y vincule la terminal de forma permanente.
            </p>
          </div>

          {/* Success Banner with Activation & Permanent Configuration Confirmation */}
          {activationResult && (
            <div className="p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-black text-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <span>¡TERMINAL ACTIVADA Y CONFIGURADA EXITOSAMENTE!</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                La configuración se ha guardado permanentemente en la base de datos. Entregue este código de activación al cajero:
              </p>

              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-emerald-500/40 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Código de Activación
                  </span>
                  <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                    {activationResult.activationCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activationResult.activationCode, 'Código de Activación')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </button>
              </div>

              {/* Requirement 6: Permanent Links details */}
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-emerald-500/30 text-xs space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 block border-b border-emerald-500/20 pb-1">
                  VINCULACIÓN PERMANENTE REGISTRADA EN EL SISTEMA:
                </span>
                <p>
                  • <strong>Consorcio:</strong> {user.consorcioName || user.consorcioId || 'Consorcio Salomón'}
                </p>
                <p>
                  • <strong>Banca / Punto de Venta:</strong> {activationResult.device.bancaName || `Banca ${activationResult.device.terminalCode}`}
                </p>
                <p>
                  • <strong>Usuario o Terminal:</strong> Terminal {activationResult.device.terminalCode} (Usuario: {activationResult.device.assignedUsername})
                </p>
                <p>
                  • <strong>Código / Token:</strong> {activationResult.activationCode}
                </p>
                <p>
                  • <strong>Tipo de dispositivo asignado:</strong>{' '}
                  <span className="font-black text-blue-600 dark:text-cyan-400">
                    {activationResult.terminalType === 'PC' ? '💻 Versión PC (Cargará interfaz para PC)' : '📱 Versión Móvil (Cargará interfaz móvil)'}
                  </span>
                </p>
                <p>
                  • <strong>Estado:</strong> <span className="font-black text-emerald-600">Activa</span>
                </p>
              </div>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivateSubmit} className="space-y-5">
            {/* Step 1: Select Terminal */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                1. Seleccionar la Terminal que desea activar
              </label>
              <select
                required
                value={selectedTerminalCode}
                onChange={(e) => {
                  setSelectedTerminalCode(e.target.value);
                  const currentTerm = terminals.find((t) => t.code === e.target.value);
                  if (currentTerm?.terminalType) {
                    setSelectedTerminalType(currentTerm.terminalType);
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {terminals.map((t) => (
                  <option key={t.id} value={t.code}>
                    Terminal {t.code} — {t.name} ({t.terminalType ? (t.terminalType === 'PC' ? '💻 PC' : '📱 Móvil') : 'Sin tipo'} | {t.active ? 'Activa' : 'Inactiva'})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Activation Code (Enter or Auto-generate) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  2. Introducir o generar código de activación / hardware
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDeviceCode}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-cyan-400 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Código Automático</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej: DEV-8F42-K29X o DEV-0001-PC"
                  value={targetDeviceCode}
                  onChange={(e) => setTargetDeviceCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Puede ingresar el ID detectado en la pantalla del dispositivo o presionar "Generar Código Automático".
              </p>
            </div>

            {/* Step 3 & 4: MANDATORY SELECTOR: "Tipo de terminal" */}
            <div className={`p-5 rounded-2xl border-2 transition-all ${
              typeError
                ? 'bg-rose-50/70 border-rose-500/80 dark:bg-rose-950/30 dark:border-rose-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>3. Tipo de terminal (Opción Obligatoria)</span>
                </label>
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">
                  * Obligatorio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Seleccione cómo funcionará esta terminal. El sistema reconocerá automáticamente este ajuste al iniciar sesión:
              </p>

              {typeError && (
                <div className="p-3 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{typeError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: 💻 Versión PC */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTerminalType('PC');
                    setTypeError(null);
                  }}
                  className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedTerminalType === 'PC'
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-600 dark:border-cyan-400 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                        selectedTerminalType === 'PC'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          💻 Versión PC
                        </h4>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 uppercase">
                          Mostrador / Escritorio
                        </span>
                      </div>
                    </div>
                    {selectedTerminalType === 'PC' && (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-snug">
                    Carga automáticamente la interfaz para PC diseñada para mostrador con teclado numérico rápido y pantalla completa.
                  </p>
                </button>

                {/* Option 2: 📱 Versión Móvil */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTerminalType('MOVIL');
                    setTypeError(null);
                  }}
                  className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedTerminalType === 'MOVIL'
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                        selectedTerminalType === 'MOVIL'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          📱 Versión Móvil
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          Android POS / Celular
                        </span>
                      </div>
                    </div>
                    {selectedTerminalType === 'MOVIL' && (
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-snug">
                    Carga automáticamente la interfaz móvil táctil adaptada para terminales portátiles y teléfonos inteligentes.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 4: Límite de Crédito Inicial (Control de Riesgo) */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>4. Límite de Crédito Inicial (Control de Riesgo)</span>
                </label>
                <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400">
                  Control de Saldo Diario
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Establece el tope máximo de ventas permitido antes de cuadre. Al alcanzarlo, el POS bloqueará las ventas en tiempo real:
              </p>
              <div className="flex flex-wrap gap-2">
                {[25000, 50000, 75000, 100000, 150000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setActivationCreditLimit(String(amt))}
                    className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      Number(activationCreditLimit) === amt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    RD${(amt / 1000)}k
                  </button>
                ))}
              </div>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                  RD$
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={activationCreditLimit}
                  onChange={(e) => setActivationCreditLimit(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* Replace Existing Checkbox */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <input
                id="replaceExistingCheckbox"
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-5 h-5 rounded-md text-blue-600 mt-0.5 cursor-pointer"
              />
              <label htmlFor="replaceExistingCheckbox" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <strong className="block font-black text-slate-800 dark:text-white">
                  Reemplazar dispositivo si la terminal ya está ocupada
                </strong>
                Si la terminal ya tiene otro dispositivo autorizado, desautorizará el anterior y vinculará la exclusividad al nuevo.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={actionLoading || !targetDeviceCode.trim()}
              className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-blue-600/30 border-b-4 border-b-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{actionLoading ? 'PROCESANDO ACTIVACIÓN...' : 'ACTIVAR TERMINAL'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 3: REGISTRO DE AUDITORÍA (Historial Inmutable de Cambios)
          ======================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Historial de Auditoría de Terminales</span>
              </h3>
              <p className="text-xs text-slate-500">
                Registro inmutable de todas las activaciones, cambios de tipo (PC / Móvil) y bloqueos realizados por administradores.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              Refrescar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Administrador</th>
                  <th className="py-3 px-4">Terminal Afectada</th>
                  <th className="py-3 px-4 text-center">Tipo Anterior</th>
                  <th className="py-3 px-4 text-center">Tipo Nuevo</th>
                  <th className="py-3 px-4">Acción Realizada</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-xs">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                      No hay registros de auditoría aún.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const isTypeChange = log.action === 'CAMBIO_TIPO_TERMINAL';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        {/* Fecha y Hora */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-DO')}
                        </td>

                        {/* Administrador que realizó el cambio */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{log.adminName || log.adminUsername}</div>
                          <span className="text-[10px] text-slate-400 font-mono">@{log.adminUsername}</span>
                        </td>

                        {/* Terminal afectada */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-blue-600 dark:text-cyan-400">
                            {log.terminalCode ? `Terminal #${log.terminalCode}` : log.deviceId}
                          </span>
                          {log.bancaName && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                              {log.bancaName}
                            </span>
                          )}
                        </td>

                        {/* Tipo anterior */}
                        <td className="py-3 px-4 text-center">
                          {log.previousType ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {log.previousType === 'PC' ? '💻 PC' : log.previousType === 'MOVIL' ? '📱 Móvil' : log.previousType}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Tipo nuevo */}
                        <td className="py-3 px-4 text-center">
                          {log.newType ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                              log.newType === 'PC'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            }`}>
                              {log.newType === 'PC' ? '💻 PC' : log.newType === 'MOVIL' ? '📱 Móvil' : log.newType}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Acción */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                              isTypeChange
                                ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                                : log.action.includes('BLOQUEÓ')
                                ? 'bg-rose-500/20 text-rose-600'
                                : log.action.includes('DESACTIVÓ')
                                ? 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                                : 'bg-emerald-500/20 text-emerald-600'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Detalles */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px] max-w-[250px]">
                          {log.details || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR TERMINAL (Incluye cambiar Tipo PC <-> Móvil)
          ======================================================== */}
      {editingTerminal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Editar Terminal #{editingTerminal.code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cambio de configuración operativa y tipo de interfaz
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTerminal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTerminalEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Banca / Punto de Venta
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Requirement: Cambiar el tipo de terminal posteriormente (PC a Móvil o Móvil a PC) */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <label className="block text-xs font-black uppercase text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <span>Tipo de Terminal</span>
                  <span className="text-[10px] text-blue-700 dark:text-cyan-400 font-bold">
                    Se audita cada cambio
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTerminalType('PC')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      editTerminalType === 'PC'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>💻 Versión PC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditTerminalType('MOVIL')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      editTerminalType === 'MOVIL'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📱 Versión Móvil</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Si cambia de PC a Móvil, el cajero cargará automáticamente la interfaz táctil. Si cambia a PC, cargará la interfaz de mostrador.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ubicación / Dirección
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Ej: Av. 27 de Febrero esq. Lincoln"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Límite de Crédito y Control de Riesgo Operativo */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Límite de Crédito (Control de Riesgo)</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400">
                    Tiempo Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Monto máximo de ventas permitido antes de liquidación o cuadre. Bloquea las ventas en el POS al alcanzar el tope diario.
                </p>

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[25000, 50000, 75000, 100000, 150000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEditBalanceLimit(String(amt))}
                      className={`py-1 px-2.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                        Number(editBalanceLimit) === amt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ${(amt / 1000)}k
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Monto Límite (RD$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-bold">RD$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={editBalanceLimit}
                        onChange={(e) => setEditBalanceLimit(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      placeholder="(809) 555-0001"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Simulation */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Ventas hoy: <strong className="font-mono text-slate-900 dark:text-white">RD${(editingTerminal.currentSalesToday || 0).toLocaleString()}</strong>
                  </span>
                  <span className="font-bold">
                    Saldo disponible:{' '}
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                      RD${Math.max(0, Number(editBalanceLimit) - (editingTerminal.currentSalesToday || 0)).toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalActiveCheckbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  disabled={!canDeactivateTerminals}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="modalActiveCheckbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Terminal Activa para Ventas (Facturable)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTerminal(null)}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-xs"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: AJUSTE RÁPIDO DE LÍMITE DE CRÉDITO (Control de Riesgo)
          ======================================================== */}
      {adjustingCreditTerminal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Límite de Crédito · Terminal #{adjustingCreditTerminal.code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {adjustingCreditTerminal.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingCreditTerminal(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickCreditLimit} className="space-y-4">
              {/* Current Metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ventas Hoy</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    RD${(adjustingCreditTerminal.currentSalesToday || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Disponible Actual</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    RD${(adjustingCreditTerminal.availableCredit !== undefined ? adjustingCreditTerminal.availableCredit : Math.max(0, (adjustingCreditTerminal.creditLimit || 50000) - (adjustingCreditTerminal.currentSalesToday || 0))).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Preset buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Montos Predefinidos
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[25000, 50000, 75000, 100000, 150000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickCreditLimit(String(amt))}
                      className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        Number(quickCreditLimit) === amt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ${(amt / 1000)}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Límite de Crédito (RD$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    RD$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={quickCreditLimit}
                    onChange={(e) => setQuickCreditLimit(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Simulation feedback */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Nuevo Saldo Disponible Proyectado:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                    RD${Math.max(0, Number(quickCreditLimit) - (adjustingCreditTerminal.currentSalesToday || 0)).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Al superar este valor en ventas durante el día, la terminal quedará protegida y el POS bloqueará automáticamente la venta de jugadas por control de riesgo.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingCreditTerminal(null)}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Aplicar Límite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DETALLES DE TERMINAL
          ======================================================== */}
      {selectedTerminalDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Ficha Técnica de Terminal #{selectedTerminalDetail.code}
                  </h3>
                  <p className="font-mono text-xs text-blue-600 dark:text-cyan-400 font-bold">
                    {selectedTerminalDetail.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTerminalDetail(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black">Tipo Asignado</span>
                <p className="font-black text-slate-800 dark:text-slate-200">
                  {selectedTerminalDetail.terminalType === 'MOVIL' ? '📱 Móvil' : '💻 PC'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black">Estado</span>
                <p className="font-black text-emerald-600 dark:text-emerald-400">
                  {selectedTerminalDetail.active ? 'Activa' : 'Bloqueada'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black">Usuario POS</span>
                <p className="font-mono font-bold">{selectedTerminalDetail.username}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-black">Hardware Vinculado</span>
                <p className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                  {selectedTerminalDetail.deviceId || 'Sin vincular'}
                </p>
              </div>

              {selectedTerminalDetail.activationCode && (
                <div className="col-span-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-black">Código de Activación</span>
                    <p className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                      {selectedTerminalDetail.activationCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedTerminalDetail.activationCode!, 'Código de activación')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Copiar
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTerminalDetail(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
