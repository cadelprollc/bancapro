import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Ticket,
  Trophy,
  Percent,
  CircleDot,
  ArrowRight,
  TrendingUp,
  Clock,
  Calendar,
  Sparkles,
  Smartphone,
  ExternalLink,
  BarChart3,
  Layers,
  Package,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, Button, MetricCard, Badge } from '../design-system';
import { Lottery, LotteryResult, DashboardMetrics } from '../../types';
import { TopGroupsCard } from './TopGroupsCard';
import { HotNumbersCard } from './HotNumbersCard';

interface ModernDashboardProps {
  metrics: DashboardMetrics;
  lotteries: Lottery[];
  results: LotteryResult[];
  userName?: string;
  onNavigate: (tab: string, extraData?: any) => void;
  onRefresh?: () => void;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({
  metrics,
  lotteries,
  results,
  userName = 'Admin',
  onNavigate,
}) => {
  // Live clock
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [resultsTab, setResultsTab] = useState<'quiniela' | 'pale' | 'superpale' | 'tripleta'>('quiniela');
  const [chartMetric, setChartMetric] = useState<'ventas_premios' | 'ganancia' | 'tickets'>('ventas_premios');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const formatted = now.toLocaleDateString('es-DO', options);
      // Capitalize first letter
      setCurrentDateTime(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Main game types for "Loterías Disponibles"
  const gameTypes = [
    {
      id: 'QUINIELA',
      title: 'Quiniela',
      subtitle: '1er, 2do y 3er premio',
      multiplier: '60x',
      color: 'from-blue-600 to-indigo-600',
      icon: '🎱',
    },
    {
      id: 'PALE',
      title: 'Palé',
      subtitle: 'Combinación de 2 números',
      multiplier: '1,000x',
      color: 'from-indigo-600 to-purple-600',
      icon: '🎲',
    },
    {
      id: 'SUPER_PALE',
      title: 'Súper Palé',
      subtitle: 'Premios cruzados oficiales',
      multiplier: '3,000x',
      color: 'from-purple-600 to-pink-600',
      icon: '⚡',
    },
    {
      id: 'TRIPLETA',
      title: 'Tripleta',
      subtitle: '3 aciertos millonarios',
      multiplier: '20,000x',
      color: 'from-amber-500 to-orange-600',
      icon: '💎',
    },
  ];

  const terminalStats = metrics.terminalesSummary;
  const activePercent =
    terminalStats.total > 0
      ? Math.round((terminalStats.activas / terminalStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header Greeting & Live Time */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d172a] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ¡Hola, {userName}!
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Aquí tienes un resumen de tu banca hoy.
          </p>
        </div>

        {/* Quick Sales Action Buttons & Live Clock */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Principal: Vender Loterías */}
          <button
            type="button"
            onClick={() => onNavigate('sales')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            title="Ir a la Terminal de Venta de Loterías"
          >
            <Ticket className="w-4 h-4 text-white" />
            <span>Vender Loterías</span>
          </button>

          {/* Botón de Recargas */}
          <button
            type="button"
            onClick={() => onNavigate('recargas')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Vender Recargas Telefónicas Claro, Altice, Viva"
          >
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>Recargas</span>
          </button>

          {/* Botón de Productos */}
          <button
            type="button"
            onClick={() => onNavigate('productos')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Vender Productos, Pines Digitales y Servicios"
          >
            <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Productos</span>
          </button>

          {/* Botón de Cuadre */}
          <button
            type="button"
            onClick={() => onNavigate('cuadre')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Ver Cuadre de Caja de Terminal"
          >
            <Wallet className="w-4 h-4 text-indigo-500" />
            <span>Cuadre</span>
          </button>

          {/* Live Clock & Date Badge */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-200 font-semibold">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{currentDateTime}</span>
          </div>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas Hoy"
          value={metrics.ventasHoy.toLocaleString('es-DO')}
          prefix="RD$"
          variation={metrics.ventasVariacion}
          variationText="vs ayer"
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-blue-50 dark:bg-blue-950/60"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <MetricCard
          title="Jugadas"
          value={metrics.jugadasCount.toLocaleString('es-DO')}
          variation={metrics.jugadasVariacion}
          variationText="vs ayer"
          icon={<Ticket className="w-6 h-6" />}
          iconBgColor="bg-indigo-50 dark:bg-indigo-950/60"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />

        <MetricCard
          title="Premios Pagados"
          value={metrics.premiosPagados.toLocaleString('es-DO')}
          prefix="RD$"
          variation={metrics.premiosVariacion}
          variationText="vs ayer"
          icon={<Trophy className="w-6 h-6" />}
          iconBgColor="bg-amber-50 dark:bg-amber-950/60"
          iconColor="text-amber-600 dark:text-amber-400"
        />

        <MetricCard
          title="Comisiones"
          value={metrics.comisiones.toLocaleString('es-DO')}
          prefix="RD$"
          variation={metrics.comisionesVariacion}
          variationText="vs ayer"
          icon={<Percent className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/60"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* 3. Promotional Banner */}
      {metrics.promotionalBanner?.enabled && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 shadow-lg shadow-blue-900/20 border border-blue-600/40">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Novedad Multi-Plataforma
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              {metrics.promotionalBanner.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              {metrics.promotionalBanner.subtitle}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="warning"
                size="md"
                onClick={() => onNavigate('sales')}
                icon={<Smartphone className="w-4 h-4 text-slate-900" />}
              >
                {metrics.promotionalBanner.buttonText || 'Ver más'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => onNavigate('settings')}
                className="text-white hover:bg-white/10"
              >
                Configurar banca
              </Button>
            </div>
          </div>

          {/* Background Decorative Graphic */}
          <div className="absolute -right-6 -bottom-10 opacity-15 pointer-events-none transform rotate-12 scale-125">
            <Smartphone className="w-72 h-72 text-white" />
          </div>
        </div>
      )}

      {/* 3.5. Tendencia de Ventas de los Últimos 7 Días (Recharts) */}
      {(() => {
        const chartData = (metrics.dailySales7Days && metrics.dailySales7Days.length > 0)
          ? metrics.dailySales7Days
          : [
              { dayName: 'Jue', date: '2026-09-25', ventas: 42000, premios: 18500, gananciaNeta: 18250, ticketsCount: 290 },
              { dayName: 'Vie', date: '2026-09-26', ventas: 46500, premios: 21000, gananciaNeta: 19687, ticketsCount: 315 },
              { dayName: 'Sáb', date: '2026-09-27', ventas: 54000, premios: 23800, gananciaNeta: 23450, ticketsCount: 380 },
              { dayName: 'Dom', date: '2026-09-28', ventas: 61000, premios: 26500, gananciaNeta: 26875, ticketsCount: 410 },
              { dayName: 'Lun', date: '2026-09-29', ventas: 43200, premios: 19000, gananciaNeta: 18800, ticketsCount: 295 },
              { dayName: 'Mar', date: '2026-09-30', ventas: 48500, premios: 22000, gananciaNeta: 20437, ticketsCount: 330 },
              { dayName: 'Hoy', date: '2026-10-01', ventas: metrics.ventasHoy || 48750, premios: metrics.premiosPagados || 22400, gananciaNeta: (metrics.ventasHoy || 48750) - (metrics.premiosPagados || 22400) - (metrics.comisiones || 6120), ticketsCount: metrics.jugadasCount || 342 },
            ];

        const totalVentas7d = chartData.reduce((acc, curr) => acc + curr.ventas, 0);
        const totalPremios7d = chartData.reduce((acc, curr) => acc + curr.premios, 0);
        const totalGanancia7d = chartData.reduce((acc, curr) => acc + curr.gananciaNeta, 0);
        const avgDailySales = Math.round(totalVentas7d / chartData.length);
        const retentionRate = totalVentas7d > 0 ? ((totalGanancia7d / totalVentas7d) * 100).toFixed(1) : '35.0';

        return (
          <Card variant="default" className="p-5 sm:p-6 shadow-sm overflow-hidden">
            {/* Header del Gráfico */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Tendencia de Ventas (Últimos 7 Días)
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Recharts
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comportamiento diario de ventas, premios pagados y margen neto de la banca
                </p>
              </div>

              {/* Controles y KPIs resumidos */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setChartMetric('ventas_premios')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      chartMetric === 'ventas_premios'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Ventas vs Premios
                  </button>
                  <button
                    onClick={() => setChartMetric('ganancia')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      chartMetric === 'ganancia'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Ganancia Neta
                  </button>
                  <button
                    onClick={() => setChartMetric('tickets')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      chartMetric === 'tickets'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tickets
                  </button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('reports')}
                  className="text-xs"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1" />
                  Ver Reporte Detallado
                </Button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Total Ventas 7D
                </span>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                  RD$ {totalVentas7d.toLocaleString('es-DO')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Premios Otorgados
                </span>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                  RD$ {totalPremios7d.toLocaleString('es-DO')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Margen Neto Consolidado
                </span>
                <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  RD$ {totalGanancia7d.toLocaleString('es-DO')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Retención de Banca
                </span>
                <p className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {retentionRate}% (Prom: RD$ {avgDailySales.toLocaleString('es-DO')}/d)
                </p>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="dayName"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.4 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (chartMetric === 'tickets') return `${val}`;
                      return `RD$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(51, 65, 85, 0.6)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '10px 14px',
                    }}
                    formatter={(value: any, name: any) => {
                      const num = Number(value) || 0;
                      if (name === 'Tickets') return [`${num.toLocaleString('es-DO')} emitidos`, name];
                      return [`RD$ ${num.toLocaleString('es-DO')}`, name];
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.date ? `${label} (${item.date})` : `${label}`;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontWeight: 600 }}
                  />

                  {chartMetric === 'ventas_premios' && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="ventas"
                        name="Ventas Brutas"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: '#3b82f6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="premios"
                        name="Premios Pagados"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#f59e0b' }}
                      />
                    </>
                  )}

                  {chartMetric === 'ganancia' && (
                    <Line
                      type="monotone"
                      dataKey="gananciaNeta"
                      name="Ganancia Neta"
                      stroke="#10b981"
                      strokeWidth={3.5}
                      dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 8, fill: '#059669' }}
                    />
                  )}

                  {chartMetric === 'tickets' && (
                    <Line
                      type="monotone"
                      dataKey="ticketsCount"
                      name="Tickets"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7, fill: '#4f46e5' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );
      })()}

      {/* 4. Loterías Disponibles (Tarjetas Grandes de Modalidades) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Loterías Disponibles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona una modalidad para emitir jugadas al instante
            </p>
          </div>
          <button
            onClick={() => onNavigate('lotteries')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Ver todas las loterías <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameTypes.map((gt) => (
            <Card
              key={gt.id}
              variant="interactive"
              className="flex flex-col justify-between group relative overflow-hidden"
              onClick={() => onNavigate('sales', { playType: gt.id })}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{gt.icon}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    Paga {gt.multiplier}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {gt.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {gt.subtitle}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Jugar <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Sorteo hoy</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Servicios Adicionales: Recargas Telefónicas & Productos Digitales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Card
            variant="interactive"
            className="flex flex-col justify-between group relative overflow-hidden border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/[0.04] to-cyan-500/[0.04]"
            onClick={() => onNavigate('recargas')}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Recargas Telefónicas
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Operadoras RD
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Claro, Altice y Viva · Saldo y Paqueticos con acreditación en tiempo real
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black text-blue-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Vender Recarga <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">Comisión activa</span>
            </div>
          </Card>

          <Card
            variant="interactive"
            className="flex flex-col justify-between group relative overflow-hidden border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-br from-emerald-500/[0.04] to-teal-500/[0.04]"
            onClick={() => onNavigate('productos')}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Productos & Servicios
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      Multi-Servicio
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pines digitales (Netflix, PSN), recargas deportivas (Betcris) y cobro de facturas
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Catálogo de Productos <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">Entrega inmediata</span>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Tops: Top 5 Grupos & Números Calientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Grupos (Sustituye la opción de Top Vendedores) */}
        <TopGroupsCard
          topGroups={metrics.topGroups}
          onNavigateGroups={() => onNavigate('groups')}
        />

        {/* Top Números Calientes (Matches IMG_2269.png pixel-perfect) */}
        <HotNumbersCard
          hotNumbers={metrics.hotNumbers}
          onNavigateSales={() => onNavigate('sales')}
          onNavigateTopes={() => onNavigate('lotteries')}
        />
      </div>

      {/* 5.5. Últimos Resultados Oficiales */}
      <div>
        <Card variant="default" className="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎱</span> Últimos Resultados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Premios oficiales transmitidos en tiempo real
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-semibold">
              {(['quiniela', 'pale', 'superpale', 'tripleta'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setResultsTab(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    resultsTab === tab
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'superpale' ? 'Súper Palé' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="py-4 space-y-3 flex-1 overflow-y-auto max-h-80">
            {results.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No hay resultados registrados hoy aún.
              </div>
            ) : (
              results.slice(0, 6).map((res, idx) => {
                const lot = lotteries.find((l) => l.id === res.lotteryId);
                const lotName = lot ? lot.name : res.lotteryId;
                const time = lot?.drawTime || '12:30 PM';

                return (
                  <div
                    key={res.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 hover:border-blue-400/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {lotName}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {time}
                        </p>
                      </div>
                    </div>

                    {/* Numbers display */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {res.primera || '--'}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                        {res.segunda || '--'}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                        {res.tercera || '--'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Actualizado automáticamente</span>
            <button
              onClick={() => onNavigate('results')}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Ver historial completo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* 6. Lower Grid: Estado de Terminales, Ventas por Lotería & Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminales Status Card */}
        <Card variant="default">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Terminales
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estado de conexión en tiempo real
              </p>
            </div>
            <Badge variant="active" size="md">
              {terminalStats.activas}/{terminalStats.total} Activas
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">Operatividad</span>
              <span className="text-emerald-600 dark:text-emerald-400">{activePercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-[10px] uppercase font-bold">🟢 Activas</p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {terminalStats.activas}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-[10px] uppercase font-bold">🟡 Pendientes</p>
              <p className="text-base font-extrabold text-amber-500 mt-0.5">
                {terminalStats.pendientes}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-[10px] uppercase font-bold">🔴 Bloqueadas</p>
              <p className="text-base font-extrabold text-rose-500 mt-0.5">
                {terminalStats.bloqueadas}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-[10px] uppercase font-bold">⚫ Desconectadas</p>
              <p className="text-base font-extrabold text-slate-500 mt-0.5">
                {terminalStats.desconectadas}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => onNavigate('bancas')}
            >
              Bancas & Terminales
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs"
              onClick={() => onNavigate('terminal-sales')}
            >
              Ventas por Terminal
            </Button>
          </div>
        </Card>

        {/* Ventas por Lotería / Modalidad */}
        <Card variant="default">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ventas por Lotería
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribución porcentual de jugadas hoy
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>

          <div className="py-4 space-y-3.5">
            {metrics.ventasPorLoteria.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">
                      RD$ {item.amount.toLocaleString('es-DO')}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color || 'bg-blue-600'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Datos consolidados del día</span>
            <button
              onClick={() => onNavigate('reports')}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver reporte de ventas →
            </button>
          </div>
        </Card>

        {/* Actividad Reciente */}
        <Card variant="default">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Actividad Reciente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Eventos del sistema y transacciones en vivo
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="py-2 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
            {metrics.actividadReciente.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-base p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                    {act.icon}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{act.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {act.date} • {act.time}
                    </p>
                  </div>
                </div>

                {act.amount !== undefined && (
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                      act.type === 'prize'
                        ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60'
                        : 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
                    }`}
                  >
                    RD$ {act.amount.toLocaleString('es-DO')}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Auditoría en tiempo real</span>
            <button
              onClick={() => onNavigate('reports')}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Auditoría completa →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
