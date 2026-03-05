'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseEnvFile, serializeEnv, readEnv, writeEnv, mergeEnv, removeEnvVars, ensureGitignore } = require('../src/generators/env');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugger-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('parseEnvFile', () => {
  it('should parse variables', () => {
    const entries = parseEnvFile('KEY=value\nSECRET=abc123');
    assert.equal(entries.length, 2);
    assert.equal(entries[0].type, 'var');
    assert.equal(entries[0].key, 'KEY');
    assert.equal(entries[0].value, 'value');
  });

  it('should parse comments and blanks', () => {
    const entries = parseEnvFile('# comment\n\nKEY=val');
    assert.equal(entries[0].type, 'comment');
    assert.equal(entries[1].type, 'blank');
    assert.equal(entries[2].type, 'var');
  });

  it('should handle empty values', () => {
    const entries = parseEnvFile('KEY=');
    assert.equal(entries[0].value, '');
  });

  it('should handle values with equals signs', () => {
    const entries = parseEnvFile('KEY=a=b=c');
    assert.equal(entries[0].value, 'a=b=c');
  });
});

describe('serializeEnv', () => {
  it('should round-trip parse → serialize', () => {
    const input = '# Header\nKEY=value\n\nOTHER=123';
    const entries = parseEnvFile(input);
    assert.equal(serializeEnv(entries), input);
  });
});

describe('readEnv', () => {
  it('should return empty state for missing file', () => {
    const { entries, vars } = readEnv(path.join(tmpDir, 'missing.env'));
    assert.equal(entries.length, 0);
    assert.deepEqual(vars, {});
  });

  it('should read existing file', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'A=1\nB=2\n');
    const { vars } = readEnv(envPath);
    assert.equal(vars.A, '1');
    assert.equal(vars.B, '2');
  });
});

describe('writeEnv', () => {
  it('should create file with entries', () => {
    const envPath = path.join(tmpDir, '.env');
    writeEnv(envPath, [
      { type: 'comment', raw: '# test' },
      { type: 'var', key: 'X', value: '42' },
    ]);
    const content = fs.readFileSync(envPath, 'utf8');
    assert.ok(content.includes('# test'));
    assert.ok(content.includes('X=42'));
  });

  it('should create parent directories', () => {
    const envPath = path.join(tmpDir, 'sub', 'dir', '.env');
    writeEnv(envPath, [{ type: 'var', key: 'K', value: 'V' }]);
    assert.ok(fs.existsSync(envPath));
  });
});

describe('mergeEnv', () => {
  it('should add new vars to empty file', () => {
    const envPath = path.join(tmpDir, '.env');
    const { added, skipped } = mergeEnv(envPath, { A: '1', B: '2' }, '# Section');
    assert.deepEqual(added, ['A', 'B']);
    assert.deepEqual(skipped, []);
    const { vars } = readEnv(envPath);
    assert.equal(vars.A, '1');
    assert.equal(vars.B, '2');
  });

  it('should not overwrite existing non-empty values', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'A=original\n');
    const { added, skipped } = mergeEnv(envPath, { A: 'new' });
    assert.deepEqual(added, []);
    assert.deepEqual(skipped, ['A']);
    const { vars } = readEnv(envPath);
    assert.equal(vars.A, 'original');
  });

  it('should fill empty existing vars in-place', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'A=\n');
    const { added } = mergeEnv(envPath, { A: 'filled' });
    assert.deepEqual(added, ['A']);
    const { vars } = readEnv(envPath);
    assert.equal(vars.A, 'filled');
  });
});

describe('removeEnvVars', () => {
  it('should remove specified keys', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'A=1\nB=2\nC=3\n');
    const removed = removeEnvVars(envPath, ['A', 'C']);
    assert.deepEqual(removed, ['A', 'C']);
    const { vars } = readEnv(envPath);
    assert.equal(vars.A, undefined);
    assert.equal(vars.B, '2');
    assert.equal(vars.C, undefined);
  });

  it('should handle removing non-existent keys', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'A=1\n');
    const removed = removeEnvVars(envPath, ['Z']);
    assert.deepEqual(removed, []);
  });
});

describe('ensureGitignore', () => {
  it('should create .gitignore with env entries', () => {
    const added = ensureGitignore(tmpDir);
    assert.ok(added.includes('.env'));
    assert.ok(added.includes('.env.local'));
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    assert.ok(content.includes('.env'));
  });

  it('should not duplicate entries', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.env\n.env.local\n.env*.local\n');
    const added = ensureGitignore(tmpDir);
    assert.deepEqual(added, []);
  });
});
