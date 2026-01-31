import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, id, ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label htmlFor={id} className="label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ className = '', label, error, id, ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label htmlFor={id} className="label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={id}
                    className={`input min-h-[120px] resize-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

TextArea.displayName = 'TextArea';
