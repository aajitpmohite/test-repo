// Lightweight toast notifications (success / error / info).
// Usage: const toast = useToast(); toast.success('Saved'); toast.error(err.message);
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckIcon, AlertIcon, CloseIcon } from '../components/icons';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let idCounter = 0;

const styles = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-600 dark:text-rose-300',
  info: 'border-brand-400/30 bg-brand-500/10 text-accent',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const api = {
    push,
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card backdrop-blur bg-card ${styles[t.type]} animate-fade-in`}
          >
            <span className="mt-0.5 shrink-0">
              {t.type === 'error' ? <AlertIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
            </span>
            <span className="flex-1 text-body">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-faint hover:text-strong" aria-label="Dismiss">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
