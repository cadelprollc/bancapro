import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VisualCustomization, Lottery } from '../types';
import { api } from '../services/api';
import { getPresetLogoForLottery, SYSTEM_COLOR_PRESETS } from '../utils/lotteryLogos';

export interface CustomizationContextType {
  customization: VisualCustomization;
  updateCustomization: (updates: Partial<VisualCustomization>, persistToServer?: boolean) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getLotteryLogo: (lottery: Partial<Lottery> | string) => string | undefined;
  isLoading: boolean;
}

const DEFAULT_CUSTOMIZATION: VisualCustomization = {
  commercialName: 'Banca La Express',
  primaryColor: '#2563EB',
  secondaryColor: '#0F172A',
  accentColor: '#38BDF8',
  bgColor: '#F8FAFC',
  bgImage: '',
  bgOverlayOpacity: 25,
  bgBlur: 0,
  bgScope: 'all',
  ticketHeader: 'BANCA DE LOTERÍA LA EXPRESS',
  ticketFooter: 'Conserve su boleto. 30 días de vigencia.',
  themePreset: 'royal-blue',
};

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

// Helper to apply CSS variables on root
function applyCssVariables(c: VisualCustomization) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (c.primaryColor) {
    root.style.setProperty('--brand-primary', c.primaryColor);
  }
  if (c.secondaryColor) {
    root.style.setProperty('--brand-secondary', c.secondaryColor);
  }
  if (c.accentColor) {
    root.style.setProperty('--brand-accent', c.accentColor);
  }
}

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<VisualCustomization>(() => {
    try {
      const saved = localStorage.getItem('bancapro_customization');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_CUSTOMIZATION, ...parsed };
        applyCssVariables(merged);
        return merged;
      }
    } catch (e) {
      console.warn('Error reading local customization', e);
    }
    applyCssVariables(DEFAULT_CUSTOMIZATION);
    return DEFAULT_CUSTOMIZATION;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync with server on initial mount
  useEffect(() => {
    let isMounted = true;
    const fetchServerCustomization = async () => {
      try {
        const remote = await api.getCustomization();
        if (remote && isMounted) {
          setCustomization((prev) => {
            const merged = { ...prev, ...remote };
            localStorage.setItem('bancapro_customization', JSON.stringify(merged));
            applyCssVariables(merged);
            return merged;
          });
        }
      } catch (err) {
        // Silently keep local customization if offline or non-authenticated
      }
    };

    fetchServerCustomization();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateCustomization = useCallback(
    async (updates: Partial<VisualCustomization>, persistToServer = true) => {
      setIsLoading(true);
      try {
        const updated: VisualCustomization = {
          ...customization,
          ...updates,
        };

        setCustomization(updated);
        localStorage.setItem('bancapro_customization', JSON.stringify(updated));
        applyCssVariables(updated);

        if (persistToServer) {
          try {
            await api.updateGlobalCustomization(updates);
          } catch (err) {
            console.warn('Could not persist global customization to server:', err);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [customization]
  );

  const resetToDefaults = useCallback(async () => {
    setIsLoading(true);
    try {
      setCustomization(DEFAULT_CUSTOMIZATION);
      localStorage.setItem('bancapro_customization', JSON.stringify(DEFAULT_CUSTOMIZATION));
      applyCssVariables(DEFAULT_CUSTOMIZATION);
      try {
        await api.updateGlobalCustomization(DEFAULT_CUSTOMIZATION);
      } catch (err) {
        console.warn('Could not reset server customization:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper para resolver el logo de una lotería: si tiene logoUrl personalizado, lo usa;
  // de lo contrario, recurre al logo vectorial oficial del catálogo dominicano.
  const getLotteryLogo = useCallback((lottery: Partial<Lottery> | string): string | undefined => {
    if (typeof lottery === 'string') {
      return getPresetLogoForLottery(lottery);
    }
    if (lottery.logoUrl) {
      return lottery.logoUrl;
    }
    if (lottery.name) {
      return getPresetLogoForLottery(lottery.name) || (lottery.code ? getPresetLogoForLottery(lottery.code) : undefined);
    }
    return undefined;
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        customization,
        updateCustomization,
        resetToDefaults,
        getLotteryLogo,
        isLoading,
      }}
    >
      {/* Capa de Fondo de Pantalla Global del Sistema */}
      {customization.bgImage && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[1] transition-all duration-500 ease-out"
          style={{
            backgroundImage: `url(${customization.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: Math.max(0.04, Math.min(0.85, (customization.bgOverlayOpacity ?? 25) / 100)),
            filter: customization.bgBlur ? `blur(${customization.bgBlur}px)` : 'none',
          }}
        />
      )}
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = (): CustomizationContextType => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
