import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { User, AppNotification } from '../types';
import { ThemeToggle } from './design-system';
import { UserProfileDropdown } from './design-system/UserProfileDropdown';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onToggleMobileMenu: () => void;
  notifications: AppNotification[];
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenSettings,
  onOpenSearch,
  onOpenNotifications,
  onToggleMobileMenu,
  notifications,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Hamburger & Search Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-full max-w-md flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="truncate group-hover:text-slate-600 dark:group-hover:text-slate-200">
              Buscar loterías, números, usuarios...
            </span>
          </div>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-white dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile Dropdown */}
        <UserProfileDropdown
          user={user}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </header>
  );
};
