import { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import type { FieldSaveStatus } from '@/hooks/useFieldSaver';

// ===========================================
// FIELD STATUS INDICATOR COMPONENT
// Shared across all CMS pages for consistent UX
// ===========================================

interface FieldStatusIndicatorProps {
    status: FieldSaveStatus;
    error: Error | null;
    onRetry?: () => void;
    lastSaved?: Date | null;
    showTimestamp?: boolean;
    autoFadeMs?: number;
}

/**
 * Minimal, calm field status indicator.
 * - dirty: subtle amber pulse
 * - saving: minimal spinner
 * - saved: green check, auto-fades after `autoFadeMs`
 * - error: red with inline retry
 */
export function FieldStatusIndicator({
    status,
    error,
    onRetry,
    lastSaved,
    showTimestamp = false,
    autoFadeMs = 2000
}: FieldStatusIndicatorProps) {
    const [showSaved, setShowSaved] = useState(false);

    // Auto-fade the "saved" indicator after autoFadeMs
    useEffect(() => {
        if (status === 'saved' && lastSaved) {
            setShowSaved(true);
            const timer = setTimeout(() => {
                setShowSaved(false);
            }, autoFadeMs);
            return () => clearTimeout(timer);
        } else if (status !== 'saved') {
            setShowSaved(false);
        }
    }, [status, lastSaved, autoFadeMs]);

    // Idle state - nothing to show
    if (status === 'idle') {
        return null;
    }

    // Saved state with auto-fade
    if (status === 'saved') {
        if (!showSaved) return null;

        const timeStr = lastSaved && showTimestamp
            ? lastSaved.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
            : null;

        return (
            <span className="field-status field-status--saved">
                <Check className="w-3 h-3" />
                {showTimestamp && timeStr ? timeStr : 'Opgeslagen'}
            </span>
        );
    }

    // Dirty state - subtle amber
    if (status === 'dirty') {
        return (
            <span className="field-status field-status--dirty">
                <span className="field-status__dot" />
                <span className="sr-only">Niet opgeslagen</span>
            </span>
        );
    }

    // Saving state - minimal spinner
    if (status === 'saving') {
        return (
            <span className="field-status field-status--saving">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="sr-only">Opslaan...</span>
            </span>
        );
    }

    // Error state - red with retry
    if (status === 'error') {
        return (
            <span className="field-status field-status--error">
                <AlertCircle className="w-3 h-3" />
                <span>Fout</span>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="field-status__retry"
                        aria-label="Opnieuw proberen"
                    >
                        Opnieuw
                    </button>
                )}
            </span>
        );
    }

    return null;
}

// ===========================================
// BEFOREUNLOAD HOOK
// Warns user if leaving with unsaved changes
// ===========================================

/**
 * Hook to show a beforeunload warning if any field is dirty or saving.
 * Pass an array of statuses from all autosave fields.
 */
export function useUnsavedChangesWarning(statuses: FieldSaveStatus[]) {
    useEffect(() => {
        const hasUnsaved = statuses.some(s => s === 'dirty' || s === 'saving');

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsaved) {
                e.preventDefault();
                e.returnValue = 'Je hebt onopgeslagen wijzigingen. Weet je zeker dat je wilt verlaten?';
                return e.returnValue;
            }
        };

        if (hasUnsaved) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [statuses]);
}

// ===========================================
// CSS-IN-JS STYLES (to be added to index.css)
// ===========================================
//
// These styles should be in index.css:
//
// .field-status {
//   display: inline-flex;
//   align-items: center;
//   gap: 0.25rem;
//   font-size: 0.75rem;
//   transition: opacity 150ms ease-out;
// }
//
// .field-status--saved {
//   color: rgba(74, 222, 128, 0.7);
// }
//
// .field-status--dirty {
//   color: rgba(251, 191, 36, 0.7);
// }
//
// .field-status--saving {
//   color: var(--slate-light);
// }
//
// .field-status--error {
//   color: #f87171;
// }
//
// .field-status__dot {
//   width: 0.375rem;
//   height: 0.375rem;
//   border-radius: 50%;
//   background-color: #fbbf24;
//   animation: pulse 1.5s ease-in-out infinite;
// }
//
// .field-status__retry {
//   margin-left: 0.25rem;
//   text-decoration: underline;
//   cursor: pointer;
//   transition: color 150ms ease-out;
// }
//
// .field-status__retry:hover {
//   color: #fca5a5;
// }
