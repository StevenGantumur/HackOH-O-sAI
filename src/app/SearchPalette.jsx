import { useId, useMemo, useState } from 'react';
import { ROLE_META } from '../shared/labels.js';
import { profileHeadline } from '../shared/people.js';
import { getProfile, getProject, isOpenMission } from '../shared/selectors.js';
import { href, navigate, openTask } from '../shared/router.js';
import { useData } from '../shared/store.js';
import { Icon } from '../shared/ui/Icon.jsx';
import { Modal } from '../shared/ui/Dialog.jsx';

const KIND_ICON = { Mission: 'target', Task: 'tasks', Project: 'folder', Person: 'user', File: 'file' };

function search(data, text) {
  const q = text.trim().toLowerCase();
  const has = (...fields) => fields.some((f) => f?.toLowerCase().includes(q));
  const results = [];
  for (const task of data.tasks) {
    if (q ? !has(task.title, task.description) : !isOpenMission(task)) continue;
    results.push({
      id: task.id,
      kind: isOpenMission(task) ? 'Mission' : 'Task',
      title: task.title,
      subtitle: `${ROLE_META[task.role]?.tag ?? ''} in ${getProject(data, task.project_id)?.title}`,
      go: () => openTask(task.id),
    });
  }
  if (q) {
    for (const project of data.projects) {
      if (has(project.title, project.description, project.tags.join(' '))) {
        results.push({ id: project.id, kind: 'Project', title: project.title, subtitle: project.tags.join(', '), go: () => navigate(`/projects/${project.id}`) });
      }
    }
    for (const user of data.users) {
      if (has(user.name)) {
        results.push({ id: user.id, kind: 'Person', title: user.name, subtitle: profileHeadline(getProfile(data, user.id), user), go: () => navigate(`/people/${user.id}`) });
      }
    }
    for (const file of data.files) {
      if (has(file.name)) {
        const project = getProject(data, file.project_id);
        results.push({ id: file.id, kind: 'File', title: file.name, subtitle: project?.title, go: () => navigate(href(`/projects/${file.project_id}`, { tab: 'files', file: file.id })) });
      }
    }
  }
  return results.slice(0, 12);
}

export function SearchPalette({ onClose }) {
  const data = useData();
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = useMemo(() => search(data, text), [data, text]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  function choose(result) {
    onClose();
    result.go();
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[current]) {
      event.preventDefault();
      choose(results[current]);
    }
  }

  return (
    <Modal title="Search" onClose={onClose}>
      <div className="search-box">
        <Icon name="search" />
        <input
          data-autofocus
          className="search-input"
          type="search"
          placeholder="Missions, tasks, projects, people, files"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-label="Search"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results[current] ? `${listId}-${current}` : undefined}
          aria-autocomplete="list"
        />
      </div>
      <p className="search-hint">{text ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Open missions you can claim right now'}</p>
      {results.length ? (
        <ul className="search-results" id={listId} role="listbox" aria-label="Search results">
          {results.map((result, i) => (
            <li
              key={`${result.kind}-${result.id}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === current}
              className={`search-result ${i === current ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(result)}
            >
              <span className="search-result-icon">
                <Icon name={KIND_ICON[result.kind]} size={18} />
              </span>
              <span className="search-result-text">
                <span className="search-result-title">{result.title}</span>
                <span className="search-result-sub">{result.subtitle}</span>
              </span>
              <span className="search-result-kind">{result.kind}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="search-empty">Nothing matches “{text}”. Try a skill, a project name or a person.</p>
      )}
    </Modal>
  );
}
