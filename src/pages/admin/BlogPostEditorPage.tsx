import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogPost, createBlogPost, updateBlogPost } from '@/hooks/useFirestore';
import { uploadBlob, generateImagePath } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useFieldSaver, type FieldSaveStatus } from '@/hooks/useFieldSaver';
import { FieldStatusIndicator, useUnsavedChangesWarning } from '@/components/ui/FieldStatus';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TipTapEditor } from '@/components/ui/TipTapEditor';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, LoadingSpinner } from '@/components/ui/Loading';
import { AIImageEditor } from '@/components/admin/AIImageEditor';
import { Save, ArrowLeft, Send } from 'lucide-react';



// ===========================================
// AUTOSAVE INPUT WRAPPER FOR BLOG
// ===========================================

interface AutosaveInputProps {
    label: string;
    value: string;
    fieldName: string;
    postId: string | null;
    onChange?: (value: string) => void;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

function AutosaveInput({
    label,
    value: initialValue,
    fieldName,
    postId,
    onChange,
    multiline = false,
    rows = 3,
    placeholder = '',
    className = '',
    disabled = false
}: AutosaveInputProps) {
    const [localValue, setLocalValue] = useState(initialValue);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(initialValue);
    }, [initialValue]);

    // Only use autosave if we have a postId (not new)
    const { status, lastSaved, error, retry } = useFieldSaver(
        'blogPosts',
        postId,
        fieldName,
        localValue,
        1500
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange?.(newValue);
    };

    const Component = multiline ? TextArea : Input;

    return (
        <div className={`form-group ${className}`}>
            <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{label}</label>
                {postId && <FieldStatusIndicator status={status} error={error} onRetry={retry} lastSaved={lastSaved} />}
            </div>
            <Component
                value={localValue}
                onChange={handleChange}
                rows={multiline ? rows : undefined}
                placeholder={placeholder}
                disabled={disabled}
                aria-label={label}
            />
        </div>
    );
}

// ===========================================
// TIPTAP EDITOR WITH AUTOSAVE
// ===========================================

interface AutosaveTipTapProps {
    content: string;
    postId: string | null;
    onChange?: (html: string) => void;
    placeholder?: string;
}

function AutosaveTipTap({ content: initialContent, postId, onChange, placeholder }: AutosaveTipTapProps) {
    const [localContent, setLocalContent] = useState(initialContent);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync with external content changes
    useEffect(() => {
        setLocalContent(initialContent);
    }, [initialContent]);

    // Autosave for body field
    const { status, lastSaved, error, retry } = useFieldSaver(
        'blogPosts',
        postId,
        'body',
        localContent,
        2000 // Longer debounce for body content
    );

    const handleChange = useCallback((html: string) => {
        setLocalContent(html);
        onChange?.(html);
    }, [onChange]);

    return (
        <div className="form-group">
            <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Inhoud</label>
                {postId && <FieldStatusIndicator status={status} error={error} onRetry={retry} lastSaved={lastSaved} />}
            </div>
            <TipTapEditor
                content={localContent}
                onChange={handleChange}
                placeholder={placeholder}
            />
        </div>
    );
}

// ===========================================
// COVER IMAGE WITH NANOBANANA GATE
// ===========================================

interface CoverImageFieldProps {
    currentUrl?: string;
    postId: string | null;
    onUrlChange?: (url: string) => void;
}

function CoverImageField({ currentUrl, postId, onUrlChange }: CoverImageFieldProps) {
    const { showToast } = useToast();

    // Pre-persist editor state
    const [pendingBlob, setPendingBlob] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [displayUrl, setDisplayUrl] = useState(currentUrl || '');

    // Update display when currentUrl changes
    useEffect(() => {
        setDisplayUrl(currentUrl || '');
    }, [currentUrl]);

    // Cleanup ObjectURL on unmount
    useEffect(() => {
        return () => {
            if (pendingBlob) {
                URL.revokeObjectURL(pendingBlob);
            }
        };
    }, [pendingBlob]);

    const handleOpenEditor = useCallback((blobUrl: string, file: File) => {
        setPendingBlob(blobUrl);
        setPendingFile(file);
        setIsEditorOpen(true);
    }, []);

    const handleEditorConfirm = useCallback(async (result: { mode: 'original' | 'ai'; blob: Blob }) => {
        if (!pendingFile) return;

        setIsEditorOpen(false);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const path = generateImagePath('blog', pendingFile.name);
            const imageUrl = await uploadBlob(result.blob, path, (progress) => {
                setUploadProgress(progress);
            });

            // If we have a postId, update the field directly
            if (postId) {
                await updateBlogPost(postId, { coverImage: imageUrl });
            }

            setDisplayUrl(imageUrl);
            onUrlChange?.(imageUrl);
            showToast('Cover afbeelding opgeslagen!', 'success');
        } catch (error) {
            console.error('Cover image upload error:', error);
            showToast('Upload mislukt', 'error');
        } finally {
            // Cleanup
            if (pendingBlob) {
                URL.revokeObjectURL(pendingBlob);
            }
            setPendingBlob(null);
            setPendingFile(null);
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [postId, pendingFile, pendingBlob, onUrlChange, showToast]);

    const handleEditorClose = useCallback(() => {
        if (pendingBlob) {
            URL.revokeObjectURL(pendingBlob);
        }
        setPendingBlob(null);
        setPendingFile(null);
        setIsEditorOpen(false);
    }, [pendingBlob]);

    return (
        <>
            <ImageUpload
                label="Cover afbeelding"
                value={displayUrl}
                onChange={() => { }} // Not used with onOpenEditor
                onOpenEditor={handleOpenEditor}
            />

            {/* Pre-persist AI Editor */}
            {isEditorOpen && pendingBlob && (
                <AIImageEditor
                    mode="pre-persist"
                    isOpen={isEditorOpen}
                    localBlob={pendingBlob}
                    onClose={handleEditorClose}
                    onConfirm={handleEditorConfirm}
                />
            )}

            {/* Upload Progress Modal */}
            {isUploading && (
                <Modal isOpen={true} onClose={() => { }} title="Uploaden..." size="sm">
                    <div className="text-center py-4">
                        <LoadingSpinner size="lg" />
                        <p className="text-cream-warm mt-4">Cover wordt geüpload...</p>
                        <div className="mt-4 bg-slate-dark rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gold transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-slate-light mt-2">{uploadProgress}%</p>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ===========================================
// MAIN BLOG POST EDITOR PAGE
// ===========================================

export function BlogPostEditorPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isNew = postId === 'new';

    const { post, loading } = useBlogPost(isNew ? '' : postId || '');

    // Local state for new posts (before first save)
    const [localTitle, setLocalTitle] = useState('');
    const [localExcerpt, setLocalExcerpt] = useState('');
    const [localBody, setLocalBody] = useState('');
    const [localStatus, setLocalStatus] = useState<'draft' | 'published'>('draft');
    const [localCoverUrl, setLocalCoverUrl] = useState('');
    const [creating, setCreating] = useState(false);

    // The actual postId to use (null for new posts until created)
    const effectivePostId = isNew ? null : postId || null;

    // Initialize local state from post data
    useEffect(() => {
        if (post && !isNew) {
            setLocalTitle(post.title);
            setLocalExcerpt(post.excerpt);
            setLocalBody(post.body);
            setLocalStatus(post.status);
            setLocalCoverUrl(post.coverImage || '');
        }
    }, [post, isNew]);

    // Create new post (for new posts only)
    const handleCreatePost = async (publishNow: boolean = false) => {
        if (!user) return;
        if (!localTitle.trim()) {
            showToast('Titel is verplicht', 'error');
            return;
        }

        setCreating(true);
        try {
            const slug = localTitle.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .slice(0, 100);

            const newStatus = publishNow ? 'published' : localStatus;
            const publishedAt = newStatus === 'published' ? new Date() : undefined;

            const postData = {
                title: localTitle,
                slug,
                excerpt: localExcerpt,
                body: localBody,
                coverImage: localCoverUrl,
                status: newStatus,
                publishedAt,
                authorId: user.uid
            };

            await createBlogPost(postData);
            showToast('Blogpost aangemaakt!', 'success');
            navigate('/admin/posts');
        } catch (error) {
            console.error('Error creating post:', error);
            showToast('Aanmaken mislukt', 'error');
        } finally {
            setCreating(false);
        }
    };

    // Publish existing post
    const handlePublish = async () => {
        if (!effectivePostId) {
            await handleCreatePost(true);
            return;
        }

        try {
            await updateBlogPost(effectivePostId, {
                status: 'published',
                publishedAt: post?.publishedAt || new Date()
            });
            showToast('Blogpost gepubliceerd!', 'success');
            navigate('/admin/posts');
        } catch (error) {
            console.error('Error publishing post:', error);
            showToast('Publiceren mislukt', 'error');
        }
    };

    // Handle status change
    const handleStatusChange = async (newStatus: 'draft' | 'published') => {
        setLocalStatus(newStatus);

        if (effectivePostId) {
            try {
                const updates: { status: 'draft' | 'published'; publishedAt?: Date } = { status: newStatus };
                if (newStatus === 'published' && !post?.publishedAt) {
                    updates.publishedAt = new Date();
                }
                await updateBlogPost(effectivePostId, updates);
            } catch (error) {
                console.error('Error updating status:', error);
            }
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
                            aria-label="Terug naar overzicht"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-serif text-cream">
                                {isNew ? 'Nieuwe blogpost' : 'Blogpost bewerken'}
                            </h1>
                            {!isNew && (
                                <p className="text-xs text-slate-light mt-1">
                                    Wijzigingen worden automatisch opgeslagen
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {isNew ? (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleCreatePost(false)}
                                    loading={creating}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Opslaan als concept
                                </Button>
                                <Button
                                    onClick={() => handleCreatePost(true)}
                                    loading={creating}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Publiceren
                                </Button>
                            </>
                        ) : (
                            localStatus === 'draft' && (
                                <Button onClick={handlePublish}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Publiceren
                                </Button>
                            )
                        )}
                    </div>
                </div>

                {/* Editor Form */}
                <div className="space-y-6">
                    {/* Title */}
                    <div className="admin-card">
                        {isNew ? (
                            <div className="form-group">
                                <label className="label">Titel</label>
                                <Input
                                    value={localTitle}
                                    onChange={(e) => setLocalTitle(e.target.value)}
                                    placeholder="De titel van je verhaal..."
                                />
                            </div>
                        ) : (
                            <AutosaveInput
                                label="Titel"
                                value={localTitle}
                                fieldName="title"
                                postId={effectivePostId}
                                onChange={setLocalTitle}
                                placeholder="De titel van je verhaal..."
                            />
                        )}
                    </div>

                    {/* Cover Image */}
                    <div className="admin-card">
                        <CoverImageField
                            currentUrl={localCoverUrl}
                            postId={effectivePostId}
                            onUrlChange={setLocalCoverUrl}
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="admin-card">
                        {isNew ? (
                            <div className="form-group">
                                <label className="label">Korte samenvatting</label>
                                <TextArea
                                    value={localExcerpt}
                                    onChange={(e) => setLocalExcerpt(e.target.value)}
                                    placeholder="Een korte teaser die onder de titel verschijnt..."
                                    rows={3}
                                />
                            </div>
                        ) : (
                            <AutosaveInput
                                label="Korte samenvatting"
                                value={localExcerpt}
                                fieldName="excerpt"
                                postId={effectivePostId}
                                onChange={setLocalExcerpt}
                                multiline
                                rows={3}
                                placeholder="Een korte teaser die onder de titel verschijnt..."
                            />
                        )}
                    </div>

                    {/* Body - TipTap Editor */}
                    <div className="admin-card">
                        {isNew ? (
                            <div className="form-group">
                                <label className="label">Inhoud</label>
                                <TipTapEditor
                                    content={localBody}
                                    onChange={setLocalBody}
                                    placeholder="Begin te schrijven..."
                                />
                            </div>
                        ) : (
                            <AutosaveTipTap
                                content={localBody}
                                postId={effectivePostId}
                                onChange={setLocalBody}
                                placeholder="Begin te schrijven..."
                            />
                        )}
                    </div>

                    {/* Status */}
                    <div className="admin-card">
                        <label className="label">Status</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={localStatus === 'draft'}
                                    onChange={() => handleStatusChange('draft')}
                                    className="accent-gold"
                                />
                                <span className="text-cream-warm">Concept</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={localStatus === 'published'}
                                    onChange={() => handleStatusChange('published')}
                                    className="accent-gold"
                                />
                                <span className="text-cream-warm">Gepubliceerd</span>
                            </label>
                        </div>
                        {post?.publishedAt && (
                            <p className="text-xs text-slate-light mt-2">
                                Gepubliceerd op: {new Date(post.publishedAt).toLocaleDateString('nl-NL')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
