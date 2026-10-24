import { BASE_PROMPT } from './base.js';
import { LEADER_PROMPT } from './leader.js';
import { RESEARCHER_PROMPT } from './researcher.js';
import { DESIGNER_PROMPT } from './designer.js';
import { BUILDER_PROMPT } from './builder.js';
import { ANALYST_PROMPT } from './analyst.js';
import { COMMUNICATIONS_PROMPT } from './communications.js';
import { MENTOR_PROMPT } from './mentor.js';

const ROLE_PROMPTS = {
  LEADER: LEADER_PROMPT,
  RESEARCHER: RESEARCHER_PROMPT,
  DESIGNER: DESIGNER_PROMPT,
  BUILDER: BUILDER_PROMPT,
  ANALYST: ANALYST_PROMPT,
  COMMUNICATIONS: COMMUNICATIONS_PROMPT,
  MENTOR: MENTOR_PROMPT,
};

// Base rules first, role additions after. Roles append; they never replace the base (§6.4).
export function getSystemPrompt(role) {
  const addition = ROLE_PROMPTS[role];
  if (!addition) throw new Error(`No coach prompt for role "${role}".`);
  return `${BASE_PROMPT}\n\n${addition}`;
}
