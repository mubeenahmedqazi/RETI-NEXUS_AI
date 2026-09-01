/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Not in Next's own auto-external list (firebase-admin is) — externalizing it up front
  // avoids the same "Failed to load external module" Vercel bundling bug worked around for
  // firebase-admin in retinexus_admin, in case this app is deployed there too.
  serverExternalPackages: ['cloudinary'],
};

export default nextConfig;