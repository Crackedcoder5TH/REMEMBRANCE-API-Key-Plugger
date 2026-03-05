'use strict';

const readline = require('readline');

/**
 * Ask a question and return the answer.
 * @param {string} question
 * @param {object} [options]
 * @param {boolean} [options.mask] - Mask input for secrets
 * @param {string} [options.defaultValue]
 * @returns {Promise<string>}
 */
function ask(question, options = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = options.defaultValue
      ? `${question} [${options.defaultValue}]: `
      : `${question}: `;

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || options.defaultValue || '');
    });
  });
}

/**
 * Ask for confirmation (y/n).
 * @param {string} question
 * @param {boolean} [defaultYes=true]
 * @returns {Promise<boolean>}
 */
function confirm(question, defaultYes = true) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${question} ${hint}: `, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

/**
 * Ask for a selection from a list.
 * @param {string} question
 * @param {string[]} choices
 * @returns {Promise<string>}
 */
function select(question, choices) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n${question}`);
    choices.forEach((c, i) => console.log(`  ${i + 1}) ${c}`));

    rl.question('\nSelect (number): ', (answer) => {
      rl.close();
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < choices.length) {
        resolve(choices[idx]);
      } else {
        resolve(choices[0]);
      }
    });
  });
}

/**
 * Get provider credentials either from CLI flags or interactive prompts.
 * @param {object} provider - Provider definition from registry
 * @param {object} flags - CLI flags (e.g. { 'client-id': '...', 'client-secret': '...' })
 * @param {boolean} isInteractive - Whether to use interactive prompts
 * @returns {Promise<Object>} - Map of env var name → value
 */
async function getCredentials(provider, flags, isInteractive) {
  const credentials = {};

  for (const [envVar, config] of Object.entries(provider.envVars)) {
    // Map env var names to common flag names
    let flagValue = null;
    if (envVar.endsWith('_CLIENT_ID')) flagValue = flags['client-id'];
    else if (envVar.endsWith('_CLIENT_SECRET')) flagValue = flags['client-secret'];
    else if (envVar.endsWith('_ISSUER')) flagValue = flags['issuer'];

    if (flagValue) {
      credentials[envVar] = flagValue;
    } else if (isInteractive) {
      const value = await ask(`  Enter ${config.label} for ${provider.name}`);
      credentials[envVar] = value;
    } else {
      throw new Error(`Missing --${envVar.toLowerCase().replace(/_/g, '-')} for ${provider.name}`);
    }
  }

  return credentials;
}

module.exports = { ask, confirm, select, getCredentials };
