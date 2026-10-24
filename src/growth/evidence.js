// Evidence cards are derived from Task + Submission + Feedback + Version. Nothing is stored
// separately and nothing is awarded: no points, no badges (AGENTS.md §6.3).

import { feedbackFor, getFile, getProject, getTask, getUser, getVersion, membershipOf, versionNumber } from '../shared/selectors.js';

export function evidenceFor(data, userId, isSeeded) {
  return data.submissions
    .filter((s) => s.author_id === userId && s.status === 'reviewed')
    .map((submission) => {
      const feedback = feedbackFor(data, submission.id).at(-1);
      if (feedback?.rubric?.outcome !== 'approved') return null;
      const task = getTask(data, submission.task_id);
      const project = task && getProject(data, task.project_id);
      if (!project) return null;
      const version = submission.version_id ? getVersion(data, submission.version_id) : null;
      return {
        id: submission.id,
        task,
        project,
        submission,
        feedback,
        reviewer: getUser(data, feedback.reviewer_id),
        reviewerRole: membershipOf(data, feedback.reviewer_id, project.id)?.role ?? null,
        contributorRole: membershipOf(data, userId, project.id)?.role ?? task.role,
        version,
        file: version ? getFile(data, version.file_id) : null,
        versionNumber: version ? versionNumber(data, version) : null,
        sample: isSeeded(submission.id) || isSeeded(feedback.id),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.feedback.created_at) - Date.parse(a.feedback.created_at));
}
