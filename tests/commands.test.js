'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { readEnv } = require('../src/generators/env');

let tmpDir;

function setupNextJsProject(dir) {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'test-app',
    dependencies: { next: '14.0.0', 'next-auth': '4.24.0' },
  }));
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugger-cmd-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('init command', () => {
  it('should initialize a Next.js project', async () => {
    setupNextJsProject(tmpDir);
    const initCmd = require('../src/commands/init');
    await initCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);

    // Should create .env.local
    const envPath = path.join(tmpDir, '.env.local');
    assert.ok(fs.existsSync(envPath));

    // Should have NEXTAUTH_SECRET
    const { vars } = readEnv(envPath);
    assert.ok(vars.NEXTAUTH_SECRET);
    assert.ok(vars.NEXTAUTH_SECRET.length >= 32);
    assert.equal(vars.NEXTAUTH_URL, 'http://localhost:3000');

    // Should create NextAuth route
    const routePath = path.join(tmpDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
    assert.ok(fs.existsSync(routePath));
  });

  it('should update .gitignore', async () => {
    setupNextJsProject(tmpDir);
    const initCmd = require('../src/commands/init');
    await initCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);

    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    assert.ok(gitignore.includes('.env'));
  });
});

describe('add command', () => {
  it('should add Google provider with flags', async () => {
    setupNextJsProject(tmpDir);
    // Init first
    const initCmd = require('../src/commands/init');
    await initCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);

    const addCmd = require('../src/commands/add');
    await addCmd({
      _sub: 'google',
      _positional: ['google'],
      _flags: { 'client-id': 'test-id-123', 'client-secret': 'test-secret-456' },
    }, tmpDir);

    const { vars } = readEnv(path.join(tmpDir, '.env.local'));
    assert.equal(vars.GOOGLE_CLIENT_ID, 'test-id-123');
    assert.equal(vars.GOOGLE_CLIENT_SECRET, 'test-secret-456');

    // Check route file includes Google
    const routeContent = fs.readFileSync(
      path.join(tmpDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts'), 'utf8'
    );
    assert.ok(routeContent.includes('GoogleProvider'));
  });

  it('should add multiple providers', async () => {
    setupNextJsProject(tmpDir);
    const initCmd = require('../src/commands/init');
    await initCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);

    const addCmd = require('../src/commands/add');
    await addCmd({
      _sub: 'google',
      _positional: ['google'],
      _flags: { 'client-id': 'g-id', 'client-secret': 'g-secret' },
    }, tmpDir);

    await addCmd({
      _sub: 'github',
      _positional: ['github'],
      _flags: { 'client-id': 'gh-id', 'client-secret': 'gh-secret' },
    }, tmpDir);

    const routeContent = fs.readFileSync(
      path.join(tmpDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts'), 'utf8'
    );
    assert.ok(routeContent.includes('GoogleProvider'));
    assert.ok(routeContent.includes('GitHubProvider'));
  });
});

describe('remove command', () => {
  it('should remove a provider', async () => {
    setupNextJsProject(tmpDir);
    const initCmd = require('../src/commands/init');
    await initCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);

    const addCmd = require('../src/commands/add');
    await addCmd({
      _sub: 'google',
      _positional: ['google'],
      _flags: { 'client-id': 'g-id', 'client-secret': 'g-secret' },
    }, tmpDir);

    const removeCmd = require('../src/commands/remove');
    await removeCmd({
      _sub: 'google',
      _positional: ['google'],
      _flags: {},
    }, tmpDir);

    const { vars } = readEnv(path.join(tmpDir, '.env.local'));
    assert.equal(vars.GOOGLE_CLIENT_ID, undefined);
    assert.equal(vars.GOOGLE_CLIENT_SECRET, undefined);

    const routeContent = fs.readFileSync(
      path.join(tmpDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts'), 'utf8'
    );
    assert.ok(!routeContent.includes('GoogleProvider'));
  });
});

describe('list command', () => {
  it('should run without errors on empty project', async () => {
    setupNextJsProject(tmpDir);
    const listCmd = require('../src/commands/list');
    // Should not throw
    await listCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);
  });
});

describe('status command', () => {
  it('should run without errors', async () => {
    setupNextJsProject(tmpDir);
    const statusCmd = require('../src/commands/status');
    await statusCmd({ _flags: {}, _sub: null, _positional: [] }, tmpDir);
  });
});
