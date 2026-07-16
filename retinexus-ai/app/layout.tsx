import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Retinexus AI',
    template: '%s | Retinexus AI',
  },
  description: 'Advanced AI-powered retinal disease detection platform',
  // ✅ ADD FAVICON HERE
  icons: {
    icon: '/favicon.ico',           // Main favicon
    shortcut: '/favicon.ico',       // Shortcut icon
    apple: '/favicon.ico',          // Apple touch icon
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a1a] text-white antialiased overflow-x-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#0a0a1a]" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
          <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
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
          theme="dark"
          toastStyle={{
            background: 'linear-gradient(135deg, #0a0a1a, #1a1a2e)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            color: '#fff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        />
      </body>
    </html>
  );
}