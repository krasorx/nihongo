import NoteGroupPage from '../../components/noteGroup';

export default function NoteGroup({ params }: { params: { hash: string } }) {
  return <NoteGroupPage hashId={params.hash} endpoint="https://api.luisesp.cloud/api/notes" />;
}