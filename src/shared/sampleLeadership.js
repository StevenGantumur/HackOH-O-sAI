// MOCK: User-approved leadership of sample workspace projects, not Supabase roles.
// Match the registered account's stable public ID, never an editable username.
export const SAMPLE_PROJECT_LEADERS = [
  { projectId: 'p-compost', userId: '3103260a-56df-4216-8bce-314952415007' },
];

export function applySampleLeadership(snapshot, joinedAt) {
  let result = snapshot;
  for (const { projectId, userId } of SAMPLE_PROJECT_LEADERS) {
    const project = result.projects.find((item) => item.id === projectId);
    if (!project || !result.users.some((person) => person.id === userId)) continue;
    let changed = project.owner_id !== userId;
    let found = false;
    const memberships = result.memberships.map((member) => {
      if (member.project_id !== projectId) return member;
      if (member.user_id === userId) {
        found = true;
        if (member.role === 'LEADER') return member;
        changed = true;
        return { ...member, role: 'LEADER' };
      }
      if (member.role !== 'LEADER') return member;
      changed = true;
      return { ...member, role: 'COMMUNICATIONS' };
    });
    if (!found) {
      changed = true;
      memberships.push({ user_id: userId, project_id: projectId, role: 'LEADER', joined_at: joinedAt });
    }
    if (changed) result = { ...result, memberships,
      projects: result.projects.map((item) => item.id === projectId ? { ...item, owner_id: userId } : item),
    };
  }
  return result;
}
