import type { ContactInfo } from '@/lib/types';

interface OntmoetIrisSectionProps {
    bio: string;
    portrait?: string;
    contactInfo: ContactInfo;
}

export function OntmoetIrisSection({ bio, portrait, contactInfo }: OntmoetIrisSectionProps) {
    return (
        <section id="ontmoet-iris" className="section bg-anthracite">
            <div className="container-editorial">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Content */}
                    <div>
                        <span className="section-title">Ontmoet Iris</span>
                        <h2 className="text-3xl md:text-4xl font-serif text-cream mb-8">
                            De creatieve kracht
                        </h2>
                        <p className="text-cream-warm text-lg leading-relaxed mb-10 whitespace-pre-line">
                            {bio}
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            {contactInfo.email && (
                                <a
                                    href={`mailto:${contactInfo.email}`}
                                    className="block text-gold-muted hover:text-gold transition-colors"
                                >
                                    {contactInfo.email}
                                </a>
                            )}
                            {contactInfo.instagram && (
                                <a
                                    href={`https://instagram.com/${contactInfo.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-gold-muted hover:text-gold transition-colors"
                                >
                                    {contactInfo.instagram}
                                </a>
                            )}
                            {contactInfo.location && (
                                <p className="text-slate-light">{contactInfo.location}</p>
                            )}
                        </div>
                    </div>

                    {/* Portrait */}
                    <div className="relative aspect-[3/4] bg-slate-dark overflow-hidden">
                        {portrait && (
                            <img
                                src={portrait}
                                alt="Iris"
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-anthracite/40 to-transparent" />
                    </div>
                </div>
            </div>
        </section>
    );
}
