import * as github from '@actions/github';
import * as core from '@actions/core';

interface CreateCommentArgs {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

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
  const message = core.getInput('message');
  const currentPR = github.context.payload.pull_request?.number;

  if (!currentPR) {
    return core.setFailed('No pr number found');
  }

  const formattedMessage = JSON.stringify(JSON.parse(message), null, 2);
  const comment = `\`\`\`json\n${formattedMessage}\n\`\`\``;

  const result = await createComment({ ...github.context.repo, body: comment, issue_number: currentPR });
  core.setOutput('Result', result);
}

main();
