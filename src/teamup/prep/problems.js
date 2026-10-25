// Demo catalog: summaries of three verified FastPrep Easy listings.
// Examples and partner exercises are original; no solutions are imported.
export const prepProblems = [
  {
    id: 'phone-words', title: 'Known Words Matching Phone Digits', company: 'LinkedIn',
    difficulty: 'Easy', category: 'Coding', topics: ['Strings', 'Hash tables'],
    sourceUrl: 'https://www.fastprep.io/problems/linkedin-known-words-for-phone-digits',
    summary: 'Find dictionary words whose letters map to a supplied phone-keypad digit sequence. Match every position and the full length, remove duplicate results, and return them alphabetically. Use the usual 2–9 keypad mapping.',
    example: { input: 'words = ["cat", "bat", "dog", "cat"], digits = "228"', output: '["bat", "cat"]' },
    checks: ['No matching words', 'Duplicate dictionary entries', 'Words with a different length'],
    partnerExercise: 'One person builds the letter-to-digit lookup; the other designs tests for duplicates, missing matches, and ordering. Switch roles when reviewing the result.',
  },
  {
    id: 'word-guesses', title: 'Bounded Word Guess Solver', company: 'Atlassian',
    difficulty: 'Easy', category: 'Coding', topics: ['Arrays', 'Simulation'],
    sourceUrl: 'https://www.fastprep.io/problems/atlassian-bounded-word-guess-solver',
    summary: 'Model a five-letter guessing game with an ordered candidate list and a limited attempt count. Guess the first remaining candidate, compute position and letter feedback, then retain candidates consistent with that feedback. Decide whether this process reaches the secret within the budget. Allocate exact matches before other letter matches, without reusing a letter occurrence.',
    example: { input: 'secret = "plant", candidates = ["plant", "crane"], maxGuesses = 1', output: 'true' },
    checks: ['A zero-attempt budget', 'Repeated letters', 'Preserving candidate order'],
    partnerExercise: 'One person tracks candidate filtering; the other manually checks feedback for repeated letters. Explain why the next guess follows from feedback rather than direct access to the secret.',
  },
  {
    id: 'arithmetic-checks', title: 'Check Array Arithmetic Expressions', company: 'TikTok',
    difficulty: 'Easy', category: 'Coding', topics: ['Arrays', 'Arithmetic'],
    sourceUrl: 'https://www.fastprep.io/problems/tiktok-check-array-arithmetic-expressions',
    summary: 'For each position in equally sized arrays, add or subtract the two operands using the supplied operator. Compare the result with the expected value at that position and return the comparisons as booleans in the same order. Empty inputs produce an empty result.',
    example: { input: 'a = [6, 4], signs = ["+", "-"], b = [2, 7], c = [8, 3]', output: '[true, false]' },
    checks: ['Subtracting a negative number', 'Empty arrays', 'An incorrect expected value'],
    partnerExercise: 'One person implements the loop; the other checks subtraction order and negative operands. Finish by explaining the time and space costs together.',
  },
];
