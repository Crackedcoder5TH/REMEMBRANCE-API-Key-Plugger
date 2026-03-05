'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse a .env file into an ordered list of entries.
 * Each entry is { type: 'comment'|'var'|'blank', key?, value?, raw }.
 */
function parseEnvFile(content) {
  const entries = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') {
      entries.push({ type: 'blank', raw: '' });
    } else if (trimmed.startsWith('#')) {
      entries.push({ type: 'comment', raw: line });
    } else {
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim();
        entries.push({ type: 'var', key, value, raw: line });
      } else {
        entries.push({ type: 'comment', raw: line }); // malformed — treat as comment
      }
    }
  }
  return entries;
}

/**
 * Serialize entries back to .env string.
 */
function serializeEnv(entries) {
  return entries.map(e => {
    if (e.type === 'blank') return '';
    if (e.type === 'comment') return e.raw;
    return `${e.key}=${e.value}`;
  }).join('\n');
}

/**
 * Read and parse a .env file. Returns { entries, vars } where vars is a key→value map.
 * Returns empty state if file doesn't exist.
 */
function readEnv(filePath) {
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return { entries: [], vars: {} };
  }
  const entries = parseEnvFile(content);
  const vars = {};
  for (const e of entries) {
    if (e.type === 'var') vars[e.key] = e.value;
  }
  return { entries, vars };
}

/**
 * Write entries to a .env file. Creates parent directories if needed.
 */
function writeEnv(filePath, entries) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, serializeEnv(entries) + '\n', 'utf8');
}

/**
 * Merge new variables into an existing .env file.
 * - Never overwrites existing keys that have values
 * - Adds new keys at the end with an optional section comment
 * @param {string} filePath
 * @param {Object} newVars - { KEY: value } map
 * @param {string} [sectionComment] - e.g. "# --- Google OAuth ---"
 * @returns {{ added: string[], skipped: string[] }}
 */
function mergeEnv(filePath, newVars, sectionComment) {
  const { entries, vars } = readEnv(filePath);
  const added = [];
  const skipped = [];
  const toAdd = [];

  for (const [key, value] of Object.entries(newVars)) {
    if (vars[key] && vars[key] !== '') {
      skipped.push(key);
    } else if (vars[key] === '') {
      // Key exists but empty — update in-place
      const entry = entries.find(e => e.type === 'var' && e.key === key);
      if (entry) entry.value = value;
      added.push(key);
    } else {
      toAdd.push({ key, value });
      added.push(key);
    }
  }

  if (toAdd.length > 0) {
    entries.push({ type: 'blank', raw: '' });
    if (sectionComment) {
      entries.push({ type: 'comment', raw: sectionComment });
    }
    for (const { key, value } of toAdd) {
      entries.push({ type: 'var', key, value, raw: `${key}=${value}` });
    }
  }

  writeEnv(filePath, entries);
  return { added, skipped };
}

/**
 * Remove variables from an env file by key.
 * @returns {string[]} Keys actually removed
 */
function removeEnvVars(filePath, keys) {
  const { entries } = readEnv(filePath);
  const keySet = new Set(keys);
  const removed = [];

  const filtered = entries.filter(e => {
    if (e.type === 'var' && keySet.has(e.key)) {
      removed.push(e.key);
      return false;
    }
    return true;
  });

  // Clean up consecutive blank lines
  const cleaned = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i].type === 'blank' && cleaned.length > 0 && cleaned[cleaned.length - 1].type === 'blank') {
      continue;
    }
    cleaned.push(filtered[i]);
  }

  writeEnv(filePath, cleaned);
  return removed;
}

/**
 * Ensure .env and .env.local are in .gitignore.
 */
function ensureGitignore(projectDir) {
  const gitignorePath = path.join(projectDir, '.gitignore');
  let content = '';
  try { content = fs.readFileSync(gitignorePath, 'utf8'); } catch { /* no .gitignore */ }

  const lines = content.split('\n');
  const toAdd = [];

  if (!lines.some(l => l.trim() === '.env')) toAdd.push('.env');
  if (!lines.some(l => l.trim() === '.env.local')) toAdd.push('.env.local');
  if (!lines.some(l => l.trim() === '.env*.local')) toAdd.push('.env*.local');

  if (toAdd.length > 0) {
    const section = '\n# OAuth credentials — never commit\n' + toAdd.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, content + section, 'utf8');
    return toAdd;
  }
  return [];
}

module.exports = { parseEnvFile, serializeEnv, readEnv, writeEnv, mergeEnv, removeEnvVars, ensureGitignore };
