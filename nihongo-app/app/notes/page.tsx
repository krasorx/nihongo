// ANONYMOUS_MODE_DISABLED
// To re-enable: remove the redirect below and restore the original content
import { redirect } from 'next/navigation';

export default function NotesPage() {
  redirect('/dashboard');
}
