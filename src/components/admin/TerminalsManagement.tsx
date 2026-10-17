import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Terminal, User, DeviceRegistration } from '../../types/index';
import {
  Plus,
  Edit2,
  Shield,
  CheckCircle2,
  XCircle,
  DollarSign,
  Eye,
  UserPlus,
  Key,
  Smartphone,
  Monitor,
  Unlink,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface TerminalsManagementProps {
  user?: User;
}

export const TerminalsManagement: React.FC<TerminalsManagementProps> = ({ user }) => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [consorcios, setConsorcios] = useState<any[]>([]);
  const [selectedConsorcioFilter, setSelectedConsorcioFilter] = useState<string>('ALL');
  const [targetConsorcioId, setTargetConsorcioId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [balanceLimit, setBalanceLimit] = useState('50000');
  const [deviceId, setDeviceId] = useState('');
  const [terminalType, setTerminalType] = useState<'PC' | 'MOVIL'>('PC');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Permission check (Requirement 5: CREAR TERMINALES disabled by default)
  const canCreateTerminals =
    !user ||
    user.role === 'SUPER_ADMIN' ||
    (user as any).permissions?.createTerminals === true;

  const canEditTerminals =
    !user ||
    user.role === 'SUPER_ADMIN' ||
    (user as any).permissions?.editTerminals !== false;

  const canDeactivateTerminals =
    !user ||
    user.role === 'SUPER_ADMIN' ||
    (user as any).permissions?.disableTerminals !== false;

  const fetchTerminalsAndDevices = async () => {
    setLoading(true);
    try {
      const isSuper = user?.role === 'SUPER_ADMIN';
      const [tData, dData, cData] = await Promise.all([
        api.getTerminals(isSuper && selectedConsorcioFilter !== 'ALL' ? selectedConsorcioFilter : undefined),
        api.getDevices().catch(() => [] as DeviceRegistration[]),
        isSuper ? api.getConsorcios().catch(() => []) : Promise.resolve([]),
      ]);
      setTerminals(tData);
      setDevices(dData);
      if (cData && cData.length > 0) {
        setConsorcios(cData);
        if (!targetConsorcioId) setTargetConsorcioId(cData[0].id);
      }
    } catch (err: any) {
      console.error('Error cargando datos de terminales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminalsAndDevices();
  }, [selectedConsorcioFilter]);

  const handleOpenCreate = () => {
    if (!canCreateTerminals) {
      alert('La creación de terminales no está autorizada para este consorcio. El Súper Admin debe habilitar el permiso "Crear terminales".');
      return;
    }
    setEditingTerminal(null);
    setCode(String(terminals.length + 1).padStart(4, '0'));
    setName(`Banca Sucursal #${String(terminals.length + 1).padStart(4, '0')}`);
    setLocation('');
    setUsername(String(terminals.length + 1).padStart(4, '0'));
    setPassword('1234');
    setContactPhone('');
    setBalanceLimit('50000');
    setDeviceId('');
    setTerminalType('PC');
    if (consorcios.length > 0 && !targetConsorcioId) {
      setTargetConsorcioId(consorcios[0].id);
    }
    setActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (term: Terminal) => {
    setEditingTerminal(term);
    setCode(term.code);
    setName(term.name);
    setLocation(term.location);
    setUsername(term.username);
    setPassword(''); // leave blank if unchanged
    setContactPhone(term.contactPhone || '');
    setBalanceLimit(String(term.creditLimit !== undefined ? term.creditLimit : (term.balanceLimit || 50000)));
    setDeviceId(term.deviceId || '');
    setTerminalType(term.terminalType || 'PC');
    setActive(term.active);
    setFormError(null);
    setShowModal(true);
  };

  const handleUnbindCurrentDevice = async () => {
    if (!editingTerminal) return;
    if (!confirm(`¿Confirma desvincular el dispositivo "${editingTerminal.deviceId}" de la terminal ${editingTerminal.code}? Esta acción quedará registrada en el historial de seguridad.`)) {
      return;
    }

    setUnlinking(true);
    try {
      await api.unbindDevice(editingTerminal.id);
      setDeviceId('');
      setEditingTerminal({ ...editingTerminal, deviceId: undefined });
      await fetchTerminalsAndDevices();
      alert('Dispositivo desvinculado con éxito. Ahora puede asignar un nuevo ID de dispositivo.');
    } catch (err: any) {
      alert('Error al desvincular dispositivo: ' + err.message);
    } finally {
      setUnlinking(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingTerminal) {
        // Update
        if (!canEditTerminals) {
          throw new Error('No tiene permiso para editar terminales.');
        }
        await api.updateTerminal(editingTerminal.id, {
          name,
          location,
          active,
          creditLimit: Number(balanceLimit),
          balanceLimit: Number(balanceLimit),
          contactPhone,
          deviceId: deviceId.trim() || undefined,
          terminalType,
          passwordPlain: password.trim() ? password.trim() : undefined,
        } as any);
      } else {
        // Create
        if (!canCreateTerminals) {
          throw new Error('La creación de terminales no está autorizada por el Súper Admin.');
        }
        if (!code || !name || !username || !password) {
          setFormError('Código, nombre, usuario y contraseña son requeridos.');
          return;
        }
        await api.createTerminal({
          code,
          name,
          location,
          username,
          password,
          creditLimit: Number(balanceLimit),
          balanceLimit: Number(balanceLimit),
          contactPhone,
          deviceId: deviceId.trim() || undefined,
          terminalType,
          consorcioId: user?.role === 'SUPER_ADMIN' ? (targetConsorcioId || undefined) : undefined,
        });
      }

      setShowModal(false);
      fetchTerminalsAndDevices();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la terminal');
    }
  };

  const handleToggleActive = async (term: Terminal) => {
    if (!canDeactivateTerminals) {
      alert('No tiene permiso para activar o desactivar terminales.');
      return;
    }
    try {
      await api.updateTerminal(term.id, { active: !term.active });
      fetchTerminalsAndDevices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Pending unassigned devices registered in this consorcio
  const pendingDevices = devices.filter((d) => d.status === 'PENDING' || !d.terminalCode);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-neutral-900 tracking-tight uppercase flex items-center gap-2">
            <span>Terminales de Venta</span>
            {!canCreateTerminals && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase font-sans">
                Creación restringida por Súper Admin
              </span>
            )}
          </h2>
          <p className="text-xs text-neutral-500">
            Control de usuarios POS, bloqueo por ID de dispositivo y límites operativos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user?.role === 'SUPER_ADMIN' && consorcios.length > 0 && (
            <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-500 pl-1">Consorcio:</span>
              <select
                value={selectedConsorcioFilter}
                onChange={(e) => setSelectedConsorcioFilter(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-neutral-300 font-bold bg-white text-neutral-800"
              >
                <option value="ALL">Todos los Consorcios</option>
                {consorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {canCreateTerminals ? (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Nueva Terminal</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 text-neutral-500 rounded-xl text-xs font-medium border border-neutral-200">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Creación de terminales deshabilitada</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminals Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase font-black tracking-wider text-[10px] border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                {user?.role === 'SUPER_ADMIN' && <th className="px-4 py-3">Consorcio</th>}
                <th className="px-4 py-3">Nombre de Terminal</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Usuario POS</th>
                <th className="px-4 py-3 text-center">Tipo</th>
                <th className="px-4 py-3 text-right">Límite de Crédito</th>
                <th className="px-4 py-3 text-center">Saldo Disp.</th>
                <th className="px-4 py-3">Dispositivo Autorizado (Hardware)</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {terminals.map((term) => (
                <tr key={term.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-neutral-900">
                    #{term.code}
                  </td>
                  {user?.role === 'SUPER_ADMIN' && (
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-600">
                      {consorcios.find((c) => c.id === term.consorcioId)?.name || term.consorcioId || 'Principal'}
                    </td>
                  )}
                  <td className="px-4 py-3 font-bold text-neutral-800">
                    {term.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {term.location || 'No especificada'}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-700 font-bold">
                    {term.username}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {term.terminalType === 'MOVIL' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>📱 Móvil</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                        <Monitor className="w-3.5 h-3.5 text-blue-600" />
                        <span>💻 PC</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-neutral-800 whitespace-nowrap">
                    RD${(term.creditLimit !== undefined ? term.creditLimit : (term.balanceLimit || 50000)).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                      term.riskLevel === 'EXCEEDED' ? 'bg-rose-100 text-rose-800' :
                      term.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      RD${(term.availableCredit !== undefined ? term.availableCredit : Math.max(0, (term.creditLimit || 50000) - (term.currentSalesToday || 0))).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {term.deviceId ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{term.deviceId}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-sans text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Sin dispositivo asignado</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(term)}
                      disabled={!canDeactivateTerminals}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        term.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${!canDeactivateTerminals ? 'opacity-60 cursor-not-allowed' : ''}`}
                      title={canDeactivateTerminals ? "Haga clic para cambiar estado" : "Sin permiso para desactivar"}
                    >
                      {term.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{term.active ? 'Activa' : 'Inactiva'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenEdit(term)}
                      disabled={!canEditTerminals}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors inline-flex items-center gap-1 ${
                        !canEditTerminals ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal (Requirements 11, 12, 13, 17) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {editingTerminal ? `Editar Terminal #${editingTerminal.code}` : 'Nueva Terminal de Venta'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                  {formError}
                </div>
              )}

              {user?.role === 'SUPER_ADMIN' && !editingTerminal && consorcios.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Consorcio Destino
                  </label>
                  <select
                    value={targetConsorcioId}
                    onChange={(e) => setTargetConsorcioId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-bold bg-neutral-50 text-neutral-900"
                  >
                    {consorcios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (#{c.code}) - Costo: RD${c.costPerTerminal}/mes
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    La terminal pertenecerá a este consorcio y se facturará a su tarifa configurada.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Código de Terminal
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTerminal}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="0001"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono disabled:bg-neutral-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Usuario de Inicio de Sesión
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTerminal}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="0001"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono disabled:bg-neutral-100 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nombre descriptivo / Sucursal
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sucursal Villa Mella #1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-medium"
                />
              </div>

              {/* Selector de Tipo de Terminal (PC vs Móvil) */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-800 flex items-center justify-between">
                  <span>Tipo de Terminal</span>
                  <span className="text-[10px] text-blue-600 font-bold">Interfaz Automática</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTerminalType('PC')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      terminalType === 'PC'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>💻 Versión PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalType('MOVIL')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      terminalType === 'MOVIL'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📱 Versión Móvil</span>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Define qué interfaz cargará automáticamente el cajero: Mostrador PC o Móvil táctil.
                </p>
              </div>

              {/* Requirement 12 & 17: ID DEL DISPOSITIVO & UNBIND */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>ID del Dispositivo Autorizado</span>
                  </label>
                  {editingTerminal?.deviceId && (
                    <button
                      type="button"
                      onClick={handleUnbindCurrentDevice}
                      disabled={unlinking}
                      className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-rose-200 transition-colors"
                      title="Desvincular hardware asignado a esta terminal"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Desvincular Dispositivo</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value.trim().toUpperCase())}
                    placeholder="Ej: 123D123400"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white font-mono font-black text-emerald-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {pendingDevices.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setDeviceId(e.target.value);
                      }}
                      className="px-2 py-2 text-xs rounded-xl border border-emerald-300 bg-white text-neutral-700 font-bold"
                    >
                      <option value="">Dispositivos Detectados...</option>
                      {pendingDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.id} ({d.deviceName || 'Sin nombre'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <p className="text-[10px] text-emerald-800 leading-tight">
                  Este ID bloquea el acceso para que <strong>solamente este dispositivo físico</strong> pueda iniciar sesión en la terminal #{code || '0001'}. Si otro dispositivo intenta ingresar, será rechazado automáticamente por seguridad.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Dirección / Ubicación
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Av. Hermanas Mirabal, Santo Domingo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300"
                />
              </div>

              {/* Límite de Crédito y Control de Riesgo */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Límite de Crédito Operativo (RD$)</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">Control de Riesgo</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[25000, 50000, 75000, 100000, 150000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBalanceLimit(String(amt))}
                      className={`py-1 px-2.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        Number(balanceLimit) === amt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      ${(amt / 1000)}k
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-neutral-400">RD$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={balanceLimit}
                    onChange={(e) => setBalanceLimit(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono font-black"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Controla el monto máximo de ventas diarias que la terminal puede emitir. Al alcanzar el límite, se bloquean las ventas para controlar el riesgo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {editingTerminal ? 'Nueva Contraseña (opcional)' : 'Contraseña de Acceso'}
                  </label>
                  <input
                    type="password"
                    required={!editingTerminal}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingTerminal ? 'Dejar en blanco para no cambiar' : '••••'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(809) 555-0103"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeTerm"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={!canDeactivateTerminals}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="activeTerm" className="text-xs font-bold text-neutral-700">
                  Terminal Activa para Venta de Tickets (Facturable)
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Guardar Terminal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

