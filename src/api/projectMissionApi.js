import { getCurrentUser } from './auth.js';
import { getSupabase } from './client.js';
import { isLiveId } from '../shared/liveRecords.js';
import { DOER_ROLES } from '../shared/contracts.js';

async function requireAccount(client) {
  const { data, error } = await getCurrentUser(client);
  if (error || !data.user) throw new Error('Sign in again before joining.');
  return data.user;
}
const requireId = (id) => { if (!isLiveId(id)) throw new Error('Choose a live Supabase project or mission. Sample records use the demo flow.'); };

export async function fetchWorkspace(client = getSupabase(), signal) {
  const projectResult = await client.from('projects').select('*').order('created_at', { ascending: false }).limit(200).abortSignal(signal);
  if (projectResult.error) throw new Error('Could not load Supabase projects. Please retry.');
  const projects = projectResult.data;
  if (!projects.length) return { projects: [], tasks: [], memberships: [], taskContributors: [] };
  const ids = projects.map((project) => project.id);
  const [tasks, teams, contributors] = await Promise.all([
    client.from('tasks').select('*').in('project_id', ids).limit(1000).abortSignal(signal),
    client.from('project_team').select('*').in('project_id', ids).limit(1000).abortSignal(signal),
    client.from('task_contributors').select('*').limit(1000).abortSignal(signal),
  ]);
  if (tasks.error || teams.error || contributors.error) throw new Error('Could not load live missions and teams. Please retry.');
  const taskIds = new Set(tasks.data.map((task) => task.id));
  return { projects, tasks: tasks.data, memberships: teams.data, taskContributors: contributors.data.filter((row) => taskIds.has(row.task_id)) };
}

export async function joinLiveProject({ projectId, role }, client = getSupabase()) {
  requireId(projectId);
  if (!DOER_ROLES.includes(role)) throw new Error('Choose a working role.');
  await requireAccount(client);
  const { data, error } = await client.rpc('join_project', { project_id: projectId, role });
  if (error) throw new Error(error.message || 'Could not join the project. Please retry.');
  if (!data?.user_id || data.project_id !== projectId) throw new Error('Supabase did not confirm your membership.');
  return data;
}

export async function joinLiveMission({ taskId }, client = getSupabase()) {
  requireId(taskId);
  await requireAccount(client);
  const { data, error } = await client.rpc('join_mission', { task_id: taskId });
  if (error) throw new Error(error.message || 'Could not join the mission. Please retry.');
  if (data?.task?.id !== taskId || !data.membership?.user_id || !data.contributor?.user_id) throw new Error('Supabase did not confirm your mission team.');
  return data;
}

export async function createLiveProject(values, client = getSupabase()) {
  await requireAccount(client);
  const { data, error } = await client.from('projects').insert(values).select('*').single();
  if (error) throw new Error(error.message || 'Could not create the project.');
  return data;
}

export async function createLiveTask(values, client = getSupabase()) {
  requireId(values.project_id);
  await requireAccount(client);
  const { data, error } = await client.from('tasks').insert(values).select('*').single();
  if (error) throw new Error(error.message || 'Could not create the mission.');
  return data;
}
