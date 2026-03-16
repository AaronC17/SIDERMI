import { useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

const STYLES = {
  success: { icon: CheckCircle, iconColor: 'text-emerald-500', accent: 'bg-emerald-500' },
  error:   { icon: XCircle,     iconColor: 'text-red-500',     accent: 'bg-red-400'     },
  info:    { icon: Info,        iconColor: 'text-utn-blue',    accent: 'bg-utn-blue'    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2 items-end">
        {toasts.map(t => {
          const { icon: Icon, iconColor, accent } = STYLES[t.type];
          return (
            <div
              key={t.id}
              className="toast-animate flex items-stretch bg-white rounded-xl border border-slate-200 shadow-lg shadow-black/[0.07] max-w-[280px] overflow-hidden"
            >
              <div className={`w-1 shrink-0 ${accent}`} />
              <div className="flex items-center gap-2.5 pl-3 pr-2.5 py-2.5 flex-1 min-w-0">
                <Icon size={14} className={`shrink-0 ${iconColor}`} />
                <span className="flex-1 text-xs font-medium text-slate-600 leading-snug">{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 p-0.5 rounded text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
