'use strict';

const path = require('path');
const { log, maskSecret } = require('../utils');
const { detectProject } = require('../detect');
const { mergeEnv } = require('../generators/env');
const { writeNextAuthRoute, detectConfiguredProviders } = require('../generators/nextauth');
const { getProvider, PROVIDER_NAMES } = require('../providers/registry');
const { validateCustomProvider } = require('../providers/custom');
const { getCredentials } = require('../prompt');

/**
 * plugger add <provider> — add an OAuth provider with credentials.
 */
async function addCommand(parsed, projectDir) {
  const providerName = parsed._sub;

  if (!providerName) {
    log.error('Please specify a provider: plugger add <provider>');
    log.dim(`Available: ${PROVIDER_NAMES.join(', ')}, custom`);
    process.exitCode = 1;
    return;
  }

  // Handle custom provider
  const isCustom = providerName === 'custom' || !PROVIDER_NAMES.includes(providerName.toLowerCase());
  let providerKey = providerName.toLowerCase();

  if (isCustom && providerName === 'custom') {
    // Explicit custom — need --name flag
    providerKey = parsed._flags.name;
    if (!providerKey) {
      log.error('Custom providers require --name flag: plugger add custom --name myoidc');
      process.exitCode = 1;
      return;
    }
    providerKey = providerKey.toLowerCase();
  }

  // Validate custom provider
  if (isCustom) {
    const errors = validateCustomProvider(providerKey, parsed._flags);
    if (errors.length > 0) {
      errors.forEach(e => log.error(e));
      process.exitCode = 1;
      return;
    }
  }

  const provider = getProvider(providerKey);
  const project = detectProject(projectDir);

  if (!project.packageJson) {
    log.error('No package.json found. Run `plugger init` first.');
    process.exitCode = 1;
    return;
  }

  const envPath = project.envFile || path.join(projectDir, '.env.local');

  log.info(`Adding ${provider.name}...`);

  if (provider.docsUrl) {
    log.dim(`  Credentials: ${provider.docsUrl}`);
  }

  // Get credentials from flags or interactive prompts
  const isInteractive = !parsed._flags['client-id'];
  const credentials = await getCredentials(provider, parsed._flags, isInteractive);

  // Merge into .env
  const sectionComment = `# --- ${provider.name} OAuth ---`;
  const { added, skipped } = mergeEnv(envPath, credentials, sectionComment);

  if (added.length > 0) {
    for (const key of added) {
      const val = credentials[key];
      const display = provider.envVars[key]?.secret ? maskSecret(val) : val;
      log.success(`  ${key}=${display}`);
    }
  }
  if (skipped.length > 0) {
    log.warn(`  Skipped (already set): ${skipped.join(', ')}`);
  }

  // Regenerate NextAuth route with all configured providers
  if (project.framework === 'nextjs') {
    const allProviders = detectConfiguredProviders(envPath);
    const routePath = writeNextAuthRoute(projectDir, allProviders, {
      routerType: project.routerType || 'app',
    });
    const relPath = path.relative(projectDir, routePath);
    log.success(`Updated ${relPath} (providers: ${allProviders.join(', ')})`);
  }

  console.log('');
  log.success(`${provider.name} configured!`);
}

module.exports = addCommand;
