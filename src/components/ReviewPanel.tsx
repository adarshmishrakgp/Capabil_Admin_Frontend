'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import ApplicationDetailView from './ApplicationDetailView';

/**
 * The review drawer on the applications table. It is only the shell — every
 * field and action lives in ApplicationDetailView, which the standalone
 * /applications/[id] page renders too.
 */
export default function ReviewPanel({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), iframe');
      if (!items?.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40" onClick={onClose}>
      <aside
        ref={panelRef}
        tabIndex={-1}
        className="scrollbar-thin h-dvh w-full max-w-[860px] overflow-y-auto overscroll-contain bg-ink-50 shadow-pop outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Application review"
      >
        <ApplicationDetailView applicationId={applicationId} onClose={onClose} />

        <div className="border-t border-ink-200 px-6 py-4">
          <Link href={`/applications/${applicationId}`} className="btn-subtle">
            Open as a full page ↗
          </Link>
        </div>
      </aside>
    </div>
  );
}
