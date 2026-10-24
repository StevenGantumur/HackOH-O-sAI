import { agentThread } from '../shared/selectors.js';
import { store } from '../shared/store.js';
import { buildAgentContext } from './context.js';
import { generateAgentReply } from './llm.js';
import { teamNoteFor } from './teamNotes.js';

// A short pause so the canned reply reads like a reply, not an echo.
const typingPause = () => new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 550));

// One coach exchange. Both sides are logged to AgentMessage (AGENTS.md §6.4), then this person's
// line in the shared team context is updated so every coach on the project knows what they're
// working on. The chat itself never leaves the 1:1 thread.
export async function askCoach({ userId, projectId, role, text, focusTaskId = null }) {
  await store.logAgentMessage({ userId, projectId, role, sender: 'user', content: text });
  const data = store.getSnapshot();
  const messages = agentThread(data, { userId, projectId, role }).map(({ sender, content }) => ({ sender, content }));
  const context = buildAgentContext(data, { userId, projectId, focusTaskId });
  const [{ content }] = await Promise.all([generateAgentReply({ role, userId, projectId, messages, context }), typingPause()]);
  const reply = await store.logAgentMessage({ userId, projectId, role, sender: 'agent', content });
  await store.setTeamNote({ userId, projectId, role, content: teamNoteFor({ role, messages, context }), agentMessageId: reply.id });
  return reply;
}
