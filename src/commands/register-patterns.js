'use strict';

const fs = require('fs');
const path = require('path');
const { log } = require('../utils');
const { registerWithOracle, isOracleAvailable } = require('../oracle');

/**
 * plugger register-patterns — register the Plugger's own codebase as Oracle patterns.
 */

const PATTERN_MAP = [
  {
    file: 'generators/env.js',
    test: '../../tests/env.test.js',
    name: 'env-file-parser',
    description: 'Env file parser/writer/merger preserving comments and order, plus gitignore updater',
    tags: ['env', 'dotenv', 'parsing', 'merge', 'config'],
  },
  {
    file: 'providers/registry.js',
    test: '../../tests/providers.test.js',
    name: 'oauth-provider-registry',
    description: 'Declarative OAuth provider definitions with env vars, NextAuth imports, and config generation',
    tags: ['registry', 'oauth', 'providers', 'extensible'],
  },
  {
    file: 'detect.js',
    test: '../../tests/detect.test.js',
    name: 'nextjs-project-detector',
    description: 'Detect Next.js project type, router type, and auth setup',
    tags: ['detection', 'nextjs', 'framework', 'project-analysis'],
  },
  {
    file: 'generators/nextauth.js',
    test: '../../tests/nextauth.test.js',
    name: 'nextauth-code-generator',
    description: 'Generates NextAuth route files for App and Pages Router with dynamic provider composition',
    tags: ['codegen', 'nextauth', 'oauth', 'typescript'],
  },
  {
    file: 'utils.js',
    test: null,
    name: 'cli-utilities',
    description: 'CLI utilities: zero-dep arg parser, ANSI colors, structured logging, secret masking',
    tags: ['cli', 'arg-parser', 'colors', 'logging', 'utility'],
  },
  {
    file: 'prompt.js',
    test: null,
    name: 'interactive-prompts',
    description: 'Zero-dep interactive readline prompts: ask, confirm, select, getCredentials',
    tags: ['cli', 'readline', 'prompts', 'interactive'],
  },
  {
    file: 'providers/custom.js',
    test: null,
    name: 'custom-oidc-validator',
    description: 'Custom OIDC provider validation with issuer URL and configuration checks',
    tags: ['oidc', 'validation', 'custom-provider'],
  },
  {
    file: 'oracle.js',
    test: null,
    name: 'oracle-bridge',
    description: 'Zero-dep Oracle HTTP bridge with graceful degradation for CLI tools',
    tags: ['oracle', 'http-client', 'integration', 'graceful-degradation'],
  },
  {
    file: 'services/key-store.js',
    test: null,
    name: 'encrypted-key-store',
    description: 'AES-256-GCM encrypted API key storage with auto-generated master keys',
    tags: ['encryption', 'api-keys', 'storage', 'security'],
  },
];

async function registerPatternsCommand(parsed) {
  const dryRun = parsed._flags['dry-run'];

  // Check Oracle availability
  const available = await isOracleAvailable();
  if (!available && !dryRun) {
    log.error('Oracle is not reachable. Set ORACLE_URL and ORACLE_API_KEY, or use --dry-run to preview.');
    process.exitCode = 1;
    return;
  }

  const srcDir = path.join(__dirname, '..');
  let registered = 0;
  let failed = 0;

  for (const entry of PATTERN_MAP) {
    const filePath = path.join(srcDir, entry.file);
    if (!fs.existsSync(filePath)) {
      log.warn(`Skipping ${entry.name} — file not found: ${entry.file}`);
      failed++;
      continue;
    }

    const code = fs.readFileSync(filePath, 'utf8');
    let testCode = null;
    if (entry.test) {
      const testPath = path.resolve(path.join(srcDir, entry.file), '..', entry.test);
      try {
        testCode = fs.readFileSync(testPath, 'utf8');
      } catch { /* no test file */ }
    }

    if (dryRun) {
      log.dim(`[dry-run] ${entry.name} (${code.length} bytes${testCode ? `, test: ${testCode.length} bytes` : ''})`);
      registered++;
      continue;
    }

    const result = await registerWithOracle({
      name: entry.name,
      code,
      language: 'javascript',
      description: entry.description,
      tags: entry.tags,
      testCode,
    });

    if (result && (result.success || result.registered)) {
      log.success(`Registered: ${entry.name}`);
      registered++;
    } else {
      log.warn(`Failed: ${entry.name}${result && result.error ? ` — ${result.error}` : ''}`);
      failed++;
    }
  }

  console.log('');
  log.info(`${registered} registered, ${failed} failed (${PATTERN_MAP.length} total)`);
}

module.exports = registerPatternsCommand;
