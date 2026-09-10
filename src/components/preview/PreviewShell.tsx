'use client';

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PreviewDevice = 'desktop' | 'mobile';

/** Widths the preview is rendered at, then scaled to fit the drawer. */
const DEVICE_WIDTH: Record<PreviewDevice, number> = { desktop: 1280, mobile: 390 };

/**
 * Full-screen drawer that shows an editor how their work will look on the
 * public website before it is published.
 *
 * The preview renders from the *unsaved* form state rather than from the API,
 * so it works on a brand-new draft — the case a "view live page" link cannot
 * cover, because a draft has no public URL yet.
 *
 * The page is rendered at a real device width and scaled down with a CSS
 * transform rather than being reflowed into the drawer. Reflowing would show
 * the editor a layout no visitor will ever see; scaling keeps the proportions
 * honest, which is the entire point of a preview.
 */
export default function PreviewShell({
  title,
  subtitle,
  open,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [scale, setScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);

  // Escape closes, and the page behind must not scroll while the drawer is up.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  const width = DEVICE_WIDTH[device];

  /**
   * Fit the page into the drawer by scaling, never by shrinking its width: a
   * reflowed preview shows a layout no visitor will ever see. The scale is
   * measured rather than assumed, so it stays right when the window resizes.
   */
  useLayoutEffect(() => {
    if (!open) return;
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;

    const measure = () => {
      // Never scale up — a 390px mobile frame blown up to fill a desktop
      // drawer would misrepresent how large the type actually is.
      setScale(Math.min(1, viewport.clientWidth / width));
      setPageHeight(page.scrollHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(page);
    return () => observer.disconnect();
  }, [open, width, children]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <header className="flex flex-wrap items-center gap-3 border-b border-ink-200 bg-white px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink-900">{title}</p>
          {subtitle && <p className="truncate text-[13px] text-ink-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-ink-100 p-1" role="group" aria-label="Preview width">
          {(['desktop', 'mobile'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDevice(value)}
              aria-pressed={device === value}
              className={[
                'rounded-lg px-3 py-1.5 text-[13px] font-medium capitalize transition-colors',
                device === value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
              ].join(' ')}
            >
              {value}
            </button>
          ))}
        </div>

        <button type="button" className="btn-subtle" onClick={onClose}>
          Close preview
        </button>
      </header>

      <div ref={viewportRef} className="flex-1 overflow-auto bg-ink-200/60 p-6">
        {/*
          A transform takes the page out of flow, so the wrapper reserves the
          *scaled* box — otherwise the drawer would scroll by the full 1280px
          sideways and by the unscaled height downwards.
        */}
        <div
          className="mx-auto"
          style={{ width: `${width * scale}px`, height: pageHeight ? `${pageHeight * scale}px` : undefined }}
        >
          <div
            ref={pageRef}
            className={[
              'origin-top-left overflow-hidden bg-white shadow-2xl',
              device === 'mobile' ? 'rounded-[28px] ring-8 ring-ink-900/80' : 'rounded-xl',
            ].join(' ')}
            style={{ width: `${width}px`, transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      </div>

      <footer className="border-t border-ink-200 bg-white px-5 py-2.5 text-center text-[13px] text-ink-400">
        A representation of the public page, drawn from what is currently in the form — including unsaved changes.
      </footer>
    </div>
  );
}
