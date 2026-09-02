import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import AssetPrefetcher from '@/components/AssetPrefetcher';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RetiNexus AI | Home',
  description:
    'RetiNexus AI reads retinal microvasculature to screen for diabetic retinopathy and early cardiac & renal risk, non-invasively, from a single fundus photograph.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8fafc',
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('retinexus-theme');
    if (stored === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (stored === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased overflow-x-hidden">
        <ThemeProvider>{children}</ThemeProvider>
        <AssetPrefetcher />
      </body>
    </html>
  );
}
