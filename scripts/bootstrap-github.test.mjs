import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BOOTSTRAP_STACK, BOOTSTRAP_STAGE } from '../alchemy/project.ts';
import { refreshCiToken } from './bootstrap-github.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'refresh-ci-token-'));
  const state = join(root, '.alchemy', 'state', BOOTSTRAP_STACK, BOOTSTRAP_STAGE);
  const profiles = join(root, 'profiles');
  mkdirSync(state, { recursive: true });
  mkdirSync(join(profiles, 'admin'), { recursive: true });
  const tokenPath = join(state, 'ci-token.json');
  const githubPath = join(state, 'cf-api-token.json');
  writeFileSync(
    tokenPath,
    JSON.stringify({
      attr: { accountId: 'account', tokenId: 'token-id', value: { __redacted__: 'old' } }
    })
  );
  writeFileSync(
    githubPath,
    JSON.stringify({
      props: { owner: 'owner', repository: 'repo', value: { __redacted__: 'old' } }
    })
  );
  writeFileSync(
    join(profiles, 'admin', 'cloudflare.json'),
    JSON.stringify({ values: { accountId: 'account', apiToken: 'admin' } })
  );
  return {
    root,
    profiles,
    tokenPath,
    githubPath,
    cleanup: () => rmSync(root, { recursive: true, force: true })
  };
}

const newValue = 'a'.repeat(53);

test('rolls, verifies, then updates GitHub and both local state records', async () => {
  const f = fixture();
  const calls = [];
  try {
    await refreshCiToken({
      root: f.root,
      profileRoot: f.profiles,
      fetchImpl: async (url, options) => {
        calls.push([url, options.method]);
        return {
          ok: true,
          json: async () => ({
            success: true,
            result: options.method === 'PUT' ? newValue : { id: 'token-id', status: 'active' }
          })
        };
      },
      publishSecret: (repo, value) => {
        assert.equal(repo, 'owner/repo');
        assert.equal(value, newValue);
        assert.equal(JSON.parse(readFileSync(f.tokenPath)).attr.value.__redacted__, newValue);
        calls.push(['github', 'SET']);
      }
    });
    assert.deepEqual(
      calls.map(([, method]) => method),
      ['PUT', 'GET', 'SET']
    );
    assert.equal(JSON.parse(readFileSync(f.githubPath)).props.value.__redacted__, newValue);
  } finally {
    f.cleanup();
  }
});

test('does not publish or overwrite state if Cloudflare rejects the rolled value', async () => {
  const f = fixture();
  try {
    await assert.rejects(
      refreshCiToken({
        root: f.root,
        profileRoot: f.profiles,
        fetchImpl: async (_url, options) => ({
          ok: true,
          json: async () => ({
            success: true,
            result: options.method === 'PUT' ? newValue : { id: 'different', status: 'active' }
          })
        }),
        publishSecret: () => assert.fail('GitHub must not receive an unverified token')
      }),
      /failed verification/
    );
    assert.equal(JSON.parse(readFileSync(f.tokenPath)).attr.value.__redacted__, 'old');
    assert.equal(JSON.parse(readFileSync(f.githubPath)).props.value.__redacted__, 'old');
  } finally {
    f.cleanup();
  }
});

test('keeps the rolled token in Alchemy state if GitHub publishing fails', async () => {
  const f = fixture();
  try {
    await assert.rejects(
      refreshCiToken({
        root: f.root,
        profileRoot: f.profiles,
        fetchImpl: async (_url, options) => ({
          ok: true,
          json: async () => ({
            success: true,
            result: options.method === 'PUT' ? newValue : { id: 'token-id', status: 'active' }
          })
        }),
        publishSecret: () => {
          throw new Error('GitHub unavailable');
        }
      }),
      /GitHub unavailable/
    );
    assert.equal(JSON.parse(readFileSync(f.tokenPath)).attr.value.__redacted__, newValue);
    assert.equal(JSON.parse(readFileSync(f.githubPath)).props.value.__redacted__, 'old');
  } finally {
    f.cleanup();
  }
});
