import * as core from '@actions/core';
import { exec, getExecOutput } from '@actions/exec';
import * as github from '@actions/github';
import { diffFingerprints, type Fingerprint, type FingerprintSource } from '@expo/fingerprint';

//const { readFile, stat } = promises;
type FingerprintProfile = 'production' | 'pull-request';
const latestTestFlightCommitFileName = 'latest-testflight-commit';

async function run() {
  const profile = core.getInput('profile', { required: true }) as FingerprintProfile;
  const commitInput = core.getInput('base-commit', { required: false });

  await exec(`echo ${latestTestFlightCommitFileName}.txt >> .gitignore`);

  //const storedProductionCommit = await getStoredBuildCommit();

  const previousFingerprint = await getPrevFingerprint({ profile, commitInput, storedProductionCommit: undefined });
  const currentFingerprint = await getCurrentFingerprint({ currentCommitSha: github.context.sha });

  const { includesChanges, diff } = createDiff({ previousFingerprint, currentFingerprint });

  core.setOutput('includes-changes', includesChanges ? 'true' : 'false');

  if (diff) {
    core.setOutput('diff', JSON.stringify(diff, null, 2));
  }
}

// async function getStoredBuildCommit(): Promise<string | undefined> {
//   const cacheKey = await restoreCache([`${latestTestFlightCommitFileName}.txt`], latestTestFlightCommitFileName);
//
//   if (!cacheKey) {
//     return undefined;
//   }
//
//   await exec(`cat ${latestTestFlightCommitFileName}.txt`);
//
//   try {
//     await stat(`${latestTestFlightCommitFileName}.txt`);
//   } catch (e) {
//     core.warning(e);
//     core.debug('Could not retive latest commit file');
//   }
//
//   const commit = await readFile(`${latestTestFlightCommitFileName}.txt`, 'utf8');
//
//   if (commit && commit.trim().length > 0) {
//     return commit.trim();
//   }
//
//   return undefined;
// }

interface GetPrevFingerprintArgs {
  profile: FingerprintProfile;
  commitInput: string | undefined;
  storedProductionCommit: string | undefined;
}

async function getPrevFingerprint({
  profile,
  commitInput,
  storedProductionCommit,
}: GetPrevFingerprintArgs): Promise<Fingerprint | undefined> {
  if (commitInput) {
    await checkoutCommit(commitInput);
    return await getFingerprint();
  }

  if (profile === 'pull-request') {
    const { stdout, stderr } = await getExecOutput('git rev-parse main');

    if (stderr) {
      core.setFailed('Getting main commit sha failed');
    }

    await checkoutCommit(stdout.trim());
    return await getFingerprint();
  }

  if (profile === 'production') {
    if (!storedProductionCommit) {
      core.setFailed('Ran Fingerprint check on Production profile without a stored build commit');
      throw new Error();
    }

    await checkoutCommit(storedProductionCommit);
    return await getFingerprint();
  }

  core.setFailed('getPrevingerprint did not return any fingerprint');
}

interface GetCurrentFingerprintArgs {
  currentCommitSha: string;
}

async function getCurrentFingerprint({ currentCommitSha }: GetCurrentFingerprintArgs): Promise<Fingerprint> {
  await checkoutCommit(currentCommitSha);
  await exec('npm install');

  const { stdout } = await getExecOutput('npx @expo/fingerprint .');

  return JSON.parse(stdout.trim());
}

interface CreateDiffArgs {
  currentFingerprint?: Fingerprint | undefined;
  previousFingerprint?: Fingerprint | undefined;
}

interface FingerprintResult {
  includesChanges: boolean;
  diff?: FingerprintSource[] | undefined;
}

function createDiff({ currentFingerprint, previousFingerprint }: CreateDiffArgs): FingerprintResult {
  if (!currentFingerprint || !previousFingerprint) {
    core.setFailed('Fingerprints not found. Aborting.');
    throw new Error();
  }

  const diff = diffFingerprints(currentFingerprint, previousFingerprint);

  const hasBareRncliAutolinking = diff.some((s) => s.reasons.includes('bareRncliAutolinking'));
  const hasExpoAutolinkingAndroid = diff.some((s) => s.reasons.includes('expoAutolinkingAndroid'));
  const hasExpoAutolinkingIos = diff.some((s) => s.reasons.includes('expoAutolinkingIos'));

  const includesChanges = hasBareRncliAutolinking || hasExpoAutolinkingAndroid || hasExpoAutolinkingIos;

  return { diff, includesChanges };
}

async function checkoutCommit(commit: string) {
  await exec(`git checkout ${commit}`);
}

async function getFingerprint(): Promise<Fingerprint> {
  await exec('npm install');

  const { stdout, stderr } = await getExecOutput('npx @expo/fingerprint .');

  if (stderr) {
    core.setFailed('Running @expo/fingerpint failed');
  }

  return JSON.parse(stdout.trim());
}

run();
