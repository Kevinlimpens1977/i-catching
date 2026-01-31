import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`modal-content ${sizeClasses[size]}`}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-medium">
                        <h3 className="text-xl font-medium text-cream">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-light hover:text-cream transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Bevestigen',
    cancelText = 'Annuleren',
    variant = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-content max-w-md">
                <div className="p-6">
                    <h3 className="text-xl font-medium text-cream mb-2">{title}</h3>
                    <p className="text-cream-warm mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`btn ${variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
