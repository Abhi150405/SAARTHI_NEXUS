import React, { useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

/**
 * RichTextEditor — a zero-external-dependency rich text editor.
 * Uses contenteditable + document.execCommand.
 * Supports: Bold, Italic, Underline, H1, H2, Ordered/Unordered lists, Links, Code, Clear.
 *
 * Props:
 *   value        {string}   — controlled HTML value
 *   onChange     {fn}       — called with sanitized HTML string on change
 *   placeholder  {string}   — placeholder text when empty
 *   className    {string}   — additional class for the wrapper
 */
const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...', className = '' }) => {
    const editorRef = useRef(null);
    const isInternalChange = useRef(false);

    // Sync external value → DOM only when it doesn't match (e.g. on form reset)
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        // Only sync from outside when value is empty (form reset) or first mount
        if (value === '' || value === '<p><br></p>') {
            if (el.innerHTML !== '' && el.innerHTML !== '<br>') {
                el.innerHTML = '';
            }
        }
    }, [value]);

    const emitChange = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        const raw = el.innerHTML;
        const sanitized = DOMPurify.sanitize(raw, {
            ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'ul', 'ol', 'li', 'a', 'pre', 'code', 'span', 'div'],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
        });
        isInternalChange.current = true;
        onChange(sanitized);
    }, [onChange]);

    const execCmd = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        emitChange();
    };

    const insertHeading = (tag) => {
        editorRef.current?.focus();
        document.execCommand('formatBlock', false, tag);
        emitChange();
    };

    const insertLink = () => {
        const url = prompt('Enter URL (include https://):', 'https://');
        if (url) {
            execCmd('createLink', url);
            // Make link open in new tab
            const links = editorRef.current?.querySelectorAll('a');
            links?.forEach(a => {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            });
        }
        emitChange();
    };

    const insertCode = () => {
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString() || 'code here';
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = selectedText;
            pre.appendChild(code);
            range.deleteContents();
            range.insertNode(pre);
            // Move cursor after the pre tag
            const newRange = document.createRange();
            newRange.setStartAfter(pre);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        emitChange();
    };

    const clearFormat = () => {
        execCmd('removeFormat');
        document.execCommand('formatBlock', false, 'p');
        emitChange();
    };

    const toolbarButtons = [
        {
            group: 'format',
            items: [
                { label: 'B', title: 'Bold', action: () => execCmd('bold'), style: { fontWeight: 'bold' } },
                { label: 'I', title: 'Italic', action: () => execCmd('italic'), style: { fontStyle: 'italic' } },
                { label: 'U', title: 'Underline', action: () => execCmd('underline'), style: { textDecoration: 'underline' } },
            ]
        },
        {
            group: 'heading',
            items: [
                { label: 'H1', title: 'Heading 1', action: () => insertHeading('h1') },
                { label: 'H2', title: 'Heading 2', action: () => insertHeading('h2') },
            ]
        },
        {
            group: 'list',
            items: [
                { label: '≡', title: 'Bullet List', action: () => execCmd('insertUnorderedList'), style: { fontSize: '1.1rem' } },
                { label: '1≡', title: 'Numbered List', action: () => execCmd('insertOrderedList'), style: { fontSize: '0.85rem' } },
            ]
        },
        {
            group: 'insert',
            items: [
                { label: '🔗', title: 'Insert Link', action: insertLink },
                { label: '</>', title: 'Code Block', action: insertCode, style: { fontFamily: 'monospace', fontSize: '0.8rem' } },
                { label: '✕', title: 'Clear Formatting', action: clearFormat },
            ]
        }
    ];

    return (
        <div className={`rte-wrapper ${className}`}>
            {/* Toolbar */}
            <div className="rte-toolbar" onMouseDown={e => e.preventDefault()}>
                {toolbarButtons.map((group, gi) => (
                    <span key={gi} className="rte-btn-group">
                        {group.items.map((btn, bi) => (
                            <button
                                key={bi}
                                type="button"
                                title={btn.title}
                                className="rte-btn"
                                style={btn.style || {}}
                                onClick={btn.action}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </span>
                ))}
            </div>

            {/* Editable content area */}
            <div
                ref={editorRef}
                className="rte-editor"
                contentEditable
                suppressContentEditableWarning
                onInput={emitChange}
                data-placeholder={placeholder}
            />
        </div>
    );
};

export default RichTextEditor;
