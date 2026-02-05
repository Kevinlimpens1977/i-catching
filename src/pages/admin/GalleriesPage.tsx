import { useState, useCallback, useRef, useEffect } from 'react';
import { useCategories, useGalleryItems, createCategory, updateCategory, deleteCategory, addGalleryItem, updateGalleryItem, deleteGalleryItem } from '@/hooks/useFirestore';
import { uploadImage, uploadBlob, generateImagePath } from '@/lib/storage';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { ImageUpload, ImageGalleryUpload } from '@/components/ui/ImageUpload';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { SectionLoader, LoadingSpinner } from '@/components/ui/Loading';
import { AIImageEditor } from '@/components/admin/AIImageEditor';
import { Plus, Settings, Trash2, Wand2 } from 'lucide-react';
import type { Category, GalleryItem, ImageVersion } from '@/lib/types';

export function GalleriesPage() {
    const { categories, loading } = useCategories();
    const { showToast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryModal, setCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // POST-HOC AI Editor (for existing items)
    const [aiEditorItem, setAiEditorItem] = useState<{ categoryId: string; item: GalleryItem } | null>(null);

    if (loading) return <SectionLoader />;

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-cream mb-2">Galerijen</h1>
                        <p className="text-cream-warm">Beheer categorieën en galerij afbeeldingen.</p>
                    </div>
                    <Button onClick={() => { setEditingCategory(null); setCategoryModal(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nieuwe categorie
                    </Button>
                </div>

                {/* Categories Grid */}
                {categories.length === 0 ? (
                    <div className="admin-card text-center py-12">
                        <p className="text-cream-warm mb-4">Nog geen categorieën aangemaakt.</p>
                        <Button onClick={() => setCategoryModal(true)}>
                            Eerste categorie maken
                        </Button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Category List */}
                        <div className="lg:col-span-1">
                            <div className="admin-card">
                                <h2 className="text-lg font-medium text-cream mb-4">Categorieën</h2>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedCategory(category)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedCategory(category);
                                                }
                                            }}
                                            className={`w-full text-left p-3 rounded-sm transition-colors cursor-pointer ${selectedCategory?.id === category.id
                                                ? 'bg-gold/10 border border-gold'
                                                : 'bg-surface-elevated hover:bg-slate-medium border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-cream font-medium">{category.title}</p>
                                                    <p className="text-slate-light text-xs">
                                                        {category.isLatexCouture ? 'Circulaire carousel' : 'Standaard grid'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCategory(category);
                                                        setCategoryModal(true);
                                                    }}
                                                    className="p-1 text-slate-light hover:text-cream"
                                                    aria-label={`Instellingen voor ${category.title}`}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Gallery Items */}
                        <div className="lg:col-span-2">
                            {selectedCategory ? (
                                <GalleryItemsPanel
                                    category={selectedCategory}
                                    onOpenAIEditor={(item) => setAiEditorItem({ categoryId: selectedCategory.id, item })}
                                />
                            ) : (
                                <div className="admin-card text-center py-12">
                                    <p className="text-cream-warm">Selecteer een categorie om de afbeeldingen te beheren.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Category Modal */}
            <CategoryModal
                isOpen={categoryModal}
                onClose={() => { setCategoryModal(false); setEditingCategory(null); }}
                category={editingCategory}
                onDelete={editingCategory ? () => setDeleteConfirm(editingCategory.id) : undefined}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={async () => {
                    if (deleteConfirm) {
                        try {
                            await deleteCategory(deleteConfirm);
                            showToast('Categorie verwijderd', 'success');
                            if (selectedCategory?.id === deleteConfirm) {
                                setSelectedCategory(null);
                            }
                            setCategoryModal(false);
                        } catch (error) {
                            showToast('Verwijderen mislukt', 'error');
                        }
                    }
                }}
                title="Categorie verwijderen?"
                message="Alle afbeeldingen in deze categorie worden ook verwijderd. Dit kan niet ongedaan worden gemaakt."
                confirmText="Verwijderen"
            />

            {/* POST-HOC AI Image Editor Modal (for existing items) */}
            {aiEditorItem && (
                <AIImageEditor
                    mode="post-hoc"
                    isOpen={true}
                    onClose={() => setAiEditorItem(null)}
                    categoryId={aiEditorItem.categoryId}
                    item={aiEditorItem.item}
                />
            )}
        </div>
    );
}

// Category Modal Component
function CategoryModal({
    isOpen,
    onClose,
    category,
    onDelete
}: {
    isOpen: boolean;
    onClose: () => void;
    category: Category | null;
    onDelete?: () => void;
}) {
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [intro, setIntro] = useState('');
    const [isLatexCouture, setIsLatexCouture] = useState(false);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Update state when category changes
    useEffect(() => {
        if (category) {
            setTitle(category.title);
            setIntro(category.intro);
            setIsLatexCouture(category.isLatexCouture);
        } else {
            setTitle('');
            setIntro('');
            setIsLatexCouture(false);
        }
        setCoverFile(null);
    }, [category, isOpen]);

    const handleSave = async () => {
        if (!title.trim()) {
            showToast('Titel is verplicht', 'error');
            return;
        }

        setSaving(true);
        try {
            let coverImage = category?.coverImage || '';
            if (coverFile) {
                const path = generateImagePath('gallery', coverFile.name);
                coverImage = await uploadImage(coverFile, path);
            }

            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            if (category) {
                await updateCategory(category.id, {
                    title,
                    slug,
                    intro,
                    isLatexCouture,
                    coverImage
                });
                showToast('Categorie bijgewerkt', 'success');
            } else {
                await createCategory({
                    title,
                    slug,
                    intro,
                    isLatexCouture,
                    coverImage,
                    order: 999 // Will be sorted later
                });
                showToast('Categorie aangemaakt', 'success');
            }
            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
            showToast('Opslaan mislukt', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={category ? 'Categorie bewerken' : 'Nieuwe categorie'}
            size="md"
        >
            <div className="space-y-4">
                <Input
                    label="Titel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <TextArea
                    label="Introductie"
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    rows={3}
                />
                <ImageUpload
                    label="Cover afbeelding"
                    value={category?.coverImage}
                    onChange={setCoverFile}
                />
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isLatexCouture}
                        onChange={(e) => setIsLatexCouture(e.target.checked)}
                        className="w-4 h-4 accent-gold"
                    />
                    <span className="text-cream-warm text-sm">
                        Toon als circulaire carousel (voor Latex Couture)
                    </span>
                </label>

                <div className="flex justify-between pt-4">
                    {onDelete && (
                        <Button variant="danger" onClick={onDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                        </Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button variant="ghost" onClick={onClose}>Annuleren</Button>
                        <Button onClick={handleSave} loading={saving}>Opslaan</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// ===========================================
// GALLERY ITEMS PANEL - With NanoBanana Gate
// ===========================================

interface PendingFile {
    file: File;
    objectUrl: string;
}

function GalleryItemsPanel({
    category,
    onOpenAIEditor
}: {
    category: Category;
    onOpenAIEditor: (item: GalleryItem) => void;
}) {
    const { items, loading } = useGalleryItems(category.id);
    const { showToast } = useToast();
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // NEW: Pre-persist NanoBanana gate state
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [currentEditIndex, setCurrentEditIndex] = useState(0);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Current file being edited
    const currentPending = pendingFiles[currentEditIndex];

    // Cleanup ObjectURLs on unmount or when files change
    useEffect(() => {
        return () => {
            pendingFiles.forEach(pf => {
                try { URL.revokeObjectURL(pf.objectUrl); } catch (e) { /* ignore */ }
            });
        };
    }, [pendingFiles]);

    // Handle file selection - opens NanoBanana immediately
    const handleFilesSelected = useCallback((files: File[]) => {
        // Create ObjectURLs for all files
        const pending: PendingFile[] = files.map(file => ({
            file,
            objectUrl: URL.createObjectURL(file)
        }));

        setPendingFiles(pending);
        setCurrentEditIndex(0);
        setIsEditorOpen(true);
    }, []);

    // Handle editor confirm - upload and save
    const handleEditorConfirm = useCallback(async (result: { mode: 'original' | 'ai'; blob: Blob }) => {
        if (!currentPending) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Generate path and upload
            const fileName = currentPending.file.name;
            const path = generateImagePath('gallery', fileName);

            const imageUrl = await uploadBlob(result.blob, path, (progress) => {
                setUploadProgress(progress);
            });

            // Create Firestore item
            const versionId = Date.now().toString();
            await addGalleryItem(category.id, {
                categoryId: category.id,
                imageUrl,
                imageVersions: [{
                    id: versionId,
                    url: imageUrl,
                    isActive: true,
                    isOriginal: result.mode === 'original',
                    createdAt: new Date()
                }],
                activeVersionId: versionId,
                order: items.length + currentEditIndex + 1
            });

            showToast('Afbeelding opgeslagen!', 'success');

            // Revoke the ObjectURL
            URL.revokeObjectURL(currentPending.objectUrl);

            // Move to next file or close
            if (currentEditIndex < pendingFiles.length - 1) {
                setCurrentEditIndex(prev => prev + 1);
                setIsUploading(false);
                setUploadProgress(0);
            } else {
                // All files processed
                setPendingFiles([]);
                setCurrentEditIndex(0);
                setIsEditorOpen(false);
                setIsUploading(false);
                setUploadProgress(0);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload mislukt. Probeer het opnieuw.', 'error');
            setIsUploading(false);
        }
    }, [currentPending, currentEditIndex, pendingFiles.length, category.id, items.length, showToast]);

    // Handle editor cancel
    const handleEditorClose = useCallback(() => {
        // Revoke all pending ObjectURLs
        pendingFiles.forEach(pf => {
            try { URL.revokeObjectURL(pf.objectUrl); } catch (e) { /* ignore */ }
        });

        setPendingFiles([]);
        setCurrentEditIndex(0);
        setIsEditorOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
    }, [pendingFiles]);

    const handleDelete = async (itemId: string) => {
        try {
            await deleteGalleryItem(category.id, itemId);
            showToast('Afbeelding verwijderd', 'success');
        } catch (error) {
            showToast('Verwijderen mislukt', 'error');
        }
    };

    const handleUpdateCaption = async (itemId: string, caption: string) => {
        try {
            await updateGalleryItem(category.id, itemId, { caption });
        } catch (error) {
            console.error('Error updating caption:', error);
        }
    };

    if (loading) return <SectionLoader />;

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-medium text-cream">{category.title}</h2>
                    {category.isLatexCouture && (
                        <p className="text-gold text-xs mt-1">
                            ✦ Circulaire carousel (max 6 afbeeldingen worden getoond)
                        </p>
                    )}
                </div>
                <span className="text-slate-light text-sm">{items.length} afbeeldingen</span>
            </div>

            {/* Upload Zone - Triggers NanoBanana Gate */}
            <div className="mb-6">
                <ImageGalleryUpload onUpload={handleFilesSelected} />
                {category.isLatexCouture && items.length >= 6 && (
                    <p className="text-amber-400 text-xs mt-2">
                        ⚠️ De circulaire gallerij toont maximaal 6 afbeeldingen. Nieuwe afbeeldingen worden opgeslagen maar niet getoond.
                    </p>
                )}
            </div>

            {/* Gallery Grid */}
            {items.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const activeVersion = item.imageVersions?.find(v => v.id === item.activeVersionId);
                        const imageUrl = activeVersion?.url || item.imageUrl;
                        const hasVersions = item.imageVersions && item.imageVersions.length > 1;

                        return (
                            <div key={item.id} className="group relative">
                                <div className="aspect-square bg-slate-dark overflow-hidden rounded-sm">
                                    <img
                                        src={imageUrl}
                                        alt={item.caption || ''}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Actions overlay */}
                                <div className="absolute inset-0 bg-anthracite/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onOpenAIEditor(item)}
                                    >
                                        <Wand2 className="w-4 h-4 mr-1" />
                                        AI bewerken
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteConfirm(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1 text-red-400" />
                                        Verwijderen
                                    </Button>
                                </div>

                                {/* Version indicator */}
                                {hasVersions && (
                                    <div className="absolute top-2 right-2 bg-gold/80 text-anthracite text-xs px-2 py-0.5 rounded-sm">
                                        {item.imageVersions?.length} versies
                                    </div>
                                )}

                                {/* Caption input */}
                                <input
                                    type="text"
                                    value={item.caption || ''}
                                    onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
                                    placeholder="Bijschrift..."
                                    className="w-full mt-2 px-2 py-1 bg-surface-elevated text-cream text-sm border border-slate-medium focus:border-gold focus:outline-none rounded-sm"
                                />
                            </div>
                        );
                    })}
                </div>
            )}

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
                title="Afbeelding verwijderen?"
                message="Deze actie kan niet ongedaan worden gemaakt."
                confirmText="Verwijderen"
            />

            {/* PRE-PERSIST AI Image Editor Modal */}
            {isEditorOpen && currentPending && (
                <>
                    <AIImageEditor
                        mode="pre-persist"
                        isOpen={isEditorOpen && !isUploading}
                        localBlob={currentPending.objectUrl}
                        onClose={handleEditorClose}
                        onConfirm={handleEditorConfirm}
                    />

                    {/* Upload Progress Modal */}
                    {isUploading && (
                        <Modal isOpen={true} onClose={() => { }} title="Uploaden..." size="sm">
                            <div className="text-center py-4">
                                <LoadingSpinner size="lg" />
                                <p className="text-cream-warm mt-4">Afbeelding wordt geüpload...</p>
                                <div className="mt-4 bg-slate-dark rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gold transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-slate-light mt-2">{uploadProgress}%</p>
                                {pendingFiles.length > 1 && (
                                    <p className="text-xs text-slate-light mt-2">
                                        Afbeelding {currentEditIndex + 1} van {pendingFiles.length}
                                    </p>
                                )}
                            </div>
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
}
