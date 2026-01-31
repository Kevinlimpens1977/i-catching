import { useEffect, useState } from 'react';
import { Navbar } from '@/components/public/Navbar';
import { HeroSection } from '@/components/public/HeroSection';
import { IntroSection } from '@/components/public/IntroSection';
import { CollectiePreview } from '@/components/public/CollectiePreview';
import { LatexCoutureSection } from '@/components/public/LatexCoutureSection';
import { GallerySection } from '@/components/public/GallerySection';
import { AtelierSection } from '@/components/public/AtelierSection';
import { WerkwijzeSection } from '@/components/public/WerkwijzeSection';
import { VerhalenSection } from '@/components/public/VerhalenSection';
import { OntmoetIrisSection } from '@/components/public/OntmoetIrisSection';
import { ContactForm } from '@/components/public/ContactForm';
import { Footer } from '@/components/public/Footer';
import { PageLoader } from '@/components/ui/Loading';
import { useSiteContent, useCategories, useBlogPosts } from '@/hooks/useFirestore';
import {
    defaultSiteContent,
    defaultCategories,
    defaultGalleryItems,
    defaultBlogPosts
} from '@/lib/types';
import type { GalleryItem, Category } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function HomePage() {
    const { content, loading: contentLoading } = useSiteContent();
    const { categories: firestoreCategories, loading: categoriesLoading } = useCategories();
    const { posts: firestorePosts, loading: postsLoading } = useBlogPosts(true);
    const [galleryItems, setGalleryItems] = useState<Map<string, GalleryItem[]>>(new Map());
    const [galleryLoading, setGalleryLoading] = useState(true);

    // Use Firestore data or defaults
    const categories: Category[] = firestoreCategories.length > 0 ? firestoreCategories : defaultCategories;
    const posts = firestorePosts.length > 0 ? firestorePosts : defaultBlogPosts;

    // Fetch gallery items for all categories OR use defaults
    useEffect(() => {
        const fetchGalleryItems = async () => {
            // If no categories in Firestore, use default gallery items
            if (firestoreCategories.length === 0) {
                const defaultMap = new Map<string, GalleryItem[]>();
                for (const cat of defaultCategories) {
                    const items = defaultGalleryItems[cat.slug] || [];
                    defaultMap.set(cat.id, items);
                }
                setGalleryItems(defaultMap);
                setGalleryLoading(false);
                return;
            }

            try {
                const itemsMap = new Map<string, GalleryItem[]>();

                for (const category of firestoreCategories) {
                    const itemsQuery = query(
                        collection(db, 'categories', category.id, 'items'),
                        orderBy('order', 'asc')
                    );
                    const snapshot = await getDocs(itemsQuery);
                    const items = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as GalleryItem[];

                    // If Firestore category has no items, use defaults
                    if (items.length === 0 && defaultGalleryItems[category.slug]) {
                        itemsMap.set(category.id, defaultGalleryItems[category.slug]);
                    } else {
                        itemsMap.set(category.id, items);
                    }
                }

                setGalleryItems(itemsMap);
            } catch (error) {
                console.error('Error fetching gallery items:', error);
                // On error, use defaults
                const defaultMap = new Map<string, GalleryItem[]>();
                for (const cat of defaultCategories) {
                    defaultMap.set(cat.id, defaultGalleryItems[cat.slug] || []);
                }
                setGalleryItems(defaultMap);
            } finally {
                setGalleryLoading(false);
            }
        };

        if (!categoriesLoading) {
            fetchGalleryItems();
        }
    }, [firestoreCategories, categoriesLoading]);

    if (contentLoading || categoriesLoading || postsLoading || galleryLoading) {
        return <PageLoader />;
    }

    // Merge Firestore content with defaults
    const heroHeadline = content?.heroHeadline || defaultSiteContent.heroHeadline;
    const heroSubheadline = content?.heroSubheadline || defaultSiteContent.heroSubheadline;
    const introText = content?.introText || defaultSiteContent.introText;
    const atelierText = content?.atelierText || defaultSiteContent.atelierText;
    const atelierHighlights = content?.atelierHighlights?.length
        ? content.atelierHighlights
        : defaultSiteContent.atelierHighlights;
    const werkwijzeSteps = content?.werkwijzeSteps?.length
        ? content.werkwijzeSteps
        : defaultSiteContent.werkwijzeSteps;
    const irisBio = content?.irisBio || defaultSiteContent.irisBio;
    const irisContactInfo = content?.irisContactInfo || defaultSiteContent.irisContactInfo;

    // Find Latex Couture category and its items
    const latexCoutureCategory = categories.find(cat => cat.isLatexCouture);
    const latexCoutureItems = latexCoutureCategory
        ? galleryItems.get(latexCoutureCategory.id) || []
        : [];

    return (
        <main className="min-h-screen bg-anthracite">
            <Navbar />

            <HeroSection
                image={content?.heroImage}
                headline={heroHeadline}
                subheadline={heroSubheadline}
            />

            <IntroSection text={introText} />

            <LatexCoutureSection
                title={latexCoutureCategory?.title || "Latex Couture"}
                subtitle={latexCoutureCategory?.intro || "Handgemaakte creaties met de allure van liquid latex"}
                items={latexCoutureItems}
            />

            <CollectiePreview categories={categories} />

            <GallerySection
                categories={categories}
                galleryItems={galleryItems}
            />

            <AtelierSection
                text={atelierText}
                image={content?.atelierImage}
                highlights={atelierHighlights}
            />

            <WerkwijzeSection steps={werkwijzeSteps} />

            <VerhalenSection posts={posts} />

            <OntmoetIrisSection
                bio={irisBio}
                portrait={content?.irisPortrait}
                contactInfo={irisContactInfo}
            />

            <ContactForm />

            <Footer />
        </main>
    );
}
