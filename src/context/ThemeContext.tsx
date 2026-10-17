import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type Theme = 'light' | 'dark';
export type AutoNightModeType = 'schedule' | 'system' | 'smart';

export interface AutoNightConfig {
  autoNightEnabled: boolean;
  autoNightMode: AutoNightModeType; // 'schedule' | 'system' | 'smart'
  nightStartHour: string; // e.g. "19:00"
  nightEndHour: string; // e.g. "06:30"
  manualTheme: Theme;
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  // Auto Night mode specifics
  autoNightConfig: AutoNightConfig;
  updateAutoNightConfig: (updates: Partial<AutoNightConfig>) => void;
  isAutoNightActive: boolean;
  autoNightReason: string;
  isNightTime: boolean;
  systemPrefersDark: boolean;
  currentTimeStr: string;
}

const DEFAULT_AUTO_NIGHT_CONFIG: AutoNightConfig = {
  autoNightEnabled: false,
  autoNightMode: 'smart',
  nightStartHour: '19:00',
  nightEndHour: '06:30',
  manualTheme: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to determine if current time falls within start & end hours
export function checkIsWithinNightSchedule(startStr: string, endStr: string, now: Date = new Date()): boolean {
  try {
    const [startH, startM] = (startStr || '19:00').split(':').map((v) => parseInt(v, 10) || 0);
    const [endH, endM] = (endStr || '06:30').split(':').map((v) => parseInt(v, 10) || 0);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes === endMinutes) return false;

    if (startMinutes > endMinutes) {
      // Overnight span (e.g. 19:00 to 06:30)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Same day span (e.g. 08:00 to 18:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial Auto Night config from localStorage
  const [autoNightConfig, setAutoNightConfig] = useState<AutoNightConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('bancapro_theme_autonight');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return {
          ...DEFAULT_AUTO_NIGHT_CONFIG,
          ...parsed,
        };
      }
    } catch (e) {
      console.warn('Error reading auto night config:', e);
    }

    const legacyTheme = localStorage.getItem('bancapro_theme');
    return {
      ...DEFAULT_AUTO_NIGHT_CONFIG,
      manualTheme: (legacyTheme === 'dark' || legacyTheme === 'light') ? legacyTheme : 'light',
    };
  });

  // Track system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Current clock time string
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [nowDate, setNowDate] = useState<Date>(() => new Date());

  // Listen to OS prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handler);
      return () => (mediaQuery as any).removeListener(handler);
    }
  }, []);

  // Update clock & schedule check every 10 seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowDate(now);
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Evaluate if current time falls in night schedule
  const isNightTime = useMemo(() => {
    return checkIsWithinNightSchedule(autoNightConfig.nightStartHour, autoNightConfig.nightEndHour, nowDate);
  }, [autoNightConfig.nightStartHour, autoNightConfig.nightEndHour, nowDate]);

  // Compute effective theme based on Auto Night vs Manual
  const { theme, isAutoNightActive, autoNightReason } = useMemo(() => {
    if (!autoNightConfig.autoNightEnabled) {
      return {
        theme: autoNightConfig.manualTheme,
        isAutoNightActive: false,
        autoNightReason: 'Modo manual activo',
      };
    }

    if (autoNightConfig.autoNightMode === 'schedule') {
      if (isNightTime) {
        return {
          theme: 'dark' as Theme,
          isAutoNightActive: true,
          autoNightReason: `🌙 Modo Noche automático por horario (${autoNightConfig.nightStartHour} - ${autoNightConfig.nightEndHour})`,
        };
      }
      return {
        theme: 'light' as Theme,
        isAutoNightActive: false,
        autoNightReason: `☀️ Modo Día automático fuera de horario (${autoNightConfig.nightStartHour} - ${autoNightConfig.nightEndHour})`,
      };
    }

    if (autoNightConfig.autoNightMode === 'system') {
      if (systemPrefersDark) {
        return {
          theme: 'dark' as Theme,
          isAutoNightActive: true,
          autoNightReason: '🖥️ Modo Noche automático sincronizado con el Sistema Operativo',
        };
      }
      return {
        theme: 'light' as Theme,
        isAutoNightActive: false,
        autoNightReason: '🖥️ Modo Día automático según preferencia del Sistema Operativo',
      };
    }

    // 'smart' mode: activates dark if it is night time OR if system prefers dark
    if (isNightTime || systemPrefersDark) {
      const reasonDetails = isNightTime
        ? `Horario nocturno (${autoNightConfig.nightStartHour} - ${autoNightConfig.nightEndHour})`
        : 'Preferencia del Sistema Operativo';
      return {
        theme: 'dark' as Theme,
        isAutoNightActive: true,
        autoNightReason: `⚡ Modo Inteligente activo: ${reasonDetails}`,
      };
    }

    return {
      theme: 'light' as Theme,
      isAutoNightActive: false,
      autoNightReason: '☀️ Modo Inteligente en reposo diurno',
    };
  }, [autoNightConfig, isNightTime, systemPrefersDark]);

  // Apply theme to DOM and persist
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Persist legacy theme key for external scripts & cache
    localStorage.setItem('bancapro_theme', theme);
  }, [theme]);

  // Persist Auto Night config on changes
  useEffect(() => {
    try {
      localStorage.setItem('bancapro_theme_autonight', JSON.stringify(autoNightConfig));
    } catch (e) {
      console.warn('Failed to save auto night config:', e);
    }
  }, [autoNightConfig]);

  // Update config helper
  const updateAutoNightConfig = useCallback((updates: Partial<AutoNightConfig>) => {
    setAutoNightConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Toggle theme manually (also updates manualTheme)
  const toggleTheme = useCallback(() => {
    setAutoNightConfig((prev) => {
      const nextTheme = prev.manualTheme === 'dark' ? 'light' : 'dark';
      // If user manually toggles while auto night is active, toggle the manual override
      return {
        ...prev,
        manualTheme: nextTheme,
      };
    });
  }, []);

  // Set explicit theme
  const setTheme = useCallback((newTheme: Theme) => {
    setAutoNightConfig((prev) => ({
      ...prev,
      manualTheme: newTheme,
    }));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        autoNightConfig,
        updateAutoNightConfig,
        isAutoNightActive,
        autoNightReason,
        isNightTime,
        systemPrefersDark,
        currentTimeStr,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
