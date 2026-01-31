import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogPost, createBlogPost, updateBlogPost } from '@/hooks/useFirestore';
import { uploadImage, generateImagePath } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TipTapEditor } from '@/components/ui/TipTapEditor';
import { SectionLoader } from '@/components/ui/Loading';
import { Save, ArrowLeft, Eye, Send } from 'lucide-react';

export function BlogPostEditorPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isNew = postId === 'new';

    const { post, loading } = useBlogPost(isNew ? '' : postId || '');

    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');

    useEffect(() => {
        if (post && !isNew) {
            setTitle(post.title);
            setExcerpt(post.excerpt);
            setBody(post.body);
            setStatus(post.status);
            setCoverPreview(post.coverImage || '');
        }
    }, [post, isNew]);

    const handleSave = async (publishNow: boolean = false) => {
        if (!user) return;
        if (!title.trim()) {
            showToast('Titel is verplicht', 'error');
            return;
        }

        setSaving(true);
        try {
            let coverImage = post?.coverImage || '';
            if (coverFile) {
                const path = generateImagePath('blog', coverFile.name);
                coverImage = await uploadImage(coverFile, path);
            }

            const slug = title.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .slice(0, 100);

            const newStatus = publishNow ? 'published' : status;
            const publishedAt = newStatus === 'published' && !post?.publishedAt
                ? new Date()
                : post?.publishedAt;

            const postData = {
                title,
                slug,
                excerpt,
                body,
                coverImage,
                status: newStatus,
                publishedAt,
                authorId: user.uid
            };

            if (isNew) {
                await createBlogPost(postData);
                showToast('Blogpost aangemaakt!', 'success');
            } else if (postId) {
                await updateBlogPost(postId, postData);
                showToast('Blogpost opgeslagen!', 'success');
            }

            navigate('/admin/posts');
        } catch (error) {
            console.error('Error saving post:', error);
            showToast('Opslaan mislukt', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isNew && loading) return <SectionLoader />;

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/posts')}
                            className="p-2 text-cream-warm hover:text-cream transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-serif text-cream">
                                {isNew ? 'Nieuwe blogpost' : 'Blogpost bewerken'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => handleSave(false)}
                            loading={saving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Opslaan als concept
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            loading={saving}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Publiceren
                        </Button>
                    </div>
                </div>

                {/* Editor Form */}
                <div className="space-y-6">
                    {/* Title */}
                    <div className="admin-card">
                        <Input
                            label="Titel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="De titel van je verhaal..."
                            className="text-xl"
                        />
                    </div>

                    {/* Cover Image */}
                    <div className="admin-card">
                        <ImageUpload
                            label="Cover afbeelding"
                            value={coverPreview}
                            onChange={(file) => {
                                setCoverFile(file);
                                if (file) {
                                    setCoverPreview(URL.createObjectURL(file));
                                }
                            }}
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="admin-card">
                        <TextArea
                            label="Korte samenvatting"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Een korte teaser die onder de titel verschijnt..."
                            rows={3}
                        />
                    </div>

                    {/* Body - TipTap Editor */}
                    <div className="admin-card">
                        <label className="label">Inhoud</label>
                        <TipTapEditor
                            content={body}
                            onChange={setBody}
                            placeholder="Begin te schrijven..."
                        />
                    </div>

                    {/* Status */}
                    <div className="admin-card">
                        <label className="label">Status</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={status === 'draft'}
                                    onChange={() => setStatus('draft')}
                                    className="accent-gold"
                                />
                                <span className="text-cream-warm">Concept</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={status === 'published'}
                                    onChange={() => setStatus('published')}
                                    className="accent-gold"
                                />
                                <span className="text-cream-warm">Gepubliceerd</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
