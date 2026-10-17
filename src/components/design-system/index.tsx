import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export { ThemeToggle } from './ThemeToggle';

// --- CARD ---
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'interactive' | 'accent';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const base =
    'rounded-2xl transition-all duration-200 border p-5 backdrop-blur-sm ';
  const variants = {
    default:
      'bg-white dark:bg-[#0d172a] border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md dark:shadow-none',
    flat:
      'bg-slate-50 dark:bg-[#09101d] border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-200',
    interactive:
      'bg-white dark:bg-[#0d172a] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:shadow-lg dark:hover:shadow-blue-950/20 cursor-pointer transform hover:-translate-y-0.5',
    accent:
      'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/25',
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// --- BUTTON ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'purple' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md shadow-blue-600/30 focus:ring-blue-500 dark:focus:ring-offset-slate-900',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:ring-slate-400',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 focus:ring-emerald-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25 focus:ring-rose-500',
    warning:
      'bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold shadow-md shadow-amber-500/25 focus:ring-amber-500',
    purple:
      'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 focus:ring-purple-500',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// --- BADGE ---
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'inactive' | 'blocked' | 'pending' | 'blue' | 'purple' | 'amber';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = true,
  className = '',
}) => {
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variants = {
    active:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80',
    inactive:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    blocked:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/80',
    pending:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80',
    blue:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/80',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/80',
    amber:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/80',
  };

  const dotColors = {
    active: 'bg-emerald-500',
    inactive: 'bg-slate-400',
    blocked: 'bg-rose-500',
    pending: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

// --- METRIC CARD ---
export interface MetricCardProps {
  title: string;
  value: string | number;
  variation?: number; // e.g. +12 or -4
  variationText?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  prefix?: string;
  suffix?: string;
  subtitle?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  variation,
  variationText,
  icon,
  iconBgColor = 'bg-blue-50 dark:bg-blue-950/60',
  iconColor = 'text-blue-600 dark:text-blue-400',
  prefix,
  suffix,
  subtitle,
  className = '',
}) => {
  const isPositive = variation !== undefined ? variation >= 0 : true;

  return (
    <Card
      variant="default"
      className={`relative overflow-hidden group hover:border-blue-400/40 transition-all duration-300 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            {prefix && (
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                {prefix}
              </span>
            )}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
            {suffix && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {suffix}
              </span>
            )}
          </div>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor} transition-transform duration-300 group-hover:scale-110 shadow-sm`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {variation !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
                  : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/60'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              )}
              {isPositive ? `+${variation}%` : `${variation}%`}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {variationText || 'vs ayer'}
            </span>
          </div>
        ) : subtitle ? (
          <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
        ) : null}
      </div>
    </Card>
  );
};

// --- MODAL ---
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${sizes[size]} bg-white dark:bg-[#0d172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-8`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold tracking-tight">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// --- INPUT ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-rose-500 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-800'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
