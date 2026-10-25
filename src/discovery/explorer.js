import { projectIdsOf } from '../shared/selectors.js';
import { rankProjects } from './score.js';

export function projectCollections(data, userId, filters = {}) {
  const memberIds = projectIdsOf(data, userId);
  const ranked = rankProjects(data, userId, filters);

  return {
    discover: ranked.filter(({ project }) => !memberIds.has(project.id)),
    mine: ranked.filter(({ project }) => memberIds.has(project.id)),
    counts: {
      discover: data.projects.filter((project) => !memberIds.has(project.id)).length,
      mine: data.projects.filter((project) => memberIds.has(project.id)).length,
    },
  };
}

export function readProjectPreference(storage, key, allowed, fallback) {
  try {
    const value = storage?.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function saveProjectPreference(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Browsers with blocked storage still keep the in-memory view selection.
  }
}
