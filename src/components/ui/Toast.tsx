import { useToast } from '@/context/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        toast flex items-center gap-3 pr-10 
                        ${toast.type === 'success' ? 'toast--success' : ''}
                        ${toast.type === 'error' ? 'toast--error' : ''}
                        ${toast.type === 'info' ? 'toast--info' : ''}
                    `}
                    role="status"
                    aria-live="polite"
                >
                    {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                    {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                    {toast.type === 'info' && <Info className="w-4 h-4 text-petrol flex-shrink-0" />}
                    <span className="text-sm text-cream-warm">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-light hover:text-cream transition-colors p-1"
                        aria-label="Sluiten"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
