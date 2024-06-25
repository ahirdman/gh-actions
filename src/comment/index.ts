import * as github from '@actions/github';
import * as core from '@actions/core';

interface CreateCommentArgs {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

type CommentTemplate = 'none' | 'fingerprint';

async function createComment(args: CreateCommentArgs) {
  const myToken = core.getInput('github-token');
  const octokit = github.getOctokit(myToken);
  const result = octokit.rest.issues.createComment({
    owner: args.owner,
    repo: args.repo,
    issue_number: args.issue_number,
    body: args.body,
  });

  return result;
}

async function main() {
  const currentPR = github.context.payload.pull_request?.number;

  if (!currentPR) {
    return core.setFailed('No pr number found');
  }

  const message = core.getInput('message', { required: false });
  const commentTemplate = core.getInput('template', { required: false }) as CommentTemplate;
  const fingerprintDiff = core.getInput('fingerprint-diff', { required: false });

  if (commentTemplate !== 'fingerprint' && !message) {
    core.setFailed('If no template is used, a message is required');
    return;
  }

  if (commentTemplate === 'fingerprint' && !fingerprintDiff) {
    core.setFailed('Using a fingperint comment template requires a fingerprint-diff input');
    return;
  }

  if (commentTemplate === 'fingerprint') {
    const formattedDiff = JSON.stringify(JSON.parse(fingerprintDiff), null, 2);
    const comment = `This Pull Request introduces fingerprint changes against the base commit:
<details><summary>Fingerprint diff</summary>

\`\`\`json
${formattedDiff}
\`\`\`
</details>`;

    await createComment({ ...github.context.repo, body: comment, issue_number: currentPR });
    return;
  }

  await createComment({ ...github.context.repo, body: message, issue_number: currentPR });
}

main();
