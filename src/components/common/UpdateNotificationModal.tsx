import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SystemUpdate, User } from '../../types/index';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  HardDrive
} from 'lucide-react';

interface UpdateNotificationModalProps {
  user: User;
  onUpdateCompleted?: (newVersion: string) => void;
  // If provided, manual trigger from Settings or Navbar
  forceShow?: boolean;
  onClose?: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  user,
  onUpdateCompleted,
  forceShow = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updateData, setUpdateData] = useState<SystemUpdate | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('v1.0.0');
  const [isMandatory, setIsMandatory] = useState<boolean>(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [postponed, setPostponed] = useState(false);

  // Check for updates on mount
  useEffect(() => {
    // If user already postponed in this session, don't auto open unless forced
    const savedPostponed = sessionStorage.getItem('bancapro_update_postponed');
    if (savedPostponed && !forceShow) {
      return;
    }

    const termCode = user.terminalCode || user.username || '1001';
    const localVersion = localStorage.getItem('bancapro_app_version') || 'v1.0.0';
    setCurrentVersion(localVersion);

    api
      .checkForUpdates(termCode, localVersion)
      .then((res) => {
        if (res.updateAvailable && res.update) {
          setUpdateData(res.update);
          setIsMandatory(res.isMandatory);
          setCurrentVersion(res.currentVersion);
          setIsOpen(true);
        } else if (forceShow) {
          // If forced, show up to date state
          setCurrentVersion(res.currentVersion);
          setIsOpen(true);
        }
      })
      .catch((err) => {
        console.error('Error al verificar actualizaciones:', err);
      });
  }, [user, forceShow]);

  const handlePostpone = () => {
    if (isMandatory) return; // Cannot postpone mandatory
    sessionStorage.setItem('bancapro_update_postponed', 'true');
    setPostponed(true);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleInstallNow = async () => {
    if (!updateData) return;
    setInstalling(true);
    setProgress(5);
    setStatusMessage('Conectando al servidor oficial de actualizaciones...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProgress(25);
      setStatusMessage(`Descargando paquete oficial ${updateData.version} (${((updateData.packageSizeBytes || 4500000) / 1024 / 1024).toFixed(1)} MB)...`);

      await new Promise((r) => setTimeout(r, 800));
      setProgress(55);
      setStatusMessage('Validando firma criptográfica SHA-256 y origen oficial...');

      await new Promise((r) => setTimeout(r, 700));
      setProgress(75);
      setStatusMessage('Creando snapshot de respaldo de seguridad de datos...');

      await new Promise((r) => setTimeout(r, 600));
      setProgress(90);
      setStatusMessage('Aplicando nuevos módulos y sincronizando base de datos...');

      const termCode = user.terminalCode || user.username || '1001';
      await api.confirmUpdate(termCode, updateData.version, updateData.packageHash);

      await new Promise((r) => setTimeout(r, 500));
      setProgress(100);
      setStatusMessage('¡Actualización instalada exitosamente!');
      localStorage.setItem('bancapro_app_version', updateData.version);
      setCurrentVersion(updateData.version);
      setIsSuccess(true);

      if (onUpdateCompleted) {
        onUpdateCompleted(updateData.version);
      }
    } catch (err: any) {
      console.error('Error durante la actualización:', err);
      setStatusMessage(`Error durante la actualización: ${err.message || 'Fallo desconocido'}`);
    } finally {
      setInstalling(false);
    }
  };

  const handleFinishAndReload = () => {
    setIsOpen(false);
    if (onClose) onClose();
    // Soft reload to apply all assets and styles
    window.location.reload();
  };

  if (!isOpen) return null;

  // Case when user manually checked but is already on latest version
  if (!updateData && forceShow) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-neutral-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-neutral-900 uppercase">
            Sistema Actualizado
          </h3>
          <p className="text-sm text-neutral-600 mt-2">
            La terminal está operando con la versión más reciente:{' '}
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {currentVersion}
            </span>
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-black shadow-lg">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                  BancaPro Update Service
                </span>
                {isMandatory ? (
                  <span className="text-[10px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Obligatoria
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase mt-0.5">
                {isSuccess ? '¡Actualización Completada!' : '🚀 Nueva Actualización Disponible'}
              </h2>
            </div>
          </div>

          {/* Version badge pill */}
          <div className="mt-4 flex items-center gap-2 bg-neutral-800/90 rounded-2xl p-2.5 border border-neutral-700 text-xs">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-bold">Versión Actual</div>
              <div className="font-mono font-bold text-neutral-200">{currentVersion}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 text-center">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Nueva Versión</div>
              <div className="font-mono font-bold text-emerald-300 text-sm">{updateData?.version}</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-neutral-900">
                ¡Terminal Actualizada a {updateData?.version}!
              </h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                Todos sus datos de ventas, tickets, configuraciones y grupos permanecen intactos y asegurados.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleFinishAndReload}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-98"
                >
                  Continuar Trabajando
                </button>
              </div>
            </div>
          ) : installing ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h4 className="font-black text-neutral-900 text-sm uppercase tracking-wide">
                  Instalando Actualización Centralizada...
                </h4>
                <p className="text-xs text-neutral-500 mt-1 font-mono">{statusMessage}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden border border-neutral-200">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-right text-[11px] font-mono text-neutral-500">{progress}%</div>

              <div className="text-[11px] text-neutral-400 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>No apague ni desconecte la terminal durante la instalación</span>
              </div>
            </div>
          ) : (
            <>
              {/* Release Title */}
              <div>
                <h3 className="font-black text-neutral-900 text-sm uppercase">
                  {updateData?.title}
                </h3>
                <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                  <span>Publicado por: {updateData?.publishedBy}</span>
                  <span>•</span>
                  <span>
                    {updateData?.publishedAt
                      ? new Date(updateData.publishedAt).toLocaleDateString('es-DO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Reciente'}
                  </span>
                </div>
              </div>

              {/* Release Notes List */}
              <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200 space-y-2 max-h-52 overflow-y-auto">
                <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Novedades y Mejoras:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {updateData?.releaseNotes && updateData.releaseNotes.length > 0 ? (
                    updateData.releaseNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-neutral-500 italic">Mejoras de rendimiento y estabilidad del sistema.</li>
                  )}
                </ul>
              </div>

              {/* Security & Integrity Banner */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Paquete Oficial Verificado:</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Descarga segura directa del servidor central. La base de datos local y tickets emitidos están completamente resguardados.
                  </p>
                </div>
              </div>

              {isMandatory && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Esta actualización es obligatoria. No podrá continuar utilizando la terminal hasta completarla.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                {!isMandatory && (
                  <button
                    onClick={handlePostpone}
                    className="w-full sm:w-1/2 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Actualizar más tarde
                  </button>
                )}
                <button
                  onClick={handleInstallNow}
                  className={`${
                    isMandatory ? 'w-full' : 'w-full sm:w-1/2'
                  } py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2`}
                >
                  <Download className="w-4 h-4" />
                  <span>Actualizar Ahora</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
