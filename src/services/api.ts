import {
  User,
  Terminal,
  Lottery,
  LotteryResult,
  Ticket,
  TicketPlay,
  PrizeConfig,
  SalesCap,
  CompanySettings,
  PlayType,
  Consorcio,
  DeviceRegistration,
  DeviceAuditLog,
  DeviceType,
  DeviceStatus,
  Invoice,
  VisualCustomization,
  ConsorcioGroup,
  GroupPermissions,
  PrizePlan,
  GroupSalesCap,
  GroupAuditLog,
  ConsorcioPermissions,
  SystemUpdate,
  TerminalUpdateStatus,
  SystemBackup,
  TerminalSalesPerformance,
  TerminalSalesSummary,
  TerminalSalesOperation,
  SalesAuditRecord,
  AdminGranularPermissions,
  AdminAuditLog,
  ConsorcioPayoutLimits,
  TerminalCreditStatus,
} from '../types/index';

export function validateGroupPermissionsAgainstAdmin(
  adminPermissions: Partial<ConsorcioPermissions> = {},
  groupPermissions: Partial<GroupPermissions> = {}
): { valid: boolean; unauthorizedPermissions: string[] } {
  const permLabels: Record<keyof GroupPermissions, string> = {
    monitoring: 'Monitoreo de jugadas',
    monitoringFunctions: 'Funciones de monitoreo',
    terminals: 'Terminales',
    lotteries: 'Configuración de loterías',
    results: 'Publicar resultados',
    topes: 'Topes de ventas',
    prizes: 'Premios',
    reports: 'Reportes consolidados',
    createTerminals: 'Crear terminales',
    editTerminals: 'Editar terminales',
    disableTerminals: 'Desactivar terminales',
  };

  const unauthorizedPermissions: string[] = [];
  const keys = Object.keys(permLabels) as (keyof GroupPermissions)[];
  for (const k of keys) {
    if (groupPermissions[k] === true && adminPermissions[k] !== true) {
      unauthorizedPermissions.push(permLabels[k]);
    }
  }

  return {
    valid: unauthorizedPermissions.length === 0,
    unauthorizedPermissions,
  };
}

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('bancapro_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 204) {
        return {} as T;
      }

      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Respuesta no válida del servidor' };
      }

      if (!response.ok) {
        if (response.status === 401 && endpoint !== '/auth/login') {
          // Invalidate stored token
          localStorage.removeItem('bancapro_token');
          // Notify app to redirect or update session state
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('bancapro:session-expired', {
                detail: { message: data.error || 'Sesión no válida o expirada.' },
              })
            );
          }
        }
        throw new Error(data.error || data.message || `Error en la solicitud (${response.status})`);
      }

      return data as T;
    } catch (err: any) {
      // Do not retry 4xx errors
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
        throw err;
      }

      const isNetworkError =
        err.name === 'TypeError' ||
        err.message === 'Load failed' ||
        err.message === 'Failed to fetch' ||
        err.message?.includes('NetworkError');

      if (isNetworkError && attempt < maxRetries) {
        // Exponential backoff retry: 350ms, 750ms
        await new Promise((resolve) => setTimeout(resolve, attempt * 350));
        continue;
      }

      if (isNetworkError) {
        throw new Error('No se pudo conectar con el servidor central de sorteos. Por favor revise su conexión.');
      }

      throw err;
    }
  }

  throw new Error('No se pudo completar la solicitud.');
}

export const api = {
  // Auth
  async login(
    username: string,
    password: string,
    deviceId?: string,
    consorcioCode?: string
  ): Promise<{ user: User; token: string; consorcio?: Consorcio; customization?: VisualCustomization }> {
    const data = await request<{ user: User; token: string; consorcio?: Consorcio; customization?: VisualCustomization }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, deviceId, consorcioCode }),
    });
    localStorage.setItem('bancapro_token', data.token);
    return data;
  },

  async getMe(): Promise<{ user: User & { consorcio?: Consorcio; permissions?: any } }> {
    return request<{ user: User & { consorcio?: Consorcio; permissions?: any } }>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('bancapro_token');
    }
  },

  // Lotteries
  async getLotteries(): Promise<Lottery[]> {
    return request<Lottery[]>('/lotteries');
  },

  async createLottery(lottery: Partial<Lottery>): Promise<Lottery> {
    return request<Lottery>('/lotteries', {
      method: 'POST',
      body: JSON.stringify(lottery),
    });
  },

  async updateLottery(id: string, updates: Partial<Lottery>): Promise<Lottery> {
    return request<Lottery>(`/lotteries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Terminals
  async getTerminals(consorcioId?: string): Promise<Terminal[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<Terminal[]>(`/terminals?${params.toString()}`);
  },

  async createTerminal(data: {
    code: string;
    name: string;
    location: string;
    username: string;
    password: string;
    creditLimit?: number;
    balanceLimit?: number;
    contactPhone?: string;
    deviceId?: string;
    terminalType?: 'PC' | 'MOVIL';
    consorcioId?: string;
  }): Promise<{ terminal: Terminal; user: User }> {
    return request('/terminals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTerminal(id: string, updates: Partial<Terminal & { password?: string; deviceId?: string; terminalType?: 'PC' | 'MOVIL'; creditLimit?: number }>): Promise<Terminal> {
    return request(`/terminals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateTerminalCreditLimit(id: string, creditLimit: number): Promise<{ success: boolean; terminal: Terminal }> {
    return request<{ success: boolean; terminal: Terminal }>(`/terminals/${id}/credit-limit`, {
      method: 'PUT',
      body: JSON.stringify({ creditLimit }),
    });
  },

  async getTerminalCreditStatus(terminalCode?: string): Promise<TerminalCreditStatus> {
    const q = terminalCode ? `?terminalCode=${encodeURIComponent(terminalCode)}` : '';
    return request<TerminalCreditStatus>(`/terminals/credit-status${q}`);
  },

  async getTerminalCreditStatusById(id: string): Promise<TerminalCreditStatus> {
    return request<TerminalCreditStatus>(`/terminals/${encodeURIComponent(id)}/credit-status`);
  },

  async changeTerminalType(id: string, terminalType: 'PC' | 'MOVIL'): Promise<{ success: boolean; terminal: Terminal }> {
    return request<{ success: boolean; terminal: Terminal }>(`/terminals/${id}/change-type`, {
      method: 'POST',
      body: JSON.stringify({ terminalType }),
    });
  },

  // Results
  async getResults(date?: string, lotteryId?: string): Promise<LotteryResult[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (lotteryId) params.append('lotteryId', lotteryId);
    const qs = params.toString();
    return request<LotteryResult[]>(`/results${qs ? `?${qs}` : ''}`);
  },

  async publishResults(data: {
    lotteryId: string;
    drawDate: string;
    primera: string;
    segunda: string;
    tercera: string;
    targetConsorcioId?: string;
  }): Promise<{
    success: boolean;
    result: LotteryResult;
    recalculation: {
      ticketsEvaluated: number;
      winnersCount: number;
      totalPrizeAwarded: number;
      consorciosAffected?: {
        consorcioId: string;
        consorcioName: string;
        ticketsEvaluated: number;
        winnersCount: number;
        prizeAwarded: number;
      }[];
    };
    message: string;
  }> {
    return request('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async publishBatchResults(data: {
    drawDate: string;
    targetConsorcioId?: string;
    items: Array<{
      lotteryId: string;
      primera: string;
      segunda: string;
      tercera: string;
    }>;
  }): Promise<{
    success: boolean;
    count: number;
    results: LotteryResult[];
    recalculation: {
      ticketsEvaluated: number;
      winnersCount: number;
      totalPrizeAwarded: number;
      consorciosAffected?: {
        consorcioId: string;
        consorcioName: string;
        ticketsEvaluated: number;
        winnersCount: number;
        prizeAwarded: number;
      }[];
    };
    message: string;
  }> {
    return request('/results/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Topes
  async getTopes(): Promise<SalesCap[]> {
    return request<SalesCap[]>('/topes');
  },

  async createTope(data: Partial<SalesCap>): Promise<SalesCap> {
    return request<SalesCap>('/topes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTope(id: string, updates: Partial<SalesCap>): Promise<SalesCap> {
    return request<SalesCap>(`/topes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTope(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/topes/${id}`, {
      method: 'DELETE',
    });
  },

  async checkTope(data: {
    lotteryId: string;
    number: string;
    playType: PlayType;
    requestedAmount: number;
    terminalId?: string;
    date?: string;
  }): Promise<{
    allowed: boolean;
    maxAllowed: number;
    currentSold: number;
    remaining: number;
    reason?: string;
  }> {
    return request('/topes/check', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Tickets
  async sellTicket(data: {
    plays: Array<{
      lotteryId: string;
      lottery2Id?: string;
      playType: PlayType;
      numbers: string[];
      amount: number;
    }>;
    terminalId?: string;
    terminalCode?: string;
  }): Promise<Ticket> {
    return request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTicket(idOrCode: string): Promise<Ticket> {
    return request<Ticket>(`/tickets/${encodeURIComponent(idOrCode)}`);
  },

  async getTickets(consorcioId?: string): Promise<Ticket[]> {
    const query = consorcioId ? `?consorcioId=${consorcioId}` : '';
    return request<Ticket[]>(`/tickets${query}`);
  },

  async payTicket(ticketId: string): Promise<{ success: boolean; ticket: Ticket }> {
    return request(`/tickets/${encodeURIComponent(ticketId)}/pay`, {
      method: 'POST',
    });
  },

  async anulTicket(ticketId: string): Promise<{ success: boolean; ticket: Ticket }> {
    return request(`/tickets/${encodeURIComponent(ticketId)}/anul`, {
      method: 'POST',
    });
  },

  // Plays Monitoring
  async getPlays(filter: {
    terminalCode?: string;
    lotteryId?: string;
    playType?: PlayType;
    number?: string;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<TicketPlay & { ticketNumber: string; terminalCode: string; date: string; time: string }>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    return request(`/plays?${params.toString()}`);
  },

  // Prize configuration
  async getPrizes(): Promise<PrizeConfig> {
    return request<PrizeConfig>('/prizes');
  },

  async updatePrizes(config: Partial<PrizeConfig>): Promise<PrizeConfig> {
    return request<PrizeConfig>('/prizes', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  // Settings
  async getSettings(): Promise<CompanySettings> {
    return request<CompanySettings>('/settings');
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    return request<CompanySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Reports
  async getTerminalReport(terminalCode?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (terminalCode) params.append('terminalCode', terminalCode);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request<any>(`/reports/terminal?${params.toString()}`);
  },

  async getSellerBalance(params?: {
    startDate?: string;
    endDate?: string;
    sellerId?: string;
    terminalCode?: string;
    consorcioId?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.sellerId) q.append('sellerId', params.sellerId);
    if (params?.terminalCode) q.append('terminalCode', params.terminalCode);
    if (params?.consorcioId) q.append('consorcioId', params.consorcioId);
    return request<any>(`/sellers/balance?${q.toString()}`);
  },

  async getAdminReport(startDate?: string, endDate?: string, consorcioId?: string, groupId?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (consorcioId) params.append('consorcioId', consorcioId);
    if (groupId) params.append('groupId', groupId);
    return request<any>(`/reports/admin?${params.toString()}`);
  },

  async getAuditLogs(limit = 100): Promise<any[]> {
    return request<any[]>(`/audit-logs?limit=${limit}`);
  },

  // Terminal Printer Settings (per terminal customization)
  async getTerminalSettings(terminalCode: string): Promise<any> {
    return request<any>(`/terminal-settings/${terminalCode}`);
  },

  async saveTerminalSettings(terminalCode: string, settings: any): Promise<any> {
    return request<any>(`/terminal-settings/${terminalCode}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // ----------------- CONSORCIOS (MULTI-TENANT & SUPER ADMIN) -----------------
  async validateConsorcioCode(code: string): Promise<{ valid: boolean; consorcio: any }> {
    return request<{ valid: boolean; consorcio: any }>('/consorcios/validate-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async getConsorcios(): Promise<Consorcio[]> {
    return request<Consorcio[]>('/consorcios');
  },

  async createConsorcio(params: {
    name: string;
    code: string;
    adminName: string;
    adminUsername: string;
    passwordPlain: string;
    costPerTerminal: number;
    authorizedTerminalsCount: number;
    permissions?: any;
    customization?: any;
  }): Promise<Consorcio> {
    return request<Consorcio>('/consorcios', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateConsorcio(id: string, updates: Partial<Consorcio>): Promise<Consorcio> {
    return request<Consorcio>(`/consorcios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleConsorcioStatus(id: string): Promise<Consorcio> {
    return request<Consorcio>(`/consorcios/${id}/toggle-status`, {
      method: 'POST',
    });
  },

  // ----------------- TOPES DE PAGO Y RIESGO FINANCIERO -----------------
  async getConsorcioPayoutLimits(consorcioId: string): Promise<{
    consorcioId: string;
    consorcioName: string;
    consorcioCode: string;
    limits: ConsorcioPayoutLimits;
    riskStats: {
      today: string;
      totalExposure: number;
      totalExposureLimit: number;
      totalExposurePercent: number;
      quinielaExposure: number;
      quinielaLimit: number;
      quinielaPercent: number;
      paleExposure: number;
      paleLimit: number;
      palePercent: number;
      tripletaExposure: number;
      tripletaLimit: number;
      tripletaPercent: number;
      superPaleExposure: number;
      superPaleLimit: number;
      superPalePercent: number;
      openTicketsCount: number;
      status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'CAPPED';
    };
  }> {
    return request(`/consorcios/${consorcioId}/payout-limits`);
  },

  async updateConsorcioPayoutLimits(
    consorcioId: string,
    limits: Partial<ConsorcioPayoutLimits>
  ): Promise<{
    consorcioId: string;
    consorcioName: string;
    consorcioCode: string;
    limits: ConsorcioPayoutLimits;
    riskStats: any;
  }> {
    return request(`/consorcios/${consorcioId}/payout-limits`, {
      method: 'PUT',
      body: JSON.stringify(limits),
    });
  },

  async getConsorciosPayoutLimitsOverview(): Promise<Array<{
    consorcioId: string;
    consorcioName: string;
    consorcioCode: string;
    limits: ConsorcioPayoutLimits;
    riskStats: any;
  }>> {
    return request('/consorcios-payout-limits/overview');
  },

  // ----------------- DEVICES & HARDWARE LOCKS (ACTIVACIÓN Y CONTROL) -----------------
  async registerClientDevice(params: {
    consorcioCode: string;
    deviceId: string;
    deviceName?: string;
    deviceType?: DeviceType;
    ipAddress?: string;
    userAgent?: string;
    osInfo?: string;
    appVersion?: string;
  }): Promise<{ device: DeviceRegistration; consorcio: Consorcio; isNew: boolean }> {
    return request<{ device: DeviceRegistration; consorcio: Consorcio; isNew: boolean }>('/devices/register-client', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async registerDevice(params: {
    consorcioCode: string;
    deviceId: string;
    deviceName?: string;
  }): Promise<{ device: DeviceRegistration; consorcio: Consorcio }> {
    return request<{ device: DeviceRegistration; consorcio: Consorcio }>('/devices/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async verifyDeviceStatus(params: {
    deviceId: string;
    terminalCode?: string;
    deviceToken?: string;
  }): Promise<{ allowed: boolean; status: DeviceStatus; device?: DeviceRegistration; message?: string }> {
    return request<{ allowed: boolean; status: DeviceStatus; device?: DeviceRegistration; message?: string }>(
      '/devices/verify-status',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },

  async getDevices(consorcioId?: string): Promise<DeviceRegistration[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<DeviceRegistration[]>(`/devices?${params.toString()}`);
  },

  async activateDevice(params: {
    deviceId: string;
    consorcioId?: string;
    terminalCode: string;
    terminalType: 'PC' | 'MOVIL';
    bancaName?: string;
    assignedUsername?: string;
    replaceExisting?: boolean;
  }): Promise<{ success: boolean; device: DeviceRegistration; activationCode: string }> {
    return request<{ success: boolean; device: DeviceRegistration; activationCode: string }>('/devices/activate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async confirmDeviceActivation(params: {
    deviceId: string;
    activationCode: string;
    consorcioCode?: string;
  }): Promise<{ success: boolean; device: DeviceRegistration; token: string }> {
    return request<{ success: boolean; device: DeviceRegistration; token: string }>('/devices/confirm-activation', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deactivateDevice(params: { deviceId: string; reason?: string }): Promise<{ success: boolean; device: DeviceRegistration }> {
    return request<{ success: boolean; device: DeviceRegistration }>('/devices/deactivate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async blockDevice(params: { deviceId: string; reason?: string }): Promise<{ success: boolean; device: DeviceRegistration }> {
    return request<{ success: boolean; device: DeviceRegistration }>('/devices/block', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async reactivateDevice(params: { deviceId: string }): Promise<{ success: boolean; device: DeviceRegistration }> {
    return request<{ success: boolean; device: DeviceRegistration }>('/devices/reactivate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getDeviceAuditLogs(consorcioId?: string): Promise<DeviceAuditLog[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<DeviceAuditLog[]>(`/devices/audit-logs?${params.toString()}`);
  },

  // ----------------- CONTROL DE VENTAS, PREMIOS Y GANANCIAS POR TERMINAL Y GRUPO -----------------
  async getTerminalSalesPerformance(params: {
    consorcioId?: string;
    startDate?: string;
    endDate?: string;
    commissionRate?: number;
    groupId?: string;
  } = {}): Promise<TerminalSalesSummary> {
    const q = new URLSearchParams();
    if (params.consorcioId) q.append('consorcioId', params.consorcioId);
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    if (params.commissionRate) q.append('commissionRate', String(params.commissionRate));
    if (params.groupId) q.append('groupId', params.groupId);
    return request<TerminalSalesSummary>(`/reports/terminal-sales?${q.toString()}`);
  },

  async getTerminalTicketsDetail(
    terminalCode: string,
    params: { consorcioId?: string; startDate?: string; endDate?: string } = {}
  ): Promise<TerminalSalesOperation[]> {
    const q = new URLSearchParams();
    if (params.consorcioId) q.append('consorcioId', params.consorcioId);
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    return request<TerminalSalesOperation[]>(`/reports/terminal-sales/${terminalCode}/tickets?${q.toString()}`);
  },

  async getTerminalSalesAudit(params: { consorcioId?: string; terminalCode?: string } = {}): Promise<SalesAuditRecord[]> {
    const q = new URLSearchParams();
    if (params.consorcioId) q.append('consorcioId', params.consorcioId);
    if (params.terminalCode) q.append('terminalCode', params.terminalCode);
    return request<SalesAuditRecord[]>(`/reports/terminal-sales-audit?${q.toString()}`);
  },

  async unbindDevice(terminalId: string): Promise<{ success: boolean; terminal: Terminal }> {
    return request<{ success: boolean; terminal: Terminal }>(`/terminals/${terminalId}/unbind-device`, {
      method: 'POST',
    });
  },

  // ----------------- INVOICES (FACTURAS) -----------------
  async getInvoices(consorcioId?: string): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<Invoice[]>(`/invoices?${params.toString()}`);
  },

  async generateMonthlyInvoice(consorcioId: string, month?: string): Promise<Invoice> {
    return request<Invoice>('/invoices/generate-monthly', {
      method: 'POST',
      body: JSON.stringify({ consorcioId, month }),
    });
  },

  async payInvoice(invoiceId: string): Promise<Invoice> {
    return request<Invoice>(`/invoices/${invoiceId}/pay`, {
      method: 'PUT',
    });
  },

  // ----------------- VISUAL CUSTOMIZATION -----------------
  async getCustomization(consorcioId?: string): Promise<VisualCustomization> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<VisualCustomization>(`/customization?${params.toString()}`);
  },

  async updateGlobalCustomization(updates: Partial<VisualCustomization>): Promise<VisualCustomization> {
    return request<VisualCustomization>('/customization/global', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  async updateConsorcioCustomization(consorcioId: string, updates: Partial<VisualCustomization>): Promise<VisualCustomization> {
    return request<VisualCustomization>(`/customization/consorcio/${consorcioId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  // ----------------- SUPER ADMIN DASHBOARD METRICS -----------------
  async getSuperAdminMetrics(): Promise<{
    totalConsorcios: number;
    activeConsorcios: number;
    suspendedConsorcios: number;
    totalTerminals: number;
    activeTerminals: number;
    inactiveTerminals: number;
    monthlyBilling: number;
    pendingInvoicesAmount: number;
    pendingInvoicesCount: number;
    globalSalesAmount: number;
    recentActivities: any[];
  }> {
    return request<any>('/superadmin/metrics');
  },

  // ----------------- GRUPOS -----------------
  async getGroups(consorcioId?: string): Promise<(ConsorcioGroup & { terminalsCount: number; prizePlanName?: string })[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<(ConsorcioGroup & { terminalsCount: number; prizePlanName?: string })[]>(`/groups?${params.toString()}`);
  },

  async getGroupById(id: string): Promise<ConsorcioGroup & { prizePlan?: PrizePlan; terminals?: Terminal[] }> {
    return request<ConsorcioGroup & { prizePlan?: PrizePlan; terminals?: Terminal[] }>(`/groups/${id}`);
  },

  async createGroup(data: {
    name: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    consorcioId?: string;
    prizePlanId?: string;
    generalDailyCap?: number;
    permissions?: Partial<GroupPermissions>;
    allowedLotteryIds?: string[];
    terminalIds?: string[];
  }): Promise<ConsorcioGroup> {
    return request<ConsorcioGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGroup(id: string, updates: Partial<ConsorcioGroup>): Promise<ConsorcioGroup> {
    return request<ConsorcioGroup>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteGroup(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/groups/${id}`, {
      method: 'DELETE',
    });
  },

  // ----------------- PLANES DE PREMIOS -----------------
  async getPrizePlans(consorcioId?: string): Promise<PrizePlan[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<PrizePlan[]>(`/prize-plans?${params.toString()}`);
  },

  async createPrizePlan(data: Partial<PrizePlan>): Promise<PrizePlan> {
    return request<PrizePlan>('/prize-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePrizePlan(id: string, updates: Partial<PrizePlan>): Promise<PrizePlan> {
    return request<PrizePlan>(`/prize-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePrizePlan(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/prize-plans/${id}`, {
      method: 'DELETE',
    });
  },

  // ----------------- TOPES DE VENTA DEL GRUPO -----------------
  async getGroupTopes(groupId?: string, consorcioId?: string): Promise<GroupSalesCap[]> {
    const params = new URLSearchParams();
    if (groupId) params.append('groupId', groupId);
    if (consorcioId) params.append('consorcioId', consorcioId);
    return request<GroupSalesCap[]>(`/group-topes?${params.toString()}`);
  },

  async createGroupTope(data: Partial<GroupSalesCap>): Promise<GroupSalesCap> {
    return request<GroupSalesCap>('/group-topes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGroupTope(id: string, updates: Partial<GroupSalesCap>): Promise<GroupSalesCap> {
    return request<GroupSalesCap>(`/group-topes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteGroupTope(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/group-topes/${id}`, {
      method: 'DELETE',
    });
  },

  // ----------------- HISTORIAL / AUDITORÍA DE GRUPOS -----------------
  async getGroupAuditLogs(groupId?: string, consorcioId?: string, limit = 100): Promise<GroupAuditLog[]> {
    const params = new URLSearchParams();
    if (groupId) params.append('groupId', groupId);
    if (consorcioId) params.append('consorcioId', consorcioId);
    if (limit) params.append('limit', String(limit));
    return request<GroupAuditLog[]>(`/group-audit-logs?${params.toString()}`);
  },

  // ----------------- SISTEMA DE ACTUALIZACIONES CENTRALIZADO -----------------
  async checkForUpdates(
    terminalCode?: string,
    version?: string
  ): Promise<{
    updateAvailable: boolean;
    update?: SystemUpdate;
    currentVersion: string;
    isMandatory: boolean;
  }> {
    const params = new URLSearchParams();
    if (terminalCode) params.append('terminalCode', terminalCode);
    if (version) params.append('version', version);
    return request(`/updates/check?${params.toString()}`);
  },

  async confirmUpdate(
    terminalCode: string,
    newVersion: string,
    packageHash?: string
  ): Promise<{ success: boolean; terminal: Terminal; message: string }> {
    return request(`/updates/confirm`, {
      method: 'POST',
      body: JSON.stringify({ terminalCode, newVersion, packageHash }),
    });
  },

  async getSystemUpdates(): Promise<SystemUpdate[]> {
    return request<SystemUpdate[]>('/updates');
  },

  async createSystemUpdate(data: {
    version: string;
    title: string;
    releaseNotes: string[];
    isMandatory?: boolean;
    status?: 'PUBLISHED' | 'DRAFT' | 'INACTIVE';
    packageUrl?: string;
    packageHash?: string;
    packageSizeBytes?: number;
    minSupportedVersion?: string;
  }): Promise<SystemUpdate> {
    return request<SystemUpdate>('/updates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSystemUpdate(id: string, updates: Partial<SystemUpdate>): Promise<SystemUpdate> {
    return request<SystemUpdate>(`/updates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleSystemUpdateStatus(id: string): Promise<SystemUpdate> {
    return request<SystemUpdate>(`/updates/${id}/toggle-status`, {
      method: 'POST',
    });
  },

  async deleteSystemUpdate(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/updates/${id}`, {
      method: 'DELETE',
    });
  },

  async getTerminalUpdateStatuses(): Promise<TerminalUpdateStatus[]> {
    return request<TerminalUpdateStatus[]>('/updates/terminals-status');
  },

  async simulateTerminalUpdate(
    terminalCode: string,
    newVersion?: string
  ): Promise<{ success: boolean; terminal: Terminal; message: string }> {
    return request(`/updates/terminals/${terminalCode}/simulate-update`, {
      method: 'POST',
      body: JSON.stringify({ newVersion }),
    });
  },

  // ----------------- SISTEMA DE RESPALDOS Y SEGURIDAD (BACKUPS) -----------------
  async getBackups(): Promise<SystemBackup[]> {
    return request<SystemBackup[]>('/backups');
  },

  async createBackup(description?: string): Promise<SystemBackup> {
    return request<SystemBackup>('/backups', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  },

  async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/backups/${backupId}/restore`, {
      method: 'POST',
    });
  },

  // ----------------- GESTIÓN DE USUARIOS -----------------
  async getUsers(consorcioId?: string): Promise<User[]> {
    const query = consorcioId ? `?consorcioId=${consorcioId}` : '';
    return request<User[]>(`/users${query}`);
  },

  async createUser(userData: Partial<User> & { password?: string }): Promise<User> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(
    id: string,
    userData: Partial<User> & { password?: string }
  ): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleUserStatus(id: string, status: string): Promise<User> {
    return request<User>(`/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // ----------------- DASHBOARD METRICS -----------------
  async getDashboardMetrics(consorcioId?: string): Promise<any> {
    const query = consorcioId ? `?consorcioId=${consorcioId}` : '';
    return request(`/dashboard/metrics${query}`);
  },

  // ----------------- TICKETS GANADORES & PREMIOS -----------------
  async getWinningTickets(params: {
    date?: string;
    consorcioId?: string;
    status?: string;
    terminalCode?: string;
    lotteryId?: string;
  } = {}): Promise<Ticket[]> {
    const q = new URLSearchParams();
    if (params.date) q.append('date', params.date);
    if (params.consorcioId) q.append('consorcioId', params.consorcioId);
    if (params.status) q.append('status', params.status);
    if (params.terminalCode) q.append('terminalCode', params.terminalCode);
    if (params.lotteryId) q.append('lotteryId', params.lotteryId);
    return request<Ticket[]>(`/winners?${q.toString()}`);
  },

  async payWinningTicket(ticketId: string): Promise<{ success: boolean; ticket: Ticket }> {
    return request<{ success: boolean; ticket: Ticket }>(`/tickets/${ticketId}/pay`, {
      method: 'POST',
    });
  },

  // ----------------- CONTROL DE PERMISOS SÚPER ADMIN & AUDITORÍA -----------------
  async getAdminUsers(consorcioId?: string): Promise<User[]> {
    const query = consorcioId ? `?consorcioId=${consorcioId}` : '';
    return request<User[]>(`/admin/users${query}`);
  },

  async updateAdminPermissions(
    userId: string,
    permissions: Partial<AdminGranularPermissions>
  ): Promise<{ success: boolean; message: string; user: User }> {
    return request<{ success: boolean; message: string; user: User }>(`/admin/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },

  async getAdminAuditLogs(consorcioId?: string, limit = 150): Promise<AdminAuditLog[]> {
    const params = new URLSearchParams();
    if (consorcioId) params.append('consorcioId', consorcioId);
    if (limit) params.append('limit', String(limit));
    return request<AdminAuditLog[]>(`/admin/audit-logs?${params.toString()}`);
  },

  async toggleAdminResultsPermission(params: {
    enabled: boolean;
    adminId?: string;
  }): Promise<{ success: boolean; enabled: boolean; message: string; count?: number }> {
    return request<{ success: boolean; enabled: boolean; message: string; count?: number }>(
      '/admin/permissions/toggle-results',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },
};
