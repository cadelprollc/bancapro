export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'COLECTOR' | 'TERMINAL' | 'MONITOREO';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING';

// Permisos granulares asignables por el Súper Admin a cada Administrador
export interface AdminGranularPermissions {
  dashboard: boolean; // Dashboard principal con métricas en tiempo real
  ventas: boolean; // Terminal de ventas / POS
  tickets: boolean; // Consulta, reimpresión y gestión de tickets
  sorteos: boolean; // Monitoreo en vivo de sorteos y estado
  resultados: boolean; // Registro y publicación de números ganadores
  ganadores: boolean; // Consulta y control de tickets premiados
  pagoPremios: boolean; // Autorización y procesamiento de pago de premios
  bancas: boolean; // Gestión de puntos de venta y bancas
  terminales: boolean; // Alta, edición y bloqueo de terminales/dispositivos
  usuarios: boolean; // Gestión de usuarios y operadores
  supervisores: boolean; // Control y asignación de supervisores
  colectores: boolean; // Control y rutas de colectores
  grupos: boolean; // Gestión de grupos de bancas y zonas
  topes: boolean; // Límites y topes de venta
  reportes: boolean; // Reportes analíticos de ventas y ganancias
  cuadres: boolean; // Cuadre diario de caja por banca
  comisiones: boolean; // Configuración de comisiones
  anulaciones: boolean; // Anulación de tickets
  devoluciones: boolean; // Devoluciones de jugadas
  loterias: boolean; // Gestión de catálogo y horarios de loterías
  configuracionConsorcio: boolean; // Personalización y configuración del consorcio
  configuracionPremios: boolean; // Planes de premios y multiplicadores
  configuracionSistema: boolean; // Configuración global y backups del sistema
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminGranularPermissions = {
  dashboard: true,
  ventas: true,
  tickets: true,
  sorteos: true,
  resultados: false, // Por defecto solo Super Admin, a menos que se le otorgue a los administradores
  ganadores: true,
  pagoPremios: true,
  bancas: true,
  terminales: true,
  usuarios: true,
  supervisores: true,
  colectores: true,
  grupos: true,
  topes: true,
  reportes: true,
  cuadres: true,
  comisiones: true,
  anulaciones: true,
  devoluciones: true,
  loterias: true,
  configuracionConsorcio: true,
  configuracionPremios: true,
  configuracionSistema: false,
};

export interface ConsorcioPermissions {
  monitoring: boolean; // Monitoreo de jugadas
  monitoringFunctions: boolean; // Funciones de monitoreo
  terminals: boolean; // Terminales
  lotteries: boolean; // Configuración de loterías
  results: boolean; // Publicar resultados
  topes: boolean; // Topes de ventas
  prizes: boolean; // Premios
  reports: boolean; // Reportes consolidados de la empresa
  createTerminals: boolean; // Crear terminales (Por defecto: FALSE)
  editTerminals: boolean; // Editar terminales
  disableTerminals: boolean; // Desactivar terminales
  invoices: boolean; // Facturas
  visualCustomization: boolean; // Configuración visual
}

export interface VisualCustomization {
  logoUrl?: string;
  loginLogoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  bgImage?: string;
  bgOverlayOpacity?: number; // Opacidad de la capa del fondo (0-100%)
  bgBlur?: number; // Desenfoque en px (0-20)
  bgPattern?: string; // Nombre de textura o patrón de fondo
  bgScope?: 'all' | 'pos' | 'dashboard' | 'login';
  commercialName?: string;
  ticketHeader?: string;
  ticketFooter?: string;
  themePreset?: string;
}

export interface ConsorcioPayoutLimits {
  quinielaMaxPayoutPerDraw: number; // Monto máximo de pago en Quinielas por sorteo (ej: RD$ 350,000)
  quinielaMaxPayoutPerTicket: number; // Monto máximo a pagar por boleto individual de Quiniela (ej: RD$ 60,000)
  paleMaxPayoutPerDraw: number; // Monto máximo de pago en Palés por sorteo (ej: RD$ 800,000)
  paleMaxPayoutPerCombination: number; // Monto máximo por combinación de Palé (ej: RD$ 300,000)
  tripletaMaxPayoutPerDraw: number; // Monto máximo de pago en Tripletas por sorteo (ej: RD$ 1,500,000)
  tripletaMaxPayoutPerCombination: number; // Monto máximo por combinación de Tripleta (ej: RD$ 600,000)
  superPaleMaxPayoutPerDraw?: number; // Monto máximo de pago en Súper Palé (ej: RD$ 1,000,000)
  totalDrawExposureLimit: number; // Exposición máxima financiera global por sorteo (ej: RD$ 2,500,000)
  riskMitigationAction: 'BLOCK_SALES' | 'WARN_ADMIN' | 'REDUCE_MAX_BET'; // Acción automática ante sobreexposición
  autoAlertThresholdPercent: number; // Porcentaje para disparar alerta de riesgo (ej: 80%)
  enabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CONSORCIO_PAYOUT_LIMITS: ConsorcioPayoutLimits = {
  quinielaMaxPayoutPerDraw: 350000,
  quinielaMaxPayoutPerTicket: 60000,
  paleMaxPayoutPerDraw: 800000,
  paleMaxPayoutPerCombination: 300000,
  tripletaMaxPayoutPerDraw: 1500000,
  tripletaMaxPayoutPerCombination: 600000,
  superPaleMaxPayoutPerDraw: 1000000,
  totalDrawExposureLimit: 2500000,
  riskMitigationAction: 'BLOCK_SALES',
  autoAlertThresholdPercent: 80,
  enabled: true,
};

export interface Consorcio {
  id: string;
  code: string; // Único, ej: "1230"
  name: string; // ej: "Consorcio de Bancas Salomón"
  adminName: string;
  adminUsername: string;
  status: 'ACTIVE' | 'SUSPENDED';
  costPerTerminal: number; // ej: 500
  authorizedTerminalsCount: number; // ej: 5
  permissions: ConsorcioPermissions;
  customization: VisualCustomization;
  payoutLimits?: ConsorcioPayoutLimits;
  createdAt: string;
}

export type DeviceStatus = 'PENDING' | 'AUTHORIZED' | 'ACTIVE' | 'INACTIVE' | 'BLOQUEADO' | 'REVOKED';

export type DeviceType = 'PC' | 'ANDROID' | 'TABLET' | 'MOBILE';

export type TerminalDeviceType = 'PC' | 'MOVIL';

export interface DeviceAuditLog {
  id: string;
  adminUsername: string;
  adminName: string;
  deviceId: string;
  terminalCode?: string;
  bancaName?: string;
  consorcioId?: string;
  action: string;
  timestamp: string;
  previousState: string;
  newState: string;
  previousType?: TerminalDeviceType | string;
  newType?: TerminalDeviceType | string;
  ip?: string;
  details?: string;
}

export interface DeviceRegistration {
  id: string; // ej: "DEV-8F42-K29X" o "123D123400"
  consorcioId: string;
  consorcioCode: string;
  terminalId?: string;
  terminalCode?: string;
  bancaName?: string;
  assignedUsername?: string;
  deviceType?: DeviceType;
  terminalType?: TerminalDeviceType;
  status: DeviceStatus;
  activationCode?: string;
  deviceToken?: string;
  appVersion?: string;
  ipAddress?: string;
  userAgent?: string;
  osInfo?: string;
  registeredAt: string;
  activatedAt?: string;
  lastSeenAt?: string;
  deviceName?: string;
}

export interface InvoiceItem {
  terminalCode: string;
  terminalName: string;
  cost: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // ej: "FAC-1230-001"
  consorcioId: string;
  consorcioCode: string;
  consorcioName: string;
  month: string; // ej: "Septiembre 2026"
  terminalsCount: number;
  costPerTerminal: number;
  totalAmount: number;
  terminalsDetail: InvoiceItem[];
  status: 'PENDIENTE' | 'PAGADA' | 'VENCIDA';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  terminalCode?: string;
  terminalType?: TerminalDeviceType;
  bancaName?: string;
  consorcioId?: string;
  consorcioName?: string;
  status?: UserStatus;
  phone?: string;
  lastLoginAt?: string;
  active: boolean;
  createdAt: string;
  adminPermissions?: Partial<AdminGranularPermissions>;
}

export interface AppNotification {
  id: string;
  type: 'sale' | 'prize' | 'terminal_blocked' | 'user' | 'result' | 'cuadre' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface CuadreBanca {
  id: string;
  date: string;
  consorcioId: string;
  bancaCode: string;
  bancaName: string;
  cajeroName: string;
  ventasBrutas: number;
  anulaciones: number;
  ventasNetas: number;
  premiosPagados: number;
  comisiones: number;
  balanceCalculado: number;
  efectivoReportado: number;
  diferencia: number;
  estado: 'ABIERTO' | 'CERRADO' | 'REVISADO';
  cerradoPor?: string;
  cerradoAt?: string;
}

export interface PromotionalBannerConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl?: string;
  enabled: boolean;
}

export interface DailySalesMetric {
  date: string;
  dayName: string;
  ventas: number;
  premios: number;
  gananciaNeta: number;
  ticketsCount: number;
}

export interface TopTerminalSeller {
  terminalId: string;
  terminalCode: string; // ej: "1002"
  bancaName: string; // ej: "BANCA LA EXPRESS"
  salesAmount: number; // ej: 1110.00
  ticketsCount: number;
  rank: number;
  percentage?: number;
}

export interface HotPlayNumber {
  number: string; // ej: "25", "99", "25-10"
  numbers: string[]; // ['25'] o ['25', '10']
  playType: PlayType; // 'QUINIELA' | 'PALE' | 'TRIPLETA' | 'SUPER_PALE'
  totalAmount: number; // ej: 200.00
  ticketsCount: number; // ej: 4
  rank: number;
  lotteryName?: string;
}

export interface TopGroupItem {
  groupId: string;
  groupName: string;
  description?: string;
  salesAmount: number;
  ticketsCount: number;
  terminalsCount: number;
  prizesAmount?: number;
  netProfit?: number;
  rank: number;
  percentage?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  prizePlanName?: string;
}

export interface DashboardMetrics {
  ventasHoy: number;
  ventasVariacion: number;
  jugadasCount: number;
  jugadasVariacion: number;
  premiosPagados: number;
  premiosVariacion: number;
  comisiones: number;
  comisionesVariacion: number;
  dailySales7Days?: DailySalesMetric[];
  topTerminals?: TopTerminalSeller[];
  topGroups?: TopGroupItem[];
  hotNumbers?: HotPlayNumber[];
  ventasPorLoteria: {
    name: string;
    percentage: number;
    amount: number;
    color: string;
  }[];
  terminalesSummary: {
    total: number;
    activas: number;
    pendientes: number;
    bloqueadas: number;
    desconectadas: number;
  };
  actividadReciente: {
    id: string;
    type: 'sale' | 'prize' | 'user' | 'terminal';
    description: string;
    amount?: number;
    date: string;
    time: string;
    icon: string;
  }[];
  promotionalBanner: PromotionalBannerConfig;
}

export interface Terminal {
  id: string;
  code: string;
  name: string;
  location: string;
  username: string;
  consorcioId?: string;
  groupId?: string; // ID del grupo al que pertenece la terminal
  deviceId?: string; // ID único del dispositivo asignado (ej: 123D123400)
  terminalType?: TerminalDeviceType; // 'PC' | 'MOVIL'
  activationCode?: string; // Código de activación asignado
  active: boolean;
  creditLimit?: number; // Límite de Crédito configurado para controlar el riesgo
  balanceLimit?: number; // Compatibilidad retroactiva
  currentSalesToday?: number; // Ventas acumuladas de hoy en tiempo real
  availableCredit?: number; // Saldo disponible para ventas en tiempo real
  creditUsedPercent?: number; // % de crédito consumido
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEEDED'; // Evaluación de riesgo
  contactPhone?: string;
  appVersion?: string; // Versión instalada de la aplicación (ej: 'v1.0.0', 'v1.1.0')
  lastUpdateCheckAt?: string; // Última fecha/hora de consulta de actualización
  updatedAtVersion?: string; // Fecha y hora en que completó la última actualización
  createdAt: string;
}

export interface TerminalCreditStatus {
  terminalId: string;
  terminalCode: string;
  terminalName: string;
  creditLimit: number;
  currentSalesToday: number;
  availableCredit: number;
  creditUsedPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEEDED';
  isCreditExceeded: boolean;
  consorcioId?: string;
  updatedAt: string;
}

export type LotteryStatus = 'ABIERTA' | 'CERRADA' | 'DESACTIVADA';

export interface Lottery {
  id: string;
  name: string;
  code: string;
  openTime?: string; // Hora de inicio de venta (ej: "07:00 AM" o "07:00")
  closeTime?: string; // Hora de cierre de venta (ej: "12:55 PM" o "12:55")
  drawTime: string; // Hora de sorteo / cierre oficial
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  active: boolean; // Activar / desactivar lotería
  color: string;
  logoUrl?: string; // URL o Data URI del logo oficial de la lotería
  logoType?: 'preset' | 'custom' | 'none';
}

export interface LotteryResult {
  id: string;
  consorcioId?: string;
  lotteryId: string;
  lotteryName: string;
  drawDate: string; // YYYY-MM-DD
  primera: string; // 2 digits
  segunda: string; // 2 digits
  tercera: string; // 2 digits
  publishedAt: string;
  publishedBy: string;
  targetConsorcioId?: string;
}

export type PlayType = 'QUINIELA' | 'PALE' | 'TRIPLETA' | 'SUPER_PALE';

export type TicketStatus =
  | 'PENDIENTE'
  | 'GANADOR'
  | 'PERDIDO'
  | 'PERDEDOR'
  | 'PAGADO'
  | 'PENDIENTE DE PAGO'
  | 'ANULADO'
  | 'VIGENTE';

export interface TicketPlay {
  id: string;
  ticketId: string;
  lotteryId: string;
  lotteryName: string;
  lottery2Id?: string;
  lottery2Name?: string;
  playType: PlayType;
  numbers: string[]; // ['05'] or ['10', '33'] or ['10', '33', '25']
  amount: number;
  wonAmount: number;
  status: 'PENDIENTE' | 'GANADOR' | 'PERDEDOR';
  winningDetail?: string;
  winningDrawId?: string;
  winningDrawName?: string;
  winningNumbers?: string;
}

export interface Ticket {
  id: string;
  consorcioId?: string;
  ticketNumber: string;
  verificationCode: string;
  terminalId: string;
  terminalCode: string;
  bancaName?: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  plays: TicketPlay[];
  totalAmount: number;
  totalWon: number;
  status: TicketStatus;
  createdAt: string;
  processedAt?: string;
  processedResultId?: string;
  winningPlaysCount?: number;
  paidAt?: string;
  paidBy?: string;
  anulledAt?: string;
  anulledBy?: string;
}

export interface PrizeConfig {
  quiniela_primera: number; // e.g. 60
  quiniela_segunda: number; // e.g. 8
  quiniela_tercera: number; // e.g. 4
  pale_primera_segunda: number; // e.g. 1000
  pale_primera_tercera: number; // e.g. 1000
  pale_segunda_tercera: number; // e.g. 100
  tripleta_tres: number; // e.g. 20000
  tripleta_dos: number; // e.g. 100
  super_pale: number; // e.g. 3000
  super_pale_allow_inverse: boolean;
}

export interface SalesCap {
  id: string;
  consorcioId?: string;
  groupId?: string; // empty means applies to whole consorcio/not bound to a group
  lotteryId?: string; // empty means all lotteries
  lotteryName?: string;
  number?: string; // e.g. '10'
  playType?: PlayType;
  terminalId?: string; // empty means all terminals
  terminalCode?: string;
  date?: string; // empty means all dates
  maxAmount: number;
  active: boolean;
  createdAt: string;
}

// ----------------- GRUPOS & PLANES DE PREMIOS -----------------

export interface PrizePlan {
  id: string;
  name: string; // ej: "Plan A", "Plan B", "Plan Centro"
  description?: string;
  consorcioId?: string;
  isDefault?: boolean;
  quiniela_primera: number; // e.g. 60
  quiniela_segunda: number; // e.g. 8
  quiniela_tercera: number; // e.g. 4
  pale_primera_segunda: number; // e.g. 1000
  pale_primera_tercera: number; // e.g. 1000
  pale_segunda_tercera: number; // e.g. 100
  tripleta_tres: number; // e.g. 20000
  tripleta_dos: number; // e.g. 100
  super_pale: number; // e.g. 3000
  super_pale_allow_inverse: boolean;
  createdAt: string;
}

export interface GroupPermissions {
  monitoring: boolean; // Monitoreo de jugadas
  monitoringFunctions: boolean; // Funciones de monitoreo
  terminals: boolean; // Terminales
  lotteries: boolean; // Configuración de loterías
  results: boolean; // Publicar resultados
  topes: boolean; // Topes de ventas
  prizes: boolean; // Premios
  reports: boolean; // Reportes
  createTerminals: boolean; // Crear terminales
  editTerminals: boolean; // Editar terminales
  disableTerminals: boolean; // Desactivar terminales
}

export interface ConsorcioGroup {
  id: string;
  consorcioId: string;
  name: string; // ej: "Grupo Centro"
  description: string; // ej: "Bancas zona centro"
  status: 'ACTIVE' | 'INACTIVE';
  prizePlanId: string; // ID del plan de premios asignado
  generalDailyCap?: number; // ej: 100000 (Tope general diario acumulado de ventas del grupo)
  permissions: GroupPermissions;
  allowedLotteryIds?: string[]; // IDs de loterías autorizadas (si vacío, todas las activas)
  terminalIds: string[]; // IDs de terminales asignadas al grupo
  createdAt: string;
  updatedAt?: string;
}

export interface GroupSalesCap {
  id: string;
  groupId: string;
  consorcioId?: string;
  lotteryId?: string; // empty means all lotteries
  lotteryName?: string;
  number?: string; // '05' or '05-10' or '05-10-20' or '05-33'
  playType?: PlayType;
  terminalId?: string; // empty means all terminals in group
  terminalCode?: string;
  date?: string; // empty means daily recurring
  maxAmount: number;
  active: boolean;
  createdAt: string;
}

export interface GroupAuditLog {
  id: string;
  groupId: string;
  groupName: string;
  consorcioId?: string;
  userId: string;
  userName: string;
  action: string; // ej. 'Modificó tope de venta', 'Creó grupo', 'Modificó permisos', 'Asignó terminales'
  terminalCode?: string;
  lotteryName?: string;
  number?: string;
  oldValue?: string;
  newValue?: string;
  details: string;
  timestamp: string;
}

export interface CompanySettings {
  companyName: string;
  slogan: string;
  address: string;
  phone: string;
  rnc: string;
  ticketFooter: string;
  paperWidth: '58mm' | '80mm';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  consorcioId?: string;
  consorcioName?: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  permissionKey?: string;
  previousValue?: string;
  newValue?: string;
  details: string;
  ip?: string;
  device?: string;
}

// ----------------- SISTEMA DE ACTUALIZACIONES CENTRALIZADO -----------------

export interface SystemUpdate {
  id: string;
  version: string; // ej: 'v1.1.0'
  title: string; // ej: 'Actualización de Rendimiento y Nuevos Reportes'
  releaseNotes: string[]; // Listado de novedades / changelog
  isMandatory: boolean; // Obligatoria (bloquea uso hasta actualizar) u Opcional
  status: 'PUBLISHED' | 'DRAFT' | 'INACTIVE';
  packageUrl?: string; // URL o identificador del paquete oficial
  packageHash?: string; // Hash SHA-256 para validación de integridad
  packageSizeBytes?: number;
  publishedBy: string; // Nombre del Súper Admin que publicó
  publishedAt: string; // Fecha y hora de publicación
  minSupportedVersion?: string; // Versión mínima requerida
  downloadCount?: number;
}

export interface TerminalUpdateStatus {
  terminalId: string;
  terminalCode: string;
  terminalName: string;
  consorcioId: string;
  consorcioName: string;
  consorcioCode: string;
  installedVersion: string; // ej: 'v1.0.0'
  latestVersion: string; // ej: 'v1.1.0'
  isUpToDate: boolean;
  lastCheckAt?: string;
  updatedAt?: string;
}

export interface SystemBackup {
  id: string;
  filename: string;
  version: string;
  createdAt: string;
  createdBy: string;
  sizeBytes: number;
  description: string;
  recordsCount: {
    tickets: number;
    terminals: number;
    consorcios: number;
    groups: number;
    salesCaps: number;
  };
}

// ----------------- CONTROL DE VENTAS, PREMIOS Y GANANCIAS POR TERMINAL Y GRUPO -----------------
export interface GroupSalesPerformance {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  status: 'ACTIVE' | 'INACTIVE';
  prizePlanName?: string;
  generalDailyCap?: number;
  terminalsCount: number;
  terminalIds: string[];
  terminalCodes: string[];
  ventas: number;
  premios: number;
  comision: number;
  gananciaNeta: number;
  ticketsVendidos: number;
  ticketsPremiados: number;
  ticketsPerdedores: number;
  ticketsPendientes: number;
  ticketsAnulados: number;
  montoAnulado: number;
  margenGananciaPorcentaje: number;
  terminales: TerminalSalesPerformance[];
}

export interface TerminalSalesPerformance {
  terminalId: string;
  terminalCode: string;
  bancaName: string;
  assignedUsername: string;
  groupId?: string;
  groupName?: string;
  deviceId?: string;
  deviceType?: string;
  terminalStatus: 'ACTIVE' | 'INACTIVE' | 'BLOQUEADO' | 'PENDING';
  ventas: number;
  premios: number;
  comisionPorcentaje: number; // ej: 15%
  comision: number;
  gananciaNeta: number; // ventas - premios - comision
  ticketsVendidos: number;
  ticketsPremiados: number;
  ticketsPerdedores: number;
  ticketsPendientes: number;
  ticketsAnulados: number;
  montoAnulado: number;
  ultimaVenta?: string;
  alerts: string[]; // 'GANANCIA_NEGATIVA' | 'PREMIOS_SUPERIORES' | 'SIN_VENTAS' | 'VENTAS_BAJAS' | 'MUCHAS_ANULACIONES'
}

export interface TerminalSalesSummary {
  periodo: {
    preset: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    startDate: string;
    endDate: string;
  };
  consorcioId: string;
  consorcioName: string;
  totales: {
    ventasTotales: number;
    premiosTotales: number;
    comisionesTotales: number;
    gananciaNeta: number;
    ticketsTotales: number;
    ticketsPremiados: number;
    margenGananciaPorcentaje: number;
  };
  terminales: TerminalSalesPerformance[];
  grupos?: GroupSalesPerformance[];
  alertasTotales: number;
}

export interface GroupReportBreakdown {
  groupId: string;
  groupName: string;
  terminalsCount: number;
  sold: number;
  prizes: number;
  net: number;
  count: number;
  terminals: {
    code: string;
    name: string;
    sold: number;
    prizes: number;
    net: number;
    count: number;
  }[];
}

export interface TerminalSalesOperation {
  ticketId: string;
  ticketNumber: string;
  verificationCode: string;
  lotteryName: string;
  playType: PlayType;
  jugadaFormatted: string; // ej: "Quiniela 25" o "Palé 10-33"
  monto: number;
  resultado: 'GANADOR' | 'PERDEDOR' | 'PENDIENTE' | 'ANULADO' | 'PAGADO';
  premio: number;
  fecha: string;
  hora: string;
  createdAt: string;
  status: TicketStatus;
  paidAt?: string;
  paidBy?: string;
}

// ----------------- RECARGAS Y PRODUCTOS ADICIONALES -----------------
export interface RecargaTransaction {
  id: string;
  transactionNumber: string;
  operator: 'CLARO' | 'ALTICE' | 'VIVA';
  phoneNumber: string;
  type: 'SALDO' | 'PAQUETICO';
  packageName?: string;
  amount: number;
  terminalCode: string;
  cashierName: string;
  date: string;
  time: string;
  status: 'COMPLETADO' | 'FALLIDO';
  authCode: string;
}

export interface ProductoItem {
  id: string;
  name: string;
  category: 'RECARGAS_DEPORTIVAS' | 'PINES_DIGITALES' | 'SERVICIOS' | 'LOTERIA_ADICIONAL';
  icon: string;
  description: string;
  fixedAmounts?: number[];
  allowsCustomAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
  provider: string;
}

export interface ProductoTransaction {
  id: string;
  transactionNumber: string;
  productId: string;
  productName: string;
  category: string;
  customerReference: string;
  amount: number;
  terminalCode: string;
  cashierName: string;
  date: string;
  time: string;
  pinCode?: string;
  status: 'COMPLETADO' | 'FALLIDO';
  authCode: string;
}

export interface SalesAuditRecord {
  id: string;
  timestamp: string;
  consorcioId: string;
  adminUsername: string;
  adminName: string;
  terminalCode: string;
  bancaName: string;
  ticketNumber?: string;
  operation: 'ANULACION_TICKET' | 'PAGO_PREMIO' | 'AJUSTE_COMISION' | 'DEVOLUCION_TICKET';
  previousValue: string | number;
  newValue: string | number;
  details?: string;
}
