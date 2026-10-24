import { Page } from '../../app/Page.jsx';
import { href, useRoute } from '../../shared/router.js';
import { channelsInProject, getProject, membershipsOf } from '../../shared/selectors.js';
import { useData, useMe } from '../../shared/store.js';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { ChannelsLayout } from './ChannelsLayout.jsx';

export function MessagesPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const groups = membershipsOf(data, me.id)
    .map((m) => getProject(data, m.project_id))
    .filter(Boolean)
    .map((project) => ({ project, channels: channelsInProject(data, project.id) }));

  return (
    <Page title="Messages" subtitle="Channels for the projects you’re on." bodyClassName="page-body-fill">
      {groups.length ? (
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
