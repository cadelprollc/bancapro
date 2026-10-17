import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Invoice, User } from '../../types/index';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  DollarSign,
  Monitor,
  Printer,
  X,
  Search,
  Calendar,
  ShieldCheck,
  CreditCard,
  Plus
} from 'lucide-react';

interface InvoicesViewProps {
  user: User;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ user }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAGADA' | 'PENDIENTE' | 'VENCIDA'>('ALL');
  const [payingId, setPayingId] = useState<string | null>(null);

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices(isSuperAdmin ? 'ALL' : user.consorcioId);
      setInvoices(data);
    } catch (err) {
      console.error('Error cargando facturas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user.consorcioId, user.role]);

  const handleOpenPdf = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPdfModal(true);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadInvoiceFile = (inv: Invoice) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${inv.invoiceNumber} - ${inv.consorcioName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
    .badge { display: inline-block; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: bold; }
    .client-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 11px; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .total-box { margin-top: 30px; text-align: right; }
    .total-amount { font-size: 26px; font-weight: 900; color: #047857; font-family: monospace; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">BANCAPRO DOMINICANA</h1>
      <p style="margin:4px 0; font-size:12px; color:#64748b;">Sistema de Gestión y Control Multi-Consorcio</p>
      <p style="margin:2px 0; font-size:11px; color:#94a3b8;">RNC: 1-30-84920-1 · Rep. Dominicana</p>
    </div>
    <div style="text-align:right;">
      <div class="badge">FACTURA #${inv.invoiceNumber}</div>
      <p style="margin:6px 0; font-size:12px;">Emisión: <strong>${inv.issueDate}</strong></p>
      <p style="margin:2px 0; font-size:12px;">Vence: <strong>${inv.dueDate}</strong></p>
      <p style="margin:4px 0; font-weight:bold; color:${inv.status === 'PAGADA' ? '#059669' : '#d97706'};">ESTADO: ${inv.status}</p>
    </div>
  </div>

  <div class="client-card">
    <div>
      <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:bold;">Facturado a:</div>
      <div style="font-size:18px; font-weight:bold; color:#0f172a; margin-top:4px;">${inv.consorcioName}</div>
      <div style="font-size:12px; color:#64748b; font-family:monospace; margin-top:2px;">Código Consorcio: #${inv.consorcioCode}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:bold;">Período Facturado:</div>
      <div style="font-size:18px; font-weight:bold; color:#4338ca; margin-top:4px;">${inv.month}</div>
      <div style="font-size:12px; color:#64748b; margin-top:2px;">Terminales: <strong>${inv.terminalsCount} autorizadas/activas</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Terminal</th>
        <th>Concepto</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">Costo Unitario</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${inv.terminalsDetail.map(t => `
        <tr>
          <td style="font-family:monospace; font-weight:bold;">Terminal ${t.terminalCode}</td>
          <td>Licencia y mantenimiento mensual de terminal (${t.terminalName})</td>
          <td style="text-align:center;">1</td>
          <td style="text-align:right; font-family:monospace;">RD$${t.cost.toLocaleString()}</td>
          <td style="text-align:right; font-family:monospace; font-weight:bold;">RD$${t.cost.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div style="font-size:12px; color:#64748b;">Total Facturado (${inv.terminalsCount} terminales × RD$${inv.costPerTerminal}):</div>
    <div class="total-amount">RD$${inv.totalAmount.toLocaleString()}</div>
  </div>

  <div class="footer">
    BancaPro Dominicana · Documento oficial emitido conforme a las terminales activas del consorcio.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factura-${inv.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePayInvoice = async (invoiceId: string) => {
    if (!confirm('¿Confirma que desea marcar esta factura como PAGADA?')) return;
    setPayingId(invoiceId);
    try {
      await api.payInvoice(invoiceId);
      await fetchInvoices();
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'PAGADA', paidAt: new Date().toISOString() } : null));
      }
    } catch (err: any) {
      alert('Error registrando pago: ' + err.message);
    } finally {
      setPayingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.consorcioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.consorcioCode.includes(searchTerm) ||
      inv.month.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    return true;
  });

  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'PAGADA').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPending = invoices.filter((i) => i.status === 'PENDIENTE').reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight uppercase flex items-center gap-2">
              <span>FACTURAS MENSUALES</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                {isSuperAdmin ? 'Global Multi-Consorcio' : `Consorcio ${user.consorcioId || ''}`}
              </span>
            </h1>
            <p className="text-xs text-neutral-500">
              Liquidación y cobro mensual automatizado según cantidad de terminales autorizadas y activas.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total Facturado
            </span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2 font-mono">
            RD${totalBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {invoices.length} facturas emitidas
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Cobrado / Pagado
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            RD${totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {invoices.filter((i) => i.status === 'PAGADA').length} facturas al día
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Saldo Pendiente
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
            RD${totalPending.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {invoices.filter((i) => i.status === 'PENDIENTE').length} facturas por pagar
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por # factura, mes, consorcio..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'PENDIENTE', 'PAGADA', 'VENCIDA'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-black tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Factura #</th>
                <th className="py-3 px-4">Consorcio</th>
                <th className="py-3 px-4">Período / Mes</th>
                <th className="py-3 px-4 text-center">Terminales</th>
                <th className="py-3 px-4 text-right">Precio Unitario</th>
                <th className="py-3 px-4 text-right">Total Factura</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Emisión</th>
                <th className="py-3 px-4 text-center">Acciones PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400">
                    No se encontraron facturas registradas.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{inv.consorcioName}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Cód: {inv.consorcioCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-700">
                      {inv.month}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-bold font-mono">
                        <Monitor className="w-3 h-3 text-neutral-500" />
                        {inv.terminalsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-600">
                      RD${inv.costPerTerminal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-neutral-900">
                      RD${inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          inv.status === 'PAGADA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inv.status === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {inv.status === 'PAGADA' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {inv.status === 'PENDIENTE' && <Clock className="w-3 h-3 text-amber-600" />}
                        {inv.status === 'VENCIDA' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{inv.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                      {inv.issueDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPdf(inv)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center gap-1 text-[11px] transition-colors"
                          title="Ver PDF detallado de la factura"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>VER PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            handleDownloadInvoiceFile(inv);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 text-[11px] transition-colors"
                          title="Descargar archivo de la factura"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>DESCARGAR PDF</span>
                        </button>
                        {isSuperAdmin && inv.status !== 'PAGADA' && (
                          <button
                            type="button"
                            onClick={() => handlePayInvoice(inv.id)}
                            disabled={payingId === inv.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px] transition-colors"
                            title="Marcar factura como Pagada"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          PROFESSIONAL PDF / INVOICE MODAL (Requirement 8)
          ======================================================== */}
      {showPdfModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-neutral-200 overflow-hidden print:max-w-none print:rounded-none print:shadow-none print:border-none">
            {/* Modal Controls (Hidden when printed) */}
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-sm uppercase tracking-wide">
                  Factura #{selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectedInvoice && handleDownloadInvoiceFile(selectedInvoice)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-neutral-700"
                  title="Descargar archivo digital para imprimir o archivar"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Descargar Archivo</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Invoice Sheet */}
            <div className="p-8 sm:p-10 space-y-6 text-neutral-900 bg-white">
              {/* Top Invoice Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 gap-4 border-neutral-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl">
                      B
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-neutral-950 uppercase">
                        BancaPro Dominicana
                      </h2>
                      <p className="text-[11px] text-neutral-500">
                        Plataforma de Control & Facturación Multi-Consorcio
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 pt-1">
                    RNC: 1-30-84920-1 · Santo Domingo, D.N., Rep. Dominicana
                  </p>
                </div>

                <div className="text-right sm:text-right space-y-1">
                  <div className="inline-block px-3 py-1 rounded-lg font-mono font-black text-sm bg-neutral-100 text-neutral-900 border border-neutral-200">
                    FACTURA #{selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Fecha de Emisión: <strong>{selectedInvoice.issueDate}</strong>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Vencimiento: <strong>{selectedInvoice.dueDate}</strong>
                  </div>
                  <div className="pt-1">
                    <span
                      className={`inline-block px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        selectedInvoice.status === 'PAGADA'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      ESTADO: {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Consortium Card */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Facturado a:
                  </div>
                  <div className="text-base font-black text-neutral-900 mt-0.5 uppercase">
                    {selectedInvoice.consorcioName}
                  </div>
                  <div className="text-xs text-neutral-600 font-mono">
                    Código de Consorcio: <strong>{selectedInvoice.consorcioCode}</strong>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Período Facturado:
                  </div>
                  <div className="text-base font-black text-indigo-700 mt-0.5">
                    {selectedInvoice.month}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Terminales Facturadas: <strong>{selectedInvoice.terminalsCount} terminales activas</strong>
                  </div>
                </div>
              </div>

              {/* Terminals Breakdown Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 font-black text-neutral-700 uppercase tracking-wider text-[11px] border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-4">Terminal</th>
                      <th className="py-2.5 px-4">Descripción</th>
                      <th className="py-2.5 px-4 text-center">Cantidad</th>
                      <th className="py-2.5 px-4 text-right">Costo Unitario</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedInvoice.terminalsDetail.map((t, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="py-2 px-4 font-mono font-bold text-neutral-900">
                          Terminal {t.terminalCode}
                        </td>
                        <td className="py-2 px-4 text-neutral-600">
                          Licencia y servicio mensual terminal de venta ({t.terminalName})
                        </td>
                        <td className="py-2 px-4 text-center font-mono">1</td>
                        <td className="py-2 px-4 text-right font-mono text-neutral-700">
                          RD${t.cost.toLocaleString()}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-neutral-900">
                          RD${t.cost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4">
                <div className="text-xs text-neutral-500 max-w-sm space-y-1">
                  <p>
                    * Facturación mensual recurrente por terminal autorizada y activa en el sistema.
                  </p>
                  <p>
                    Para depósitos o transferencias bancarias, favor indicar el número de factura en la referencia.
                  </p>
                </div>

                <div className="w-full sm:w-64 p-4 bg-neutral-900 text-white rounded-2xl space-y-2 text-right">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">RD${selectedInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Impuestos (0%):</span>
                    <span className="font-mono text-white">RD$0</span>
                  </div>
                  <div className="border-t border-neutral-700 pt-2 flex justify-between items-center text-sm font-black">
                    <span className="uppercase text-amber-400">Total a Pagar:</span>
                    <span className="text-xl font-mono text-emerald-400 font-extrabold">
                      RD${selectedInvoice.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Note & Security Seal */}
              <div className="border-t border-neutral-200 pt-4 flex items-center justify-between text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Documento Fiscal Electrónico Autorizado · BancaPro Multi-Consorcio</span>
                </div>
                <div>Página 1 de 1</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
