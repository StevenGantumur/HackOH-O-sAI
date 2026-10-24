// MOCK: canned coaching replies (AGENTS.md §5.4). They follow the same help ladder and refusal
// rule as the real prompt, so the demo never depends on an API key or a rate limit.

import { dueLabel } from '../shared/format.js';

const JUST_DO_IT = [
  /\bjust (do|write|make|finish|solve|answer|give|assign|create|build|draft|review)\b/i,
  /\b(do|write|make|finish|solve|complete|draft|assign) (it|this|that|them|the whole thing|the tasks|my \w+) for me\b/i,
  /\bgive me the (answer|solution|final)\b/i,
  /\bdo my\b/i,
  /\bcan you (write|do|make|finish|complete|draft) (it|this|that|my|the)\b/i,
];
const WANTS_REVIEW = /\b(review|feedback on|look at|check) (my|this|what i)\b|\bhere('s| is) my\b|\bmy (draft|attempt|version)\b|\bi (wrote|tried|drafted|made)\b/i;
const WANTS_EXAMPLE = /\b(example|show me how|similar)\b/i;
const WANTS_CONCEPT = /\b(what is|what's|what are|explain|concept|resource|learn about)\b/i;
const STUCK = /\b(stuck|hint|don't know|dont know|not sure|confused|where (do|should) i start|how do i)\b/i;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const quoted = (titles) => titles.map((t) => `“${t}”`).join(', ');

function leaderCheckIn(context) {
  const unassigned = context.unassignedTasks ?? [];
  const overdue = context.overdueTasks ?? [];
  const waiting = context.awaitingReview ?? [];
  const notes = [];
  if (unassigned.length) notes.push(`${plural(unassigned.length, 'task')} still ${unassigned.length === 1 ? 'has' : 'have'} no owner: ${quoted(unassigned.map((t) => t.title))}.`);
  if (overdue.length) notes.push(`${quoted(overdue.map((t) => t.title))} ${overdue.length === 1 ? 'is' : 'are'} overdue.`);
  if (waiting.length) notes.push(`${plural(waiting.length, 'submission')} ${waiting.length === 1 ? 'is' : 'are'} waiting for review.`);
  if (!notes.length) return 'Every task has an owner and nothing is overdue. What is the next milestone, and which tasks get you there?';

  let ask = 'Quick feedback keeps contributors motivated. Could you review today?';
  if (unassigned.length) ask = `Who on your team has the skills for “${unassigned[0].title}”? I can’t assign it for you, but I can help you think it through.`;
  else if (overdue.length) ask = `Is “${overdue[0].title}” blocked, or does its deadline need to move?`;
  return `${notes.join(' ')}\n\n${ask}`;
}

function mentorCheckIn(context) {
  const waiting = context.awaitingReview ?? [];
  const lead = waiting.length ? `${plural(waiting.length, 'submission')} ${waiting.length === 1 ? 'is' : 'are'} waiting for you. ` : '';
  return `${lead}Before you write anything: what is the single most useful thing this student could improve next? Feedback lands best when it leads with one priority.`;
}

// Rungs 1 to 5 of the help ladder, per role.
const LADDERS = {
  RESEARCHER: [
    'What decision should this research help your team make? If you can say it in one sentence, you can check every question against it.',
    'Look up the difference between open and leading questions. Open questions usually start with “how”, “what” or “tell me about”, and they let people describe their own experience.',
    'Hint: read each question aloud and ask whether someone could answer it with yes or no. If they could, try starting it with “how often” or “what would”. Fix one question first; the pattern gets easier.',
    null,
    'Here is a similar problem, not yours: a library wants to know why students skip its late-night study room. “Don’t you love the study room?” is leading. “Tell me about the last time you needed somewhere to study late” is open: it asks about a real moment, not an opinion. Try the same move on your questions.',
  ],
  DESIGNER: [
    'Who sees this first, and how long do they have to understand it? Two seconds at a bin is a very different brief from two minutes with a poster.',
    'Two ideas worth reading about: visual hierarchy, and not relying on color alone to carry meaning (WCAG 1.4.1). Both shape what a strong concept looks like here.',
    'Hint: squint at your sketch, or blur a screenshot of it. Whatever you can still read is your real hierarchy. Start with one big icon and one or two words.',
    null,
    'Here is a similar problem, not yours: a recycling sign for a gym. A strong version shows the object (a bottle), the action (rinse it, then drop it in) and one accent color, with words large enough to read from the door.',
  ],
  BUILDER: [
    'What exactly should be true when you are done? Try writing it as two or three checks you could run yourself.',
    'Concepts that help here: use semantic HTML first and ARIA only when you must, and style keyboard focus with the :focus-visible selector. MDN has short, clear pages on both.',
    'Hint: tab through the component with your keyboard before changing anything, and write down every place you lose track of focus. That list is your plan.',
    null,
    'Here is a similar problem, not yours: an icon-only close button. The fix is a real <button> with aria-label="Close dialog" and a visible focus ring, so keyboard and screen reader users get the same information as mouse users.',
  ],
  ANALYST: [
    'What question should this data answer, and who will act on the answer? That decides what “clean” means here.',
    'Concepts to look up: tidy data (one row per observation), and telling true duplicates apart from real repeat events.',
    'Hint: before changing anything, count the rows, duplicates and blank values. Write those numbers down, so you can show exactly what your cleaning changed.',
    null,
    'Here is a similar problem, not yours: a bike-share log where some rides were recorded twice. One approach is to define a duplicate (same bike, same start time within 60 seconds), count them, remove them, and note the rule so someone else can repeat it.',
  ],
  COMMUNICATIONS: [
    'Who is reading this, and what is the one thing you want them to do afterward? Start from that sentence.',
    'Concepts to look up: plain language, and the inverted pyramid (most important information first). Both are quick reads.',
    'Hint: write the call to action first, then add only the sentences a busy reader needs to act on it. Read it out loud; wherever you stumble, simplify.',
    null,
    'Here is a similar problem, not yours: announcing a late-night library shuttle. “Starting Monday, a free shuttle leaves the library every 30 minutes from 10pm to 2am. Show your student ID to ride.” Notice the order: what, when, where, then the one thing to do.',
  ],
  MENTOR: [
    mentorCheckIn,
    'A structure that works: one thing that works, one thing to improve, and why, tied to the review criteria. Specific, kind and actionable.',
    'Hint: quote one exact line or detail from their work in your comment. It shows you read closely, and it makes the advice concrete.',
    null,
    'Here is a similar case: reviewing a poster draft. “The headline reads from across the room, nice. The date is hard to find; try moving it under the headline.” One strength, one change, and the reason.',
  ],
  LEADER: [
    leaderCheckIn,
    'Break each milestone into tasks someone could finish in a few days, each with one owner and a deadline. Small, well-scoped tasks also make good Bridge Missions for new contributors.',
    'Hint: for each unassigned task, write down one skill it needs and match it against your teammates’ profiles. If nobody fits, consider posting it as a mission.',
    null,
    'Here is a similar case: a club planning a fundraiser split “run the event” into “book a room (Sam, Fri)”, “design the flyer (Ana, Wed)” and “post on socials (Lee, Thu)”. Every task is small, owned and dated.',
  ],
};

// Rung 4 reviews the user's own attempt. A canned reply cannot read it, so it walks the
// user through their task's real review criteria instead of pretending to grade anything.
function reviewAttempt(role, context) {
  const criteria = context.currentTask?.criteria ?? [];
  if (role === 'LEADER') return 'Tell me your plan for this week and check it with me: does every task have one owner, a deadline, and a size someone can finish in a few days? Which of those feels shakiest?';
  if (criteria.length) {
    const list = criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
    return `Let’s check your attempt against the review criteria for “${context.currentTask.title}”:\n${list}\n\nWhich one are you least sure about? Quote the part of your work that covers it and we’ll look at it together.`;
  }
  return 'Thanks for sharing it. Check it against three questions: does it do what the task asked, would someone new understand it without you there, and what is the weakest part? Tell me which part you want to dig into.';
}

function opener(role, context) {
  const task = context.currentTask;
  if (role === 'LEADER' || role === 'MENTOR' || !task) return '';
  const due = task.deadline ? ` (${dueLabel(task.deadline).toLowerCase()})` : '';
  return `You’re working on “${task.title}”${due}. `;
}

export function mockCoachReply({ role, messages = [], context = {} }) {
  const ladder = LADDERS[role] ?? LADDERS.RESEARCHER;
  const rung = (n) => {
    if (n === 4) return reviewAttempt(role, context);
    const step = ladder[n - 1];
    return typeof step === 'function' ? step(context) : step;
  };
  const lastUserText = [...messages].reverse().find((m) => m.sender === 'user')?.content ?? '';
  const agentTurns = messages.filter((m) => m.sender === 'agent').length;

  if (JUST_DO_IT.some((pattern) => pattern.test(lastUserText))) {
    const next = Math.min(Math.max(agentTurns + 1, 2), 3);
    return `I can’t do the task for you. The work, and the credit, should be yours. Here’s a next step instead:\n\n${rung(next)}`;
  }
  if (WANTS_REVIEW.test(lastUserText)) return rung(4);
  if (WANTS_EXAMPLE.test(lastUserText)) return rung(5);
  if (WANTS_CONCEPT.test(lastUserText)) return rung(2);
  if (STUCK.test(lastUserText) && agentTurns >= 1) return rung(3);

  const reply = rung(Math.min(agentTurns + 1, 3));
  return agentTurns === 0 ? `${opener(role, context)}${reply}` : reply;
}
