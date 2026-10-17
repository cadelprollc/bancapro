import React, { useRef, useState, useEffect } from 'react';
import { Ticket, CompanySettings } from '../../types/index';
import { TerminalPrinterConfig, DEFAULT_TERMINAL_PRINTER_CONFIG } from '../../types/printer';
import { printerService } from '../../services/printerService';
import { api } from '../../services/api';
import QRCode from 'qrcode';
import {
  Printer,
  Check,
  Copy,
  X,
  ShieldCheck,
  AlertCircle,
  Settings,
  Zap,
  Scissors,
  Usb,
  Bluetooth,
  Radio,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ThermalTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({ ticket, onClose, onOpenSettings }) => {
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'BANCA DE LOTERÍA LA FAVORITA',
    slogan: 'Seguridad y Confianza en cada jugada',
    address: 'Av. 27 de Febrero, Santo Domingo, D.N.',
    phone: '(809) 555-0199',
    rnc: '1-30-84920-1',
    ticketFooter: 'Los tickets tienen vigencia de 30 días calendario. Revise su jugada antes de salir.',
    paperWidth: '58mm',
  });
  const [printerConfig, setPrinterConfig] = useState<TerminalPrinterConfig>({
    ...DEFAULT_TERMINAL_PRINTER_CONFIG,
    terminalCode: ticket.terminalCode,
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('Enviado a impresora térmica correctamente');
  const [isDetecting, setIsDetecting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      if (s) setSettings(s);
    }).catch(console.error);

    printerService.getConfig(ticket.terminalCode).then((cfg) => {
      setPrinterConfig(cfg);
      if (cfg.printQr) {
        QRCode.toDataURL(`TCK:${ticket.ticketNumber}|COD:${ticket.verificationCode}|RD$${ticket.totalAmount}|DATE:${ticket.date}`, {
          margin: 1,
          width: 140,
        }).then(setQrCodeDataUrl).catch(console.error);
      }

      // If auto-print is enabled, execute direct 58mm automatically
      if (cfg.autoPrintOnSale) {
        handleDirectPrint(false);
      }
    });
  }, [ticket]);

  // Hook para gestionar estilos de impresión nativos y atajo Ctrl+P / Cmd+P
  useEffect(() => {
    document.body.classList.add('ticket-modal-open');
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('ticket-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ticket, printerConfig]);

  // Direct 58mm thermal print detecting USB / Bluetooth
  const handleDirectPrint = async (interactive = false) => {
    setPrintError(null);
    setIsDetecting(true);
    try {
      const res = await printerService.directThermalPrint58mm(ticket, ticket.terminalCode, {
        interactiveDetect: interactive,
        companySettings: settings,
      });

      // Actualizar config local con la impresora seleccionada
      const updatedCfg = await printerService.getConfig(ticket.terminalCode);
      setPrinterConfig(updatedCfg);

      setSuccessMessage(res.message);
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3500);
    } catch (err: any) {
      setPrintError(err?.message || 'Error al conectar con la impresora térmica 58mm.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Impresión nativa con ventana del navegador (window.print() / PDF / Spooler del sistema)
  const handlePrint = () => {
    setPrintError(null);
    setPrintSuccess(false);

    try {
      window.print();
      setSuccessMessage('Diálogo de impresión del sistema abierto (window.print).');
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 2500);
    } catch (e: any) {
      printerService.triggerHardwarePrint(
        printerService.formatTicketText(ticket, printerConfig),
        `Ticket ${ticket.ticketNumber}`
      );
    }
  };

  const handleCopyText = () => {
    const text = printerService.format58mmTicket(ticket, settings);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Printable thermal container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200">
        {/* Top Controls (Hidden during print) */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm tracking-wide block">
                Ticket Emitido con Éxito
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-mono">
                {printerConfig.printerType === 'USB' ? (
                  <Usb className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : printerConfig.printerType === 'BLUETOOTH' ? (
                  <Bluetooth className="w-3 h-3 text-blue-400 shrink-0" />
                ) : (
                  <Printer className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                <span>
                  {printerConfig.printerName || 'POS-58'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[9px] font-bold text-emerald-400 border border-neutral-700">
                  58mm Auto
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleDirectPrint(true)}
              disabled={isDetecting}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 hover:text-white rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 border border-neutral-700"
              title="Detectar y vincular impresora USB o Bluetooth"
            >
              <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detectando...' : 'Detectar USB/BT'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Imprimir ticket vía diálogo del navegador / PDF (window.print() o Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                title="Ajustes de Impresora"
              >
                <Settings className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <button
              onClick={handleCopyText}
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors text-xs flex items-center gap-1"
              title="Copiar texto de ticket (58mm)"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printer Error or Notice */}
        {printError && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2.5 print:hidden">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{printError}</span>
          </div>
        )}

        {printSuccess && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 print:hidden animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Banner 58mm Automatic Formatting Notice */}
        <div className="mx-4 mt-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 rounded-xl flex items-center justify-between text-[11px] text-cyan-900 dark:text-cyan-200 print:hidden font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Formato automático: <strong>58mm térmico</strong> (32 columnas)</span>
          </div>
          <span className="font-bold text-[10px] bg-cyan-200/60 dark:bg-cyan-900 px-1.5 py-0.5 rounded">
            ESC/POS
          </span>
        </div>

        {/* The Receipt (Visible in modal and printable on 58mm/80mm thermal printers) */}
        <div className="p-6 bg-neutral-100/60 overflow-x-hidden flex justify-center">
          <div
            ref={ticketRef}
            id="printable-ticket"
            className="w-full max-w-[300px] font-mono text-xs text-neutral-900 leading-tight space-y-2.5 bg-white p-4 border border-dashed border-neutral-300 rounded-md shadow-md print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Logo in top header if enabled */}
            {printerConfig.printLogo && (
              <div className="text-center pb-1">
                {printerConfig.logoBase64 ? (
                  <img
                    src={printerConfig.logoBase64}
                    alt="Logo Banca"
                    className="max-h-12 max-w-full mx-auto object-contain filter grayscale contrast-150"
                  />
                ) : (
                  <div className="border border-dashed border-neutral-400 py-1 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                    [ LOGO DE LA BANCA ]
                  </div>
                )}
              </div>
            )}

            {/* Header */}
            <div className="text-center space-y-0.5">
              <h2 className="font-extrabold text-sm uppercase tracking-wider">
                {settings.companyName}
              </h2>
              <p className="text-[11px] text-neutral-600">{settings.slogan}</p>
              <p className="text-[10px] text-neutral-500">{settings.address}</p>
              <p className="text-[10px] text-neutral-500">Tel: {settings.phone} | RNC: {settings.rnc}</p>
            </div>

            <div className="border-b border-dashed border-neutral-400 my-1" />

            {/* Ticket Info */}
            <div className="space-y-0.5 text-[11px]">
              {printerConfig.printTicketNumber && (
                <>
                  <div className="flex justify-between font-bold">
                    <span>TICKET:</span>
                    <span className="tabular-nums font-mono">{ticket.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CÓDIGO SEGURIDAD:</span>
                    <span className="font-extrabold tracking-widest bg-neutral-100 px-1 rounded">
                      *{ticket.verificationCode}*
                    </span>
                  </div>
                </>
              )}

              {(printerConfig.printDate || printerConfig.printTime) && (
                <div className="flex justify-between">
                  <span>FECHA / HORA:</span>
                  <span className="tabular-nums font-mono">
                    {printerConfig.printDate && ticket.date} {printerConfig.printTime && ticket.time}
                  </span>
                </div>
              )}

              {printerConfig.printTerminal && (
                <div className="flex justify-between">
                  <span>TERMINAL:</span>
                  <span>#{ticket.terminalCode} ({ticket.userName})</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>ESTADO:</span>
                <span className="font-bold uppercase text-emerald-700">{ticket.status}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-neutral-400 my-1" />

            {/* Plays Table */}
            {printerConfig.printPlays && (
              <div>
                <div className="flex justify-between font-bold text-[10px] uppercase text-neutral-700 pb-1 border-b border-neutral-300">
                  <span>{printerConfig.printLotteryName ? 'LOTERÍA / JUGADA' : 'JUGADA'}</span>
                  {printerConfig.printAmount && <span>MONTO</span>}
                </div>
                <div className="divide-y divide-dashed divide-neutral-200 mt-1">
                  {ticket.plays.map((play, idx) => (
                    <div key={idx} className="py-1 flex justify-between items-start text-[11px]">
                      <div>
                        {printerConfig.printLotteryName && (
                          <div className="font-bold">
                            {play.lotteryName} {play.lottery2Name ? `+ ${play.lottery2Name}` : ''}
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-600">
                          {play.playType.replace('_', ' ')}:{' '}
                          <span className="font-bold text-neutral-900 tracking-wider font-mono">
                            {play.numbers.join(' - ')}
                          </span>
                        </div>
                      </div>
                      {printerConfig.printAmount && (
                        <div className="font-bold tabular-nums text-right">
                          RD${play.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-dashed border-neutral-400 my-1" />

            {/* Total */}
            {printerConfig.printTotal && (
              <div className="flex justify-between items-center text-sm font-extrabold">
                <span>TOTAL JUGADO:</span>
                <span className="tabular-nums text-base">RD${ticket.totalAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Unique QR Code if enabled */}
            {printerConfig.printQr && (
              <div className="pt-2 text-center space-y-1 border-t border-dashed border-neutral-300">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Código QR del Ticket"
                    className="w-24 h-24 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 border border-neutral-300 mx-auto flex items-center justify-center text-[9px] text-neutral-400">
                    QR CODE
                  </div>
                )}
                <div className="text-[8px] font-mono tracking-widest text-neutral-600">
                  {ticket.ticketNumber} · VERIFICACIÓN
                </div>
              </div>
            )}

            {/* Footer Disclaimer */}
            {printerConfig.printFooter && (
              <div className="pt-2 text-center text-[9px] text-neutral-500 leading-tight border-t border-dashed border-neutral-300">
                <p>{printerConfig.customFooter || settings.ticketFooter}</p>
                <p className="mt-1 font-semibold text-neutral-700">¡BUENA SUERTE!</p>
              </div>
            )}

            {/* Paper Cut Indicator */}
            {printerConfig.paperCutEnabled && printerConfig.cutCommand && printerConfig.cutCommand !== 'NONE' && (
              <div className="pt-2 text-center text-[8.5px] font-mono text-neutral-500 border-t-2 border-dashed border-neutral-400 flex items-center justify-center gap-1.5">
                <Scissors className="w-3 h-3 text-neutral-600" />
                <span className="font-bold uppercase tracking-wider">
                  CORTE [{printerConfig.cutCommand}]
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions (Hidden during print) */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col gap-2 print:hidden">
          <button
            onClick={() => handleDirectPrint(false)}
            disabled={isDetecting}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60"
            title="Detecta automáticamente la impresora conectada (USB/Bluetooth) y envía el ticket formateado en 58mm"
          >
            {isDetecting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : printerConfig.printerType === 'USB' ? (
              <Usb className="w-4 h-4 text-cyan-200" />
            ) : (
              <Bluetooth className="w-4 h-4 text-blue-200" />
            )}
            <span>
              {isDetecting
                ? 'Detectando y Enviando...'
                : `⚡ Impresión Térmica Directa 58mm (${printerConfig.printerType || 'USB/BT'})`}
            </span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="w-1/2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              title="Abrir diálogo de impresión del sistema o guardar en PDF (window.print())"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir (Navegador)</span>
            </button>
            <button
              onClick={onClose}
              className="w-1/2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cerrar Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
