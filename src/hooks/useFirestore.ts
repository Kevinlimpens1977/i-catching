import { useState, useEffect } from 'react';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
    SiteContent,
    Category,
    GalleryItem,
    BlogPost,
    Inquiry,
    defaultSiteContent,
    defaultCategories,
    defaultBlogPosts
} from '@/lib/types';

// =====================
// Site Content Hooks
// =====================

export function useSiteContent() {
    const [content, setContent] = useState<SiteContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'siteContent', 'main'),
            (doc) => {
                if (doc.exists()) {
                    setContent(doc.data() as SiteContent);
                } else {
                    setContent(null);
                }
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { content, loading, error };
}

export async function updateSiteContent(
    updates: Partial<SiteContent>,
    userId: string
): Promise<void> {
    const docRef = doc(db, 'siteContent', 'main');
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
    });
}

// =====================
// Categories Hooks
// =====================

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'categories'), orderBy('order', 'asc')),
            (snapshot) => {
                const cats = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Category[];
                setCategories(cats);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { categories, loading, error };
}

export async function createCategory(
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}

export async function updateCategory(
    categoryId: string,
    updates: Partial<Category>
): Promise<void> {
    await updateDoc(doc(db, 'categories', categoryId), {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

export async function deleteCategory(categoryId: string): Promise<void> {
    // First delete all gallery items in this category
    const itemsQuery = query(
        collection(db, 'categories', categoryId, 'items')
    );
    const items = await getDocs(itemsQuery);

    for (const item of items.docs) {
        await deleteDoc(item.ref);
    }

    // Then delete the category
    await deleteDoc(doc(db, 'categories', categoryId));
}

// =====================
// Gallery Items Hooks
// =====================

export function useGalleryItems(categoryId: string) {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!categoryId) {
            setItems([]);
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            query(
                collection(db, 'categories', categoryId, 'items'),
                orderBy('order', 'asc')
            ),
            (snapshot) => {
                const galleryItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as GalleryItem[];
                setItems(galleryItems);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [categoryId]);

    return { items, loading, error };
}

export function useAllGalleryItems() {
    const [items, setItems] = useState<(GalleryItem & { categoryTitle: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const categoriesSnap = await getDocs(collection(db, 'categories'));
                const allItems: (GalleryItem & { categoryTitle: string })[] = [];

                for (const catDoc of categoriesSnap.docs) {
                    const category = catDoc.data() as Category;
                    const itemsSnap = await getDocs(
                        query(collection(db, 'categories', catDoc.id, 'items'), orderBy('order', 'asc'))
                    );

                    itemsSnap.docs.forEach(itemDoc => {
                        allItems.push({
                            id: itemDoc.id,
                            ...itemDoc.data(),
                            categoryTitle: category.title
                        } as GalleryItem & { categoryTitle: string });
                    });
                }

                setItems(allItems);
            } catch (err) {
                console.error('Error fetching all gallery items:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    return { items, loading };
}

export async function addGalleryItem(
    categoryId: string,
    itemData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, 'categories', categoryId, 'items'), {
        ...itemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}

export async function updateGalleryItem(
    categoryId: string,
    itemId: string,
    updates: Partial<GalleryItem>
): Promise<void> {
    await updateDoc(doc(db, 'categories', categoryId, 'items', itemId), {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

export async function deleteGalleryItem(
    categoryId: string,
    itemId: string
): Promise<void> {
    await deleteDoc(doc(db, 'categories', categoryId, 'items', itemId));
}

// =====================
// Blog Posts Hooks
// =====================

export function useBlogPosts(publishedOnly: boolean = false) {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const q = publishedOnly
            ? query(
                collection(db, 'blogPosts'),
                where('status', '==', 'published'),
                orderBy('publishedAt', 'desc')
            )
            : query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const blogPosts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as BlogPost[];
                setPosts(blogPosts);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [publishedOnly]);

    return { posts, loading, error };
}

export function useBlogPost(postId: string) {
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, 'blogPosts', postId),
            (doc) => {
                if (doc.exists()) {
                    setPost({ id: doc.id, ...doc.data() } as BlogPost);
                } else {
                    setPost(null);
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [postId]);

    return { post, loading };
}

export async function createBlogPost(
    postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, 'blogPosts'), {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}

export async function updateBlogPost(
    postId: string,
    updates: Partial<BlogPost>
): Promise<void> {
    await updateDoc(doc(db, 'blogPosts', postId), {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

export async function deleteBlogPost(postId: string): Promise<void> {
    await deleteDoc(doc(db, 'blogPosts', postId));
}

// =====================
// Inquiries Hooks
// =====================

export function useInquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')),
            (snapshot) => {
                const inqs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Inquiry[];
                setInquiries(inqs);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { inquiries, loading, error };
}

export async function createInquiry(
    inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'handled'>
): Promise<string> {
    const docRef = await addDoc(collection(db, 'inquiries'), {
        ...inquiryData,
        handled: false,
        createdAt: serverTimestamp()
    });
    return docRef.id;
}

export async function markInquiryHandled(
    inquiryId: string,
    userId: string
): Promise<void> {
    await updateDoc(doc(db, 'inquiries', inquiryId), {
        handled: true,
        handledAt: serverTimestamp(),
        handledBy: userId
    });
}

// =====================
// Seeding Function
// =====================

export async function seedDatabase(userId: string): Promise<void> {
    // Import defaults
    const { defaultSiteContent, defaultCategories, defaultBlogPosts } = await import('@/lib/types');

    // Check if site content exists
    const siteContentDoc = await getDoc(doc(db, 'siteContent', 'main'));
    if (!siteContentDoc.exists()) {
        await setDoc(doc(db, 'siteContent', 'main'), {
            ...defaultSiteContent,
            updatedAt: serverTimestamp(),
            updatedBy: userId
        });
        console.log('Seeded site content');
    }

    // Check if categories exist
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    if (categoriesSnap.empty) {
        for (const cat of defaultCategories) {
            await addDoc(collection(db, 'categories'), {
                ...cat,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        console.log('Seeded categories');
    }

    // Check if blog posts exist
    const postsSnap = await getDocs(collection(db, 'blogPosts'));
    if (postsSnap.empty) {
        for (const post of defaultBlogPosts) {
            await addDoc(collection(db, 'blogPosts'), {
                ...post,
                authorId: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        console.log('Seeded blog posts');
    }
}
