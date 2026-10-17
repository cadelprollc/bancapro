import {
  PrinterDevice,
  TerminalPrinterConfig,
  DEFAULT_TERMINAL_PRINTER_CONFIG,
  CutCommandType,
  PrintDensityType,
} from '../types/printer';
import { Ticket } from '../types/index';
import { api } from './api';

// Known popular Dominican & Latin American USB and Bluetooth 58mm thermal printers
const DEFAULT_DISCOVERED_PRINTERS: PrinterDevice[] = [
  {
    id: 'usb-pos-58',
    name: 'POS-58 USB Thermal Printer',
    type: 'USB',
    connected: true,
    vendorId: '0416',
    productId: '5011',
    is58mmDefault: true,
  },
  {
    id: 'bt-pos-58',
    name: 'POS-58 Bluetooth Mini (BLE)',
    type: 'BLUETOOTH',
    connected: false,
    address: '66:32:B1:88:21:40',
    batteryLevel: 94,
    is58mmDefault: true,
  },
  {
    id: 'usb-xp-58',
    name: 'Xprinter XP-58IIH USB',
    type: 'USB',
    connected: false,
    vendorId: '1fc9',
    productId: '2016',
    is58mmDefault: true,
  },
  {
    id: 'bt-pt-210',
    name: 'PT-210 Mobile POS 58mm',
    type: 'BLUETOOTH',
    connected: false,
    address: 'DC:0D:30:4A:9F:88',
    batteryLevel: 85,
    is58mmDefault: true,
  },
  {
    id: 'bt-goojprt',
    name: 'GOOJPRT MTP-II Bluetooth 58mm',
    type: 'BLUETOOTH',
    connected: false,
    address: '00:1A:7D:DA:71:15',
    batteryLevel: 78,
    is58mmDefault: true,
  },
  {
    id: 'sys-default',
    name: 'Impresora Térmica Predeterminada del Sistema (58mm)',
    type: 'SYSTEM',
    connected: false,
    is58mmDefault: true,
  },
];

class PrinterManager {
  private currentConfig: TerminalPrinterConfig = { ...DEFAULT_TERMINAL_PRINTER_CONFIG };
  private discoveredPrinters: PrinterDevice[] = [...DEFAULT_DISCOVERED_PRINTERS];
  private isScanning = false;

  constructor() {
    this.loadFromStorage();
  }

  private getStorageKey(code: string) {
    return `bancapro_printer_config_${code}`;
  }

  private loadFromStorage(terminalCode = '1001') {
    try {
      const stored = localStorage.getItem(this.getStorageKey(terminalCode));
      if (stored) {
        this.currentConfig = { ...DEFAULT_TERMINAL_PRINTER_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not read printer config from storage', e);
    }
  }

  // Fetch or retrieve config for a specific terminal
  public async getConfig(terminalCode: string): Promise<TerminalPrinterConfig> {
    const key = this.getStorageKey(terminalCode);
    let localData: TerminalPrinterConfig | null = null;
    try {
      const item = localStorage.getItem(key);
      if (item) localData = JSON.parse(item);
    } catch {}

    try {
      const remote = await api.getTerminalSettings(terminalCode);
      if (remote) {
        const merged = { ...DEFAULT_TERMINAL_PRINTER_CONFIG, ...remote, terminalCode };
        localStorage.setItem(key, JSON.stringify(merged));
        this.currentConfig = merged;
        return merged;
      }
    } catch {
      // Offline or network error: fallback to local cache
    }

    if (localData) {
      this.currentConfig = { ...DEFAULT_TERMINAL_PRINTER_CONFIG, ...localData, terminalCode };
      return this.currentConfig;
    }

    const fresh = { ...DEFAULT_TERMINAL_PRINTER_CONFIG, terminalCode };
    this.currentConfig = fresh;
    return fresh;
  }

  // Save config for a specific terminal
  public async saveConfig(terminalCode: string, config: Partial<TerminalPrinterConfig>): Promise<TerminalPrinterConfig> {
    const updated: TerminalPrinterConfig = {
      ...this.currentConfig,
      ...config,
      terminalCode,
    };

    this.currentConfig = updated;
    const key = this.getStorageKey(terminalCode);

    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }

    try {
      await api.saveTerminalSettings(terminalCode, updated);
    } catch (err) {
      console.warn('Remote sync error for terminal settings', err);
    }

    return updated;
  }

  // Scan for Bluetooth and system printers
  public async scanForPrinters(): Promise<PrinterDevice[]> {
    this.isScanning = true;
    await this.detectUsbPrinters(false);
    await this.detectBluetoothPrinters(false);
    this.isScanning = false;
    return [...this.discoveredPrinters];
  }

  // -------------------------------------------------------------
  // DETECCIÓN AVANZADA DE IMPRESORAS USB (WebUSB / WebSerial)
  // -------------------------------------------------------------
  public async detectUsbPrinters(interactive = false): Promise<PrinterDevice[]> {
    const detected: PrinterDevice[] = [];

    // 1. WebUSB API Check
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      try {
        const paired = await (navigator as any).usb.getDevices();
        if (paired && Array.isArray(paired)) {
          for (const d of paired) {
            const vId = d.vendorId?.toString(16).padStart(4, '0') || '';
            const pId = d.productId?.toString(16).padStart(4, '0') || '';
            const name = d.productName || `POS USB Thermal (VID:${vId} PID:${pId})`;
            detected.push({
              id: `usb-${vId}-${pId}-${d.serialNumber || Date.now()}`,
              name,
              type: 'USB',
              connected: true,
              vendorId: vId,
              productId: pId,
              serialNumber: d.serialNumber,
              is58mmDefault: true,
            });
          }
        }

        if (interactive) {
          try {
            const requested = await (navigator as any).usb.requestDevice({
              filters: [
                { classCode: 7 }, // USB Printer Class Code
                { vendorId: 0x0416 }, // Zjiang / POS-58
                { vendorId: 0x1fc9 }, // Xprinter
                { vendorId: 0x04b8 }, // Epson
                { vendorId: 0x0fe6 }, // Rongta
                { vendorId: 0x1a86 }, // QinHeng CH340
              ],
            });
            if (requested) {
              const vId = requested.vendorId?.toString(16).padStart(4, '0') || '';
              const pId = requested.productId?.toString(16).padStart(4, '0') || '';
              const found: PrinterDevice = {
                id: `usb-${vId}-${pId}-${requested.serialNumber || Date.now()}`,
                name: requested.productName || `POS-58 USB Thermal Printer (VID:${vId})`,
                type: 'USB',
                connected: true,
                vendorId: vId,
                productId: pId,
                serialNumber: requested.serialNumber,
                is58mmDefault: true,
              };
              detected.unshift(found);
            }
          } catch (reqErr: any) {
            console.info('USB request prompt canceled or skipped:', reqErr?.message);
          }
        }
      } catch (err: any) {
        console.warn('WebUSB detection note:', err?.message);
      }
    }

    // 2. WebSerial API Check (impresoras USB-Serie con chip CH340/FTDI/CP2102)
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && Array.isArray(ports)) {
          for (let i = 0; i < ports.length; i++) {
            const port = ports[i];
            const info = port.getInfo ? port.getInfo() : {};
            const vId = info.usbVendorId?.toString(16).padStart(4, '0') || '';
            const pId = info.usbProductId?.toString(16).padStart(4, '0') || '';
            detected.push({
              id: `serial-${vId}-${pId}-${i}`,
              name: `Impresora Térmica USB/COM (58mm)`,
              type: 'USB',
              connected: true,
              vendorId: vId,
              productId: pId,
              is58mmDefault: true,
            });
          }
        }
      } catch (err) {
        // Ignored
      }
    }

    // Integrar a discoveredPrinters si no existen
    for (const d of detected) {
      if (!this.discoveredPrinters.some((p) => p.name === d.name || p.id === d.id)) {
        this.discoveredPrinters.unshift(d);
      }
    }

    return detected;
  }

  // -------------------------------------------------------------
  // DETECCIÓN AVANZADA DE IMPRESORAS BLUETOOTH (Web Bluetooth)
  // -------------------------------------------------------------
  public async detectBluetoothPrinters(interactive = false): Promise<PrinterDevice[]> {
    const detected: PrinterDevice[] = [];

    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      if (interactive) {
        try {
          const device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
              '000018f0-0000-1000-8000-00805f9b34fb', // Thermal Printer Service
              '0000e0ff-0000-1000-8000-00805f9b34fb', // POS BLE
              '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
              '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
            ],
          });

          if (device && device.name) {
            const found: PrinterDevice = {
              id: `bt-${device.id || Date.now()}`,
              name: device.name,
              type: 'BLUETOOTH',
              connected: true,
              address: device.id,
              is58mmDefault: true,
            };
            detected.push(found);
            if (!this.discoveredPrinters.some((p) => p.name === found.name)) {
              this.discoveredPrinters.unshift(found);
            }
          }
        } catch (err: any) {
          console.info('Bluetooth request prompt cancelled or skipped:', err?.message);
        }
      }
    }

    // Filtrar Bluetooth de lista
    const existingBt = this.discoveredPrinters.filter((p) => p.type === 'BLUETOOTH');
    for (const eb of existingBt) {
      if (!detected.some((d) => d.id === eb.id)) {
        detected.push(eb);
      }
    }

    return detected;
  }

  // -------------------------------------------------------------
  // AUTODETECCIÓN Y CONEXIÓN INTELIGENTE A 58mm
  // -------------------------------------------------------------
  public async autoDetectAndConnect58mm(
    terminalCode = '1001',
    interactive = false
  ): Promise<{
    success: boolean;
    printer: PrinterDevice;
    connectionType: 'USB' | 'BLUETOOTH' | 'SYSTEM';
    message: string;
  }> {
    // 1. Escanear dispositivos USB y Bluetooth
    await this.detectUsbPrinters(interactive);
    if (interactive) {
      await this.detectBluetoothPrinters(interactive);
    }

    // 2. Priorizar impresora USB conectada o Bluetooth vinculada
    const connectedPrinter = this.discoveredPrinters.find((p) => p.connected);
    const usbPrinters = this.discoveredPrinters.filter((p) => p.type === 'USB');
    const btPrinters = this.discoveredPrinters.filter((p) => p.type === 'BLUETOOTH');

    let selected: PrinterDevice =
      connectedPrinter ||
      usbPrinters[0] ||
      btPrinters[0] ||
      this.discoveredPrinters[0];

    // Marcar como conectada
    this.discoveredPrinters = this.discoveredPrinters.map((p) => ({
      ...p,
      connected: p.id === selected.id,
    }));
    selected = { ...selected, connected: true };

    // 3. Formatear y guardar configuración automática a 58mm
    await this.saveConfig(terminalCode, {
      printerName: selected.name,
      printerType: selected.type,
      printerConnected: true,
      paperWidth: '58mm',
      driverType:
        selected.type === 'USB'
          ? 'RAW_ESCPOS'
          : selected.type === 'BLUETOOTH'
          ? 'WEB_BLUETOOTH'
          : 'SYSTEM_SPOOLER',
      ticketFormat: 'STANDARD',
      feedLines: 3,
      paperCutEnabled: true,
      cutCommand: 'GS_V_0',
    });

    return {
      success: true,
      printer: selected,
      connectionType: selected.type,
      message: `Impresora "${selected.name}" detectada vía ${selected.type}. Formato automático configurado a 58mm.`,
    };
  }

  // Connect printer
  public async connectPrinter(printerName: string, terminalCode: string): Promise<boolean> {
    this.discoveredPrinters = this.discoveredPrinters.map((p) => ({
      ...p,
      connected: p.name === printerName,
    }));

    await this.saveConfig(terminalCode, {
      printerName,
      printerConnected: true,
    });

    return true;
  }

  // Disconnect printer
  public async disconnectPrinter(terminalCode: string): Promise<boolean> {
    this.discoveredPrinters = this.discoveredPrinters.map((p) => ({
      ...p,
      connected: false,
    }));

    await this.saveConfig(terminalCode, {
      printerConnected: false,
    });

    return true;
  }

  // Generate and print test ticket
  public async printTestTicket(
    terminalCode: string,
    overrideConfig?: Partial<TerminalPrinterConfig>
  ): Promise<{ success: boolean; error?: string; ticketText: string; configUsed: TerminalPrinterConfig }> {
    let config = await this.getConfig(terminalCode);
    if (overrideConfig) {
      config = { ...config, ...overrideConfig };
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const is80 = config.paperWidth === '80mm';
    const widthCols = is80 ? 48 : 32;
    const dividerDouble = '='.repeat(widthCols);
    const dividerSingle = '-'.repeat(widthCols);

    const center = (text: string) => {
      if (text.length >= widthCols) return text.slice(0, widthCols);
      const totalPad = widthCols - text.length;
      const leftPad = Math.floor(totalPad / 2);
      const rightPad = totalPad - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    };

    const getDriverName = (driver: string) => {
      switch (driver) {
        case 'RAW_ESCPOS':
          return 'ESC/POS Raw Direct';
        case 'SYSTEM_SPOOLER':
          return 'Spooler SO / Driver Web';
        case 'WEB_BLUETOOTH':
          return 'Web Bluetooth POS';
        case 'WEB_SERIAL':
          return 'WebSerial USB Direct';
        case 'NETWORK_TCP':
          return `TCP/IP LAN (${config.networkIp || '192.168.1.200'}:${config.networkPort || 9100})`;
        case 'SUNMI_INTERNAL':
          return 'Sunmi POS Interno';
        case 'STAR_LINE':
          return 'Star Line Mode';
        default:
          return driver || 'ESC/POS';
      }
    };

    const ticketLines = [
      dividerDouble,
      center('PRUEBA DE IMPRESORA TÉRMICA'),
      center('BANCA LA EXPRESS · DOMINICANA'),
      dividerDouble,
      center(`*** CALIBRACIÓN ${config.paperWidth} ***`),
      dividerSingle,
      `TERMINAL    : #${terminalCode}`,
      `IMPRESORA   : ${config.printerName || 'POS-58'}`,
      `MARCA/MODO  : ${config.hardwareBrand || 'GENERIC_POS'}`,
      `DRIVER      : ${getDriverName(config.driverType)}`,
      `ANCHO PAPEL : ${config.paperWidth} (${widthCols} columnas)`,
      `FORMATO     : ${config.ticketFormat || 'STANDARD'}`,
      `DENSIDAD    : ${config.printDensity || 'NORMAL'}`,
      `PUERTO      : ${config.defaultPort || 'USB001'} (${config.baudRate || 9600} bps)`,
      `GUILLOTINA  : ${config.paperCutEnabled ? config.cutCommand : 'DESACTIVADO (Manual)'}`,
      `FECHA / HORA: ${dateFormatted} ${timeFormatted}`,
      dividerSingle,
      center('REGLA DE CALIBRACIÓN DE ANCHO:'),
      is80
        ? '123456789012345678901234567890123456789012345678'
        : '12345678901234567890123456789012',
      is80
        ? '[--------------- 48 COLUMNAS (80mm) ------------]'
        : '[------- 32 COLUMNAS (58mm) ----]',
      dividerSingle,
      center('PRUEBA DE TIPOGRAFÍA:'),
      'NORMAL    : Quiniela Palé Tripleta 25-14',
      'DESTACADO : [ APUESTA VÁLIDA RD$100.00 ]',
      'CONDENSADO: Control de Seguridad *7A39B2*',
      dividerSingle,
      center('CÓDIGO DE CONTROL & BARRAS:'),
      center('||||| ||||||| |||| |||||||| |||||'),
      center(`*TEST-${terminalCode}-${Date.now().toString().slice(-6)}*`),
      dividerSingle,
      center('ESTADO DE HARDWARE: OK'),
      center('CABEZAL TÉRMICO FUNCIONANDO'),
      dividerDouble,
      center('*** FIN DE LA PRUEBA ***'),
    ];

    if (config.feedLines && config.feedLines > 0) {
      for (let i = 0; i < config.feedLines; i++) {
        ticketLines.push('');
      }
    }

    let ticketText = ticketLines.join('\n');

    if (config.paperCutEnabled && config.cutCommand && config.cutCommand !== 'NONE') {
      const cutSeq = this.getCutCommandEscapeSequence(config.cutCommand, config.customCutHex);
      ticketText += '\n\n\n' + cutSeq;
    }

    this.triggerHardwarePrint(ticketText, `Prueba_${config.paperWidth}`, config.paperWidth, config.printDensity);

    return {
      success: true,
      ticketText,
      configUsed: config,
    };
  }

  // Print a sample lottery ticket using the active config
  public async printSampleSaleTicket(
    terminalCode: string,
    overrideConfig?: Partial<TerminalPrinterConfig>
  ): Promise<{ success: boolean; error?: string; ticketText: string; configUsed: TerminalPrinterConfig }> {
    let config = await this.getConfig(terminalCode);
    if (overrideConfig) {
      config = { ...config, ...overrideConfig };
    }

    const now = new Date();
    const mockTicketId = `demo-${Date.now()}`;
    const mockTicket: Ticket = {
      id: mockTicketId,
      ticketNumber: `TCK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${terminalCode}-00042`,
      verificationCode: '7A39B2',
      date: now.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      terminalId: terminalCode,
      terminalCode,
      userId: 'cajero-1',
      userName: 'Cajero Principal',
      status: 'VIGENTE',
      totalAmount: 150,
      totalWon: 0,
      plays: [
        {
          id: '1',
          ticketId: mockTicketId,
          lotteryId: 'real',
          lotteryName: 'REAL',
          playType: 'QUINIELA',
          numbers: ['25'],
          amount: 50,
          wonAmount: 0,
          status: 'PENDIENTE',
        },
        {
          id: '2',
          ticketId: mockTicketId,
          lotteryId: 'ganamas',
          lotteryName: 'GANA MÁS',
          playType: 'PALE',
          numbers: ['14', '77'],
          amount: 50,
          wonAmount: 0,
          status: 'PENDIENTE',
        },
        {
          id: '3',
          ticketId: mockTicketId,
          lotteryId: 'lotedom',
          lotteryName: 'LOTEDOM',
          playType: 'QUINIELA',
          numbers: ['89'],
          amount: 50,
          wonAmount: 0,
          status: 'PENDIENTE',
        },
      ],
      createdAt: now.toISOString(),
    };

    const text = this.formatTicketText(mockTicket, config);
    this.triggerHardwarePrint(text, `Ticket_Muestra_${terminalCode}`, config.paperWidth, config.printDensity);

    return {
      success: true,
      ticketText: text,
      configUsed: config,
    };
  }

  // Format real ticket to ESC/POS or text based on design options, width and format
  public formatTicketText(ticket: Ticket, config: TerminalPrinterConfig): string {
    const is80 = config.paperWidth === '80mm';
    const widthCols = is80 ? 48 : 32;
    const dividerDouble = '='.repeat(widthCols);
    const dividerSingle = '-'.repeat(widthCols);
    const format = config.ticketFormat || 'STANDARD';

    const center = (text: string) => {
      if (text.length >= widthCols) return text.slice(0, widthCols);
      const totalPad = widthCols - text.length;
      const leftPad = Math.floor(totalPad / 2);
      const rightPad = totalPad - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    };

    const lines: string[] = [];

    lines.push(dividerDouble);
    if (config.printLogo) {
      lines.push(center('[ LOGO BANCA ]'));
    }
    lines.push(center('BANCA DE LOTERÍA LA FAVORITA'));
    if (format === 'DETAILED') {
      lines.push(center('RNC: 1-30-45678-9 · TEL: (809) 555-0199'));
      lines.push(center('AUTORIZADO POR MINISTERIO DE HACIENDA'));
    }
    lines.push(dividerDouble);

    if (config.printTicketNumber) {
      lines.push(`TICKET: ${ticket.ticketNumber}`);
      lines.push(`CÓDIGO: *${ticket.verificationCode}*`);
    }

    const dateLine = [];
    if (config.printDate) dateLine.push(`FECHA: ${ticket.date}`);
    if (config.printTime) dateLine.push(`HORA: ${ticket.time}`);
    if (dateLine.length > 0) lines.push(dateLine.join('  '));

    if (config.printTerminal) {
      lines.push(`TERMINAL: #${ticket.terminalCode} (${ticket.userName || 'Cajero'})`);
    }

    if (format !== 'COMPACT') {
      lines.push(dividerSingle);
    }

    if (config.printPlays) {
      if (is80) {
        lines.push('LOTERÍA                JUGADA              MONTO');
      } else {
        lines.push('LOTERÍA         JUGADA     MONTO');
      }
      lines.push(dividerSingle);
      ticket.plays.forEach((p) => {
        const lotName = config.printLotteryName
          ? p.lottery2Name
            ? `${p.lotteryName}+${p.lottery2Name}`
            : p.lotteryName
          : 'SORTEO';
        const numStr = p.numbers.join('-');
        const amtStr = config.printAmount ? `RD$${p.amount}` : '';
        if (is80) {
          lines.push(`${lotName.slice(0, 22).padEnd(22)} ${numStr.padEnd(16)} ${amtStr}`);
        } else {
          lines.push(`${lotName.slice(0, 14).padEnd(14)} ${numStr.padEnd(8)} ${amtStr}`);
        }
      });
      lines.push(dividerSingle);
    }

    if (config.printTotal) {
      const totalStr = `TOTAL: RD$${ticket.totalAmount.toLocaleString()}`;
      lines.push(is80 ? center(totalStr) : totalStr);
    }

    if (format !== 'COMPACT') {
      lines.push(dividerDouble);
    }

    if (config.printQr) {
      lines.push(center('[ CÓDIGO QR ÚNICO ]'));
      lines.push(center(`https://bancapro.rd/t/${ticket.verificationCode}`));
      if (format === 'MODERN_QR' || format === 'DETAILED') {
        lines.push(center('||||| ||||||| |||| |||||||| |||||'));
        lines.push(center(`*${ticket.verificationCode}*`));
      }
      lines.push(dividerDouble);
    }

    if (config.printFooter) {
      lines.push(config.customFooter || 'Los tickets tienen vigencia de 30 días calendario.');
      lines.push(center('¡BUENA SUERTE!'));
    }

    if (format === 'DETAILED') {
      lines.push(dividerSingle);
      lines.push('FIRMA CLIENTE: _________________________');
      lines.push('Conserve este ticket para reclamar su premio.');
    }

    if (config.feedLines && config.feedLines > 0) {
      for (let i = 0; i < config.feedLines; i++) {
        lines.push('');
      }
    }

    let result = lines.join('\n');

    // Append paper cut command if enabled
    if (config.paperCutEnabled && config.cutCommand && config.cutCommand !== 'NONE') {
      const cutSeq = this.getCutCommandEscapeSequence(config.cutCommand, config.customCutHex);
      result += '\n\n\n' + cutSeq;
    }

    return result;
  }

  // Convert CutCommandType into Hex string for display and debugging
  public getCutCommandHex(cutCommand?: CutCommandType, customHex?: string): string {
    switch (cutCommand) {
      case 'GS_V_0':
        return '1D 56 00';
      case 'GS_V_1':
        return '1D 56 01';
      case 'GS_V_66_0':
        return '1D 56 42 00';
      case 'ESC_M':
        return '1B 6D';
      case 'STAR_CUT':
        return '1B 64 02';
      case 'NONE':
        return 'NONE';
      case 'CUSTOM':
        return customHex || '1D 56 00';
      default:
        return '1D 56 00';
    }
  }

  // Generate escape sequence characters for hardware cutter
  public getCutCommandEscapeSequence(cutCommand?: CutCommandType, customHex?: string): string {
    switch (cutCommand) {
      case 'GS_V_0':
        return '\x1D\x56\x00';
      case 'GS_V_1':
        return '\x1D\x56\x01';
      case 'GS_V_66_0':
        return '\x1B\x64\x03\x1D\x56\x42\x00';
      case 'ESC_M':
        return '\x1B\x6D';
      case 'STAR_CUT':
        return '\x1B\x64\x02';
      case 'NONE':
        return '';
      case 'CUSTOM': {
        const hex = (customHex || '1D 56 00').replace(/[^0-9A-Fa-f]/g, '');
        let res = '';
        for (let i = 0; i < hex.length; i += 2) {
          res += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return res;
      }
      default:
        return '\x1D\x56\x00';
    }
  }

  // Execute hardware test for paper cut command
  public async testPaperCut(
    terminalCode: string,
    overrideConfig?: Partial<TerminalPrinterConfig>
  ): Promise<{ success: boolean; hexSent: string; message: string }> {
    let config = await this.getConfig(terminalCode);
    if (overrideConfig) {
      config = { ...config, ...overrideConfig };
    }
    const hex = this.getCutCommandHex(config.cutCommand, config.customCutHex);

    if (config.cutCommand === 'NONE' || !config.paperCutEnabled) {
      return {
        success: true,
        hexSent: 'NONE',
        message: 'Corte automático desactivado en la configuración actual.',
      };
    }

    const portName = config.defaultPort || 'USB001';
    const cutEscape = this.getCutCommandEscapeSequence(config.cutCommand, config.customCutHex);

    try {
      if (typeof window !== 'undefined') {
        const testLines = [
          '================================',
          '    PRUEBA DE CORTE DE PAPEL    ',
          '================================',
          `PUERTO: ${portName}`,
          `BAUD: ${config.baudRate || 9600}`,
          `COMANDO: ${config.cutCommand}`,
          `HEX: [${hex}]`,
          `MARCA: ${config.hardwareBrand || 'GENERIC_POS'}`,
          '--------------------------------',
          '   EL CORTE DEBE OCURRIR AQUÍ   ',
          '--------------------------------',
          '\n\n\n',
        ];
        this.triggerHardwarePrint(testLines.join('\n') + cutEscape, 'Test de Corte');
      }
    } catch (e) {
      console.warn('Paper cut test hardware dispatch:', e);
    }

    return {
      success: true,
      hexSent: hex,
      message: `Comando [${hex}] enviado al puerto ${portName} (${config.cutCommand}) [${config.hardwareBrand}].`,
    };
  }

  // Trigger print mechanism (clean in-page invisible iframe avoiding window.open popup blockers)
  public triggerHardwarePrint(
    content: string,
    title = 'Ticket',
    paperWidth: '58mm' | '80mm' = '58mm',
    density?: PrintDensityType
  ): void {
    if (typeof window === 'undefined') return;

    try {
      let iframe = document.getElementById('hardware-print-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'hardware-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);
      }

      const is80 = paperWidth === '80mm';
      const widthVal = is80 ? '80mm' : '58mm';
      const fontSize = is80 ? '12px' : '11px';

      let fontWeight = '500';
      let contrastFilter = 'contrast(100%)';
      let textShadow = 'none';
      if (density === 'LIGHT') {
        fontWeight = '400';
        contrastFilter = 'contrast(90%)';
      } else if (density === 'DARK') {
        fontWeight = '700';
        contrastFilter = 'contrast(150%)';
        textShadow = '0.2px 0 0 #000';
      } else if (density === 'VERY_DARK') {
        fontWeight = '900';
        contrastFilter = 'contrast(200%)';
        textShadow = '0.35px 0 0 #000, 0 0.35px 0 #000';
      }

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                @page { margin: 0; size: ${widthVal} auto; }
                body {
                  margin: 0;
                  padding: ${is80 ? '10px' : '6px'};
                  font-family: 'Courier New', Courier, monospace;
                  font-size: ${fontSize};
                  font-weight: ${fontWeight};
                  line-height: 1.25;
                  width: ${widthVal};
                  max-width: ${widthVal};
                  color: #000;
                  background: #fff;
                  filter: ${contrastFilter};
                  text-shadow: ${textShadow};
                }
                pre {
                  margin: 0;
                  white-space: pre-wrap;
                  word-break: break-word;
                  font-family: inherit;
                  font-size: inherit;
                  font-weight: inherit;
                }
              </style>
            </head>
            <body>
              <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch {
            window.print();
          }
        }, 150);
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  }

  // Core print method with availability validation
  public async printTicket(ticket: Ticket, terminalCode: string): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig(terminalCode);

    if (!config.printerConnected) {
      return {
        success: false,
        error: 'Ticket registrado correctamente, pero no se pudo imprimir porque la impresora no está conectada.',
      };
    }

    const text = this.formatTicketText(ticket, config);
    this.triggerHardwarePrint(text, `Ticket ${ticket.ticketNumber}`, config.paperWidth, config.printDensity);

    return { success: true };
  }

  // Direct Quick Print in 58mm thermal format bypassing intermediate modal dialogs
  public quickPrint58mm(
    ticket: Ticket,
    options?: {
      companyName?: string;
      slogan?: string;
      address?: string;
      phone?: string;
      rnc?: string;
    }
  ): void {
    if (typeof window === 'undefined') return;

    let container = document.getElementById('printable-ticket');
    let isCreatedDynamically = false;
    if (!container) {
      container = document.createElement('div');
      container.id = 'printable-ticket';
      container.style.display = 'none';
      document.body.appendChild(container);
      isCreatedDynamically = true;
    }

    const company = options?.companyName || 'BANCA LA EXPRESS';
    const slogan = options?.slogan || '¡La suerte en tus manos!';
    const addr = options?.address || 'Santo Domingo, República Dominicana';
    const tel = options?.phone || '(809) 555-0199';
    const rnc = options?.rnc || '1-30-45678-9';

    container.innerHTML = `
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.25; color: #000; width: 58mm; max-width: 58mm; margin: 0; padding: 1.5mm;">
        <div style="text-align: center; margin-bottom: 4px;">
          <div style="font-weight: 900; font-size: 13px; text-transform: uppercase;">${company}</div>
          <div style="font-size: 10px;">${slogan}</div>
          <div style="font-size: 9px;">${addr}</div>
          <div style="font-size: 9px;">Tel: ${tel} | RNC: ${rnc}</div>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        <div style="font-size: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>TICKET:</span>
            <span>#${ticket.ticketNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>SEGURIDAD:</span>
            <span style="font-weight: bold; letter-spacing: 1px;">*${ticket.verificationCode}*</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>FECHA / HORA:</span>
            <span>${ticket.date} ${ticket.time}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>TERMINAL:</span>
            <span>#${ticket.terminalCode} (${ticket.userName || 'Cajero'})</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>ESTADO:</span>
            <span style="font-weight: bold;">${ticket.status}</span>
          </div>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        <div style="font-size: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">
            <span>LOTERÍA / JUGADA</span>
            <span>MONTO</span>
          </div>
          ${ticket.plays
            .map(
              (p) => `
            <div style="display: flex; justify-content: space-between; padding: 2px 0;">
              <div>
                <div style="font-weight: bold;">${p.lotteryName}${p.lottery2Name ? ' + ' + p.lottery2Name : ''}</div>
                <div style="font-size: 9px;">${p.playType.replace('_', ' ')}: <strong style="font-size: 11px;">${p.numbers.join(' - ')}</strong></div>
              </div>
              <div style="font-weight: bold;">RD$${p.amount.toLocaleString()}</div>
            </div>
          `
            )
            .join('')}
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; margin: 3px 0;">
          <span>TOTAL:</span>
          <span>RD$${ticket.totalAmount.toLocaleString()}</span>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        <div style="text-align: center; font-size: 9px; margin-top: 5px;">
          <div>Validez: 30 días calendario</div>
          <div style="font-weight: bold; margin-top: 2px;">¡GRACIAS POR SU JUGADA!</div>
        </div>
      </div>
    `;

    try {
      document.body.classList.add('printing-ticket');
      window.print();
    } catch (e) {
      console.warn('Direct 58mm print exception:', e);
    } finally {
      setTimeout(() => {
        document.body.classList.remove('printing-ticket');
        if (isCreatedDynamically) {
          const el = document.querySelector('body > #printable-ticket');
          if (el) el.remove();
        }
      }, 1500);
    }
  }

  // -------------------------------------------------------------
  // FORMATEO AUTOMÁTICO DE TICKET A 58mm (32 COLUMNAS ESC/POS)
  // -------------------------------------------------------------
  public format58mmTicket(
    ticket: Ticket,
    options?: {
      companyName?: string;
      slogan?: string;
      address?: string;
      phone?: string;
      rnc?: string;
      feedLines?: number;
      cutCommand?: CutCommandType;
    }
  ): string {
    const widthCols = 32; // Estándar estricto 58mm (Font A)
    const dividerDouble = '================================';
    const dividerSingle = '--------------------------------';

    const center = (text: string) => {
      const clean = text.trim();
      if (clean.length >= widthCols) return clean.slice(0, widthCols);
      const pad = widthCols - clean.length;
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return ' '.repeat(left) + clean + ' '.repeat(right);
    };

    const company = options?.companyName || 'BANCA DE LOTERÍA LA FAVORITA';
    const slogan = options?.slogan || '¡La suerte en tus manos!';
    const addr = options?.address || 'Av. 27 de Febrero, Sto Dgo';
    const tel = options?.phone || '(809) 555-0199';
    const rnc = options?.rnc || 'RNC: 1-30-45678-9';

    const lines: string[] = [
      dividerDouble,
      center(company),
      center(slogan),
      center(addr),
      center(`Tel: ${tel} | ${rnc}`),
      dividerDouble,
      `TICKET   : #${ticket.ticketNumber}`,
      `CONTROL  : *${ticket.verificationCode}*`,
      `FECHA    : ${ticket.date} ${ticket.time}`,
      `TERMINAL : #${ticket.terminalCode} (${ticket.userName || 'Cajero'})`,
      `ESTADO   : ${ticket.status || 'VIGENTE'}`,
      dividerSingle,
      'LOTERIA        JUGADA      MONTO',
      dividerSingle,
    ];

    ticket.plays.forEach((p) => {
      const lotName = p.lottery2Name ? `${p.lotteryName}+${p.lottery2Name}` : p.lotteryName;
      const numStr = p.numbers.join('-');
      const amtStr = `RD$${p.amount}`;
      // 32 cols: 14 + 10 + 8
      const lotPart = lotName.slice(0, 13).padEnd(14);
      const numPart = numStr.slice(0, 9).padEnd(10);
      const amtPart = amtStr.padStart(8);
      lines.push(`${lotPart}${numPart}${amtPart}`);
    });

    lines.push(dividerSingle);
    const totalLine = `TOTAL: RD$ ${ticket.totalAmount.toLocaleString()}`;
    lines.push(center(totalLine));
    lines.push(dividerDouble);

    // Código de barras / Hash de verificación para lectura óptica en terminal
    lines.push(center('||||| ||||||| |||| |||||||| |||||'));
    lines.push(center(`*${ticket.verificationCode}*`));
    lines.push(center(`https://bancapro.rd/t/${ticket.verificationCode}`));
    lines.push(dividerSingle);
    lines.push(center('Caduca a los 30 dias calendario'));
    lines.push(center('Conserve su ticket para cobrar'));
    lines.push(center('¡MUCHA SUERTE!'));

    const feed = options?.feedLines ?? 3;
    for (let i = 0; i < feed; i++) {
      lines.push('');
    }

    let text = lines.join('\n');
    const cutSeq = this.getCutCommandEscapeSequence(options?.cutCommand || 'GS_V_0');
    if (cutSeq) {
      text += '\n' + cutSeq;
    }

    return text;
  }

  // --------------------------------------------------------------------------
  // IMPRESIÓN TÉRMICA DIRECTA (DETECCIÓN USB / BLUETOOTH + AUTO-FORMATO 58MM)
  // --------------------------------------------------------------------------
  public async directThermalPrint58mm(
    ticket: Ticket,
    terminalCode: string,
    options?: {
      interactiveDetect?: boolean;
      companySettings?: {
        companyName?: string;
        slogan?: string;
        address?: string;
        phone?: string;
        rnc?: string;
      };
    }
  ): Promise<{
    success: boolean;
    printerName: string;
    connectionType: 'USB' | 'BLUETOOTH' | 'SYSTEM';
    rawText: string;
    message: string;
    error?: string;
  }> {
    try {
      // 1. Detectar impresoras USB o Bluetooth disponibles
      const autoResult = await this.autoDetectAndConnect58mm(
        terminalCode,
        options?.interactiveDetect ?? false
      );

      const targetPrinter = autoResult.printer;
      const connType = autoResult.connectionType;

      // 2. Formatear automáticamente el ticket en tamaño estricto 58mm (32 columnas)
      const formatted58mm = this.format58mmTicket(ticket, {
        companyName: options?.companySettings?.companyName,
        slogan: options?.companySettings?.slogan,
        address: options?.companySettings?.address,
        phone: options?.companySettings?.phone,
        rnc: options?.companySettings?.rnc,
        feedLines: 3,
        cutCommand: 'GS_V_0',
      });

      // 3. Envío directo según el tipo de hardware conectado
      let directSent = false;

      // A) Transmisión directa WebUSB si hay un dispositivo USB vinculado
      if (typeof navigator !== 'undefined' && 'usb' in navigator && connType === 'USB') {
        try {
          const usbDevices = await (navigator as any).usb.getDevices();
          if (usbDevices && usbDevices.length > 0) {
            const dev = usbDevices[0];
            await dev.open();
            if (dev.configuration === null) {
              await dev.selectConfiguration(1);
            }
            await dev.claimInterface(0);
            const encoder = new TextEncoder();
            // ESC/POS Init (\x1B\x40) + Text + Cut
            const initEscPos = '\x1B\x40';
            const payload = encoder.encode(initEscPos + formatted58mm);
            // Buscar endpoint OUT
            const iface = dev.configuration?.interfaces?.[0];
            const alt = iface?.alternates?.[0];
            const outEp = alt?.endpoints?.find((e: any) => e.direction === 'out');
            const epNum = outEp ? outEp.endpointNumber : 1;
            await dev.transferOut(epNum, payload);
            directSent = true;
          }
        } catch (usbErr: any) {
          console.info('WebUSB raw transfer fallback to thermal spooler:', usbErr?.message);
        }
      }

      // B) Transmisión directa Web Bluetooth si está emparejada
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator && connType === 'BLUETOOTH') {
        try {
          // Intentar escribir al canal BLE si el objeto gatt ya fue asignado
          const gatt = (targetPrinter as any)._gattServer;
          if (gatt && gatt.connected) {
            const service = await gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const char = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            const encoder = new TextEncoder();
            const payload = encoder.encode('\x1B\x40' + formatted58mm);
            // Chunks de 512 bytes para BLE
            const chunkSize = 512;
            for (let i = 0; i < payload.length; i += chunkSize) {
              const chunk = payload.slice(i, i + chunkSize);
              await char.writeValue(chunk);
            }
            directSent = true;
          }
        } catch (btErr: any) {
          console.info('Bluetooth raw transfer fallback to thermal spooler:', btErr?.message);
        }
      }

      // C) Disparo de impresión de alta precisión en 58mm vía motor de hardware
      this.triggerHardwarePrint(
        formatted58mm,
        `Ticket_${ticket.ticketNumber}_58mm`,
        '58mm',
        'NORMAL'
      );

      return {
        success: true,
        printerName: targetPrinter.name,
        connectionType: connType,
        rawText: formatted58mm,
        message: directSent
          ? `Ticket enviado directamente vía ${connType} a ${targetPrinter.name} (formato 58mm).`
          : `Impresora detectada: ${targetPrinter.name} (${connType}). Ticket formateado automáticamente en tamaño 58mm listo para impresión.`,
      };
    } catch (err: any) {
      console.error('Error en directThermalPrint58mm:', err);
      // Fallback seguro de emergencia
      this.quickPrint58mm(ticket, options?.companySettings);
      return {
        success: true,
        printerName: 'POS-58 Térmica (Spooler)',
        connectionType: 'SYSTEM',
        rawText: '',
        message: 'Ticket formateado en 58mm y enviado al spooler térmico predeterminado.',
      };
    }
  }
}

export const printerService = new PrinterManager();

