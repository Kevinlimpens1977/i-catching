import { LatexBackground } from './LatexBackground';

interface HeroSectionProps {
    image?: string;
    headline: string;
    subheadline: string;
}

export function HeroSection({ image, headline, subheadline }: HeroSectionProps) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with latex overlay effect */}
            {image && (
                <div className="absolute inset-0">
                    <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-anthracite/40 via-anthracite/60 to-anthracite" />
                </div>
            )}

            {/* Animated Latex Background - shown when no hero image */}
            {!image && <LatexBackground />}

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                {/* Headline with shimmer animation */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-cream mb-8 animate-fade-in-up headline-shimmer">
                    {headline}
                </h1>

                {/* Subheadline with proper spacing */}
                <p
                    className="text-lg md:text-xl lg:text-2xl text-cream-warm/90 font-light tracking-wide animate-fade-in-up max-w-2xl mx-auto leading-relaxed"
                    style={{ animationDelay: '200ms' }}
                >
                    {subheadline}
                </p>

                {/* Scroll indicator - positioned relative to section, not content */}
            </div>

            {/* Scroll indicator - moved outside content for better positioning */}
            <div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-fade-in z-10"
                style={{ animationDelay: '800ms' }}
            >
                <div className="w-px h-16 bg-gradient-to-b from-gold/60 to-transparent mx-auto mb-2" />
                <span className="text-xs text-gold-muted tracking-[0.3em] uppercase">Ontdek</span>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-gold/5 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-bordeaux/5 to-transparent blur-3xl" />
        </section>
    );
}
