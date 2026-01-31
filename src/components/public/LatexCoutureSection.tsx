import { CircularImageGallery } from './CircularImageGallery';
import type { GalleryItem } from '@/lib/types';

interface LatexCoutureSectionProps {
    title?: string;
    subtitle?: string;
    items?: GalleryItem[];
}

export function LatexCoutureSection({
    title = "Latex Couture",
    subtitle = "Handgemaakte creaties met de allure van liquid latex",
    items = []
}: LatexCoutureSectionProps) {
    // Convert GalleryItem[] to the format expected by CircularImageGallery
    const galleryImages = items.length > 0
        ? items.slice(0, 6).map((item) => {
            const activeVersion = item.imageVersions?.find(v => v.id === item.activeVersionId);
            const imageUrl = activeVersion?.url || item.activeVersionUrl || item.imageUrl;

            return {
                title: item.title || item.caption || 'I-Catching Couture',
                url: imageUrl || '/assets/gallery/image-1.webp',
            };
        })
        : undefined; // Use default images if no items provided

    return (
        <section id="latex-couture" className="section bg-charcoal relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-anthracite/20 to-transparent pointer-events-none" />

            <div className="container-editorial relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="section-title">Collectie</span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-cream mb-4">
                        {title}
                    </h2>
                    <p className="text-cream-warm text-lg max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {/* Circular Image Gallery */}
                <CircularImageGallery images={galleryImages} />
            </div>
        </section>
    );
}
