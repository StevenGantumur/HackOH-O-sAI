// Each person's coach is named for the role they hold and the kind of project, so the builder on
// a web app gets a software engineering coach and the builder on a prosthetic grip a hardware one.
// `specialty` picks which canned coaching kit the mock uses (mockCoach.js).

function needs(project, ...terms) {
  const pool = [...(project?.needed_skills ?? []), ...(project?.tags ?? [])].map((s) => s.toLowerCase());
  return terms.some((term) => pool.includes(term));
}

export function coachProfile(role, project) {
  switch (role) {
    case 'BUILDER':
      return needs(project, 'cad', 'solidworks', '3d printing', 'hardware')
        ? { specialty: 'build-hardware', title: 'Hardware engineering coach' }
        : { specialty: 'build-software', title: 'Software engineering coach' };
    case 'DESIGNER':
      return needs(project, 'product design', 'hardware')
        ? { specialty: 'design-product', title: 'Product design coach' }
        : { specialty: 'design-visual', title: 'Design coach' };
    case 'RESEARCHER':
      return { specialty: 'research', title: needs(project, 'ux research') ? 'UX research coach' : 'Research coach' };
    case 'ANALYST':
      return { specialty: 'analysis', title: 'Data analysis coach' };
    case 'COMMUNICATIONS':
      return { specialty: 'communications', title: 'Communications coach' };
    case 'LEADER':
      return { specialty: 'leader', title: 'Project lead coach' };
    case 'MENTOR':
      return { specialty: 'mentor', title: 'Mentoring coach' };
    default:
      return { specialty: 'research', title: 'Coach' };
  }
}
