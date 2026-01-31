import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/lib/types';

interface VerhalenSectionProps {
    posts: BlogPost[];
}

export function VerhalenSection({ posts }: VerhalenSectionProps) {
    // Only show published posts, take first 3
    const publishedPosts = posts.filter(p => p.status === 'published').slice(0, 3);

    if (publishedPosts.length === 0) return null;

    return (
        <section id="verhalen" className="section bg-charcoal">
            <div className="container-editorial">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
                    <div>
                        <span className="section-title">Verhalen</span>
                        <h2 className="text-3xl md:text-4xl font-serif text-cream">
                            Uit het atelier
                        </h2>
                    </div>
                    <Link
                        to="/blog"
                        className="text-gold-muted hover:text-gold transition-colors text-sm flex items-center gap-2"
                    >
                        Alle verhalen
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {publishedPosts.map((post) => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.slug}`}
                            className="group block"
                        >
                            {/* Cover Image or Placeholder */}
                            <div className="aspect-[4/3] bg-slate-dark overflow-hidden mb-6">
                                {post.coverImage ? (
                                    <img
                                        src={post.coverImage}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-dark to-charcoal flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-12 h-12 border border-gold-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                                <span className="text-gold-muted">✎</span>
                                            </div>
                                            <p className="text-slate-light text-xs uppercase tracking-wider">Verhaal</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <time className="text-sm text-slate-light">
                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                }) : ''}
                            </time>
                            <h3 className="text-xl font-serif text-cream mt-2 mb-3 group-hover:text-gold transition-colors">
                                {post.title}
                            </h3>
                            <p className="text-cream-warm text-sm line-clamp-3 mb-4">
                                {post.excerpt}
                            </p>
                            <span className="inline-flex items-center text-gold-muted text-sm group-hover:text-gold transition-colors">
                                Lees verder
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
