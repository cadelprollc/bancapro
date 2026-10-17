export interface PrinterDevice {
  id: string;
  name: string;
  type: 'BLUETOOTH' | 'SYSTEM' | 'USB';
  connected: boolean;
  address?: string;
  rssi?: number;
  batteryLevel?: number;
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
  is58mmDefault?: boolean;
}

export type CutCommandType =
  | 'GS_V_0'      // ESC/POS Full Cut (1D 56 00) - Epson, Bixolon, Genéricas
  | 'GS_V_1'      // ESC/POS Partial Cut (1D 56 01) - Estándar 80mm
  | 'GS_V_66_0'   // ESC/POS Feed 3 líneas & Partial Cut (1D 56 42 00) - Xprinter / Rongta
  | 'ESC_M'       // Legacy ESC m (1B 6D)
  | 'STAR_CUT'    // Star Micronics Cut (1B 64 02)
  | 'NONE'        // Sin corte automático (Manual / Barra dentada)
  | 'CUSTOM';     // Comando Hexadecimal Personalizado

export type ThermalDriverType =
  | 'RAW_ESCPOS'       // Driver Raw ESC/POS Directo (USB / COM / Serie)
  | 'SYSTEM_SPOOLER'   // Driver SO / Windows Spooler / CUPS / Web Print
  | 'WEB_BLUETOOTH'    // Web Bluetooth API (GATT 18F0 / SPP BLE)
  | 'WEB_SERIAL'       // Web Serial API (USB Direct CDC-ACM / FTDI)
  | 'NETWORK_TCP'      // Red Ethernet / WiFi (TCP RAW JetDirect 9100)
  | 'SUNMI_INTERNAL'   // Terminales Android POS Integradas (Sunmi / PAX)
  | 'STAR_LINE';       // Star Line Mode Emulation

export type TicketFormatType =
  | 'STANDARD'   // Estándar (Equilibrado, 32/48 columnas con todos los datos)
  | 'COMPACT'    // Compacto / Económico (Ahorro de papel, sin líneas vacías)
  | 'DETAILED'   // Detallado (Desglose ampliado, horas, firmas y notas)
  | 'MODERN_QR'; // Moderno (Código QR de alta resolución y código de barras)

export type PrintDensityType = 'LIGHT' | 'NORMAL' | 'DARK' | 'VERY_DARK';

export interface TerminalPrinterConfig {
  terminalCode: string;
  terminalId?: string;
  // Printer details
  printerName: string;
  printerType: 'BLUETOOTH' | 'SYSTEM' | 'USB';
  printerConnected: boolean;
  paperWidth: '58mm' | '80mm';
  // Driver & Protocol Configuration
  driverType: ThermalDriverType;
  ticketFormat: TicketFormatType;
  printDensity: PrintDensityType;
  feedLines: number; // Blank lines before cutting (1 - 6)
  fontMode?: 'FONT_A' | 'FONT_B'; // FONT_A (12x24) or FONT_B (9x17 condensed)
  networkIp?: string; // For NETWORK_TCP driver
  networkPort?: number; // For NETWORK_TCP driver (default 9100)
  // Hardware Port & Cut Commands
  defaultPort: string; // e.g. "USB001", "COM1", "COM3", "9100", "BT_SPP_0"
  baudRate: number; // e.g. 9600, 19200, 38400, 115200
  paperCutEnabled: boolean;
  cutCommand: CutCommandType;
  customCutHex?: string;
  hardwareBrand: 'EPSON' | 'XPRINTER' | 'STAR' | 'BIXOLON' | 'CITIZEN' | 'GENERIC_POS';
  // Automated workflow
  autoPrintOnSale: boolean;
  // Ticket design toggles
  printLogo: boolean;
  logoBase64?: string;
  printQr: boolean;
  printTicketNumber: boolean;
  printDate: boolean;
  printTime: boolean;
  printTerminal: boolean;
  printLotteryName: boolean;
  printPlays: boolean;
  printAmount: boolean;
  printTotal: boolean;
  printFooter: boolean;
  customFooter?: string;
}

export const DEFAULT_TERMINAL_PRINTER_CONFIG: TerminalPrinterConfig = {
  terminalCode: '1001',
  printerName: 'POS-58',
  printerType: 'BLUETOOTH',
  printerConnected: true,
  paperWidth: '58mm',
  driverType: 'RAW_ESCPOS',
  ticketFormat: 'STANDARD',
  printDensity: 'NORMAL',
  feedLines: 3,
  fontMode: 'FONT_A',
  networkIp: '192.168.1.200',
  networkPort: 9100,
  defaultPort: 'USB001',
  baudRate: 9600,
  paperCutEnabled: true,
  cutCommand: 'GS_V_0',
  customCutHex: '1D 56 00',
  hardwareBrand: 'GENERIC_POS',
  autoPrintOnSale: false,
  printLogo: true,
  printQr: true,
  printTicketNumber: true,
  printDate: true,
  printTime: true,
  printTerminal: true,
  printLotteryName: true,
  printPlays: true,
  printAmount: true,
  printTotal: true,
  printFooter: true,
  customFooter: 'Los tickets tienen vigencia de 30 días calendario. Revise su jugada antes de salir.',
};
