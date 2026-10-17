import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Bluetooth,
  Printer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Sliders,
  QrCode,
  FileText,
  AlertCircle,
  Eye,
  Check,
  Battery,
  Radio,
  Save,
  HelpCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { User } from '../../types/index';
import { TerminalPrinterConfig, PrinterDevice } from '../../types/printer';
import { printerService } from '../../services/printerService';

interface MobileBluetoothPrinterSettingsProps {
  user: User;
  config: TerminalPrinterConfig;
  onUpdateConfig: (updates: Partial<TerminalPrinterConfig>) => Promise<void>;
  terminalCode: string;
}

export const MobileBluetoothPrinterSettings: React.FC<MobileBluetoothPrinterSettingsProps> = ({
  user,
  config,
  onUpdateConfig,
  terminalCode,
}) => {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTicketOutput, setTestTicketOutput] = useState<string>('');

  // Notificación temporal
  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Cargar impresoras al montar
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const list = await printerService.scanForPrinters();
        // Filtrar o priorizar Bluetooth
        setPrinters(list);
      } catch (err) {
        console.warn('Error cargando lista de impresoras', err);
      }
    };
    loadPrinters();
  }, []);

  // Generar QR para la vista previa en vivo cuando esté activado
  useEffect(() => {
    if (config.printQr) {
      QRCode.toDataURL(`TCK-DEMO-2026-${terminalCode}|COD:*7A39B2*|RD$150`, {
        margin: 1,
        width: 130,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then(setPreviewQrDataUrl)
        .catch(console.error);
    } else {
      setPreviewQrDataUrl('');
    }
  }, [config.printQr, terminalCode]);

  // Buscar / Conectar Impresora Bluetooth (Web Bluetooth API + Escáner)
  const handleScanBluetooth = async () => {
    setIsScanning(true);
    setActionNotice(null);
    try {
      // 1. Invoca detección interactiva de Web Bluetooth si el navegador lo permite
      const detected = await printerService.detectBluetoothPrinters(true);
      const updatedList = await printerService.scanForPrinters();
      setPrinters(updatedList);

      if (detected.length > 0) {
        const top = detected[0];
        await handleConnectPrinter(top.name);
        showNotice(`📶 Impresora Bluetooth "${top.name}" detectada y conectada.`);
      } else {
        showNotice('ℹ️ Búsqueda Bluetooth completada. Selecciona tu impresora de la lista.');
      }
    } catch (err: any) {
      showNotice('⚠️ Nota: ' + (err?.message || 'Búsqueda finalizada.'));
    } finally {
      setIsScanning(false);
    }
  };

  // Conectar y fijar impresora Bluetooth activa
  const handleConnectPrinter = async (printerName: string) => {
    try {
      await printerService.connectPrinter(printerName, terminalCode);
      await onUpdateConfig({
        printerName,
        printerType: 'BLUETOOTH',
        printerConnected: true,
        driverType: 'WEB_BLUETOOTH',
        paperWidth: config.paperWidth || '58mm',
      });
      // Actualizar estado local de la lista
      setPrinters((prev) =>
        prev.map((p) => ({
          ...p,
          connected: p.name === printerName,
        }))
      );
      showNotice(`🟢 Impresora Bluetooth "${printerName}" conectada y guardada como predeterminada.`);
    } catch (err: any) {
      showNotice('⚠️ Error conectando impresora: ' + err.message);
    }
  };

  // Desconectar impresora Bluetooth
  const handleDisconnectPrinter = async () => {
    try {
      await printerService.disconnectPrinter(terminalCode);
      await onUpdateConfig({
        printerConnected: false,
      });
      setPrinters((prev) =>
        prev.map((p) => ({
          ...p,
          connected: false,
        }))
      );
      showNotice('🔴 Impresora Bluetooth desconectada.');
    } catch (err: any) {
      showNotice('⚠️ Error al desconectar: ' + err.message);
    }
  };

  // Probar Impresión Bluetooth
  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      const res = await printerService.printTestTicket(terminalCode, {
        paperWidth: config.paperWidth || '58mm',
        printQr: config.printQr,
      });
      setTestTicketOutput(res.ticketText);
      setShowTestModal(true);
      showNotice('📄 Ticket de prueba enviado exitosamente al cabezal térmico Bluetooth.');
    } catch (err: any) {
      showNotice('⚠️ Error en impresión de prueba: ' + (err?.message || 'Error'));
    } finally {
      setIsTesting(false);
    }
  };

  // Alternar Código QR (Sí / No)
  const handleToggleQr = async () => {
    const nextVal = !config.printQr;
    await onUpdateConfig({
      printQr: nextVal,
    });
    showNotice(
      nextVal
        ? '✅ Código QR ACTIVADO en tickets de venta.'
        : '🚫 Código QR DESACTIVADO. El espacio del boleto se compacta automáticamente.'
    );
  };

  // Alternar Ancho de Papel (58mm / 80mm)
  const handlePaperWidth = async (width: '58mm' | '80mm') => {
    await onUpdateConfig({
      paperWidth: width,
    });
    showNotice(`📏 Formato de ticket ajustado a ${width}.`);
  };

  const isBtConnected = config.printerConnected && config.printerType === 'BLUETOOTH';
  const bluetoothPrinters = printers.filter((p) => p.type === 'BLUETOOTH');

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* 1. Header Principal Móvil – Impresión Bluetooth */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/30 shrink-0">
              <Bluetooth className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  Modo Móvil / Android
                </span>
                <span className="text-xs text-indigo-300 font-mono font-bold">
                  Terminal #{terminalCode}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Configuración Móvil – Impresión Bluetooth
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Conecta tu impresora térmica portátil Bluetooth (58mm / 80mm) para emitir tickets desde teléfonos celulares y tablets Android.
              </p>
            </div>
          </div>

          {/* Estado de Conexión en Tiempo Real */}
          <div className="self-start sm:self-auto shrink-0">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black tracking-wide border shadow-md transition-all ${
                isBtConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-500/10'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-rose-500/10'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  isBtConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isBtConnected ? 'IMPRESORA CONECTADA' : 'DESCONECTADA'}
                </span>
                <span className="text-[10px] font-mono text-slate-300 truncate max-w-[170px]">
                  {isBtConnected ? config.printerName || 'POS-58 Bluetooth' : 'Sin conexión activa'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta / Toast de Acción */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Opciones de Configuración Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Opciones de Conexión, Dispositivos y QR (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. SECCIÓN: CONECTAR IMPRESORA BLUETOOTH */}
          <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    1. Conectar Impresora Bluetooth
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Buscar y emparejar impresoras térmicas Bluetooth cercanas
                  </p>
                </div>
              </div>

              {isBtConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectPrinter}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Desconectar
                </button>
              )}
            </div>

            {/* Botón Principal de Búsqueda Bluetooth */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">
                    Escanear Dispositivos Bluetooth (BLE)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Abre el asistente de conexión de Android / Chrome para vincular impresoras portátiles 58mm o 80mm.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleScanBluetooth}
                  disabled={isScanning}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Buscando...' : 'Buscar Impresora Bluetooth'}</span>
                </button>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Consejo rápido:</strong> Enciende la impresora térmica portátil y asegúrate de que el indicador LED de Bluetooth esté parpadeando o encendido antes de pulsar Buscar.
                </span>
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN: SELECCIONAR IMPRESORA BLUETOOTH */}
          <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    2. Seleccionar Impresora
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Elige la impresora térmica para vincular y guardar en este teléfono
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {bluetoothPrinters.length} Disponibles
              </span>
            </div>

            {/* Lista de Impresoras Bluetooth Compatibles */}
            <div className="space-y-2.5">
              {bluetoothPrinters.map((p) => {
                const isSelected = config.printerName === p.name;
                const isConnected = isSelected && config.printerConnected;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isConnected
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Bluetooth className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {p.name}
                          </h4>
                          {isConnected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Conectada y Activa
                            </span>
                          ) : isSelected ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                              Seleccionada
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>ID: {p.address || p.id}</span>
                          <span>•</span>
                          <span>58mm Térmico</span>
                          {p.batteryLevel !== undefined && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                                <Battery className="w-3.5 h-3.5 text-emerald-500" />
                                {p.batteryLevel}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botón de Selección / Conexión */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {isConnected ? (
                        <button
                          type="button"
                          onClick={handleDisconnectPrinter}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          Desconectar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectPrinter(p.name)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              💾 La impresora seleccionada se guarda automáticamente en este dispositivo para que no tengas que conectarla cada vez que ingreses al sistema.
            </p>
          </div>

          {/* 3. SECCIÓN: CONFIGURACIÓN DEL CÓDIGO QR EN EL TICKET */}
          <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    3. Código QR en el Ticket
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Controla si los boletos se imprimen con o sin código QR
                  </p>
                </div>
              </div>

              {/* Indicador de Estado del QR */}
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                  config.printQr
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {config.printQr ? 'QR Activado (SÍ)' : 'QR Desactivado (NO)'}
              </span>
            </div>

            {/* Tarjeta del Interruptor con Toggle Switch Grande */}
            <div
              onClick={handleToggleQr}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                config.printQr
                  ? 'border-purple-400 dark:border-purple-500/50 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    Imprimir código QR en el ticket
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      config.printQr
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {config.printQr ? 'SÍ' : 'NO'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {config.printQr
                    ? 'El ticket se imprimirá con su código QR de verificación de seguridad oficial.'
                    : 'El ticket se imprimirá sin código QR. El sistema compacta el recibo automáticamente sin dejar espacios vacíos.'}
                </p>
              </div>

              {/* Toggle Switch */}
              <div
                className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 ${
                  config.printQr ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center text-[10px] font-black ${
                    config.printQr ? 'translate-x-6 text-purple-600' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  {config.printQr ? '✓' : '✕'}
                </div>
              </div>
            </div>

            {/* Selector de Ancho de Papel Bluetooth */}
            <div className="pt-2">
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-2">
                Ancho de Papel de la Impresora Bluetooth:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePaperWidth('58mm')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    config.paperWidth === '58mm'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      58mm (Estándar Móvil)
                    </span>
                    {config.paperWidth === '58mm' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mini impresoras portátiles de bolsillo Bluetooth (32 columnas).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaperWidth('80mm')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    config.paperWidth === '80mm'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      80mm (Móvil Ancho)
                    </span>
                    {config.paperWidth === '80mm' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Impresoras térmicas de mostrador o vehículos (48 columnas).
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* 4. SECCIÓN: PROBAR IMPRESIÓN */}
          <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    4. Probar Impresión
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Realiza una prueba térmica para verificar nitidez y calibración
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">
                  Impresión de Prueba Bluetooth ({config.paperWidth || '58mm'})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verifica que el cabezal imprima nítidamente, respetando si el QR está activado o desactivado.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTesting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Printer className={`w-4 h-4 ${isTesting ? 'animate-bounce' : ''}`} />
                <span>{isTesting ? 'Imprimiendo...' : 'Probar Impresión'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Simulador en Vivo del Ticket Móvil Térmico (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                  Vista Previa del Ticket Móvil
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {config.paperWidth || '58mm'}
              </span>
            </div>

            {/* Simulación física del rollo térmico blanco */}
            <div className="w-full max-w-[280px] mx-auto bg-white text-slate-950 p-4 rounded-xl shadow-lg border border-slate-300 font-mono text-[11px] leading-tight space-y-2 select-none">
              {/* Encabezado */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-xs tracking-wider">
                  BANCA DE LOTERÍA LA EXPRESS
                </div>
                <div className="text-[10px] font-semibold text-slate-600">
                  TERMINAL #{terminalCode} · BLUETOOTH
                </div>
                <div className="text-[10px] text-slate-500">
                  FECHA: 15/10/2026 11:30 AM
                </div>
              </div>

              {/* Detalle de Jugadas */}
              <div className="py-1 space-y-1">
                <div className="text-[10px] font-bold text-slate-700 uppercase">
                  LOTERÍA REAL (12:55 PM)
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>QUINIELA: 12</span>
                  <span className="font-bold">RD$ 50.00</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>PALÉ: 12-45</span>
                  <span className="font-bold">RD$ 100.00</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-b border-dashed border-slate-400 py-1.5 flex justify-between items-center font-black text-xs">
                <span>TOTAL:</span>
                <span className="text-sm">RD$ 150.00</span>
              </div>

              {/* Código de Verificación */}
              <div className="text-center text-[10px] font-bold pt-1">
                TICKET: #TCK-{terminalCode}-8492
                <div className="text-[9px] tracking-widest text-slate-600">
                  * 7A39B2 *
                </div>
              </div>

              {/* SECCIÓN DEL CÓDIGO QR EN TIEMPO REAL */}
              {config.printQr ? (
                <div className="pt-2 text-center space-y-1 border-t border-dashed border-slate-300 animate-in fade-in duration-200">
                  {previewQrDataUrl ? (
                    <img
                      src={previewQrDataUrl}
                      alt="Código QR del Ticket"
                      className="w-20 h-20 mx-auto object-contain border border-slate-200 p-0.5 rounded-md"
                    />
                  ) : (
                    <div className="w-18 h-18 border border-slate-300 mx-auto flex items-center justify-center text-[8px] text-slate-400">
                      QR CODE
                    </div>
                  )}
                  <span className="text-[8px] font-bold text-slate-600 tracking-wider block">
                    ESCANEABLE PARA PAGO DE PREMIOS
                  </span>
                </div>
              ) : (
                <div className="pt-1 text-center border-t border-dashed border-slate-200 text-[9px] text-slate-400 italic">
                  (Código QR desactivado — recibo compacto)
                </div>
              )}

              {/* Pie de Página */}
              <div className="text-center text-[9px] text-slate-500 pt-1 border-t border-dashed border-slate-300">
                <p>{config.customFooter || 'Conserve su boleto. 30 días de vigencia.'}</p>
                <p className="font-bold text-slate-800 mt-0.5">¡BUENA SUERTE!</p>
              </div>

              {/* Borde dentado de corte de papel */}
              <div
                className="w-full h-2 border-b-2 border-dashed border-slate-400 pt-1"
                title="Línea de corte térmico"
              />
            </div>

            {/* Resumen explicativo debajo del simulador */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Impresora Asignada:</span>
                <span className="font-mono text-blue-600 dark:text-cyan-400">
                  {config.printerName || 'POS-58'}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Código QR:</span>
                <span className={config.printQr ? 'text-emerald-500 font-black' : 'text-slate-400'}>
                  {config.printQr ? 'Activado (Sí)' : 'Desactivado (No)'}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Ancho de Cabezal:</span>
                <span className="font-mono">{config.paperWidth || '58mm'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ticket de Prueba */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Prueba Térmica Bluetooth
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Resultado enviado a {config.printerName || 'POS-58'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-2xl border border-slate-800 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {testTicketOutput}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Formato: {config.paperWidth || '58mm'} • QR: {config.printQr ? 'SÍ' : 'NO'}
              </span>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
