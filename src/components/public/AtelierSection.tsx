interface AtelierSectionProps {
    text: string;
    image?: string;
    highlights: string[];
}

export function AtelierSection({ text, image, highlights }: AtelierSectionProps) {
    return (
        <section id="atelier" className="section bg-charcoal">
            <div className="container-editorial">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Image */}
                    <div className="relative aspect-[4/5] bg-slate-dark overflow-hidden order-2 lg:order-1">
                        {image && (
                            <img
                                src={image}
                                alt="Het atelier"
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="order-1 lg:order-2">
                        <span className="section-title">Het Atelier</span>
                        <h2 className="text-3xl md:text-4xl font-serif text-cream mb-8">
                            Waar creatie begint
                        </h2>
                        <p className="text-cream-warm text-lg leading-relaxed mb-10 whitespace-pre-line">
                            {text}
                        </p>

                        {/* Highlights */}
                        {highlights.length > 0 && (
                            <ul className="space-y-4">
                                {highlights.map((highlight, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-4 text-cream-warm"
                                    >
                                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2.5 flex-shrink-0" />
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
