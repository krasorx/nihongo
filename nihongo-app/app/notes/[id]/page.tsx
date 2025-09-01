import NoteGroupPage from '../../components/noteGroup';
import { redisApi } from '../../utils/api';

export default function NoteGroup({ params }: { params: { id: string } }) {
  return <NoteGroupPage hashId={params.id} endpoint="https://api.luisesp.cloud/api/redis/notes" />;
}