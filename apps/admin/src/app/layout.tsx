import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Playroom Admin',
  description: 'Admin dashboard for The Playroom trust and safety operations.',
  icons: {
    icon: [{ url: '/brand/pineapple-app-icon.png?v=20260709b', type: 'image/png' }],
    apple: [{ url: '/brand/pineapple-app-icon.png?v=20260709b' }],
    shortcut: ['/brand/pineapple-app-icon.png?v=20260709b']
  }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
