'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from './ui';

/**
 * The article body editor.
 *
 * Deliberately dependency-free: the panel ships no editor library, and a blog
 * body only needs headings, emphasis, lists, quotes, links and images. It is a
 * `contentEditable` surface driven by `document.execCommand` — deprecated on
 * paper, but the only formatting API every current browser still implements,
 * and the alternative is a 300 kB dependency for six buttons.
 *
 * The surface is uncontrolled on purpose. Writing `innerHTML` back on every
 * keystroke would collapse the caret to the start of the document, so the HTML
 * is seeded once and after that the editor owns it, reporting changes upward.
 * `Source` swaps in a plain textarea for anyone who would rather write the
 * markup directly; whichever view is open is the one that is read on save.
 */

type Command = {
  label: string;
  title: string;
  run: (exec: (command: string, value?: string) => void) => void;
  /** `queryCommandState` name, when the button reflects an on/off state. */
  state?: string;
  wide?: boolean;
};

const COMMANDS: Command[][] = [
  [
    { label: 'H2', title: 'Section heading', run: (exec) => exec('formatBlock', '<h2>'), wide: true },
    { label: 'H3', title: 'Sub-heading', run: (exec) => exec('formatBlock', '<h3>'), wide: true },
    { label: '¶', title: 'Body text', run: (exec) => exec('formatBlock', '<p>') },
  ],
  [
    { label: 'B', title: 'Bold (Ctrl+B)', run: (exec) => exec('bold'), state: 'bold' },
    { label: 'I', title: 'Italic (Ctrl+I)', run: (exec) => exec('italic'), state: 'italic' },
    { label: 'U', title: 'Underline', run: (exec) => exec('underline'), state: 'underline' },
  ],
  [
    { label: '• List', title: 'Bulleted list', run: (exec) => exec('insertUnorderedList'), wide: true },
    { label: '1. List', title: 'Numbered list', run: (exec) => exec('insertOrderedList'), wide: true },
    { label: '❝', title: 'Blockquote', run: (exec) => exec('formatBlock', '<blockquote>') },
  ],
];

export default function RichTextEditor({
  value,
  onChange,
  onInsertImage,
  onUploadingChange,
  disabled = false,
  placeholder = 'Start writing the article…',
}: {
  value: string;
  onChange: (html: string) => void;
  /** Uploads a file and resolves to its permanent URL, or null if it failed. */
  onInsertImage?: () => Promise<string | null>;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'rich' | 'source'>('rich');
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const seeded = useRef(false);

  // Seed once. After this the DOM is the source of truth for the rich view —
  // see the note at the top of the file.
  useEffect(() => {
    if (mode !== 'rich' || !surfaceRef.current) return;
    if (!seeded.current || surfaceRef.current.innerHTML !== value) {
      if (!seeded.current || document.activeElement !== surfaceRef.current) {
        surfaceRef.current.innerHTML = value || '';
        seeded.current = true;
      }
    }
  }, [mode, value]);

  const publish = useCallback(() => {
    if (surfaceRef.current) onChange(surfaceRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      surfaceRef.current?.focus();
      document.execCommand(command, false, commandValue);
      publish();
      refreshState();
    },
    [publish],
  );

  function refreshState() {
    const next: Record<string, boolean> = {};
    for (const group of COMMANDS) {
      for (const command of group) {
        if (!command.state) continue;
        try {
          next[command.state] = document.queryCommandState(command.state);
        } catch {
          next[command.state] = false;
        }
      }
    }
    setActive(next);
  }

  function addLink() {
    const href = prompt('Link URL', 'https://');
    if (!href) return;
    exec('createLink', href);
    // Outbound links from an article should not hand the target our referrer
    // or a window handle.
    surfaceRef.current?.querySelectorAll('a[href^="http"]').forEach((anchor) => {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noreferrer noopener');
    });
    publish();
  }

  async function addImage() {
    if (!onInsertImage || uploading || disabled) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await onInsertImage();
      if (url) exec('insertHTML', `<figure><img src="${url}" alt="" loading="lazy" /></figure><p><br /></p>`);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  /** Pasting from Word or a website drags a stylesheet in with it. */
  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    publish();
  }

  const isEmpty = !value || value === '<br>' || value === '<p></p>' || value === '<p><br></p>';

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink-200 bg-ink-50/70 px-2 py-1.5">
        {mode === 'rich' &&
          COMMANDS.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-1 border-r border-ink-200 pr-1.5 last:border-0">
              {group.map((command) => (
                <button
                  key={command.label}
                  type="button"
                  title={command.title}
                  aria-pressed={command.state ? Boolean(active[command.state]) : undefined}
                  onMouseDown={(event) => event.preventDefault()} // keep the selection
                  onClick={() => command.run(exec)}
                  className={cn(
                    'grid h-8 place-items-center rounded-lg px-2 text-[13px] font-semibold text-ink-600 hover:bg-white hover:text-ink-900',
                    command.wide ? 'min-w-[2.75rem]' : 'w-8',
                    command.state && active[command.state] ? 'bg-white text-brand-700 shadow-sm' : '',
                  )}
                >
                  {command.label}
                </button>
              ))}
            </div>
          ))}

        {mode === 'rich' && (
          <div className="flex items-center gap-1 border-r border-ink-200 pr-1.5">
            <button
              type="button"
              title="Insert a link"
              onMouseDown={(event) => event.preventDefault()}
              onClick={addLink}
              className="grid h-8 min-w-[2.75rem] place-items-center rounded-lg px-2 text-[13px] font-semibold text-ink-600 hover:bg-white hover:text-ink-900"
            >
              Link
            </button>
            {onInsertImage && (
              <button
                type="button"
                title="Upload and insert an image"
                disabled={uploading || disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={addImage}
                className="grid h-8 min-w-[2.75rem] place-items-center rounded-lg px-2 text-[13px] font-semibold text-ink-600 hover:bg-white hover:text-ink-900 disabled:opacity-50"
              >
                {uploading ? '…' : 'Image'}
              </button>
            )}
            <button
              type="button"
              title="Remove formatting"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => exec('removeFormat')}
              className="grid h-8 w-8 place-items-center rounded-lg text-[13px] font-semibold text-ink-600 hover:bg-white hover:text-ink-900"
            >
              ⌫
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            // Coming back from source, the textarea's HTML has to be re-seeded.
            if (mode === 'source') seeded.current = false;
            setMode(mode === 'rich' ? 'source' : 'rich');
          }}
          className={cn(
            'ml-auto grid h-8 place-items-center rounded-lg px-2.5 text-[13px] font-medium',
            mode === 'source' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-white hover:text-ink-800',
          )}
        >
          {mode === 'source' ? 'Done editing HTML' : 'Source'}
        </button>
      </div>

      {mode === 'rich' ? (
        <div className="relative">
          {isEmpty && (
            <p className="pointer-events-none absolute left-4 top-4 text-[15px] text-ink-400">{placeholder}</p>
          )}
          <div
            ref={surfaceRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Article body"
            spellCheck
            onInput={publish}
            onBlur={publish}
            onPaste={onPaste}
            onKeyUp={refreshState}
            onMouseUp={refreshState}
            className="prose-editor min-h-[420px] w-full bg-white px-4 py-4 text-[15px] leading-7 text-ink-800 focus:outline-none"
          />
        </div>
      ) : (
        <textarea
          className="min-h-[420px] w-full resize-y bg-white px-4 py-4 font-mono text-[13px] leading-6 text-ink-800 focus:outline-none"
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
