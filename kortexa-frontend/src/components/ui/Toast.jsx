import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const dismiss = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl shadow-slate-900/10 sm:left-auto sm:right-6 sm:translate-x-0"
          role="alert"
        >
          {toast.type === "error" ? (
            <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={20} />
          ) : (
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} />
          )}
          <p className="flex-1 text-sm font-medium text-slate-800">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
