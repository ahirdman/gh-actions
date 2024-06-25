import * as github from '@actions/github';
import * as core from '@actions/core';
import * as input from './input';
import {
  createBodyWithIdentifier,
  createComment,
  createCommentIdentifier,
  getPreviousComment,
  updateComment,
} from './comment';

async function main() {
  try {
    const issue_number = github.context.payload.pull_request?.number;

    if (!issue_number) {
      throw new Error('No pr number found');
    }

    if (input.commentTemplate !== 'fingerprint' && !input.message) {
      throw new Error('If no template is used, a message is required');
    }

    if (input.commentTemplate === 'fingerprint' && !input.fingerprintDiff) {
      throw new Error('Using a fingperint comment template requires a fingerprint-diff input');
    }

    const octokit = github.getOctokit(input.githubToken);

    const previousComment = await getPreviousComment({
      ...github.context.repo,
      commentId: input.commentId,
      octokit,
      issue_number,
    });

    if (input.commentTemplate === 'fingerprint') {
      const formattedDiff = JSON.stringify(JSON.parse(input.fingerprintDiff), null, 2);
      const body = `This Pull Request introduces fingerprint changes against the base commit:\n
        <details><summary>Fingerprint diff</summary>\n

        \`\`\`json\n
        ${formattedDiff}\n
        \`\`\`\n
        </details>\n
        ${input.commentId ? createCommentIdentifier(input.commentId) : ''}`;

      if (previousComment) {
        core.debug('Fount existing comment, updating...');
        await updateComment({ ...github.context.repo, octokit, body, issue_number, commentId: previousComment.id });
        return;
      }

      core.debug('Did not find a previous comment, creating new');

      await createComment({ ...github.context.repo, octokit, body, issue_number });
      return;
    }

    const body = createBodyWithIdentifier(input.message, input.commentId);

    if (previousComment) {
      core.debug('Fount existing comment, updating...');
      await updateComment({ ...github.context.repo, octokit, body, issue_number, commentId: previousComment.id });
      return;
    }

    core.debug('Did not fint existing comment, creating new');

    await createComment({ ...github.context.repo, octokit, body, issue_number });
  } catch (error) {
    error instanceof Error ? core.setFailed(error.message) : core.setFailed('Unknown error');
  }
}

main();
