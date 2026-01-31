import type { WerkwijzeStep } from '@/lib/types';

interface WerkwijzeSectionProps {
    steps: WerkwijzeStep[];
}

export function WerkwijzeSection({ steps }: WerkwijzeSectionProps) {
    if (steps.length === 0) return null;

    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

    return (
        <section className="section bg-anthracite">
            <div className="container-editorial">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="section-title">Werkwijze</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-cream">
                        Van idee tot realisatie
                    </h2>
                </div>

                {/* Timeline layout for 7 steps */}
                <div className="relative">
                    {/* Central timeline line - desktop only */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-gold/40" />

                    <div className="space-y-8 md:space-y-0">
                        {sortedSteps.map((step, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <div
                                    key={step.id}
                                    className={`relative md:flex md:items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                                        }`}
                                >
                                    {/* Content */}
                                    <div className={`md:w-1/2 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                                        <div className="bg-charcoal/50 p-6 rounded-sm border border-slate-medium/30 hover:border-gold/30 transition-colors duration-300">
                                            {/* Step number - mobile */}
                                            <div className="md:hidden text-gold/50 text-sm uppercase tracking-wider mb-2">
                                                Stap {index + 1}
                                            </div>

                                            <h3 className="text-lg font-serif text-cream mb-2">
                                                {step.title}
                                            </h3>
                                            <p className="text-cream-warm text-sm leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center dot & number - desktop */}
                                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-anthracite border-2 border-gold flex items-center justify-center">
                                            <span className="text-gold font-serif text-sm">{index + 1}</span>
                                        </div>
                                    </div>

                                    {/* Empty space for other side */}
                                    <div className="hidden md:block md:w-1/2" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
