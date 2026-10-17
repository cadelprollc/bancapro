import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ticket, User } from '../../types';
import { api } from '../../services/api';
import { printerService } from '../../services/printerService';
import { ThermalTicketModal } from './ThermalTicketModal';
import {
  Printer,
  Zap,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Eye,
  RefreshCw,
  Ticket as TicketIcon,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RecentTicketsSliderWidgetProps {
  user: User;
  tickets?: Ticket[];
  onTicketReprinted?: (ticket: Ticket) => void;
  className?: string;
  compact?: boolean;
}

export const RecentTicketsSliderWidget: React.FC<RecentTicketsSliderWidgetProps> = ({
  user,
  tickets: externalTickets,
  onTicketReprinted,
  className = '',
  compact = false,
}) => {
  const [internalTickets, setInternalTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reprintingId, setReprintingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTicketToView, setSelectedTicketToView] = useState<Ticket | null>(null);
  const [reprintNotice, setReprintNotice] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const [activeScrollIndex, setActiveScrollIndex] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const terminalCode = user.terminalCode || (user.role === 'TERMINAL' ? user.username : '1001');

  // Carga de tickets desde la API (últimos 5 emitidos por este vendedor o terminal)
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const allTickets = await api.getTickets();
      if (allTickets && Array.isArray(allTickets)) {
        const filtered = allTickets
          .filter((t) => {
            const matchesUser = t.userId === user.id || t.userName === user.username;
            const matchesTerminal = t.terminalCode === terminalCode;
            return matchesUser || matchesTerminal || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
          })
          // Ordenar por fecha/creación más reciente primero
          .sort((a, b) => {
            const timeA = new Date(`${a.date || ''}T${a.time || '00:00:00'}`).getTime() || new Date(a.createdAt || 0).getTime();
            const timeB = new Date(`${b.date || ''}T${b.time || '00:00:00'}`).getTime() || new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          })
          .slice(0, 5); // Tomar exactamente los últimos 5 tickets emitidos
        setInternalTickets(filtered);
      }
    } catch (err) {
      console.error('Error cargando los últimos 5 tickets para el widget deslizante:', err);
    } finally {
      setLoading(false);
    }
  }, [user, terminalCode]);

  // Si se proporcionan tickets externamente, sincronizarlos; de lo contrario cargar vía API
  useEffect(() => {
    if (externalTickets && externalTickets.length > 0) {
      const top5 = [...externalTickets]
        .sort((a, b) => {
          const timeA = new Date(`${a.date || ''}T${a.time || '00:00:00'}`).getTime() || new Date(a.createdAt || 0).getTime();
          const timeB = new Date(`${b.date || ''}T${b.time || '00:00:00'}`).getTime() || new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, 5);
      setInternalTickets(top5);
    } else {
      fetchTickets();
    }
  }, [externalTickets, fetchTickets]);

  // Escuchar evento personalizado global cuando se emite un nuevo ticket en cualquier componente
  useEffect(() => {
    const handleTicketCreated = (e: any) => {
      const newTicket: Ticket = e.detail;
      if (newTicket && newTicket.ticketNumber) {
        setInternalTickets((prev) => {
          const exists = prev.some((t) => t.id === newTicket.id || t.ticketNumber === newTicket.ticketNumber);
          if (exists) return prev;
          return [newTicket, ...prev].slice(0, 5);
        });
        // Si estaba desplazado, regresar al inicio suavemente para mostrar el nuevo ticket
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('bancapro:ticket-created', handleTicketCreated);
    // Intervalo de sondeo regular cada 20 segundos
    const interval = setInterval(fetchTickets, 20000);

    return () => {
      window.removeEventListener('bancapro:ticket-created', handleTicketCreated);
      clearInterval(interval);
    };
  }, [fetchTickets]);

  // Chequeo de límites de scroll horizontal
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calcular índice aproximado visible
    const cardWidth = 280;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveScrollIndex(Math.min(4, Math.max(0, index)));
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [internalTickets, updateScrollButtons]);

  const slideLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -290, behavior: 'smooth' });
    }
  };

  const slideRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 290, behavior: 'smooth' });
    }
  };

  const slideToIndex = (idx: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: idx * 290, behavior: 'smooth' });
    }
  };

  // Copiar número de ticket al portapapeles
  const handleCopyTicket = (ticket: Ticket) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(ticket.ticketNumber);
      setCopiedId(ticket.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Reimpresión rápida directa 58mm
  const handleQuickReprint = async (ticket: Ticket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setReprintingId(ticket.id);
      const res = await printerService.directThermalPrint58mm(ticket, terminalCode);
      setReprintNotice(`⚡ Ticket #${ticket.ticketNumber} reimpreso con éxito (${res.printerName}).`);
      if (onTicketReprinted) {
        onTicketReprinted(ticket);
      }
      setTimeout(() => setReprintNotice(null), 4000);
    } catch (err: any) {
      console.error('Error al reimprimir ticket:', err);
      setReprintNotice(`⚠️ Error al reimprimir ticket #${ticket.ticketNumber}: ${err.message || 'Fallo de impresora'}`);
      setTimeout(() => setReprintNotice(null), 4000);
    } finally {
      setReprintingId(null);
    }
  };

  const displayTickets = internalTickets.slice(0, 5);

  return (
    <section
      aria-label="Últimos 5 Tickets Emitidos"
      className={`w-full bg-white dark:bg-[#0d172a] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* HEADER DEL WIDGET */}
      <div className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-2">
        {/* Título y badge contador */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <History className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
              Últimos 5 Tickets Emitidos
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-200/60 dark:border-cyan-500/30">
              <Sparkles className="w-2.5 h-2.5 text-blue-500 shrink-0" />
              <span>{displayTickets.length}/5 Recientes</span>
            </span>
          </div>
        </div>

        {/* Acciones del Header: Controles de deslizamiento, refresco y colapso */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Controles de deslizamiento horizontal */}
          {displayTickets.length > 1 && !isCollapsed && (
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg mr-1">
              <button
                type="button"
                onClick={slideLeft}
                disabled={!canScrollLeft}
                aria-label="Deslizar tickets a la izquierda"
                className={`p-1 rounded-md transition-colors ${
                  canScrollLeft
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-2xs cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40'
                }`}
                title="Deslizar a la izquierda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={slideRight}
                disabled={!canScrollRight}
                aria-label="Deslizar tickets a la derecha"
                className={`p-1 rounded-md transition-colors ${
                  canScrollRight
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-2xs cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40'
                }`}
                title="Deslizar a la derecha"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botón de Refrescar lista */}
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            title="Actualizar últimos tickets emitidos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Minimizar / Expandir */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expandir widget' : 'Minimizar widget'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* AVISO DE REIMPRESIÓN (TOAST INLINE) */}
      {reprintNotice && (
        <div className="px-3.5 py-1.5 bg-emerald-500/15 dark:bg-emerald-950/40 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />
            <span>{reprintNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setReprintNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 text-[11px] font-mono px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* CUERPO DEL WIDGET: LISTA DESLIZANTE DE LOS ÚLTIMOS 5 TICKETS */}
      {!isCollapsed && (
        <div className="p-3">
          {displayTickets.length === 0 ? (
            /* Estado vacío si aún no hay tickets */
            <div className="py-6 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <TicketIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Aún no hay tickets emitidos en esta terminal
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Tan pronto realice una venta, aparecerá aquí con acceso rápido a reimpresión térmica 58mm y consulta instantánea.
              </p>
            </div>
          ) : (
            /* Carrusel / Lista Deslizante Horizontal */
            <div className="space-y-2">
              <div
                ref={scrollContainerRef}
                className="flex items-stretch gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 -mx-0.5 px-0.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {displayTickets.map((ticket, index) => {
                  const isLatest = index === 0;
                  const isPrinting = reprintingId === ticket.id;
                  const isCopied = copiedId === ticket.id;
                  const playsCount = ticket.plays?.length || 0;

                  // Loterías involucradas en este ticket
                  const lotteryNames = Array.from(
                    new Set(ticket.plays?.map((p) => p.lotteryName).filter(Boolean) || [])
                  );

                  return (
                    <div
                      key={ticket.id || ticket.ticketNumber}
                      className={`min-w-[270px] sm:min-w-[290px] max-w-[310px] shrink-0 snap-start rounded-xl p-3 border transition-all flex flex-col justify-between gap-2.5 relative group ${
                        isLatest
                          ? 'bg-gradient-to-b from-blue-50/70 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-400/60 dark:border-blue-500/40 ring-1 ring-blue-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      {/* Badge superior: Índice #1 a #5 y tiempo */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider font-mono ${
                              isLatest
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            #{index + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyTicket(ticket)}
                            className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1 group/btn truncate"
                            title="Click para copiar número de ticket"
                          >
                            <span className="truncate">#{ticket.ticketNumber}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 group-hover/btn:text-blue-500 shrink-0 opacity-60" />
                            )}
                          </button>
                        </div>

                        {/* Hora de emisión */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ticket.time || 'Reciente'}</span>
                        </div>
                      </div>

                      {/* Información central: Monto total y resumen de jugadas */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Total Venta</span>
                          <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                            RD$ {(ticket.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Etiquetas de loterías y cantidad de jugadas */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5 text-blue-500" />
                            <span>{playsCount} {playsCount === 1 ? 'jugada' : 'jugadas'}</span>
                          </span>

                          {lotteryNames.slice(0, 2).map((name) => (
                            <span
                              key={name}
                              className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 text-[10px] font-semibold text-blue-700 dark:text-cyan-300 truncate max-w-[120px]"
                              title={name}
                            >
                              {name}
                            </span>
                          ))}

                          {lotteryNames.length > 2 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              +{lotteryNames.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Mini preview de la primera jugada */}
                        {ticket.plays && ticket.plays[0] && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {ticket.plays[0].playType}:
                            </span>{' '}
                            {ticket.plays[0].numbers.join('-')} · RD${ticket.plays[0].amount}
                          </div>
                        )}
                      </div>

                      {/* ACCESO RÁPIDO PARA REIMPRESIÓN (BOTONES DIRECTOS) */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        {/* Botón Principal: Reimpresión Térmica Rápida 58mm en 1 Clic */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickReprint(ticket, e)}
                          disabled={isPrinting}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="Reimprimir directamente en formato térmico 58mm"
                        >
                          {isPrinting ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Imprimiendo...</span>
                            </>
                          ) : (
                            <>
                              <Printer className="w-3.5 h-3.5" />
                              <span>Reimprimir 58mm</span>
                            </>
                          )}
                        </button>

                        {/* Botón Secundario: Vista previa del recibo */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicketToView(ticket)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Ver detalle completo del ticket y opciones de impresión"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Indicadores de posición de deslizamiento (Puntos 1 a 5) */}
              {displayTickets.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {displayTickets.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => slideToIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeScrollIndex === i
                          ? 'w-5 bg-blue-600 dark:bg-cyan-400'
                          : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-400'
                      }`}
                      aria-label={`Ir al ticket ${i + 1}`}
                      title={`Ver ticket ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALLADO DE REIMPRESIÓN TÉRMICA */}
      {selectedTicketToView && (
        <ThermalTicketModal
          ticket={selectedTicketToView}
          onClose={() => setSelectedTicketToView(null)}
        />
      )}
    </section>
  );
};
