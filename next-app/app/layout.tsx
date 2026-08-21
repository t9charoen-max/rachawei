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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rachawei.vercel.app';
const logoUrl = `${basePath}${BRAND.logoPath}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: BRAND.shopName,
  description: BRAND.tagline,
  icons: {
    icon: [{ url: logoUrl, type: 'image/png' }],
    apple: [{ url: logoUrl }],
  },
  openGraph: {
    title: BRAND.shopName,
    description: BRAND.tagline,
    images: [{ url: logoUrl }],
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
