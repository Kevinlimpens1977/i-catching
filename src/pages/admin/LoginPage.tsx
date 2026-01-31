import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';

interface LoginFormData {
    email: string;
    password: string;
}

export function LoginPage() {
    const [loading, setLoading] = useState(false);
    const { signIn, user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormData>();

    // If already logged in as admin, redirect
    if (user && isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        try {
            await signIn(data.email, data.password);
            showToast('Succesvol ingelogd', 'success');
            navigate('/admin');
        } catch (error: any) {
            console.error('Login error:', error);
            let message = 'Inloggen mislukt. Controleer uw gegevens.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = 'Ongeldige email of wachtwoord.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Te veel pogingen. Probeer later opnieuw.';
            }
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-anthracite flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-slate-medium rounded-sm p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-serif text-cream">I-Catching</h1>
                        <p className="text-slate-light text-sm mt-2">CMS Beheer</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="E-mail"
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register('email', {
                                required: 'E-mail is verplicht',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Ongeldig e-mailadres'
                                }
                            })}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Wachtwoord"
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register('password', { required: 'Wachtwoord is verplicht' })}
                            error={errors.password?.message}
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Inloggen
                        </Button>
                    </form>

                    {/* Back link */}
                    <div className="mt-6 text-center">
                        <a
                            href="/"
                            className="text-sm text-slate-light hover:text-cream transition-colors"
                        >
                            ← Terug naar website
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
