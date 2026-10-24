// Shared data contracts (AGENTS.md §5). Changing anything in this file needs team sign-off
// (rule 2), and AGENTS.md must be updated in the same commit.

export const USER_TYPES = ['student', 'industry', 'faculty'];

// §5.2: LEADER is confirmed; the others are proposed. Hardcoded on purpose: users pick a role,
// they never create one.
export const ROLES = ['LEADER', 'RESEARCHER', 'DESIGNER', 'BUILDER', 'ANALYST', 'COMMUNICATIONS', 'MENTOR'];

// Roles that take on project work and label tasks. LEADER coordinates and MENTOR reviews.
export const DOER_ROLES = ['RESEARCHER', 'DESIGNER', 'BUILDER', 'ANALYST', 'COMMUNICATIONS'];

// §5.6: reviewers must be authorized members or mentors, never arbitrary users.
export const REVIEWER_ROLES = ['LEADER', 'MENTOR'];

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

// PROPOSED (§5.1 Submission.status). Kept separate from Task "done" on purpose (§6.3).
export const SUBMISSION_STATUSES = ['submitted', 'under_review', 'reviewed'];

// PROPOSED Task.difficulty values.
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

// PROPOSED shape of Feedback.rubric: { criteria: [{ label, rating }], improve, outcome }.
export const RUBRIC_RATINGS = ['not_yet', 'partly', 'meets'];
export const REVIEW_OUTCOMES = ['approved', 'changes_requested'];

export const AGENT_SENDERS = ['user', 'agent'];
