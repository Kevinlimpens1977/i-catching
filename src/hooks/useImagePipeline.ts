import { useState, useCallback, useRef } from 'react';
import { uploadBlob, generateImagePath } from '@/lib/storage';

export type ImagePipelineStatus =
    | 'idle'
    | 'selected'
    | 'editing'
    | 'confirming'
    | 'uploading'
    | 'saved'
    | 'error';

export interface ImagePipelineState {
    localBlob: string | null;
    editedBlob: string | null;
    status: ImagePipelineStatus;
    progress: number;
    error: Error | null;
    fileName: string | null;
}

export interface ImagePipelineActions {
    selectFile: (file: File) => void;
    openEditor: () => void;
    setEditedBlob: (blob: string) => void;
    confirmOriginal: () => Promise<string | null>;
    confirmEdited: () => Promise<string | null>;
    cancel: () => void;
    retry: () => void;
    reset: () => void;
}

export type ImagePipelineResult = ImagePipelineState & ImagePipelineActions;

interface UseImagePipelineOptions {
    category: 'hero' | 'atelier' | 'gallery' | 'blog' | 'portraits';
    onPersist?: (url: string) => void;
}

/**
 * Hook for managing the image upload pipeline:
 * local file → NanoBanana editing → confirm → Firebase upload
 * 
 * NO image is persisted until explicit confirmation.
 * ObjectURLs are properly revoked to prevent memory leaks.
 */
export function useImagePipeline(options: UseImagePipelineOptions): ImagePipelineResult {
    const { category, onPersist } = options;

    const [state, setState] = useState<ImagePipelineState>({
        localBlob: null,
        editedBlob: null,
        status: 'idle',
        progress: 0,
        error: null,
        fileName: null
    });

    // Track ObjectURLs for cleanup
    const objectUrlsRef = useRef<string[]>([]);
    const pendingBlobRef = useRef<Blob | null>(null);
    const fileNameRef = useRef<string | null>(null);

    // Cleanup function for ObjectURLs
    const revokeObjectUrls = useCallback(() => {
        objectUrlsRef.current.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                // Ignore revocation errors
            }
        });
        objectUrlsRef.current = [];
    }, []);

    // Select a file - creates local ObjectURL, NO upload yet
    const selectFile = useCallback((file: File) => {
        // Revoke any existing ObjectURLs
        revokeObjectUrls();

        // Create new ObjectURL
        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.push(objectUrl);
        fileNameRef.current = file.name;

        // Store the original file as Blob for potential upload
        pendingBlobRef.current = file;

        setState({
            localBlob: objectUrl,
            editedBlob: null,
            status: 'selected',
            progress: 0,
            error: null,
            fileName: file.name
        });
    }, [revokeObjectUrls]);

    // Open the editor (NanoBanana)
    const openEditor = useCallback(() => {
        if (!state.localBlob) return;

        setState(prev => ({
            ...prev,
            status: 'editing'
        }));
    }, [state.localBlob]);

    // Set the edited blob from NanoBanana
    const setEditedBlob = useCallback((blob: string) => {
        setState(prev => ({
            ...prev,
            editedBlob: blob,
            status: 'editing'
        }));
    }, []);

    // Upload helper
    const uploadImage = useCallback(async (blob: Blob): Promise<string | null> => {
        const fileName = fileNameRef.current || `image_${Date.now()}.png`;
        const path = generateImagePath(category, fileName);

        setState(prev => ({ ...prev, status: 'uploading', progress: 0 }));

        try {
            const url = await uploadBlob(blob, path, (progress) => {
                setState(prev => ({ ...prev, progress }));
            });

            setState(prev => ({
                ...prev,
                status: 'saved',
                progress: 100,
                error: null
            }));

            // Call onPersist callback
            onPersist?.(url);

            // Cleanup ObjectURLs after successful upload
            revokeObjectUrls();

            return url;
        } catch (err) {
            console.error('Image upload error:', err);
            setState(prev => ({
                ...prev,
                status: 'error',
                error: err instanceof Error ? err : new Error('Upload failed')
            }));
            return null;
        }
    }, [category, onPersist, revokeObjectUrls]);

    // Confirm and upload the ORIGINAL image
    const confirmOriginal = useCallback(async (): Promise<string | null> => {
        if (!pendingBlobRef.current) {
            console.error('No original blob to upload');
            return null;
        }

        setState(prev => ({ ...prev, status: 'confirming' }));
        return uploadImage(pendingBlobRef.current);
    }, [uploadImage]);

    // Confirm and upload the EDITED image
    const confirmEdited = useCallback(async (): Promise<string | null> => {
        if (!state.editedBlob) {
            console.error('No edited blob to upload');
            return null;
        }

        setState(prev => ({ ...prev, status: 'confirming' }));

        // Convert base64/dataURL to Blob
        let blob: Blob;
        if (state.editedBlob.startsWith('data:')) {
            const response = await fetch(state.editedBlob);
            blob = await response.blob();
        } else {
            // Assume it's already a blob URL or base64
            const response = await fetch(state.editedBlob);
            blob = await response.blob();
        }

        return uploadImage(blob);
    }, [state.editedBlob, uploadImage]);

    // Cancel - revoke ObjectURLs and reset
    const cancel = useCallback(() => {
        revokeObjectUrls();
        pendingBlobRef.current = null;
        fileNameRef.current = null;

        setState({
            localBlob: null,
            editedBlob: null,
            status: 'idle',
            progress: 0,
            error: null,
            fileName: null
        });
    }, [revokeObjectUrls]);

    // Retry last operation
    const retry = useCallback(() => {
        if (state.editedBlob) {
            confirmEdited();
        } else if (pendingBlobRef.current) {
            confirmOriginal();
        }
    }, [state.editedBlob, confirmEdited, confirmOriginal]);

    // Full reset
    const reset = useCallback(() => {
        cancel();
    }, [cancel]);

    return {
        ...state,
        selectFile,
        openEditor,
        setEditedBlob,
        confirmOriginal,
        confirmEdited,
        cancel,
        retry,
        reset
    };
}

/**
 * Convert base64 string to Blob
 */
export function base64ToBlob(base64: string, contentType: string = 'image/png'): Blob {
    const base64Content = base64.includes(',') ? base64.split(',')[1] : base64;
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
}
