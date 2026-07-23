#!/usr/bin/env node

'use strict';

const { parseArgs, log } = require('../src/utils');
const initCmd = require('../src/commands/init');
const addCmd = require('../src/commands/add');
const listCmd = require('../src/commands/list');
const statusCmd = require('../src/commands/status');
const removeCmd = require('../src/commands/remove');
const apiKeyCmd = require('../src/commands/api-key');

const VERSION = '1.0.0';

const COMMANDS = {
  init: { handler: initCmd, desc: 'Detect project type, create .env, generate NextAuth route' },
  add: { handler: addCmd, desc: 'Add an OAuth provider (e.g. plugger add google)' },
  list: { handler: listCmd, desc: 'List configured OAuth providers' },
  status: { handler: statusCmd, desc: 'Show config completeness and file status' },
  remove: { handler: removeCmd, desc: 'Remove an OAuth provider' },
  'api-key': { handler: apiKeyCmd, desc: 'Manage API keys for services (oracle, stripe, openai, etc.)' },
};

function showHelp() {
  console.log(`
  \x1b[1mOAuth Plugger\x1b[0m v${VERSION}
  Auto-configure OAuth providers for your Next.js project.

  \x1b[1mUsage:\x1b[0m
    plugger <command> [options]

  \x1b[1mCommands:\x1b[0m`);

  for (const [name, cmd] of Object.entries(COMMANDS)) {
    console.log(`    ${name.padEnd(12)} ${cmd.desc}`);
  }

  console.log(`
  \x1b[1mExamples:\x1b[0m
    plugger init
    plugger add google
    plugger add google --client-id <id> --client-secret <secret>
    plugger add custom --name myoidc --client-id <id> --client-secret <secret> --issuer https://...
    plugger list
    plugger status
    plugger remove google

  \x1b[1mFlags:\x1b[0m
    --client-id       OAuth client ID
    --client-secret   OAuth client secret
    --issuer          OIDC issuer URL (for custom providers)
    --name            Custom provider name
    --dir             Target project directory (default: cwd)
    --help            Show help
    --version         Show version
`);
}

async function main() {
  const parsed = parseArgs(process.argv);
  const projectDir = parsed._flags.dir || process.cwd();

  if (parsed._flags.version) {
    console.log(VERSION);
    return;
  }

  if (!parsed._command || parsed._flags.help) {
    showHelp();
    return;
  }

  const cmd = COMMANDS[parsed._command];
  if (!cmd) {
    log.error(`Unknown command: "${parsed._command}"`);
    showHelp();
    process.exitCode = 1;
    return;
  }

  try {
    await cmd.handler(parsed, projectDir);
  } catch (err) {
    log.error(err.message);
    process.exitCode = 1;
  }
}

main();
