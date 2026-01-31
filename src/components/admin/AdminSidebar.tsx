import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Image,
    BookOpen,
    MessageSquare,
    Settings,
    LogOut,
    Home
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Site Content', href: '/admin/content', icon: FileText },
    { label: 'Galerijen', href: '/admin/galleries', icon: Image },
    { label: 'Blogposts', href: '/admin/posts', icon: BookOpen },
    { label: 'Berichten', href: '/admin/inquiries', icon: MessageSquare },
];

export function AdminSidebar() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSignOut = async () => {
        try {
            await signOut();
            showToast('Uitgelogd', 'info');
            navigate('/admin/login');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <aside className="admin-sidebar flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-medium">
                <h1 className="text-xl font-serif text-cream">I-Catching</h1>
                <p className="text-xs text-slate-light mt-1">CMS Beheer</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <NavLink
                                to={item.href}
                                end={item.href === '/admin'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive
                                        ? 'text-gold bg-gold/10 border-r-2 border-gold'
                                        : 'text-cream-warm hover:text-cream hover:bg-surface-elevated'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User & Actions */}
            <div className="border-t border-slate-medium p-4 space-y-2">
                <a
                    href="/"
                    target="_blank"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-cream-warm hover:text-cream transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Bekijk website
                </a>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-cream-warm hover:text-cream transition-colors w-full text-left"
                >
                    <LogOut className="w-4 h-4" />
                    Uitloggen
                </button>
                {user && (
                    <p className="px-4 text-xs text-slate-light truncate">
                        {user.email}
                    </p>
                )}
            </div>
        </aside>
    );
}
