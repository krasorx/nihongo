// ANONYMOUS_MODE_DISABLED
// To re-enable: remove the redirect below and restore the original content:
// import CreateNote from '../../components/createNote';
// const endpoint = "https://api.luisesp.cloud/api/redis/notes";
// export default function CreateNotePage() { return <CreateNote endpoint={endpoint} />; }
import { redirect } from 'next/navigation';

export default function CreateNotePage() {
  redirect('/dashboard');
}
