import Image from 'next/image';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-3">
            <Image src="/logo-mark.png" alt="" width={58} height={64} priority className="h-9 w-auto" />
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight text-ink-900">CapabilIQ</p>
              <p className="text-[13px] text-ink-400">Admin Console</p>
            </div>
          </div>

          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink-900">
            Sign in to the <span className="text-gradient">console</span>
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">Use your CapabilIQ work account.</p>

          <Suspense fallback={<div className="mt-7 h-64" />}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-[13px] text-ink-400">
            Protected by rate limiting and account lockout. Super Admin accounts require 2FA.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(700px_circle_at_25%_15%,#fff,transparent_60%)]" />
        <div className="absolute inset-0 [background:radial-gradient(900px_circle_at_90%_100%,rgba(18,10,22,.75),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md text-[26px] font-medium leading-snug">
            “Every application, article, subscriber and enquiry — in one place, owned by the team that runs them.”
          </blockquote>
          <p className="mt-6 text-[15px] text-white/70">CapabilIQ Admin Console · Careers · Content · Audience · Leads</p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
            {[
              ['412', 'applications this month'],
              ['2,841', 'newsletter subscribers'],
              ['33', 'published articles'],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="text-2xl font-semibold">{v}</dt>
                <dd className="mt-0.5 text-[13px] text-white/70">{k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
