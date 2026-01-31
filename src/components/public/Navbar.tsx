import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';

const navItems = [
    { label: 'Collectie', href: '#collectie' },
    { label: 'Atelier', href: '#atelier' },
    { label: 'Verhalen', href: '#verhalen' },
    { label: 'Ontmoet Iris', href: '#ontmoet-iris' },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const logoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            // Detect active section
            const sections = navItems.map(item => item.href.substring(1));
            for (const section of sections.reverse()) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 150) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${isScrolled
                ? 'bg-anthracite/95 backdrop-blur-md py-3 shadow-2xl shadow-black/30'
                : 'bg-gradient-to-b from-anthracite/80 to-transparent py-5'
                }`}
        >
            <div className="container-editorial flex items-center justify-between">
                {/* Logo with Animation */}
                <a
                    href="#"
                    className="group relative flex items-center gap-3"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    {/* Animated Logo Container */}
                    <div
                        ref={logoRef}
                        className={`relative overflow-hidden transition-all duration-700 ease-out ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'
                            }`}
                    >
                        {/* Subtle pulse glow behind logo */}
                        <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-logo-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Logo Image with zoom animation */}
                        <div className="relative w-full h-full animate-logo-breathe">
                            <img
                                src="/assets/logo-i-catching.png"
                                alt="I-Catching Logo"
                                className="w-full h-full object-contain transition-all duration-500 group-hover:brightness-110 group-hover:scale-110"
                            />
                        </div>

                        {/* Subtle shine effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>

                    {/* Brand Name */}
                    <span className={`font-serif tracking-wider transition-all duration-500 ${isScrolled
                        ? 'text-xl text-gold'
                        : 'text-2xl text-gold'
                        } group-hover:text-gold-muted`}>
                        I-Catching
                    </span>
                </a>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item, index) => {
                        const sectionId = item.href.substring(1);
                        const isActive = activeSection === sectionId;

                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={(e) => handleNavClick(e, item.href)}
                                className="group relative px-5 py-2"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animation: 'fadeInDown 0.6s ease-out forwards'
                                }}
                            >
                                {/* Nav link text */}
                                <span className={`relative z-10 text-sm font-medium tracking-widest uppercase transition-colors duration-300 ${isActive
                                    ? 'text-gold'
                                    : 'text-cream-warm group-hover:text-gold'
                                    }`}>
                                    {item.label}
                                </span>

                                {/* Underline indicator */}
                                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gold transition-all duration-300 ease-out ${isActive
                                    ? 'w-full opacity-100'
                                    : 'w-0 opacity-0 group-hover:w-3/4 group-hover:opacity-50'
                                    }`} />

                                {/* Subtle hover background */}
                                <span className="absolute inset-0 bg-gold/5 rounded-sm scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />
                            </a>
                        );
                    })}

                    {/* Contact CTA */}
                    <a
                        href="#contact"
                        onClick={(e) => handleNavClick(e, '#contact')}
                        className="ml-4 px-5 py-2 border border-gold/50 text-gold text-sm font-medium tracking-widest uppercase rounded-sm hover:bg-gold hover:text-anthracite transition-all duration-300"
                    >
                        Contact
                    </a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden relative p-2 text-gold hover:text-gold-muted transition-colors group"
                    aria-label={isOpen ? 'Menu sluiten' : 'Menu openen'}
                >
                    <span className="absolute inset-0 bg-gold/10 rounded-sm scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />
                    {isOpen ? <X className="w-6 h-6 relative z-10" /> : <Menu className="w-6 h-6 relative z-10" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`md:hidden fixed inset-0 bg-anthracite/98 backdrop-blur-xl z-40 transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ top: isScrolled ? '64px' : '80px' }}
            >
                <div className="flex flex-col items-center justify-center h-full gap-8">
                    {/* Mobile Logo */}
                    <div className="mb-8 animate-logo-breathe">
                        <img
                            src="/assets/logo-i-catching.png"
                            alt="I-Catching Logo"
                            className="w-24 h-24 object-contain"
                        />
                    </div>

                    {navItems.map((item, index) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleNavClick(e, item.href)}
                            className="text-2xl font-serif text-cream hover:text-gold transition-colors tracking-wider"
                            style={{
                                opacity: isOpen ? 1 : 0,
                                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                                transition: `all 0.4s ease-out ${index * 100 + 200}ms`
                            }}
                        >
                            {item.label}
                        </a>
                    ))}

                    <a
                        href="#contact"
                        onClick={(e) => handleNavClick(e, '#contact')}
                        className="mt-8 px-8 py-3 border border-gold text-gold text-lg font-medium tracking-widest uppercase rounded-sm hover:bg-gold hover:text-anthracite transition-all duration-300"
                        style={{
                            opacity: isOpen ? 1 : 0,
                            transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.4s ease-out 600ms'
                        }}
                    >
                        Contact
                    </a>
                </div>
            </div>
        </nav>
    );
}
