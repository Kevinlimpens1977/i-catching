import { useState } from 'react';
import type { Category, GalleryItem } from '@/lib/types';
import { CircularImageGallery } from './CircularImageGallery';

interface GallerySectionProps {
    categories: Category[];
    galleryItems: Map<string, GalleryItem[]>;
}

export function GallerySection({ categories, galleryItems }: GallerySectionProps) {
    // Filter out Latex Couture - it has its own dedicated section
    const filteredCategories = categories.filter(cat => !cat.isLatexCouture);

    return (
        <section className="section bg-anthracite">
            <div className="container-editorial">
                {filteredCategories.map((category) => {
                    const items = galleryItems.get(category.id) || [];
                    if (items.length === 0) return null;

                    return (
                        <div key={category.id} id={`gallery-${category.slug}`} className="mb-24 last:mb-0">
                            <span className="section-title">{category.title}</span>
                            <p className="text-cream-warm max-w-2xl mb-12">{category.intro}</p>

                            {category.isLatexCouture ? (
                                <CircularCarousel items={items} />
                            ) : (
                                <StandardGallery items={items} />
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// Placeholder component for items without images
function GalleryPlaceholder({ title, caption }: { title?: string; caption?: string }) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-dark to-charcoal flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 border-2 border-gold-muted rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-gold-muted">✦</span>
            </div>
            {title && (
                <p className="text-cream font-serif text-lg text-center mb-1">{title}</p>
            )}
            {caption && (
                <p className="text-slate-light text-xs text-center line-clamp-2 max-w-[200px]">{caption}</p>
            )}
        </div>
    );
}

// Circular carousel for Latex Couture - uses GSAP-powered gallery
function CircularCarousel({ items }: { items: GalleryItem[] }) {
    // Convert GalleryItem[] to the format expected by CircularImageGallery
    const galleryImages = items.slice(0, 6).map((item) => {
        const activeVersion = item.imageVersions?.find(v => v.id === item.activeVersionId);
        const imageUrl = activeVersion?.url || item.activeVersionUrl || item.imageUrl;

        return {
            title: item.title || item.caption || 'I-Catching Couture',
            url: imageUrl || '/assets/gallery/image-1.webp',
        };
    });

    // Ensure we have at least some images
    if (galleryImages.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-cream-warm">Nog geen afbeeldingen in deze collectie.</p>
            </div>
        );
    }

    return (
        <div className="relative py-8">
            <CircularImageGallery images={galleryImages} />
        </div>
    );
}

// Standard gallery grid for other categories
function StandardGallery({ items }: { items: GalleryItem[] }) {
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    return (
        <>
            <div className="gallery-grid">
                {items.map((item) => {
                    const activeVersion = item.imageVersions?.find(v => v.id === item.activeVersionId);
                    const imageUrl = activeVersion?.url || item.activeVersionUrl || item.imageUrl;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setSelectedImage(item)}
                            className="gallery-item group text-left cursor-pointer"
                        >
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={item.caption || item.title || ''}
                                />
                            ) : (
                                <GalleryPlaceholder title={item.title} caption={item.caption} />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-anthracite to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {item.title && (
                                    <p className="text-gold font-serif text-sm mb-1">{item.title}</p>
                                )}
                                {item.caption && (
                                    <p className="text-cream text-sm">{item.caption}</p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-anthracite/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-cream hover:text-gold transition-colors text-2xl"
                        onClick={() => setSelectedImage(null)}
                    >
                        ×
                    </button>
                    <div className="max-w-4xl w-full text-center" onClick={(e) => e.stopPropagation()}>
                        {(selectedImage.imageVersions?.find(v => v.id === selectedImage.activeVersionId)?.url ||
                            selectedImage.activeVersionUrl ||
                            selectedImage.imageUrl) ? (
                            <img
                                src={selectedImage.imageVersions?.find(v => v.id === selectedImage.activeVersionId)?.url ||
                                    selectedImage.activeVersionUrl ||
                                    selectedImage.imageUrl}
                                alt={selectedImage.caption || selectedImage.title || ''}
                                className="max-w-full max-h-[80vh] object-contain mx-auto"
                            />
                        ) : (
                            <div className="w-full aspect-[4/5] max-w-md mx-auto">
                                <GalleryPlaceholder title={selectedImage.title} caption={selectedImage.caption} />
                            </div>
                        )}
                        <div className="mt-6 bg-charcoal/80 px-6 py-4 rounded-sm inline-block">
                            {selectedImage.title && (
                                <p className="text-gold font-serif text-lg mb-1">{selectedImage.title}</p>
                            )}
                            {selectedImage.caption && (
                                <p className="text-cream">{selectedImage.caption}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
