import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CapabilIQ Admin', template: '%s · CapabilIQ Admin' },
  description: 'Careers, content, audience and lead operations for capabiliq.com',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions can inject attributes on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
