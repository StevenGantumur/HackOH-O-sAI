import { useEffect, useMemo, useState } from 'react';
import { ToastProvider } from '../shared/ui/Toast.jsx';
import { closeTask, matchPath, useRoute } from '../shared/router.js';
import { ShellContext } from './shellContext.js';
import { Sidebar } from './Sidebar.jsx';
import { SearchPalette } from './SearchPalette.jsx';
import { HomePage } from './HomePage.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';
import { MissionsPage } from '../missions/MissionsPage.jsx';
import { ReviewsPage } from '../missions/ReviewsPage.jsx';
import { ProjectsPage } from '../discovery/ProjectsPage.jsx';
import { ProjectPage } from '../workspace/ProjectPage.jsx';
import { TasksPage } from '../workspace/tasks/TasksPage.jsx';
import { TaskDrawer } from '../workspace/tasks/TaskDrawer.jsx';
import { MessagesPage } from '../workspace/channels/MessagesPage.jsx';
import { CoachPage } from '../agents/CoachPage.jsx';
import { ProfilePage } from '../profiles/ProfilePage.jsx';
import './shell.css';

const ROUTES = [
  ['/', () => <HomePage />],
  ['/missions', () => <MissionsPage />],
  ['/projects', () => <ProjectsPage />],
  ['/projects/:id', ({ id }) => <ProjectPage projectId={id} />],
  ['/tasks', () => <TasksPage />],
  ['/reviews', () => <ReviewsPage />],
  ['/messages', () => <MessagesPage />],
  ['/coach', () => <CoachPage />],
  ['/profile', () => <ProfilePage />],
  ['/people/:id', ({ id }) => <ProfilePage userId={id} />],
];

function renderRoute(path) {
  for (const [pattern, render] of ROUTES) {
    const params = matchPath(pattern, path);
    if (params) return render(params);
  }
  return <NotFoundPage />;
}

export default function App() {
  const route = useRoute();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const taskId = route.query.get('task');

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const shell = useMemo(() => ({ openNav: () => setNavOpen(true), openSearch: () => setSearchOpen(true) }), []);

  return (
    <ToastProvider>
      <ShellContext.Provider value={shell}>
        <button type="button" className="skip-link" onClick={() => document.getElementById('main-content')?.focus()}>
          Skip to content
        </button>
        <div className="app-frame">
          <div className="app">
            <Sidebar path={route.path} query={route.query} open={navOpen} onClose={() => setNavOpen(false)} />
            <main className="main" id="main-content" tabIndex={-1}>
              {renderRoute(route.path)}
            </main>
          </div>
        </div>
        {taskId && <TaskDrawer key={taskId} taskId={taskId} onClose={closeTask} />}
        {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      </ShellContext.Provider>
    </ToastProvider>
  );
}
