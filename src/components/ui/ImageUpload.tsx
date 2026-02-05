import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    value?: string;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    /** NEW: If provided, opens editor with ObjectURL instead of passing file directly */
    onOpenEditor?: (blobUrl: string, file: File) => void;
    label?: string;
    accept?: string;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    onOpenEditor,
    label,
    accept = 'image/*',
    className = ''
}: ImageUploadProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, []);

    const processFile = useCallback((file: File) => {
        const objectUrl = URL.createObjectURL(file);

        // If onOpenEditor is provided, trigger the editor flow
        // NO Firebase upload happens here
        if (onOpenEditor) {
            onOpenEditor(objectUrl, file);
            // Don't set preview - editor will handle display
            return;
        }

        // Backward compatibility: original behavior
        setPreview(objectUrl);
        onChange(file);
    }, [onChange, onOpenEditor]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    }, [processFile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
        // Reset input value to allow re-selecting the same file
        e.target.value = '';
    };

    const handleRemove = () => {
        // Revoke ObjectURL if it's a blob URL
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        onChange(null);
        onRemove?.();
    };

    return (
        <div className={`form-group ${className}`}>
            {label && <label className="label">{label}</label>}

            {preview || value ? (
                <div className="relative group">
                    <img
                        src={preview || value}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-sm border border-slate-medium"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-anthracite/80 text-cream rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`dropzone relative ${isDragActive ? 'active' : ''}`}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                        <Upload className="w-10 h-10 text-slate-light mb-3" />
                        <p className="text-cream-warm mb-1">Sleep een afbeelding hierheen</p>
                        <p className="text-sm text-slate-light">of klik om te uploaden</p>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ImageGalleryUploadProps {
    /** Called with files when user selects images (for immediate NanoBanana gate) */
    onUpload: (files: File[]) => void;
    multiple?: boolean;
}

export function ImageGalleryUpload({ onUpload, multiple = true }: ImageGalleryUploadProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            onUpload(multiple ? files : [files[0]]);
        }
    }, [onUpload, multiple]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onUpload(multiple ? files : [files[0]]);
        }
        // Reset input value to allow re-selecting the same file
        e.target.value = '';
    };

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`dropzone relative ${isDragActive ? 'active' : ''}`}
        >
            <input
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center py-4 pointer-events-none">
                <ImageIcon className="w-8 h-8 text-slate-light mb-2" />
                <p className="text-cream-warm">Upload afbeeldingen</p>
                <p className="text-sm text-slate-light">Drag & drop of klik</p>
            </div>
        </div>
    );
}
