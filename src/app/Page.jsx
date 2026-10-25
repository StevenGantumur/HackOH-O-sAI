import { Icon } from '../shared/ui/Icon.jsx';
import { ThemeToggle } from '../shared/ui/ThemeToggle.jsx';
import { NotificationsMenu } from './NotificationsMenu.jsx';
import { UserMenu } from './UserMenu.jsx';
import { useShell } from './shellContext.js';

// Every page: the header bar from the design (title, page actions, bell, avatar) above a
// scrolling body.
export function Page({ title, documentTitle, subtitle, actions, children, bodyClassName = '', headerClassName = '' }) {
  const { openNav } = useShell();
  const docTitle = documentTitle ?? (typeof title === 'string' ? title : 'Home');
  return (
    <>
      <title>{`${docTitle} – sAI`}</title>
      <header className={`page-header ${headerClassName}`}>
        <button type="button" className="icon-btn nav-toggle" onClick={openNav} aria-label="Open navigation">
          <Icon name="menu" />
        </button>
        <div className="page-heading">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div className="page-actions">
          {actions}
          <ThemeToggle />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </header>
      <div className={`page-body ${bodyClassName}`}>{children}</div>
    </>
  );
}
