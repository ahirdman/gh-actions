import * as core from '@actions/core';

type CommentTemplate = 'none' | 'fingerprint';

export const githubToken = core.getInput('github-token', { required: true });
export const message = core.getInput('message', { required: false });
export const commentId = core.getInput('comment-id', { required: false });
export const commentTemplate = core.getInput('template', { required: false }) as CommentTemplate;
export const fingerprintDiff = core.getInput('fingerprint-diff', { required: false });
export const deleteOld = core.getBooleanInput('delete-old', { required: false });
