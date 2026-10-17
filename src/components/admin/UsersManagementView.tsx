import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Shield,
  Building,
  Store,
  CheckCircle,
} from 'lucide-react';
import { User, UserRole, UserStatus, Consorcio, Terminal } from '../../types';
import { Card, Button, Badge, Modal, Input } from '../design-system';

interface UsersManagementViewProps {
  users: User[];
  consorcios?: Consorcio[];
  terminals?: Terminal[];
  currentUserRole?: UserRole;
  onSaveUser: (userData: Partial<User> & { password?: string }) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onToggleStatus: (userId: string, newStatus: UserStatus) => Promise<void>;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  consorcios = [],
  terminals = [],
  currentUserRole = 'SUPER_ADMIN',
  onSaveUser,
  onDeleteUser,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [consorcioFilter, setConsorcioFilter] = useState<string>('ALL');
  const [bancaFilter, setBancaFilter] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'TERMINAL' as UserRole,
    status: 'ACTIVE' as UserStatus,
    terminalCode: '',
    bancaName: '',
    consorcioId: '',
    phone: '',
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'TERMINAL',
      status: 'ACTIVE',
      terminalCode: '',
      bancaName: '',
      consorcioId: consorcios[0]?.id || '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role,
      status: user.status || (user.active ? 'ACTIVE' : 'INACTIVE'),
      terminalCode: user.terminalCode || '',
      bancaName: user.bancaName || '',
      consorcioId: user.consorcioId || '',
      phone: user.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveUser({
        ...(editingUser ? { id: editingUser.id } : {}),
        username: formData.username,
        name: formData.name,
        role: formData.role,
        status: formData.status,
        active: formData.status === 'ACTIVE',
        terminalCode: formData.terminalCode || undefined,
        bancaName: formData.bancaName || undefined,
        consorcioId: formData.consorcioId || undefined,
        phone: formData.phone || undefined,
        password: formData.password || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error guardando usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.terminalCode && u.terminalCode.toLowerCase().includes(q));

      // Role
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      // Status
      const userStatus = u.status || (u.active ? 'ACTIVE' : 'INACTIVE');
      const matchStatus = statusFilter === 'ALL' || userStatus === statusFilter;

      // Consorcio
      const matchConsorcio =
        consorcioFilter === 'ALL' || u.consorcioId === consorcioFilter;

      // Banca
      const matchBanca =
        bancaFilter === 'ALL' ||
        u.terminalCode === bancaFilter ||
        u.bancaName === bancaFilter;

      return matchSearch && matchRole && matchStatus && matchConsorcio && matchBanca;
    });
  }, [users, searchQuery, roleFilter, statusFilter, consorcioFilter, bancaFilter]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="purple">Súper Admin</Badge>;
      case 'ADMIN':
        return <Badge variant="blue">Administrador</Badge>;
      case 'SUPERVISOR':
        return <Badge variant="amber">Supervisor</Badge>;
      case 'COLECTOR':
        return <Badge variant="blue">Colector</Badge>;
      case 'TERMINAL':
        return <Badge variant="active">Banca</Badge>;
      case 'MONITOREO':
        return <Badge variant="inactive">Monitoreo</Badge>;
      default:
        return <Badge variant="inactive">{role}</Badge>;
    }
  };

  const getStatusBadge = (status?: UserStatus, active?: boolean) => {
    const s = status || (active ? 'ACTIVE' : 'INACTIVE');
    switch (s) {
      case 'ACTIVE':
        return <Badge variant="active">Activo</Badge>;
      case 'INACTIVE':
        return <Badge variant="inactive">Inactivo</Badge>;
      case 'BLOCKED':
        return <Badge variant="blocked">Bloqueado</Badge>;
      case 'PENDING':
        return <Badge variant="pending">Pendiente</Badge>;
      default:
        return <Badge variant="inactive">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestión de Usuarios
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control de accesos, roles y permisos de consorcios y bancas
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={<UserPlus className="w-4 h-4" />}
        >
          + Nuevo Usuario
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="default">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuario por nombre o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="SUPER_ADMIN">Súper Admin</option>
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="COLECTOR">Colector</option>
            <option value="TERMINAL">Banca</option>
            <option value="MONITOREO">Monitoreo</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="PENDING">Pendiente</option>
          </select>

          {/* Consorcio Filter */}
          <select
            value={consorcioFilter}
            onChange={(e) => setConsorcioFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos los Consorcios</option>
            {consorcios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card variant="default" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nombre / Usuario</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Banca / Terminal</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron usuarios coincidentes.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const userStatus = u.status || (u.active ? 'ACTIVE' : 'INACTIVE');
                  const isBlocked = userStatus === 'BLOCKED';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {String(idx + 1).padStart(3, '0')}
                      </td>

                      {/* Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                      {/* Banca */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {u.terminalCode ? (
                          <span className="font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {u.terminalCode} {u.bancaName ? `· ${u.bancaName}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">{getStatusBadge(u.status, u.active)}</td>

                      {/* Actions: Edit, Delete, View, Lock/Unlock */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Lock / Unlock */}
                          <button
                            onClick={() =>
                              onToggleStatus(u.id, isBlocked ? 'ACTIVE' : 'BLOCKED')
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              isBlocked
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                            }`}
                            title={isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                          >
                            {isBlocked ? (
                              <Unlock className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar usuario ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </Card>

      {/* Modal: Crear / Editar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        subtitle="Asignación de credenciales, roles y bancas"
        icon={<Users className="w-5 h-5" />}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              placeholder="Ej: María Gómez"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Usuario / Código"
              placeholder="Ej: mgomez o 0008"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              type="password"
              placeholder="••••••••"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Input
              label="Teléfono / Contacto"
              placeholder="(809) 555-0101"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Rol en el Sistema
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm"
              >
                <option value="TERMINAL">Usuario de Banca (Cajero)</option>
                <option value="COLECTOR">Colector</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrador / Máster</option>
                <option value="MONITOREO">Monitoreo (Solo lectura)</option>
                <option value="SUPER_ADMIN">Súper Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as UserStatus })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="BLOCKED">Bloqueado</option>
                <option value="PENDING">Pendiente</option>
              </select>
            </div>
          </div>

          {/* Conditional Banca assignment for terminal/banca users */}
          {(formData.role === 'TERMINAL' || formData.role === 'COLECTOR') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Input
                label="Código de Terminal / Banca"
                placeholder="Ej: 0004 o 08"
                value={formData.terminalCode}
                onChange={(e) =>
                  setFormData({ ...formData, terminalCode: e.target.value })
                }
              />
              <Input
                label="Nombre de la Banca"
                placeholder="Ej: Banca Salomón #08"
                value={formData.bancaName}
                onChange={(e) => setFormData({ ...formData, bancaName: e.target.value })}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Modal: Ver Detalles de Usuario */}
      {viewingUser && (
        <Modal
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title={`Detalles de ${viewingUser.name}`}
          icon={<Eye className="w-5 h-5" />}
          footer={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewingUser(null)}
            >
              Cerrar
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div>
                <span className="text-slate-400 font-bold uppercase">Usuario:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {viewingUser.username}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase">Rol:</span>
                <div className="mt-1">{getRoleBadge(viewingUser.role)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase">Estado:</span>
                <div className="mt-1">
                  {getStatusBadge(viewingUser.status, viewingUser.active)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase">Terminal:</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {viewingUser.terminalCode || 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
              <p className="font-bold text-blue-700 dark:text-blue-300">
                Seguridad & Permisos
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Todas las acciones de este usuario quedan registradas en la bitácora de
                auditoría criptográfica del consorcio.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
