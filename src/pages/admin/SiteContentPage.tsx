import { useState, useEffect, useCallback, useRef } from 'react';
import { useSiteContent, updateSiteContentField } from '@/hooks/useFirestore';
import { uploadBlob, generateImagePath } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useFieldSaver, type FieldSaveStatus } from '@/hooks/useFieldSaver';
import { FieldStatusIndicator, useUnsavedChangesWarning } from '@/components/ui/FieldStatus';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, LoadingSpinner } from '@/components/ui/Loading';
import { AIImageEditor } from '@/components/admin/AIImageEditor';
import { Plus, Trash2 } from 'lucide-react';
import type { SiteContent, WerkwijzeStep } from '@/lib/types';


// ===========================================
// AUTOSAVE INPUT WRAPPER (For simple fields)
// ===========================================

interface AutosaveInputProps {
    label: string;
    value: string;
    fieldName: string;
    docId: string;
    collectionPath: string;
    multiline?: boolean;
    rows?: number;
    className?: string;
}

function AutosaveInput({
    label,
    value: initialValue,
    fieldName,
    docId,
    collectionPath,
    multiline = false,
    rows = 4,
    className = ''
}: AutosaveInputProps) {
    const [localValue, setLocalValue] = useState(initialValue);

    // Sync with external value changes (e.g., Firestore updates)
    useEffect(() => {
        setLocalValue(initialValue);
    }, [initialValue]);

    const { status, lastSaved, error, retry } = useFieldSaver(
        collectionPath,
        docId,
        fieldName,
        localValue,
        1500
    );

    const Component = multiline ? TextArea : Input;

    return (
        <div className={`form-group ${className}`}>
            <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{label}</label>
                <FieldStatusIndicator status={status} error={error} onRetry={retry} lastSaved={lastSaved} />
            </div>
            <Component
                value={localValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocalValue(e.target.value)}
                rows={multiline ? rows : undefined}
                aria-label={label}
            />
        </div>
    );
}

// ===========================================
// AUTOSAVE INPUT FOR NESTED FIELDS (dot notation)
// ===========================================

interface AutosaveNestedInputProps {
    label: string;
    value: string;
    parentField: string;
    nestedKey: string;
}

function AutosaveNestedInput({
    label,
    value: initialValue,
    parentField,
    nestedKey
}: AutosaveNestedInputProps) {
    const [localValue, setLocalValue] = useState(initialValue);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(initialValue);
    }, [initialValue]);

    // Use dot notation for nested field: e.g., "irisContactInfo.email"
    const fieldPath = `${parentField}.${nestedKey}`;

    const { status, lastSaved, error, retry } = useFieldSaver(
        'siteContent',
        'main',
        fieldPath,
        localValue,
        1500
    );

    return (
        <div className="form-group">
            <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{label}</label>
                <FieldStatusIndicator status={status} error={error} onRetry={retry} lastSaved={lastSaved} />
            </div>
            <Input
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                aria-label={label}
            />
        </div>
    );
}

// ===========================================
// IMAGE UPLOAD WITH NANOBANANA GATE
// ===========================================

interface ImageFieldProps {
    label: string;
    currentUrl?: string;
    fieldName: string;
    category: 'hero' | 'atelier' | 'portraits';
}

function ImageField({ label, currentUrl, fieldName, category }: ImageFieldProps) {
    const { user } = useAuth();
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
        if (!user || !pendingFile) return;

        setIsEditorOpen(false);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const path = generateImagePath(category, pendingFile.name);
            const imageUrl = await uploadBlob(result.blob, path, (progress) => {
                setUploadProgress(progress);
            });

            // Update single field in Firestore
            await updateSiteContentField(fieldName, imageUrl, user.uid);

            setDisplayUrl(imageUrl);
            showToast('Afbeelding opgeslagen!', 'success');
        } catch (error) {
            console.error('Image upload error:', error);
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
    }, [user, pendingFile, pendingBlob, category, fieldName, showToast]);

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
                label={label}
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
                        <p className="text-cream-warm mt-4">Afbeelding wordt geüpload...</p>
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
// ARRAY ITEM AUTOSAVE HOOK
// ===========================================

/**
 * Custom hook for autosaving individual fields within an array item.
 * When a field changes, it updates the entire array with the new value.
 */
function useArrayItemSaver(
    fieldName: string,
    getFullArray: () => unknown[],
    index: number,
    itemKey: string,
    value: string,
    debounceMs: number = 1500
) {
    const { user } = useAuth();
    const [status, setStatus] = useState<FieldSaveStatus>('idle');
    const [error, setError] = useState<Error | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const initialValueRef = useRef(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestValueRef = useRef(value);
    const latestArrayRef = useRef(getFullArray);

    // Update refs
    latestValueRef.current = value;
    latestArrayRef.current = getFullArray;

    const save = useCallback(async () => {
        if (!user) return;

        setStatus('saving');
        setError(null);

        try {
            const currentArray = latestArrayRef.current();
            const updatedArray = [...currentArray];

            // Update the specific item's field
            if (updatedArray[index] && typeof updatedArray[index] === 'object') {
                (updatedArray[index] as Record<string, unknown>)[itemKey] = latestValueRef.current;
            } else if (typeof updatedArray[index] === 'string') {
                // For simple string arrays
                updatedArray[index] = latestValueRef.current;
            }

            await updateSiteContentField(fieldName, updatedArray, user.uid);

            initialValueRef.current = latestValueRef.current;
            setStatus('saved');
            setLastSaved(new Date());
        } catch (err) {
            console.error(`Error saving ${fieldName}[${index}].${itemKey}:`, err);
            setError(err instanceof Error ? err : new Error('Save failed'));
            setStatus('error');
        }
    }, [user, fieldName, index, itemKey]);

    const retry = useCallback(() => {
        save();
    }, [save]);

    // Effect to handle debounced saving
    useEffect(() => {
        // Skip if value hasn't changed from initial
        if (value === initialValueRef.current) {
            return;
        }

        setStatus('dirty');

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new debounce timeout
        debounceRef.current = setTimeout(() => {
            save();
        }, debounceMs);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [value, debounceMs, save]);

    return { status, error, lastSaved, retry };
}

// ===========================================
// WERKWIJZE STEP ROW (Per-field autosave)
// ===========================================

interface WerkwijzeStepRowProps {
    step: WerkwijzeStep;
    index: number;
    getFullArray: () => WerkwijzeStep[];
    onRemove: () => void;
    onLocalUpdate: (index: number, field: keyof WerkwijzeStep, value: string) => void;
}

function WerkwijzeStepRow({ step, index, getFullArray, onRemove, onLocalUpdate }: WerkwijzeStepRowProps) {
    const [localTitle, setLocalTitle] = useState(step.title);
    const [localDescription, setLocalDescription] = useState(step.description);

    // Sync with external changes
    useEffect(() => {
        setLocalTitle(step.title);
    }, [step.title]);

    useEffect(() => {
        setLocalDescription(step.description);
    }, [step.description]);

    // Autosave for title
    const titleSaver = useArrayItemSaver(
        'werkwijzeSteps',
        getFullArray,
        index,
        'title',
        localTitle,
        1500
    );

    // Autosave for description
    const descSaver = useArrayItemSaver(
        'werkwijzeSteps',
        getFullArray,
        index,
        'description',
        localDescription,
        1500
    );

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalTitle(newValue);
        onLocalUpdate(index, 'title', newValue);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalDescription(newValue);
        onLocalUpdate(index, 'description', newValue);
    };

    return (
        <div className="bg-surface-elevated p-4 rounded-sm">
            <div className="flex items-center justify-between mb-3">
                <span className="text-gold text-sm">Stap {index + 1}</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    aria-label={`Verwijder stap ${index + 1}`}
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="form-group">
                    <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Titel</label>
                        <FieldStatusIndicator
                            status={titleSaver.status}
                            error={titleSaver.error}
                            onRetry={titleSaver.retry}
                            lastSaved={titleSaver.lastSaved}
                        />
                    </div>
                    <Input
                        value={localTitle}
                        onChange={handleTitleChange}
                        aria-label={`Stap ${index + 1} titel`}
                    />
                </div>
                <div className="form-group">
                    <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Beschrijving</label>
                        <FieldStatusIndicator
                            status={descSaver.status}
                            error={descSaver.error}
                            onRetry={descSaver.retry}
                            lastSaved={descSaver.lastSaved}
                        />
                    </div>
                    <Input
                        value={localDescription}
                        onChange={handleDescriptionChange}
                        aria-label={`Stap ${index + 1} beschrijving`}
                    />
                </div>
            </div>
        </div>
    );
}

// ===========================================
// WERKWIJZE EDITOR (Atomic per-field)
// ===========================================

interface WerkwijzeEditorProps {
    steps: WerkwijzeStep[];
    onStepsChange: (steps: WerkwijzeStep[]) => void;
}

function WerkwijzeEditor({ steps, onStepsChange }: WerkwijzeEditorProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [localSteps, setLocalSteps] = useState(steps);

    // Sync with external changes
    useEffect(() => {
        setLocalSteps(steps);
    }, [steps]);

    // Getter for the current array state (used by child components)
    const getFullArray = useCallback(() => localSteps, [localSteps]);

    const handleLocalUpdate = useCallback((index: number, field: keyof WerkwijzeStep, value: string) => {
        setLocalSteps(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }, []);

    const addStep = async () => {
        if (!user) return;

        const newStep: WerkwijzeStep = {
            id: Date.now().toString(),
            title: '',
            description: '',
            order: localSteps.length + 1
        };

        const updatedSteps = [...localSteps, newStep];
        setLocalSteps(updatedSteps);

        try {
            await updateSiteContentField('werkwijzeSteps', updatedSteps, user.uid);
            onStepsChange(updatedSteps);
        } catch (error) {
            console.error('Error adding step:', error);
            showToast('Stap toevoegen mislukt', 'error');
            setLocalSteps(localSteps); // Revert
        }
    };

    const removeStep = async (index: number) => {
        if (!user) return;

        const updatedSteps = localSteps.filter((_, i) => i !== index);
        setLocalSteps(updatedSteps);

        try {
            await updateSiteContentField('werkwijzeSteps', updatedSteps, user.uid);
            onStepsChange(updatedSteps);
            showToast('Stap verwijderd', 'success');
        } catch (error) {
            console.error('Error removing step:', error);
            showToast('Verwijderen mislukt', 'error');
            setLocalSteps(localSteps); // Revert
        }
    };

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-cream">Werkwijze stappen</h2>
                <Button type="button" variant="secondary" size="sm" onClick={addStep}>
                    <Plus className="w-4 h-4 mr-1" /> Stap toevoegen
                </Button>
            </div>
            <div className="space-y-4">
                {localSteps.map((step, index) => (
                    <WerkwijzeStepRow
                        key={step.id}
                        step={step}
                        index={index}
                        getFullArray={getFullArray}
                        onRemove={() => removeStep(index)}
                        onLocalUpdate={handleLocalUpdate}
                    />
                ))}
                {localSteps.length === 0 && (
                    <p className="text-slate-light text-sm text-center py-4">
                        Geen stappen. Klik op "Stap toevoegen" om te beginnen.
                    </p>
                )}
            </div>
        </div>
    );
}

// ===========================================
// HIGHLIGHT ROW (Per-item autosave)
// ===========================================

interface HighlightRowProps {
    value: string;
    index: number;
    getFullArray: () => string[];
    onRemove: () => void;
    onLocalUpdate: (index: number, value: string) => void;
}

function HighlightRow({ value, index, getFullArray, onRemove, onLocalUpdate }: HighlightRowProps) {
    const [localValue, setLocalValue] = useState(value);

    // Sync with external changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Autosave for this highlight
    const saver = useArrayItemSaver(
        'atelierHighlights',
        getFullArray,
        index,
        '', // Not used for simple string arrays
        localValue,
        1500
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onLocalUpdate(index, newValue);
    };

    return (
        <div className="flex gap-2 items-start">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-light">Highlight {index + 1}</span>
                    <FieldStatusIndicator
                        status={saver.status}
                        error={saver.error}
                        onRetry={saver.retry}
                        lastSaved={saver.lastSaved}
                    />
                </div>
                <Input
                    value={localValue}
                    onChange={handleChange}
                    aria-label={`Highlight ${index + 1}`}
                />
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="mt-6"
                aria-label={`Verwijder highlight ${index + 1}`}
            >
                <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
        </div>
    );
}

// ===========================================
// HIGHLIGHTS EDITOR (Atomic per-field)
// ===========================================

interface HighlightsEditorProps {
    highlights: string[];
    onHighlightsChange: (highlights: string[]) => void;
}

function HighlightsEditor({ highlights, onHighlightsChange }: HighlightsEditorProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [localHighlights, setLocalHighlights] = useState(highlights);

    // Sync with external changes
    useEffect(() => {
        setLocalHighlights(highlights);
    }, [highlights]);

    // Getter for the current array state
    const getFullArray = useCallback(() => localHighlights, [localHighlights]);

    const handleLocalUpdate = useCallback((index: number, value: string) => {
        setLocalHighlights(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    }, []);

    const addHighlight = async () => {
        if (!user) return;

        const updatedHighlights = [...localHighlights, ''];
        setLocalHighlights(updatedHighlights);

        try {
            await updateSiteContentField('atelierHighlights', updatedHighlights, user.uid);
            onHighlightsChange(updatedHighlights);
        } catch (error) {
            console.error('Error adding highlight:', error);
            showToast('Toevoegen mislukt', 'error');
            setLocalHighlights(localHighlights); // Revert
        }
    };

    const removeHighlight = async (index: number) => {
        if (!user) return;

        const updatedHighlights = localHighlights.filter((_, i) => i !== index);
        setLocalHighlights(updatedHighlights);

        try {
            await updateSiteContentField('atelierHighlights', updatedHighlights, user.uid);
            onHighlightsChange(updatedHighlights);
            showToast('Highlight verwijderd', 'success');
        } catch (error) {
            console.error('Error removing highlight:', error);
            showToast('Verwijderen mislukt', 'error');
            setLocalHighlights(localHighlights); // Revert
        }
    };

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <label className="label mb-0">Highlights</label>
                <Button type="button" variant="ghost" size="sm" onClick={addHighlight}>
                    <Plus className="w-4 h-4 mr-1" /> Toevoegen
                </Button>
            </div>
            <div className="space-y-3">
                {localHighlights.map((highlight, index) => (
                    <HighlightRow
                        key={index}
                        value={highlight}
                        index={index}
                        getFullArray={getFullArray}
                        onRemove={() => removeHighlight(index)}
                        onLocalUpdate={handleLocalUpdate}
                    />
                ))}
                {localHighlights.length === 0 && (
                    <p className="text-slate-light text-sm text-center py-2">
                        Geen highlights. Klik op "Toevoegen" om te beginnen.
                    </p>
                )}
            </div>
        </div>
    );
}

// ===========================================
// CONTACT INFO EDITOR (Atomic per-field with dot notation)
// ===========================================

interface ContactInfoEditorProps {
    contactInfo: {
        email?: string;
        phone?: string;
        instagram?: string;
        location?: string;
    };
}

function ContactInfoEditor({ contactInfo }: ContactInfoEditorProps) {
    return (
        <div className="mt-4">
            <h3 className="text-sm text-cream-warm mb-4">Contactgegevens</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <AutosaveNestedInput
                    label="E-mail"
                    value={contactInfo.email || ''}
                    parentField="irisContactInfo"
                    nestedKey="email"
                />
                <AutosaveNestedInput
                    label="Instagram"
                    value={contactInfo.instagram || ''}
                    parentField="irisContactInfo"
                    nestedKey="instagram"
                />
                <AutosaveNestedInput
                    label="Locatie"
                    value={contactInfo.location || ''}
                    parentField="irisContactInfo"
                    nestedKey="location"
                />
                <AutosaveNestedInput
                    label="Telefoon"
                    value={contactInfo.phone || ''}
                    parentField="irisContactInfo"
                    nestedKey="phone"
                />
            </div>
        </div>
    );
}

// ===========================================
// MAIN SITE CONTENT PAGE
// ===========================================

export function SiteContentPage() {
    const { content, loading } = useSiteContent();
    const [werkwijzeSteps, setWerkwijzeSteps] = useState<WerkwijzeStep[]>([]);
    const [highlights, setHighlights] = useState<string[]>([]);

    // Sync complex state from Firestore
    useEffect(() => {
        if (content) {
            setWerkwijzeSteps(content.werkwijzeSteps || []);
            setHighlights(content.atelierHighlights || []);
        }
    }, [content]);

    if (loading) return <SectionLoader />;

    const collectionPath = 'siteContent';
    const docId = 'main';

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-cream mb-2">Site Content</h1>
                        <p className="text-cream-warm">
                            Alle velden worden automatisch opgeslagen. Afbeeldingen kun je bewerken met AI.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Hero Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Hero Sectie</h2>
                        <ImageField
                            label="Hero afbeelding"
                            currentUrl={content?.heroImage}
                            fieldName="heroImage"
                            category="hero"
                        />
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <AutosaveInput
                                label="Headline"
                                value={content?.heroHeadline || ''}
                                fieldName="heroHeadline"
                                docId={docId}
                                collectionPath={collectionPath}
                            />
                            <AutosaveInput
                                label="Subheadline"
                                value={content?.heroSubheadline || ''}
                                fieldName="heroSubheadline"
                                docId={docId}
                                collectionPath={collectionPath}
                            />
                        </div>
                    </div>

                    {/* Intro Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Intro</h2>
                        <AutosaveInput
                            label="Introductietekst"
                            value={content?.introText || ''}
                            fieldName="introText"
                            docId={docId}
                            collectionPath={collectionPath}
                            multiline
                            rows={4}
                        />
                    </div>

                    {/* Atelier Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Atelier</h2>
                        <ImageField
                            label="Atelier afbeelding"
                            currentUrl={content?.atelierImage}
                            fieldName="atelierImage"
                            category="atelier"
                        />
                        <AutosaveInput
                            label="Atelier tekst"
                            value={content?.atelierText || ''}
                            fieldName="atelierText"
                            docId={docId}
                            collectionPath={collectionPath}
                            multiline
                            rows={4}
                            className="mt-4"
                        />
                        <HighlightsEditor
                            highlights={highlights}
                            onHighlightsChange={setHighlights}
                        />
                    </div>

                    {/* Werkwijze Section */}
                    <WerkwijzeEditor
                        steps={werkwijzeSteps}
                        onStepsChange={setWerkwijzeSteps}
                    />

                    {/* Ontmoet Iris Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Ontmoet Iris</h2>
                        <ImageField
                            label="Portret"
                            currentUrl={content?.irisPortrait}
                            fieldName="irisPortrait"
                            category="portraits"
                        />
                        <AutosaveInput
                            label="Bio"
                            value={content?.irisBio || ''}
                            fieldName="irisBio"
                            docId={docId}
                            collectionPath={collectionPath}
                            multiline
                            rows={4}
                            className="mt-4"
                        />
                        <ContactInfoEditor
                            contactInfo={content?.irisContactInfo || {}}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
