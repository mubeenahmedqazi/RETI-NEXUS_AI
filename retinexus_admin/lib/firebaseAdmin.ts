import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Deleting a Firebase user requires the Admin SDK (a service account), never the client
// SDK — this project doesn't have one configured yet, so this degrades gracefully: if
// FIREBASE_SERVICE_ACCOUNT isn't set, Firebase-side deletion is skipped (not attempted,
// not crashed on) and the caller is told plainly, rather than the whole admin action
// failing over a credential that hasn't been wired in.
let app: App | null | undefined;

function getFirebaseAdminApp(): App | null {
  if (app !== undefined) return app;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    app = null;
    return app;
  }

  try {
    // Accepts either the raw JSON (pasted directly into the env var) or a filesystem
    // path to the downloaded service-account .json file.
    const serviceAccount = raw.trim().startsWith('{')
      ? JSON.parse(raw)
      : JSON.parse(require('fs').readFileSync(raw, 'utf-8'));

    app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK — check FIREBASE_SERVICE_ACCOUNT:', err);
    app = null;
  }
  return app;
}

export type DeleteFirebaseUserResult =
  | { status: 'deleted' }
  | { status: 'skipped_not_configured' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export async function deleteFirebaseUser(uid: string): Promise<DeleteFirebaseUserResult> {
  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    return { status: 'skipped_not_configured' };
  }

  try {
    await getAuth(adminApp).deleteUser(uid);
    return { status: 'deleted' };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      return { status: 'not_found' };
    }
    return { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' };
  }
}
