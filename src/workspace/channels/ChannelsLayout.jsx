import { href, useRoute } from '../../shared/router.js';
import { channelsInProject, getChannel, getProject } from '../../shared/selectors.js';
import { useData } from '../../shared/store.js';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { ChannelView } from './ChannelView.jsx';
import './channels.css';

// Channel list on the left, conversation on the right. `groups` is [{ project, channels }].
export function ChannelsLayout({ groups, activeId, linkFor }) {
  const data = useData();
  const fallback = groups.find((g) => g.channels.length)?.channels[0];
  const requested = activeId ? getChannel(data, activeId) : null;
  const active = requested && groups.some((g) => g.channels.some((c) => c.id === requested.id)) ? requested : fallback;

  if (!active) {
    return <EmptyState icon="hash" title="No channels yet" />;
  }

  return (
    <div className="channels-layout">
      <nav className="channel-nav" aria-label="Channels">
        {groups.map(({ project, channels }) => (
          <div key={project.id} className="channel-group">
            <p className="channel-group-title">{project.title}</p>
            <ul>
              {channels.map((channel) => {
                const isActive = channel.id === active.id;
                return (
                  <li key={channel.id}>
                    <a className={`channel-link ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined} href={linkFor(channel)}>
                      <Icon name="hash" size={16} />
                      {channel.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <ChannelView key={active.id} channel={active} project={getProject(data, active.project_id)} />
    </div>
  );
}

export function ProjectChannels({ project }) {
  const data = useData();
  const { query } = useRoute();
  return (
    <ChannelsLayout
      groups={[{ project, channels: channelsInProject(data, project.id) }]}
      activeId={query.get('channel')}
      linkFor={(channel) => href(`/projects/${project.id}`, { tab: 'channels', channel: channel.id })}
    />
  );
}
