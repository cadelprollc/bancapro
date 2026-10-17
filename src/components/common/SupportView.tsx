import React from 'react';
import { HelpCircle, Phone, Mail, ShieldCheck, Wifi, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, Button, Badge } from '../design-system';

export const SupportView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Mesa de Ayuda y Soporte Técnico
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Diagnóstico en vivo, asistencia técnica para bancas e impresoras térmicas
          </p>
        </div>

        <Badge variant="active" size="md">
          🟢 Soporte 24/7 Disponible
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info cards */}
        <Card variant="default">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Línea Telefónica Directa</h3>
              <p className="text-xs text-slate-400">Atención inmediata a bancas</p>
            </div>
          </div>
          <p className="text-base font-black font-mono text-slate-900 dark:text-white">
            (809) 555-HELP (4357)
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Disponible para desbloqueo de terminales y soporte de impresión.
          </p>
        </Card>

        <Card variant="default">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Correo Electrónico</h3>
              <p className="text-xs text-slate-400">Consultas administrativas</p>
            </div>
          </div>
          <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            soporte@bancaexpress.com
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Tiempo de respuesta estimado: menos de 15 minutos.
          </p>
        </Card>

        <Card variant="default">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Estado de la Plataforma</h3>
              <p className="text-xs text-slate-400">Servidores centrales</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-emerald-600">
              100% Operativo (99.98% SLA)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Redundancia activa con base de datos en tiempo real.
          </p>
        </Card>
      </div>

      {/* Diagnostics */}
      <Card variant="default">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Diagnóstico de Dispositivo y Conectividad
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Comprobación de comunicación con el servidor central de sorteos
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span>Conexión a Servidor API</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>Impresora Bluetooth / ESC-POS</span>
            </div>
            <span className="font-bold text-blue-500">Conectada</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-emerald-500" />
              <span>Sincronización de Hora Oficial</span>
            </div>
            <span className="font-bold text-emerald-600">Sincronizada</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
