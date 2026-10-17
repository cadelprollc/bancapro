import React, { useState, useEffect } from 'react';
import { api, validateGroupPermissionsAgainstAdmin } from '../../services/api';
import {
  ConsorcioGroup,
  GroupPermissions,
  PrizePlan,
  GroupSalesCap,
  GroupAuditLog,
  Terminal,
  Lottery,
  Consorcio,
  User,
  PlayType,
  ConsorcioPermissions
} from '../../types/index';
import {
  Users,
  Plus,
  Shield,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Sliders,
  DollarSign,
  History,
  Layers,
  ArrowRight,
  Info,
  Check,
  X,
  Search,
  Lock,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';

interface GroupsManagementProps {
  user: User;
}

const ALL_PERMISSION_KEYS: Array<{ key: keyof GroupPermissions; label: string; desc: string }> = [
  { key: 'monitoring', label: 'Monitoreo de Jugadas', desc: 'Permite visualizar jugadas en tiempo real' },
  { key: 'monitoringFunctions', label: 'Funciones de Monitoreo', desc: 'Acceso a herramientas avanzadas de monitoreo' },
  { key: 'terminals', label: 'Gestión de Terminales', desc: 'Permite visualizar y administrar terminales' },
  { key: 'lotteries', label: 'Configuración de Loterías', desc: 'Acceso a horarios y sorteos' },
  { key: 'results', label: 'Publicar Resultados', desc: 'Registro de números ganadores del sorteo' },
  { key: 'topes', label: 'Topes de Venta', desc: 'Configuración de límites de venta por número' },
  { key: 'prizes', label: 'Premios', desc: 'Configuración de tablas de pagos y premios' },
  { key: 'reports', label: 'Reportes Consolidados', desc: 'Reportes de ventas, comisiones y balances' },
  { key: 'createTerminals', label: 'Crear Terminales', desc: 'Facultad para crear nuevas bancas' },
  { key: 'editTerminals', label: 'Editar Terminales', desc: 'Modificación de parámetros de bancas' },
  { key: 'disableTerminals', label: 'Desactivar Terminales', desc: 'Pausar o suspender ventas de una terminal' },
];

export const GroupsManagement: React.FC<GroupsManagementProps> = ({ user }) => {
  const [groups, setGroups] = useState<(ConsorcioGroup & { terminalsCount: number; prizePlanName?: string })[]>([]);
  const [prizePlans, setPrizePlans] = useState<PrizePlan[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);
  const [selectedConsorcioId, setSelectedConsorcioId] = useState<string>(user.consorcioId || 'c-1230');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active view modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ConsorcioGroup | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'GROUPS' | 'PLANS' | 'AUDIT'>('GROUPS');
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<ConsorcioGroup | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'SUMMARY' | 'PERMISSIONS' | 'PRIZES' | 'TOPES' | 'TERMINALS' | 'HISTORY'>('SUMMARY');

  // Topes management inside a group
  const [groupTopes, setGroupTopes] = useState<GroupSalesCap[]>([]);
  const [showTopeModal, setShowTopeModal] = useState(false);
  const [editingTope, setEditingTope] = useState<GroupSalesCap | null>(null);

  // Prize plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PrizePlan | null>(null);

  // Group audit logs
  const [groupAuditLogs, setGroupAuditLogs] = useState<GroupAuditLog[]>([]);

  // Live tester inside topes drawer
  const [simTerminal, setSimTerminal] = useState('');
  const [simLottery, setSimLottery] = useState('');
  const [simType, setSimType] = useState<PlayType>('QUINIELA');
  const [simNumber, setSimNumber] = useState('05');
  const [simAmount, setSimAmount] = useState('100');
  const [simResult, setSimResult] = useState<any>(null);
  const [testingTope, setTestingTope] = useState(false);

  // Group Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formPlanId, setFormPlanId] = useState('');
  const [formGeneralCap, setFormGeneralCap] = useState('');
  const [formTerminals, setFormTerminals] = useState<string[]>([]);
  const [formLotteries, setFormLotteries] = useState<string[]>([]);
  const [formPermissions, setFormPermissions] = useState<Partial<GroupPermissions>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Topes Form state
  const [topeTermCode, setTopeTermCode] = useState('');
  const [topeLotteryId, setTopeLotteryId] = useState('');
  const [topePlayType, setTopePlayType] = useState<PlayType>('QUINIELA');
  const [topeNumber, setTopeNumber] = useState('05');
  const [topeAmount, setTopeAmount] = useState('500');
  const [topeDate, setTopeDate] = useState('');

  // Prize Plan Form state
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planQ1, setPlanQ1] = useState('60');
  const [planQ2, setPlanQ2] = useState('8');
  const [planQ3, setPlanQ3] = useState('4');
  const [planP12, setPlanP12] = useState('1000');
  const [planP13, setPlanP13] = useState('1000');
  const [planP23, setPlanP23] = useState('100');
  const [planT3, setPlanT3] = useState('20000');
  const [planT2, setPlanT2] = useState('100');
  const [planSP, setPlanSP] = useState('3000');
  const [planSPInv, setPlanSPInv] = useState(true);

  // Get Admin's available permissions
  const currentConsorcio = consorcios.find((c) => c.id === selectedConsorcioId);
  const adminPermissions: ConsorcioPermissions = currentConsorcio?.permissions || (user as any).permissions || {
    monitoring: true,
    monitoringFunctions: true,
    terminals: true,
    lotteries: true,
    results: false,
    topes: true,
    prizes: true,
    reports: true,
    createTerminals: false,
    editTerminals: true,
    disableTerminals: true,
    invoices: true,
    visualCustomization: false,
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [groupsData, plansData, termsData, lotsData, consData] = await Promise.all([
        api.getGroups(selectedConsorcioId),
        api.getPrizePlans(selectedConsorcioId),
        api.getTerminals(selectedConsorcioId),
        api.getLotteries(),
        user.role === 'SUPER_ADMIN' ? api.getConsorcios() : Promise.resolve([]),
      ]);

      setGroups(groupsData);
      setPrizePlans(plansData);
      setTerminals(termsData);
      setLotteries(lotsData);
      if (consData.length > 0) {
        setConsorcios(consData);
      } else if (user.consorcioId) {
        setConsorcios([
          {
            id: user.consorcioId,
            code: '1230',
            name: 'Consorcio de Bancas Salomón',
            adminName: user.name,
            adminUsername: user.username,
            status: 'ACTIVE',
            costPerTerminal: 500,
            authorizedTerminalsCount: termsData.length,
            permissions: adminPermissions,
            customization: {},
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      if (plansData.length > 0 && !formPlanId) {
        setFormPlanId(plansData[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cargando datos de grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedConsorcioId]);

  const loadGroupDetails = async (group: ConsorcioGroup) => {
    setSelectedGroupDetail(group);
    try {
      const [topes, logs] = await Promise.all([
        api.getGroupTopes(group.id, group.consorcioId),
        api.getGroupAuditLogs(group.id, group.consorcioId),
      ]);
      setGroupTopes(topes);
      setGroupAuditLogs(logs);
      if (lotteries.length > 0 && !simLottery) {
        setSimLottery(lotteries[0].id);
      }
    } catch (err: any) {
      console.error('Error cargando detalles del grupo', err);
    }
  };

  // Open Create Group modal
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setFormName('');
    setFormDesc('');
    setFormStatus('ACTIVE');
    setFormPlanId(prizePlans[0]?.id || 'plan-a');
    setFormGeneralCap('100000');
    setFormTerminals([]);
    setFormLotteries([]);

    // Initialize permissions only with what the admin actually has!
    const initialPerms: Partial<GroupPermissions> = {};
    ALL_PERMISSION_KEYS.forEach(({ key }) => {
      // Rule: Group cannot have permission if Admin does not have it!
      if (adminPermissions[key] === true) {
        initialPerms[key] = true;
      } else {
        initialPerms[key] = false;
      }
    });
    setFormPermissions(initialPerms);
    setFormError(null);
    setShowGroupModal(true);
  };

  // Open Edit Group modal
  const handleOpenEditGroup = (grp: ConsorcioGroup) => {
    setEditingGroup(grp);
    setFormName(grp.name);
    setFormDesc(grp.description || '');
    setFormStatus(grp.status);
    setFormPlanId(grp.prizePlanId);
    setFormGeneralCap(grp.generalDailyCap ? String(grp.generalDailyCap) : '');
    setFormTerminals([...grp.terminalIds]);
    setFormLotteries([...(grp.allowedLotteryIds || [])]);

    // Filter permissions against admin permissions
    const perms: Partial<GroupPermissions> = {};
    ALL_PERMISSION_KEYS.forEach(({ key }) => {
      if (adminPermissions[key] === true) {
        perms[key] = grp.permissions[key] ?? true;
      } else {
        perms[key] = false; // Strictly stripped if admin lacks it
      }
    });
    setFormPermissions(perms);
    setFormError(null);
    setShowGroupModal(true);
  };

  // Submit Create or Edit Group with strict inheritance validation
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('El nombre del grupo es obligatorio.');
      return;
    }

    // MANDATORY CLIENT-SIDE INHERITANCE VALIDATION:
    const validation = validateGroupPermissionsAgainstAdmin(adminPermissions, formPermissions);
    if (!validation.valid) {
      setFormError(
        `Violación de seguridad: El grupo no puede tener permisos superiores a los de su Administrador. Permisos no permitidos: ${validation.unauthorizedPermissions.join(', ')}.`
      );
      return;
    }

    try {
      if (editingGroup) {
        await api.updateGroup(editingGroup.id, {
          name: formName.trim(),
          description: formDesc.trim(),
          status: formStatus,
          prizePlanId: formPlanId,
          generalDailyCap: formGeneralCap ? Number(formGeneralCap) : undefined,
          permissions: formPermissions as GroupPermissions,
          allowedLotteryIds: formLotteries,
          terminalIds: formTerminals,
        });
        setSuccessMsg(`Grupo "${formName}" actualizado exitosamente.`);
      } else {
        await api.createGroup({
          name: formName.trim(),
          description: formDesc.trim(),
          status: formStatus,
          consorcioId: selectedConsorcioId,
          prizePlanId: formPlanId,
          generalDailyCap: formGeneralCap ? Number(formGeneralCap) : undefined,
          permissions: formPermissions,
          allowedLotteryIds: formLotteries,
          terminalIds: formTerminals,
        });
        setSuccessMsg(`Grupo "${formName}" creado exitosamente.`);
      }

      setShowGroupModal(false);
      loadAllData();
      if (selectedGroupDetail && editingGroup && selectedGroupDetail.id === editingGroup.id) {
        const updated = await api.getGroupById(editingGroup.id);
        loadGroupDetails(updated);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error guardando grupo');
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar el grupo "${name}"? Las terminales quedarán libres sin grupo asignado.`)) {
      return;
    }
    try {
      await api.deleteGroup(id);
      setSuccessMsg(`Grupo "${name}" eliminado.`);
      if (selectedGroupDetail?.id === id) {
        setSelectedGroupDetail(null);
      }
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error eliminando grupo');
    }
  };

  // Toggle terminal in group
  const handleToggleTerminal = (termId: string) => {
    setFormTerminals((prev) =>
      prev.includes(termId) ? prev.filter((id) => id !== termId) : [...prev, termId]
    );
  };

  // Topes within group
  const handleOpenCreateTope = () => {
    setEditingTope(null);
    setTopeTermCode('');
    setTopeLotteryId(lotteries[0]?.id || '');
    setTopePlayType('QUINIELA');
    setTopeNumber('05');
    setTopeAmount('500');
    setTopeDate('');
    setShowTopeModal(true);
  };

  const handleSaveTope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupDetail) return;
    const amt = Number(topeAmount);
    if (!amt || amt <= 0) {
      alert('Ingrese un monto límite válido.');
      return;
    }

    try {
      const lot = lotteries.find((l) => l.id === topeLotteryId);
      if (editingTope) {
        await api.updateGroupTope(editingTope.id, {
          terminalCode: topeTermCode || undefined,
          lotteryId: topeLotteryId || undefined,
          lotteryName: lot?.name,
          playType: topePlayType,
          number: topeNumber.trim(),
          maxAmount: amt,
          date: topeDate || undefined,
          active: true,
        });
      } else {
        await api.createGroupTope({
          groupId: selectedGroupDetail.id,
          consorcioId: selectedGroupDetail.consorcioId,
          terminalCode: topeTermCode || undefined,
          lotteryId: topeLotteryId || undefined,
          lotteryName: lot?.name,
          playType: topePlayType,
          number: topeNumber.trim(),
          maxAmount: amt,
          date: topeDate || undefined,
          active: true,
        });
      }
      setShowTopeModal(false);
      loadGroupDetails(selectedGroupDetail);
      setSuccessMsg('Tope de venta registrado correctamente.');
    } catch (err: any) {
      alert(err.message || 'Error guardando tope de venta');
    }
  };

  const handleDeleteTope = async (topeId: string) => {
    if (!confirm('¿Eliminar este tope de venta?')) return;
    try {
      await api.deleteGroupTope(topeId);
      if (selectedGroupDetail) {
        loadGroupDetails(selectedGroupDetail);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Test live tope calculation
  const handleTestTope = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingTope(true);
    setSimResult(null);
    try {
      const res = await api.checkTope({
        lotteryId: simLottery,
        number: simNumber.trim(),
        playType: simType,
        terminalId: simTerminal || undefined,
        requestedAmount: Number(simAmount) || 0,
      });
      setSimResult(res);
    } catch (err: any) {
      setSimResult({ allowed: false, reason: err.message });
    } finally {
      setTestingTope(false);
    }
  };

  // Prize Plan creation
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDesc('');
    setPlanQ1('60');
    setPlanQ2('8');
    setPlanQ3('4');
    setPlanP12('1000');
    setPlanP13('1000');
    setPlanP23('100');
    setPlanT3('20000');
    setPlanT2('100');
    setPlanSP('3000');
    setPlanSPInv(true);
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      alert('Nombre del plan requerido.');
      return;
    }

    try {
      const planData: Partial<PrizePlan> = {
        name: planName.trim(),
        description: planDesc.trim(),
        consorcioId: selectedConsorcioId,
        quiniela_primera: Number(planQ1),
        quiniela_segunda: Number(planQ2),
        quiniela_tercera: Number(planQ3),
        pale_primera_segunda: Number(planP12),
        pale_primera_tercera: Number(planP13),
        pale_segunda_tercera: Number(planP23),
        tripleta_tres: Number(planT3),
        tripleta_dos: Number(planT2),
        super_pale: Number(planSP),
        super_pale_allow_inverse: planSPInv,
      };

      if (editingPlan) {
        await api.updatePrizePlan(editingPlan.id, planData);
        setSuccessMsg(`Plan "${planName}" actualizado.`);
      } else {
        await api.createPrizePlan(planData);
        setSuccessMsg(`Nuevo Plan de Premios "${planName}" creado.`);
      }

      setShowPlanModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error guardando plan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Breadcrumb & Hierarchy visual */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              Estructura Jerárquica
            </span>
            <span className="text-xs text-neutral-400">
              Súper Admin → Consorcio → Admin → <strong className="text-indigo-900">Grupos</strong> → Terminales
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Gestión y Control de Grupos
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Capa de control entre el consorcio y las terminales: define <strong className="text-neutral-700">permisos delegados</strong>, <strong className="text-neutral-700">planes de premios</strong> y <strong className="text-neutral-700">topes de venta</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {user.role === 'SUPER_ADMIN' && consorcios.length > 0 && (
            <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
              <Building2 className="w-4 h-4 text-neutral-500" />
              <span className="font-semibold text-neutral-600">Consorcio:</span>
              <select
                value={selectedConsorcioId}
                onChange={(e) => setSelectedConsorcioId(e.target.value)}
                className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-bold text-neutral-800 focus:outline-none"
              >
                {consorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
            <button
              onClick={() => setActiveSubTab('GROUPS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeSubTab === 'GROUPS'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🏢 Grupos ({groups.length})
            </button>
            <button
              onClick={() => setActiveSubTab('PLANS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeSubTab === 'PLANS'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🏆 Planes de Premios ({prizePlans.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('AUDIT');
                api.getGroupAuditLogs(undefined, selectedConsorcioId).then(setGroupAuditLogs);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeSubTab === 'AUDIT'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              📜 Historial de Cambios
            </button>
          </div>

          <button
            onClick={handleOpenCreateGroup}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + CREAR GRUPO
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 font-bold hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {/* Sub-tab 1: GROUPS LIST & SUMMARY CARDS (Requirement 21) */}
      {activeSubTab === 'GROUPS' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-xs text-neutral-500">
              Cargando grupos y configuraciones...
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800">No hay grupos configurados todavía</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Crea un grupo para agrupar terminales, delegar permisos limitados a tu rol de admin, aplicar tablas de premios independientes y topes automáticos.
              </p>
              <button
                onClick={handleOpenCreateGroup}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Grupo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => {
                const plan = prizePlans.find((p) => p.id === group.prizePlanId);
                const activePermsCount = Object.values(group.permissions || {}).filter(Boolean).length;
                const assignedTerminals = terminals.filter(
                  (t) => (group.terminalIds || []).includes(t.id) || t.groupId === group.id
                );

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3 bg-gradient-to-r from-neutral-50 to-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-neutral-900 uppercase tracking-tight">
                            {group.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              group.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                            }`}
                          >
                            {group.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                          {group.description || 'Sin descripción adicional'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditGroup(group)}
                          title="Editar grupo"
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          title="Eliminar grupo"
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Resumen de Configuración (Requirement 21) */}
                    <div className="p-4 space-y-3 flex-1 text-xs">
                      {/* Metric 1: Terminales */}
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-neutral-400" />
                          Terminales asignadas:
                        </span>
                        <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                          {assignedTerminals.length} bancas
                        </span>
                      </div>

                      {/* Metric 2: Plan de premios */}
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          Plan de premios:
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-neutral-900 block">
                            {plan?.name || group.prizePlanName || 'Plan A'}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Quiniela: {plan?.quiniela_primera || 60} / {plan?.quiniela_segunda || 8} / {plan?.quiniela_tercera || 4}
                          </span>
                        </div>
                      </div>

                      {/* Metric 3: Tope general */}
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          Tope general diario:
                        </span>
                        <span className="font-bold font-mono text-emerald-700">
                          {group.generalDailyCap
                            ? `RD$${group.generalDailyCap.toLocaleString()}`
                            : 'Sin tope general'}
                        </span>
                      </div>

                      {/* Metric 4: Permisos delegados */}
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" />
                          Permisos delegados:
                        </span>
                        <span className="font-semibold text-neutral-700 bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-100 text-[11px]">
                          {activePermsCount} funciones activas
                        </span>
                      </div>

                      {/* Assigned Terminal Badges Preview */}
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">Terminales en este grupo:</span>
                        <div className="flex flex-wrap gap-1">
                          {assignedTerminals.slice(0, 5).map((t) => (
                            <span
                              key={t.id}
                              className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px] font-mono text-neutral-700"
                            >
                              #{t.code}
                            </span>
                          ))}
                          {assignedTerminals.length > 5 && (
                            <span className="px-1.5 py-0.5 rounded bg-neutral-200 text-[10px] font-semibold text-neutral-600">
                              +{assignedTerminals.length - 5} más
                            </span>
                          )}
                          {assignedTerminals.length === 0 && (
                            <span className="text-[11px] text-neutral-400 italic">Ninguna asignada</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (Requirement 21) */}
                    <div className="p-3 bg-neutral-50 border-t border-neutral-200 grid grid-cols-3 gap-1 text-[11px]">
                      <button
                        onClick={() => {
                          loadGroupDetails(group);
                          setDetailModalTab('PERMISSIONS');
                        }}
                        className="p-1.5 text-center font-medium bg-white hover:bg-neutral-100 text-neutral-700 rounded border border-neutral-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Shield className="w-3 h-3 text-indigo-600" />
                        <span>Permisos</span>
                      </button>
                      <button
                        onClick={() => {
                          loadGroupDetails(group);
                          setDetailModalTab('TOPES');
                        }}
                        className="p-1.5 text-center font-medium bg-white hover:bg-neutral-100 text-neutral-700 rounded border border-neutral-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Sliders className="w-3 h-3 text-red-600" />
                        <span>Topes</span>
                      </button>
                      <button
                        onClick={() => {
                          loadGroupDetails(group);
                          setDetailModalTab('SUMMARY');
                        }}
                        className="p-1.5 text-center font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Detalles</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: INDEPENDENT PRIZE PLANS (Requirement 3, 4, 5) */}
      {activeSubTab === 'PLANS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Planes de Premios Independientes</h2>
              <p className="text-xs text-neutral-500">
                Cada grupo puede utilizar una tabla de premios diferente (ej: Grupo Centro → Plan A, Grupo Norte → Plan B).
              </p>
            </div>
            <button
              onClick={handleOpenCreatePlan}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + Crear Plan de Premios
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prizePlans.map((plan) => {
              const groupsUsing = groups.filter((g) => g.prizePlanId === plan.id);
              return (
                <div key={plan.id} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900">{plan.name}</span>
                        {plan.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">
                            Por Defecto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{plan.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanName(plan.name);
                        setPlanDesc(plan.description || '');
                        setPlanQ1(String(plan.quiniela_primera));
                        setPlanQ2(String(plan.quiniela_segunda));
                        setPlanQ3(String(plan.quiniela_tercera));
                        setPlanP12(String(plan.pale_primera_segunda));
                        setPlanP13(String(plan.pale_primera_tercera));
                        setPlanP23(String(plan.pale_segunda_tercera));
                        setPlanT3(String(plan.tripleta_tres));
                        setPlanT2(String(plan.tripleta_dos));
                        setPlanSP(String(plan.super_pale));
                        setPlanSPInv(plan.super_pale_allow_inverse);
                        setShowPlanModal(true);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Payouts Table */}
                  <div className="bg-neutral-50 rounded-lg p-2.5 text-xs space-y-2 border border-neutral-200">
                    <div>
                      <span className="font-bold text-[11px] text-neutral-700 uppercase block mb-1">
                        🎯 Quiniela (Por cada RD$1 jugado)
                      </span>
                      <div className="grid grid-cols-3 gap-1 text-center font-mono">
                        <div className="bg-white p-1 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block">1ra</span>
                          <span className="font-bold text-neutral-900">RD${plan.quiniela_primera}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block">2da</span>
                          <span className="font-bold text-neutral-900">RD${plan.quiniela_segunda}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block">3ra</span>
                          <span className="font-bold text-neutral-900">RD${plan.quiniela_tercera}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-neutral-200 grid grid-cols-2 gap-1">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Palé (1-2 / 1-3):</span>
                        <span className="font-bold font-mono text-neutral-800">RD${plan.pale_primera_segunda.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Palé (2-3):</span>
                        <span className="font-bold font-mono text-neutral-800">RD${plan.pale_segunda_tercera.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Tripleta (3 hits):</span>
                        <span className="font-bold font-mono text-neutral-800">RD${plan.tripleta_tres.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Súper Palé:</span>
                        <span className="font-bold font-mono text-indigo-700">RD${plan.super_pale.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                    <span>Grupos asociados:</span>
                    <span className="font-bold text-neutral-800">
                      {groupsUsing.length > 0
                        ? groupsUsing.map((g) => g.name).join(', ')
                        : 'Ninguno asignado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tab 3: AUDIT TRAIL / HISTORIAL (Requirement 19 & 20) */}
      {activeSubTab === 'AUDIT' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Historial de Modificaciones y Auditoría
              </h2>
              <p className="text-xs text-neutral-500">
                Registro inmutable de cambios en permisos, planes de premios, topes y asignación de terminales.
              </p>
            </div>
            <button
              onClick={() => api.getGroupAuditLogs(undefined, selectedConsorcioId).then(setGroupAuditLogs)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              🔄 Actualizar registros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-y border-neutral-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Grupo</th>
                  <th className="py-2.5 px-3">Detalle del Cambio</th>
                  <th className="py-2.5 px-3 text-right">Anterior → Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {groupAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 text-neutral-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-DO')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-900 whitespace-nowrap">
                      {log.groupName}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600">
                      {log.details}
                      {log.terminalCode && <span className="ml-1 font-mono text-[11px] text-neutral-500">(Term: {log.terminalCode})</span>}
                      {log.lotteryName && <span className="ml-1 text-[11px] text-neutral-500">[{log.lotteryName}]</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-800 whitespace-nowrap">
                      {log.oldValue && <span className="line-through text-neutral-400 mr-1">{log.oldValue}</span>}
                      {log.newValue && <span className="font-bold text-emerald-700">{log.newValue}</span>}
                      {!log.oldValue && !log.newValue && '—'}
                    </td>
                  </tr>
                ))}
                {groupAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No hay registros de auditoría aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREAR / EDITAR GRUPO (Requirement 1, 2) */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-neutral-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-300" />
                  {editingGroup ? `Editar Grupo: ${editingGroup.name}` : 'Crear Nuevo Grupo de Terminales'}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Sub-unidad del consorcio para control de permisos, premios y topes.
                </p>
              </div>
              <button onClick={() => setShowGroupModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveGroup} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-neutral-800">Nombre del Grupo *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ej: Grupo Centro"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Estado</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo (Suspendido)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="font-bold text-neutral-800">Descripción</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="ej: Bancas zona centro y colonial"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Plan de Premios & Tope General */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Plan de Premios Asignado *
                  </label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs bg-white font-semibold text-neutral-900 focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {prizePlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Quiniela {p.quiniela_primera}/{p.quiniela_segunda}/{p.quiniela_tercera})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Las terminales de este grupo calcularán sus ganancias con esta tabla.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Tope General Diario del Grupo (RD$)
                  </label>
                  <input
                    type="number"
                    value={formGeneralCap}
                    onChange={(e) => setFormGeneralCap(e.target.value)}
                    placeholder="ej: 100000"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs bg-white font-mono font-bold text-neutral-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Límite acumulado diario entre todas las terminales del grupo.
                  </p>
                </div>
              </div>

              {/* SECCIÓN 2: PERMISOS DEL GRUPO (DYNAMIC FILTERING - REGLA OBLIGATORIA) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Permisos y Funciones del Grupo
                  </label>
                  <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                    🔒 Filtro Dinámico de Herencia
                  </span>
                </div>

                {/* Information banner explaining the inheritance rule */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Regla Obligatoria:</strong> El grupo NO puede tener más permisos que su Administrador. Si el Súper Admin no le ha otorgado un permiso a su consorcio, dicha opción aparece bloqueada o filtrada automáticamente.
                  </p>
                </div>

                {/* Filtered Checkboxes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {ALL_PERMISSION_KEYS.map(({ key, label, desc }) => {
                    const adminHasPermission = adminPermissions[key] === true;
                    const isChecked = !!formPermissions[key] && adminHasPermission;

                    return (
                      <div
                        key={key}
                        onClick={() => {
                          if (adminHasPermission) {
                            setFormPermissions((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }));
                          }
                        }}
                        className={`p-3 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer select-none ${
                          !adminHasPermission
                            ? 'bg-neutral-50 border-neutral-200 opacity-50 cursor-not-allowed'
                            : isChecked
                            ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200'
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!adminHasPermission}
                            onChange={() => {}} // Handled by div click
                            className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-900 text-xs">{label}</span>
                            {!adminHasPermission && (
                              <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                                <Lock className="w-3 h-3" /> No otorgado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: ASIGNACIÓN DE TERMINALES AL GRUPO */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-neutral-600" />
                    Terminales Asignadas al Grupo ({formTerminals.length} seleccionadas)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTerminals(terminals.map((t) => t.id))}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Seleccionar Todas
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormTerminals([])}
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 font-semibold"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  {terminals.map((term) => {
                    const isSelected = formTerminals.includes(term.id);
                    const isAssignedToOther =
                      term.groupId &&
                      (!editingGroup || term.groupId !== editingGroup.id);

                    return (
                      <div
                        key={term.id}
                        onClick={() => handleToggleTerminal(term.id)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs">#{term.code}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-[11px] truncate block ${isSelected ? 'text-indigo-100' : 'text-neutral-500'}`}>
                          {term.name}
                        </span>
                        {isAssignedToOther && !isSelected && (
                          <span className="text-[9px] text-amber-600 font-bold block mt-0.5">
                            En otro grupo
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {terminals.length === 0 && (
                    <div className="col-span-4 text-center py-4 text-neutral-400">
                      No hay terminales creadas en este consorcio.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETALLES, TOPES Y AUDITORÍA DEL GRUPO (Requirement 21) */}
      {selectedGroupDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold uppercase tracking-tight">
                    {selectedGroupDetail.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Consorcio #{selectedConsorcioId}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  {selectedGroupDetail.description || 'Configuración y reglas activas del grupo'}
                </p>
              </div>
              <button onClick={() => setSelectedGroupDetail(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation bar inside drawer */}
            <div className="flex items-center gap-1 px-6 py-2.5 bg-neutral-100 border-b border-neutral-200 text-xs overflow-x-auto no-scrollbar">
              <button
                onClick={() => setDetailModalTab('SUMMARY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  detailModalTab === 'SUMMARY'
                    ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                📊 Resumen
              </button>
              <button
                onClick={() => setDetailModalTab('TOPES')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  detailModalTab === 'TOPES'
                    ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                🛑 Topes de Venta ({groupTopes.length})
              </button>
              <button
                onClick={() => setDetailModalTab('PERMISSIONS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  detailModalTab === 'PERMISSIONS'
                    ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                🔒 Permisos Delegados
              </button>
              <button
                onClick={() => setDetailModalTab('PRIZES')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  detailModalTab === 'PRIZES'
                    ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                🏆 Plan de Premios
              </button>
              <button
                onClick={() => setDetailModalTab('TERMINALS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  detailModalTab === 'TERMINALS'
                    ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                📱 Terminales ({selectedGroupDetail.terminalIds.length})
              </button>
              <button
                onClick={() => setDetailModalTab('HISTORY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  detailModalTab === 'HISTORY'
                    ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                📜 Auditoría ({groupAuditLogs.length})
              </button>
            </div>

            {/* Modal Body per tab */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {/* TAB 1: SUMMARY */}
              {detailModalTab === 'SUMMARY' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Terminales:</span>
                      <span className="text-xl font-bold font-mono text-neutral-900">
                        {selectedGroupDetail.terminalIds.length}
                      </span>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Plan de Premios:</span>
                      <span className="text-base font-bold text-amber-700 block truncate">
                        {prizePlans.find((p) => p.id === selectedGroupDetail.prizePlanId)?.name || 'Plan A'}
                      </span>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Tope Diario General:</span>
                      <span className="text-base font-bold font-mono text-emerald-700">
                        {selectedGroupDetail.generalDailyCap
                          ? `RD$${selectedGroupDetail.generalDailyCap.toLocaleString()}`
                          : 'Sin tope'}
                      </span>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                      <span className="text-[11px] text-neutral-500 block">Topes Específicos:</span>
                      <span className="text-xl font-bold font-mono text-neutral-900">
                        {groupTopes.length} activos
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                    <h4 className="font-bold text-neutral-900">Herencia de configuraciones en acción:</h4>
                    <p className="text-neutral-600 text-xs leading-relaxed">
                      Cualquier ticket emitido por las terminales pertenecientes a este grupo (
                      {selectedGroupDetail.terminalIds
                        .map((tid) => terminals.find((t) => t.id === tid)?.code || tid)
                        .join(', ')}
                      ) utilizará automáticamente la tabla de pagos del <strong>Plan {prizePlans.find((p) => p.id === selectedGroupDetail.prizePlanId)?.name || 'A'}</strong> y respetará los topes configurados tanto para el grupo como para cada terminal.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: TOPES DE VENTA DEL GRUPO (Requirement 6 - 15) */}
              {detailModalTab === 'TOPES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">Topes de Venta del Grupo</h4>
                      <p className="text-neutral-500 text-xs">
                        Límites configurados por grupo, terminal, lotería, tipo de jugada y número.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenCreateTope}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Agregar Tope de Venta
                    </button>
                  </div>

                  {/* Topes Table */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Terminal</th>
                          <th className="py-2.5 px-3">Lotería</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3">Número</th>
                          <th className="py-2.5 px-3">Tope Máximo</th>
                          <th className="py-2.5 px-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {groupTopes.map((tope) => (
                          <tr key={tope.id} className="hover:bg-neutral-50">
                            <td className="py-2.5 px-3 font-semibold text-neutral-900">
                              {tope.terminalCode ? `Terminal #${tope.terminalCode}` : 'Todas las del grupo'}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-700">
                              {tope.lotteryName || 'Todas las loterías'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700">
                                {tope.playType || 'TODOS'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                              {tope.number || 'Todos los números'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                              RD${tope.maxAmount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteTope(tope.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Eliminar tope"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {groupTopes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-neutral-400">
                              No hay topes específicos configurados en este grupo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Simulator / Verificador de Topes en Vivo (Requirement 8, 9, 15) */}
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-neutral-900 text-xs">
                        Verificador de Disponibilidad y Bloqueo de Topes en Tiempo Real
                      </span>
                    </div>

                    <form onSubmit={handleTestTope} className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-600">Terminal</label>
                        <select
                          value={simTerminal}
                          onChange={(e) => setSimTerminal(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="">Cualquiera</option>
                          {terminals.map((t) => (
                            <option key={t.id} value={t.code}>
                              #{t.code}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-600">Lotería</label>
                        <select
                          value={simLottery}
                          onChange={(e) => setSimLottery(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs"
                        >
                          {lotteries.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-600">Tipo</label>
                        <select
                          value={simType}
                          onChange={(e) => setSimType(e.target.value as any)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="QUINIELA">Quiniela</option>
                          <option value="PALE">Palé</option>
                          <option value="TRIPLETA">Tripleta</option>
                          <option value="SUPER_PALE">Súper Palé</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-600">Número</label>
                        <input
                          type="text"
                          value={simNumber}
                          onChange={(e) => setSimNumber(e.target.value)}
                          placeholder="ej: 05"
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-neutral-600">Monto (RD$)</label>
                        <input
                          type="number"
                          value={simAmount}
                          onChange={(e) => setSimAmount(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={testingTope}
                          className="w-full py-1 px-3 bg-neutral-900 text-white font-bold rounded text-xs hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {testingTope ? '...' : 'Probar Tope'}
                        </button>
                      </div>
                    </form>

                    {simResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          simResult.allowed
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {simResult.allowed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>
                            {simResult.allowed
                              ? `Venta Permitida. Tope disponible restante: RD$${simResult.remaining.toLocaleString()}`
                              : simResult.reason}
                          </span>
                        </div>
                        {simResult.remaining === 0 && (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                            🔴 TOPE AGOTADO
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PERMISOS DELEGADOS */}
              {detailModalTab === 'PERMISSIONS' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-900 text-sm">Permisos Otorgados a este Grupo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_PERMISSION_KEYS.map(({ key, label, desc }) => {
                      const isGranted = !!selectedGroupDetail.permissions[key];
                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            isGranted ? 'bg-indigo-50/50 border-indigo-200' : 'bg-neutral-50 border-neutral-200 opacity-60'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-neutral-800 text-xs block">{label}</span>
                            <span className="text-[10px] text-neutral-500">{desc}</span>
                          </div>
                          {isGranted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Habilitado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-600">
                              Deshabilitado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: PLAN DE PREMIOS */}
              {detailModalTab === 'PRIZES' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-900 text-sm">Plan de Premios Asociado</h4>
                  {(() => {
                    const plan = prizePlans.find((p) => p.id === selectedGroupDetail.prizePlanId);
                    if (!plan) return <p className="text-neutral-500">Plan no encontrado</p>;
                    return (
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-bold text-neutral-900">{plan.name}</span>
                            <p className="text-xs text-neutral-500">{plan.description}</p>
                          </div>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                            Activo para este grupo
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center font-mono">
                          <div className="bg-white p-2 rounded-lg border border-neutral-200">
                            <span className="text-xs text-neutral-400 block">Quiniela en 1ra</span>
                            <span className="text-lg font-bold text-neutral-900">RD${plan.quiniela_primera}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-neutral-200">
                            <span className="text-xs text-neutral-400 block">Quiniela en 2da</span>
                            <span className="text-lg font-bold text-neutral-900">RD${plan.quiniela_segunda}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-neutral-200">
                            <span className="text-xs text-neutral-400 block">Quiniela en 3ra</span>
                            <span className="text-lg font-bold text-neutral-900">RD${plan.quiniela_tercera}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 5: TERMINALES */}
              {detailModalTab === 'TERMINALS' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-900 text-sm">
                    Terminales Pertenecientes al Grupo ({selectedGroupDetail.terminalIds.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedGroupDetail.terminalIds.map((tid) => {
                      const term = terminals.find((t) => t.id === tid || t.code === tid);
                      return (
                        <div key={tid} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <span className="font-mono font-bold text-xs text-neutral-900 block">
                            #{term?.code || tid}
                          </span>
                          <span className="text-xs text-neutral-600 block truncate">
                            {term?.name || 'Banca'}
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-1">
                            {term?.location || 'Sucursal'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: AUDIT LOGS */}
              {detailModalTab === 'HISTORY' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-900 text-sm">Historial de Auditoría de este Grupo</h4>
                  <div className="space-y-2">
                    {groupAuditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-900">{log.action}</span>
                          <span className="text-neutral-400 font-mono text-[10px]">
                            {new Date(log.timestamp).toLocaleString('es-DO')}
                          </span>
                        </div>
                        <p className="text-neutral-600 mt-1">{log.details}</p>
                        <span className="text-[10px] text-indigo-700 font-semibold block mt-1">
                          Por: {log.userName}
                        </span>
                      </div>
                    ))}
                    {groupAuditLogs.length === 0 && (
                      <p className="text-neutral-400 text-center py-6">Sin registros de auditoría aún.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedGroupDetail(null);
                  handleOpenEditGroup(selectedGroupDetail);
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-indigo-200"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Configuración del Grupo
              </button>
              <button
                onClick={() => setSelectedGroupDetail(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AGREGAR TOPE DE VENTA ESPECÍFICO (Requirement 6 - 13) */}
      {showTopeModal && selectedGroupDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-600" />
                Nuevo Tope de Venta para {selectedGroupDetail.name}
              </h3>
              <button onClick={() => setShowTopeModal(false)} className="text-neutral-400 hover:text-neutral-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTope} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700">Terminal (Opcional)</label>
                <select
                  value={topeTermCode}
                  onChange={(e) => setTopeTermCode(e.target.value)}
                  className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="">Todas las terminales del grupo</option>
                  {selectedGroupDetail.terminalIds.map((tid) => {
                    const t = terminals.find((x) => x.id === tid || x.code === tid);
                    return (
                      <option key={tid} value={t?.code || tid}>
                        Terminal #{t?.code || tid} - {t?.name || 'Banca'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Lotería</label>
                  <select
                    value={topeLotteryId}
                    onChange={(e) => setTopeLotteryId(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="">Todas las loterías</option>
                    {lotteries.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Tipo de Jugada</label>
                  <select
                    value={topePlayType}
                    onChange={(e) => setTopePlayType(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs bg-white font-semibold"
                  >
                    <option value="QUINIELA">Quiniela</option>
                    <option value="PALE">Palé</option>
                    <option value="TRIPLETA">Tripleta</option>
                    <option value="SUPER_PALE">Súper Palé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Número</label>
                  <input
                    type="text"
                    value={topeNumber}
                    onChange={(e) => setTopeNumber(e.target.value)}
                    placeholder="ej: 05 o 05-10"
                    className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-neutral-400">Quiniela: 05 · Palé: 05-10</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Tope Máximo (RD$) *</label>
                  <input
                    type="number"
                    value={topeAmount}
                    onChange={(e) => setTopeAmount(e.target.value)}
                    placeholder="ej: 500"
                    className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopeModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded text-neutral-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold shadow-xs"
                >
                  Guardar Tope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREAR / EDITAR PLAN DE PREMIOS (Requirement 3, 4, 5) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                {editingPlan ? `Editar Plan: ${editingPlan.name}` : 'Crear Plan de Premios Independiente'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="text-neutral-400 hover:text-neutral-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Nombre del Plan *</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="ej: Plan B"
                    className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Descripción</label>
                  <input
                    type="text"
                    value={planDesc}
                    onChange={(e) => setPlanDesc(e.target.value)}
                    placeholder="ej: Tabla 70/8/4"
                    className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Quiniela */}
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-1.5">
                <span className="font-bold text-[11px] text-neutral-700 uppercase block">
                  🎯 Pagos de Quiniela (x RD$1)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500">1ra (Primera)</label>
                    <input
                      type="number"
                      value={planQ1}
                      onChange={(e) => setPlanQ1(e.target.value)}
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500">2da (Segunda)</label>
                    <input
                      type="number"
                      value={planQ2}
                      onChange={(e) => setPlanQ2(e.target.value)}
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500">3ra (Tercera)</label>
                    <input
                      type="number"
                      value={planQ3}
                      onChange={(e) => setPlanQ3(e.target.value)}
                      className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Pale & Tripleta & Super Pale */}
              <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <div>
                  <label className="text-[10px] text-neutral-600 font-semibold">Palé (1ra y 2da)</label>
                  <input
                    type="number"
                    value={planP12}
                    onChange={(e) => setPlanP12(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-600 font-semibold">Palé (2da y 3ra)</label>
                  <input
                    type="number"
                    value={planP23}
                    onChange={(e) => setPlanP23(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-600 font-semibold">Tripleta (3 aciertos)</label>
                  <input
                    type="number"
                    value={planT3}
                    onChange={(e) => setPlanT3(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-600 font-semibold">Súper Palé (2 Sorteos)</label>
                  <input
                    type="number"
                    value={planSP}
                    onChange={(e) => setPlanSP(e.target.value)}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded text-neutral-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-xs"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
