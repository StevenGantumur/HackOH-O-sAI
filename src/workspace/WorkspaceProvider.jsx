import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { WorkspaceContext } from '../shared/workspaceContext.js';
import { createLiveProject, createLiveTask, fetchWorkspace, joinLiveMission, joinLiveProject } from '../api/projectMissionApi.js';

const empty = { projects: [], tasks: [], memberships: [], taskContributors: [] };
const mergeRow = (rows, row, key = (item) => item.id) => [...rows.filter((item) => key(item) !== key(row)), row];
const memberKey = (member) => `${member.project_id}:${member.user_id}`;
const contributorKey = (member) => `${member.task_id}:${member.user_id}`;

export function WorkspaceProvider({ children }) {
  const { client } = useAuth();
  const [snapshot, setSnapshot] = useState(empty);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const current = useRef(0);
  const alive = useRef(false);
  const reload = useCallback(async () => {
    const generation = ++current.current;
    setStatus('loading'); setError('');
    try {
      const records = await fetchWorkspace(client);
      if (alive.current && generation === current.current) { setSnapshot(records); setStatus('ready'); }
    } catch (readError) {
      if (alive.current && generation === current.current) { setStatus('error'); setError(readError.message); }
    }
  }, [client]);
  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; current.current += 1; };
  }, [reload]);

  async function joinProject(values) {
    const membership = await joinLiveProject(values, client);
    current.current += 1;
    setSnapshot((previous) => ({ ...previous, memberships: mergeRow(previous.memberships, membership, memberKey) }));
    return membership;
  }
  async function joinMission(values) {
    const receipt = await joinLiveMission(values, client);
    current.current += 1;
    setSnapshot((previous) => ({ ...previous,
      tasks: mergeRow(previous.tasks, receipt.task),
      memberships: mergeRow(previous.memberships, receipt.membership, memberKey),
      taskContributors: mergeRow(previous.taskContributors, receipt.contributor, contributorKey),
    }));
    return receipt;
  }
  async function createProject(values) {
    const project = await createLiveProject(values, client);
    current.current += 1;
    setSnapshot((previous) => ({ ...previous,
      projects: mergeRow(previous.projects, project),
      memberships: mergeRow(previous.memberships, { project_id: project.id, user_id: project.owner_id, role: 'LEADER', joined_at: project.created_at }, memberKey),
    }));
    return project;
  }
  async function createTask(values) {
    const task = await createLiveTask(values, client);
    current.current += 1;
    setSnapshot((previous) => ({ ...previous, tasks: mergeRow(previous.tasks, task) }));
    return task;
  }
  return <WorkspaceContext.Provider value={{ snapshot, status, error, reload, joinProject, joinMission, createProject, createTask }}>{children}</WorkspaceContext.Provider>;
}
