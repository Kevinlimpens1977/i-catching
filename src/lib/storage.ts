import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Upload a file to Firebase Storage
 */
export async function uploadImage(
    file: File,
    path: string
): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
}

/**
 * Upload a base64 image to Firebase Storage
 */
export async function uploadBase64Image(
    base64Data: string,
    path: string
): Promise<string> {
    // Remove data URL prefix if present
    const base64Content = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

    // Convert base64 to blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteImage(url: string): Promise<void> {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting image:', error);
        // Don't throw - file might already be deleted
    }
}

/**
 * Generate a unique path for an image
 */
export function generateImagePath(
    category: 'hero' | 'atelier' | 'gallery' | 'blog' | 'portraits',
    filename: string
): string {
    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
    return `${category}/${timestamp}_${cleanFilename}`;
}

/**
 * Generate a path for AI-modified images
 */
export function generateAIImagePath(
    originalPath: string,
    version: number
): string {
    const basePath = originalPath.replace(/\.[^/.]+$/, '');
    return `${basePath}_ai_v${version}.png`;
}
