import { MessagingAuth } from './MessagingAuth.jsx';
import { LiveConversation } from './LiveConversation.jsx';
import { LiveChatList } from './LiveChatList.jsx';
import '../workspace/channels/channels.css';
import { isSamplePerson } from '../shared/accountPeople.js';
import { SampleConversation } from './SampleConversation.jsx';

// Existing import path retained; direct messaging now uses Supabase Auth and Postgres.
export function DirectChatPreview({ person, me }) {
  if (isSamplePerson(person)) return <SampleConversation key={person.id} person={person} />;
  return (
    <MessagingAuth me={me}>
      {({ account, client }) => <><LiveChatList account={account} client={client} activePersonId={person.id} /><LiveConversation key={`${account.id}:${person.id}`} account={account} client={client} person={person} /></>}
    </MessagingAuth>
  );
}
