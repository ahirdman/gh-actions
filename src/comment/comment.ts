import { GitHub } from '@actions/github/lib/utils';
import { commentId } from './input';

export function createCommentIdentifier(commentId: string): string {
  return `<!-- comment-id: ${commentId} -->`;
}

export function createBodyWithIdentifier(body: string, commentId: string): string {
  return `${body}\n${createCommentIdentifier(commentId)}`;
}

interface OctokitRestArgs {
  octokit: InstanceType<typeof GitHub>;
  owner: string;
  repo: string;
  issue_number: number;
}

interface GetPreviousCommentArgs extends OctokitRestArgs {
  commentId: string;
}

export async function getPreviousComment(args: GetPreviousCommentArgs): Promise<{ id: number } | undefined> {
  const result = await args.octokit.rest.issues.listComments({
    owner: args.owner,
    repo: args.repo,
    issue_number: args.issue_number,
  });

  if (result.status !== 200) {
    throw new Error(`Failed getting pull-request comments. Reason: [${JSON.stringify(result.data, null, 2)}]`);
  }

  const commentIdentifier = createCommentIdentifier(commentId);
  const previousComment = result.data.find((comment) => comment.body?.includes(commentIdentifier));

  return previousComment ? { id: previousComment.id } : undefined;
}

interface CreateCommentArgs extends OctokitRestArgs {
  body: string;
}

export async function createComment(args: CreateCommentArgs): Promise<number> {
  const result = await args.octokit.rest.issues.createComment({
    owner: args.owner,
    repo: args.repo,
    issue_number: args.issue_number,
    body: args.body,
  });

  if (result.status !== 201) {
    throw new Error(`Failed creating comment. Reason: [${JSON.stringify(result.data, null, 2)}]`);
  }

  return result.data.id;
}

interface UpdateCommentArgs extends OctokitRestArgs {
  commentId: number;
  body: string;
}

export async function updateComment(args: UpdateCommentArgs): Promise<number> {
  const result = await args.octokit.rest.issues.updateComment({
    owner: args.owner,
    repo: args.repo,
    comment_id: args.commentId,
    body: args.body,
  });

  if (result.status !== 200) {
    throw new Error(`Failed updating comment. Reason: [${JSON.stringify(result.data, null, 2)}]`);
  }

  return result.data.id;
}

interface DeleteCommentArgs extends OctokitRestArgs {
  commentId: number;
}

export async function deleteComment(args: DeleteCommentArgs): Promise<void> {
  const result = await args.octokit.rest.issues.deleteComment({
    owner: args.owner,
    repo: args.repo,
    comment_id: args.commentId,
  });

  if (result.status !== 204) {
    throw new Error(`Failed deleting comment. Reason: [${JSON.stringify(result.data, null, 2)}]`);
  }
}
