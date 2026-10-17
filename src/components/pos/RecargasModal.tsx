import React, { useState, useEffect } from 'react';
import { User, RecargaTransaction } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  X,
  Printer,
  RotateCcw,
  Sparkles,
  Wifi,
  DollarSign,
  AlertCircle,
  Hash,
  Send,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { printerService } from '../../services/printerService';

export interface RecargasModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: (recarga: RecargaTransaction) => void;
}

type Operator = 'CLARO' | 'ALTICE' | 'VIVA';
type RecargaType = 'SALDO' | 'PAQUETICO';

interface PackageOption {
  id: string;
  name: string;
  duration: string;
  data: string;
  price: number;
}

const PACKAGES_BY_OPERATOR: Record<Operator, PackageOption[]> = {
  CLARO: [
    { id: 'c-1', name: 'Superpack 1 Día', duration: '24 Horas', data: 'Internet Ilimitado', price: 50 },
    { id: 'c-2', name: 'Superpack 3 Días', duration: '3 Días', data: '3 GB + Redes Libres', price: 100 },
    { id: 'c-3', name: 'Superpack 5 Días', duration: '5 Días', data: '5 GB + Llamadas Ilim.', price: 150 },
    { id: 'c-4', name: 'Superpack 7 Días', duration: '7 Días', data: 'Internet Ilimitado + Minutos', price: 200 },
    { id: 'c-5', name: 'Superpack 15 Días', duration: '15 Días', data: '12 GB de Alta Velocidad', price: 300 },
  ],
  ALTICE: [
    { id: 'a-1', name: 'Paquetico Libre 1D', duration: '1 Día', data: 'Internet Libre + WhatsApp', price: 50 },
    { id: 'a-2', name: 'Paquetico Libre 3D', duration: '3 Días', data: '3.5 GB + Noches Libres', price: 100 },
    { id: 'a-3', name: 'Paquetico 5 Días', duration: '5 Días', data: '6 GB + Redes Sociales', price: 150 },
    { id: 'a-4', name: 'Paquetico 7 Días', duration: '7 Días', data: 'Internet Ilimitado', price: 200 },
    { id: 'a-5', name: 'Paquetico 10 Días', duration: '10 Días', data: '12 GB + Minutos Altice', price: 250 },
  ],
  VIVA: [
    { id: 'v-1', name: 'Bolsa 1 Día', duration: '24 Horas', data: 'Internet Ilimitado', price: 40 },
    { id: 'v-2', name: 'Bolsa 3 Días', duration: '3 Días', data: '3 GB Todo Uso', price: 80 },
    { id: 'v-3', name: 'Bolsa 5 Días', duration: '5 Días', data: '5 GB de Alta Velocidad', price: 120 },
    { id: 'v-4', name: 'Bolsa 7 Días', duration: '7 Días', data: '8 GB + Minutos Viva', price: 180 },
  ],
};

const QUICK_AMOUNTS = [50, 100, 150, 200, 300, 500];

export const RecargasModal: React.FC<RecargasModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');

  const [operator, setOperator] = useState<Operator>('CLARO');
  const [rechargeType, setRechargeType] = useState<RecargaType>('SALDO');
  const [rawPhone, setRawPhone] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [customAmountStr, setCustomAmountStr] = useState<string>('100');
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);

  const [processing, setProcessing] = useState<boolean>(false);
  const [completedRecarga, setCompletedRecarga] = useState<RecargaTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  // Focus and reset on open
  useEffect(() => {
    if (isOpen) {
      setRawPhone('');
      setAmount(100);
      setCustomAmountStr('100');
      setSelectedPackage(null);
      setCompletedRecarga(null);
      setErrorMessage(null);
      setPrintStatus(null);
      setProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format phone number as (809) 000-0000
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setRawPhone(digits);
    if (errorMessage) setErrorMessage(null);
  };

  const formattedPhone = (() => {
    if (!rawPhone) return '';
    if (rawPhone.length <= 3) return rawPhone;
    if (rawPhone.length <= 6) return `(${rawPhone.slice(0, 3)}) ${rawPhone.slice(3)}`;
    return `(${rawPhone.slice(0, 3)}) ${rawPhone.slice(3, 6)}-${rawPhone.slice(6, 10)}`;
  })();

  const handleSelectQuickAmount = (val: number) => {
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

  const handleSelectPackage = (pkg: PackageOption) => {
    setSelectedPackage(pkg);
    setAmount(pkg.price);
    setCustomAmountStr(pkg.price.toString());
  };

  // Submit and process recharge
  const handleProcessRecarga = async () => {
    setErrorMessage(null);

    // Validations
    if (rawPhone.length < 10) {
      setErrorMessage('Por favor ingrese un número de teléfono válido de 10 dígitos (ej. 809-555-1234).');
      return;
    }

    const validPrefixes = ['809', '829', '849'];
    const prefix = rawPhone.slice(0, 3);
    if (!validPrefixes.includes(prefix)) {
      setErrorMessage('El número debe comenzar con un código dominicano válido (809, 829 o 849).');
      return;
    }

    if (amount < 20) {
      setErrorMessage('El monto mínimo para recargas es de RD$ 20.00.');
      return;
    }

    if (rechargeType === 'PAQUETICO' && !selectedPackage) {
      setErrorMessage('Por favor seleccione un paquete de internet de la lista.');
      return;
    }

    setProcessing(true);

    try {
      // Simulate real-time carrier telecom API response
      await new Promise((res) => setTimeout(res, 850));

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const authCode = `AUT-${Math.floor(100000 + Math.random() * 900000)}`;
      const txNumber = `REC-${Date.now().toString().slice(-8)}`;

      const newRecarga: RecargaTransaction = {
        id: `rec-${Date.now()}`,
        transactionNumber: txNumber,
        operator,
        phoneNumber: formattedPhone,
        type: rechargeType,
        packageName: rechargeType === 'PAQUETICO' && selectedPackage ? selectedPackage.name : undefined,
        amount,
        terminalCode,
        cashierName: user.name || user.username || 'Cajero',
        date: dateStr,
        time: timeStr,
        status: 'COMPLETADO',
        authCode,
      };

      setCompletedRecarga(newRecarga);
      onSuccess?.(newRecarga);

      // Play success audio chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch {}

      // Auto print thermal voucher
      handlePrintVoucher(newRecarga);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error procesando la recarga con la operadora.');
    } finally {
      setProcessing(false);
    }
  };

  // Thermal voucher print formatting
  const handlePrintVoucher = async (rec: RecargaTransaction) => {
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
        center('COMPROBANTE DE RECARGA'),
        center('BANCA LA EXPRESS · DOMINICANA'),
        sep,
        padRow('TERMINAL:', `#${rec.terminalCode}`),
        padRow('CAJERO:', rec.cashierName),
        padRow('FECHA:', rec.date),
        padRow('HORA:', rec.time),
        line,
        center(`OPERADORA: ${rec.operator}`),
        center(`NÚMERO: ${rec.phoneNumber}`),
        rec.packageName ? center(`PAQUETE: ${rec.packageName}`) : center('TIPO: RECARGA DE SALDO'),
        line,
        padRow('MONTO RECARGADO:', `RD$ ${rec.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        padRow('TOTAL PAGADO:', `RD$ ${rec.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`),
        sep,
        center(`AUTORIZACIÓN: ${rec.authCode}`),
        center(`TRANSACCIÓN: ${rec.transactionNumber}`),
        line,
        center('¡RECARGA APLICADA EXITOSAMENTE!'),
        center('CONSERVE ESTE COMPROBANTE'),
        sep,
        '',
      ];

      printerService.triggerHardwarePrint(lines.join('\n'), `Recarga_${rec.transactionNumber}`, pConfig.paperWidth, pConfig.printDensity);
      setPrintStatus('🖨️ Comprobante impreso exitosamente.');
      setTimeout(() => setPrintStatus(null), 3500);
    } catch {
      setPrintStatus('⚠️ Aviso: Comprobante generado en pantalla.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto transition-all">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Recargas Electrónicas
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  RD
                </span>
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Claro · Altice · Viva · Saldo & Paqueticos
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
          {completedRecarga ? (
            /* Pantalla de Éxito y Comprobante Oficial */
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                  ¡Recarga Completada!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  La transacción fue autorizada por {completedRecarga.operator} en tiempo real.
                </p>
              </div>

              {/* Ficha Resumen */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Operadora:</span>
                  <span className="font-black text-slate-900 dark:text-white uppercase">{completedRecarga.operator}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Número:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{completedRecarga.phoneNumber}</span>
                </div>
                {completedRecarga.packageName && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Paquete:</span>
                    <span className="font-bold text-blue-600 dark:text-cyan-400">{completedRecarga.packageName}</span>
                  </div>
                )}
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Monto Pagado:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    RD$ {completedRecarga.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Código Autorización:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{completedRecarga.authCode}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Transacción:</span>
                  <span className="font-mono text-slate-500">{completedRecarga.transactionNumber}</span>
                </div>
              </div>

              {printStatus && (
                <p className="text-xs text-center font-semibold text-cyan-600 dark:text-cyan-400 animate-pulse">
                  {printStatus}
                </p>
              )}

              {/* Acciones Finales */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrintVoucher(completedRecarga)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-cyan-500" />
                  <span>Reimprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompletedRecarga(null);
                    setRawPhone('');
                    setSelectedPackage(null);
                  }}
                  className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nueva Recarga</span>
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Captura de Recarga */
            <>
              {/* 1. Selección de Operadora */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  1. Seleccione Operadora
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['CLARO', 'ALTICE', 'VIVA'] as const).map((op) => {
                    const isSelected = operator === op;
                    const opColor =
                      op === 'CLARO'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        : op === 'ALTICE'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400'
                        : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';

                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          setOperator(op);
                          setSelectedPackage(null);
                        }}
                        className={`p-3 rounded-2xl border-2 font-black text-sm flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? `${opColor} shadow-sm ring-2 ring-blue-500/20`
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">
                          {op === 'CLARO' ? '🔴' : op === 'ALTICE' ? '🔵' : '🟢'}
                        </span>
                        <span>{op}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Número de Teléfono */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    2. Número Celular
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Prefijos: 809, 829, 849
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    value={formattedPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(809) 000-0000"
                    maxLength={14}
                    className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-white font-mono text-lg font-black tracking-wider outline-none transition-all"
                  />
                  {rawPhone.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRawPhone('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Tipo: Saldo vs Paquetico */}
              <div>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRechargeType('SALDO');
                      setSelectedPackage(null);
                    }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      rechargeType === 'SALDO'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Recarga de Saldo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRechargeType('PAQUETICO');
                      if (!selectedPackage) {
                        const defaultPkg = PACKAGES_BY_OPERATOR[operator][0];
                        setSelectedPackage(defaultPkg);
                        setAmount(defaultPkg.price);
                        setCustomAmountStr(defaultPkg.price.toString());
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      rechargeType === 'PAQUETICO'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Paquetico de Internet</span>
                  </button>
                </div>

                {/* Sub-opción: Saldo Montos Rápidos */}
                {rechargeType === 'SALDO' ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {QUICK_AMOUNTS.map((qa) => (
                        <button
                          key={qa}
                          type="button"
                          onClick={() => handleSelectQuickAmount(qa)}
                          className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            amount === qa && customAmountStr === qa.toString()
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          RD${qa}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Monto Libre:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">RD$</span>
                        <input
                          type="number"
                          value={customAmountStr}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          placeholder="Monto"
                          min={20}
                          max={10000}
                          className="w-full pl-11 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm font-black outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Sub-opción: Paqueticos por Operador */
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {PACKAGES_BY_OPERATOR[operator].map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {pkg.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {pkg.data} · <span className="font-semibold text-blue-600 dark:text-cyan-400">{pkg.duration}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                              RD$ {pkg.price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mensaje de Error si aplica */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botón Principal de Procesar Recarga */}
              <button
                type="button"
                onClick={handleProcessRecarga}
                disabled={processing || rawPhone.length < 10 || amount <= 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con {operator}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Procesar Recarga (RD$ {amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })})</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
