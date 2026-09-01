/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // firebase-admin is already Next's own auto-external list; cloudinary isn't, and hit the
  // exact same "Failed to load external module" Vercel bundling bug firebase-admin did
  // before that was worked around — externalize it up front instead of waiting to hit it.
  serverExternalPackages: ['cloudinary'],
};

export default nextConfig;
