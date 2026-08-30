import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'RetiNexus Admin',
    template: '%s | RetiNexus Admin',
  },
  description: 'Doctor approval, account controls, and patient oversight for RetiNexus AI.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
  },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased overflow-x-hidden">
        <ThemeProvider>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-[var(--background)]" />
            <div className="absolute inset-0 bg-dot-grid opacity-60" />
            <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-[var(--brand-secondary)]/[0.06] blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[var(--brand-accent)]/[0.07] blur-3xl" />
          </div>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            toastClassName="!rounded-2xl !shadow-2xl"
            style={{ zIndex: 9999 }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
