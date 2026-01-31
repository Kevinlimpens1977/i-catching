import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo
} from 'lucide-react';

interface TipTapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3]
                }
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-sm'
                }
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-gold hover:text-gold-muted underline'
                }
            })
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none'
            }
        }
    });

    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt('Link URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('Afbeelding URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="tiptap-editor">
            <div className="tiptap-toolbar">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    title="Vet"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    title="Cursief"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-medium mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    title="Koptekst 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                    title="Koptekst 3"
                >
                    <Heading3 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-medium mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    title="Opsomming"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    title="Genummerde lijst"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                    title="Citaat"
                >
                    <Quote className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-medium mx-1" />

                <button
                    type="button"
                    onClick={addLink}
                    className={editor.isActive('link') ? 'is-active' : ''}
                    title="Link toevoegen"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    title="Afbeelding toevoegen"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Ongedaan maken"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Opnieuw"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
