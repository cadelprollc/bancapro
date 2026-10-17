import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  getOrCreateDeviceId,
  detectDeviceType,
  detectDeviceInfo,
  setStoredActivationCode,
  setStoredDeviceToken,
} from '../../utils/deviceFingerprint';
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Lock,
  Monitor,
  Tablet,
  AlertTriangle,
  Building2,
  LogIn,
} from 'lucide-react';
import { DeviceStatus, Consorcio } from '../../types/index';

interface DeviceActivationScreenProps {
  onActivated: (consorcioCode: string, deviceId: string) => void;
  onBypassAdmin?: () => void;
  initialConsorcioCode?: string;
}

export const DeviceActivationScreen: React.FC<DeviceActivationScreenProps> = ({
  onActivated,
  onBypassAdmin,
  initialConsorcioCode = '1230',
}) => {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [deviceType] = useState(() => detectDeviceType());
  const [deviceInfo] = useState(() => detectDeviceInfo());

  const [consorcioCode, setConsorcioCode] = useState<string>(
    () => localStorage.getItem('bancapro_device_consorcio') || initialConsorcioCode
  );
  const [consorcio, setConsorcio] = useState<Consorcio | null>(null);

  const [activationCodeInput, setActivationCodeInput] = useState<string>('');
  const [status, setStatus] = useState<DeviceStatus>('PENDING');
  const [statusMessage, setStatusMessage] = useState<string>('No activado');

  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Self-register device and check status on mount
  useEffect(() => {
    registerAndCheckStatus();
  }, [consorcioCode]);

  const registerAndCheckStatus = async () => {
    if (!consorcioCode.trim()) return;
    setChecking(true);
    setError(null);

    try {
      // 1. Register device with backend
      const res = await api.registerClientDevice({
        consorcioCode: consorcioCode.trim(),
        deviceId,
        deviceType,
        osInfo: deviceInfo.osInfo,
        userAgent: deviceInfo.userAgent,
        appVersion: deviceInfo.appVersion,
        deviceName: `${deviceType === 'PC' ? 'PC Mostrador' : 'Terminal Móvil'} (${deviceId})`,
      });

      if (res.consorcio) {
        setConsorcio(res.consorcio);
        localStorage.setItem('bancapro_device_consorcio', res.consorcio.code);
        localStorage.setItem('bancapro_device_consorcio_name', res.consorcio.name);
      }

      // 2. Check current activation status
      const verify = await api.verifyDeviceStatus({ deviceId });
      setStatus(verify.status);

      if (verify.status === 'ACTIVE') {
        setStatusMessage('Terminal Autorizada y Activa');
        setSuccessMsg('¡Dispositivo activado y listo para operar!');
        setTimeout(() => {
          onActivated(consorcioCode, deviceId);
        }, 1200);
      } else if (verify.status === 'BLOQUEADO') {
        setStatusMessage('Esta terminal ha sido BLOQUEADA por el administrador.');
      } else if (verify.status === 'INACTIVE') {
        setStatusMessage('Esta terminal ha sido desactivada por el administrador.');
      } else {
        setStatusMessage('No activado');
      }
    } catch (err: any) {
      console.warn('Error verificando terminal:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setChecking(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cashier submits the activation code provided by the administrator
  const handleActivateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = activationCodeInput.trim().toUpperCase();

    if (!cleanCode) {
      setError('Por favor introduzca el código de activación suministrado por su administrador.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.confirmDeviceActivation({
        deviceId,
        activationCode: cleanCode,
        consorcioCode: consorcioCode.trim(),
      });

      setStatus('ACTIVE');
      setStatusMessage('Terminal Autorizada y Activa');
      setStoredActivationCode(cleanCode);
      if (res.token) setStoredDeviceToken(res.token);

      setSuccessMsg('¡Terminal activada exitosamente! Redirigiendo...');

      setTimeout(() => {
        onActivated(consorcioCode, deviceId);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Código de activación incorrecto o terminal no autorizada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Device Icon Avatar */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-white text-2xl font-black">
              {deviceType === 'PC' ? <Monitor className="w-8 h-8 text-cyan-400" /> : <Smartphone className="w-8 h-8 text-cyan-400" />}
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
          ACTIVAR TERMINAL
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Identificación y control de hardware para venta de lotería
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl py-6 px-5 sm:px-8 shadow-2xl rounded-3xl border border-white/10 space-y-5">
          {/* 1. Hardware Fingerprint Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Código del dispositivo
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {deviceType} · {deviceInfo.appVersion}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700/80">
              <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400 tracking-wider">
                {deviceId}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                title="Copiar código del dispositivo"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Envíe este código al Administrador de su consorcio para que registre y autorice esta terminal.
            </p>
          </div>

          {/* 2. Device Status Badge */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <span className="text-xs font-bold text-slate-400">Estado:</span>
            <div className="flex items-center gap-2">
              {status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activo / Autorizado
                </span>
              )}
              {status === 'PENDING' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> No activado
                </span>
              )}
              {status === 'INACTIVE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  <Lock className="w-3.5 h-3.5" /> Desactivado
                </span>
              )}
              {status === 'BLOQUEADO' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" /> Bloqueado
                </span>
              )}

              <button
                type="button"
                onClick={registerAndCheckStatus}
                disabled={checking}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                title="Actualizar estado con el servidor"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {status === 'BLOQUEADO' && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-1">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="text-sm font-black text-rose-400 uppercase">TERMINAL BLOQUEADA</h4>
              <p className="text-xs text-rose-300">
                Esta terminal ha sido BLOQUEADA por el administrador por motivos de seguridad. No se permiten operaciones de venta.
              </p>
            </div>
          )}

          {status === 'INACTIVE' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center space-y-1">
              <Lock className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-black text-slate-200 uppercase">TERMINAL DESACTIVADA</h4>
              <p className="text-xs text-slate-400">
                Esta terminal ha sido desactivada por el administrador. Comuníquese con la administración para reactivarla.
              </p>
            </div>
          )}

          {/* 3. Activation Form (Visible when status is PENDING or INACTIVE) */}
          {status !== 'BLOQUEADO' && (
            <form onSubmit={handleActivateTerminal} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                  Código de activación
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: ACT-8F42-K29X"
                    value={activationCodeInput}
                    onChange={(e) => setActivationCodeInput(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono font-black text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-wider uppercase"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Introduzca el código único generado por el Administrador al autorizar su terminal.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !activationCodeInput.trim()}
                  className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-98 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 border-b-4 border-b-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{loading ? 'VALIDANDO CON SERVIDOR...' : 'ACTIVAR TERMINAL'}</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. Footer & Admin Mode Bypass */}
          <div className="pt-3 border-t border-slate-800 flex flex-col items-center gap-2 text-center">
            {consorcio && (
              <span className="text-[11px] font-bold text-slate-400">
                Consorcio: <strong className="text-white">{consorcio.name}</strong> ({consorcio.code})
              </span>
            )}

            {onBypassAdmin && (
              <button
                type="button"
                onClick={onBypassAdmin}
                className="mt-1 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors py-2 px-3 rounded-xl hover:bg-slate-800/60"
              >
                <LogIn className="w-4 h-4" />
                <span>Acceso Administrativo / Modo Soporte</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
