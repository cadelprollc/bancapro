import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types/index';
import {
  TerminalPrinterConfig,
  PrinterDevice,
  DEFAULT_TERMINAL_PRINTER_CONFIG,
  CutCommandType,
  ThermalDriverType,
  TicketFormatType,
  PrintDensityType,
} from '../../types/printer';
import { printerService } from '../../services/printerService';
import QRCode from 'qrcode';
import {
  Printer,
  Bluetooth,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Upload,
  Image as ImageIcon,
  QrCode,
  Save,
  RefreshCw,
  Sliders,
  Check,
  Eye,
  Trash2,
  AlertTriangle,
  Smartphone,
  Monitor,
  FileText,
  ChevronRight,
  Sparkles,
  Rocket,
  HardDrive,
  ShieldCheck,
  Moon,
  Sun,
  Users,
  Scissors,
  Usb,
  Cpu,
  Radio,
  Cable,
  Layers,
  Zap,
  Network,
  Settings2,
  Copy,
  Crown,
  Palette,
} from 'lucide-react';
import { UpdateNotificationModal } from '../common/UpdateNotificationModal';
import { AdminPermissionsView } from '../admin/AdminPermissionsView';
import { AutoNightModeSettings } from './AutoNightModeSettings';
import { MasterSystemCustomizationView } from '../admin/MasterSystemCustomizationView';
import { MobileBluetoothPrinterSettings } from './MobileBluetoothPrinterSettings';

// Common POS Hardware Brands & Protocols
const HARDWARE_BRANDS: {
  id: TerminalPrinterConfig['hardwareBrand'];
  name: string;
  tag: string;
  icon: string;
  desc: string;
  recommendedPort: string;
}[] = [
  { id: 'EPSON', name: 'EPSON', tag: 'ESC/POS Full Cut', icon: '🖨️', desc: 'TM-T20, TM-T88, TM-m30, EU-T', recommendedPort: 'USB001' },
  { id: 'XPRINTER', name: 'XPRINTER / RONGTA', tag: 'Avance + Parcial', icon: '⚡', desc: 'XP-58, XP-80, Q800, RP-326', recommendedPort: 'USB001' },
  { id: 'BIXOLON', name: 'BIXOLON / SAMSUNG', tag: 'ESC/POS Partial', icon: '🔹', desc: 'SRP-350, SRP-275, SRP-330', recommendedPort: 'USB001' },
  { id: 'STAR', name: 'STAR MICRONICS', tag: 'Star Mode Cut', icon: '⭐', desc: 'TSP100, TSP650, TSP700', recommendedPort: 'USB001' },
  { id: 'CITIZEN', name: 'CITIZEN', tag: 'Legacy ESC m', icon: '🏛️', desc: 'CT-S310, CT-S2000, CBM-1000', recommendedPort: 'COM1' },
  { id: 'GENERIC_POS', name: 'GENÉRICA POS', tag: 'ESC/POS Estándar', icon: '🌐', desc: 'ZJiang, GOOJPRT, MiniPOS 58/80', recommendedPort: 'USB001' },
];

// Standard Thermal Printer Ports
const HARDWARE_PORTS = [
  { id: 'USB001', label: 'USB001', type: 'Virtual USB Windows (Estándar POS)' },
  { id: 'USB002', label: 'USB002', type: 'Puerto USB Secundario' },
  { id: 'COM1', label: 'COM1', type: 'Serial RS-232 COM1' },
  { id: 'COM2', label: 'COM2', type: 'Serial RS-232 COM2' },
  { id: 'COM3', label: 'COM3', type: 'Serial RS-232 / Adaptador USB' },
  { id: '9100', label: '9100', type: 'Red Ethernet / WiFi (TCP RAW JetDirect)' },
  { id: 'BT_SPP_0', label: 'BT_SPP_0', type: 'Bluetooth Serial Port Profile' },
  { id: 'LPT1', label: 'LPT1', type: 'Paralelo Centronics Legacy' },
];

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

// Paper Cut Commands Catalog
const CUT_COMMAND_OPTIONS: { id: CutCommandType; name: string; hex: string; desc: string; badge: string }[] = [
  {
    id: 'GS_V_0',
    name: 'ESC/POS Corte Completo (Full Cut)',
    hex: '1D 56 00',
    badge: 'Estándar Epson / Bixolon',
    desc: 'Corte total limpio de la tira de papel. Compatible con prácticamente cualquier guillotina ESC/POS.',
  },
  {
    id: 'GS_V_1',
    name: 'ESC/POS Corte Parcial (Partial Cut)',
    hex: '1D 56 01',
    badge: 'Recomendado 80mm',
    desc: 'Deja una pestaña central de 1-2mm sujeta para que el ticket no caiga al suelo al ser impreso.',
  },
  {
    id: 'GS_V_66_0',
    name: 'ESC/POS Avance 3 líneas + Corte Parcial',
    hex: '1D 56 42 00',
    badge: 'Xprinter / Rongta',
    desc: 'Avanza automáticamente el papel antes de guillotinar para proteger el código QR y mensaje de despedida.',
  },
  {
    id: 'ESC_M',
    name: 'Legacy ESC m (1B 6D)',
    hex: '1B 6D',
    badge: 'Citizen / Clásicas',
    desc: 'Comando de corte heredado empleado en impresoras Citizen, Star clásicas y miniprinters matriciales.',
  },
  {
    id: 'STAR_CUT',
    name: 'Star Mode Cut (1B 64 02)',
    hex: '1B 64 02',
    badge: 'Star Micronics',
    desc: 'Secuencia propietaria para impresoras Star Micronics series TSP100, TSP650 y TSP700.',
  },
  {
    id: 'CUSTOM',
    name: 'Hexadecimal Personalizado (Avanzado)',
    hex: 'Bytes libres',
    badge: 'Configuración libre',
    desc: 'Permite introducir cualquier secuencia hexadecimal de control según el manual del fabricante.',
  },
  {
    id: 'NONE',
    name: 'Sin Corte Automático (Rasgado manual)',
    hex: 'Ninguno',
    badge: 'Manual / Móviles',
    desc: 'Para impresoras térmicas portátiles de 58mm o equipos de barra dentada que carecen de cortador mecánico.',
  },
];

// Drivers térmicos soportados para diferentes tipos de hardware
export const THERMAL_DRIVERS: {
  id: ThermalDriverType;
  name: string;
  badge: string;
  icon: string;
  desc: string;
  bestFor: string;
  recommendedPort: string;
}[] = [
  {
    id: 'RAW_ESCPOS',
    name: 'Driver Raw ESC/POS Directo',
    badge: 'Recomendado / Rápido',
    icon: '⚡',
    desc: 'Envío directo de bytes binarios ESC/POS al puerto USB o Serie sin capas gráficas intermedias.',
    bestFor: 'Epson, Xprinter, Bixolon, POS-58 en PC con Windows',
    recommendedPort: 'USB001',
  },
  {
    id: 'SYSTEM_SPOOLER',
    name: 'Driver Spooler del Sistema',
    badge: 'Máxima Compatibilidad',
    icon: '🖨️',
    desc: 'Imprime a través de la cola de impresión de Windows / CUPS o diálogo de impresión del sistema.',
    bestFor: 'Cualquier impresora con controlador oficial del fabricante',
    recommendedPort: 'USB001',
  },
  {
    id: 'WEB_BLUETOOTH',
    name: 'Driver Web Bluetooth API',
    badge: 'Inalámbrico BLE',
    icon: '📶',
    desc: 'Conexión inalámbrica directa desde el navegador (Servicio GATT 18F0 / SPP) sin puentes locales.',
    bestFor: 'Impresoras portátiles de bolsillo, Tablets y Smartphones',
    recommendedPort: 'BT_SPP_0',
  },
  {
    id: 'WEB_SERIAL',
    name: 'Driver Web Serial (USB Direct)',
    badge: 'USB Plug & Play',
    icon: '🔌',
    desc: 'Comunicación serie directa a chipsets USB UART (CH340, CP2102, FTDI) desde el navegador.',
    bestFor: 'Cables USB directos de miniprinters en quioscos y PCs',
    recommendedPort: 'COM1',
  },
  {
    id: 'NETWORK_TCP',
    name: 'Driver Red Ethernet / WiFi (RAW 9100)',
    badge: 'Red LAN JetDirect',
    icon: '🌐',
    desc: 'Conexión mediante socket TCP RAW al puerto 9100 de la dirección IP asignada a la impresora.',
    bestFor: 'Impresoras de red compartidas en bancas y sucursales',
    recommendedPort: '9100',
  },
  {
    id: 'SUNMI_INTERNAL',
    name: 'Driver Sunmi / Android POS',
    badge: 'Terminal Integrada',
    icon: '📱',
    desc: 'Controlador optimizado para equipos todo-en-uno con cabezal térmico integrado en el chasis.',
    bestFor: 'Terminales Sunmi V2, PAX, POSLab, Newland',
    recommendedPort: 'INTERNAL_PRINTER',
  },
  {
    id: 'STAR_LINE',
    name: 'Driver Star Line Mode',
    badge: 'Star Micronics',
    icon: '⭐',
    desc: 'Emulación propietaria en modo línea para impresoras de la marca Star Micronics.',
    bestFor: 'Star Micronics TSP100, TSP650, TSP700',
    recommendedPort: 'USB001',
  },
];

// Formatos de ticket para optimizar diseño y consumo de papel
export const TICKET_FORMATS: {
  id: TicketFormatType;
  name: string;
  badge: string;
  desc: string;
  paperSavings: string;
  icon: string;
}[] = [
  {
    id: 'STANDARD',
    name: 'Estándar Oficial',
    badge: 'Equilibrado',
    desc: 'Formato clásico de lotería con cabecera de banca, sorteo, jugadas, total destacado y QR de seguridad.',
    paperSavings: 'Consumo normal (~20 cm)',
    icon: '📄',
  },
  {
    id: 'COMPACT',
    name: 'Compacto / Ahorro de Papel',
    badge: 'Económico (-35% papel)',
    desc: 'Diseño ultracompacto sin líneas vacías innecesarias. Maximiza la vida del rollo térmico.',
    paperSavings: 'Ahorra hasta 35% de papel (~13 cm)',
    icon: '🌱',
  },
  {
    id: 'DETAILED',
    name: 'Detallado / Extendido',
    badge: 'Auditoría Completa',
    desc: 'Incluye RNC, resolución de Hacienda, fecha/hora por sorteo, firma de cajero y políticas legales.',
    paperSavings: 'Formato largo (~28 cm)',
    icon: '📋',
  },
  {
    id: 'MODERN_QR',
    name: 'Moderno (QR & Barras)',
    badge: 'Verificación Rápida',
    desc: 'Prioriza un código QR de alta resolución y código de barras Code128 para validación con lector.',
    paperSavings: 'Consumo medio (~22 cm)',
    icon: '📲',
  },
];

// Densidades de calor térmico del cabezal
export const PRINT_DENSITIES: {
  id: PrintDensityType;
  label: string;
  badge: string;
  desc: string;
}[] = [
  { id: 'LIGHT', label: 'Baja (Económica)', badge: 'Eco', desc: 'Menor calentamiento del cabezal térmico' },
  { id: 'NORMAL', label: 'Normal (Estándar)', badge: 'Recomendada', desc: 'Equilibrio perfecto de contraste y velocidad' },
  { id: 'DARK', label: 'Oscura (Alta Calidad)', badge: 'Intensa', desc: 'Negros profundos y alta nitidez de QR' },
  { id: 'VERY_DARK', label: 'Muy Oscura (Cabezal Desgastado)', badge: 'Máxima', desc: 'Para cabezales que imprimen borroso' },
];

// Perfiles preconfigurados de fábrica para tipos comunes de impresoras térmicas
export const PRINTER_PRESETS: {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  paperWidth: '58mm' | '80mm';
  driverType: ThermalDriverType;
  ticketFormat: TicketFormatType;
  cutCommand: CutCommandType;
  paperCutEnabled: boolean;
  defaultPort: string;
  baudRate: number;
  hardwareBrand: TerminalPrinterConfig['hardwareBrand'];
  printDensity: PrintDensityType;
  feedLines: number;
  badge: string;
}[] = [
  {
    id: 'MINI_BT_58',
    name: 'Mini Portátil Bluetooth 58mm',
    subtitle: 'POS-58, PT-210, MPT-II, GOOJPRT',
    icon: '📱',
    paperWidth: '58mm',
    driverType: 'WEB_BLUETOOTH',
    ticketFormat: 'COMPACT',
    cutCommand: 'NONE',
    paperCutEnabled: false,
    defaultPort: 'BT_SPP_0',
    baudRate: 9600,
    hardwareBrand: 'GENERIC_POS',
    printDensity: 'NORMAL',
    feedLines: 2,
    badge: 'Móvil / Bluetooth',
  },
  {
    id: 'EPSON_80',
    name: 'Epson Mostrador 80mm',
    subtitle: 'TM-T20, TM-T88, TM-m30 (Guillotina Total)',
    icon: '🖨️',
    paperWidth: '80mm',
    driverType: 'RAW_ESCPOS',
    ticketFormat: 'STANDARD',
    cutCommand: 'GS_V_0',
    paperCutEnabled: true,
    defaultPort: 'USB001',
    baudRate: 9600,
    hardwareBrand: 'EPSON',
    printDensity: 'NORMAL',
    feedLines: 3,
    badge: 'Mostrador / PC',
  },
  {
    id: 'XPRINTER_80',
    name: 'Xprinter / Rongta 80mm',
    subtitle: 'XP-Q800, XP-N160M, RP-326 (Avance + Parcial)',
    icon: '⚡',
    paperWidth: '80mm',
    driverType: 'RAW_ESCPOS',
    ticketFormat: 'STANDARD',
    cutCommand: 'GS_V_66_0',
    paperCutEnabled: true,
    defaultPort: 'USB001',
    baudRate: 9600,
    hardwareBrand: 'XPRINTER',
    printDensity: 'DARK',
    feedLines: 3,
    badge: 'Alta Velocidad',
  },
  {
    id: 'NETWORK_LAN_80',
    name: 'Impresora de Red Ethernet / WiFi',
    subtitle: 'Conexión TCP RAW al puerto 9100',
    icon: '🌐',
    paperWidth: '80mm',
    driverType: 'NETWORK_TCP',
    ticketFormat: 'STANDARD',
    cutCommand: 'GS_V_1',
    paperCutEnabled: true,
    defaultPort: '9100',
    baudRate: 9600,
    hardwareBrand: 'GENERIC_POS',
    printDensity: 'NORMAL',
    feedLines: 3,
    badge: 'Red LAN 9100',
  },
  {
    id: 'SUNMI_58',
    name: 'Terminal Sunmi / Android 58mm',
    subtitle: 'Sunmi V2, PAX, POSLab Todo-en-Uno',
    icon: '📲',
    paperWidth: '58mm',
    driverType: 'SUNMI_INTERNAL',
    ticketFormat: 'COMPACT',
    cutCommand: 'NONE',
    paperCutEnabled: false,
    defaultPort: 'INTERNAL_PRINTER',
    baudRate: 9600,
    hardwareBrand: 'GENERIC_POS',
    printDensity: 'NORMAL',
    feedLines: 2,
    badge: 'Android Todo-en-Uno',
  },
  {
    id: 'WINDOWS_SPOOLER',
    name: 'Driver Spooler del Sistema',
    subtitle: 'Controlador de Windows / macOS / CUPS',
    icon: '🖥️',
    paperWidth: '80mm',
    driverType: 'SYSTEM_SPOOLER',
    ticketFormat: 'STANDARD',
    cutCommand: 'GS_V_0',
    paperCutEnabled: true,
    defaultPort: 'USB001',
    baudRate: 9600,
    hardwareBrand: 'GENERIC_POS',
    printDensity: 'NORMAL',
    feedLines: 3,
    badge: 'Controlador SO',
  },
];

interface SettingsViewProps {
  user: User;
  onClose?: () => void;
  isModal?: boolean;
  onNavigateTab?: (tab: string) => void;
  initialTab?: 'printer' | 'mobile_bluetooth' | 'appearance' | 'permissions' | 'master_customization';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onClose,
  isModal = false,
  onNavigateTab,
  initialTab,
}) => {
  const terminalCode = user.terminalCode || user.username || '1001';
  const appVersion = localStorage.getItem('bancapro_app_version') || 'v1.1.0';
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'printer' | 'mobile_bluetooth' | 'appearance' | 'permissions' | 'master_customization'>(
    initialTab || 'printer'
  );

  const [config, setConfig] = useState<TerminalPrinterConfig>({
    ...DEFAULT_TERMINAL_PRINTER_CONFIG,
    terminalCode,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Printers discovery
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinterName, setSelectedPrinterName] = useState('POS-58');
  const [isScanning, setIsScanning] = useState(false);
  const [printerActionNotice, setPrinterActionNotice] = useState<string | null>(null);

  // Sub-tabs for Printer module
  const [printerSubSection, setPrinterSubSection] = useState<'format_paper' | 'driver_config' | 'quick_presets' | 'hardware_cut' | 'design'>('format_paper');

  // Test ticket modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTicketOutput, setTestTicketOutput] = useState<string>('');
  const [testError, setTestError] = useState<string | null>(null);
  const [testModalType, setTestModalType] = useState<'CALIBRATION' | 'SAMPLE_SALE'>('CALIBRATION');
  const [testModalConfig, setTestModalConfig] = useState<TerminalPrinterConfig | null>(null);

  // Apply Quick Printer Preset
  const handleApplyPreset = (preset: typeof PRINTER_PRESETS[0]) => {
    setConfig((prev) => ({
      ...prev,
      paperWidth: preset.paperWidth,
      driverType: preset.driverType,
      ticketFormat: preset.ticketFormat,
      cutCommand: preset.cutCommand,
      paperCutEnabled: preset.paperCutEnabled,
      defaultPort: preset.defaultPort,
      baudRate: preset.baudRate,
      hardwareBrand: preset.hardwareBrand,
      printDensity: preset.printDensity,
      feedLines: preset.feedLines,
    }));
    setPrinterActionNotice(`⚡ Perfil "${preset.name}" aplicado (${preset.paperWidth} · ${preset.driverType} · ${preset.ticketFormat}).`);
    setTimeout(() => setPrinterActionNotice(null), 3500);
  };

  const [copiedTicketText, setCopiedTicketText] = useState(false);

  const handleCopyTicketText = () => {
    if (!testTicketOutput) return;
    try {
      navigator.clipboard.writeText(testTicketOutput);
      setCopiedTicketText(true);
      setTimeout(() => setCopiedTicketText(false), 2000);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  // Paper Cut Test State
  const [testingCut, setTestingCut] = useState(false);
  const [cutTestModal, setCutTestModal] = useState<{
    show: boolean;
    success: boolean;
    hexSent: string;
    message: string;
    portUsed: string;
    brand: string;
    cutCommand: string;
  } | null>(null);

  // Live QR data URL for preview
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load config on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const loaded = await printerService.getConfig(terminalCode);
        setConfig(loaded);
        setSelectedPrinterName(loaded.printerName || 'POS-58');
        const list = await printerService.scanForPrinters();
        setPrinters(list);
      } catch (err) {
        console.error('Error cargando configuración de impresora', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [terminalCode]);

  // Generate QR code for live preview when toggle is active
  useEffect(() => {
    if (config.printQr) {
      QRCode.toDataURL(`TCK-20260926-${terminalCode}-DEMO\nCOD: *7A39B2*`, {
        margin: 1,
        width: 130,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then(setPreviewQrDataUrl)
        .catch(console.error);
    }
  }, [config.printQr, terminalCode]);

  // Search printers
  const handleScanPrinters = async () => {
    setIsScanning(true);
    setPrinterActionNotice(null);
    try {
      const found = await printerService.scanForPrinters();
      setPrinters(found);
      setPrinterActionNotice(`Se encontraron ${found.length} impresoras compatibles.`);
      setTimeout(() => setPrinterActionNotice(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // Connect printer
  const handleConnectPrinter = async (printerName: string) => {
    try {
      await printerService.connectPrinter(printerName, terminalCode);
      setConfig((prev) => ({
        ...prev,
        printerName,
        printerConnected: true,
      }));
      setSelectedPrinterName(printerName);
      setPrinterActionNotice(`🟢 Impresora "${printerName}" conectada correctamente.`);
      setTimeout(() => setPrinterActionNotice(null), 3500);
    } catch (err: any) {
      setPrinterActionNotice('⚠️ Error conectando impresora: ' + err.message);
      setTimeout(() => setPrinterActionNotice(null), 4000);
    }
  };

  // Disconnect printer
  const handleDisconnectPrinter = async () => {
    try {
      await printerService.disconnectPrinter(terminalCode);
      setConfig((prev) => ({
        ...prev,
        printerConnected: false,
      }));
      setPrinterActionNotice('🔴 Impresora desconectada.');
      setTimeout(() => setPrinterActionNotice(null), 3500);
    } catch (err: any) {
      setPrinterActionNotice('⚠️ Error desconectando impresora: ' + err.message);
      setTimeout(() => setPrinterActionNotice(null), 4000);
    }
  };

  // Auto-save and update helper for mobile bluetooth configuration
  const handleUpdateMobileConfig = async (updates: Partial<TerminalPrinterConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      await printerService.saveConfig(terminalCode, newConfig);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setPrinterActionNotice('⚠️ Error guardando: ' + err.message);
    }
  };

  // Auto-detect and configure 58mm printer via USB or Bluetooth
  const [isAutoDetecting58mm, setIsAutoDetecting58mm] = useState(false);

  const handleAutoDetect58mm = async (interactive = false) => {
    setIsAutoDetecting58mm(true);
    setPrinterActionNotice(null);
    try {
      const res = await printerService.autoDetectAndConnect58mm(terminalCode, interactive);
      const updatedList = await printerService.scanForPrinters();
      setPrinters(updatedList);
      setConfig((prev) => ({
        ...prev,
        printerName: res.printer.name,
        printerType: res.connectionType,
        printerConnected: true,
        paperWidth: '58mm',
        driverType:
          res.connectionType === 'USB'
            ? 'RAW_ESCPOS'
            : res.connectionType === 'BLUETOOTH'
            ? 'WEB_BLUETOOTH'
            : 'SYSTEM_SPOOLER',
      }));
      setSelectedPrinterName(res.printer.name);
      setPrinterActionNotice(`⚡ ${res.message}`);
      setTimeout(() => setPrinterActionNotice(null), 4500);
    } catch (err: any) {
      setPrinterActionNotice('⚠️ Error detectando impresora: ' + (err?.message || 'Error'));
      setTimeout(() => setPrinterActionNotice(null), 4000);
    } finally {
      setIsAutoDetecting58mm(false);
    }
  };

  const handleDetectUsbInteractive = async () => {
    setIsAutoDetecting58mm(true);
    try {
      const detected = await printerService.detectUsbPrinters(true);
      const updatedList = await printerService.scanForPrinters();
      setPrinters(updatedList);
      if (detected.length > 0) {
        const top = detected[0];
        await printerService.connectPrinter(top.name, terminalCode);
        setConfig((prev) => ({
          ...prev,
          printerName: top.name,
          printerType: 'USB',
          printerConnected: true,
          paperWidth: '58mm',
        }));
        setSelectedPrinterName(top.name);
        setPrinterActionNotice(`🔌 Impresora USB "${top.name}" vinculada y configurada a 58mm.`);
      } else {
        setPrinterActionNotice('ℹ️ Búsqueda USB finalizada.');
      }
      setTimeout(() => setPrinterActionNotice(null), 4000);
    } finally {
      setIsAutoDetecting58mm(false);
    }
  };

  const handleDetectBtInteractive = async () => {
    setIsAutoDetecting58mm(true);
    try {
      const detected = await printerService.detectBluetoothPrinters(true);
      const updatedList = await printerService.scanForPrinters();
      setPrinters(updatedList);
      if (detected.length > 0) {
        const top = detected[0];
        await printerService.connectPrinter(top.name, terminalCode);
        setConfig((prev) => ({
          ...prev,
          printerName: top.name,
          printerType: 'BLUETOOTH',
          printerConnected: true,
          paperWidth: '58mm',
        }));
        setSelectedPrinterName(top.name);
        setPrinterActionNotice(`📶 Impresora Bluetooth "${top.name}" vinculada y configurada a 58mm.`);
      } else {
        setPrinterActionNotice('ℹ️ Búsqueda Bluetooth finalizada.');
      }
      setTimeout(() => setPrinterActionNotice(null), 4000);
    } finally {
      setIsAutoDetecting58mm(false);
    }
  };

  const handleDirectSample58mm = async () => {
    try {
      await printerService.printTestTicket(terminalCode, { paperWidth: '58mm' });
      setPrinterActionNotice('📄 Ticket de prueba 58mm enviado al cabezal térmico.');
      setTimeout(() => setPrinterActionNotice(null), 3500);
    } catch (e: any) {
      setPrinterActionNotice('⚠️ Error en prueba 58mm: ' + e?.message);
    }
  };

  // Handle Hardware Brand Selection & Auto-configuration
  const handleBrandSelect = (brand: TerminalPrinterConfig['hardwareBrand']) => {
    let cutCmd: CutCommandType = 'GS_V_0';
    let hex = '1D 56 00';

    switch (brand) {
      case 'EPSON':
        cutCmd = 'GS_V_0';
        hex = '1D 56 00';
        break;
      case 'XPRINTER':
        cutCmd = 'GS_V_66_0';
        hex = '1D 56 42 00';
        break;
      case 'BIXOLON':
        cutCmd = 'GS_V_1';
        hex = '1D 56 01';
        break;
      case 'STAR':
        cutCmd = 'STAR_CUT';
        hex = '1B 64 02';
        break;
      case 'CITIZEN':
        cutCmd = 'ESC_M';
        hex = '1B 6D';
        break;
      case 'GENERIC_POS':
      default:
        cutCmd = 'GS_V_0';
        hex = '1D 56 00';
        break;
    }

    const brandDef = HARDWARE_BRANDS.find((b) => b.id === brand);
    const recommendedPort = brandDef?.recommendedPort || config.defaultPort || 'USB001';

    setConfig((prev) => ({
      ...prev,
      hardwareBrand: brand,
      cutCommand: cutCmd,
      customCutHex: hex,
      defaultPort: prev.defaultPort ? prev.defaultPort : recommendedPort,
    }));

    setPrinterActionNotice(`Marca ajustada a ${brand}. Comando de corte predeterminado: ${cutCmd} [${hex}].`);
    setTimeout(() => setPrinterActionNotice(null), 3500);
  };

  // Handle Cut Command Selection
  const handleCutCommandSelect = (cmd: CutCommandType) => {
    const hex = printerService.getCutCommandHex(cmd, config.customCutHex);
    setConfig((prev) => ({
      ...prev,
      cutCommand: cmd,
      customCutHex: cmd === 'CUSTOM' ? (prev.customCutHex || '1D 56 00') : hex,
    }));
  };

  // Execute hardware test for paper cut command
  const handleTestPaperCut = async () => {
    setTestingCut(true);
    try {
      const res = await printerService.testPaperCut(terminalCode, {
        defaultPort: config.defaultPort,
        baudRate: config.baudRate,
        paperCutEnabled: config.paperCutEnabled,
        cutCommand: config.cutCommand,
        customCutHex: config.customCutHex,
        hardwareBrand: config.hardwareBrand,
      });

      setCutTestModal({
        show: true,
        success: res.success,
        hexSent: res.hexSent,
        message: res.message,
        portUsed: config.defaultPort || 'USB001',
        brand: config.hardwareBrand || 'GENERIC_POS',
        cutCommand: config.cutCommand,
      });

      setPrinterActionNotice(`✂️ Comando de corte [${res.hexSent}] enviado al puerto ${config.defaultPort || 'USB001'}.`);
      setTimeout(() => setPrinterActionNotice(null), 4000);
    } catch (err: any) {
      setCutTestModal({
        show: true,
        success: false,
        hexSent: 'ERROR',
        message: 'No se pudo comunicar con el hardware: ' + (err?.message || 'Error desconocido'),
        portUsed: config.defaultPort || 'USB001',
        brand: config.hardwareBrand || 'GENERIC_POS',
        cutCommand: config.cutCommand,
      });
    } finally {
      setTestingCut(false);
    }
  };

  // Run test print (Calibration or sample lottery ticket)
  const handleTestPrint = async (type: 'CALIBRATION' | 'SAMPLE_SALE' = 'CALIBRATION') => {
    setTestError(null);
    setTestTicketOutput('');

    try {
      let res;
      if (type === 'SAMPLE_SALE') {
        res = await printerService.printSampleSaleTicket(terminalCode, config);
      } else {
        res = await printerService.printTestTicket(terminalCode, config);
      }

      if (!res.success) {
        setTestError(res.error || 'Error al imprimir ticket de prueba.');
        setShowTestModal(true);
        return;
      }

      if (!config.printerConnected) {
        setConfig((prev) => ({ ...prev, printerConnected: true }));
      }

      setTestTicketOutput(res.ticketText);
      setTestModalType(type);
      setTestModalConfig(res.configUsed);
      setShowTestModal(true);

      setPrinterActionNotice(
        `🧪 Ticket de prueba enviado exitosamente (${config.paperWidth} · ${config.driverType} · ${config.ticketFormat}).`
      );
      setTimeout(() => setPrinterActionNotice(null), 4000);
    } catch (err: any) {
      setTestError(err?.message || 'Error inesperado al generar la impresión de prueba.');
      setShowTestModal(true);
    }
  };

  // Handle Logo Upload and thermal scaling
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to thermal head proportion (max 260px width)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 260;
        const scaleSize = MAX_WIDTH / img.width;
        const targetWidth = Math.min(img.width, MAX_WIDTH);
        const targetHeight = Math.min(img.height * scaleSize, 120);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const dataUrl = canvas.toDataURL('image/png');
          setConfig((prev) => ({
            ...prev,
            logoBase64: dataUrl,
            printLogo: true,
          }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setConfig((prev) => ({
      ...prev,
      logoBase64: undefined,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Settings
  const handleSaveConfig = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await printerService.saveConfig(terminalCode, config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setPrinterActionNotice('⚠️ Error guardando la configuración: ' + err.message);
      setTimeout(() => setPrinterActionNotice(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6'}`}>
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm">
            ⚙️
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
              <span>AJUSTES</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 font-mono">
                Terminal #{terminalCode}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              Impresoras térmicas, tickets, y personalización visual con Modo Noche Automático.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </>
            )}
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {printerActionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{printerActionNotice}</span>
        </div>
      )}

      {/* Navigation Tabs for All Users (Impresora, Modo Noche, Permisos) */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSettingsTab('mobile_bluetooth')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            settingsTab === 'mobile_bluetooth'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-4 h-4 text-cyan-300 shrink-0" />
          <span>📱 Móvil (Bluetooth)</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsTab('printer')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            settingsTab === 'printer'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden sm:inline">🖥️ Impresora PC / USB</span>
          <span className="sm:hidden">🖥️ PC / USB</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsTab('appearance')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            settingsTab === 'appearance'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Moon className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Modo Noche Automático</span>
          <span className="sm:hidden">Modo Noche</span>
        </button>

        {user.role === 'SUPER_ADMIN' && (
          <button
            type="button"
            onClick={() => setSettingsTab('master_customization')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              settingsTab === 'master_customization'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">👑 Súper Máster</span>
            <span className="sm:hidden">👑 Máster</span>
          </button>
        )}

        {user.role === 'SUPER_ADMIN' && (
          <button
            type="button"
            onClick={() => setSettingsTab('permissions')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              settingsTab === 'permissions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">🛡️ Permisos</span>
            <span className="sm:hidden">🛡️ Permisos</span>
          </button>
        )}
      </div>

      {settingsTab === 'mobile_bluetooth' ? (
        <div className="pt-2 animate-in fade-in duration-200">
          <MobileBluetoothPrinterSettings
            user={user}
            config={config}
            onUpdateConfig={handleUpdateMobileConfig}
            terminalCode={terminalCode}
          />
        </div>
      ) : settingsTab === 'master_customization' && user.role === 'SUPER_ADMIN' ? (
        <div className="pt-2 animate-in fade-in duration-200">
          <MasterSystemCustomizationView user={user} onNavigateTab={onNavigateTab} />
        </div>
      ) : settingsTab === 'permissions' && user.role === 'SUPER_ADMIN' ? (
        <div className="pt-2">
          <AdminPermissionsView currentUser={user} />
        </div>
      ) : settingsTab === 'appearance' ? (
        <div className="pt-2 animate-in fade-in duration-200">
          <AutoNightModeSettings embedded={true} />
        </div>
      ) : (
        <>
          {/* Main Grid: Left = Settings Forms, Right = Live Receipt Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Columns: Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Banner Rápido Súper Máster: Personalización del Sistema */}
          {user.role === 'SUPER_ADMIN' && (
            <div
              onClick={() => setSettingsTab('master_customization')}
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-amber-500/20 border border-amber-300/40 cursor-pointer hover:brightness-105 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-slate-950 tracking-wide flex items-center gap-1.5">
                    <span>Ajustes Globales del Súper Máster</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 text-[9px] font-black">CONTROL TOTAL</span>
                  </span>
                  <p className="text-[11px] text-slate-900/90 font-medium mt-0.5">
                    Cambiar colores del sistema, poner fondo de pantalla y asignar logos a cada lotería.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs shrink-0 shadow-xs group-hover:scale-105 transition-all"
              >
                Personalizar
              </button>
            </div>
          )}

          {/* Banner Rápido al Modo Noche Automático */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-indigo-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Moon className="w-5 h-5 fill-amber-300" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                  <span>Modo Noche Automático</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black">NUEVO</span>
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Reduce el cansancio visual durante jornadas nocturnas o según preferencias del sistema.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettingsTab('appearance')}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase shrink-0 active:scale-95 transition-all shadow-xs flex items-center gap-1"
            >
              <span>Configurar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ========================================================
              PANEL PRINCIPAL DE CONFIGURACIÓN DE IMPRESORAS TÉRMICAS
              ======================================================== */}

          {/* 1. Barra Superior de Estado y Pruebas Rápidas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                  <Printer className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>CONFIGURACIÓN DE IMPRESORA TÉRMICA</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      POS READY
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    Formato de ticket, ancho de cabezal térmico (58mm / 80mm), controladores y pruebas
                  </p>
                </div>
              </div>

              {/* Estado de Conexión */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide border shadow-2xs self-start sm:self-auto ${
                  config.printerConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    config.printerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span>
                  {config.printerConnected ? '🟢 CABEZAL EN LÍNEA' : '🔴 DESCONECTADO'}
                </span>
              </div>
            </div>

            {/* SECCIÓN DESTACADA: IMPRESIÓN TÉRMICA DIRECTA USB / BLUETOOTH CON FORMATO AUTOMÁTICO 58mm */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 shadow-md space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 rounded-lg bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                      <Zap className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm sm:text-base font-black tracking-tight uppercase text-white">
                      Impresión Térmica Directa (USB & Bluetooth 58mm)
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Auto-Formato 58mm Activo
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Detecta impresoras conectadas vía cable USB (WebUSB / CH340) o Bluetooth inalámbrico (BLE / SPP) y formatea los tickets automáticamente a 32 columnas para cabezales térmicos de 58mm sin descuadres de márgenes.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAutoDetect58mm(false)}
                    disabled={isAutoDetecting58mm}
                    className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60"
                    title="Escanear y configurar automáticamente a 58mm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAutoDetecting58mm ? 'animate-spin' : ''}`} />
                    <span>{isAutoDetecting58mm ? 'Detectando...' : '⚡ Autodetectar 58mm'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDetectUsbInteractive}
                    disabled={isAutoDetecting58mm}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 transition-colors"
                    title="Abrir selector de hardware USB del navegador"
                  >
                    <Usb className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Vincular USB</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDetectBtInteractive}
                    disabled={isAutoDetecting58mm}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 transition-colors"
                    title="Abrir selector Bluetooth inalámbrico"
                  >
                    <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                    <span>Vincular BT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectSample58mm}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Imprimir ticket de prueba directamente en 58mm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Probar 58mm</span>
                  </button>
                </div>
              </div>

              {/* Badges de Estado Directo */}
              <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400">Hardware Activo:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    {config.printerType === 'USB' ? <Usb className="w-3 h-3 text-cyan-400" /> : <Bluetooth className="w-3 h-3 text-blue-400" />}
                    {config.printerName || 'POS-58'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] border border-slate-700">
                    Tipo: {config.printerType}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] border border-slate-700">
                    Ancho: 58mm (32 cols)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-[11px]">
                    <input
                      type="checkbox"
                      checked={config.autoPrintOnSale}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, autoPrintOnSale: e.target.checked }))
                      }
                      className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5"
                    />
                    <span>Imprimir directo 58mm automáticamente al vender</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Resumen de Configuración Activa */}
            <div className="p-4 bg-neutral-50 dark:bg-slate-800/50 rounded-xl border border-neutral-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-neutral-900 dark:text-white">
                    🖨️ {config.printerName || 'POS-58'}
                  </span>
                  <span className="text-[11px] font-black font-mono px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-slate-900 rounded-md shadow-2xs">
                    {config.paperWidth} ({config.paperWidth === '80mm' ? '48 cols' : '32 cols'})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                    {THERMAL_DRIVERS.find((d) => d.id === config.driverType)?.badge || config.driverType}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                    Formato: {TICKET_FORMATS.find((f) => f.id === config.ticketFormat)?.name || config.ticketFormat}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                    Puerto: {config.defaultPort || 'USB001'}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-slate-400">
                  Densidad térmica: <strong>{config.printDensity || 'NORMAL'}</strong> · Avance:{' '}
                  <strong>{config.feedLines || 3} líneas</strong> · Guillotina:{' '}
                  <strong>{config.paperCutEnabled ? config.cutCommand : 'Desactivada'}</strong>
                </div>
              </div>

              {/* Botones Rápidos de Impresión de Prueba */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestPrint('CALIBRATION')}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                  title="Imprime regla métrica, 32/48 columnas, fuentes, código de barras y estado del cabezal"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>🧪 Probar Calibración</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestPrint('SAMPLE_SALE')}
                  className="px-3.5 py-2 bg-neutral-900 dark:bg-slate-800 hover:bg-neutral-800 dark:hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all border border-neutral-700"
                  title="Imprime un ticket de jugada de muestra con el formato actual configurado"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🎟️ Ticket Muestra</span>
                </button>
              </div>
            </div>

            {/* Sub-Pestañas de Navegación del Módulo de Impresora */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-1 bg-neutral-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrinterSubSection('quick_presets')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  printerSubSection === 'quick_presets'
                    ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-black'
                    : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span className="truncate">Perfiles Rápidos</span>
              </button>

              <button
                type="button"
                onClick={() => setPrinterSubSection('format_paper')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  printerSubSection === 'format_paper'
                    ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-black'
                    : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>📐</span>
                <span className="truncate">Formato & Ancho</span>
              </button>

              <button
                type="button"
                onClick={() => setPrinterSubSection('driver_config')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  printerSubSection === 'driver_config'
                    ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-black'
                    : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>🔌</span>
                <span className="truncate">Driver Térmico</span>
              </button>

              <button
                type="button"
                onClick={() => setPrinterSubSection('hardware_cut')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  printerSubSection === 'hardware_cut'
                    ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-black'
                    : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>✂️</span>
                <span className="truncate">Puerto & Corte</span>
              </button>

              <button
                type="button"
                onClick={() => setPrinterSubSection('design')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  printerSubSection === 'design'
                    ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-black'
                    : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>🎨</span>
                <span className="truncate">Diseño & Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('mobile_bluetooth')}
                className="py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 font-bold cursor-pointer"
                title="Configuración exclusiva de impresoras térmicas Bluetooth para celulares"
              >
                <span>📱</span>
                <span className="truncate">Móvil Bluetooth</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              SUB-SECCIÓN 1: PERFILES PRECONFIGURADOS POR MODELO
              ======================================================== */}
          {printerSubSection === 'quick_presets' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>⚡ PERFILES RÁPIDOS PARA IMPRESORAS TÉRMICAS</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    Seleccione el modelo de su equipo para auto-configurar en 1 clic el driver, ancho de papel, formato de ticket y comandos de corte
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  1-CLIC SETUP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRINTER_PRESETS.map((preset) => {
                  const isCurrent =
                    config.paperWidth === preset.paperWidth &&
                    config.driverType === preset.driverType &&
                    config.hardwareBrand === preset.hardwareBrand;

                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'bg-neutral-900 dark:bg-indigo-950/70 text-white border-neutral-900 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-neutral-50 dark:bg-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{preset.icon}</span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCurrent
                                ? 'bg-emerald-500 text-white'
                                : 'bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-slate-300'
                            }`}
                          >
                            {isCurrent ? 'Perfil Activo' : preset.badge}
                          </span>
                        </div>

                        <div className="text-xs font-black tracking-tight">{preset.name}</div>
                        <p
                          className={`text-[11px] leading-snug ${
                            isCurrent ? 'text-neutral-300 dark:text-slate-300' : 'text-neutral-500 dark:text-slate-400'
                          }`}
                        >
                          {preset.subtitle}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isCurrent ? 'bg-white/10 text-white' : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-700'
                            }`}
                          >
                            📏 {preset.paperWidth}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isCurrent ? 'bg-white/10 text-white' : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-700'
                            }`}
                          >
                            🔌 {preset.driverType}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isCurrent ? 'bg-white/10 text-white' : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-700'
                            }`}
                          >
                            ✂️ {preset.paperCutEnabled ? preset.cutCommand : 'Manual'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          isCurrent
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-default'
                            : 'bg-neutral-900 dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-500 text-white shadow-xs'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Perfil Aplicado</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Aplicar a Esta Terminal</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              SUB-SECCIÓN 2: FORMATO, ANCHO DE PAPEL Y DENSIDAD
              ======================================================== */}
          {printerSubSection === 'format_paper' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>📐 FORMATO DE TICKET Y ANCHO DE PAPEL TÉRMICO</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    Ajuste las dimensiones físicas del rollo y la densidad de calor del cabezal térmico
                  </p>
                </div>
              </div>

              {/* 1. Selector de Ancho de Papel */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200">
                  1. Ancho Físico del Rollo de Papel:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setConfig((prev) => ({ ...prev, paperWidth: '58mm' }))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      config.paperWidth === '58mm'
                        ? 'bg-neutral-900 text-white dark:bg-slate-800 border-neutral-900 dark:border-slate-700 shadow-sm ring-2 ring-blue-500/30'
                        : 'bg-neutral-50 dark:bg-slate-800/40 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-200 border-neutral-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black">58mm (Estándar POS Móvil)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500 text-white font-bold">
                        32 Columnas
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Para impresoras portátiles Bluetooth de bolsillo (POS-58, PT-210, MPT-II, ZJiang) y quioscos compactos.
                    </p>
                  </div>

                  <div
                    onClick={() => setConfig((prev) => ({ ...prev, paperWidth: '80mm' }))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      config.paperWidth === '80mm'
                        ? 'bg-neutral-900 text-white dark:bg-slate-800 border-neutral-900 dark:border-slate-700 shadow-sm ring-2 ring-blue-500/30'
                        : 'bg-neutral-50 dark:bg-slate-800/40 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-200 border-neutral-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black">80mm (Ancho Mostrador PC)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500 text-white font-bold">
                        48 Columnas
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Para impresoras fijas de mostrador (Epson TM-T20/T88, Xprinter XP-Q800, Bixolon, Star TSP100) con guillotina.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Selector de Formato de Ticket */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200">
                    2. Formato de Impresión del Ticket:
                  </label>
                  <span className="text-[10px] text-neutral-400 dark:text-slate-500">
                    Optimiza diseño y longitud
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TICKET_FORMATS.map((fmt) => {
                    const isSelected = config.ticketFormat === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => setConfig((prev) => ({ ...prev, ticketFormat: fmt.id }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-slate-800 border-neutral-900 dark:border-slate-700 shadow-sm ring-2 ring-blue-500/30'
                            : 'bg-neutral-50 dark:bg-slate-800/40 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-200 border-neutral-200 dark:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black flex items-center gap-1.5">
                              <span>{fmt.icon}</span>
                              <span>{fmt.name}</span>
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-slate-300'
                              }`}
                            >
                              {fmt.badge}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] leading-snug ${
                              isSelected ? 'text-neutral-300 dark:text-slate-300' : 'text-neutral-500 dark:text-slate-400'
                            }`}
                          >
                            {fmt.desc}
                          </p>
                        </div>
                        <div
                          className={`text-[10px] font-mono pt-1 ${
                            isSelected ? 'text-emerald-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-medium'
                          }`}
                        >
                          🍃 {fmt.paperSavings}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Densidad de Calor y Líneas de Avance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200">
                    3. Densidad Térmica (Calor de Cabezal):
                  </label>
                  <select
                    value={config.printDensity || 'NORMAL'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        printDensity: e.target.value as PrintDensityType,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {PRINT_DENSITIES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} — {d.desc}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-500 dark:text-slate-400">
                    Aumente a "Oscura" si los tickets o códigos QR salen tenues o borrosos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200">
                    4. Avance de Líneas antes del Corte:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((lines) => (
                      <button
                        key={lines}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, feedLines: lines }))}
                        className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                          (config.feedLines || 3) === lines
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-slate-900 border-neutral-900 dark:border-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-300 border-neutral-200 dark:border-slate-700 hover:bg-neutral-50'
                        }`}
                      >
                        {lines}L
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-slate-400">
                    Líneas en blanco antes del corte para que el texto no quede atrapado bajo la cuchilla.
                  </p>
                </div>
              </div>

              {/* Impresión automática toggle */}
              <div className="p-3.5 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-neutral-800 dark:text-slate-200 block cursor-pointer">
                    ⚡ Impresión Automática al Registrar Venta
                  </label>
                  <span className="text-[11px] text-neutral-500 dark:text-slate-400 block leading-tight">
                    Dispara la impresión al momento exacto de confirmar el ticket sin diálogo adicional
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoPrintOnSale}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, autoPrintOnSale: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ========================================================
              SUB-SECCIÓN 3: DRIVER TÉRMICO Y PROTOCOLO
              ======================================================== */}
          {printerSubSection === 'driver_config' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>🔌 DRIVERS TÉRMICOS Y PROTOCOLOS DE COMUNICACIÓN</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    Seleccione el controlador adecuado para su tipo de conexión física o inalámbrica
                  </p>
                </div>
              </div>

              {/* Grid de 7 Drivers */}
              <div className="space-y-2.5">
                {THERMAL_DRIVERS.map((driver) => {
                  const isSelected = config.driverType === driver.id;
                  return (
                    <div
                      key={driver.id}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          driverType: driver.id,
                          defaultPort: prev.defaultPort || driver.recommendedPort,
                        }))
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-900 text-white dark:bg-slate-800 border-neutral-900 dark:border-slate-700 shadow-sm ring-2 ring-blue-500/30'
                          : 'bg-neutral-50 dark:bg-slate-800/40 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-200 border-neutral-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{driver.icon}</span>
                          <span className="text-xs font-black">{driver.name}</span>
                        </div>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-slate-300'
                          }`}
                        >
                          {driver.badge}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-1 ${
                          isSelected ? 'text-neutral-300 dark:text-slate-300' : 'text-neutral-500 dark:text-slate-400'
                        }`}
                      >
                        {driver.desc}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                        <span className={isSelected ? 'text-neutral-400' : 'text-neutral-500'}>
                          Ideal para: <strong>{driver.bestFor}</strong>
                        </span>
                        <span className={isSelected ? 'text-amber-300' : 'text-neutral-600 dark:text-slate-400'}>
                          Puerto sugerido: [{driver.recommendedPort}]
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Si se selecciona NETWORK_TCP: Configuración IP y Puerto */}
              {config.driverType === 'NETWORK_TCP' && (
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                    <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Configuración de Red Local (TCP JetDirect RAW)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-700 dark:text-slate-300 mb-1">
                        Dirección IP de la Impresora:
                      </label>
                      <input
                        type="text"
                        value={config.networkIp || '192.168.1.200'}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, networkIp: e.target.value.trim() }))
                        }
                        placeholder="192.168.1.200"
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-700 dark:text-slate-300 mb-1">
                        Puerto TCP (RAW):
                      </label>
                      <input
                        type="number"
                        value={config.networkPort || 9100}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, networkPort: Number(e.target.value) }))
                        }
                        placeholder="9100"
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Buscador de Dispositivos Bluetooth (si usa Bluetooth o desea buscar) */}
              <div className="p-4 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bluetooth className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase text-neutral-800 dark:text-slate-200">
                      Dispositivos Bluetooth & Sistema Detectados:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleScanPrinters}
                    disabled={isScanning}
                    className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Buscando...' : 'Buscar dispositivos'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {printers.map((p) => {
                    const isSelected = selectedPrinterName === p.name;
                    const isCurConnected = config.printerConnected && config.printerName === p.name;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPrinterName(p.name);
                          setConfig((prev) => ({ ...prev, printerName: p.name }));
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-slate-800 border-neutral-900 dark:border-slate-700 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 text-neutral-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Bluetooth
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-emerald-400' : 'text-neutral-400'
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold truncate">🖨️ {p.name}</div>
                            <div className="text-[10px] font-mono text-neutral-400 truncate">
                              {p.address || p.type}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          {isCurConnected ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                              Activa
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnectPrinter(p.name);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 text-neutral-800 dark:text-slate-200'
                              }`}
                            >
                              Conectar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SUB-SECCIÓN 4: PUERTO Y GUILLOTINA ESC/POS
              ======================================================== */}
          {printerSubSection === 'hardware_cut' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-5 animate-in fade-in duration-150">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
                    <Scissors className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-neutral-900 dark:text-white">
                      PUERTO PREDETERMINADO Y CORTE DE PAPEL
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                      Defina el puerto de interfaz física y el comando de corte ESC/POS para Epson, Xprinter, Bixolon, Star y Citizen
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-slate-800 text-[11px] font-mono text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                  <Usb className="w-3.5 h-3.5 text-blue-500" />
                  <span>{config.defaultPort || 'USB001'}</span>
                  <span className="text-neutral-300 dark:text-slate-600">|</span>
                  <Scissors className="w-3.5 h-3.5 text-amber-500" />
                  <span>{config.paperCutEnabled ? config.cutCommand : 'OFF'}</span>
                </div>
              </div>

              {/* 1. Presets de Compatibilidad por Marca */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Marca de Hardware Térmico:</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 dark:text-slate-500">
                    Auto-configura corte y protocolo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {HARDWARE_BRANDS.map((brand) => {
                    const isSelected = config.hardwareBrand === brand.id;
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => handleBrandSelect(brand.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-neutral-900 dark:bg-indigo-950/80 text-white border-neutral-900 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-neutral-50 dark:bg-slate-800/60 hover:bg-neutral-100 dark:hover:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{brand.icon}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-xs font-black tracking-tight truncate">{brand.name}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-indigo-300' : 'text-neutral-500 dark:text-slate-400'}`}>
                          {brand.tag}
                        </div>
                        <div className={`text-[9px] mt-1 truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-400 dark:text-slate-500'}`}>
                          {brand.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Puerto Predeterminado de la Impresora */}
              <div className="p-4 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Usb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Puerto Predeterminado de Comunicación:</span>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-slate-400">
                    Configurado: <strong className="text-neutral-900 dark:text-white">{config.defaultPort || 'USB001'}</strong>
                  </span>
                </div>

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {HARDWARE_PORTS.map((p) => {
                    const active = (config.defaultPort || '').toUpperCase() === p.id.toUpperCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, defaultPort: p.id }))}
                        className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-300 border-neutral-200 dark:border-slate-700 hover:border-neutral-300'
                        }`}
                        title={p.type}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Free Input & Baud Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-slate-400 mb-1">
                      Identificador de Puerto (USB, COM o IP de Red):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={config.defaultPort || ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultPort: e.target.value.trim() }))}
                        placeholder="Ej: USB001, COM1, 192.168.1.200:9100, /dev/usb/lp0"
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <Usb className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-slate-400 mb-1">
                      Velocidad (Baud Rate - Serie):
                    </label>
                    <select
                      value={config.baudRate || 9600}
                      onChange={(e) => setConfig((prev) => ({ ...prev, baudRate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {BAUD_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate} bps {rate === 9600 ? '(Estándar)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Guillotina Automática & Comandos ESC/POS */}
              <div className="p-4 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-slate-200">
                        Guillotina Automática de Papel
                      </span>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        Dispara la cuchilla de corte al concluir la impresión del ticket
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.paperCutEnabled}
                      onChange={(e) => setConfig((prev) => ({ ...prev, paperCutEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {config.paperCutEnabled ? (
                  <div className="space-y-3 pt-2 border-t border-neutral-200/70 dark:border-slate-700/60 animate-in fade-in">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-slate-300">
                      Seleccione el Comando de Corte ESC/POS:
                    </label>

                    <div className="space-y-2">
                      {CUT_COMMAND_OPTIONS.map((cmd) => {
                        const isSelected = config.cutCommand === cmd.id;
                        return (
                          <label
                            key={cmd.id}
                            onClick={() => handleCutCommandSelect(cmd.id)}
                            className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/40 text-neutral-900 dark:text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 text-neutral-700 dark:text-slate-300 hover:border-neutral-300'
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{cmd.name}</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
                                  {cmd.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 dark:text-slate-400 leading-tight">
                                {cmd.desc}
                              </p>
                              <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold pt-0.5">
                                Código Hex: [{cmd.id === 'CUSTOM' ? (config.customCutHex || '1D 56 00') : cmd.hex}]
                              </div>
                            </div>

                            <input
                              type="radio"
                              name="cutCommandOption"
                              checked={isSelected}
                              onChange={() => handleCutCommandSelect(cmd.id)}
                              className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer mt-1 shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>

                    {/* Custom Hex input if CUSTOM is selected */}
                    {config.cutCommand === 'CUSTOM' && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800 space-y-2">
                        <label className="block text-[11px] font-bold uppercase text-neutral-800 dark:text-slate-200">
                          Secuencia Hexadecimal de Corte Personalizada:
                        </label>
                        <input
                          type="text"
                          value={config.customCutHex || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, customCutHex: e.target.value.toUpperCase() }))}
                          placeholder="Ej: 1D 56 00 o 1B 69"
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-neutral-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Test Paper Cut Button */}
                    <div className="p-3.5 bg-neutral-900 dark:bg-slate-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-neutral-800">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
                          Bytes ESC/POS para ({config.defaultPort || 'USB001'}):
                        </div>
                        <div className="text-sm font-mono font-black text-amber-400 flex items-center gap-2 mt-0.5">
                          <span>[ {printerService.getCutCommandHex(config.cutCommand, config.customCutHex)} ]</span>
                          <span className="text-[10px] font-normal text-neutral-400">
                            Protocolo: {config.hardwareBrand}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestPaperCut}
                        disabled={testingCut}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>{testingCut ? 'Probando...' : '🧪 Probar Corte de Papel'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-100 dark:bg-slate-800 rounded-xl text-xs text-neutral-600 dark:text-slate-400 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>El corte automático está desactivado. Rasgado manual contra la barra dentada.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              SUB-SECCIÓN 5: DISEÑO Y LOGO DE TICKET
              ======================================================== */}
          {printerSubSection === 'design' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Logo Upload */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200">
                      <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-neutral-900 dark:text-white">
                        🖼️ LOGO DE LA BANCA
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        Aparece en la cabecera superior del ticket térmico
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="printLogoCheck"
                      checked={config.printLogo}
                      onChange={(e) => setConfig((prev) => ({ ...prev, printLogo: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                    />
                    <label htmlFor="printLogoCheck" className="text-xs font-bold text-neutral-800 dark:text-slate-200 cursor-pointer">
                      Imprimir logo
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200/80 dark:border-slate-800">
                  {/* Logo Preview */}
                  <div className="w-32 h-20 rounded-xl border border-dashed border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {config.logoBase64 ? (
                      <img
                        src={config.logoBase64}
                        alt="Logo Ticket"
                        className="max-h-full max-w-full object-contain filter grayscale contrast-150"
                      />
                    ) : (
                      <div className="text-center p-2 text-neutral-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-neutral-300 dark:text-slate-600" />
                        <span className="text-[9px] block">Sin logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="text-xs font-bold text-neutral-800 dark:text-slate-200">
                      Subir logo para ticket térmico
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                      Optimizado automáticamente para cabezales térmicos de 58mm y 80mm en escala de grises y alto contraste.
                    </p>

                    <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <label
                        htmlFor="logo-upload-input"
                        className="px-3.5 py-1.5 bg-neutral-900 dark:bg-slate-800 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Logo</span>
                      </label>

                      {config.logoBase64 && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles de Campos del Ticket */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200">
                      <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-neutral-900 dark:text-white">
                        🧾 CAMPOS DEL TICKET IMPRESO
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        Active o desactive los elementos a incluir en cada ticket
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'printLogo', label: 'Imprimir logo', icon: '🖼️' },
                    { key: 'printQr', label: 'Imprimir código QR', icon: '📱' },
                    { key: 'printTicketNumber', label: 'Imprimir número de ticket', icon: '🔢' },
                    { key: 'printDate', label: 'Imprimir fecha', icon: '📅' },
                    { key: 'printTime', label: 'Imprimir hora', icon: '⏰' },
                    { key: 'printTerminal', label: 'Imprimir terminal y cajero', icon: '💻' },
                    { key: 'printLotteryName', label: 'Imprimir nombre de la lotería', icon: '🎰' },
                    { key: 'printPlays', label: 'Imprimir jugadas y números', icon: '🎯' },
                    { key: 'printAmount', label: 'Imprimir monto por jugada', icon: '💵' },
                    { key: 'printTotal', label: 'Imprimir total del ticket', icon: '💰' },
                    { key: 'printFooter', label: 'Imprimir información del resultado', icon: '📜' },
                  ].map((item) => {
                    const isChecked = (config as any)[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-neutral-50 dark:bg-slate-800/80 border-neutral-300 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">{item.icon}</span>
                          <span className="text-xs font-bold text-neutral-800 dark:text-slate-200">{item.label}</span>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, [item.key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>

                {config.printFooter && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 uppercase mb-1">
                      Texto al pie del ticket (Reclamos y vigencia):
                    </label>
                    <textarea
                      rows={2}
                      value={config.customFooter || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, customFooter: e.target.value }))}
                      placeholder="Los tickets tienen vigencia de 30 días calendario..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Actualizaciones centralizadas */}
                <div className="bg-neutral-50 dark:bg-slate-800/40 p-4 rounded-xl border border-neutral-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-black uppercase text-neutral-800 dark:text-slate-200">
                        Sistema y Sincronización Centralizada
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {appVersion}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-neutral-600 dark:text-slate-400 font-medium">
                      Estado: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Conectado a Red Oficial</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Buscar Actualizaciones</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Thermal Ticket Preview (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/95 text-white rounded-2xl p-5 shadow-lg space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                VISTA PREVIA EN TIEMPO REAL
              </h3>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-bold border border-neutral-700">
                {config.paperWidth} ({config.paperWidth === '80mm' ? '48 cols' : '32 cols'})
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-purple-300 font-bold border border-neutral-700">
                {config.ticketFormat}
              </span>
            </div>
          </div>

          {/* Regla de Calibración de Columnas */}
          <div className="p-2 bg-neutral-800/80 rounded-xl border border-neutral-700/80 font-mono text-[9px] text-center space-y-1">
            <div className="text-neutral-400 text-[10px] font-bold uppercase flex items-center justify-between px-1">
              <span>📏 Regla de Cabezal Térmico:</span>
              <span className="text-emerald-400 font-black">
                {config.paperWidth === '80mm' ? '48 Columnas (80mm)' : '32 Columnas (58mm)'}
              </span>
            </div>
            <div className="bg-neutral-950 p-1.5 rounded text-amber-400 overflow-x-auto tracking-wider select-none font-bold">
              {config.paperWidth === '80mm'
                ? '|----10----|----20----|----30----|----40----|--48|'
                : '|----10----|----20----|----30--32|'}
            </div>
          </div>

          {/* Thermal Paper Simulation */}
          <div className="flex justify-center p-2 bg-neutral-800/60 rounded-xl overflow-x-auto">
            <div
              className={`w-full transition-all duration-300 ${
                config.paperWidth === '80mm' ? 'max-w-[340px]' : 'max-w-[270px]'
              } bg-white text-neutral-900 p-4 rounded-sm shadow-md font-mono text-[11px] leading-tight space-y-2`}
            >
              {/* Logo Preview */}
              {config.printLogo && (
                <div className="text-center pb-1">
                  {config.logoBase64 ? (
                    <img
                      src={config.logoBase64}
                      alt="Logo Ticket"
                      className="h-12 max-w-full mx-auto object-contain filter grayscale contrast-150"
                    />
                  ) : (
                    <div className="border border-dashed border-neutral-400 py-1 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                      [ LOGO DE LA BANCA ]
                    </div>
                  )}
                </div>
              )}

              {/* Company Header */}
              <div className="text-center space-y-0.5">
                <div className="font-extrabold text-xs uppercase tracking-tight">
                  BANCA LA FAVORITA
                </div>
                <div className="text-[10px] text-neutral-600">Seguridad y Confianza</div>
                {config.ticketFormat === 'DETAILED' && (
                  <div className="text-[8px] text-neutral-500 leading-tight">
                    RNC: 1-30-45678-9 · TEL: (809) 555-0199
                    <br />
                    AUTORIZADO POR MINISTERIO DE HACIENDA
                  </div>
                )}
                {config.ticketFormat !== 'DETAILED' && (
                  <div className="text-[9px] text-neutral-500">Tel: (809) 555-0199 · RNC: 1-30-84920-1</div>
                )}
              </div>

              <div className="border-b border-dashed border-neutral-300" />

              {/* Ticket Details */}
              <div className="space-y-0.5 text-[10px]">
                {config.printTicketNumber && (
                  <>
                    <div className="flex justify-between font-bold">
                      <span>TICKET:</span>
                      <span className="font-mono">TCK-20260926-{terminalCode}-00142</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SEGURIDAD:</span>
                      <span className="font-extrabold tracking-widest bg-neutral-100 px-1 rounded">
                        *7A39B2*
                      </span>
                    </div>
                  </>
                )}

                {(config.printDate || config.printTime) && (
                  <div className="flex justify-between">
                    <span>FECHA/HORA:</span>
                    <span>
                      {config.printDate && '26/09/2026'} {config.printTime && '01:30:00 PM'}
                    </span>
                  </div>
                )}

                {config.printTerminal && (
                  <div className="flex justify-between">
                    <span>TERMINAL:</span>
                    <span>#{terminalCode} (Cajero 1)</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-neutral-300" />

              {/* Plays Table */}
              {config.printPlays && (
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-[9px] text-neutral-600 border-b border-neutral-200 pb-0.5 uppercase">
                    <span>{config.printLotteryName ? 'LOTERÍA / JUGADA' : 'JUGADA'}</span>
                    {config.printAmount && <span>MONTO</span>}
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between items-center">
                      <div>
                        {config.printLotteryName && <div className="font-bold">REAL</div>}
                        <div className="text-neutral-700">
                          QUINIELA: <span className="font-bold tracking-wider">05</span>
                        </div>
                      </div>
                      {config.printAmount && <div className="font-bold tabular-nums">RD$50</div>}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        {config.printLotteryName && <div className="font-bold">LOTEKA</div>}
                        <div className="text-neutral-700">
                          PALÉ: <span className="font-bold tracking-wider">05 - 33</span>
                        </div>
                      </div>
                      {config.printAmount && <div className="font-bold tabular-nums">RD$50</div>}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-b border-dashed border-neutral-300" />

              {/* Total */}
              {config.printTotal && (
                <div className="flex justify-between items-center text-xs font-black">
                  <span>TOTAL:</span>
                  <span className="text-sm">RD$100.00</span>
                </div>
              )}

              {/* Unique QR Code */}
              {config.printQr && (
                <div className="text-center pt-1 border-t border-dashed border-neutral-300">
                  {previewQrDataUrl ? (
                    <img
                      src={previewQrDataUrl}
                      alt="Código QR del Ticket"
                      className="w-24 h-24 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 border border-neutral-300 mx-auto flex items-center justify-center text-[9px] text-neutral-400">
                      QR CODE
                    </div>
                  )}
                  <div className="text-[8px] font-mono text-neutral-500 mt-0.5">
                    Escanee para verificar autenticidad
                  </div>
                </div>
              )}

              {/* Footer */}
              {config.printFooter && (
                <div className="text-center text-[8px] text-neutral-500 leading-tight pt-1 border-t border-dashed border-neutral-200">
                  <p>{config.customFooter || 'Los tickets tienen vigencia de 30 días calendario.'}</p>
                  <p className="font-bold text-neutral-700 mt-0.5">¡BUENA SUERTE!</p>
                </div>
              )}

              {/* Paper Cut Visual Indicator */}
              {config.paperCutEnabled && config.cutCommand !== 'NONE' ? (
                <div className="pt-2 text-center text-[8.5px] font-mono text-neutral-600 border-t-2 border-dashed border-neutral-400 flex items-center justify-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                  <span className="font-bold uppercase tracking-wider">
                    LÍNEA DE CORTE [{config.cutCommand}: {printerService.getCutCommandHex(config.cutCommand, config.customCutHex)}]
                  </span>
                </div>
              ) : (
                <div className="pt-1.5 text-center text-[8px] font-mono text-neutral-400 border-t border-dashed border-neutral-300">
                  (Corte automático desactivado · Rasgado manual)
                </div>
              )}
            </div>
          </div>

          {/* Hardware & Port Status Summary Card */}
          <div className="p-3.5 bg-neutral-800/80 rounded-xl border border-neutral-700/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Usb className="w-3.5 h-3.5 text-blue-400" />
                <span>Driver & Puerto:</span>
              </span>
              <span className="font-bold text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                {config.driverType} · {config.defaultPort || 'USB001'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Comando Corte:</span>
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded border ${
                  config.paperCutEnabled && config.cutCommand !== 'NONE'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-700'
                }`}
              >
                {config.paperCutEnabled
                  ? `${config.cutCommand} [${printerService.getCutCommandHex(config.cutCommand, config.customCutHex)}]`
                  : 'Desactivado'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Marca Hardware:</span>
              </span>
              <span className="font-bold text-indigo-300">
                {config.hardwareBrand || 'GENERIC_POS'}
              </span>
            </div>

            {/* Quick Hardware Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestPrint('CALIBRATION')}
                className="py-2 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Calibración</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestPrint('SAMPLE_SALE')}
                className="py-2 px-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-bold rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-neutral-600"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Venta Muestra</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* ========================================================
          TEST TICKET RESULT MODAL
          ======================================================== */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-400" />
                <h4 className="font-black text-xs uppercase tracking-wider">
                  {testModalType === 'CALIBRATION'
                    ? '🧪 PRUEBA DE CALIBRACIÓN TÉCNICA'
                    : '🎟️ TICKET DE VENTA REAL (MUESTRA)'}
                </h4>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-neutral-400 hover:text-white text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {testError ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Error al Ejecutar la Prueba de Impresión</span>
                  </div>
                  <p className="text-xs font-medium">{testError}</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-1">
                    Verifique que la impresora esté encendida, con papel térmico insertado y el puerto/conexión correctos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Banner de Éxito */}
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div>Impresión enviada al cabezal con éxito</div>
                      <div className="text-[10px] font-normal text-emerald-800 dark:text-emerald-300">
                        {testModalType === 'CALIBRATION'
                          ? 'Se generó la regla de calibración y prueba de corte.'
                          : 'Se generó un ticket de venta real con formato de lotería.'}
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Parámetros Utilizados */}
                  <div className="p-3 bg-neutral-100 dark:bg-slate-800/80 rounded-xl border border-neutral-200 dark:border-slate-700 font-mono text-[10px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-slate-400">Driver Térmico:</span>
                      <strong className="text-blue-600 dark:text-blue-400 font-bold">
                        {config.driverType}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-slate-400">Ancho & Columnas:</span>
                      <strong className="text-neutral-900 dark:text-white font-bold">
                        {config.paperWidth} ({config.paperWidth === '80mm' ? '48 columnas' : '32 columnas'})
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-slate-400">Formato de Ticket:</span>
                      <strong className="text-purple-600 dark:text-purple-400 font-bold">
                        {config.ticketFormat}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-slate-400">Densidad & Puerto:</span>
                      <strong className="text-neutral-900 dark:text-white font-bold">
                        {config.printDensity} · {config.defaultPort || 'USB001'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-slate-400">Guillotina:</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">
                        {config.paperCutEnabled ? config.cutCommand : 'Desactivada'}
                      </strong>
                    </div>
                  </div>

                  {/* Receipt Preview */}
                  <div>
                    <div className="text-[10px] font-mono uppercase text-neutral-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Texto Térmico Enviado:</span>
                      <span>{testTicketOutput.split('\n').length} líneas</span>
                    </div>
                    <div className="bg-neutral-50 dark:bg-slate-950 p-4 rounded-xl border border-neutral-200 dark:border-slate-800 font-mono text-xs whitespace-pre-wrap text-neutral-800 dark:text-slate-200 leading-tight max-h-60 overflow-y-auto">
                      {testTicketOutput}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-slate-800 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyTicketText}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 text-neutral-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedTicketText ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestPrint(testModalType === 'CALIBRATION' ? 'SAMPLE_SALE' : 'CALIBRATION')}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 text-neutral-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    {testModalType === 'CALIBRATION' ? 'Probar Venta Muestra' : 'Probar Calibración'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestPrint(testModalType)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reimprimir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAPER CUT TEST RESULT MODAL
          ======================================================== */}
      {cutTestModal && cutTestModal.show && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-neutral-200 dark:border-slate-800">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <h4 className="font-black text-xs uppercase tracking-wider">
                  PRUEBA DE CORTE DE PAPEL
                </h4>
              </div>
              <button
                onClick={() => setCutTestModal(null)}
                className="text-neutral-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {cutTestModal.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Comando de corte enviado al hardware</span>
                  </div>

                  {/* Cut Command Hardware Details Card */}
                  <div className="p-3.5 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-200 dark:border-slate-700 font-mono text-xs space-y-2">
                    <div className="flex justify-between items-center pb-1.5 border-b border-neutral-200 dark:border-slate-700">
                      <span className="text-neutral-500 dark:text-slate-400">Puerto Hardware:</span>
                      <strong className="text-blue-600 dark:text-blue-400 font-bold">{cutTestModal.portUsed}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-1.5 border-b border-neutral-200 dark:border-slate-700">
                      <span className="text-neutral-500 dark:text-slate-400">Comando:</span>
                      <span className="font-bold text-neutral-800 dark:text-slate-200">{cutTestModal.cutCommand}</span>
                    </div>

                    <div className="flex justify-between items-center pb-1.5 border-b border-neutral-200 dark:border-slate-700">
                      <span className="text-neutral-500 dark:text-slate-400">Bytes HEX:</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 text-amber-400 font-bold">
                        [ {cutTestModal.hexSent} ]
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 dark:text-slate-400">Marca / Modo:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{cutTestModal.brand}</span>
                    </div>
                  </div>

                  {/* Visual Paper Cut Simulation */}
                  <div className="p-3 bg-neutral-100 dark:bg-slate-950 rounded-xl border border-dashed border-neutral-300 dark:border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-neutral-500 font-mono">Simulación de Guillotina:</div>
                    <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-slate-400 font-mono text-xs">
                      <span>- - - - -</span>
                      <Scissors className="w-4 h-4 text-amber-500 animate-bounce" />
                      <span>- - - - -</span>
                    </div>
                    <div className="text-[9px] text-neutral-400">
                      {cutTestModal.hexSent === 'NONE'
                        ? 'Corte desactivado (Manual)'
                        : `Corte ejecutado con éxito`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Error en Comunicación de Hardware</span>
                  </div>
                  <p className="text-xs">{cutTestModal.message}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCutTestModal(null)}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <UpdateNotificationModal
          user={user}
          forceShow={true}
          onClose={() => setShowUpdateModal(false)}
          onUpdateCompleted={() => {
            setShowUpdateModal(false);
          }}
        />
      )}
    </div>
  );
};
