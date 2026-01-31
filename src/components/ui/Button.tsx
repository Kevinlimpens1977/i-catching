import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

        const variantClasses = {
            primary: 'bg-gold text-anthracite hover:bg-gold-muted active:bg-gold-muted',
            secondary: 'border border-gold-muted text-gold-muted hover:border-gold hover:text-gold bg-transparent',
            ghost: 'text-cream-warm hover:text-gold bg-transparent',
            danger: 'bg-red-600 text-white hover:bg-red-700'
        };

        const sizeClasses = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base'
        };

        return (
            <button
                ref={ref}
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
