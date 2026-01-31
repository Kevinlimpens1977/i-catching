import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { doc, setDoc, serverTimestamp, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, User, ArrowRight } from 'lucide-react';

/**
 * This page is shown when a logged-in user doesn't have admin rights.
 * It allows the FIRST user to claim admin rights if no admins exist yet.
 */
export function AdminSetupPage() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [claiming, setClaiming] = useState(false);
    const [checking, setChecking] = useState(true);
    const [hasExistingAdmins, setHasExistingAdmins] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkForAdmins = async () => {
            try {
                // Check if there are any admin users
                const usersSnap = await getDocs(collection(db, 'users'));
                const admins = usersSnap.docs.filter(doc => doc.data().role === 'admin');
                setHasExistingAdmins(admins.length > 0);
            } catch (err) {
                console.error('Error checking for admins:', err);
                // If we can't read users collection, assume there might be admins
                setHasExistingAdmins(true);
            } finally {
                setChecking(false);
            }
        };

        checkForAdmins();
    }, []);

    const handleClaimAdmin = async () => {
        if (!user) return;

        setClaiming(true);
        setError(null);

        try {
            // Create admin user document
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: 'admin',
                createdAt: serverTimestamp()
            });

            // Reload the page to refresh auth context
            window.location.reload();
        } catch (err: any) {
            console.error('Error claiming admin:', err);
            setError(err.message || 'Er ging iets mis bij het aanmaken van admin rechten.');
        } finally {
            setClaiming(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-anthracite flex items-center justify-center">
                <div className="animate-pulse text-cream">Controleren...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-anthracite flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-slate-medium rounded-sm p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-serif text-cream">I-Catching</h1>
                        <p className="text-slate-light text-sm mt-2">CMS Setup</p>
                    </div>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-gold" />
                        </div>

                        {hasExistingAdmins ? (
                            <>
                                <h2 className="text-xl font-medium text-cream mb-2">
                                    Geen toegang
                                </h2>
                                <p className="text-cream-warm text-sm">
                                    Je bent ingelogd als <strong>{user?.email}</strong>,
                                    maar je hebt geen admin rechten.
                                </p>
                                <p className="text-slate-light text-sm mt-4">
                                    Neem contact op met een bestaande admin om toegang te krijgen.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-medium text-cream mb-2">
                                    Eerste keer setup
                                </h2>
                                <p className="text-cream-warm text-sm">
                                    Er zijn nog geen admin gebruikers. Claim admin rechten om te beginnen.
                                </p>

                                <div className="mt-6 p-4 bg-gold/10 rounded-sm text-left">
                                    <div className="flex items-center gap-3 text-cream">
                                        <User className="w-5 h-5 text-gold" />
                                        <div>
                                            <p className="font-medium">{user?.email}</p>
                                            <p className="text-sm text-slate-light">UID: {user?.uid}</p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <Button
                                    onClick={handleClaimAdmin}
                                    loading={claiming}
                                    className="w-full mt-6"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Claim Admin Rechten
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-medium flex justify-between">
                        <button
                            onClick={handleSignOut}
                            className="text-sm text-slate-light hover:text-cream transition-colors"
                        >
                            Uitloggen
                        </button>
                        <a
                            href="/"
                            className="text-sm text-slate-light hover:text-cream transition-colors flex items-center gap-1"
                        >
                            Naar website <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
