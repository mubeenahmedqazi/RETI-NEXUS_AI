import { redirect } from 'next/navigation';

// The marketing/presentation site now lives in the standalone `retinexus_website`
// project. This app is the clinical portal itself, so its root just sends
// visitors to sign in.
export default function Home() {
  redirect('/login');
}
