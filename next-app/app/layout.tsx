import type { Metadata, Viewport } from 'next';
import { Sarabun, Geist_Mono } from 'next/font/google';
import { BRAND } from '@/lib/materials/brand';
import './globals.css';

const sarabun = Sarabun({
  variable: '--font-sans',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: BRAND.shopName,
  description: BRAND.tagline,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
