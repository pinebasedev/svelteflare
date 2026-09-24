import { spawnSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BOOTSTRAP_STACK, BOOTSTRAP_STAGE } from '../alchemy/project.ts';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

async function cloudflareJson(fetchImpl, url, token, method = 'GET') {
  const response = await fetchImpl(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) {
    throw new Error(`Cloudflare ${method} failed (${response.status})`);
  }
  const body = await response.json();
  if (!body.success) throw new Error(`Cloudflare ${method} did not succeed`);
  return body.result;
}

function setGithubSecret(repo, value) {
  const result = spawnSync('gh', ['secret', 'set', 'CLOUDFLARE_API_TOKEN', '--repo', repo], {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  if (result.error || result.status !== 0)
    throw new Error('Failed to set the GitHub CI token secret');
}

/**
 * Roll the CI token after Alchemy has reconciled its permissions, verify the
 * new value, then publish it. When Alchemy updates a token's permissions it
 * keeps the old value in state, and republishing that would be stale.
 */
export async function refreshCiToken({
  root,
  profile = 'admin',
  profileRoot = join(homedir(), '.alchemy', 'profiles'),
  fetchImpl = fetch,
  publishSecret = setGithubSecret
}) {
  const stateRoot = join(root, '.alchemy', 'state', BOOTSTRAP_STACK, BOOTSTRAP_STAGE);
  const tokenPath = join(stateRoot, 'ci-token.json');
  const githubPath = join(stateRoot, 'cf-api-token.json');
  const tokenState = readJson(tokenPath);
  const githubState = readJson(githubPath);
  const admin = readJson(join(profileRoot, profile, 'cloudflare.json'));
  const adminToken = admin.values?.apiToken;
  const accountId = tokenState.attr?.accountId;
  const tokenId = tokenState.attr?.tokenId;
  const repo = `${githubState.props?.owner}/${githubState.props?.repository}`;
  if (!adminToken || !accountId || !tokenId || repo.includes('undefined')) {
    throw new Error('Bootstrap state or stored Cloudflare admin profile is incomplete');
  }
  if (admin.values.accountId && admin.values.accountId !== accountId) {
    throw new Error('Cloudflare admin profile belongs to a different account');
  }

  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens`;
  const value = await cloudflareJson(fetchImpl, `${base}/${tokenId}/value`, adminToken, 'PUT');
  if (typeof value !== 'string' || value.length < 40) {
    throw new Error('Cloudflare did not return a usable rolled token value');
  }
  let verified;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      verified = await cloudflareJson(fetchImpl, `${base}/verify`, value);
      break;
    } catch (error) {
      if (attempt === 5 || !String(error).includes('(401)')) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  if (verified?.id !== tokenId || verified?.status !== 'active') {
    throw new Error('Rolled token failed verification');
  }

  // Persist the new value before the GitHub write. If GitHub fails, the next
  // bootstrap can still retry using this value instead of the invalid old one.
  tokenState.attr.value = { __redacted__: value };
  writeJson(tokenPath, tokenState);
  publishSecret(repo, value);
  githubState.props.value = { __redacted__: value };
  writeJson(githubPath, githubState);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const deploy = spawnSync(
    'pnpm',
    [
      'exec',
      'alchemy',
      'deploy',
      'alchemy/github.ts',
      '--stage',
      BOOTSTRAP_STAGE,
      ...process.argv.slice(2)
    ],
    { stdio: 'inherit' }
  );
  if (deploy.error || deploy.status !== 0) {
    console.error('Alchemy bootstrap failed; CI token was not rotated.');
    process.exitCode = deploy.status || 1;
  } else {
    refreshCiToken({ root: process.cwd(), profile: process.env.ALCHEMY_PROFILE ?? 'admin' })
      .then(() =>
        console.log('Verified CI token refreshed in Cloudflare, GitHub, and Alchemy state.')
      )
      .catch((error) => {
        console.error(error instanceof Error ? error.message : 'CI token refresh failed');
        process.exitCode = 1;
      });
  }
}
