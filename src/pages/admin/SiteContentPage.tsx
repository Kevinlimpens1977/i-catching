import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSiteContent, updateSiteContent } from '@/hooks/useFirestore';
import { uploadImage, generateImagePath } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { SectionLoader } from '@/components/ui/Loading';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { SiteContent, WerkwijzeStep } from '@/lib/types';

export function SiteContentPage() {
    const { content, loading } = useSiteContent();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [atelierFile, setAtelierFile] = useState<File | null>(null);
    const [portraitFile, setPortraitFile] = useState<File | null>(null);
    const [werkwijzeSteps, setWerkwijzeSteps] = useState<WerkwijzeStep[]>([]);
    const [highlights, setHighlights] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch } = useForm<Partial<SiteContent>>();

    useEffect(() => {
        if (content) {
            setValue('heroHeadline', content.heroHeadline);
            setValue('heroSubheadline', content.heroSubheadline);
            setValue('introText', content.introText);
            setValue('atelierText', content.atelierText);
            setValue('irisBio', content.irisBio);
            setValue('irisContactInfo', content.irisContactInfo);
            setWerkwijzeSteps(content.werkwijzeSteps || []);
            setHighlights(content.atelierHighlights || []);
        }
    }, [content, setValue]);

    const onSubmit = async (data: Partial<SiteContent>) => {
        if (!user) return;
        setSaving(true);

        try {
            const updates: Partial<SiteContent> = { ...data };

            // Upload images if new ones were selected
            if (heroFile) {
                const path = generateImagePath('hero', heroFile.name);
                updates.heroImage = await uploadImage(heroFile, path);
            }
            if (atelierFile) {
                const path = generateImagePath('atelier', atelierFile.name);
                updates.atelierImage = await uploadImage(atelierFile, path);
            }
            if (portraitFile) {
                const path = generateImagePath('portraits', portraitFile.name);
                updates.irisPortrait = await uploadImage(portraitFile, path);
            }

            updates.werkwijzeSteps = werkwijzeSteps;
            updates.atelierHighlights = highlights;

            await updateSiteContent(updates, user.uid);
            showToast('Site content opgeslagen!', 'success');
        } catch (error) {
            console.error('Error saving content:', error);
            showToast('Opslaan mislukt. Probeer het opnieuw.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addWerkwijzeStep = () => {
        setWerkwijzeSteps([
            ...werkwijzeSteps,
            {
                id: Date.now().toString(),
                title: '',
                description: '',
                order: werkwijzeSteps.length + 1
            }
        ]);
    };

    const updateWerkwijzeStep = (index: number, field: keyof WerkwijzeStep, value: string | number) => {
        const updated = [...werkwijzeSteps];
        updated[index] = { ...updated[index], [field]: value };
        setWerkwijzeSteps(updated);
    };

    const removeWerkwijzeStep = (index: number) => {
        setWerkwijzeSteps(werkwijzeSteps.filter((_, i) => i !== index));
    };

    const addHighlight = () => {
        setHighlights([...highlights, '']);
    };

    const updateHighlight = (index: number, value: string) => {
        const updated = [...highlights];
        updated[index] = value;
        setHighlights(updated);
    };

    const removeHighlight = (index: number) => {
        setHighlights(highlights.filter((_, i) => i !== index));
    };

    if (loading) return <SectionLoader />;

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-cream mb-2">Site Content</h1>
                        <p className="text-cream-warm">Beheer alle teksten en afbeeldingen van de website.</p>
                    </div>
                    <Button onClick={handleSubmit(onSubmit)} loading={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        Opslaan
                    </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Hero Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Hero Sectie</h2>
                        <ImageUpload
                            label="Hero afbeelding"
                            value={content?.heroImage}
                            onChange={setHeroFile}
                        />
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <Input
                                label="Headline"
                                {...register('heroHeadline')}
                            />
                            <Input
                                label="Subheadline"
                                {...register('heroSubheadline')}
                            />
                        </div>
                    </div>

                    {/* Intro Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Intro</h2>
                        <TextArea
                            label="Introductietekst"
                            rows={4}
                            {...register('introText')}
                        />
                    </div>

                    {/* Atelier Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Atelier</h2>
                        <ImageUpload
                            label="Atelier afbeelding"
                            value={content?.atelierImage}
                            onChange={setAtelierFile}
                        />
                        <TextArea
                            label="Atelier tekst"
                            rows={4}
                            {...register('atelierText')}
                            className="mt-4"
                        />

                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <label className="label mb-0">Highlights</label>
                                <Button type="button" variant="ghost" size="sm" onClick={addHighlight}>
                                    <Plus className="w-4 h-4 mr-1" /> Toevoegen
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {highlights.map((highlight, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={highlight}
                                            onChange={(e) => updateHighlight(index, e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeHighlight(index)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Werkwijze Section */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-medium text-cream">Werkwijze stappen</h2>
                            <Button type="button" variant="secondary" size="sm" onClick={addWerkwijzeStep}>
                                <Plus className="w-4 h-4 mr-1" /> Stap toevoegen
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {werkwijzeSteps.map((step, index) => (
                                <div key={step.id} className="bg-surface-elevated p-4 rounded-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gold text-sm">Stap {index + 1}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeWerkwijzeStep(index)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input
                                            label="Titel"
                                            value={step.title}
                                            onChange={(e) => updateWerkwijzeStep(index, 'title', e.target.value)}
                                        />
                                        <Input
                                            label="Beschrijving"
                                            value={step.description}
                                            onChange={(e) => updateWerkwijzeStep(index, 'description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ontmoet Iris Section */}
                    <div className="admin-card">
                        <h2 className="text-xl font-medium text-cream mb-6">Ontmoet Iris</h2>
                        <ImageUpload
                            label="Portret"
                            value={content?.irisPortrait}
                            onChange={setPortraitFile}
                        />
                        <TextArea
                            label="Bio"
                            rows={4}
                            {...register('irisBio')}
                            className="mt-4"
                        />
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <Input
                                label="E-mail"
                                {...register('irisContactInfo.email')}
                            />
                            <Input
                                label="Instagram"
                                {...register('irisContactInfo.instagram')}
                            />
                            <Input
                                label="Locatie"
                                {...register('irisContactInfo.location')}
                            />
                            <Input
                                label="Telefoon"
                                {...register('irisContactInfo.phone')}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
