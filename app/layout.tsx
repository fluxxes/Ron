// Copyright (c) 2026 (RON). Developed by (fluxes) All rights reserved.
import './globals.css';
import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { SiteSettingsProvider } from './lib/siteSettings';
import { LanguageProvider } from './lib/useTranslation';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'متجر RON | كل ما تحتاجه لعالم القهوة',
  description: 'تصفح حبوبنا الطازجة، القهوة المطحونة، القهوة العربية، وأدوات التحضير المختارة بعناية.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.className} ${inter.variable} bg-[#FAF7F2] text-[#231F1E]`}>
        <SiteSettingsProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}