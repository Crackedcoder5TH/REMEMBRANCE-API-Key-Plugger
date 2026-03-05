'use strict';

const { log } = require('../utils');
const keyStore = require('../services/key-store');
const { isOracleAvailable } = require('../oracle');

/**
 * plugger api-key <action> [service] [--key <key>] [--url <url>]
 *
 * Actions:
 *   add <service>    — store an API key
 *   list             — list all stored keys
 *   remove <service> — remove a stored key
 *   rotate <service> — replace a key with a new one
 */
async function apiKeyCommand(parsed) {
  const action = parsed._sub;
  const service = parsed._positional[1] || null;
  const flags = parsed._flags;

  if (!action || action === 'help') {
    showUsage();
    return;
  }

  switch (action) {
    case 'add': {
      if (!service) {
        log.error('Usage: plugger api-key add <service> --key <key> [--url <url>]');
        process.exitCode = 1;
        return;
      }
      const key = flags.key;
      if (!key) {
        log.error('--key is required');
        process.exitCode = 1;
        return;
      }

      keyStore.saveKey(service, {
        key,
        url: flags.url || null,
        metadata: { addedAt: new Date().toISOString() },
      });

      log.success(`API key stored for "${service}"`);

      // For oracle service, validate the connection
      if (service === 'oracle' && flags.url) {
        process.env.ORACLE_URL = flags.url;
        process.env.ORACLE_API_KEY = key;
        const available = await isOracleAvailable();
        if (available) {
          log.success('Oracle connection verified');
        } else {
          log.warn('Oracle server not reachable — key saved but connection failed');
        }
      }
      break;
    }

    case 'list': {
      const keys = keyStore.listKeys();
      if (keys.length === 0) {
        log.dim('No API keys stored. Use: plugger api-key add <service> --key <key>');
        return;
      }
      console.log('');
      for (const entry of keys) {
        const url = entry.url ? ` (${entry.url})` : '';
        console.log(`  ${entry.service.padEnd(16)} ${entry.key}${url}`);
      }
      console.log('');
      break;
    }

    case 'remove': {
      if (!service) {
        log.error('Usage: plugger api-key remove <service>');
        process.exitCode = 1;
        return;
      }
      const removed = keyStore.removeKey(service);
      if (removed) {
        log.success(`API key removed for "${service}"`);
      } else {
        log.warn(`No API key found for "${service}"`);
      }
      break;
    }

    case 'rotate': {
      if (!service) {
        log.error('Usage: plugger api-key rotate <service> --key <new-key>');
        process.exitCode = 1;
        return;
      }
      const newKey = flags.key;
      if (!newKey) {
        log.error('--key is required for rotation');
        process.exitCode = 1;
        return;
      }
      const rotated = keyStore.rotateKey(service, newKey);
      if (rotated) {
        log.success(`API key rotated for "${service}"`);
      } else {
        log.warn(`No existing key found for "${service}". Use "add" first.`);
      }
      break;
    }

    default:
      log.error(`Unknown action: "${action}"`);
      showUsage();
      process.exitCode = 1;
  }
}

function showUsage() {
  console.log(`
  \x1b[1mAPI Key Management\x1b[0m

  \x1b[1mUsage:\x1b[0m
    plugger api-key add <service> --key <key> [--url <url>]
    plugger api-key list
    plugger api-key remove <service>
    plugger api-key rotate <service> --key <new-key>

  \x1b[1mExamples:\x1b[0m
    plugger api-key add oracle --key abc123 --url http://localhost:3333
    plugger api-key add stripe --key sk_test_xxx
    plugger api-key add openai --key sk-xxx
    plugger api-key list
    plugger api-key remove stripe
    plugger api-key rotate oracle --key new-key-here
`);
}

module.exports = apiKeyCommand;
