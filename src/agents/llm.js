// generateAgentReply is the ONLY way any module talks to a model (AGENTS.md §5.4).
//
// Real mode belongs on the server: a backend function reads LLM_PROVIDER, LLM_MODEL and
// LLM_API_KEY, prepends getSystemPrompt(role) from ./prompts, and calls the provider. That
// function and its route are not built or approved yet (§5.5), so the browser runs in MOCK mode.

import { mockCoachReply } from './mockCoach.js';

export const AGENT_MODE = 'mock'; // MOCK: canned replies, no provider call.

/**
 * @param {{
 *   role: string,
 *   userId: string,
 *   projectId: string,
 *   messages: { sender: 'user' | 'agent', content: string }[],
 *   context: object,
 * }} request
 * @returns {Promise<{ content: string }>}
 */
export async function generateAgentReply(request) {
  if (AGENT_MODE === 'mock') {
    return { content: mockCoachReply(request) };
  }
  // Fail loudly rather than pretend (rule 9): connect this to the approved backend route.
  throw new Error('The live coach is not connected yet. It needs the server-side agent function (AGENTS.md §5.5).');
}
