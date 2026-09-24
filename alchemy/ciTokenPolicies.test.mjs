import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PERMISSION_GROUPS, resolvePolicies } from 'alchemy/Cloudflare/ApiToken';
import { ciTokenPolicies } from './ciTokenPolicies.ts';

test('CI token grants account-level Access app and policy writes', () => {
  const accountId = 'test-account';
  const policies = resolvePolicies(ciTokenPolicies(accountId));
  const accessWrite = PERMISSION_GROUPS.find(
    (group) =>
      group.name === 'Access: Apps and Policies Write' &&
      group.scopes.includes('com.cloudflare.api.account')
  );
  assert.ok(accessWrite, 'Cloudflare catalog must contain account-level Access write');
  assert.ok(
    policies.some(
      (policy) =>
        policy.effect === 'allow' &&
        policy.resources[`com.cloudflare.api.account.${accountId}`] === '*' &&
        policy.permissionGroups.some((group) => group.id === accessWrite.id)
    ),
    'CI must receive account-level Access write; the same-named zone permission does not apply'
  );

  for (const policy of policies) {
    for (const { id } of policy.permissionGroups) {
      const group = PERMISSION_GROUPS.find((entry) => entry.id === id);
      assert.ok(
        group?.scopes.includes('com.cloudflare.api.account'),
        `${id} must apply to accounts`
      );
    }
  }
});
