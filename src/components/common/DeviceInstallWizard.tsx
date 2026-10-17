import React, { useState } from 'react';
import { api } from '../../services/api';
import { Building2, Smartphone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react';

interface DeviceInstallWizardProps {
  onInstallComplete: (consorcioCode: string, deviceId: string) => void;
  onBypassAdmin?: () => void;
}

export const DeviceInstallWizard: React.FC<DeviceInstallWizardProps> = ({ onInstallComplete, onBypassAdmin }) => {
  const [consorcioCode, setConsorcioCode] = useState('1230');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step state: 1 = Enter Code, 2 = Registered Device (Pending assignment)
  const [step, setStep] = useState<1 | 2>(1);
  const [registeredData, setRegisteredData] = useState<{
    consorcioName: string;
    consorcioCode: string;
    deviceId: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleValidateAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = consorcioCode.trim();
    if (!cleanCode) {
      setError('Por favor introduzca el código de su consorcio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 2: Validate code with backend
      const res = await api.validateConsorcioCode(cleanCode);
      if (!res.valid) {
        throw new Error('Código de consorcio no válido.');
      }

      // Step 3: Generate unique device ID for this physical device / browser
      // E.g. "123D" + random 6 digits, or clean code + "D" + random suffix
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const generatedDeviceId = `${cleanCode.slice(0, 3)}D${randomSuffix}`;

      // Register device in backend
      await api.registerDevice({
        consorcioCode: cleanCode,
        deviceId: generatedDeviceId,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Terminal Móvil Android/iOS' : 'Terminal Mostrador PC',
      });

      // Save to localStorage
      localStorage.setItem('bancapro_device_consorcio', cleanCode);
      localStorage.setItem('bancapro_device_consorcio_name', res.consorcio.name);
      localStorage.setItem('bancapro_device_id', generatedDeviceId);

      setRegisteredData({
        consorcioName: res.consorcio.name,
        consorcioCode: cleanCode,
        deviceId: generatedDeviceId,
      });

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Código de consorcio no encontrado o inactivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (registeredData?.deviceId) {
      navigator.clipboard.writeText(registeredData.deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinishToLogin = () => {
    if (registeredData) {
      onInstallComplete(registeredData.consorcioCode, registeredData.deviceId);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-2xl shadow-md border border-neutral-800">
            📱
          </div>
        </div>
        <h2 className="text-center text-2xl font-black tracking-tight text-neutral-900 uppercase">
          CONFIGURACIÓN INICIAL
        </h2>
        <p className="mt-1 text-center text-xs text-neutral-500">
          Instalación y vinculación segura de dispositivo para venta de lotería
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-neutral-200 sm:rounded-3xl space-y-6">
          {step === 1 && (
            <form onSubmit={handleValidateAndRegister} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                  Paso 1 de 2: Identificar Consorcio
                </span>
                <p className="text-xs text-neutral-500">
                  Introduzca el código único otorgado para su consorcio de bancas.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1 text-center">
                  CÓDIGO DEL CONSORCIO
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    required
                    value={consorcioCode}
                    onChange={(e) => setConsorcioCode(e.target.value.trim())}
                    placeholder="Ej: 1230"
                    className="w-full text-center tracking-widest text-2xl font-black py-3 px-4 rounded-2xl border-2 border-neutral-300 focus:outline-none focus:border-neutral-900 font-mono text-neutral-900 shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 text-center mt-1.5">
                  Ejemplo de prueba predeterminado: <strong>1230</strong> (Consorcio Salomón)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Validando con el servidor...</span>
                ) : (
                  <>
                    <span>CONTINUAR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && registeredData && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-neutral-900 uppercase">
                  Dispositivo Registrado con Éxito
                </h3>
                <p className="text-xs text-neutral-500">
                  Consorcio identificado: <strong className="text-neutral-900">{registeredData.consorcioName}</strong>
                </p>
              </div>

              {/* Device ID Display Card (Requirement 11 & 15) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    ID ÚNICO DEL DISPOSITIVO
                  </div>
                  <div className="text-2xl font-mono font-black text-neutral-950 mt-1 tracking-wider selection:bg-amber-300">
                    {registeredData.deviceId}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-700 transition-colors shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¡ID Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar ID</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-neutral-200/80 pt-3 text-[11px] text-neutral-600 space-y-1">
                  <div className="font-bold text-amber-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Estado: Pendiente de asignación a una terminal</span>
                  </div>
                  <p className="text-neutral-500 leading-relaxed">
                    El administrador del consorcio debe ingresar a{' '}
                    <strong>TERMINALES → EDITAR TERMINAL</strong> (ej: Terminal 0001) y colocar este ID de dispositivo en el campo{' '}
                    <strong>"ID DEL DISPOSITIVO"</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleFinishToLogin}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Ir al Inicio de Sesión (Login)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Administrative / Super Admin Bypass */}
          {onBypassAdmin && (
            <div className="pt-4 border-t border-neutral-100 text-center">
              <button
                type="button"
                onClick={onBypassAdmin}
                className="text-xs text-neutral-400 hover:text-neutral-700 font-medium transition-colors"
              >
                ¿Acceso Administrativo o Súper Admin? Ingresar directamente aquí
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
