import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, validateInheritedGroupPermissions } from './server/db.ts';
import { AdminGranularPermissions } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS & Preflight Handling for iframe & dev preview
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof db.getUserByToken>;
  token?: string;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token no suministrado.' });
  }

  const token = authHeader.substring(7);
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sesión no válida o expirada.' });
  }

  req.user = user;
  req.token = token;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador o Súper Admin.' });
  }
  next();
}

function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Súper Administrador.' });
  }
  next();
}

function requirePermission(perm: keyof AdminGranularPermissions) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado.' });
    }
    // Súper Admin has unconditional master access to all operations
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    // Consorcio Admin must have specific permission authorized by Super Admin
    if (req.user.role === 'ADMIN') {
      const perms = (req.user as any).adminPermissions;
      if (perm === 'resultados') {
        if (!perms || perms.resultados !== true) {
          return res.status(403).json({
            error: 'Acceso denegado: Solo el Súper Administrador puede subir los números ganadores en cada sorteo por día, a menos que le otorgue el permiso a los administradores.',
            permissionDenied: 'resultados',
          });
        }
      } else if (perms && perms[perm] === false) {
        return res.status(403).json({
          error: `Acceso denegado: El Súper Administrador no ha autorizado el permiso de "${perm}" para su cuenta.`,
          permissionDenied: perm,
        });
      }
      return next();
    }
    next();
  };
}

// ----------------- AUTH ROUTES -----------------
app.post('/api/auth/login', (req, res) => {
  const { username, password, deviceId, consorcioCode } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Debe ingresar usuario y contraseña.' });
  }

  try {
    const result = db.login(username, password, deviceId, consorcioCode);
    if (!result) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Error al iniciar sesión' });
  }
});

app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.token) {
    db.logout(req.token);
  }
  res.json({ success: true });
});

// ----------------- TERMINALS (MULTI-CONSORCIO) -----------------
app.get('/api/terminals', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const consorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (req.query.consorcioId as string) || 'ALL'
    : req.user?.consorcioId;
  res.json(db.getTerminals(consorcioId));
});

app.post('/api/terminals', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { code, name, location, username, password, creditLimit, balanceLimit, contactPhone, deviceId, consorcioId } = req.body;
    if (!code || !name || !username || !password) {
      return res.status(400).json({ error: 'Código, nombre, usuario y contraseña son requeridos.' });
    }
    const targetConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'c-1230') : req.user?.consorcioId;
    const effectiveCreditLimit = creditLimit !== undefined ? Number(creditLimit) : (balanceLimit !== undefined ? Number(balanceLimit) : 50000);
    const result = db.createTerminal({
      code,
      name,
      location: location || '',
      username,
      passwordPlain: password,
      creditLimit: effectiveCreditLimit,
      balanceLimit: effectiveCreditLimit,
      contactPhone: contactPhone || '',
      deviceId,
      consorcioId: targetConsorcioId,
      callerRole: req.user?.role,
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Real-time Credit Limit & Risk status endpoint
app.get('/api/terminals/credit-status', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const termCode = (req.query.terminalCode as string) || req.user?.terminalCode || req.user?.username || '0001';
    const status = db.getTerminalCreditStatus(termCode);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/terminals/:id/credit-status', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const status = db.getTerminalCreditStatus(req.params.id);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/terminals/:id/credit-limit', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { creditLimit } = req.body;
    if (creditLimit === undefined || isNaN(Number(creditLimit))) {
      return res.status(400).json({ error: 'Monto de límite de crédito válido es requerido.' });
    }
    const term = db.updateTerminal(
      req.params.id,
      { creditLimit: Number(creditLimit), balanceLimit: Number(creditLimit) },
      req.user ? { id: req.user.id, name: req.user.name, username: req.user.username, role: req.user.role } : undefined
    );
    res.json({ success: true, terminal: term });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/terminals/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const term = db.updateTerminal(
      req.params.id,
      req.body,
      req.user ? { id: req.user.id, name: req.user.name, username: req.user.username, role: req.user.role } : undefined
    );
    res.json(term);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/terminals/:id/change-type', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { terminalType } = req.body;
    if (!terminalType || (terminalType !== 'PC' && terminalType !== 'MOVIL')) {
      return res.status(400).json({ error: 'Tipo de terminal inválido. Debe ser PC o MOVIL.' });
    }
    const term = db.updateTerminal(
      req.params.id,
      { terminalType },
      req.user ? { id: req.user.id, name: req.user.name, username: req.user.username, role: req.user.role } : undefined
    );
    res.json({ success: true, terminal: term });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/terminals/:id/unbind-device', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const term = db.unbindDevice(
      req.params.id,
      req.user ? { id: req.user.id, name: req.user.name } : undefined
    );
    res.json({ success: true, terminal: term });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- LOTTERIES -----------------
app.get('/api/lotteries', (req, res) => {
  res.json(db.getLotteries());
});

app.post('/api/lotteries', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, code, openTime, closeTime, drawTime, daysOfWeek, active, color } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Nombre y código son requeridos.' });
    }
    const lot = db.createLottery({
      name,
      code,
      openTime: openTime || '07:00 AM',
      closeTime: closeTime || drawTime || '12:55 PM',
      drawTime: drawTime || closeTime || '12:55 PM',
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      active: active !== undefined ? active : true,
      color: color || '#2563EB',
    });
    res.status(201).json(lot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/lotteries/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const lot = db.updateLottery(req.params.id, req.body);
    res.json(lot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- RESULTS & AUTO CALCULATION -----------------
app.get('/api/results', (req, res) => {
  const { date, lotteryId } = req.query as { date?: string; lotteryId?: string };
  res.json(db.getResults(date, lotteryId));
});

app.post('/api/results', authMiddleware, requireAdmin, requirePermission('resultados'), (req: AuthenticatedRequest, res) => {
  try {
    const { lotteryId, drawDate, primera, segunda, tercera, targetConsorcioId } = req.body;
    if (!lotteryId || !drawDate || primera === undefined || segunda === undefined || tercera === undefined) {
      return res.status(400).json({ error: 'Lotería, fecha y los 3 números ganadores son requeridos.' });
    }

    const effectiveTargetConsorcioId = req.user?.role === 'SUPER_ADMIN'
      ? (targetConsorcioId || 'ALL')
      : (req.user?.consorcioId || 'c-1230');

    const outcome = db.publishResults({
      lotteryId,
      drawDate,
      primera: String(primera),
      segunda: String(segunda),
      tercera: String(tercera),
      publishedBy: req.user!.name,
      targetConsorcioId: effectiveTargetConsorcioId,
    });

    res.json({
      success: true,
      result: outcome.result,
      recalculation: outcome.recalculation,
      message: `Resultados registrados. Se evaluaron ${outcome.recalculation.ticketsEvaluated} tickets. Premios otorgados: RD$${outcome.recalculation.totalPrizeAwarded.toLocaleString()}`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint para publicar resultados en lote de múltiples o todas las loterías y cargarlos a cada consorcio
app.post('/api/results/batch', authMiddleware, requireAdmin, requirePermission('resultados'), (req: AuthenticatedRequest, res) => {
  try {
    const { drawDate, items, targetConsorcioId } = req.body;
    if (!drawDate || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Fecha y lista de resultados son requeridos.' });
    }

    const effectiveTargetConsorcioId = req.user?.role === 'SUPER_ADMIN'
      ? (targetConsorcioId || 'ALL')
      : (req.user?.consorcioId || 'c-1230');

    const outcome = db.publishBatchResults({
      drawDate,
      items,
      publishedBy: req.user!.name,
      targetConsorcioId: effectiveTargetConsorcioId,
    });

    const targetLabel = effectiveTargetConsorcioId === 'ALL'
      ? 'Todos los Consorcios'
      : (db.getConsorcioById(effectiveTargetConsorcioId)?.name || effectiveTargetConsorcioId);

    res.json({
      success: true,
      count: outcome.count,
      results: outcome.results,
      recalculation: outcome.recalculation,
      message: `Se publicaron los resultados de ${outcome.count} loterías cargados a: ${targetLabel}. Se evaluaron ${outcome.recalculation.ticketsEvaluated} tickets en total. Premios: RD$${outcome.recalculation.totalPrizeAwarded.toLocaleString()}`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- TOPES DE VENTA -----------------
app.get('/api/topes', authMiddleware, requireAdmin, (req, res) => {
  res.json(db.getSalesCaps());
});

app.post('/api/topes', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { lotteryId, lotteryName, number, playType, terminalId, terminalCode, date, maxAmount, active } = req.body;
    if (!maxAmount || isNaN(Number(maxAmount))) {
      return res.status(400).json({ error: 'El monto máximo es requerido.' });
    }

    const cap = db.createSalesCap({
      lotteryId: lotteryId || '',
      lotteryName: lotteryName || '',
      number: number ? String(number).padStart(2, '0').slice(-2) : undefined,
      playType: playType || undefined,
      terminalId: terminalId || '',
      terminalCode: terminalCode || '',
      date: date || undefined,
      maxAmount: Number(maxAmount),
      active: active !== undefined ? active : true,
    });

    res.status(201).json(cap);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/topes/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const cap = db.updateSalesCap(req.params.id, req.body);
    res.json(cap);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/topes/:id', authMiddleware, requireAdmin, (req, res) => {
  const success = db.deleteSalesCap(req.params.id);
  res.json({ success });
});

app.post('/api/topes/check', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { lotteryId, number, playType, requestedAmount, terminalId, date } = req.body;
  const check = db.checkSalesCap({
    lotteryId,
    number: String(number).padStart(2, '0').slice(-2),
    playType,
    terminalId: terminalId || req.user?.terminalCode,
    date,
    requestedAmount: Number(requestedAmount) || 0,
  });
  res.json(check);
});

// ----------------- TICKETS & POS SALES -----------------
app.post('/api/tickets', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { plays, terminalId, terminalCode, consorcioId } = req.body;
    const effectiveConsorcioId = req.user?.consorcioId || consorcioId || 'c-1230';

    // Robust Terminal Resolution:
    // 1. If terminal user, prefer their active terminal
    let terminal = req.user?.role === 'TERMINAL'
      ? db.getTerminals().find((t) => t.active && (t.code === req.user?.terminalCode || t.username === req.user?.username))
      : null;

    // 2. Try by explicitly provided terminalCode or terminalId
    if (!terminal && (terminalId || terminalCode)) {
      terminal = db.getTerminals().find(
        (t) => t.active && (t.id === terminalId || t.code === terminalCode || t.username === terminalCode)
      );
    }

    // 3. Fallback for ADMIN / SUPER_ADMIN or POS testing:
    // Pick the primary active terminal for the consorcio or central terminal '1001'
    if (!terminal) {
      const activeList = db.getTerminals(effectiveConsorcioId).filter((t) => t.active);
      terminal =
        activeList.find((t) => t.code === '1001') ||
        activeList[0] ||
        db.getTerminals().find((t) => t.code === '1001' && t.active) ||
        db.getTerminals().find((t) => t.active);
    }

    if (!terminal) {
      return res.status(400).json({ error: 'No hay ninguna terminal activa o autorizada disponible en el sistema.' });
    }

    const ticket = db.createTicket({
      terminalId: terminal.id,
      terminalCode: terminal.code,
      userId: req.user!.id,
      userName: req.user!.name,
      consorcioId: effectiveConsorcioId,
      plays,
    });

    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/tickets', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const consorcioId = req.user?.role === 'SUPER_ADMIN' ? (req.query.consorcioId as string) : req.user?.consorcioId;
    const tickets = db.getTickets(consorcioId);
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:idOrCode', authMiddleware, (req: AuthenticatedRequest, res) => {
  const ticket = db.getTicketByNumberOrCode(req.params.idOrCode);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado con ese número o código de seguridad.' });
  }

  // Requirement 14: Isolation! If user is not SUPER_ADMIN, they can only view tickets from their consorcio
  if (
    req.user?.role !== 'SUPER_ADMIN' &&
    req.user?.consorcioId &&
    ticket.consorcioId &&
    ticket.consorcioId !== req.user.consorcioId
  ) {
    return res.status(403).json({ error: 'Acceso denegado. Este ticket pertenece a otro consorcio.' });
  }

  res.json(ticket);
});

// ----------------- TICKETS GANADORES & PAGO DE PREMIOS -----------------
app.get('/api/winners', authMiddleware, requirePermission('ganadores'), (req: AuthenticatedRequest, res) => {
  try {
    const { date, status, terminalCode, lotteryId, consorcioId } = req.query as any;
    const targetConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;
    const targetTerminal = req.user?.role === 'TERMINAL' ? (req.user.terminalCode || req.user.username) : terminalCode;
    const winners = db.getWinningTickets({
      date,
      status,
      terminalCode: targetTerminal,
      lotteryId,
      consorcioId: targetConsorcioId,
    });
    res.json(winners);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/pay', authMiddleware, requirePermission('pagoPremios'), (req: AuthenticatedRequest, res) => {
  try {
    const existingTicket = db.getTicketById(req.params.id);
    if (
      existingTicket &&
      req.user?.role !== 'SUPER_ADMIN' &&
      req.user?.consorcioId &&
      existingTicket.consorcioId &&
      existingTicket.consorcioId !== req.user.consorcioId
    ) {
      return res.status(403).json({ error: 'No autorizado para pagar tickets de otro consorcio.' });
    }

    const ticket = db.payTicket(req.params.id, req.user!.name);
    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/anul', authMiddleware, requirePermission('anulaciones'), (req: AuthenticatedRequest, res) => {
  try {
    const existingTicket = db.getTicketById(req.params.id);
    if (
      existingTicket &&
      req.user?.role !== 'SUPER_ADMIN' &&
      req.user?.consorcioId &&
      existingTicket.consorcioId &&
      existingTicket.consorcioId !== req.user.consorcioId
    ) {
      return res.status(403).json({ error: 'No autorizado para anular tickets de otro consorcio.' });
    }

    const ticket = db.anulTicket(req.params.id, req.user!.name);
    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- SUPER ADMIN: GESTIÓN DE ADMINISTRADORES Y PERMISOS -----------------
app.get('/api/admin/users', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const consorcioId = req.user?.role === 'SUPER_ADMIN' ? (req.query.consorcioId as string) : req.user?.consorcioId;
    const adminUsers = db.getAdminUsers(consorcioId);
    res.json(adminUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/permissions', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Objeto de permisos no válido.' });
    }
    const updated = db.updateAdminPermissions(req.user as any, req.params.id, permissions);
    res.json({
      success: true,
      message: `Permisos del Administrador "${updated.name || updated.username}" actualizados correctamente.`,
      user: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/permissions/toggle-results', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { enabled, adminId } = req.body;
    const isEnabled = Boolean(enabled);

    if (adminId) {
      const updated = db.updateAdminPermissions(req.user as any, adminId, { resultados: isEnabled });
      return res.json({
        success: true,
        enabled: isEnabled,
        adminId,
        message: `Permiso para subir números ganadores ${isEnabled ? 'OTORGADO' : 'REVOCADO'} al administrador ${updated.name || updated.username}.`,
      });
    }

    const admins = db.getAdminUsers();
    let count = 0;
    for (const a of admins) {
      if (a.role === 'ADMIN') {
        db.updateAdminPermissions(req.user as any, a.id, { resultados: isEnabled });
        count++;
      }
    }

    res.json({
      success: true,
      enabled: isEnabled,
      count,
      message: `Permiso para subir números ganadores ${isEnabled ? 'OTORGADO' : 'REVOCADO'} a ${count} administrador(es).`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/audit-logs', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const consorcioId = req.user?.role === 'SUPER_ADMIN' ? (req.query.consorcioId as string) : req.user?.consorcioId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 150;
    const logs = db.getAdminAuditLogs({ consorcioId, limit });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- MONITOREO DE JUGADAS (MULTI-CONSORCIO) -----------------
app.get('/api/plays', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { terminalCode, lotteryId, playType, number, status, date, startDate, endDate, consorcioId } = req.query as any;

  // If user is a terminal, constrain to their terminal only
  const effectiveTerminalCode = req.user?.role === 'TERMINAL' ? req.user.terminalCode : terminalCode;
  const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;

  const plays = db.getPlays({
    terminalCode: effectiveTerminalCode,
    lotteryId,
    playType,
    number,
    status,
    date,
    startDate,
    endDate,
    consorcioId: effectiveConsorcioId,
  });

  res.json(plays);
});

// ----------------- CONSORCIOS (SUPER ADMIN & MULTI-TENANT) -----------------
app.post('/api/consorcios/validate-code', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código de consorcio requerido.' });
  const cons = db.getConsorcioByCode(code);
  if (!cons) {
    return res.status(404).json({ error: `Código de consorcio "${code}" no encontrado en el sistema.` });
  }
  if (cons.status === 'SUSPENDED') {
    return res.status(403).json({ error: `El consorcio "${cons.name}" se encuentra suspendido.` });
  }
  const customization = db.getEffectiveCustomization(cons.id);
  res.json({
    valid: true,
    consorcio: {
      id: cons.id,
      code: cons.code,
      name: cons.name,
      adminName: cons.adminName,
      status: cons.status,
      customization,
    },
  });
});

app.get('/api/consorcios', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return res.json(db.getConsorcios());
  }
  if (req.user?.consorcioId) {
    const cons = db.getConsorcioById(req.user.consorcioId);
    return res.json(cons ? [cons] : []);
  }
  res.json([]);
});

app.post('/api/consorcios', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const cons = db.createConsorcio(req.body);
    res.status(201).json(cons);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/consorcios/:id', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const cons = db.updateConsorcio(req.params.id, req.body);
    res.json(cons);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/consorcios/:id/toggle-status', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const cons = db.toggleConsorcioStatus(req.params.id);
    res.json(cons);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- TOPES DE PAGO Y RIESGO FINANCIERO (CONSORCIOS) -----------------
app.get('/api/consorcios/:id/payout-limits', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const consId = req.params.id;
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.consorcioId && req.user.consorcioId !== consId) {
      return res.status(403).json({ error: 'No autorizado para consultar este consorcio.' });
    }
    const result = db.getConsorcioPayoutLimits(consId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/consorcios/:id/payout-limits', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const consId = req.params.id;
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.consorcioId && req.user.consorcioId !== consId) {
      return res.status(403).json({ error: 'No autorizado para modificar los topes de este consorcio.' });
    }
    const updated = db.updateConsorcioPayoutLimits(
      consId,
      req.body,
      req.user?.name || req.user?.username || 'Administrador'
    );
    const fresh = db.getConsorcioPayoutLimits(consId);
    res.json(fresh);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/consorcios-payout-limits/overview', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    let consorcios = db.getConsorcios();
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.consorcioId) {
      consorcios = consorcios.filter(c => c.id === req.user?.consorcioId);
    }
    const overview = consorcios.map(c => db.getConsorcioPayoutLimits(c.id));
    res.json(overview);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- DEVICES (ACTIVACIÓN Y CONTROL DE PC / MÓVILES) -----------------
// 1. Initial Device Self-Registration / Heartbeat
app.post('/api/devices/register-client', (req, res) => {
  try {
    const { consorcioCode, deviceId, deviceName, deviceType, ipAddress, userAgent, osInfo, appVersion } = req.body;
    if (!consorcioCode || !deviceId) {
      return res.status(400).json({ error: 'Código de consorcio e ID de dispositivo son requeridos.' });
    }
    const result = db.registerClientDevice({
      consorcioCode,
      deviceId,
      deviceName,
      deviceType,
      ipAddress: ipAddress || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent,
      osInfo,
      appVersion,
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Legacy backward-compatible route
app.post('/api/devices/register', (req, res) => {
  try {
    const { consorcioCode, deviceId, deviceName } = req.body;
    if (!consorcioCode || !deviceId) {
      return res.status(400).json({ error: 'Código de consorcio e ID de dispositivo son requeridos.' });
    }
    const result = db.registerClientDevice({ consorcioCode, deviceId, deviceName });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Periodic Status Verification / Heartbeat
app.post('/api/devices/verify-status', (req, res) => {
  try {
    const { deviceId, terminalCode, deviceToken } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'ID de dispositivo requerido.' });
    }
    const result = db.verifyDeviceStatus({ deviceId, terminalCode, deviceToken });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. List Devices for Admin
app.get('/api/devices', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const consorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (req.query.consorcioId as string) || 'ALL'
    : req.user?.consorcioId;
  res.json(db.getDevices(consorcioId));
});

// 4. Admin Activate Device & Assign Terminal
app.post('/api/devices/activate', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { deviceId, consorcioId, terminalCode, terminalType, bancaName, assignedUsername, replaceExisting } = req.body;
    if (!deviceId || !terminalCode) {
      return res.status(400).json({ error: 'Se requiere el código del dispositivo y la terminal a asignar.' });
    }
    if (!terminalType || (terminalType !== 'PC' && terminalType !== 'MOVIL')) {
      return res.status(400).json({ error: 'Es obligatorio seleccionar el Tipo de Terminal: 💻 Versión PC o 📱 Versión Móvil para poder activarla.' });
    }

    const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'c-1230') : req.user?.consorcioId;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = db.activateDevice({
      deviceId,
      consorcioId: effectiveConsorcioId,
      terminalCode,
      terminalType,
      bancaName,
      assignedUsername,
      adminUsername: req.user!.username,
      adminName: req.user!.name,
      replaceExisting: !!replaceExisting,
      ip,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Device confirms activation code
app.post('/api/devices/confirm-activation', (req, res) => {
  try {
    const { deviceId, activationCode, consorcioCode } = req.body;
    if (!deviceId || !activationCode) {
      return res.status(400).json({ error: 'Código de dispositivo y código de activación son requeridos.' });
    }
    const result = db.confirmDeviceActivation({ deviceId, activationCode, consorcioCode });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Admin Deactivate Device
app.post('/api/devices/deactivate', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { deviceId, reason } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'ID de dispositivo requerido.' });

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const device = db.deactivateDevice({
      deviceId,
      reason,
      adminUsername: req.user!.username,
      adminName: req.user!.name,
      ip,
    });
    res.json({ success: true, device });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Admin Emergency Block Device
app.post('/api/devices/block', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { deviceId, reason } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'ID de dispositivo requerido.' });

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const device = db.blockDevice({
      deviceId,
      reason,
      adminUsername: req.user!.username,
      adminName: req.user!.name,
      ip,
    });
    res.json({ success: true, device });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Admin Reactivate Device
app.post('/api/devices/reactivate', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'ID de dispositivo requerido.' });

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const device = db.reactivateDevice({
      deviceId,
      adminUsername: req.user!.username,
      adminName: req.user!.name,
      ip,
    });
    res.json({ success: true, device });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Audit Logs for Devices
app.get('/api/devices/audit-logs', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const consorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (req.query.consorcioId as string) || 'ALL'
    : req.user?.consorcioId;
  res.json(db.getDeviceAuditLogs(consorcioId));
});

// ----------------- INVOICES (FACTURAS) -----------------
app.get('/api/invoices', authMiddleware, (req: AuthenticatedRequest, res) => {
  const consorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (req.query.consorcioId as string) || 'ALL'
    : req.user?.consorcioId;
  res.json(db.getInvoices(consorcioId));
});

app.post('/api/invoices/generate-monthly', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const { consorcioId, month } = req.body;
    if (!consorcioId) return res.status(400).json({ error: 'ID de consorcio requerido.' });
    const invoice = db.generateMonthlyInvoice(consorcioId, month);
    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/invoices/:id/pay', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const invoice = db.payInvoice(req.params.id);
    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- VISUAL CUSTOMIZATION -----------------
app.get('/api/customization', (req, res) => {
  const consorcioId = req.query.consorcioId as string | undefined;
  res.json(db.getEffectiveCustomization(consorcioId));
});

app.post('/api/customization/global', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const updated = db.updateGlobalCustomization(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/customization/consorcio/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (req.user?.consorcioId !== req.params.id) {
        return res.status(403).json({ error: 'No autorizado para personalizar otro consorcio.' });
      }
      if (req.user?.permissions && !req.user.permissions.visualCustomization) {
        return res.status(403).json({ error: 'No tiene permiso para personalizar la apariencia visual.' });
      }
    }
    const updated = db.updateConsorcioCustomization(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- SUPER ADMIN DASHBOARD METRICS -----------------
app.get('/api/superadmin/metrics', authMiddleware, requireSuperAdmin, (req, res) => {
  res.json(db.getSuperAdminMetrics());
});

app.get('/api/audit-logs', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json(db.getAuditLogs(limit));
});

// ----------------- PRIZES & CONFIG -----------------
app.get('/api/prizes', (req, res) => {
  res.json(db.getPrizeConfig());
});

app.put('/api/prizes', authMiddleware, requireAdmin, (req, res) => {
  try {
    const updated = db.updatePrizeConfig(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', authMiddleware, requireAdmin, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- REPORTS -----------------
app.get('/api/reports/terminal', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { terminalCode, startDate, endDate } = req.query as {
    terminalCode?: string;
    startDate?: string;
    endDate?: string;
  };

  const targetTerminal = req.user?.role === 'TERMINAL' ? req.user.terminalCode! : terminalCode || '1001';
  const report = db.getTerminalReport(targetTerminal, startDate, endDate);
  res.json(report);
});

// ----------------- MÓDULO VENDEDORES: BALANCE DE VENTAS Y MOVIMIENTOS -----------------
app.get('/api/sellers/balance', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, sellerId, terminalCode, consorcioId } = req.query as {
      startDate?: string;
      endDate?: string;
      sellerId?: string;
      terminalCode?: string;
      consorcioId?: string;
    };

    const isSeller = req.user?.role === 'TERMINAL' || Boolean(req.user?.terminalCode && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN');
    // Si es vendedor o terminal, se aísla exclusivamente a sus propias ventas
    const effectiveSellerId = isSeller ? (req.user?.id || req.user?.username) : sellerId;
    const effectiveTerminalCode = isSeller ? (req.user?.terminalCode || req.user?.username) : terminalCode;
    const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;

    const balanceData = db.getSellerBalance({
      startDate,
      endDate,
      sellerId: effectiveSellerId,
      terminalCode: effectiveTerminalCode,
      consorcioId: effectiveConsorcioId,
    });

    res.json(balanceData);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reports/admin', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { startDate, endDate, consorcioId, groupId } = req.query as {
    startDate?: string;
    endDate?: string;
    consorcioId?: string;
    groupId?: string;
  };
  const targetConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;
  const report = db.getAdminReport(startDate, endDate, targetConsorcioId, groupId);
  res.json(report);
});

// ----------------- CONTROL DE VENTAS, PREMIOS Y GANANCIAS POR TERMINAL Y GRUPO -----------------
app.get('/api/reports/terminal-sales', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, consorcioId, commissionRate, groupId } = req.query as {
      startDate?: string;
      endDate?: string;
      consorcioId?: string;
      commissionRate?: string;
      groupId?: string;
    };
    const targetConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;
    const comm = commissionRate ? parseFloat(commissionRate) : 15;
    const summary = db.getTerminalSalesPerformance({
      consorcioId: targetConsorcioId,
      startDate,
      endDate,
      commissionRate: isNaN(comm) ? 15 : comm,
      groupId,
    });
    res.json(summary);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reports/terminal-sales/:terminalCode/tickets', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, consorcioId } = req.query as {
      startDate?: string;
      endDate?: string;
      consorcioId?: string;
    };
    const targetConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;
    const operations = db.getTerminalTicketsDetail(
      req.params.terminalCode,
      startDate,
      endDate,
      targetConsorcioId
    );
    res.json(operations);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reports/terminal-sales-audit', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { consorcioId, terminalCode } = req.query as {
      consorcioId?: string;
      terminalCode?: string;
    };
    const targetConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;
    const logs = db.getSalesAuditRecords(targetConsorcioId, terminalCode);
    res.json(logs);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- TERMINAL PRINTER SETTINGS -----------------
app.get('/api/terminal-settings/:code', authMiddleware, (req, res) => {
  const config = db.getTerminalPrinterConfig(req.params.code);
  res.json(config);
});

app.put('/api/terminal-settings/:code', authMiddleware, (req, res) => {
  try {
    const updated = db.saveTerminalPrinterConfig(req.params.code, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- GRUPOS (SUB-UNITS & INHERITED PERMISSIONS VALIDATION) -----------------
app.get('/api/groups', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const consorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (req.query.consorcioId as string) || 'ALL'
    : req.user?.consorcioId;
  res.json(db.getGroups(consorcioId));
});

app.get('/api/groups/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const grp = db.getGroupById(req.params.id);
  if (!grp) {
    return res.status(404).json({ error: 'Grupo no encontrado.' });
  }
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.consorcioId && grp.consorcioId !== req.user.consorcioId) {
    return res.status(403).json({ error: 'No autorizado para consultar grupos de otro consorcio.' });
  }
  res.json(grp);
});

app.post('/api/groups', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, status, consorcioId, prizePlanId, generalDailyCap, permissions, allowedLotteryIds, terminalIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
    }

    const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'c-1230') : req.user?.consorcioId;
    if (!effectiveConsorcioId) {
      return res.status(400).json({ error: 'Consorcio no identificado para la creación del grupo.' });
    }

    const consorcio = db.getConsorcioById(effectiveConsorcioId);
    if (!consorcio) {
      return res.status(404).json({ error: 'Consorcio no encontrado en el sistema.' });
    }

    // MANDATORY SECURITY RULE & API VALIDATION LAYER:
    // EL GRUPO NO PUEDE TENER MÁS PERMISOS QUE SU ADMINISTRADOR.
    // Si el Admin del Consorcio no tiene un permiso, ese permiso no puede ser asignado al grupo.
    const validation = validateInheritedGroupPermissions(consorcio.permissions, permissions || {});
    if (!validation.valid) {
      return res.status(400).json({
        error: `Violación de herencia de permisos: El grupo no puede tener permisos superiores a los de su Administrador de Consorcio. Permisos no permitidos: ${validation.unauthorizedPermissions.join(', ')}.`,
        unauthorizedPermissions: validation.unauthorizedPermissions,
      });
    }

    const newGroup = db.createGroup(
      {
        name,
        description,
        status: status || 'ACTIVE',
        consorcioId: effectiveConsorcioId,
        prizePlanId,
        generalDailyCap: generalDailyCap ? Number(generalDailyCap) : undefined,
        permissions: validation.sanitizedPermissions,
        allowedLotteryIds: allowedLotteryIds || [],
        terminalIds: terminalIds || [],
      },
      req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : undefined
    );

    res.status(201).json(newGroup);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/groups/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const existing = db.getGroupById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Grupo no encontrado.' });
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.consorcioId && existing.consorcioId !== req.user.consorcioId) {
      return res.status(403).json({ error: 'No autorizado para modificar grupos de otro consorcio.' });
    }

    const consorcio = db.getConsorcioById(existing.consorcioId);
    if (!consorcio) {
      return res.status(404).json({ error: 'Consorcio del grupo no encontrado.' });
    }

    let sanitizedPermissions = req.body.permissions;
    if (req.body.permissions) {
      // Validate inherited permissions on update
      const validation = validateInheritedGroupPermissions(consorcio.permissions, req.body.permissions);
      if (!validation.valid) {
        return res.status(400).json({
          error: `Violación de herencia de permisos: El grupo no puede tener permisos que el Administrador del Consorcio no posea. Permisos revocados/no autorizados: ${validation.unauthorizedPermissions.join(', ')}.`,
          unauthorizedPermissions: validation.unauthorizedPermissions,
        });
      }
      sanitizedPermissions = validation.sanitizedPermissions;
    }

    const updated = db.updateGroup(
      req.params.id,
      {
        ...req.body,
        permissions: sanitizedPermissions !== undefined ? sanitizedPermissions : undefined,
      },
      req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : undefined
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/groups/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const existing = db.getGroupById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Grupo no encontrado.' });
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.consorcioId && existing.consorcioId !== req.user.consorcioId) {
      return res.status(403).json({ error: 'No autorizado para eliminar grupos de otro consorcio.' });
    }

    const success = db.deleteGroup(
      req.params.id,
      req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : undefined
    );
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- PLANES DE PREMIOS (PRIZE PLANS) -----------------
app.get('/api/prize-plans', authMiddleware, (req: AuthenticatedRequest, res) => {
  const consorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (req.query.consorcioId as string) || 'ALL'
    : req.user?.consorcioId;
  res.json(db.getPrizePlans(consorcioId));
});

app.post('/api/prize-plans', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN'
      ? (req.body.consorcioId || 'c-1230')
      : req.user?.consorcioId;
    const plan = db.createPrizePlan({
      ...req.body,
      consorcioId: effectiveConsorcioId,
    });
    res.status(201).json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/prize-plans/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updatePrizePlan(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/prize-plans/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const success = db.deletePrizePlan(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- TOPES DE VENTA DEL GRUPO (GROUP TOPES) -----------------
app.get('/api/group-topes', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { groupId, consorcioId } = req.query as { groupId?: string; consorcioId?: string };
  const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN'
    ? (consorcioId || 'ALL')
    : req.user?.consorcioId;
  res.json(db.getGroupSalesCaps(groupId, effectiveConsorcioId));
});

app.post('/api/group-topes', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { groupId, lotteryId, lotteryName, playType, number, terminalId, terminalCode, date, maxAmount, active, consorcioId } = req.body;
    if (!groupId) return res.status(400).json({ error: 'El ID de grupo es requerido.' });
    if (!maxAmount || isNaN(Number(maxAmount))) return res.status(400).json({ error: 'Monto límite válido requerido.' });

    const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'c-1230') : req.user?.consorcioId;
    const cap = db.createGroupSalesCap(
      {
        groupId,
        consorcioId: effectiveConsorcioId,
        lotteryId,
        lotteryName,
        playType,
        number,
        terminalId,
        terminalCode,
        date,
        maxAmount: Number(maxAmount),
        active: active !== undefined ? active : true,
      },
      req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : undefined
    );
    res.status(201).json(cap);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/group-topes/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateGroupSalesCap(
      req.params.id,
      req.body,
      req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : undefined
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/group-topes/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const success = db.deleteGroupSalesCap(
      req.params.id,
      req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : undefined
    );
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------- AUDITORÍA & HISTORIAL DE GRUPOS -----------------
app.get('/api/group-audit-logs', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { groupId, consorcioId, limit } = req.query as { groupId?: string; consorcioId?: string; limit?: string };
  const effectiveConsorcioId = req.user?.role === 'SUPER_ADMIN' ? (consorcioId || 'ALL') : req.user?.consorcioId;
  res.json(db.getGroupAuditLogs(groupId, effectiveConsorcioId, limit ? Number(limit) : 100));
});

// ----------------- SISTEMA DE ACTUALIZACIONES CENTRALIZADO -----------------

// Automatic detection endpoint called by terminals on start and periodically
app.get('/api/updates/check', (req, res) => {
  const { terminalCode, version } = req.query as { terminalCode?: string; version?: string };
  const termCode = terminalCode || '1001';
  const result = db.checkUpdateForTerminal(termCode, version);
  res.json(result);
});

// Terminal confirms successful update installation
app.post('/api/updates/confirm', (req, res) => {
  try {
    const { terminalCode, newVersion, packageHash } = req.body;
    if (!terminalCode || !newVersion) {
      return res.status(400).json({ error: 'Código de terminal y nueva versión son requeridos.' });
    }
    const result = db.confirmTerminalUpdate({ terminalCode, newVersion, packageHash });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin / Admin: List all system updates & releases
app.get('/api/updates', authMiddleware, requireAdmin, (req, res) => {
  res.json(db.getSystemUpdates());
});

// Super Admin: Create a new release / version
app.post('/api/updates', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { version, title, releaseNotes, isMandatory, status, packageUrl, packageHash, minSupportedVersion } = req.body;
    if (!version || !title) {
      return res.status(400).json({ error: 'Número de versión y título son requeridos.' });
    }
    const update = db.createSystemUpdate(
      {
        version,
        title,
        releaseNotes: Array.isArray(releaseNotes) ? releaseNotes : [releaseNotes],
        isMandatory,
        status,
        packageUrl,
        packageHash,
        minSupportedVersion,
      },
      req.user?.name || 'Súper Administrador'
    );
    res.status(201).json(update);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin: Modify update
app.put('/api/updates/:id', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const updated = db.updateSystemUpdate(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin: Toggle publication status
app.post('/api/updates/:id/toggle-status', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const updated = db.toggleSystemUpdateStatus(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin: Delete update
app.delete('/api/updates/:id', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const success = db.deleteSystemUpdate(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin: View status of each terminal (installed version vs latest)
app.get('/api/updates/terminals-status', authMiddleware, requireAdmin, (req, res) => {
  res.json(db.getTerminalUpdateStatuses());
});

// Super Admin: Remotely trigger or simulate update for a terminal
app.post('/api/updates/terminals/:code/simulate-update', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const { newVersion } = req.body;
    const result = db.confirmTerminalUpdate({
      terminalCode: req.params.code,
      newVersion: newVersion || 'v1.1.0'
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Mock or serve official package bundles
app.get('/packages/:filename', (req, res) => {
  res.json({
    package: req.params.filename,
    verified: true,
    serverOrigin: 'BancaPro Official Update Server (Dominican Republic)',
    timestamp: new Date().toISOString(),
    status: 'AUTHORIZED',
    sizeBytes: 4500000,
    signature: 'RSA-SHA256:AUTHENTIC_OFFICIAL_RELEASE',
  });
});

// ----------------- SISTEMA DE RESPALDOS Y SEGURIDAD (BACKUPS) -----------------
app.get('/api/backups', authMiddleware, requireSuperAdmin, (req, res) => {
  res.json(db.getBackups());
});

app.post('/api/backups', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const { description } = req.body;
    const backup = db.createBackup(description, req.user?.name || 'Súper Administrador');
    res.status(201).json(backup);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/backups/:id/restore', authMiddleware, requireSuperAdmin, (req, res) => {
  try {
    const result = db.restoreBackup(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- USERS MANAGEMENT ROUTES ---
app.get('/api/users', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const consorcioId = req.user?.role === 'SUPER_ADMIN' ? (req.query.consorcioId as string) : req.user?.consorcioId;
    const users = db.getUsers(consorcioId);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const consorcioId = req.user?.role === 'SUPER_ADMIN' ? req.body.consorcioId : req.user?.consorcioId;
    const newUser = db.createUser({ ...req.body, consorcioId });
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    db.deleteUser(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado exitosamente.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/:id/status', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.toggleUserStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- DASHBOARD METRICS ROUTE ---
app.get('/api/dashboard/metrics', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    const consorcioId = req.user?.role === 'SUPER_ADMIN' ? (req.query.consorcioId as string) : req.user?.consorcioId;
    const metrics = db.getDashboardMetrics(consorcioId);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- VITE SETUP -----------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BancaPro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
