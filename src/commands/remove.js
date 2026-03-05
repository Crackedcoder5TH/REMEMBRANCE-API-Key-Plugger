'use strict';

const path = require('path');
const { log } = require('../utils');
const { detectProject } = require('../detect');
const { removeEnvVars } = require('../generators/env');
const { writeNextAuthRoute, detectConfiguredProviders } = require('../generators/nextauth');
const { getProvider, PROVIDER_NAMES } = require('../providers/registry');

/**
 * plugger remove <provider> — remove an OAuth provider.
 */
async function removeCommand(parsed, projectDir) {
  const providerName = parsed._sub;

  if (!providerName) {
    log.error('Please specify a provider: plugger remove <provider>');
    log.dim(`Available: ${PROVIDER_NAMES.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const provider = getProvider(providerName.toLowerCase());
  const project = detectProject(projectDir);
  const envPath = project.envFile || path.join(projectDir, '.env.local');

  log.info(`Removing ${provider.name}...`);

  // Remove env vars
  const keysToRemove = Object.keys(provider.envVars);
  const removed = removeEnvVars(envPath, keysToRemove);

  if (removed.length > 0) {
    log.success(`Removed from ${path.basename(envPath)}: ${removed.join(', ')}`);
  } else {
    log.dim('No env vars found for this provider.');
  }

  // Regenerate NextAuth route
  if (project.framework === 'nextjs') {
    const remaining = detectConfiguredProviders(envPath);
    const routePath = writeNextAuthRoute(projectDir, remaining, {
      routerType: project.routerType || 'app',
    });
    const relPath = path.relative(projectDir, routePath);
    log.success(`Updated ${relPath} (providers: ${remaining.length > 0 ? remaining.join(', ') : 'none'})`);
  }

  console.log('');
  log.success(`${provider.name} removed.`);
}

module.exports = removeCommand;
