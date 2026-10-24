// Display names and colors for contract values. Presentation only: nothing here is stored.
// Text colors are checked for 4.5:1 contrast on white (AGENTS.md §6.5). Discipline colors stay
// clear of Scarlet so a label is never mistaken for a brand control; mentors wear Scarlet.

export const ROLE_META = {
  LEADER: { label: 'Leader', tag: 'Lead', color: '#3f4443', dot: '#7d868c', soft: '#eceff1' },
  RESEARCHER: { label: 'Researcher', tag: 'Research', color: '#0b7a8a', dot: '#12a6ba', soft: '#e1f4f6' },
  DESIGNER: { label: 'Designer', tag: 'Design', color: '#b54708', dot: '#f07438', soft: '#fdeee4' },
  BUILDER: { label: 'Builder', tag: 'Engineering', color: '#2f5da8', dot: '#4c7fd6', soft: '#e7effa' },
  ANALYST: { label: 'Analyst', tag: 'Analysis', color: '#7a3e9d', dot: '#a35cc9', soft: '#f3eaf8' },
  COMMUNICATIONS: { label: 'Communications', tag: 'Communications', color: '#1e7a44', dot: '#2e9e5b', soft: '#e6f4ea' },
  MENTOR: { label: 'Mentor', tag: 'Mentor', color: '#9a0a27', dot: '#ba0c2f', soft: '#fbe9ec' },
};

export const STATUS_META = {
  todo: { label: 'To-do', column: 'To-Do', tone: 'todo' },
  in_progress: { label: 'In progress', column: 'In Progress', tone: 'progress' },
  review: { label: 'In review', column: 'In Review', tone: 'review' },
  done: { label: 'Done', column: 'Done', tone: 'done' },
};

export const SUBMISSION_META = {
  submitted: { label: 'Submitted', tone: 'review' },
  under_review: { label: 'Under review', tone: 'progress' },
  reviewed: { label: 'Reviewed', tone: 'done' },
};

export const DIFFICULTY_META = {
  beginner: { label: 'Beginner', tone: 'easy' },
  intermediate: { label: 'Intermediate', tone: 'medium' },
  advanced: { label: 'Advanced', tone: 'hard' },
};

export const USER_TYPE_META = {
  student: { label: 'Student', color: '#ba0c2f' },
  industry: { label: 'Industry', color: '#0b7a8a' },
  faculty: { label: 'Faculty', color: '#a85200' },
};

export const RATING_META = {
  not_yet: { label: 'Not yet', tone: 'hard' },
  partly: { label: 'Partly', tone: 'medium' },
  meets: { label: 'Meets', tone: 'easy' },
};

export const OUTCOME_META = {
  approved: { label: 'Approved', tone: 'done' },
  changes_requested: { label: 'Changes requested', tone: 'review' },
};

// Cover art per project, picked from its first tag so new projects get one too.
const ART_BY_TAG = {
  sustainability: { emoji: '🌍', bg: '#f8efe0' },
  mobility: { emoji: '🚌', bg: '#e4f0fb' },
  health: { emoji: '🩺', bg: '#fbe7ec' },
  hardware: { emoji: '🦾', bg: '#e9ecef' },
  media: { emoji: '🎙️', bg: '#fdeedd' },
  education: { emoji: '📚', bg: '#e6f4e0' },
};
const DEFAULT_ART = { emoji: '🧩', bg: '#f1f1ef' };

export function projectArt(project) {
  const tag = project?.tags?.[0]?.toLowerCase();
  return ART_BY_TAG[tag] ?? DEFAULT_ART;
}
