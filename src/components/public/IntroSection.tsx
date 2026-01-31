interface IntroSectionProps {
    text: string;
}

export function IntroSection({ text }: IntroSectionProps) {
    return (
        <section className="section bg-anthracite">
            <div className="container-editorial">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="w-12 h-px bg-gold mx-auto mb-12" />
                    <p className="text-xl md:text-2xl lg:text-3xl font-serif text-cream leading-relaxed whitespace-pre-line">
                        {text}
                    </p>
                    <div className="w-12 h-px bg-gold mx-auto mt-12" />
                </div>
            </div>
        </section>
    );
}
