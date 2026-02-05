import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type FieldSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface FieldSaverResult {
    status: FieldSaveStatus;
    lastSaved: Date | null;
    error: Error | null;
    retry: () => void;
    flush: () => Promise<void>;
}

/**
 * Hook for debounced, per-field Firestore autosave.
 * Each field saves independently - no blocking other fields.
 * 
 * @param collectionPath - Firestore collection path
 * @param docId - Document ID to update
 * @param fieldName - Field name to save
 * @param value - Current value of the field
 * @param debounceMs - Debounce delay (default 1500ms)
 */
export function useFieldSaver<T>(
    collectionPath: string,
    docId: string | null,
    fieldName: string,
    value: T,
    debounceMs: number = 1500
): FieldSaverResult {
    const [status, setStatus] = useState<FieldSaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Track initial value to detect changes
    const initialValueRef = useRef<T>(value);
    const currentValueRef = useRef<T>(value);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    // Save function
    const saveField = useCallback(async (valueToSave: T) => {
        if (!docId) return;

        setStatus('saving');
        setError(null);

        try {
            const docRef = doc(db, collectionPath, docId);
            await updateDoc(docRef, {
                [fieldName]: valueToSave,
                updatedAt: serverTimestamp()
            });

            setStatus('saved');
            setLastSaved(new Date());
            initialValueRef.current = valueToSave;
        } catch (err) {
            console.error(`Error saving field ${fieldName}:`, err);
            setError(err instanceof Error ? err : new Error('Save failed'));
            setStatus('error');
        }
    }, [collectionPath, docId, fieldName]);

    // Flush - immediately save current value
    const flush = useCallback(async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        await saveField(currentValueRef.current);
    }, [saveField]);

    // Retry - attempt to save again after error
    const retry = useCallback(() => {
        saveField(currentValueRef.current);
    }, [saveField]);

    // Debounced save effect
    useEffect(() => {
        currentValueRef.current = value;

        // Skip first render (initial load from Firestore)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            initialValueRef.current = value;
            return;
        }

        // Check if value actually changed from last saved state
        const hasChanged = JSON.stringify(value) !== JSON.stringify(initialValueRef.current);

        if (!hasChanged) {
            if (status === 'dirty') {
                setStatus('idle');
            }
            return;
        }

        // Value changed - mark as dirty
        setStatus('dirty');

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer
        debounceTimerRef.current = setTimeout(() => {
            saveField(value);
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [value, debounceMs, saveField, status]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        status,
        lastSaved,
        error,
        retry,
        flush
    };
}

/**
 * Hook for tracking field status without autosave.
 * Useful for fields that need manual save triggers.
 */
export function useFieldStatus<T>(
    initialValue: T,
    currentValue: T
): { isDirty: boolean } {
    const isDirty = JSON.stringify(initialValue) !== JSON.stringify(currentValue);
    return { isDirty };
}
