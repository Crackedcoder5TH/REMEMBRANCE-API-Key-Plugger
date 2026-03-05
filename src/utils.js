'use strict';

const crypto = require('crypto');

// ── ANSI Colors ──────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(color, text) {
  return `${color}${text}${c.reset}`;
}

const log = {
  info: (msg) => console.log(colorize(c.blue, '[info]'), msg),
  success: (msg) => console.log(colorize(c.green, '[ok]'), msg),
  warn: (msg) => console.log(colorize(c.yellow, '[warn]'), msg),
  error: (msg) => console.error(colorize(c.red, '[error]'), msg),
  dim: (msg) => console.log(colorize(c.dim, msg)),
};

// ── Arg Parser ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2); // skip node + script
  const parsed = { _command: args[0] || null, _positional: [], _flags: {} };

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed._flags[key] = next;
        i++;
      } else {
        parsed._flags[key] = true;
      }
    } else {
      parsed._positional.push(args[i]);
    }
  }

  parsed._sub = parsed._positional[0] || null;
  return parsed;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskSecret(secret) {
  if (!secret || secret.length < 8) return '****';
  return secret.slice(0, 4) + '****' + secret.slice(-4);
}

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { c, colorize, log, parseArgs, maskSecret, generateSecret };
