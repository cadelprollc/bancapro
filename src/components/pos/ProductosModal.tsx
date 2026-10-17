import React, { useState, useEffect } from 'react';
import { User, ProductoItem, ProductoTransaction } from '../../types';
import {
  Package,
  CheckCircle2,
  X,
  Printer,
  RotateCcw,
  Sparkles,
  Gamepad2,
  Tv,
  Zap,
  Ticket,
  Search,
  DollarSign,
  AlertCircle,
  Hash,
  Send,
  ArrowRight,
  ShieldCheck,
  Check,
  CreditCard,
} from 'lucide-react';
import { printerService } from '../../services/printerService';

export interface ProductosModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: (tx: ProductoTransaction) => void;
}

type ProductCategory = 'ALL' | 'RECARGAS_DEPORTIVAS' | 'PINES_DIGITALES' | 'SERVICIOS' | 'LOTERIA_ADICIONAL';

const PRODUCTS_CATALOG: ProductoItem[] = [
  // Recargas Deportivas
  {
    id: 'prod-betcris',
    name: 'Betcris Deportes',
    category: 'RECARGAS_DEPORTIVAS',
    icon: '⚽',
    description: 'Recarga de balance para cuenta Betcris',
    fixedAmounts: [100, 200, 500, 1000, 2000],
    allowsCustomAmount: true,
    minAmount: 50,
    maxAmount: 25000,
    provider: 'Betcris International',
  },
  {
    id: 'prod-betplay',
    name: 'Juégalo / Betplay',
    category: 'RECARGAS_DEPORTIVAS',
    icon: '🎲',
    description: 'Apuestas deportivas y casino online',
    fixedAmounts: [100, 300, 500, 1000],
    allowsCustomAmount: true,
    minAmount: 50,
    maxAmount: 20000,
    provider: 'Juégalo Gaming',
  },
  {
    id: 'prod-parley',
    name: 'Parley Dominicano',
    category: 'RECARGAS_DEPORTIVAS',
    icon: '⚾',
    description: 'Jugadas de béisbol MLB, LIDOM y baloncesto NBA',
    fixedAmounts: [50, 100, 200, 500],
    allowsCustomAmount: true,
    minAmount: 50,
    maxAmount: 15000,
    provider: 'Consorcio Parley',
  },

  // Pines Digitales & Gaming
  {
    id: 'prod-freefire',
    name: 'Free Fire Diamantes',
    category: 'PINES_DIGITALES',
    icon: '🔥',
    description: 'Pin digital de diamantes Garena Free Fire',
    fixedAmounts: [60, 150, 320, 650, 1300],
    allowsCustomAmount: false,
    minAmount: 60,
    maxAmount: 1300,
    provider: 'Garena Online',
  },
  {
    id: 'prod-netflix',
    name: 'Netflix Prepago',
    category: 'PINES_DIGITALES',
    icon: '🎬',
    description: 'Suscripción mensual para streaming Netflix',
    fixedAmounts: [500, 1000, 1500],
    allowsCustomAmount: false,
    minAmount: 500,
    maxAmount: 1500,
    provider: 'Netflix Inc.',
  },
  {
    id: 'prod-playstation',
    name: 'PlayStation Store',
    category: 'PINES_DIGITALES',
    icon: '🎮',
    description: 'Saldo PSN para compras de juegos de consola',
    fixedAmounts: [600, 1200, 2400],
    allowsCustomAmount: false,
    minAmount: 600,
    maxAmount: 2400,
    provider: 'Sony PlayStation',
  },
  {
    id: 'prod-spotify',
    name: 'Spotify Premium',
    category: 'PINES_DIGITALES',
    icon: '🎧',
    description: 'Pase de música digital sin anuncios',
    fixedAmounts: [350, 700],
    allowsCustomAmount: false,
    minAmount: 350,
    maxAmount: 700,
    provider: 'Spotify AB',
  },

  // Pago de Servicios
  {
    id: 'prod-edeeste',
    name: 'Edeeste / Edesur (Luz)',
    category: 'SERVICIOS',
    icon: '💡',
    description: 'Pago de factura o recarga prepago de energía eléctrica',
    fixedAmounts: [200, 500, 1000, 2000],
    allowsCustomAmount: true,
    minAmount: 100,
    maxAmount: 50000,
    provider: 'Distribuidoras Eléctricas',
  },
  {
    id: 'prod-caasd',
    name: 'CAASD / Coraasan (Agua)',
    category: 'SERVICIOS',
    icon: '💧',
    description: 'Pago de suministro de agua potable y alcantarillado',
    fixedAmounts: [200, 400, 800],
    allowsCustomAmount: true,
    minAmount: 50,
    maxAmount: 20000,
    provider: 'Corporación de Acueductos',
  },
  {
    id: 'prod-internet-hogar',
    name: 'Internet / Telefonía Hogar',
    category: 'SERVICIOS',
    icon: '🌐',
    description: 'Pago de mensualidad residencial Claro o Altice',
    fixedAmounts: [500, 1000, 1500, 2500],
    allowsCustomAmount: true,
    minAmount: 100,
    maxAmount: 30000,
    provider: 'Telecomunicaciones Residenciales',
  },

  // Lotería Adicional & Raspes
  {
    id: 'prod-raspe-millonario',
    name: 'Raspa & Gana Millonario',
    category: 'LOTERIA_ADICIONAL',
    icon: '🎫',
    description: 'Boleto instantáneo raspa y gana con premios al instante',
    fixedAmounts: [25, 50, 100],
    allowsCustomAmount: false,
    minAmount: 25,
    maxAmount: 100,
    provider: 'Lotería Nacional / Raspes',
  },
];

export const ProductosModal: React.FC<ProductosModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductoItem | null>(null);
  const [customerRef, setCustomerRef] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [customAmountStr, setCustomAmountStr] = useState<string>('100');

  const [processing, setProcessing] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<ProductoTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(null);
      setCustomerRef('');
      setAmount(100);
      setCustomAmountStr('100');
      setCompletedTx(null);
      setErrorMessage(null);
      setPrintStatus(null);
      setProcessing(false);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter products by search and category
  const filteredProducts = PRODUCTS_CATALOG.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelectProduct = (prod: ProductoItem) => {
    setSelectedProduct(prod);
    const initialAmt = prod.fixedAmounts?.[0] || prod.minAmount || 100;
    setAmount(initialAmt);
    setCustomAmountStr(initialAmt.toString());
    setCustomerRef('');
    setErrorMessage(null);
  };

  const handleSelectAmount = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmountStr(val);
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    } else {
      setAmount(0);
    }
  };

  // Submit and process product sale
  const handleProcessSale = async () => {
    if (!selectedProduct) return;
    setErrorMessage(null);

    if (!customerRef.trim() && selectedProduct.category !== 'LOTERIA_ADICIONAL') {
      setErrorMessage('Por favor ingrese el número de cuenta, cédula o teléfono del cliente.');
      return;
    }

    if (amount < (selectedProduct.minAmount || 25)) {
      setErrorMessage(`El monto mínimo para este producto es de RD$ ${selectedProduct.minAmount || 25}.`);
      return;
    }

    setProcessing(true);

    try {
      await new Promise((res) => setTimeout(res, 900));

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const authCode = `AUT-${Math.floor(100000 + Math.random() * 900000)}`;
      const txNumber = `PRD-${Date.now().toString().slice(-8)}`;

      // Generate realistic digital PIN for gaming / streaming products
      const isPinProduct = selectedProduct.category === 'PINES_DIGITALES';
      const pinCode = isPinProduct
        ? `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        : undefined;

      const newTx: ProductoTransaction = {
        id: `prod-tx-${Date.now()}`,
        transactionNumber: txNumber,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        customerReference: customerRef || 'Venta de Mostrador',
        amount,
        terminalCode,
        cashierName: user.name || user.username || 'Cajero',
        date: dateStr,
        time: timeStr,
        pinCode,
        status: 'COMPLETADO',
        authCode,
      };

      setCompletedTx(newTx);
      onSuccess?.(newTx);

      // Play success chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(659.25, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
        }
      } catch {}

      // Thermal voucher print
      handlePrintVoucher(newTx);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error procesando la venta del producto.');
    } finally {
      setProcessing(false);
    }
  };

  // Thermal voucher print
  const handlePrintVoucher = async (tx: ProductoTransaction) => {
    try {
      const pConfig = await printerService.getConfig(terminalCode);
      const is80 = pConfig.paperWidth === '80mm';
      const cols = is80 ? 48 : 32;

      const padRow = (left: string, right: string) => {
        const space = cols - left.length - right.length;
        return left + ' '.repeat(Math.max(1, space)) + right;
      };
      const center = (text: string) => {
        const space = Math.max(0, Math.floor((cols - text.length) / 2));
        return ' '.repeat(space) + text;
      };
      const sep = '='.repeat(cols);
      const line = '-'.repeat(cols);

      const lines = [
        sep,
        center('COMPROBANTE DE PRODUCTOS'),
        center('BANCA LA EXPRESS · DOMINICANA'),
        sep,
        padRow('TERMINAL:', `#${tx.terminalCode}`),
        padRow('CAJERO:', tx.cashierName),
        padRow('FECHA:', tx.date),
        padRow('HORA:', tx.time),
        line,
        center(`PRODUCTO: ${tx.productName}`),
        center(`REFERENCIA / CUENTA: ${tx.customerReference}`),
        line,
        ...(tx.pinCode
          ? [
              center('*** PIN DIGITAL DE ACTIVACIÓN ***'),
              center(`PIN: ${tx.pinCode}`),
              center('INGRESE ESTE CÓDIGO EN LA PLATAFORMA'),
              line,
            ]
          : []),
        padRow('TOTAL PAGADO:', `RD$ ${tx.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        sep,
        center(`AUTORIZACIÓN: ${tx.authCode}`),
        center(`TRANSACCIÓN: ${tx.transactionNumber}`),
        line,
        center('¡GRACIAS POR SU COMPRA!'),
        center('NO TIENE DEVOLUCIÓN TRAS APLICARSE'),
        sep,
        '',
      ];

      printerService.triggerHardwarePrint(lines.join('\n'), `Producto_${tx.transactionNumber}`, pConfig.paperWidth, pConfig.printDensity);
      setPrintStatus('🖨️ Comprobante térmico impreso.');
      setTimeout(() => setPrintStatus(null), 3500);
    } catch {
      setPrintStatus('⚠️ Aviso: Comprobante generado en pantalla.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col my-auto transition-all">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Productos & Servicios
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Catálogo
                </span>
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Pines · Deportes · Pago de Facturas · Raspes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {completedTx ? (
            /* Pantalla de Éxito y Ticket */
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                  ¡Producto Vendido con Éxito!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  {completedTx.productName} procesado en la terminal #{completedTx.terminalCode}.
                </p>
              </div>

              {/* Si es PIN digital, banner destacado */}
              {completedTx.pinCode && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-center space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    PIN Digital Generado:
                  </span>
                  <div className="font-mono text-xl font-black text-slate-900 dark:text-white tracking-widest select-all">
                    {completedTx.pinCode}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Entregue este código al cliente para canjear en la plataforma
                  </span>
                </div>
              )}

              {/* Ficha Resumen */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Producto:</span>
                  <span className="font-black text-slate-900 dark:text-white">{completedTx.productName}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Cuenta / Referencia:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{completedTx.customerReference}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Monto Pagado:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    RD$ {completedTx.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Código Autorización:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{completedTx.authCode}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Transacción:</span>
                  <span className="font-mono text-slate-500">{completedTx.transactionNumber}</span>
                </div>
              </div>

              {printStatus && (
                <p className="text-xs text-center font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                  {printStatus}
                </p>
              )}

              {/* Acciones Finales */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrintVoucher(completedTx)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-500" />
                  <span>Reimprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompletedTx(null);
                    setSelectedProduct(null);
                    setCustomerRef('');
                  }}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Otro Producto</span>
                </button>
              </div>
            </div>
          ) : selectedProduct ? (
            /* Paso 2: Configurar monto y referencia del producto seleccionado */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedProduct.icon}</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedProduct.description} · <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedProduct.provider}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Cambiar
                </button>
              </div>

              {/* Referencia / Identificador */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {selectedProduct.category === 'RECARGAS_DEPORTIVAS'
                    ? 'ID de Cuenta / Usuario del Jugador:'
                    : selectedProduct.category === 'SERVICIOS'
                    ? 'No. de Contrato / Factura / Cédula:'
                    : selectedProduct.category === 'PINES_DIGITALES'
                    ? 'Celular del Cliente para Entrega / ID:'
                    : 'Referencia de Venta:'}
                </label>
                <input
                  type="text"
                  value={customerRef}
                  onChange={(e) => setCustomerRef(e.target.value)}
                  placeholder="Ingrese el identificador o número"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm font-bold outline-none focus:border-emerald-500"
                />
              </div>

              {/* Selección de Monto */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Seleccione el Monto en RD$
                </label>

                {selectedProduct.fixedAmounts && selectedProduct.fixedAmounts.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {selectedProduct.fixedAmounts.map((fa) => (
                      <button
                        key={fa}
                        type="button"
                        onClick={() => handleSelectAmount(fa)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          amount === fa && customAmountStr === fa.toString()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        RD${fa}
                      </button>
                    ))}
                  </div>
                )}

                {selectedProduct.allowsCustomAmount && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Monto Personalizado:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">RD$</span>
                      <input
                        type="number"
                        value={customAmountStr}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Monto"
                        min={selectedProduct.minAmount || 50}
                        max={selectedProduct.maxAmount || 50000}
                        className="w-full pl-11 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm font-black outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Volver al Catálogo
                </button>

                <button
                  type="button"
                  onClick={handleProcessSale}
                  disabled={processing || amount <= 0}
                  className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Cobrar RD$ {amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Paso 1: Catálogo de Productos y Filtros */
            <>
              {/* Buscador y Filtros por Categoría */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar producto, pin, deporte o servicio..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categorías Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                  {(
                    [
                      { id: 'ALL', label: 'Todos' },
                      { id: 'RECARGAS_DEPORTIVAS', label: '⚽ Deportes' },
                      { id: 'PINES_DIGITALES', label: '🎮 Pines' },
                      { id: 'SERVICIOS', label: '💡 Facturas' },
                      { id: 'LOTERIA_ADICIONAL', label: '🎫 Raspes' },
                    ] as const
                  ).map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid del Catálogo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                        {prod.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <span>Vender</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
