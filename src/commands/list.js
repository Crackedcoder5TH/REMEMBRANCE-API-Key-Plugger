'use strict';

const path = require('path');
const { log, maskSecret, c, colorize } = require('../utils');
const { detectProject } = require('../detect');
const { readEnv } = require('../generators/env');
const { PROVIDERS, getProvider } = require('../providers/registry');

/**
 * plugger list — show configured OAuth providers.
 */
async function listCommand(parsed, projectDir) {
  const project = detectProject(projectDir);
  const envPath = project.envFile || path.join(projectDir, '.env.local');
  const { vars } = readEnv(envPath);

  console.log(`\n  ${colorize(c.bold, 'Configured OAuth Providers')}`);
  console.log(`  ${colorize(c.dim, `Source: ${path.basename(envPath)}`)}\n`);

  let found = 0;

  // Check built-in providers
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    const idVar = Object.keys(provider.envVars).find(v => v.endsWith('_CLIENT_ID'));
    const secretVar = Object.keys(provider.envVars).find(v => v.endsWith('_CLIENT_SECRET'));

    const hasId = vars[idVar] && vars[idVar] !== '';
    const hasSecret = vars[secretVar] && vars[secretVar] !== '';

    if (hasId || hasSecret) {
      found++;
      const status = (hasId && hasSecret)
        ? colorize(c.green, 'configured')
        : colorize(c.yellow, 'incomplete');

      console.log(`  ${colorize(c.bold, provider.name.padEnd(15))} ${status}`);

      if (hasId) {
        console.log(`    ${idVar}=${colorize(c.dim, vars[idVar])}`);
      }
      if (hasSecret) {
        console.log(`    ${secretVar}=${colorize(c.dim, maskSecret(vars[secretVar]))}`);
      }
    }
  }

  // Check for custom providers
  for (const [varName, value] of Object.entries(vars)) {
    if (varName.endsWith('_CLIENT_ID') && value) {
      const prefix = varName.replace(/_CLIENT_ID$/, '');
      const isBuiltIn = Object.values(PROVIDERS).some(p =>
        Object.keys(p.envVars).includes(varName)
      );
      if (!isBuiltIn && vars[`${prefix}_ISSUER`]) {
        found++;
        const hasSecret = vars[`${prefix}_CLIENT_SECRET`] && vars[`${prefix}_CLIENT_SECRET`] !== '';
        const status = hasSecret
          ? colorize(c.green, 'configured')
          : colorize(c.yellow, 'incomplete');

        console.log(`  ${colorize(c.bold, `Custom (${prefix.toLowerCase()})`.padEnd(15))} ${status}`);
        console.log(`    ${varName}=${colorize(c.dim, value)}`);
        console.log(`    ${prefix}_ISSUER=${colorize(c.dim, vars[`${prefix}_ISSUER`])}`);
      }
    }
  }

  if (found === 0) {
    log.dim('  No providers configured yet.');
    log.dim('  Run: plugger add <provider>');
  }

  console.log('');
}

module.exports = listCommand;
