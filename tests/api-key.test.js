'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Key Store', () => {
  let tmpDir;
  let originalHome;

  before(() => {
    // Use a temp directory so we don't affect real ~/.plugger
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugger-test-'));
    originalHome = process.env.HOME;
    process.env.HOME = tmpDir;
    // Force a known master key for deterministic tests
    process.env.PLUGGER_MASTER_KEY = 'test-master-key-for-ci';

    // Clear module cache to pick up new HOME
    delete require.cache[require.resolve('../src/services/key-store')];
  });

  after(() => {
    process.env.HOME = originalHome;
    delete process.env.PLUGGER_MASTER_KEY;
    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('encrypt/decrypt round-trip', () => {
    const keyStore = require('../src/services/key-store');
    const original = 'sk_test_123456789abcdef';
    const encrypted = keyStore.encrypt(original);
    assert.notStrictEqual(encrypted, original);
    assert.ok(encrypted.includes(':'));
    const decrypted = keyStore.decrypt(encrypted);
    assert.strictEqual(decrypted, original);
  });

  it('saveKey + getKey round-trip', () => {
    delete require.cache[require.resolve('../src/services/key-store')];
    const keyStore = require('../src/services/key-store');
    keyStore.saveKey('stripe', { key: 'sk_test_abc123', url: null });
    const result = keyStore.getKey('stripe');
    assert.ok(result);
    assert.strictEqual(result.key, 'sk_test_abc123');
    assert.strictEqual(result.url, null);
    assert.ok(result.createdAt);
  });

  it('listKeys shows masked keys', () => {
    delete require.cache[require.resolve('../src/services/key-store')];
    const keyStore = require('../src/services/key-store');
    keyStore.saveKey('openai', { key: 'sk-1234567890abcdef', url: null });
    const list = keyStore.listKeys();
    assert.ok(list.length > 0);
    const openai = list.find(e => e.service === 'openai');
    assert.ok(openai);
    assert.ok(openai.key.includes('...'));
    assert.notStrictEqual(openai.key, 'sk-1234567890abcdef');
  });

  it('removeKey removes a key', () => {
    delete require.cache[require.resolve('../src/services/key-store')];
    const keyStore = require('../src/services/key-store');
    keyStore.saveKey('temp-service', { key: 'temp-key' });
    assert.ok(keyStore.getKey('temp-service'));
    const removed = keyStore.removeKey('temp-service');
    assert.strictEqual(removed, true);
    assert.strictEqual(keyStore.getKey('temp-service'), null);
  });

  it('removeKey returns false for nonexistent', () => {
    delete require.cache[require.resolve('../src/services/key-store')];
    const keyStore = require('../src/services/key-store');
    const removed = keyStore.removeKey('nonexistent');
    assert.strictEqual(removed, false);
  });

  it('rotateKey replaces the key', () => {
    delete require.cache[require.resolve('../src/services/key-store')];
    const keyStore = require('../src/services/key-store');
    keyStore.saveKey('rotatable', { key: 'old-key-value' });
    const rotated = keyStore.rotateKey('rotatable', 'new-key-value');
    assert.strictEqual(rotated, true);
    const result = keyStore.getKey('rotatable');
    assert.strictEqual(result.key, 'new-key-value');
  });

  it('rotateKey returns false for nonexistent', () => {
    delete require.cache[require.resolve('../src/services/key-store')];
    const keyStore = require('../src/services/key-store');
    const rotated = keyStore.rotateKey('ghost', 'new-key');
    assert.strictEqual(rotated, false);
  });
});
