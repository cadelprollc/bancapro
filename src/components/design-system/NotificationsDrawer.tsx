import React from 'react';
import { AppNotification } from '../../types';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'sale':
        return <span className="text-emerald-500">🎟️</span>;
      case 'prize':
        return <span className="text-amber-500">🏆</span>;
      case 'terminal_blocked':
        return <span className="text-rose-500">🔒</span>;
      case 'user':
        return <span className="text-purple-500">👤</span>;
      case 'result':
        return <span className="text-blue-500">🎱</span>;
      case 'cuadre':
        return <span className="text-cyan-500">📊</span>;
      case 'warning':
        return <span className="text-amber-500">⚠️</span>;
      default:
        return <span className="text-slate-500">ℹ️</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0d172a] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white z-10 flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Notificaciones</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} nuevas sin leer` : 'Al día'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-40"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar leídas
          </button>
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="text-slate-400 hover:text-rose-500 flex items-center gap-1 font-medium disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">No hay notificaciones</p>
              <p className="text-xs text-slate-500 mt-1">
                Todas las alertas de ventas, premios y terminales aparecerán aquí.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification && onSelectNotification(notif)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                    : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-slate-900 dark:text-white shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="text-base shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate">{notif.title}</p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                      <span>{notif.timestamp}</span>
                      {notif.linkTab && (
                        <span className="text-blue-500 font-semibold flex items-center gap-0.5">
                          Ver <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
