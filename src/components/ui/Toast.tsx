import { useToast } from '@/context/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
            toast flex items-center gap-3 pr-10
            ${toast.type === 'success' ? 'border-l-4 border-l-green-500' : ''}
            ${toast.type === 'error' ? 'border-l-4 border-l-red-500' : ''}
            ${toast.type === 'info' ? 'border-l-4 border-l-petrol' : ''}
          `}
                >
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {toast.type === 'info' && <Info className="w-5 h-5 text-petrol" />}
                    <span className="text-cream-warm">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-light hover:text-cream transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
