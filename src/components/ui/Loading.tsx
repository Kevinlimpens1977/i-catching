export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-2 border-slate-medium border-t-gold rounded-full animate-spin`}
            />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-screen bg-anthracite flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-cream-warm">Laden...</p>
            </div>
        </div>
    );
}

export function SectionLoader() {
    return (
        <div className="py-12 flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton h-4"
                    style={{ width: i === lines - 1 ? '60%' : '100%' }}
                />
            ))}
        </div>
    );
}

export function SkeletonImage({ aspectRatio = 'landscape' }: { aspectRatio?: 'landscape' | 'portrait' | 'square' }) {
    const ratioClasses = {
        landscape: 'aspect-video',
        portrait: 'aspect-[3/4]',
        square: 'aspect-square'
    };

    return <div className={`skeleton ${ratioClasses[aspectRatio]} w-full`} />;
}
