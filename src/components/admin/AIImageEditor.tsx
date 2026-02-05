import { useState, useCallback, useEffect } from 'react';
import { updateGalleryItem } from '@/hooks/useFirestore';
import { uploadBase64Image, generateAIImagePath } from '@/lib/storage';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Wand2, Check, X, ArrowLeft, ArrowRight, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { GalleryItem, ImageVersion } from '@/lib/types';

// ===========================================
// PRE-PERSIST MODE (New Upload Pipeline)
// ===========================================

export interface PrePersistEditorProps {
    mode: 'pre-persist';
    isOpen: boolean;
    localBlob: string | null;
    onClose: () => void;
    onConfirm: (result: { mode: 'original' | 'ai'; blob: Blob }) => void;
}

// ===========================================
// POST-HOC MODE (Existing Item Editing)
// ===========================================

export interface PostHocEditorProps {
    mode?: 'post-hoc';
    isOpen: boolean;
    onClose: () => void;
    categoryId: string;
    item: GalleryItem;
}

export type AIImageEditorProps = PrePersistEditorProps | PostHocEditorProps;

/**
 * AI Image Editor with two modes:
 * 
 * 1. PRE-PERSIST MODE (mode="pre-persist"):
 *    - Opens immediately after file selection
 *    - Works with local ObjectURL, NO Firebase writes
 *    - User must click "Use Original" or "Use AI Result" to confirm
 *    - Emits onConfirm with the final Blob for upload
 * 
 * 2. POST-HOC MODE (mode="post-hoc" or undefined):
 *    - Opens for already-persisted gallery items
 *    - Allows generating new AI versions
 *    - Saves directly to Firebase (existing behavior)
 */
export function AIImageEditor(props: AIImageEditorProps) {
    // Determine mode
    const isPrePersist = 'mode' in props && props.mode === 'pre-persist';

    if (isPrePersist) {
        return <PrePersistEditor {...(props as PrePersistEditorProps)} />;
    } else {
        return <PostHocEditor {...(props as PostHocEditorProps)} />;
    }
}

// ===========================================
// PRE-PERSIST EDITOR COMPONENT
// ===========================================

function PrePersistEditor({ isOpen, localBlob, onClose, onConfirm }: PrePersistEditorProps) {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setPrompt('');
            setGeneratedImage(null);
            setError(null);
            setGenerating(false);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            showToast('Voer een prompt in', 'error');
            return;
        }

        if (!localBlob) {
            showToast('Geen afbeelding beschikbaar', 'error');
            return;
        }

        setGenerating(true);
        setGeneratedImage(null);
        setError(null);

        try {
            // Convert localBlob (ObjectURL) to base64 for API
            const response = await fetch(localBlob);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);

            // Get auth token
            const token = await user?.getIdToken();

            // Call our secure backend proxy
            const apiResponse = await fetch('/api/openrouter/nanobanana', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    base64Image: base64,
                    prompt: prompt
                })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.text();
                throw new Error(errorData || 'AI generation failed');
            }

            const data = await apiResponse.json();

            // Handle backend contract: success:true/false
            if (data.success === false) {
                // Graceful failure - no exception, show error
                const errorMessage = data.error || 'Geen afbeelding gegenereerd';
                setError(errorMessage);
                showToast(errorMessage, 'error');
                return;
            }

            if (data.success === true && data.generatedImage) {
                setGeneratedImage(data.generatedImage);
                showToast('Afbeelding gegenereerd!', 'success');
            } else {
                // Unexpected response format
                setError('Onverwacht response formaat');
                showToast('Generatie mislukt', 'error');
            }
        } catch (err) {
            console.error('AI generation error:', err);
            const message = err instanceof Error ? err.message : 'Generatie mislukt';
            setError(message);
            showToast('Generatie mislukt. Probeer het opnieuw.', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleUseOriginal = async () => {
        if (!localBlob) return;

        try {
            const response = await fetch(localBlob);
            const blob = await response.blob();
            onConfirm({ mode: 'original', blob });
        } catch (err) {
            console.error('Error converting to blob:', err);
            showToast('Fout bij verwerken van afbeelding', 'error');
        }
    };

    const handleUseAIResult = async () => {
        if (!generatedImage) return;

        try {
            const blob = await base64ToBlob(generatedImage);
            onConfirm({ mode: 'ai', blob });
        } catch (err) {
            console.error('Error converting AI result to blob:', err);
            showToast('Fout bij verwerken van AI afbeelding', 'error');
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} title="Afbeelding Bewerken" size="xl">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div>
                    <h3 className="text-cream font-medium mb-3">Originele afbeelding</h3>
                    <div className="aspect-square bg-slate-dark rounded-sm overflow-hidden">
                        {localBlob ? (
                            <img
                                src={localBlob}
                                alt="Origineel"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-slate-light" />
                            </div>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        onClick={handleUseOriginal}
                        className="w-full mt-4"
                        disabled={!localBlob}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Origineel gebruiken
                    </Button>
                </div>

                {/* AI Generation */}
                <div>
                    <h3 className="text-cream font-medium mb-3">AI Bewerking</h3>

                    {/* Prompt Input */}
                    <TextArea
                        label="Beschrijf de gewenste aanpassing"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Bijv: zachter licht, meer latex glans, warmere tinten..."
                        rows={3}
                    />

                    <Button
                        onClick={handleGenerate}
                        loading={generating}
                        className="w-full mt-4"
                        disabled={!prompt.trim() || !localBlob}
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Genereren
                    </Button>

                    {/* Error State */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-300 text-sm">{error}</p>
                                <button
                                    onClick={handleGenerate}
                                    className="text-red-400 text-xs underline mt-1"
                                >
                                    Probeer opnieuw
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {generating && (
                        <div className="mt-6 aspect-square bg-slate-dark rounded-sm flex items-center justify-center">
                            <div className="text-center">
                                <LoadingSpinner size="lg" />
                                <p className="text-cream-warm mt-4">AI genereert afbeelding...</p>
                                <p className="text-slate-light text-sm mt-1">Dit kan even duren</p>
                            </div>
                        </div>
                    )}

                    {/* Generated Result */}
                    {generatedImage && !generating && (
                        <div className="mt-6">
                            <div className="aspect-square bg-slate-dark rounded-sm overflow-hidden">
                                <img
                                    src={generatedImage}
                                    alt="AI gegenereerd"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <Button
                                onClick={handleUseAIResult}
                                className="w-full mt-4"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                AI resultaat gebruiken
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Button */}
            <div className="mt-6 pt-4 border-t border-slate-medium flex justify-end">
                <Button variant="ghost" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Annuleren
                </Button>
            </div>
        </Modal>
    );
}

// ===========================================
// POST-HOC EDITOR COMPONENT (Existing Behavior)
// ===========================================

function PostHocEditor({ isOpen, onClose, categoryId, item }: PostHocEditorProps) {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

    const versions = item.imageVersions || [];
    const currentVersion = versions[currentVersionIndex];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            showToast('Voer een prompt in', 'error');
            return;
        }

        setGenerating(true);
        setGeneratedImage(null);

        try {
            const token = await user?.getIdToken();

            // Call our secure backend proxy
            const response = await fetch('/api/openrouter/nanobanana', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    imageUrl: currentVersion?.url || item.imageUrl,
                    prompt: prompt
                })
            });

            if (!response.ok) {
                throw new Error('AI generation failed');
            }

            const data = await response.json();

            // Handle backend contract: success:true/false
            if (data.success === false) {
                // Graceful failure - no exception, show error
                const errorMessage = data.error || 'Geen afbeelding gegenereerd';
                showToast(errorMessage, 'error');
                return;
            }

            if (data.success === true && data.generatedImage) {
                setGeneratedImage(data.generatedImage);
                showToast('Afbeelding gegenereerd!', 'success');
            } else {
                showToast('Generatie mislukt', 'error');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            showToast('Generatie mislukt. Probeer het opnieuw.', 'error');
            setGeneratedImage(null);
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveVersion = async () => {
        if (!generatedImage) return;

        setSaving(true);
        try {
            // Upload the generated image to Firebase Storage
            const path = generateAIImagePath(item.imageUrl, versions.length);
            const uploadedUrl = await uploadBase64Image(generatedImage, path);

            // Create new version
            const newVersion: ImageVersion = {
                id: Date.now().toString(),
                url: uploadedUrl,
                isActive: false,
                isOriginal: false,
                prompt: prompt,
                createdAt: new Date()
            };

            // Add to versions array
            const updatedVersions = [...versions, newVersion];

            await updateGalleryItem(categoryId, item.id, {
                imageVersions: updatedVersions
            });

            showToast('Versie opgeslagen!', 'success');
            setGeneratedImage(null);
            setPrompt('');
        } catch (error) {
            console.error('Error saving version:', error);
            showToast('Opslaan mislukt', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSetActiveVersion = async (versionId: string) => {
        try {
            // Update all versions to set isActive
            const updatedVersions = versions.map(v => ({
                ...v,
                isActive: v.id === versionId
            }));

            await updateGalleryItem(categoryId, item.id, {
                imageVersions: updatedVersions,
                activeVersionId: versionId
            });

            showToast('Actieve versie gewijzigd', 'success');
        } catch (error) {
            console.error('Error setting active version:', error);
            showToast('Wijzigen mislukt', 'error');
        }
    };

    const navigateVersion = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && currentVersionIndex > 0) {
            setCurrentVersionIndex(currentVersionIndex - 1);
        } else if (direction === 'next' && currentVersionIndex < versions.length - 1) {
            setCurrentVersionIndex(currentVersionIndex + 1);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Afbeelding Bewerken" size="xl">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Current/Source Image */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-cream font-medium">Bronafbeelding</h3>
                        {versions.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigateVersion('prev')}
                                    disabled={currentVersionIndex === 0}
                                    className="p-1 text-cream-warm disabled:opacity-30"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-slate-light">
                                    {currentVersionIndex + 1} / {versions.length}
                                </span>
                                <button
                                    onClick={() => navigateVersion('next')}
                                    disabled={currentVersionIndex === versions.length - 1}
                                    className="p-1 text-cream-warm disabled:opacity-30"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="aspect-square bg-slate-dark rounded-sm overflow-hidden">
                        <img
                            src={currentVersion?.url || item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-light">
                            {currentVersion?.isOriginal ? 'Origineel' : `AI gegenereerd`}
                        </span>
                        {currentVersion && currentVersion.id !== item.activeVersionId && (
                            <button
                                onClick={() => handleSetActiveVersion(currentVersion.id)}
                                className="text-xs text-gold hover:text-gold-muted"
                            >
                                Als actief instellen
                            </button>
                        )}
                        {currentVersion && currentVersion.id === item.activeVersionId && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Actief
                            </span>
                        )}
                    </div>
                    {currentVersion?.prompt && (
                        <p className="text-xs text-slate-light mt-2 italic">
                            Prompt: "{currentVersion.prompt}"
                        </p>
                    )}
                </div>

                {/* Generated Image / Controls */}
                <div>
                    <h3 className="text-cream font-medium mb-3">AI Bewerking</h3>

                    {/* Prompt Input */}
                    <TextArea
                        label="Beschrijf de gewenste aanpassing"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Bijv: zachter licht, meer latex glans, warmere tinten..."
                        rows={3}
                    />

                    <Button
                        onClick={handleGenerate}
                        loading={generating}
                        className="w-full mt-4"
                        disabled={!prompt.trim()}
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Genereren
                    </Button>

                    {/* Loading State */}
                    {generating && (
                        <div className="mt-6 aspect-square bg-slate-dark rounded-sm flex items-center justify-center">
                            <div className="text-center">
                                <LoadingSpinner size="lg" />
                                <p className="text-cream-warm mt-4">AI genereert afbeelding...</p>
                                <p className="text-slate-light text-sm mt-1">Dit kan even duren</p>
                            </div>
                        </div>
                    )}

                    {/* Generated Result */}
                    {generatedImage && !generating && (
                        <div className="mt-6">
                            <div className="aspect-square bg-slate-dark rounded-sm overflow-hidden">
                                <img
                                    src={generatedImage}
                                    alt="AI gegenereerd"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="mt-4 flex gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setGeneratedImage(null)}
                                    className="flex-1"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Annuleren
                                </Button>
                                <Button
                                    onClick={handleSaveVersion}
                                    loading={saving}
                                    className="flex-1"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Opslaan als versie
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Version History */}
                    {versions.length > 1 && !generating && !generatedImage && (
                        <div className="mt-6">
                            <h4 className="text-sm text-cream mb-3">Versie geschiedenis</h4>
                            <div className="flex gap-2 flex-wrap">
                                {versions.map((version, index) => (
                                    <button
                                        key={version.id}
                                        onClick={() => setCurrentVersionIndex(index)}
                                        className={`w-16 h-16 rounded-sm overflow-hidden border-2 transition-colors ${index === currentVersionIndex
                                            ? 'border-gold'
                                            : version.id === item.activeVersionId
                                                ? 'border-green-500'
                                                : 'border-transparent'
                                            }`}
                                    >
                                        <img
                                            src={version.url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
}
