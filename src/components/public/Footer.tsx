import { Link } from 'react-router-dom';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-anthracite border-t border-slate-medium/30">
            <div className="container-editorial py-12 md:py-16">
                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    {/* Brand */}
                    <div>
                        <h3 className="text-2xl font-serif text-cream mb-4">I-Catching</h3>
                        <p className="text-cream-warm text-sm leading-relaxed">
                            Erotisch interieur en handgemaakte latex couture, ontstaan uit aandacht en vakmanschap.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-sm font-medium text-cream uppercase tracking-wider mb-4">
                            Navigatie
                        </h4>
                        <nav className="space-y-2">
                            <a href="#collectie" className="block text-cream-warm text-sm hover:text-gold transition-colors">
                                Collectie
                            </a>
                            <a href="#atelier" className="block text-cream-warm text-sm hover:text-gold transition-colors">
                                Atelier
                            </a>
                            <a href="#verhalen" className="block text-cream-warm text-sm hover:text-gold transition-colors">
                                Verhalen
                            </a>
                            <a href="#ontmoet-iris" className="block text-cream-warm text-sm hover:text-gold transition-colors">
                                Ontmoet Iris
                            </a>
                        </nav>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-medium text-cream uppercase tracking-wider mb-4">
                            Contact
                        </h4>
                        <div className="space-y-2">
                            <a
                                href="mailto:info@i-catching.nl"
                                className="block text-cream-warm text-sm hover:text-gold transition-colors"
                            >
                                info@i-catching.nl
                            </a>
                            <p className="text-cream-warm text-sm">
                                06 – 00000000
                            </p>
                            <a
                                href="https://instagram.com/i_catching"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-cream-warm text-sm hover:text-gold transition-colors"
                            >
                                @i_catching
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-slate-medium/30 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-slate-light text-sm">
                        © {currentYear} I-Catching. Alle rechten voorbehouden.
                    </p>

                    {/* Discreet admin link */}
                    <Link
                        to="/admin/login"
                        className="text-slate-medium/60 text-xs hover:text-slate-light transition-colors"
                        aria-label="Admin login"
                    >
                        Admin
                    </Link>
                </div>
            </div>
        </footer>
    );
}
