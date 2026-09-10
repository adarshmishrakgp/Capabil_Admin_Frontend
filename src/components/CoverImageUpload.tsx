'use client';

import { useRef, useState } from 'react';
import { mediaUrl } from '@/lib/config';

export type CoverImage = { url?: string; key?: string; alt?: string };

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads through /api/proxy so the access token stays in its httpOnly cookie.
 * Exported because the body editor inserts inline images the same way.
 */
export async function uploadImage(file: File): Promise<{ url: string; key: string }> {
  if (file.size > MAX_BYTES) throw new Error('Images have to be 5 MB or smaller');
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, AVIF or GIF image');
  }

  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/proxy/admin/media', { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? 'Upload failed');
  if (!body.data?.url || !body.data?.key) throw new Error('The upload did not return an image. Please try again.');
  return { url: body.data.url, key: body.data.key };
}

/** Opens the file picker and uploads whatever comes back. */
export function pickAndUploadImage(): Promise<{ url: string; key: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/avif,image/gif';
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(await uploadImage(file));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Upload failed');
        resolve(null);
      }
    };
    input.click();
  });
}

export default function CoverImageUpload({
  value,
  onChange,
  onUploadingChange,
  disabled = false,
}: {
  value?: CoverImage | null;
  onChange: (cover: CoverImage | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function accept(file?: File | null) {
    if (!file || disabled || uploadInProgress.current) return;
    uploadInProgress.current = true;
    setError(null);
    setBusy(true);
    onUploadingChange?.(true);
    try {
      const uploaded = await uploadImage(file);
      // A replacement keeps the alt text — it describes the article, and
      // retyping it every time an image is swapped is how alt text goes missing.
      onChange({ ...uploaded, alt: value?.alt ?? '' });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      uploadInProgress.current = false;
      setBusy(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div aria-busy={busy}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void accept(file);
        }}
      />

      {value?.url ? (
        <div className="overflow-hidden rounded-xl border border-ink-200">
          {/* A remote admin-API URL that next/image would need configuring for —
              a plain <img> is the right tool for an editor preview. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(value.url, value.key)} alt={value.alt || 'Cover image preview'} className="aspect-[16/9] w-full object-cover" />
          <div className="flex items-center justify-between gap-2 border-t border-ink-200 bg-ink-50/60 px-3 py-2">
            <button type="button" className="btn-subtle px-2 py-1 text-[13px]" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
              {busy ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              className="btn-subtle px-2 py-1 text-[13px] text-rose-600 hover:bg-rose-50"
              disabled={disabled || busy}
              onClick={() => {
                setError(null);
                onChange(null);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files?.[0]);
          }}
          className={[
            'grid w-full place-items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-9 text-center transition-colors',
            dragging ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50/50 hover:border-brand-300',
          ].join(' ')}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink-400 ring-1 ring-inset ring-ink-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6" />
              <circle cx="8.5" cy="9" r="1.5" />
            </svg>
          </span>
          <span className="text-[15px] font-medium text-ink-700">{busy ? 'Uploading…' : 'Add a cover image'}</span>
          <span className="text-[13px] text-ink-400">Drop a file or click · JPG, PNG, WebP up to 5 MB</span>
        </button>
      )}

      {busy && <p role="status" className="mt-2 text-[13px] text-ink-500">Uploading image. Save when the upload finishes.</p>}
      {error && <p role="alert" className="mt-2 text-[13px] text-rose-600">{error}</p>}

      {value?.url && (
        <div className="mt-3">
          <label className="label" htmlFor="cover-alt">
            Alt text
          </label>
          <input
            id="cover-alt"
            className="field"
            disabled={disabled || busy}
            placeholder="Describe the image for screen readers"
            value={value.alt ?? ''}
            onChange={(event) => onChange({ ...value, alt: event.target.value })}
          />
          <p className="mt-1 text-[13px] text-ink-400">
            Read aloud instead of the image, and used by Google. Describe the picture, not the article.
          </p>
        </div>
      )}
    </div>
  );
}
