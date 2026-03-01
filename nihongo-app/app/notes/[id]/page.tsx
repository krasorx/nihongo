// ANONYMOUS_MODE_DISABLED
// To re-enable: remove the redirect below and restore the original content:
// import NoteGroupPage from '../../components/noteGroup';
// export default function NoteGroup({ params }: { params: { id: string } }) {
//   return <NoteGroupPage hashId={params.id} endpoint="https://api.luisesp.cloud/api/redis/notes" />;
// }
import { redirect } from 'next/navigation';

export default function NoteGroup() {
  redirect('/dashboard');
}
