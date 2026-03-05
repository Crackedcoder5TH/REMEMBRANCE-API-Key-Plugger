'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { PROVIDERS, PROVIDER_NAMES, buildCustomProvider, getProvider } = require('../src/providers/registry');
const { validateCustomProvider } = require('../src/providers/custom');

describe('PROVIDERS', () => {
  it('should have 5 built-in providers', () => {
    assert.equal(PROVIDER_NAMES.length, 5);
    assert.ok(PROVIDER_NAMES.includes('google'));
    assert.ok(PROVIDER_NAMES.includes('github'));
    assert.ok(PROVIDER_NAMES.includes('facebook'));
    assert.ok(PROVIDER_NAMES.includes('discord'));
    assert.ok(PROVIDER_NAMES.includes('twitter'));
  });

  it('each provider should have envVars, nextauth config', () => {
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      assert.ok(provider.name, `${key} should have name`);
      assert.ok(provider.envVars, `${key} should have envVars`);
      assert.ok(provider.nextauth, `${key} should have nextauth`);
      assert.ok(provider.nextauth.import, `${key} should have nextauth.import`);
      assert.ok(provider.nextauth.config, `${key} should have nextauth.config`);

      // Should have CLIENT_ID and CLIENT_SECRET env vars
      const varNames = Object.keys(provider.envVars);
      assert.ok(varNames.some(v => v.endsWith('_CLIENT_ID')), `${key} should have CLIENT_ID var`);
      assert.ok(varNames.some(v => v.endsWith('_CLIENT_SECRET')), `${key} should have CLIENT_SECRET var`);
    }
  });
});

describe('buildCustomProvider', () => {
  it('should build a valid custom provider', () => {
    const p = buildCustomProvider('myoidc');
    assert.equal(p.name, 'Custom (myoidc)');
    assert.ok(p.envVars.MYOIDC_CLIENT_ID);
    assert.ok(p.envVars.MYOIDC_CLIENT_SECRET);
    assert.ok(p.envVars.MYOIDC_ISSUER);
    assert.ok(p.custom);
  });

  it('should sanitize name for env vars', () => {
    const p = buildCustomProvider('my-provider');
    assert.ok(p.envVars.MY_PROVIDER_CLIENT_ID);
  });
});

describe('getProvider', () => {
  it('should return built-in provider', () => {
    const p = getProvider('google');
    assert.equal(p.name, 'Google');
    assert.equal(p.key, 'google');
  });

  it('should return custom provider for unknown names', () => {
    const p = getProvider('okta');
    assert.equal(p.name, 'Custom (okta)');
    assert.ok(p.custom);
  });
});

describe('validateCustomProvider', () => {
  it('should reject short names', () => {
    const errors = validateCustomProvider('a', {});
    assert.ok(errors.length > 0);
  });

  it('should reject invalid characters', () => {
    const errors = validateCustomProvider('my provider!', {});
    assert.ok(errors.length > 0);
  });

  it('should reject invalid issuer URLs', () => {
    const errors = validateCustomProvider('valid', { issuer: 'not-a-url' });
    assert.ok(errors.length > 0);
  });

  it('should accept valid input', () => {
    const errors = validateCustomProvider('myoidc', { issuer: 'https://example.com' });
    assert.equal(errors.length, 0);
  });
});
