import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/config';
import { getAccessToken } from '@/lib/session';

/** Stream private resumes through the admin origin so PDF previews work across hosts. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Please sign in to view resumes.' }, { status: 401 });
  const { id } = await context.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: 'Invalid application.' }, { status: 400 });
  try {
    const permission = await fetch(`${API_URL}/admin/applications/${id}/resume-url`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    const body = await permission.json();
    if (!permission.ok) {
      return NextResponse.json({ error: body?.error?.message ?? 'Resume unavailable.' }, { status: permission.status });
    }
    const url = new URL(body.data.url);
    if (url.origin !== new URL(API_URL).origin && url.origin !== 'https://api.cloudinary.com') {
      throw new Error('Unexpected storage host');
    }
    const file = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(60000) });
    if (!file.ok || !file.body) {
      if (file.status === 404) return NextResponse.json({ error: 'The resume file is missing from storage.' }, { status: 404 });
      return NextResponse.json({ error: 'Could not retrieve the resume. Please check the storage configuration.' }, { status: 502 });
    }
    const filename = String(body.data.filename ?? 'resume').replace(/[\r\n"\\]/g, '_');
    return new Response(file.body, {
      headers: {
        'Content-Type': file.headers.get('content-type') ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the resume. Please try again.' }, { status: 502 });
  }
}
