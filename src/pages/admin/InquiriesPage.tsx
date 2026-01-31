import { useState } from 'react';
import { useInquiries, markInquiryHandled } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { SectionLoader } from '@/components/ui/Loading';
import { Check, Mail, Calendar, User } from 'lucide-react';

export function InquiriesPage() {
    const { inquiries, loading } = useInquiries();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleMarkHandled = async (inquiryId: string) => {
        if (!user) return;
        try {
            await markInquiryHandled(inquiryId, user.uid);
            showToast('Bericht gemarkeerd als afgehandeld', 'success');
        } catch (error) {
            showToast('Markeren mislukt', 'error');
        }
    };

    if (loading) return <SectionLoader />;

    const unhandledCount = inquiries.filter(i => !i.handled).length;

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-cream mb-2">Berichten</h1>
                        <p className="text-cream-warm">
                            {unhandledCount > 0
                                ? `${unhandledCount} nieuw bericht(en)`
                                : 'Geen nieuwe berichten'
                            }
                        </p>
                    </div>
                </div>

                {/* Inquiries List */}
                {inquiries.length === 0 ? (
                    <div className="admin-card text-center py-12">
                        <Mail className="w-12 h-12 text-slate-medium mx-auto mb-4" />
                        <p className="text-cream-warm">Nog geen berichten ontvangen.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {inquiries.map((inquiry) => (
                            <div
                                key={inquiry.id}
                                className={`admin-card transition-colors ${!inquiry.handled ? 'border-l-4 border-l-gold' : ''
                                    }`}
                            >
                                {/* Header */}
                                <div
                                    className="flex items-start justify-between cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <User className="w-4 h-4 text-slate-light" />
                                            <span className="text-cream font-medium">{inquiry.name}</span>
                                            {!inquiry.handled && (
                                                <span className="badge badge-draft">Nieuw</span>
                                            )}
                                            {inquiry.handled && (
                                                <span className="badge badge-handled">Afgehandeld</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-light">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {inquiry.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {inquiry.createdAt && new Date(inquiry.createdAt).toLocaleDateString('nl-NL', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {expandedId === inquiry.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-medium">
                                        <p className="text-cream-warm whitespace-pre-wrap mb-4">
                                            {inquiry.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <a
                                                href={`mailto:${inquiry.email}?subject=Re: Uw bericht aan I-Catching`}
                                                className="text-gold hover:text-gold-muted transition-colors text-sm"
                                            >
                                                Beantwoorden via e-mail →
                                            </a>

                                            {!inquiry.handled && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleMarkHandled(inquiry.id)}
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Markeer als afgehandeld
                                                </Button>
                                            )}
                                        </div>

                                        {inquiry.handled && inquiry.handledAt && (
                                            <p className="text-xs text-slate-light mt-4">
                                                Afgehandeld op {new Date(inquiry.handledAt).toLocaleDateString('nl-NL')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
