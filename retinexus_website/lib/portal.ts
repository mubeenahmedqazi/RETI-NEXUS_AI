// The clinical portal (retinexus_portal) is a separate app/deployment, now live at
// reti-nexus-ai-portal.vercel.app — that's the default here so "Launch Clinical Portal"
// works correctly out of the box; override via NEXT_PUBLIC_PORTAL_URL to point at a local
// portal dev server (typically :3002) while developing this site locally.
export const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://reti-nexus-ai-portal.vercel.app';

export const PORTAL_LOGIN_URL = `${PORTAL_URL}/login`;
export const PORTAL_SIGNUP_URL = `${PORTAL_URL}/signup`;
