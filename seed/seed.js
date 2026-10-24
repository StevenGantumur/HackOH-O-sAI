// Shared sample data: the single source every module reads (AGENTS.md §5.3).
// Everything here is fictional: no real people, résumés, orgs or contact details (rule 4).
//
// Task fields marked PROPOSED come from the "Bridge Missions extensions" in AGENTS.md §5.1 and
// are not an agreed schema yet. `role` and `review_criteria` are not in §5.1 at all; the
// mission brief (§5.3, §6.3) needs them, so they are logged as open questions in DECISIONS.md.

// Bump whenever this file changes, so browsers holding older demo data reload the new seed.
export const SEED_VERSION = 3;

// Timestamps are written relative to this anchor (Sat Oct 24 2026, noon EDT). The mock store
// shifts them by (now - anchor) on first load, so "due in 2 days" stays true whenever you demo.
export const SEED_ANCHOR = '2026-10-24T16:00:00.000Z';

const DAY = 864e5;
const HOUR = 36e5;
const at = (days, hours = 0) => new Date(Date.parse(SEED_ANCHOR) + days * DAY + hours * HOUR).toISOString();

const users = [
  { id: 'u-riley', name: 'Riley Nguyen', type: 'student' },
  { id: 'u-leila', name: 'Leila Haddad', type: 'student' },
  { id: 'u-amara', name: 'Amara Okafor', type: 'student' },
  { id: 'u-diego', name: 'Diego Morales', type: 'student' },
  { id: 'u-hannah', name: 'Hannah Kim', type: 'student' },
  { id: 'u-marcus', name: 'Marcus Bell', type: 'student' },
  { id: 'u-priya', name: 'Priya Shah', type: 'student' },
  { id: 'u-sam', name: 'Sam Whitaker', type: 'student' },
  { id: 'u-theo', name: 'Theo Brooks', type: 'student' },
  { id: 'u-nia', name: 'Nia Johnson', type: 'student' },
  { id: 'u-grace', name: 'Grace Liu', type: 'industry' },
  { id: 'u-elena', name: 'Dr. Elena Varga', type: 'faculty' },
  { id: 'u-osei', name: 'Prof. Martin Osei', type: 'faculty' },
];

const resume = (education = [], experience = [], projects = []) => ({ education, experience, projects });
const osu = (degree, years) => ({ school: 'The Ohio State University', degree, years });

const profiles = [
  {
    user_id: 'u-riley',
    major: 'Environmental Science',
    skills: ['Survey Design', 'User Interviews', 'Excel', 'Copywriting', 'Canva'],
    goals: ['Sustainability', 'UX research', 'Community impact', 'Build a portfolio'],
    resume: resume(
      [osu('B.S. Environmental Science', '2025 – 2029')],
      [{ title: 'Volunteer coordinator', org: 'Campus Garden Collective', years: '2025 – now' }],
      [{ name: 'Dorm energy audit', summary: 'Class project comparing energy use across three residence halls.' }],
    ),
  },
  {
    user_id: 'u-leila',
    major: 'Marketing',
    skills: ['Social Media', 'Copywriting', 'Canva', 'Market Research', 'Project Planning'],
    goals: ['Sustainability', 'Leadership', 'Community impact'],
    resume: resume([osu('B.S. Business Administration (Marketing), Fisher College of Business', '2024 – 2028')], [{ title: 'Social media intern', org: 'Student Union Events', years: '2025' }]),
  },
  {
    user_id: 'u-amara',
    major: 'Industrial Design',
    skills: ['Figma', 'Sketching', 'SolidWorks', '3D Printing', 'User Research'],
    goals: ['Accessibility', 'Product design', 'Build a portfolio'],
    resume: resume([osu('B.S. Industrial Design', '2024 – 2028')], [], [{ name: 'Modular desk lamp', summary: 'Studio project, two printed prototypes.' }]),
  },
  {
    user_id: 'u-diego',
    major: 'Computer Science & Engineering',
    skills: ['React', 'JavaScript', 'Python', 'SQL', 'Accessibility'],
    goals: ['Civic tech', 'Accessibility', 'Mentorship'],
    resume: resume([osu('B.S. Computer Science & Engineering', '2023 – 2027')], [{ title: 'Web developer (part-time)', org: 'Campus IT Help Desk', years: '2024 – now' }]),
  },
  {
    user_id: 'u-hannah',
    major: 'Public Health',
    skills: ['Statistics', 'Survey Design', 'SPSS', 'Technical Writing', 'Excel'],
    goals: ['Health', 'Data', 'Research experience'],
    resume: resume([osu('B.S. Public Health', '2024 – 2028')]),
  },
  {
    user_id: 'u-marcus',
    major: 'Mechanical Engineering',
    skills: ['SolidWorks', 'CAD', 'MATLAB', '3D Printing'],
    goals: ['Hardware', 'Health', 'Accessibility'],
    resume: resume([osu('B.S. Mechanical Engineering', '2023 – 2027')]),
  },
  {
    user_id: 'u-priya',
    major: 'Data Analytics',
    skills: ['Python', 'SQL', 'Tableau', 'Statistics', 'Excel'],
    goals: ['Data', 'Sustainability', 'Health'],
    resume: resume([osu('B.S. Data Analytics', '2024 – 2028')]),
  },
  {
    user_id: 'u-sam',
    major: 'Journalism',
    skills: ['Interviewing', 'Audio Editing', 'Copywriting', 'Social Media'],
    goals: ['Media', 'Education', 'Community impact'],
    resume: resume([osu('B.A. Journalism', '2023 – 2027')], [{ title: 'Reporter', org: 'Student radio', years: '2024 – now' }]),
  },
  {
    user_id: 'u-theo',
    major: 'City & Regional Planning',
    skills: ['GIS', 'Excel', 'User Interviews', 'Accessibility'],
    goals: ['Mobility', 'Civic tech', 'Accessibility'],
    resume: resume([osu('B.S. City & Regional Planning', '2024 – 2028')]),
  },
  {
    user_id: 'u-nia',
    major: 'Psychology',
    skills: ['User Research', 'Interviewing', 'Survey Design', 'Statistics'],
    goals: ['UX research', 'Education', 'Accessibility'],
    resume: resume([osu('B.S. Psychology', '2025 – 2029')]),
  },
  {
    user_id: 'u-grace',
    major: null,
    skills: ['UX Research', 'User Interviews', 'Figma', 'Accessibility'],
    goals: ['Mentorship', 'Mobility', 'Accessibility'],
    resume: resume([], [{ title: 'UX Research Lead', org: 'Northbank Transit Lab', years: '2019 – now' }]),
  },
  {
    user_id: 'u-elena',
    major: null,
    skills: ['Epidemiology', 'Statistics', 'Survey Design', 'Mentoring'],
    goals: ['Mentorship', 'Health', 'Sustainability'],
    resume: resume([], [{ title: 'Associate Professor', org: 'College of Public Health', years: '2016 – now' }]),
  },
  {
    user_id: 'u-osei',
    major: null,
    skills: ['CAD', 'SolidWorks', 'Biomechanics', 'Mentoring'],
    goals: ['Mentorship', 'Hardware', 'Health'],
    resume: resume([], [{ title: 'Professor', org: 'Mechanical & Aerospace Engineering', years: '2011 – now' }]),
  },
];

const projects = [
  {
    id: 'p-compost',
    owner_id: 'u-leila',
    title: 'Buckeye Compost Loop',
    description:
      'Students in North Campus residence halls throw out food scraps that could feed the campus farm. We are designing a compost pickup loop that is easy to use and cheap to run, starting with a survey, bin labels and a pilot route in two halls.',
    tags: ['Sustainability', 'Community impact', 'Operations'],
    needed_roles: ['RESEARCHER', 'DESIGNER', 'ANALYST', 'COMMUNICATIONS'],
    needed_skills: ['Survey Design', 'Canva', 'Figma', 'Excel', 'Data Visualization', 'Copywriting'],
    status: 'active',
  },
  {
    id: 'p-busstop',
    owner_id: 'u-grace',
    title: 'Accessible Bus Stop Finder',
    description:
      'A web app that shows riders who use wheelchairs, walkers or canes which bus stops around campus and the University District have curb ramps, shelters and level boarding. Northbank Transit Lab, a Columbus mobility startup, is sponsoring a student team to research, design and build the first version.',
    tags: ['Mobility', 'Accessibility', 'UX research', 'Civic tech'],
    needed_roles: ['RESEARCHER', 'DESIGNER', 'BUILDER', 'ANALYST'],
    needed_skills: ['User Interviews', 'Survey Design', 'Figma', 'React', 'JavaScript', 'Accessibility', 'GIS'],
    status: 'active',
  },
  {
    id: 'p-clinic',
    owner_id: 'u-elena',
    title: 'Clinic Wait-Time Dashboard',
    description:
      'Two student-run health clinics near campus want to show patients an honest estimate of how long they will wait. We need a clear metric, clean data, and plain-language explanations for staff and patients.',
    tags: ['Health', 'Data', 'Community impact'],
    needed_roles: ['ANALYST', 'BUILDER', 'COMMUNICATIONS'],
    needed_skills: ['Excel', 'Python', 'SQL', 'Statistics', 'Tableau', 'Technical Writing', 'Copywriting'],
    status: 'active',
  },
  {
    id: 'p-grip',
    owner_id: 'u-osei',
    title: 'Low-Cost Prosthetic Grip',
    description:
      'A 3D-printable grip attachment for body-powered prosthetic hands, designed with users who want to hold everyday objects like mugs, pens and phones. Part of a capstone research lab in Mechanical and Aerospace Engineering, and open to non-engineers.',
    tags: ['Hardware', 'Health', 'Accessibility', 'Product design'],
    needed_roles: ['BUILDER', 'DESIGNER', 'RESEARCHER'],
    needed_skills: ['CAD', 'SolidWorks', '3D Printing', 'Sketching', 'User Research'],
    status: 'active',
  },
  {
    id: 'p-podcast',
    owner_id: 'u-sam',
    title: 'First-Gen Buckeyes Podcast',
    description:
      'A student podcast where first-generation Buckeyes share what they wish they had known freshman year. Season 1 is six episodes, and we need help with research, show notes and artwork.',
    tags: ['Media', 'Education', 'Community impact'],
    needed_roles: ['COMMUNICATIONS', 'DESIGNER', 'RESEARCHER'],
    needed_skills: ['Interviewing', 'Audio Editing', 'Copywriting', 'Social Media', 'Canva'],
    status: 'active',
  },
];

const member = (user_id, project_id, role, daysAgo) => ({ user_id, project_id, role, joined_at: at(-daysAgo) });

const memberships = [
  member('u-leila', 'p-compost', 'LEADER', 30),
  member('u-elena', 'p-compost', 'MENTOR', 25),
  member('u-riley', 'p-compost', 'RESEARCHER', 21),
  member('u-amara', 'p-compost', 'DESIGNER', 20),
  member('u-priya', 'p-compost', 'ANALYST', 18),

  member('u-grace', 'p-busstop', 'LEADER', 28),
  member('u-diego', 'p-busstop', 'BUILDER', 24),
  member('u-theo', 'p-busstop', 'ANALYST', 22),
  member('u-nia', 'p-busstop', 'RESEARCHER', 19),

  member('u-elena', 'p-clinic', 'LEADER', 35),
  member('u-hannah', 'p-clinic', 'ANALYST', 27),
  member('u-diego', 'p-clinic', 'BUILDER', 15),

  member('u-osei', 'p-grip', 'LEADER', 40),
  member('u-marcus', 'p-grip', 'BUILDER', 33),
  member('u-amara', 'p-grip', 'DESIGNER', 12),

  member('u-sam', 'p-podcast', 'LEADER', 26),
  member('u-leila', 'p-podcast', 'COMMUNICATIONS', 20),
  member('u-nia', 'p-podcast', 'RESEARCHER', 16),
];

const task = (fields) => ({
  description: '',
  owner_id: null,
  deadline: null,
  status: 'todo',
  // PROPOSED (AGENTS.md §5.1). Null/empty on ordinary tasks; a task with estimated_minutes is a Bridge Mission.
  estimated_minutes: null,
  difficulty: null,
  required_skills: [],
  deliverable_instructions: null,
  claimed_at: null,
  // NOT IN §5.1 yet (see DECISIONS.md): the discipline a task needs, and how a mission is reviewed.
  role: null,
  review_criteria: [],
  ...fields,
});

const tasks = [
  // ---- Campus Compost Loop -------------------------------------------------------------
  task({
    id: 't-c1',
    project_id: 'p-compost',
    role: 'RESEARCHER',
    title: 'Map the current compost drop-off points',
    description:
      'Walk the halls or check the facilities site to find every place residents can drop food scraps today. This becomes the baseline for the pickup route.',
    owner_id: 'u-riley',
    status: 'done',
    deadline: at(-6),
    estimated_minutes: 45,
    difficulty: 'beginner',
    required_skills: ['Excel', 'Survey Design'],
    deliverable_instructions: 'A table of drop-off points with location, hours and access notes.',
    review_criteria: ['Covers every residence hall', 'Includes hours and access notes', 'Notes a landmark for each point'],
    claimed_at: at(-9),
  }),
  task({
    id: 't-c2',
    project_id: 'p-compost',
    role: 'RESEARCHER',
    title: 'Draft the 5-question pickup survey',
    description:
      'A short survey for residents of the two pilot halls: how often they would use pickup, the best times, and what would stop them.',
    owner_id: 'u-riley',
    status: 'in_progress',
    deadline: at(2),
  }),
  task({
    id: 't-c3',
    project_id: 'p-compost',
    role: 'DESIGNER',
    title: 'Sketch three bin-label concepts for dorm compost stations',
    description:
      'Residents decide in about two seconds which bin to use. Sketch three label directions we can test in the pilot halls. Rough is fine; we are choosing a direction, not a final design.',
    owner_id: 'u-amara',
    status: 'review',
    deadline: at(1),
    estimated_minutes: 30,
    difficulty: 'beginner',
    required_skills: ['Canva', 'Figma', 'Sketching'],
    deliverable_instructions: 'One image or PDF showing three label concepts side by side.',
    review_criteria: ['Readable from about 2 meters away', 'Uses icons and words, not color alone', 'At least one concept works in grayscale'],
    claimed_at: at(-2),
  }),
  task({
    id: 't-c4',
    project_id: 'p-compost',
    role: 'ANALYST',
    title: 'Estimate weekly food-waste volume per hall',
    description: 'Use dining-hall waste audits and the hall populations to estimate how many bags a week each pilot hall will produce.',
    owner_id: 'u-priya',
    status: 'in_progress',
    deadline: at(-1),
  }),
  task({
    id: 't-c5',
    project_id: 'p-compost',
    role: 'COMMUNICATIONS',
    title: 'Write the launch post for residence halls',
    description:
      'We are piloting compost pickup in two North Campus halls next month. Write a short post residents will actually read: what is changing, why it matters, and the one thing they need to do.',
    deadline: at(6),
    estimated_minutes: 30,
    difficulty: 'beginner',
    required_skills: ['Copywriting', 'Social Media'],
    deliverable_instructions: 'A post under 120 words plus a one-line Instagram caption, as a doc or link.',
    review_criteria: ['Under 120 words and easy to skim', 'Says exactly what residents need to do', 'Friendly, not preachy'],
  }),
  task({
    id: 't-c6',
    project_id: 'p-compost',
    role: 'DESIGNER',
    title: 'Design a one-page pickup-route map',
    description: 'Turn the drop-off inventory into a simple map volunteers can follow on their phones.',
    deadline: at(4),
  }),
  task({
    id: 't-c7',
    project_id: 'p-compost',
    role: 'ANALYST',
    title: 'Set up the pilot tracking sheet',
    description: 'A shared sheet for bags collected, weight and contamination per hall per week.',
    owner_id: 'u-priya',
    status: 'done',
    deadline: at(-8),
  }),
  task({
    id: 't-c8',
    project_id: 'p-compost',
    role: 'COMMUNICATIONS',
    title: 'Book a table at the Ohio Union sustainability fair',
    description: 'Reserve a table and plan a 2-minute pitch to recruit pickup volunteers.',
    owner_id: 'u-leila',
    deadline: at(9),
  }),

  // ---- Accessible Bus Stop Finder ------------------------------------------------------
  task({
    id: 't-b1',
    project_id: 'p-busstop',
    role: 'RESEARCHER',
    title: 'Draft an interview guide for riders who use mobility aids',
    description:
      'Before we design anything, we need to hear from riders. Write the guide our team will use in 20-minute interviews. No UX experience needed: a good guide is mostly curiosity and open questions.',
    deadline: at(5),
    estimated_minutes: 45,
    difficulty: 'beginner',
    required_skills: ['User Interviews', 'Survey Design'],
    deliverable_instructions:
      'A one-page doc (link or file) with a short consent script and 6 to 8 open-ended questions covering getting to the stop, waiting, and boarding.',
    review_criteria: ['Questions are open-ended and not leading', 'Covers getting to the stop, waiting, and boarding', 'Includes a short consent script'],
  }),
  task({
    id: 't-b2',
    project_id: 'p-busstop',
    role: 'BUILDER',
    title: 'Add alt text and visible focus to the stop-detail card',
    description:
      'The prototype card shows stop photos and amenity icons, but screen readers skip them and keyboard users cannot see where they are. A focused accessibility fix in one React component.',
    deadline: at(6),
    estimated_minutes: 60,
    difficulty: 'intermediate',
    required_skills: ['React', 'Accessibility'],
    deliverable_instructions: 'A link to your branch or a zip of the changed component, plus a sentence on how you tested it.',
    review_criteria: [
      'Every image and icon has meaningful alt text or is marked decorative',
      'Focus is visible and moves in a logical order',
      'Explains how it was tested (keyboard or screen reader)',
    ],
  }),
  task({
    id: 't-b3',
    project_id: 'p-busstop',
    role: 'BUILDER',
    title: 'Build the stop-detail card prototype',
    description: 'A React card showing a stop photo, amenities and walking directions, using the sample stop feed.',
    owner_id: 'u-diego',
    status: 'in_progress',
    deadline: at(3),
  }),
  task({
    id: 't-b4',
    project_id: 'p-busstop',
    role: 'ANALYST',
    title: 'Geocode 120 stops from the city feed',
    description: 'Clean the sample stop feed and add coordinates and amenity flags.',
    owner_id: 'u-theo',
    status: 'done',
    deadline: at(-4),
  }),
  task({
    id: 't-b5',
    project_id: 'p-busstop',
    role: 'RESEARCHER',
    title: 'Recruit five interview participants',
    description: 'Work with the transit lab to find five riders who use mobility aids and are open to a 20-minute call.',
    owner_id: 'u-nia',
    deadline: at(7),
  }),

  // ---- Clinic Wait-Time Dashboard ------------------------------------------------------
  task({
    id: 't-k1',
    project_id: 'p-clinic',
    role: 'ANALYST',
    title: 'Clean one week of clinic check-in data',
    description:
      'We exported one week of sample check-in times (no patient information). Some rows are duplicated and times use two formats. Clean it so we can trust the first wait-time chart.',
    deadline: at(4),
    estimated_minutes: 60,
    difficulty: 'intermediate',
    required_skills: ['Excel', 'Python', 'Statistics'],
    deliverable_instructions: 'The cleaned CSV plus three bullets on what you changed and why.',
    review_criteria: ['Duplicates removed and counted', 'All timestamps in one format', 'Every change is explained'],
  }),
  task({
    id: 't-k2',
    project_id: 'p-clinic',
    role: 'COMMUNICATIONS',
    title: 'Write a 150-word explainer for front-desk staff',
    description:
      'Front-desk staff will get questions like "why does the screen say 40 minutes?". Give them a short, plain-language explainer of what the estimate means and what it does not.',
    deadline: at(7),
    estimated_minutes: 30,
    difficulty: 'beginner',
    required_skills: ['Copywriting', 'Technical Writing'],
    deliverable_instructions: 'About 150 words in a doc or link.',
    review_criteria: ['Plain language, no jargon', 'Explains what the estimate does and does not promise', 'Ends with what staff should tell patients'],
  }),
  task({
    id: 't-k3',
    project_id: 'p-clinic',
    role: 'ANALYST',
    title: 'Define the wait-time metric',
    description: 'Propose one metric the dashboard will show, with a definition the clinic directors can sign off on.',
    owner_id: 'u-hannah',
    status: 'review',
    deadline: at(1),
  }),
  task({
    id: 't-k4',
    project_id: 'p-clinic',
    role: 'BUILDER',
    title: 'Prototype the wait-time chart',
    description: 'A first chart of median wait by hour of day, built from the sample data.',
    owner_id: 'u-diego',
    status: 'in_progress',
    deadline: at(5),
  }),

  // ---- Low-Cost Prosthetic Grip --------------------------------------------------------
  task({
    id: 't-g1',
    project_id: 'p-grip',
    role: 'DESIGNER',
    title: 'Sketch three thumb-cap concepts',
    description:
      'The thumb cap slips on smooth mugs. Sketch three shape ideas that could grip better. Paper sketches photographed with your phone are perfect.',
    deadline: at(8),
    estimated_minutes: 45,
    difficulty: 'beginner',
    required_skills: ['Sketching', 'CAD'],
    deliverable_instructions: 'A photo or PDF of three labeled sketches.',
    review_criteria: ['Three distinct shapes, not variations of one', 'Each sketch notes how it improves grip', 'Considers printability (no thin overhangs)'],
  }),
  task({
    id: 't-g2',
    project_id: 'p-grip',
    role: 'BUILDER',
    title: 'Print and test grip v0.3',
    description: 'Print v0.3 and test it on the mug, pen and phone checklist.',
    owner_id: 'u-marcus',
    status: 'in_progress',
    deadline: at(2),
  }),
  task({
    id: 't-g3',
    project_id: 'p-grip',
    role: 'RESEARCHER',
    title: 'Summarize two user interviews',
    description: 'Turn the notes from two recorded user sessions into the top five grip problems.',
    deadline: at(6),
  }),

  // ---- First-Gen Voices Podcast --------------------------------------------------------
  task({
    id: 't-p1',
    project_id: 'p-podcast',
    role: 'COMMUNICATIONS',
    title: 'Edit Episode 2 audio',
    description: 'Trim to 25 minutes, level the volume, and add the intro music.',
    owner_id: 'u-sam',
    status: 'in_progress',
    deadline: at(3),
  }),
  task({
    id: 't-p2',
    project_id: 'p-podcast',
    role: 'DESIGNER',
    title: 'Create season 1 cover art',
    description: 'Square cover art that reads at thumbnail size in podcast apps.',
    deadline: at(10),
  }),
  task({
    id: 't-p3',
    project_id: 'p-podcast',
    role: 'RESEARCHER',
    title: 'Book three guest interviews',
    description: 'Find and schedule guests for episodes 3 to 5.',
    owner_id: 'u-nia',
    status: 'done',
    deadline: at(-3),
  }),
  task({
    id: 't-p4',
    project_id: 'p-podcast',
    role: 'COMMUNICATIONS',
    title: 'Write Episode 2 show notes',
    description: 'A short summary, guest bio and three timestamps.',
    owner_id: 'u-leila',
    deadline: at(4),
  }),
];

// Version.storage_ref "seed/..." points at the `blobs` map below. Refs with no blob are
// metadata-only samples (the UI says so instead of pretending to preview them).
const files = [
  { id: 'f-survey', project_id: 'p-compost', name: 'pickup-survey.md', current_version_id: 'v-survey-2' },
  { id: 'f-labels', project_id: 'p-compost', name: 'bin-label-concepts.svg', current_version_id: 'v-labels-1' },
  { id: 'f-dropoff', project_id: 'p-compost', name: 'dropoff-points.csv', current_version_id: 'v-dropoff-1' },
  { id: 'f-tracker', project_id: 'p-compost', name: 'pilot-tracker.csv', current_version_id: 'v-tracker-2' },
  { id: 'f-route', project_id: 'p-compost', name: 'pickup-route-draft.pdf', current_version_id: 'v-route-1' },
  { id: 'f-stops', project_id: 'p-busstop', name: 'stops-geocoded.csv', current_version_id: 'v-stops-1' },
  { id: 'f-card', project_id: 'p-busstop', name: 'stop-card-wireframe.svg', current_version_id: 'v-card-1' },
  { id: 'f-metric', project_id: 'p-clinic', name: 'wait-time-metric.md', current_version_id: 'v-metric-1' },
  { id: 'f-checkin', project_id: 'p-clinic', name: 'checkin-week-sample.csv', current_version_id: 'v-checkin-1' },
  { id: 'f-grip', project_id: 'p-grip', name: 'grip-v0.3.step', current_version_id: 'v-grip-2' },
  { id: 'f-outline', project_id: 'p-podcast', name: 'episode-2-outline.md', current_version_id: 'v-outline-1' },
];

const version = (fields) => ({ parent_version_id: null, task_id: null, ...fields });

const versions = [
  version({ id: 'v-survey-1', file_id: 'f-survey', author_id: 'u-riley', task_id: 't-c2', message: 'First draft of survey questions', storage_ref: 'seed/pickup-survey-v1.md', mime_type: 'text/markdown', size: 214, created_at: at(-3) }),
  version({ id: 'v-survey-2', file_id: 'f-survey', parent_version_id: 'v-survey-1', author_id: 'u-riley', task_id: 't-c2', message: 'Reword the leading questions', storage_ref: 'seed/pickup-survey-v2.md', mime_type: 'text/markdown', size: 402, created_at: at(-1, -2) }),
  version({ id: 'v-labels-1', file_id: 'f-labels', author_id: 'u-amara', task_id: 't-c3', message: 'Three label directions for review', storage_ref: 'seed/bin-label-concepts.svg', mime_type: 'image/svg+xml', size: 2380, created_at: at(0, -5) }),
  version({ id: 'v-dropoff-1', file_id: 'f-dropoff', author_id: 'u-riley', task_id: 't-c1', message: 'Inventory of 9 drop-off points', storage_ref: 'seed/dropoff-points.csv', mime_type: 'text/csv', size: 652, created_at: at(-7, -3) }),
  version({ id: 'v-tracker-1', file_id: 'f-tracker', author_id: 'u-priya', task_id: 't-c7', message: 'Tracking sheet template', storage_ref: 'seed/pilot-tracker-v1.csv', mime_type: 'text/csv', size: 96, created_at: at(-10) }),
  version({ id: 'v-tracker-2', file_id: 'f-tracker', parent_version_id: 'v-tracker-1', author_id: 'u-priya', task_id: 't-c7', message: 'Add a contamination column', storage_ref: 'seed/pilot-tracker-v2.csv', mime_type: 'text/csv', size: 128, created_at: at(-8) }),
  version({ id: 'v-route-1', file_id: 'f-route', author_id: 'u-leila', message: 'Rough route from the facilities walk-through', storage_ref: 'seed/pickup-route-draft.pdf', mime_type: 'application/pdf', size: 482133, created_at: at(-5) }),
  version({ id: 'v-stops-1', file_id: 'f-stops', author_id: 'u-theo', task_id: 't-b4', message: 'All 120 stops geocoded (first 6 shown in sample)', storage_ref: 'seed/stops-geocoded.csv', mime_type: 'text/csv', size: 410, created_at: at(-4, -1) }),
  version({ id: 'v-card-1', file_id: 'f-card', author_id: 'u-diego', task_id: 't-b3', message: 'Wireframe for the stop-detail card', storage_ref: 'seed/stop-card-wireframe.svg', mime_type: 'image/svg+xml', size: 1650, created_at: at(-2) }),
  version({ id: 'v-metric-1', file_id: 'f-metric', author_id: 'u-hannah', task_id: 't-k3', message: 'Proposed door-to-triage metric', storage_ref: 'seed/wait-time-metric.md', mime_type: 'text/markdown', size: 377, created_at: at(-2, -4) }),
  version({ id: 'v-checkin-1', file_id: 'f-checkin', author_id: 'u-elena', message: 'One week of sample check-ins (no patient data)', storage_ref: 'seed/checkin-week-sample.csv', mime_type: 'text/csv', size: 389, created_at: at(-6) }),
  version({ id: 'v-grip-1', file_id: 'f-grip', author_id: 'u-marcus', task_id: 't-g2', message: 'Initial grip model', storage_ref: 'seed/grip-v0.2.step', mime_type: 'model/step', size: 1843200, created_at: at(-6) }),
  version({ id: 'v-grip-2', file_id: 'f-grip', parent_version_id: 'v-grip-1', author_id: 'u-marcus', task_id: 't-g2', message: 'Thicken the thumb wall to 3 mm', storage_ref: 'seed/grip-v0.3.step', mime_type: 'model/step', size: 1910784, created_at: at(-2, -3) }),
  version({ id: 'v-outline-1', file_id: 'f-outline', author_id: 'u-sam', message: 'Episode 2 outline', storage_ref: 'seed/episode-2-outline.md', mime_type: 'text/markdown', size: 290, created_at: at(-3, -6) }),
];

const channels = [
  { id: 'ch-compost-general', project_id: 'p-compost', name: 'general' },
  { id: 'ch-compost-research', project_id: 'p-compost', name: 'research' },
  { id: 'ch-bus-general', project_id: 'p-busstop', name: 'general' },
  { id: 'ch-bus-build', project_id: 'p-busstop', name: 'build' },
  { id: 'ch-clinic-general', project_id: 'p-clinic', name: 'general' },
  { id: 'ch-grip-general', project_id: 'p-grip', name: 'general' },
  { id: 'ch-pod-general', project_id: 'p-podcast', name: 'general' },
];

const msg = (id, channel_id, author_id, content, created_at) => ({ id, channel_id, author_id, content, created_at });

const messages = [
  msg('m-1', 'ch-compost-general', 'u-leila', 'Welcome to the pilot crew! Pickup starts in Alder and Birch halls on North Campus next month.', at(-2, -3)),
  msg('m-2', 'ch-compost-general', 'u-priya', 'The tracking sheet is live. The volume estimate is a day late, sorry. Waiting on one more audit.', at(-1, -1)),
  msg('m-3', 'ch-compost-general', 'u-amara', 'Bin label concepts are up for review.', at(0, -5)),
  msg('m-4', 'ch-compost-general', 'u-elena', 'Thanks Amara, I will review them this afternoon.', at(0, -3)),
  msg('m-5', 'ch-compost-research', 'u-riley', 'Survey draft 2 is in Files. I reworded the leading questions.', at(-1, -2)),
  msg('m-6', 'ch-compost-research', 'u-leila', 'Much cleaner. Can we try it with five residents before sending it out?', at(-1, 2)),
  msg('m-7', 'ch-bus-general', 'u-grace', 'Kickoff notes: we will interview five riders who use the stops along High Street before designing any screens.', at(-3, -2)),
  msg('m-8', 'ch-bus-general', 'u-theo', 'All 120 stops are geocoded.', at(-2, -6)),
  msg('m-9', 'ch-bus-general', 'u-diego', 'The stop-detail card is half done. I posted the accessibility fixes as a mission if anyone wants them.', at(0, -6)),
  msg('m-10', 'ch-bus-build', 'u-diego', 'Using the sample stop feed for now. The real feed comes after the lab signs off.', at(-1, -4)),
  msg('m-11', 'ch-clinic-general', 'u-elena', 'Hannah’s metric proposal is in review. Great start.', at(-2, -1)),
  msg('m-12', 'ch-clinic-general', 'u-hannah', 'Thanks! I still have an open question about walk-outs.', at(-1, -5)),
  msg('m-13', 'ch-grip-general', 'u-osei', 'v0.3 prints on Friday.', at(-4)),
  msg('m-14', 'ch-grip-general', 'u-marcus', 'Thumb wall is 3 mm now.', at(-2, -3)),
  msg('m-15', 'ch-pod-general', 'u-sam', 'Episode 2 is recorded!', at(-3)),
  msg('m-16', 'ch-pod-general', 'u-nia', 'Guests for episodes 3 to 5 are booked.', at(-2, -2)),
];

// PROPOSED TeamNote (not in AGENTS.md §5.1 yet, see DECISIONS.md): one line per person per project
// that every coach on the project can read. Neutral status only, never quotes from a private chat.
const note = (id, project_id, author_id, role, content, updated_at) => ({ id, project_id, author_id, role, content, agent_message_id: null, updated_at });

const teamNotes = [
  note('tn-1', 'p-compost', 'u-leila', 'LEADER', 'Leila is booking the Ohio Union fair table and wants the launch post written before then.', at(-1, -4)),
  note('tn-2', 'p-compost', 'u-amara', 'DESIGNER', 'Amara submitted three bin-label directions and is waiting on feedback before refining one.', at(0, -5)),
  note('tn-3', 'p-compost', 'u-priya', 'ANALYST', 'Priya is one dining-hall audit away from the weekly volume estimate.', at(-1, -1)),
  note('tn-4', 'p-compost', 'u-elena', 'MENTOR', 'Elena is reviewing the bin-label concepts this afternoon.', at(0, -3)),
  note('tn-5', 'p-busstop', 'u-nia', 'RESEARCHER', 'Nia is lining up five riders for interviews and needs an interview guide before booking calls.', at(-1, -2)),
  note('tn-6', 'p-busstop', 'u-diego', 'BUILDER', 'Diego is building the stop-detail card and wants an accessibility pass once it renders.', at(0, -6)),
  note('tn-7', 'p-busstop', 'u-theo', 'ANALYST', 'Theo finished geocoding the stops and can answer questions about the stop data.', at(-3)),
  note('tn-8', 'p-clinic', 'u-hannah', 'ANALYST', 'Hannah is deciding whether walk-outs should count in the wait-time metric.', at(-1, -5)),
  note('tn-9', 'p-grip', 'u-marcus', 'BUILDER', 'Marcus is printing v0.3 and will test it on the mug, pen and phone checklist.', at(-2, -3)),
  note('tn-10', 'p-podcast', 'u-sam', 'LEADER', 'Sam is editing Episode 2 and wants the show notes drafted alongside it.', at(-2)),
];

// PROPOSED Submission + Feedback contracts (AGENTS.md §5.1). Every record here is sample data
// and the UI labels it that way (§5.3).
const submissions = [
  {
    id: 's-c1',
    task_id: 't-c1',
    author_id: 'u-riley',
    file_id: 'f-dropoff',
    version_id: 'v-dropoff-1',
    external_url: null,
    note: 'Found 9 drop-off points, one per hall. Two are behind badge-only doors after 10pm, which I flagged in the access notes.',
    created_at: at(-7, -2),
    status: 'reviewed',
  },
  {
    id: 's-c3',
    task_id: 't-c3',
    author_id: 'u-amara',
    file_id: 'f-labels',
    version_id: 'v-labels-1',
    external_url: null,
    note: 'Three directions: icon first, a color band, and a grayscale-safe version. Which one reads fastest?',
    created_at: at(0, -5),
    status: 'submitted',
  },
  {
    id: 's-k3',
    task_id: 't-k3',
    author_id: 'u-hannah',
    file_id: 'f-metric',
    version_id: 'v-metric-1',
    external_url: null,
    note: 'Proposed a door-to-triage median shown as a range. I am not sure whether walk-outs should count.',
    created_at: at(-2, -4),
    status: 'under_review',
  },
];

const feedback = [
  {
    id: 'fb-c1',
    submission_id: 's-c1',
    reviewer_id: 'u-elena',
    comments:
      'Clear and well organized. The hours and access notes will save the operations team a lot of guesswork, and flagging the badge-only doors was a good catch.',
    rubric: {
      criteria: [
        { label: 'Covers every residence hall', rating: 'meets' },
        { label: 'Includes hours and access notes', rating: 'meets' },
        { label: 'Notes a landmark for each point', rating: 'partly' },
      ],
      improve: 'Two points are missing landmarks. Add them before route planning so new volunteers can find the bins.',
      outcome: 'approved',
    },
    created_at: at(-6, -1),
  },
];

const blobs = {
  'seed/pickup-survey-v1.md': `# Compost pickup survey (draft)

1. Do you throw away food scraps in your room?
2. Would you use a compost pickup service?
3. Don't you think composting is important?
4. What time is best for pickup?
5. Any other comments?
`,
  'seed/pickup-survey-v2.md': `# Compost pickup survey (draft 2)

1. In a typical week, how often do you have food scraps to throw away?
2. If pickup came to your floor, how likely would you be to use it? (1 to 5)
3. What, if anything, would make you less likely to use it?
4. Which pickup window works best for you? (Morning / Afternoon / Evening)
5. Anything else we should know?
`,
  'seed/dropoff-points.csv': `hall,location,hours,access_notes,landmark
Alder Hall,Loading dock,24/7,Badge door after 10pm,Next to the bike rack
Birch Hall,Ground-floor kitchen,7am-11pm,Open to residents,
Cedar House,Side entrance bin,24/7,Step-free,By the blue mailbox
Dogwood Hall,Basement laundry room,24/7,Elevator access,Behind the laundry room door
Elm Commons,Dining hall back door,6am-9pm,Ask dining staff after 9pm,Green shed
Fir Hall,Courtyard,24/7,Uneven path in winter,Near the benches
Ginkgo House,Lobby,8am-10pm,Badge door after 10pm,
Hazel Hall,Parking lot corner,24/7,Step-free,Next to the recycling cage
Ivy Commons,Rooftop garden,9am-6pm,Stairs only,By the herb beds
`,
  'seed/pilot-tracker-v1.csv': `week,hall,bags_collected,weight_kg
1,Alder Hall,0,0
1,Birch Hall,0,0
`,
  'seed/pilot-tracker-v2.csv': `week,hall,bags_collected,weight_kg,contamination_pct
1,Alder Hall,0,0,0
1,Birch Hall,0,0,0
`,
  'seed/stops-geocoded.csv': `stop_id,name,lat,lon,curb_ramp,shelter,level_boarding
S001,Maple Ave & 3rd St,40.0012,-83.0154,yes,yes,no
S002,Maple Ave & 5th St,40.0031,-83.0151,yes,no,no
S003,Garden Rd & Elm St,40.0058,-83.0207,no,yes,no
S004,Garden Rd & Pine St,40.0074,-83.0239,yes,yes,yes
S005,Market Sq (north),40.0101,-83.0188,yes,yes,yes
S006,Library Loop,40.0123,-83.0162,no,no,no
`,
  'seed/wait-time-metric.md': `# Proposed wait-time metric

**Definition:** median minutes from check-in to first contact with a clinician ("door-to-triage").

- Rolling 7-day window, updated hourly
- Shown as a range, for example "about 25 to 40 minutes"
- Open question: walk-outs are excluded for now and logged separately
`,
  'seed/checkin-week-sample.csv': `visit_id,clinic,checked_in,first_contact
1001,North,2026-10-12 09:02,2026-10-12 09:31
1002,North,10/12/2026 9:15 AM,10/12/2026 9:58 AM
1002,North,10/12/2026 9:15 AM,10/12/2026 9:58 AM
1003,South,2026-10-12 09:20,2026-10-12 09:41
1004,South,2026-10-12 09:44,
1005,North,10/12/2026 10:05 AM,10/12/2026 10:22 AM
`,
  'seed/episode-2-outline.md': `# Episode 2: "Nobody told me about office hours"

1. Cold open: the email that changed everything (0:00)
2. Guest intro (2:10)
3. What office hours actually are (6:45)
4. Advice for first-years (18:30)
`,
  'seed/bin-label-concepts.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 340" font-family="Helvetica, Arial, sans-serif">
  <defs>
    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="4" height="10" fill="#1b1d21"/>
    </pattern>
  </defs>
  <rect width="640" height="340" fill="#fbf6ec"/>
  <g transform="translate(36 36)">
    <rect width="168" height="232" rx="18" fill="#2f7d4f"/>
    <circle cx="84" cy="84" r="44" fill="#cdebd5"/>
    <path d="M84 54c-24 8-34 30-26 52 24 4 42-10 44-34 0-6-1-12-3-18-5-1-10-1-15 0z" fill="#2f7d4f"/>
    <path d="M62 112c8-14 18-26 32-36" stroke="#cdebd5" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="84" y="166" fill="#ffffff" font-size="21" font-weight="700" text-anchor="middle">FOOD SCRAPS</text>
    <text x="84" y="192" fill="#cdebd5" font-size="13" text-anchor="middle">No plastic bags</text>
  </g>
  <g transform="translate(236 36)">
    <rect width="168" height="232" rx="18" fill="#ffffff" stroke="#e4ddcf" stroke-width="2"/>
    <path d="M0 18a18 18 0 0 1 18-18h132a18 18 0 0 1 18 18v42H0z" fill="#e9a23b"/>
    <text x="84" y="38" fill="#3b2a0c" font-size="20" font-weight="700" text-anchor="middle">COMPOST</text>
    <circle cx="44" cy="104" r="16" fill="#e2574c"/>
    <path d="M70 112c10 8 26 8 36-6" stroke="#f2c94c" stroke-width="10" stroke-linecap="round" fill="none"/>
    <rect x="118" y="90" width="22" height="28" rx="4" fill="#7a5233"/>
    <text x="84" y="158" fill="#3a3d44" font-size="15" text-anchor="middle">Fruit, veg, coffee</text>
    <text x="84" y="180" fill="#3a3d44" font-size="15" text-anchor="middle">grounds, napkins</text>
    <text x="84" y="212" fill="#9a4f00" font-size="12" font-weight="700" text-anchor="middle">NO PLASTIC, NO GLASS</text>
  </g>
  <g transform="translate(436 36)">
    <rect width="168" height="232" rx="18" fill="#ffffff" stroke="#1b1d21" stroke-width="4"/>
    <rect x="14" y="14" width="140" height="64" rx="10" fill="url(#hatch)"/>
    <text x="84" y="128" fill="#1b1d21" font-size="28" font-weight="800" text-anchor="middle">FOOD</text>
    <text x="84" y="158" fill="#1b1d21" font-size="28" font-weight="800" text-anchor="middle">ONLY</text>
    <text x="84" y="196" fill="#3a3d44" font-size="13" text-anchor="middle">Works without color</text>
  </g>
  <g fill="#5b5e66" font-size="14" text-anchor="middle">
    <text x="120" y="304">A: icon first</text>
    <text x="320" y="304">B: color band</text>
    <text x="520" y="304">C: grayscale-safe</text>
  </g>
</svg>
`,
  'seed/stop-card-wireframe.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" font-family="Helvetica, Arial, sans-serif">
  <rect width="480" height="320" fill="#f4f6fa"/>
  <rect x="40" y="28" width="400" height="264" rx="16" fill="#ffffff" stroke="#d5dae3" stroke-width="2"/>
  <rect x="60" y="48" width="140" height="96" rx="10" fill="#dfe5ee"/>
  <path d="M74 132l34-40 22 24 14-14 42 30z" fill="#c3cbd8"/>
  <circle cx="170" cy="74" r="10" fill="#c3cbd8"/>
  <rect x="220" y="52" width="180" height="16" rx="4" fill="#1f2a44"/>
  <rect x="220" y="80" width="120" height="10" rx="3" fill="#a7b0c0"/>
  <g font-size="12" fill="#2f4a8a" text-anchor="middle">
    <rect x="220" y="104" width="58" height="24" rx="12" fill="#e6efff"/><text x="249" y="120">Ramp</text>
    <rect x="284" y="104" width="64" height="24" rx="12" fill="#e6efff"/><text x="316" y="120">Shelter</text>
    <rect x="354" y="104" width="46" height="24" rx="12" fill="#f1f2f5"/><text x="377" y="120" fill="#8a91a0">Level</text>
  </g>
  <rect x="60" y="164" width="360" height="10" rx="3" fill="#c9d0db"/>
  <rect x="60" y="184" width="300" height="10" rx="3" fill="#c9d0db"/>
  <rect x="60" y="204" width="200" height="10" rx="3" fill="#c9d0db"/>
  <rect x="60" y="232" width="140" height="40" rx="10" fill="#4f46e5"/>
  <text x="130" y="257" fill="#ffffff" font-size="14" text-anchor="middle">Directions</text>
</svg>
`,
};

export const seed = {
  version: SEED_VERSION,
  anchor: SEED_ANCHOR,
  users,
  profiles,
  projects,
  memberships,
  tasks,
  files,
  versions,
  channels,
  messages,
  agentMessages: [],
  teamNotes,
  submissions,
  feedback,
  blobs,
};
