'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, EmptyState, Table, cn } from './ui';

export type TaxonomyItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
};

/**
 * Create, rename and delete one taxonomy — categories or tags. Both are the
 * same shape and the same endpoints, so they share a component rather than
 * being written twice with a word changed.
 *
 * Renaming deliberately leaves the slug alone: it is already in published URLs
 * and in Google's index, so an editor fixing a typo in a display name must not
 * silently break every link that points at it.
 */
export default function TaxonomyManager({
  kind,
  title,
  description,
  items,
  withDescription = false,
}: {
  kind: 'categories' | 'tags';
  title: string;
  description: string;
  items: TaxonomyItem[];
  withDescription?: boolean;
}) {
  const router = useRouter();
  const noun = kind === 'categories' ? 'category' : 'tag';

  const [name, setName] = useState('');
  const [blurb, setBlurb] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftBlurb, setDraftBlurb] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(request: () => Promise<Response>, fallback: string) {
    setBusy(true);
    setError(null);
    const res = await request();
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error?.message ?? fallback);
      return false;
    }
    router.refresh();
    return true;
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError(`A ${noun} name needs at least two characters`);
      return;
    }
    const done = await send(
      () =>
        fetch(`/api/proxy/admin/${kind}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), ...(blurb.trim() ? { description: blurb.trim() } : {}) }),
        }),
      `Could not create that ${noun}`,
    );
    if (done) {
      setName('');
      setBlurb('');
    }
  }

  async function rename(id: string) {
    const done = await send(
      () =>
        fetch(`/api/proxy/admin/${kind}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: draftName.trim(),
            ...(withDescription ? { description: draftBlurb.trim() } : {}),
          }),
        }),
      `Could not rename that ${noun}`,
    );
    if (done) setEditing(null);
  }

  async function remove(item: TaxonomyItem) {
    if (!confirm(`Delete the ${noun} “${item.name}”?`)) return;
    await send(() => fetch(`/api/proxy/admin/${kind}/${item._id}`, { method: 'DELETE' }), `Could not delete that ${noun}`);
  }

  return (
    <Card title={title} description={description} padded={false}>
      <form onSubmit={create} className="flex flex-wrap items-start gap-2 border-b border-ink-200 px-5 py-4">
        <div className="min-w-[180px] flex-1">
          <input
            className="field"
            placeholder={kind === 'categories' ? 'e.g. Workforce' : 'e.g. Hiring'}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={`New ${noun} name`}
          />
        </div>
        {withDescription && (
          <div className="min-w-[220px] flex-[2]">
            <input
              className="field"
              placeholder="Short description (optional)"
              value={blurb}
              onChange={(event) => setBlurb(event.target.value)}
              aria-label={`New ${noun} description`}
            />
          </div>
        )}
        <button className="btn-primary shrink-0" disabled={busy}>
          {busy ? 'Saving…' : `Add ${noun}`}
        </button>
      </form>

      {error && (
        <p role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-[15px] text-rose-700">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState title={`No ${kind} yet`} hint={`Add one above — posts can then be filed under it.`} />
      ) : (
        <Table head={['Name', 'Slug', 'Posts', '']}>
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-ink-50/60">
              <td className="td max-w-[420px] whitespace-normal">
                {editing === item._id ? (
                  <div className="grid gap-2">
                    <input
                      className="field"
                      value={draftName}
                      autoFocus
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') rename(item._id);
                        if (event.key === 'Escape') setEditing(null);
                      }}
                      aria-label={`Rename ${item.name}`}
                    />
                    {withDescription && (
                      <input
                        className="field"
                        placeholder="Short description"
                        value={draftBlurb}
                        onChange={(event) => setDraftBlurb(event.target.value)}
                        aria-label={`Description for ${item.name}`}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-ink-900">{item.name}</span>
                    {item.description && <span className="mt-0.5 block text-[13px] text-ink-400">{item.description}</span>}
                  </>
                )}
              </td>
              <td className="td font-mono text-[13px] text-ink-500">{item.slug}</td>
              <td className="td">
                <span className={cn(item.postCount ? 'text-ink-700' : 'text-ink-400')}>{item.postCount ?? 0}</span>
              </td>
              <td className="td text-right">
                {editing === item._id ? (
                  <div className="flex justify-end gap-1.5">
                    <button className="btn-subtle px-2 py-1 text-[13px]" onClick={() => setEditing(null)} disabled={busy}>
                      Cancel
                    </button>
                    <button className="btn-primary px-2 py-1 text-[13px]" onClick={() => rename(item._id)} disabled={busy}>
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1.5">
                    <button
                      className="btn-subtle px-2 py-1 text-[13px]"
                      onClick={() => {
                        setEditing(item._id);
                        setDraftName(item.name);
                        setDraftBlurb(item.description ?? '');
                        setError(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn-subtle px-2 py-1 text-[13px] text-rose-600 hover:bg-rose-50"
                      onClick={() => remove(item)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
