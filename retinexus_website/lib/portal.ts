// The clinical portal (retinexus-ai) is a separate app/deployment. In local
// dev it runs on :3000 while this presentation site runs on :3001; override
// via NEXT_PUBLIC_PORTAL_URL for staging/production.
export const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';

export const PORTAL_LOGIN_URL = `${PORTAL_URL}/login`;
export const PORTAL_SIGNUP_URL = `${PORTAL_URL}/signup`;
