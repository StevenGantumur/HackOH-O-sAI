import { Page } from '../../app/Page.jsx';
import { href, useRoute } from '../../shared/router.js';
import { channelsInProject, getProject, getUser, membershipsOf } from '../../shared/selectors.js';
import { useData, useMe } from '../../shared/store.js';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { ChannelsLayout } from './ChannelsLayout.jsx';
import { DirectChatPreview } from '../../teamup/DirectChatPreview.jsx';
import { MessagingAuth } from '../../teamup/MessagingAuth.jsx';
import { LiveChatList } from '../../teamup/LiveChatList.jsx';

export function MessagesPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const personId = query.get('person');
  const person = getUser(data, personId);
  const groups = membershipsOf(data, me.id)
    .map((m) => getProject(data, m.project_id))
    .filter(Boolean)
    .map((project) => ({ project, channels: channelsInProject(data, project.id) }));

  return (
    <Page title="Messages" subtitle={personId ? 'Plan your next collaboration.' : 'Channels for the projects you’re on.'} bodyClassName="page-body-fill">
      {!personId && <MessagingAuth me={me}>{({ account, client }) => <LiveChatList account={account} client={client} />}</MessagingAuth>}
      {personId ? (
        person ? (
          <DirectChatPreview key={`${me.id}:${person.id}`} person={person} me={me} />
        ) : (
          <EmptyState icon="mail" title="Conversation unavailable" action={<a className="btn btn-primary" href={href('/team-up')}>Back to Team Up</a>}>
            Choose another student from Team Up to open a chat preview.
          </EmptyState>
        )
      ) : groups.length ? (
        <ChannelsLayout groups={groups} activeId={query.get('channel')} linkFor={(channel) => href('/messages', { channel: channel.id })} />
      ) : (
        <EmptyState
          icon="mail"
          title="No channels yet"
          action={
            <a className="btn btn-primary" href="#/missions">
              Browse missions
            </a>
          }
        >
          Every project has its own channels. Join one to talk with the team.
        </EmptyState>
      )}
    </Page>
  );
}
