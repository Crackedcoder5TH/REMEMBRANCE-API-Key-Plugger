'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateRouteContent, generatePagesRouteContent, writeNextAuthRoute, detectConfiguredProviders } = require('../src/generators/nextauth');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugger-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('generateRouteContent', () => {
  it('should generate empty providers route', () => {
    const content = generateRouteContent([]);
    assert.ok(content.includes('import NextAuth'));
    assert.ok(content.includes('providers: []'));
    assert.ok(content.includes('export { handler as GET, handler as POST }'));
  });

  it('should include Google provider', () => {
    const content = generateRouteContent(['google']);
    assert.ok(content.includes('import GoogleProvider'));
    assert.ok(content.includes('GOOGLE_CLIENT_ID'));
    assert.ok(content.includes('GOOGLE_CLIENT_SECRET'));
  });

  it('should include multiple providers', () => {
    const content = generateRouteContent(['google', 'github']);
    assert.ok(content.includes('import GoogleProvider'));
    assert.ok(content.includes('import GitHubProvider'));
  });

  it('should include session callback', () => {
    const content = generateRouteContent(['google']);
    assert.ok(content.includes('callbacks'));
    assert.ok(content.includes('session'));
  });
});

describe('generatePagesRouteContent', () => {
  it('should use export default instead of handler', () => {
    const content = generatePagesRouteContent(['google']);
    assert.ok(content.includes('export default NextAuth'));
    assert.ok(!content.includes('export { handler'));
  });
});

describe('writeNextAuthRoute', () => {
  it('should create app router route file', () => {
    const routePath = writeNextAuthRoute(tmpDir, ['google'], { routerType: 'app' });
    assert.ok(fs.existsSync(routePath));
    assert.ok(routePath.includes('[...nextauth]'));
    assert.ok(routePath.endsWith('route.ts'));
    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(content.includes('GoogleProvider'));
  });

  it('should create pages router route file', () => {
    const routePath = writeNextAuthRoute(tmpDir, ['github'], { routerType: 'pages' });
    assert.ok(fs.existsSync(routePath));
    assert.ok(routePath.endsWith('[...nextauth].ts'));
    const content = fs.readFileSync(routePath, 'utf8');
    assert.ok(content.includes('export default NextAuth'));
  });

  it('should create directory structure', () => {
    writeNextAuthRoute(tmpDir, [], { routerType: 'app' });
    assert.ok(fs.existsSync(path.join(tmpDir, 'app', 'api', 'auth', '[...nextauth]')));
  });
});

describe('detectConfiguredProviders', () => {
  it('should detect providers from env vars', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'GOOGLE_CLIENT_ID=abc\nGOOGLE_CLIENT_SECRET=xyz\n');
    const providers = detectConfiguredProviders(envPath);
    assert.ok(providers.includes('google'));
  });

  it('should not detect unconfigured providers', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'GOOGLE_CLIENT_ID=\n');
    const providers = detectConfiguredProviders(envPath);
    assert.ok(!providers.includes('google'));
  });

  it('should detect custom OIDC providers', () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'OKTA_CLIENT_ID=abc\nOKTA_ISSUER=https://okta.example.com\n');
    const providers = detectConfiguredProviders(envPath);
    assert.ok(providers.includes('okta'));
  });

  it('should return empty for missing file', () => {
    const providers = detectConfiguredProviders(path.join(tmpDir, 'nope'));
    assert.equal(providers.length, 0);
  });
});
