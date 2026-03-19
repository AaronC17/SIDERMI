import { X, Download, AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import type { DashboardStats } from '../types';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

type EstadoColor = 'amber' | 'emerald' | 'red';

const COLOR_CLASSES: Record<EstadoColor, { bg: string; border: string; text: string; icon: string }> = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
};

export default function DownloadZipModal({ onClose, onConfirm }: Props) {
  const [checking, setChecking] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [checked, setChecked] = useState(false);

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const data = await getDashboard();
      setStats(data);
      setChecked(true);
    } catch {
      setChecked(true);
    } finally {
      setChecking(false);
    }
  };

  // Auto-check al montar
  useEffect(() => {
    if (!checked && !checking) {
      checkUpdates();
    }
  }, [checked, checking]);

  const getEstadoActualizacion = (): {
    mensaje: string;
    color: EstadoColor;
    icon: typeof Clock;
  } => {
    if (!stats) {
      return {
        mensaje: 'No se pudo verificar el estado de actualización',
        color: 'amber',
        icon: AlertTriangle,
      };
    }

    // Verificar si hay estudiantes con documentos pendientes
    const totalCompletos = stats.documentos?.todosCompletos || 0;
    const totalIncompletos = stats.documentos?.todosIncompletos || 0;

    if (totalCompletos === 0) {
      return {
        mensaje: 'No hay expedientes completos para descargar',
        color: 'red',
        icon: AlertTriangle,
      };
    }

    if (totalIncompletos > 0) {
      return {
        mensaje: `Hay ${totalIncompletos} estudiante${totalIncompletos > 1 ? 's' : ''} con documentos pendientes. El ZIP incluirá solo los ${totalCompletos} expedientes completos.`,
        color: 'amber',
        icon: AlertTriangle,
      };
    }

    return {
      mensaje: `Todos los ${totalCompletos} expedientes están completos y actualizados.`,
      color: 'emerald',
      icon: Clock,
    };
  };

  const estado = getEstadoActualizacion();
  const colorClasses = COLOR_CLASSES[estado.color];

  const canDownload = estado.color !== 'red';

  const confirmacionTexto = (() => {
    if (estado.color === 'emerald') {
      return 'Todos los expedientes están completos. ¿Está seguro de descargar el ZIP ahora?';
    }

    if (estado.color === 'amber') {
      return 'Hay expedientes con documentos pendientes. ¿Está seguro de descargar el ZIP solo con expedientes completos?';
    }

    return 'En este momento no hay expedientes completos para incluir en el ZIP.';
  })();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl w-full flex flex-col overflow-hidden"
        style={{ 
          width: 'min(90vw, 560px)',
          maxHeight: 'min(84vh, auto)',
          boxShadow: '0 25px 60px rgba(20,45,92,0.22), 0 8px 24px rgba(20,45,92,0.12)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(120deg, #142D5C 0%, #1E4680 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Download size={20} />
            </div>
            <h3 className="font-bold text-white">Descargar Expedientes ZIP</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            Estás a punto de generar y descargar un archivo ZIP con los expedientes completos de estudiantes.
          </p>

          {checking ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-utn-blue"></div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border-2 ${colorClasses.bg} ${colorClasses.border}`}>
              <div className="flex items-start gap-3">
                <estado.icon size={20} className={`${colorClasses.icon} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-sm font-semibold ${colorClasses.text} mb-1`}>
                    Estado de Actualización
                  </p>
                  <p className={`text-xs ${colorClasses.text}`}>
                    {estado.mensaje}
                  </p>
                  {stats && stats.documentos?.todosCompletos > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Total de expedientes a incluir: <strong>{stats.documentos.todosCompletos}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1">
            <p>El archivo ZIP incluirá:</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>Documentos digitales de cada estudiante</li>
              <li>Reporte Excel con información completa</li>
              <li>Archivos organizados por cédula y nombre</li>
            </ul>
          </div>

          <div className={`p-3 rounded-xl border ${colorClasses.bg} ${colorClasses.border}`}>
            <p className={`text-xs font-medium ${colorClasses.text}`}>
              {confirmacionTexto}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={!canDownload || checking}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-utn-blue text-white rounded-xl text-sm font-medium hover:bg-utn-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-utn-blue/20"
          >
            <Download size={16} />
            {checking ? 'Verificando...' : estado.color === 'amber' ? 'Sí, descargar solo completos' : 'Descargar ZIP'}
          </button>
        </div>
      </div>
    </div>
  );
}
