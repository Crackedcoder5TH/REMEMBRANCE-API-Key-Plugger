'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { detectProject, hasExistingAuthRoute } = require('../src/detect');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugger-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('detectProject', () => {
  it('should return null framework when no package.json', () => {
    const result = detectProject(tmpDir);
    assert.equal(result.framework, null);
    assert.equal(result.packageJson, null);
  });

  it('should detect Next.js with App Router', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '14.0.0', 'next-auth': '4.24.0' },
    }));
    fs.mkdirSync(path.join(tmpDir, 'app'), { recursive: true });
    const result = detectProject(tmpDir);
    assert.equal(result.framework, 'nextjs');
    assert.equal(result.routerType, 'app');
    assert.equal(result.hasNextAuth, true);
  });

  it('should detect Pages Router', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '14.0.0' },
    }));
    fs.mkdirSync(path.join(tmpDir, 'pages'), { recursive: true });
    const result = detectProject(tmpDir);
    assert.equal(result.routerType, 'pages');
  });

  it('should detect next-auth absence', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '14.0.0' },
    }));
    const result = detectProject(tmpDir);
    assert.equal(result.hasNextAuth, false);
  });

  it('should use .env.local for Next.js projects', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '14.0.0' },
    }));
    const result = detectProject(tmpDir);
    assert.ok(result.envFile.endsWith('.env.local'));
  });
});

describe('hasExistingAuthRoute', () => {
  it('should detect existing app router route', () => {
    const routeDir = path.join(tmpDir, 'app', 'api', 'auth', '[...nextauth]');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'route.ts'), 'export {}');
    assert.equal(hasExistingAuthRoute(tmpDir, 'app'), true);
  });

  it('should return false when no route exists', () => {
    assert.equal(hasExistingAuthRoute(tmpDir, 'app'), false);
  });

  it('should detect pages router route', () => {
    const routeDir = path.join(tmpDir, 'pages', 'api', 'auth');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, '[...nextauth].ts'), 'export {}');
    assert.equal(hasExistingAuthRoute(tmpDir, 'pages'), true);
  });
});
