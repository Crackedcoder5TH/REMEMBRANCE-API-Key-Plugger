'use strict';

const path = require('path');
const fs = require('fs');
const { log, generateSecret } = require('../utils');
const { detectProject, hasExistingAuthRoute } = require('../detect');
const { mergeEnv, ensureGitignore } = require('../generators/env');
const { writeNextAuthRoute, detectConfiguredProviders } = require('../generators/nextauth');
const { PROVIDER_NAMES } = require('../providers/registry');
const { confirm, select } = require('../prompt');
const { registerWithOracle } = require('../oracle');

/**
 * plugger init — detect project, set up .env and NextAuth route.
 */
async function initCommand(parsed, projectDir) {
  log.info('Initializing OAuth configuration...');

  const project = detectProject(projectDir);

  if (!project.packageJson) {
    log.error('No package.json found. Run this command in a Node.js project root.');
    process.exitCode = 1;
    return;
  }

  if (!project.framework) {
    log.warn('Could not detect Next.js. This tool currently supports Next.js projects.');
    log.dim('Make sure "next" is in your package.json dependencies.');
    process.exitCode = 1;
    return;
  }

  log.success(`Detected: Next.js (${project.routerType === 'app' ? 'App Router' : 'Pages Router'})`);

  if (!project.hasNextAuth) {
    log.warn('next-auth not found in dependencies.');
    log.dim('Install it: npm install next-auth');
  }

  // Ensure .gitignore covers .env files
  const gitignoreAdded = ensureGitignore(projectDir);
  if (gitignoreAdded.length > 0) {
    log.success(`Updated .gitignore: added ${gitignoreAdded.join(', ')}`);
  }

  // Create/update .env file with base NextAuth vars
  const envPath = project.envFile;
  const baseVars = {
    NEXTAUTH_SECRET: generateSecret(),
    NEXTAUTH_URL: 'http://localhost:3000',
  };

  const { added, skipped } = mergeEnv(envPath, baseVars, '# --- NextAuth Base Config ---');

  if (added.length > 0) {
    log.success(`Created ${path.basename(envPath)}: set ${added.join(', ')}`);
  }
  if (skipped.length > 0) {
    log.dim(`Skipped (already set): ${skipped.join(', ')}`);
  }

  // Generate NextAuth route file
  const existingRoute = hasExistingAuthRoute(projectDir, project.routerType);
  if (existingRoute) {
    log.dim('NextAuth route file already exists — will update when providers are added.');
  } else {
    const configuredProviders = detectConfiguredProviders(envPath);
    const routePath = writeNextAuthRoute(projectDir, configuredProviders, {
      routerType: project.routerType,
    });
    const relPath = path.relative(projectDir, routePath);
    log.success(`Created ${relPath}`);
  }

  // Register project detection pattern with Oracle (fire-and-forget)
  try {
    const detectCode = fs.readFileSync(require.resolve('../detect'), 'utf8');
    registerWithOracle({
      name: 'nextjs-project-detection',
      code: detectCode,
      language: 'javascript',
      description: 'Detect Next.js project type, router type, and auth setup',
      tags: ['nextjs', 'detection', 'project-detection', 'framework-detection'],
    }).catch(() => {});
  } catch { /* Oracle unavailable — no problem */ }

  console.log('');
  log.info('Next steps:');
  log.dim('  1. plugger add google      — add Google OAuth');
  log.dim('  2. plugger add github      — add GitHub OAuth');
  log.dim(`  Available providers: ${PROVIDER_NAMES.join(', ')}, custom`);
}

module.exports = initCommand;
