import * as github from '@actions/github';
import * as core from '@actions/core';
import * as input from './input';
import {
  createBodyWithIdentifier,
  createComment,
  createCommentIdentifier,
  deleteComment,
  getPreviousComment,
  updateComment,
} from './comment';

async function main() {
  try {
    const issue_number = github.context.payload.pull_request?.number;
    if (!issue_number) {
      throw new Error('No PR number found');
    }

    validateInputs();

    const octokit = github.getOctokit(input.githubToken);
    const repoContext = { ...github.context.repo, octokit, issue_number };

    const previousComment = await getPreviousComment({ ...repoContext, commentId: input.commentId });

    if (input.deleteOld) {
      if (previousComment) {
        await deleteComment({ ...repoContext, commentId: previousComment.id });
      }

      return;
    }

    const body =
      input.commentTemplate === 'fingerprint'
        ? createFingerprintBody()
        : createBodyWithIdentifier(input.message, input.commentId);

    if (previousComment) {
      core.debug('Found existing comment, updating...');
      await updateComment({ ...repoContext, body, commentId: previousComment.id });
    } else {
      core.debug('Did not find a previous comment, creating new');
      await createComment({ ...repoContext, body });
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : 'Unknown error');
  }
}

function validateInputs() {
  if (!input.deleteOld && input.commentTemplate === 'none' && !input.message) {
    throw new Error('If no template is used, a message is required');
  }

  if (input.commentTemplate === 'fingerprint' && !input.fingerprintDiff) {
    throw new Error('Using a fingerprint comment template requires a fingerprint-diff input');
  }

  if (input.deleteOld && !input.commentId) {
    throw new Error('Cannot delete a comment without an ID');
  }
}

function createFingerprintBody() {
  const formattedDiff = JSON.stringify(JSON.parse(input.fingerprintDiff), null, 2);
  return `This Pull Request introduces fingerprint changes against the base commit:
<details><summary>Fingerprint diff</summary>

\`\`\`json
${formattedDiff}
\`\`\`
</details>
${input.commentId ? createCommentIdentifier(input.commentId) : ''}`;
}

main();
