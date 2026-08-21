import type { Metadata, Viewport } from 'next';
import { Sarabun, Noto_Serif_Thai, Geist_Mono } from 'next/font/google';
import { BRAND } from '@/lib/materials/brand';
import './globals.css';

const sarabun = Sarabun({
  variable: '--font-sarabun',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
});

const notoSerifThai = Noto_Serif_Thai({
  variable: '--font-display',
  subsets: ['thai', 'latin'],
  weight: ['500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: BRAND.shopName,
  description: BRAND.tagline,
  icons: {
    icon: [{ url: BRAND.logoPath, type: 'image/png' }],
    apple: [{ url: BRAND.logoPath }],
  },
  openGraph: {
    title: BRAND.shopName,
    description: BRAND.tagline,
    images: [{ url: BRAND.logoPath }],
  },
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
    <html
      lang="th"
      className={`${sarabun.variable} ${notoSerifThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
