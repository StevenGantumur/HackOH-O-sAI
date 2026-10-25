// MOCK: canned coaching replies (AGENTS.md §5.4). They follow the same rules as the real prompt
// (prompts/base.js), so the demo never depends on an API key or a rate limit:
// - coach, never complete the assigned work;
// - think first: hints unlock after the person's first attempt, a worked example after two;
// - respond to what an attempt actually says (simple checks per specialty);
// - use the shared team context to point the person at teammates;
// - end every reply with one concrete thing for the person to do.
// Deterministic, so the Coach page can show which steps are unlocked (coachState).

import { dueLabel, joinList } from '../shared/format.js';
import { coachProfile } from './persona.js';

const DO_IT_FOR_ME = [
  /\bjust (do|write|make|finish|solve|answer|give|assign|create|build|draft|review)\b/i,
  /\b(do|write|make|finish|solve|complete|draft|assign) (it|this|that|them|the whole thing|the tasks|my \w+) for me\b/i,
  /\bgive me the (answer|solution|final)\b/i,
  /\bdo my\b/i,
  /\bcan you (write|do|make|finish|complete|draft) (it|this|that|my|the)\b/i,
];
const WHO_CAN_HELP = /\bwho (can|could|should|would|on my team|else)\b|\bwho(['’]s| is) waiting\b|\bwhich teammate\b|\bwho to (ask|talk)\b/i;
const WANTS_REVIEW = /\b(review|feedback on|look at|check) (my|this|what i)\b|\bmy (draft|attempt|version|plan)\b/i;
const WANTS_EXAMPLE = /\b(example|show me how|similar)\b/i;
const WANTS_CONCEPT = /\b(what is|what's|what are|what makes|explain|concept|key idea|resource|read up|learn about)\b/i;
const STUCK = /\b(stuck|hint|don't know|dont know|not sure|confused|where (do|should) i start|how (do|should) i)\b/i;
const STATUS = /\b(what should i (focus|do|work)|what'?s next|where (am i|are we|do i stand)|focus on)\b/i;
const ATTEMPT_MARKERS = /\b(i think|my (plan|idea|draft|attempt|version|answer|feedback)|i (tried|wrote|drafted|made|started|changed)|here('s| is) (my|what)|so far)\b/i;
const LIST_LINE = /^\s*(\d+[.)]|[-*•])\s+\S/m;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const short = (title = '', max = 60) => (title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title);
const compose = (...parts) => parts.filter(Boolean).join('\n\n');
const yourTurn = (text) => `Your turn: ${text}`;
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const wordCount = (text = '') => (text.trim().match(/\S+/g) ?? []).length;

// A message counts as the person's own thinking when it carries real content, not just a request.
export function isAttempt(text = '') {
  if (DO_IT_FOR_ME.some((pattern) => pattern.test(text))) return false;
  const words = wordCount(text);
  return words >= 18 || LIST_LINE.test(text) || (ATTEMPT_MARKERS.test(text) && words >= 8);
}

export function classify(text = '') {
  if (DO_IT_FOR_ME.some((pattern) => pattern.test(text))) return 'do_it';
  if (WHO_CAN_HELP.test(text)) return 'who';
  if (isAttempt(text)) return 'attempt';
  if (WANTS_REVIEW.test(text)) return 'review';
  if (WANTS_EXAMPLE.test(text)) return 'example';
  if (WANTS_CONCEPT.test(text)) return 'concept';
  if (STUCK.test(text)) return 'stuck';
  if (STATUS.test(text)) return 'status';
  return 'other';
}

// What the person has earned so far in this conversation. Rules, not points.
export function coachState(messages = []) {
  const attempts = messages.filter((m) => m.sender === 'user' && isAttempt(m.content)).length;
  return { attempts, hintsUnlocked: attempts >= 1, exampleUnlocked: attempts >= 2 };
}

export function describeConnection(link) {
  if (link.kind === 'reviewer') return `${link.name} (${link.roleLabel}) reviews this work.`;
  if (link.kind === 'note') return `From ${link.name}’s coach: “${link.text}”`;
  return `${link.name} (${link.roleLabel}) ${link.text}.`;
}

// ---- Checks on an attempt: they read what the person wrote, without grading it -------------

function checkQuestions(text) {
  const questions = text
    .split(/\n|(?<=\?)\s+/)
    .map((line) => line.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim())
    .filter((line) => line.endsWith('?'));
  if (!questions.length) return ['I don’t see any questions yet. A guide or survey is mostly questions, so write them out with question marks.'];
  const closed = questions.filter((q) =>
    /^(do|does|did|don['’]t|doesn['’]t|didn['’]t|is|isn['’]t|are|aren['’]t|was|were|can|can['’]t|could|would|wouldn['’]t|will|won['’]t|have|has|should)\b/i.test(q),
  );
  const leading = questions.filter((q) => /\b(don['’]t you|wouldn['’]t you|isn['’]t it|aren['’]t you|agree that)\b/i.test(q));
  const notes = [`You wrote ${plural(questions.length, 'question')}.`];
  if (closed.length) {
    notes.push(`${closed.length === questions.length ? 'Every one' : plural(closed.length, 'question')} can be answered with a plain yes or no, like “${closed[0]}”`);
  }
  if (leading.length) notes.push(`“${leading[0]}” hints at the answer you want to hear.`);
  if (!closed.length && !leading.length) notes.push('None of them can be answered with a plain yes or no, which is a strong start.');
  return notes;
}

function checkConcepts(text) {
  const items = text.split('\n').filter((line) => LIST_LINE.test(line)).length;
  return [
    items >= 3 ? `You listed ${items} ideas.` : `I count ${items ? plural(items, 'separate idea') : 'no separate ideas'} so far. Lay them out as a list so each one stands on its own.`,
    'Are they truly different from each other, or variations of one idea? Which one would you test first?',
  ];
}

function checkCode(text) {
  if (!/[<{};]|=>|\bfunction\b|\bconst\b/.test(text)) {
    return ['That’s a plan, not code yet, which is fine. What is the first thing you’ll check once it runs, and how?'];
  }
  const notes = [];
  if (/<img\b(?![^>]*\balt=)/i.test(text)) notes.push('There’s an <img> without an alt attribute.');
  if (/<(div|span)\b[^>]*\bonClick=/i.test(text)) notes.push('A div or span with onClick can’t be reached by keyboard. Which element would be?');
  if (/outline:\s*(none|0)\b/i.test(text) && !/focus-visible/i.test(text)) notes.push('You remove the outline without a :focus-visible style, so keyboard users lose track of focus.');
  if (!notes.length) notes.push('Nothing jumps out in this snippet. How did you test it: by hand in the browser, with the keyboard, or with an automated check?');
  return notes;
}

function checkHardware(text) {
  const measured = /\b\d+(\.\d+)?\s?(mm|cm|in|°|deg|%|g|n)\b/i.test(text);
  return [
    measured ? 'You gave real measurements. Which of those numbers are you least sure about?' : 'I don’t see any measurements yet. Which dimensions or tolerances matter most here?',
    'What will you change in the next print, and what do you expect to happen?',
  ];
}

function checkAnalysis(text) {
  const numbers = text.match(/\b\d+(\.\d+)?\b/g) ?? [];
  return [
    numbers.length ? `You mention ${plural(numbers.length, 'number')}. Say which are from before cleaning and which from after.` : 'I don’t see any counts yet. How many rows, duplicates and blanks did you start with?',
    'Could someone else repeat every change you made from your notes alone?',
  ];
}

function checkCopy(text, context) {
  const words = wordCount(text);
  const limit = Number((context.currentTask?.criteria ?? []).join(' ').match(/under (\d+) words/i)?.[1]) || null;
  const action = text.match(/[^.!?\n]*\b(bring|drop|sign up|visit|join|scan|show|reply|stop by|register|try)\b[^.!?\n]*[.!?]?/i);
  return [
    limit ? `It’s ${words} words; the brief asks for under ${limit}.` : `It’s ${words} words.`,
    action ? `Your call to action seems to be “${action[0].trim()}”. Would a skimmer see it first?` : 'I can’t find a clear thing for readers to do yet.',
  ];
}

function checkPlan(text, context) {
  const named = (context.team ?? []).map((m) => m.first).filter((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text));
  const dated = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b|\b(today|tomorrow|tonight)\b|\b\d{1,2}\/\d{1,2}\b/i.test(text);
  return [
    named.length ? `You named ${joinList(named)} as owners.` : 'I don’t see any owners named yet.',
    dated ? 'You gave deadlines.' : 'I don’t see deadlines yet. Add a day to each task.',
  ];
}

function checkFeedback(text) {
  return [
    /\b(nice|works|strong|clear|good|great|love|well done)\b/i.test(text) ? 'You open with a strength.' : 'I don’t see a strength yet. What actually works?',
    /\b(try|consider|could|move|add|cut|change|instead|swap)\b/i.test(text) ? 'You suggest a concrete change.' : 'I don’t see a concrete change to make yet.',
    /\b(because|so that|since|which means)\b/i.test(text) ? 'You explain why.' : 'Add the reason. People act on feedback when they know why.',
  ];
}

// ---- Leader and mentor check-ins read the shared context ----------------------------------

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

function teamHearing(context) {
  const notes = (context.notes ?? []).filter((n) => n.authorId !== context.person?.id).slice(0, 4);
  if (!notes.length) return null;
  return `What your team’s coaches are hearing:\n${notes.map((n) => `• ${n.content}`).join('\n')}`;
}

// ---- Coaching kits: rungs 1, 2, 3 and 5 of the help ladder, per specialty ------------------
// Rung 4 (reviewing an attempt) is shared and built from `check`.

const KITS = {
  research: {
    topics: ['the decision this work should support', 'open versus leading questions', 'rewriting one question at a time', 'checking the draft against the review criteria', 'a worked example from a different study'],
    steps: [
      'What decision should this research help your team make? If you can say it in one sentence, you can check every question against it.',
      'Look up the difference between open and leading questions. Open questions usually start with “how”, “what” or “tell me about”, and they let people describe their own experience.',
      'Hint: read each question aloud and ask whether someone could answer it with yes or no. If they could, try starting it with “how often” or “what would”. Fix one question first; the pattern gets easier.',
      null,
      'Here is a similar problem, not yours: a library wants to know why students skip its late-night study room. “Don’t you love the study room?” is leading. “Tell me about the last time you needed somewhere to study late” is open: it asks about a real moment, not an opinion.',
    ],
    turns: {
      start: 'Write the first question you would ask, even a rough one.',
      concept: 'Rewrite one of your questions so it can’t be answered with yes or no, and paste it here.',
      hint: 'Fix one question with that hint and paste the before and after.',
      example: 'Make the same move on your own first question and paste it here.',
    },
    check: checkQuestions,
  },
  'design-visual': {
    topics: ['who sees the design and for how long', 'visual hierarchy and not relying on color alone', 'testing what still reads at a glance', 'checking the concepts against the review criteria', 'a worked example from a different sign'],
    steps: [
      'Who sees this first, and how long do they have to understand it? Two seconds at a bin is a very different brief from two minutes with a poster.',
      'Two ideas worth reading about: visual hierarchy, and not relying on color alone to carry meaning (WCAG 1.4.1). Both shape what a strong concept looks like here.',
      'Hint: squint at your sketch, or blur a screenshot of it. Whatever you can still read is your real hierarchy. Start with one big icon and one or two words.',
      null,
      'Here is a similar problem, not yours: a recycling sign for a gym. A strong version shows the object (a bottle), the action (rinse it, then drop it in) and one accent color, with words large enough to read from the door.',
    ],
    turns: {
      start: 'Describe your first concept in one sentence: what does someone see first?',
      concept: 'Name the one thing a passer-by must notice first in your design, and why.',
      hint: 'Do the squint test on your concept and tell me what still reads.',
      example: 'Use the same move on your concept and describe what changes.',
    },
    check: checkConcepts,
  },
  'design-product': {
    topics: ['the moment the design fails for its user', 'affordances and designing for the extremes', 'sketching three ways to stop one failure', 'checking the concepts against the review criteria', 'a worked example from a different product'],
    steps: [
      'Who holds or uses this, and what goes wrong for them today? Describe the exact moment it fails.',
      'Ideas worth reading about: affordances (a shape that suggests how to use it) and designing for the extremes, such as the weakest grip or the smallest hand.',
      'Hint: sketch the failure first. Draw the mug slipping, then sketch three different ways to stop that one failure.',
      null,
      'Here is a similar problem, not yours: a jar opener for arthritic hands. Designers sketched a ridged cone, a strap and a lever, three different mechanisms, and judged each on grip force and one-handed use.',
    ],
    turns: {
      start: 'Describe the moment it fails for the user, in one sentence.',
      concept: 'Explain which affordance your best idea relies on.',
      hint: 'Sketch the failure, then list three different fixes for it, one line each.',
      example: 'List three different mechanisms for your own problem, one line each.',
    },
    check: checkConcepts,
  },
  'build-software': {
    topics: ['what “done” means as checks you can run', 'reading the docs for the part you’re least sure about', 'shrinking the problem to the smallest working version', 'checking the work against the review criteria', 'a worked example from a different feature'],
    steps: [
      'What exactly should be true when you are done? Write it as two or three checks you could run yourself.',
      'Before writing more code, read the docs for the one piece you’re least sure about, such as a React hook, a chart library or an HTML element. For anything people click, check semantic HTML and visible keyboard focus too.',
      'Hint: shrink the problem. Get the smallest version working first (one hard-coded item, no styling), then add one thing at a time and check it in the browser each time.',
      null,
      'Here is a similar problem, not yours: a team needed a slow list to feel fast. They rendered three hard-coded rows first, then swapped in real data, then added a loading state, and checked each step in the browser before starting the next.',
    ],
    turns: {
      start: 'Write down the two or three checks that will tell you it works.',
      concept: 'Tell me which part you looked up and what you learned, in one sentence.',
      hint: 'Build the smallest version, then tell me what works and what doesn’t yet.',
      example: 'Plan your own build the same way: three small checkpoints, in order.',
    },
    check: checkCode,
  },
  'build-hardware': {
    topics: ['the tests a real part has to pass', 'designing for 3D printing and tolerances', 'changing one variable per print', 'checking the work against the review criteria', 'a worked example from a different part'],
    steps: [
      'What does “working” mean for this part? Name two or three tests you could run on a real object.',
      'Concepts worth a look: designing for 3D printing (overhangs, minimum wall thickness) and tolerances between parts that fit together. Your printer’s limits matter here.',
      'Hint: change one variable per print. If you change wall thickness and infill together, you won’t know which one fixed it.',
      null,
      'Here is a similar problem, not yours: a printed phone stand kept tipping over. The fix came from testing three base widths, one at a time, and logging which phones stayed upright.',
    ],
    turns: {
      start: 'List the tests a real object has to pass before you change the model.',
      concept: 'Name the printing constraint that matters most for your part, and why.',
      hint: 'Pick the one variable you’ll change in the next print and say what you expect.',
      example: 'Plan your next three prints the same way, one variable each.',
    },
    check: checkHardware,
  },
  analysis: {
    topics: ['the question the data has to answer', 'tidy data and true versus repeat duplicates', 'counting before cleaning', 'checking the work against the review criteria', 'a worked example from a different dataset'],
    steps: [
      'What question should this data answer, and who will act on the answer? That decides what “clean” means here.',
      'Concepts to look up: tidy data (one row per observation), and telling true duplicates apart from real repeat events.',
      'Hint: before changing anything, count the rows, duplicates and blank values. Write those numbers down, so you can show exactly what your cleaning changed.',
      null,
      'Here is a similar problem, not yours: a bike-share log where some rides were recorded twice. One approach is to define a duplicate (same bike, same start time within 60 seconds), count them, remove them, and note the rule so someone else can repeat it.',
    ],
    turns: {
      start: 'Write the one question this data has to answer.',
      concept: 'Explain in one sentence what counts as a duplicate in your data.',
      hint: 'Count the rows, duplicates and blanks, and paste the numbers.',
      example: 'Write your own duplicate rule the same way, in one sentence.',
    },
    check: checkAnalysis,
  },
  communications: {
    topics: ['the reader and the one action you want from them', 'plain language and putting the important part first', 'writing the call to action first', 'checking the draft against the review criteria', 'a worked example from a different announcement'],
    steps: [
      'Who is reading this, and what is the one thing you want them to do afterward? Start from that sentence.',
      'Concepts to look up: plain language, and the inverted pyramid (most important information first). Both are quick reads.',
      'Hint: write the call to action first, then add only the sentences a busy reader needs to act on it. Read it out loud; wherever you stumble, simplify.',
      null,
      'Here is a similar problem, not yours: announcing a late-night library shuttle. “Starting Monday, a free shuttle leaves the library every 30 minutes from 10pm to 2am. Show your student ID to ride.” Notice the order: what, when, where, then the one thing to do.',
    ],
    turns: {
      start: 'Write the one thing you want readers to do, as a single sentence.',
      concept: 'Rewrite your first sentence in plain language and paste it here.',
      hint: 'Write just your call to action and paste it here.',
      example: 'Reorder your draft the same way: what, when, where, then the one thing to do.',
    },
    check: checkCopy,
  },
  leader: {
    topics: ['owners and deadlines for open work', 'splitting milestones into small owned tasks', 'matching open tasks to teammates’ skills', 'checking the plan for gaps', 'a worked example from a different team'],
    steps: [
      leaderCheckIn,
      'Break each milestone into tasks someone could finish in a few days, each with one owner and a deadline. Small, well-scoped tasks also make good Bridge Missions for new contributors.',
      'Hint: for each unassigned task, write down one skill it needs and match it against your teammates’ profiles. If nobody fits, consider posting it as a mission.',
      null,
      'Here is a similar case: a club planning a fundraiser split “run the event” into “book a room (Sam, Fri)”, “design the flyer (Ana, Wed)” and “post on socials (Lee, Thu)”. Every task is small, owned and dated.',
    ],
    turns: {
      start: 'Pick an owner for the first open task and tell me why them.',
      concept: 'Turn one milestone into two or three tasks, each with an owner and a day.',
      hint: 'Write this week’s plan as tasks with an owner and a day each.',
      example: 'Split one of your own milestones the same way.',
    },
    check: checkPlan,
  },
  mentor: {
    topics: ['the one improvement that matters most', 'specific, kind and actionable feedback', 'quoting the work in the feedback', 'checking the feedback draft', 'a worked example from a different review'],
    steps: [
      mentorCheckIn,
      'A structure that works: one thing that works, one thing to improve, and why, tied to the review criteria. Specific, kind and actionable.',
      'Hint: quote one exact line or detail from their work in your comment. It shows you read closely, and it makes the advice concrete.',
      null,
      'Here is a similar case: reviewing a poster draft. “The headline reads from across the room, nice. The date is hard to find; try moving it under the headline.” One strength, one change, and the reason.',
    ],
    turns: {
      start: 'Write the one improvement that would help most, in one sentence.',
      concept: 'Write one strength and one change for this submission, with a reason.',
      hint: 'Quote one exact line from their work that you want to praise or change.',
      example: 'Write your own strength, change and reason in the same pattern.',
    },
    check: checkFeedback,
  },
};

const DECLINE = {
  leader: 'I can’t make the assignments for you. That call is yours as the lead, and your team should hear it from you.',
  mentor: 'I can’t write the feedback for you. Your name goes on it, so the words should be yours.',
  default: 'I can’t do the task for you. The work, and the credit, should be yours.',
};

const THINK_FIRST = 'Before I give you a hint, show me where you are. Write a rough first attempt, even one line. Hints work best on something real.';
const REVIEW_TURN = 'Pick the criterion your draft meets least, revise just that part, and tell me why the new version is better.';

function opener(context) {
  const task = context.currentTask;
  if (!task) return null;
  const due = task.deadline && task.status !== 'done' ? ` (${dueLabel(task.deadline).toLowerCase()})` : '';
  return `You’re working on “${task.title}”${due}.`;
}

function reviewAttempt(kit, text, context) {
  const findings = kit.check(text, context);
  const criteria = context.currentTask?.criteria ?? [];
  return compose(
    `Thanks for showing your thinking. Here’s what I notice:\n${findings.map((f) => `• ${f}`).join('\n')}`,
    criteria.length && `Now check it against the review criteria for “${short(context.currentTask.title)}”:\n${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
  );
}

function askForDraft(context) {
  const criteria = context.currentTask?.criteria ?? [];
  return compose(
    'Paste it here, the whole thing or just the part you’re least sure about. I’ll respond to what you actually wrote.',
    criteria.length && `I’ll check it against the review criteria for “${short(context.currentTask.title)}”:\n${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
  );
}

function whoReply(context) {
  const project = context.project?.title ?? 'this project';
  const channel = context.project?.channel ?? 'general';
  const task = context.currentTask;
  const links = context.connections ?? [];
  if (!links.length) {
    return compose(
      task ? `I don’t see anyone on ${project} whose work overlaps “${short(task.title)}” yet.` : `You don’t have a task in progress on ${project} yet.`,
      yourTurn(`Write the one question you’d ask the team, then post it in #${channel}.`),
    );
  }
  return compose(
    `Here’s who on ${project} is connected to ${task ? `“${short(task.title)}”` : 'your work'}:\n${links.map((link) => `• ${describeConnection(link)}`).join('\n')}`,
    yourTurn(`Write the one question you’d ask ${links[0].name}, then post it in #${channel}.`),
  );
}

function teamLoad(context) {
  const lines = (context.team ?? [])
    .filter((m) => m.role !== 'MENTOR')
    .map((m) => `• ${m.first} (${m.roleLabel}): ${m.activeTasks.length ? plural(m.activeTasks.length, 'active task') : 'nothing in progress'}`);
  const open = context.unassignedTasks?.[0];
  if (!lines.length) {
    return compose('Nobody else has joined this project yet, so every task is yours or open to claim.', yourTurn('Pick the one task you’d post as a Bridge Mission first, and say why.'));
  }
  return compose(
    `Here’s your team’s current load:\n${lines.join('\n')}`,
    yourTurn(open ? `Pick an owner for “${short(open.title)}” and tell me why them.` : 'Tell me who has room for the next task, and why.'),
  );
}

function waitingOnFeedback(context) {
  const waiting = context.awaitingReview ?? [];
  if (!waiting.length) return compose('Nobody on this project is waiting for feedback right now.', yourTurn('Ask the lead which work they’d like a second pair of eyes on.'));
  return compose(
    `These people are waiting on feedback:\n${waiting.map((w) => `• ${w.author}: “${short(w.taskTitle)}”`).join('\n')}`,
    yourTurn('Pick the one that has waited longest and write the single most useful improvement for it.'),
  );
}

function statusReply(context) {
  const task = context.currentTask;
  const lines = [
    task
      ? `You’re working on “${short(task.title)}”${task.deadline && task.status !== 'done' ? `, ${dueLabel(task.deadline).toLowerCase()}` : ''}.`
      : `You don’t have a task in progress on ${context.project?.title ?? 'this project'}.`,
  ];
  if (context.board) lines.push(`Across the team: ${context.board.in_progress} in progress, ${context.board.review} waiting for review and ${context.board.todo} still to do.`);
  const link = context.connections?.[0];
  return compose(
    lines.join(' '),
    link && `Heads up from your team: ${describeConnection(link)}`,
    yourTurn('Name the next small step you’d take in the next 30 minutes. I’ll push back if it’s too big.'),
  );
}

// Returns the reply plus the intent and ladder rung it used, so other parts of the app (the team
// note writer, the Coach page) can explain what happened without re-parsing the text.
export function planReply({ role, messages = [], context = {} }) {
  const specialty = context.coach?.specialty ?? coachProfile(role, null).specialty;
  const kit = KITS[specialty] ?? KITS.research;
  const lead = role === 'LEADER';
  const mentor = role === 'MENTOR';
  const lastUserText = [...messages].reverse().find((m) => m.sender === 'user')?.content ?? '';
  const intent = classify(lastUserText);
  const state = coachState(messages);
  const agentTurns = messages.filter((m) => m.sender === 'agent').length;
  const step = (n) => {
    const s = kit.steps[n - 1];
    return typeof s === 'function' ? s(context) : s;
  };
  const turnFor = { 1: kit.turns.start, 2: kit.turns.concept, 3: kit.turns.hint };
  const reply = (rung, content) => ({ intent, rung, topic: kit.topics[rung - 1], content });

  switch (intent) {
    case 'do_it': {
      const rung = state.hintsUnlocked ? 3 : 2;
      const decline = DECLINE[lead ? 'leader' : mentor ? 'mentor' : 'default'];
      return reply(rung, compose(`${decline} Here’s a next step instead:`, step(rung), yourTurn(turnFor[rung])));
    }
    case 'who':
      return reply(2, lead ? teamLoad(context) : mentor ? waitingOnFeedback(context) : whoReply(context));
    case 'attempt':
      return reply(4, compose(reviewAttempt(kit, lastUserText, context), yourTurn(REVIEW_TURN)));
    case 'review':
      return reply(4, compose(askForDraft(context), yourTurn('Paste your draft, or the part you’re least sure about.')));
    case 'example':
      return state.exampleUnlocked
        ? reply(5, compose(step(5), yourTurn(kit.turns.example)))
        : reply(1, compose(`I’ll walk through a similar worked example once you’ve made two attempts of your own. So far you’ve made ${state.attempts}.`, yourTurn(kit.turns.start)));
    case 'concept':
      return reply(2, compose(step(2), yourTurn(kit.turns.concept)));
    case 'stuck':
      return state.hintsUnlocked ? reply(3, compose(step(3), yourTurn(kit.turns.hint))) : reply(1, compose(THINK_FIRST, yourTurn(kit.turns.start)));
    case 'status':
      if (lead || mentor) return reply(1, compose(step(1), lead && teamHearing(context), yourTurn(kit.turns.start)));
      return reply(1, statusReply(context));
    default: {
      if (lead || mentor) return reply(1, compose(step(1), lead && teamHearing(context), yourTurn(kit.turns.start)));
      if (agentTurns === 0) {
        const link = context.connections?.[0];
        return reply(1, compose([opener(context), step(1)].filter(Boolean).join(' '), link && `Heads up from your team: ${describeConnection(link)}`, yourTurn(kit.turns.start)));
      }
      const rung = Math.min(agentTurns + 1, state.hintsUnlocked ? 3 : 2);
      return reply(rung, compose(step(rung), yourTurn(turnFor[rung])));
    }
  }
}

export function mockCoachReply(request) {
  return planReply(request).content;
}
