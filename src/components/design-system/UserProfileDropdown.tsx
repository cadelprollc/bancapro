import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, Settings, LogOut, ChevronDown } from 'lucide-react';
import { User as UserType } from '../../types';

interface UserProfileDropdownProps {
  user: UserType | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  user,
  onLogout,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Súper Administrador';
      case 'ADMIN':
        return 'Administrador / Máster';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'COLECTOR':
        return 'Colector';
      case 'TERMINAL':
        return 'Usuario de Banca';
      case 'MONITOREO':
        return 'Monitoreo';
      default:
        return 'Usuario';
    }
  };

  const displayName = user?.name || user?.username || 'Admin Principal';
  const roleName = getRoleLabel(user?.role);
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-blue-500/20">
          {initials || 'AD'}
        </div>
        <div className="hidden md:block text-left leading-tight">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
            {displayName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {roleName}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0d172a] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-bold truncate">{displayName}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {roleName}
            </p>
            {user?.consorcioName && (
              <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                {user.consorcioName}
              </span>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <User className="w-4 h-4 text-blue-500" />
              <span>Mi perfil</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configuración</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Seguridad</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
