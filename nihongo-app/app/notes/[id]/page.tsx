import NoteGroupPage from '../../components/noteGroup';
import { redisApi } from '../../utils/api';

export default function NoteGroup({ params }: { params: { hash: string } }) {
  return <NoteGroupPage hashId={params.hash} endpoint="https://api.luisesp.cloud/api/redis/notes" />;
}