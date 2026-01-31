import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { PageLoader } from '@/components/ui/Loading';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { defaultBlogPosts } from '@/lib/types';
import type { BlogPost } from '@/lib/types';

export function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const q = query(
                    collection(db, 'blogPosts'),
                    where('status', '==', 'published'),
                    orderBy('publishedAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const firestorePosts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as BlogPost[];

                // Use Firestore posts or defaults
                setPosts(firestorePosts.length > 0 ? firestorePosts : defaultBlogPosts.filter(p => p.status === 'published'));
            } catch (error) {
                console.error('Error fetching posts:', error);
                setPosts(defaultBlogPosts.filter(p => p.status === 'published'));
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <PageLoader />;
    }

    return (
        <main className="min-h-screen bg-anthracite">
            <Navbar />

            <section className="pt-32 pb-16 md:pt-40 md:pb-24">
                <div className="container-editorial">
                    <Link
                        to="/#verhalen"
                        className="inline-flex items-center text-gold-muted hover:text-gold transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Terug naar home
                    </Link>

                    <span className="section-title">Verhalen</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-cream mb-8">
                        Uit het atelier
                    </h1>
                    <p className="text-cream-warm text-lg max-w-2xl mb-16">
                        Tips, inspiratie en een kijkje achter de schermen van I-Catching.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group block bg-charcoal/50 rounded-sm overflow-hidden hover:bg-charcoal transition-colors duration-300"
                            >
                                {/* Cover Image or Placeholder */}
                                <div className="aspect-[16/9] bg-slate-dark overflow-hidden">
                                    {post.coverImage ? (
                                        <img
                                            src={post.coverImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-dark to-charcoal flex items-center justify-center">
                                            <div className="w-16 h-16 border border-gold-muted rounded-full flex items-center justify-center">
                                                <span className="text-gold-muted text-2xl">✎</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-slate-light text-sm mb-3">
                                        <Calendar className="w-4 h-4" />
                                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        }) : ''}
                                    </div>
                                    <h2 className="text-xl font-serif text-cream mb-2 group-hover:text-gold transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-cream-warm text-sm line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

export function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                // First try Firestore
                const q = query(
                    collection(db, 'blogPosts'),
                    where('slug', '==', slug)
                );
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setPost({ id: doc.id, ...doc.data() } as BlogPost);
                } else {
                    // Fall back to defaults
                    const defaultPost = defaultBlogPosts.find(p => p.slug === slug);
                    setPost(defaultPost || null);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                // Fall back to defaults
                const defaultPost = defaultBlogPosts.find(p => p.slug === slug);
                setPost(defaultPost || null);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return <PageLoader />;
    }

    if (!post) {
        return (
            <main className="min-h-screen bg-anthracite">
                <Navbar />
                <section className="pt-32 pb-16 md:pt-40 md:pb-24">
                    <div className="container-editorial text-center">
                        <h1 className="text-3xl font-serif text-cream mb-4">Artikel niet gevonden</h1>
                        <p className="text-cream-warm mb-8">Dit artikel bestaat niet of is verwijderd.</p>
                        <Link
                            to="/blog"
                            className="inline-flex items-center text-gold hover:text-gold-muted transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Terug naar verhalen
                        </Link>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-anthracite">
            <Navbar />

            <article className="pt-32 pb-16 md:pt-40 md:pb-24">
                <div className="container-editorial max-w-3xl">
                    <Link
                        to="/blog"
                        className="inline-flex items-center text-gold-muted hover:text-gold transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Alle verhalen
                    </Link>

                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex items-center gap-2 text-slate-light text-sm mb-4">
                            <Calendar className="w-4 h-4" />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            }) : ''}
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-cream mb-6">
                            {post.title}
                        </h1>
                        <p className="text-xl text-cream-warm leading-relaxed">
                            {post.excerpt}
                        </p>
                    </header>

                    {/* Cover Image */}
                    {post.coverImage && (
                        <div className="aspect-[16/9] bg-slate-dark overflow-hidden rounded-sm mb-12">
                            <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose-editorial"
                        dangerouslySetInnerHTML={{ __html: post.body }}
                    />
                </div>
            </article>

            <Footer />
        </main>
    );
}
