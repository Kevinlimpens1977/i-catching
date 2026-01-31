/**
 * LatexBackground - Animated latex-inspired background
 * Creates a luxurious, dynamic latex/liquid effect with smooth blob animations
 * No visible lines or harsh transitions - only organic flowing shapes
 */
export function LatexBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden bg-anthracite">
            {/* Base gradient layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-anthracite via-charcoal to-anthracite" />

            {/* Animated latex blobs - smooth morphing organic shapes */}
            <div className="latex-blob latex-blob-1" />
            <div className="latex-blob latex-blob-2" />
            <div className="latex-blob latex-blob-3" />
            <div className="latex-blob latex-blob-4" />
            <div className="latex-blob latex-blob-5" />

            {/* Soft ambient glow layers for depth - no moving elements */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-bordeaux/8 to-transparent blur-3xl opacity-60" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-gold/5 to-transparent blur-3xl opacity-50" />

            {/* Vignette overlay for depth */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-anthracite/80" />

            {/* Subtle noise texture for realism */}
            <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />
        </div>
    );
}
