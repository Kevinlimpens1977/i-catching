import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlogPosts, deleteBlogPost } from '@/hooks/useFirestore';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { SectionLoader } from '@/components/ui/Loading';
import { Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react';

export function BlogPostsPage() {
    const { posts, loading } = useBlogPosts();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleDelete = async (postId: string) => {
        try {
            await deleteBlogPost(postId);
            showToast('Blogpost verwijderd', 'success');
        } catch (error) {
            showToast('Verwijderen mislukt', 'error');
        }
    };

    if (loading) return <SectionLoader />;

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-cream mb-2">Blogposts</h1>
                        <p className="text-cream-warm">Beheer verhalen en artikelen.</p>
                    </div>
                    <Link to="/admin/posts/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nieuwe blogpost
                        </Button>
                    </Link>
                </div>

                {/* Posts List */}
                {posts.length === 0 ? (
                    <div className="admin-card text-center py-12">
                        <p className="text-cream-warm mb-4">Nog geen blogposts aangemaakt.</p>
                        <Link to="/admin/posts/new">
                            <Button>Eerste post schrijven</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="admin-card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Titel</th>
                                    <th>Status</th>
                                    <th>Datum</th>
                                    <th className="text-right">Acties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post.id}>
                                        <td>
                                            <div className="flex items-center gap-4">
                                                {post.coverImage && (
                                                    <img
                                                        src={post.coverImage}
                                                        alt=""
                                                        className="w-16 h-12 object-cover rounded-sm"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-cream font-medium">{post.title}</p>
                                                    <p className="text-slate-light text-sm line-clamp-1">
                                                        {post.excerpt}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                                                {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-slate-light text-sm">
                                                <Calendar className="w-4 h-4" />
                                                {post.publishedAt
                                                    ? new Date(post.publishedAt).toLocaleDateString('nl-NL')
                                                    : 'Niet gepubliceerd'
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/posts/${post.id}`)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteConfirm(post.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => {
                    if (deleteConfirm) {
                        handleDelete(deleteConfirm);
                        setDeleteConfirm(null);
                    }
                }}
                title="Blogpost verwijderen?"
                message="Deze actie kan niet ongedaan worden gemaakt."
                confirmText="Verwijderen"
            />
        </div>
    );
}
