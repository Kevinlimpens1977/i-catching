import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/lib/types';

interface CollectiePreviewProps {
    categories: Category[];
}

export function CollectiePreview({ categories }: CollectiePreviewProps) {
    if (categories.length === 0) return null;

    return (
        <section id="collectie" className="section bg-charcoal">
            <div className="container-editorial">
                <span className="section-title">Collectie</span>
                <h2 className="text-3xl md:text-4xl font-serif text-cream mb-12">
                    Ontdek de werelden
                </h2>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {categories.map((category) => (
                        <a
                            key={category.id}
                            href={`#gallery-${category.slug}`}
                            className="group block relative aspect-[3/4] overflow-hidden cursor-pointer"
                        >
                            {/* Image */}
                            <div className="absolute inset-0 bg-slate-dark">
                                {category.coverImage && (
                                    <img
                                        src={category.coverImage}
                                        alt={category.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-anthracite via-anthracite/40 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6">
                                <h3 className="text-2xl font-serif text-cream mb-2 group-hover:text-gold transition-colors">
                                    {category.title}
                                </h3>
                                <p className="text-cream-warm text-sm line-clamp-2 mb-4">
                                    {category.intro}
                                </p>
                                <span className="inline-flex items-center text-gold-muted text-sm group-hover:text-gold transition-colors">
                                    Bekijk collectie
                                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
