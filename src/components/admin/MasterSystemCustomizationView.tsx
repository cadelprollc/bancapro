import React, { useState, useEffect, useRef } from 'react';
import { User, Lottery } from '../../types';
import { api } from '../../services/api';
import { useCustomization } from '../../context/CustomizationContext';
import {
  SYSTEM_COLOR_PRESETS,
  SYSTEM_WALLPAPER_PRESETS,
  PRESET_LOTTERY_LOGOS,
  getPresetLogoForLottery,
} from '../../utils/lotteryLogos';
import {
  Palette,
  Image,
  Ticket,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  Upload,
  Link2,
  Trash2,
  Eye,
  Sliders,
  Check,
  ShieldAlert,
  Crown,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  Layers,
  Monitor,
  Printer,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';

interface MasterSystemCustomizationViewProps {
  user: User;
  onNavigateTab?: (tab: string) => void;
}

export const MasterSystemCustomizationView: React.FC<MasterSystemCustomizationViewProps> = ({
  user,
  onNavigateTab,
}) => {
  const { customization, updateCustomization, resetToDefaults, getLotteryLogo } = useCustomization();

  const [activeTab, setActiveTab] = useState<'colors' | 'wallpaper' | 'lottery_logos'>('colors');
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState(false);
  const [lotterySearch, setLotterySearch] = useState('');
  const [editingLottery, setEditingLottery] = useState<Lottery | null>(null);

  // Estados locales para colores y marca
  const [primaryColor, setPrimaryColor] = useState(customization.primaryColor || '#2563EB');
  const [secondaryColor, setSecondaryColor] = useState(customization.secondaryColor || '#0F172A');
  const [accentColor, setAccentColor] = useState(customization.accentColor || '#38BDF8');
  const [commercialName, setCommercialName] = useState(customization.commercialName || 'Banca La Express');
  const [ticketHeader, setTicketHeader] = useState(customization.ticketHeader || 'BANCA DE LOTERÍA LA EXPRESS');
  const [ticketFooter, setTicketFooter] = useState(customization.ticketFooter || 'Conserve su boleto. 30 días de vigencia.');

  // Estados locales para fondo de pantalla
  const [bgImage, setBgImage] = useState(customization.bgImage || '');
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState<number>(customization.bgOverlayOpacity ?? 25);
  const [bgBlur, setBgBlur] = useState<number>(customization.bgBlur ?? 0);
  const [bgScope, setBgScope] = useState<'all' | 'pos' | 'dashboard' | 'login'>(customization.bgScope || 'all');

  // Estados de feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lotteryLogoFileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cargar loterías del sistema
  const fetchLotteries = async () => {
    setIsLoadingLotteries(true);
    try {
      const data = await api.getLotteries();
      setLotteries(data || []);
    } catch (e) {
      console.error('Error cargando loterías', e);
    } finally {
      setIsLoadingLotteries(false);
    }
  };

  useEffect(() => {
    fetchLotteries();
  }, []);

  // Sincronizar estados locales si la personalización externa cambia
  useEffect(() => {
    setPrimaryColor(customization.primaryColor || '#2563EB');
    setSecondaryColor(customization.secondaryColor || '#0F172A');
    setAccentColor(customization.accentColor || '#38BDF8');
    setCommercialName(customization.commercialName || 'Banca La Express');
    setTicketHeader(customization.ticketHeader || 'BANCA DE LOTERÍA LA EXPRESS');
    setTicketFooter(customization.ticketFooter || 'Conserve su boleto. 30 días de vigencia.');
    setBgImage(customization.bgImage || '');
    setBgOverlayOpacity(customization.bgOverlayOpacity ?? 25);
    setBgBlur(customization.bgBlur ?? 0);
    setBgScope(customization.bgScope || 'all');
  }, [customization]);

  // Guardar Cambios de Colores y Fondo
  const handleSaveGeneralCustomization = async () => {
    setIsSaving(true);
    try {
      await updateCustomization({
        primaryColor,
        secondaryColor,
        accentColor,
        commercialName,
        ticketHeader,
        ticketFooter,
        bgImage,
        bgOverlayOpacity,
        bgBlur,
        bgScope,
      });
      showToast('✨ Personalización del sistema guardada con éxito.');
    } catch (e: any) {
      showToast('⚠️ Error guardando cambios: ' + (e.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  // Aplicar Preset de Color
  const handleApplyColorPreset = async (preset: typeof SYSTEM_COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setAccentColor(preset.accentColor);
    await updateCustomization({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      themePreset: preset.id,
    });
    showToast(`🎨 Tema "${preset.name}" aplicado.`);
  };

  // Aplicar Preset de Fondo
  const handleApplyWallpaperPreset = async (wp: typeof SYSTEM_WALLPAPER_PRESETS[0]) => {
    setBgImage(wp.dataUri);
    await updateCustomization({
      bgImage: wp.dataUri,
      bgPattern: wp.id,
    });
    showToast(`🖼️ Fondo "${wp.name}" establecido.`);
  };

  // Subir Fondo Personalizado desde archivo local
  const handleWallpaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Por favor seleccione un archivo de imagen válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setBgImage(base64);
        await updateCustomization({ bgImage: base64, bgPattern: 'custom' });
        showToast('🖼️ Imagen de fondo cargada exitosamente.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Quitar Fondo de Pantalla
  const handleRemoveWallpaper = async () => {
    setBgImage('');
    await updateCustomization({ bgImage: '', bgPattern: 'none' });
    showToast('Fondo de pantalla retirado.');
  };

  // Guardar Edición de Logo de Lotería Individual
  const handleSaveLotteryLogo = async (lotteryId: string, logoUrl: string, color?: string) => {
    try {
      const updated = await api.updateLottery(lotteryId, {
        logoUrl: logoUrl.trim(),
        ...(color ? { color } : {}),
      });
      setLotteries((prev) => prev.map((l) => (l.id === lotteryId ? { ...l, logoUrl, ...(color ? { color } : {}) } : l)));
      setEditingLottery(null);
      showToast(`🎰 Logo actualizado para "${updated.name}".`);
    } catch (e: any) {
      showToast('⚠️ Error actualizando lotería: ' + (e.message || 'Error'));
    }
  };

  // Asignar Automáticamente Logos Oficiales a Todas las Loterías del Sistema
  const handleAutoAssignAllLotteryLogos = async () => {
    setIsSaving(true);
    let count = 0;
    try {
      const updatedList = [...lotteries];
      for (let i = 0; i < updatedList.length; i++) {
        const lot = updatedList[i];
        const officialLogo = getPresetLogoForLottery(lot.name) || (lot.code ? getPresetLogoForLottery(lot.code) : undefined);
        if (officialLogo) {
          await api.updateLottery(lot.id, { logoUrl: officialLogo });
          updatedList[i] = { ...lot, logoUrl: officialLogo };
          count++;
        }
      }
      setLotteries(updatedList);
      showToast(`✅ Se asignaron logos oficiales a ${count} loterías automáticamente.`);
    } catch (e: any) {
      showToast('⚠️ Error asignando logos automáticos: ' + (e.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Subir Archivo de Logo para una Lotería
  const handleLotteryLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLottery) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Por favor seleccione una imagen válida (PNG, SVG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        await handleSaveLotteryLogo(editingLottery.id, base64, editingLottery.color);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtrado de loterías
  const filteredLotteries = lotteries.filter((l) => {
    if (!lotterySearch.trim()) return true;
    const q = lotterySearch.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6 animate-in fade-in duration-300 font-sans pb-16">
      {/* 1. Header Súper Máster */}
      <header className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Consola Súper Máster
                </span>
                <span className="text-xs text-indigo-300 font-mono font-bold">
                  Control Total de Marca
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Ajustes Visuales del Sistema
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Personaliza la paleta de colores, el fondo de pantalla de toda la aplicación y los logos oficiales de cada sorteo de lotería.
              </p>
            </div>
          </div>

          {/* Botones de Acción Global */}
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black transition-all border border-white/20 cursor-pointer active:scale-95"
                title="Volver al Dashboard Principal"
              >
                <ArrowLeft className="w-4 h-4 text-amber-300" />
                <span>Volver al Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Vista Previa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
              title="Restablecer valores predeterminados de fábrica"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>

            <button
              type="button"
              onClick={handleSaveGeneralCustomization}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Todo'}</span>
            </button>
          </div>
        </div>

        {/* 3 Pestañas Principales */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'colors'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Colores y Marca</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallpaper')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'wallpaper'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>2. Fondo de Pantalla</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lottery_logos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'lottery_logos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>3. Logos de Cada Lotería</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {lotteries.length}
            </span>
          </button>
        </div>
      </header>

      {/* Toast de Notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN 1: PALETA DE COLORES Y MARCA DEL SISTEMA               */}
      {/* ============================================================== */}
      {activeTab === 'colors' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Presets de Color con 1 Clic */}
          <section className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Temas de Color Predefinidos</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona una combinación diseñada para bancas de lotería y casinos con alta legibilidad.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SYSTEM_COLOR_PRESETS.map((preset) => {
                const isSelected = primaryColor.toUpperCase() === preset.primaryColor.toUpperCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyColorPreset(preset)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-2 ring-blue-500/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <span
                          className="w-4 h-4 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {preset.badge}
                      </span>
                    </div>

                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {preset.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {preset.primaryColor}
                    </p>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Ajuste Fino de Colores Personalizados */}
          <section className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Ajuste Personalizado de Colores y Marca</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Color Primario */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block">
                  Color Primario (Botones y Acentos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 font-mono text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Controla botones principales, selecciones activas y destacados del POS.
                </p>
              </div>

              {/* Color Secundario */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block">
                  Color Secundario (Encabezados y Fondos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 font-mono text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Afecta encabezados oscuros, bordes de tablas y tarjetas financieras.
                </p>
              </div>

              {/* Color de Acento */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block">
                  Color de Acento / Neón
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 font-mono text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Brillos, badges de estado y destellos de boletos ganadores.
                </p>
              </div>
            </div>

            {/* Identidad de la Marca en Boletos e Interfaz */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  Nombre Comercial del Sistema
                </label>
                <input
                  type="text"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  placeholder="ej. Banca La Express"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  Encabezado de Ticket Impreso
                </label>
                <input
                  type="text"
                  value={ticketHeader}
                  onChange={(e) => setTicketHeader(e.target.value)}
                  placeholder="ej. BANCA DE LOTERÍA LA FAVORITA"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  Pie de Página de Ticket
                </label>
                <input
                  type="text"
                  value={ticketFooter}
                  onChange={(e) => setTicketFooter(e.target.value)}
                  placeholder="ej. 30 días de caducidad"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveGeneralCustomization}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar y Guardar Colores</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN 2: FONDO DE PANTALLA DEL SISTEMA                       */}
      {/* ============================================================== */}
      {activeTab === 'wallpaper' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Presets de Fondos */}
          <section className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-500" />
                  <span>Fondos de Pantalla y Texturas Oficiales</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona una textura suave o sube tu propia imagen de marca. Se aplica a todas las pantallas con control de opacidad.
                </p>
              </div>

              {bgImage && (
                <button
                  type="button"
                  onClick={handleRemoveWallpaper}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-all cursor-pointer hover:bg-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar Fondo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {SYSTEM_WALLPAPER_PRESETS.map((wp) => {
                const isSelected = bgImage === wp.dataUri;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => handleApplyWallpaperPreset(wp)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between min-h-[125px] ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300'
                    }`}
                  >
                    {/* Muestra visual de textura */}
                    <div
                      className="w-full h-12 rounded-xl border border-white/10 mb-2 relative overflow-hidden"
                      style={{
                        backgroundColor: wp.previewColor,
                        backgroundImage: `url(${wp.dataUri})`,
                        backgroundSize: 'cover',
                      }}
                    />

                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        {wp.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {wp.subtitle}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Subir Fondo Personalizado y Controles de Opacidad */}
          <section className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Subir Fondo Propio o Ajustar Visibilidad</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Carga de Imagen */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  Subir Imagen desde tu Dispositivo (PC o Celular)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleWallpaperFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Haz clic para seleccionar foto o fondo
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Soporta PNG transparente, JPG, SVG o WebP
                    </span>
                  </div>
                </div>

                {/* O ingresar URL directa */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    O pegar enlace / URL de imagen:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={bgImage.startsWith('data:') ? '' : bgImage}
                      onChange={(e) => setBgImage(e.target.value)}
                      placeholder="https://ejemplo.com/fondo.jpg"
                      className="flex-1 text-xs font-mono px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveGeneralCustomization()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Cargar URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Controles de Opacidad, Desenfoque y Alcance */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                {/* Opacidad del Fondo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                    <span>Opacidad del Fondo:</span>
                    <span className="font-mono text-blue-600 dark:text-cyan-400">{bgOverlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="1"
                    value={bgOverlayOpacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBgOverlayOpacity(val);
                      updateCustomization({ bgOverlayOpacity: val }, false);
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Mantener entre 15% y 35% garantiza máxima legibilidad en todas las tablas y boletos.
                  </p>
                </div>

                {/* Desenfoque (Blur) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                    <span>Filtro de Desenfoque (Blur):</span>
                    <span className="font-mono text-blue-600 dark:text-cyan-400">{bgBlur} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="1"
                    value={bgBlur}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBgBlur(val);
                      updateCustomization({ bgBlur: val }, false);
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Difumina suavemente el fondo para un acabado cinematográfico sin estorbar los números.
                  </p>
                </div>

                {/* Previsualización en Vivo de Fondo */}
                <div className="pt-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1.5">
                    Previsualización de la Capa de Fondo:
                  </span>
                  <div
                    className="w-full h-20 rounded-xl border border-slate-300 dark:border-slate-700 relative overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-xs font-bold">
                      {bgImage ? 'Fondo Activo' : 'Sin fondo configurado'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveGeneralCustomization}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Fondo y Ajustes</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN 3: LOGOS OFICIALES DE CADA LOTERÍA                     */}
      {/* ============================================================== */}
      {activeTab === 'lottery_logos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <section className="bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-500" />
                  <span>Gestor de Logos para Cada Lotería</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Asigna un logo gráfico o distintivo oficial a cada sorteo para que aparezca en el POS, boletos y resultados.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAutoAssignAllLotteryLogos}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                  title="Asigna automáticamente los logos oficiales vectoriales según el nombre de la lotería"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Auto-Asignar Logos Oficiales</span>
                </button>

                <button
                  type="button"
                  onClick={fetchLotteries}
                  disabled={isLoadingLotteries}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Refrescar lista de loterías"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLotteries ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lotterySearch}
                onChange={(e) => setLotterySearch(e.target.value)}
                placeholder="Buscar lotería por nombre (Real, Gana Más, Loteka, Leidsa, New York...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Cuadrícula de Loterías con Logo y Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {filteredLotteries.map((lot) => {
                const currentLogo = lot.logoUrl || getPresetLogoForLottery(lot.name);
                const hasCustomLogo = Boolean(lot.logoUrl);

                return (
                  <div
                    key={lot.id}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Logo Actual de la Lotería */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-13 h-13 rounded-2xl flex items-center justify-center p-1.5 shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden"
                          style={{ backgroundColor: lot.color ? `${lot.color}20` : '#2563EB20' }}
                        >
                          {currentLogo ? (
                            <img
                              src={currentLogo}
                              alt={lot.name}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          ) : (
                            <span className="font-mono text-base font-black text-slate-700 dark:text-slate-300">
                              {lot.code?.slice(0, 3) || 'LOT'}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                            {lot.name}
                          </h4>
                          <span className="font-mono text-[11px] font-bold text-slate-400 block">
                            Código: {lot.code}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md mt-1"
                            style={{
                              backgroundColor: `${lot.color || '#2563EB'}20`,
                              color: lot.color || '#2563EB',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: lot.color || '#2563EB' }}
                            />
                            {hasCustomLogo ? 'Logo Guardado' : 'Logo Oficial Automático'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción para esta Lotería */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Cierre: {lot.closeTime || lot.drawTime}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingLottery(lot)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                        >
                          Cambiar Logo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL PARA CAMBIAR LOGO DE UNA LOTERÍA ESPECÍFICA              */}
      {/* ============================================================== */}
      {editingLottery && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm"
                  style={{ backgroundColor: editingLottery.color || '#2563EB' }}
                >
                  🎰
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Editar Logo de {editingLottery.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Código: #{editingLottery.code}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingLottery(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Galería de Logos Predeterminados para Asignar con 1 Clic */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block">
                Seleccionar Emblema Oficial del Catálogo:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900">
                {Object.entries(PRESET_LOTTERY_LOGOS).map(([key, logoItem]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSaveLotteryLogo(editingLottery.id, logoItem.dataUri, logoItem.color)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                    title={`Asignar logo de ${logoItem.name}`}
                  >
                    <img src={logoItem.dataUri} alt={logoItem.name} className="w-9 h-9 object-contain" />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                      {key}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subir archivo personalizado */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block">
                O Subir tu Propio Archivo de Imagen:
              </label>

              <input
                type="file"
                ref={lotteryLogoFileRef}
                onChange={handleLotteryLogoFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => lotteryLogoFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-500" />
                <span>Seleccionar Imagen desde Dispositivo (PNG/JPG/SVG)</span>
              </button>
            </div>

            {/* O pegar URL directa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                O pegar enlace URL de imagen web:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  defaultValue={editingLottery.logoUrl?.startsWith('data:') ? '' : editingLottery.logoUrl || ''}
                  id="lottery-logo-url-input"
                  placeholder="https://ejemplo.com/logo-loteria.png"
                  className="flex-1 text-xs font-mono px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('lottery-logo-url-input') as HTMLInputElement;
                    if (input?.value) {
                      handleSaveLotteryLogo(editingLottery.id, input.value, editingLottery.color);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                >
                  Guardar URL
                </button>
              </div>
            </div>

            {/* Color Oficial de la Lotería */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                Color Distintivo de la Lotería:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editingLottery.color || '#2563EB'}
                  onChange={(e) => {
                    const newCol = e.target.value;
                    setEditingLottery({ ...editingLottery, color: newCol });
                  }}
                  className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <button
                  type="button"
                  onClick={() => handleSaveLotteryLogo(editingLottery.id, editingLottery.logoUrl || '', editingLottery.color)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                >
                  Guardar Color
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingLottery(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL VISTA PREVIA EN VIVO (POS Y BOLETOS)                     */}
      {/* ============================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Vista Previa en Vivo: POS y Boletos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulación del POS */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                1. Cómo se ve la Barra de Sorteos en el POS:
              </span>
              <div
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
                style={{
                  backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundColor: '#090d16',
                }}
              >
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none relative z-10">
                  {lotteries.slice(0, 5).map((l) => {
                    const logo = l.logoUrl || getPresetLogoForLottery(l.name);
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                      >
                        {logo ? (
                          <img src={logo} alt={l.name} className="w-6 h-6 object-contain rounded-md" />
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: l.color || '#2563EB' }}
                          />
                        )}
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {l.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Simulación del Boleto Impreso */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                2. Encabezado del Boleto Térmico:
              </span>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-center font-mono text-xs text-slate-800 dark:text-amber-200 space-y-1">
                <p className="font-black text-sm">{ticketHeader}</p>
                <p className="text-[11px] font-bold">TERMINAL #1001 · TICKET #TCK-982104</p>
                <p className="text-[10px] text-slate-500">REAL · QUINIELA [08] RD$50.00</p>
                <p className="text-[10px] pt-1 text-slate-600 dark:text-amber-300/80">{ticketFooter}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL CONFIRMACIÓN DE RESTABLECER A VALORES DE FÁBRICA        */}
      {/* ============================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ¿Restablecer Personalización?
                </h3>
                <p className="text-xs text-slate-400">
                  Esta acción devolverá los colores, fondo de pantalla y encabezados a los valores estándar de fábrica.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetToDefaults();
                  setIsResetConfirmOpen(false);
                  showToast('Sistema restablecido a los valores de fábrica.');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Sí, Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
