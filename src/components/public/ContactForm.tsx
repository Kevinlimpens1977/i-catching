import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { createInquiry } from '@/hooks/useFirestore';
import { useToast } from '@/context/ToastContext';

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

export function ContactForm() {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ContactFormData>();

    const onSubmit = async (data: ContactFormData) => {
        setLoading(true);
        try {
            await createInquiry(data);
            showToast('Bedankt voor uw bericht! Ik neem zo snel mogelijk contact met u op.', 'success');
            reset();
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            showToast('Er ging iets mis. Probeer het later opnieuw.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section bg-charcoal">
            <div className="container-editorial">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="section-title">Contact</span>
                        <h2 className="text-3xl md:text-4xl font-serif text-cream">
                            Neem contact op
                        </h2>
                        <p className="text-cream-warm mt-4">
                            Nieuwsgierig naar een op maat gemaakt stuk? Laat het me weten.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Naam"
                            id="name"
                            {...register('name', { required: 'Naam is verplicht' })}
                            error={errors.name?.message}
                        />

                        <Input
                            label="E-mail"
                            id="email"
                            type="email"
                            {...register('email', {
                                required: 'E-mail is verplicht',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Ongeldig e-mailadres'
                                }
                            })}
                            error={errors.email?.message}
                        />

                        <TextArea
                            label="Bericht"
                            id="message"
                            rows={5}
                            {...register('message', { required: 'Bericht is verplicht' })}
                            error={errors.message?.message}
                        />

                        <div className="text-center pt-4">
                            <Button type="submit" loading={loading}>
                                Verstuur bericht
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
