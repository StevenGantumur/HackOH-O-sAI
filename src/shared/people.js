import { USER_TYPE_META } from './labels.js';
import { getProfile, getProject, membershipsOf } from './selectors.js';

// One line under a person's name: a student's major, or a mentor's job.
export function profileHeadline(profile, user) {
  if (profile?.major) return profile.major;
  const job = profile?.resume?.experience?.[0];
  if (job) return `${job.title}, ${job.org}`;
  return USER_TYPE_META[user?.type]?.label ?? '';
}

// What someone does in the demo, for the user switcher.
export function personaLine(data, user) {
  const memberships = membershipsOf(data, user.id);
  const leads = memberships.find((m) => m.role === 'LEADER');
  if (leads) return `Leads ${getProject(data, leads.project_id)?.title}`;
  const mentors = memberships.find((m) => m.role === 'MENTOR');
  if (mentors) return `Mentor on ${getProject(data, mentors.project_id)?.title}`;
  return profileHeadline(getProfile(data, user.id), user);
}

export function withArticle(word) {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}
