import { useEffect } from 'react';
import { useSiteContent, useCategories, useBlogPosts, useInquiries, seedDatabase } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { FileText, Image, BookOpen, MessageSquare, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
    const { user } = useAuth();
    const { content } = useSiteContent();
    const { categories } = useCategories();
    const { posts } = useBlogPosts();
    const { inquiries } = useInquiries();
    const { showToast } = useToast();

    const unhandledInquiries = inquiries.filter(i => !i.handled).length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const draftPosts = posts.filter(p => p.status === 'draft').length;

    const handleSeedDatabase = async () => {
        if (!user) return;
        try {
            await seedDatabase(user.uid);
            showToast('Database succesvol geïnitialiseerd!', 'success');
        } catch (error) {
            console.error('Seeding error:', error);
            showToast('Er ging iets mis bij het initialiseren.', 'error');
        }
    };

    const stats = [
        {
            label: 'Site Content',
            value: content ? 'Ingesteld' : 'Niet ingesteld',
            icon: FileText,
            href: '/admin/content',
            color: content ? 'text-green-400' : 'text-amber-400'
        },
        {
            label: 'Categorieën',
            value: categories.length,
            icon: Image,
            href: '/admin/galleries',
            color: 'text-gold'
        },
        {
            label: 'Blogposts',
            value: `${publishedPosts} gepubliceerd / ${draftPosts} concept`,
            icon: BookOpen,
            href: '/admin/posts',
            color: 'text-petrol'
        },
        {
            label: 'Nieuwe berichten',
            value: unhandledInquiries,
            icon: MessageSquare,
            href: '/admin/inquiries',
            color: unhandledInquiries > 0 ? 'text-bordeaux' : 'text-slate-light'
        }
    ];

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif text-cream mb-2">Dashboard</h1>
                    <p className="text-cream-warm">Welkom terug. Beheer hier de website content.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => (
                        <Link
                            key={stat.label}
                            to={stat.href}
                            className="admin-card hover:bg-surface-elevated transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <p className="text-cream text-2xl font-medium">{stat.value}</p>
                            <p className="text-slate-light text-sm mt-1">{stat.label}</p>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="admin-card">
                    <h2 className="text-lg font-medium text-cream mb-4">Snelle acties</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/admin/posts/new">
                            <Button variant="secondary" size="sm">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Nieuwe blogpost
                            </Button>
                        </Link>
                        <Link to="/admin/galleries">
                            <Button variant="secondary" size="sm">
                                <Image className="w-4 h-4 mr-2" />
                                Galerij beheren
                            </Button>
                        </Link>
                        {!content && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSeedDatabase}
                            >
                                <Database className="w-4 h-4 mr-2" />
                                Database initialiseren
                            </Button>
                        )}
                    </div>
                </div>

                {/* Recent Inquiries */}
                {inquiries.length > 0 && (
                    <div className="admin-card mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-cream">Recente berichten</h2>
                            <Link
                                to="/admin/inquiries"
                                className="text-sm text-gold-muted hover:text-gold transition-colors"
                            >
                                Bekijk alle →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {inquiries.slice(0, 3).map((inquiry) => (
                                <div
                                    key={inquiry.id}
                                    className={`flex items-center justify-between py-3 border-b border-slate-medium/50 last:border-0 ${!inquiry.handled ? 'bg-gold/5 -mx-4 px-4 rounded-sm' : ''
                                        }`}
                                >
                                    <div>
                                        <p className="text-cream font-medium">{inquiry.name}</p>
                                        <p className="text-slate-light text-sm truncate max-w-md">
                                            {inquiry.message}
                                        </p>
                                    </div>
                                    <span className={`badge ${inquiry.handled ? 'badge-handled' : 'badge-draft'}`}>
                                        {inquiry.handled ? 'Afgehandeld' : 'Nieuw'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
