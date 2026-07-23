'use strict';

/**
 * Oracle bridge — connects the Plugger to the Remembrance Oracle over HTTP.
 * Graceful degradation: if the Oracle is unreachable, all functions return null.
 * Zero dependencies — uses node:http / node:https only.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { requireOracle } = require('./oracle-link');

/** Read Oracle config from env vars or .plugger.json */
function getConfig() {
  const url = process.env.ORACLE_URL;
  const key = process.env.ORACLE_API_KEY;
  if (url) return { url, key };

  // Try .plugger.json in cwd
  try {
    const configPath = path.join(process.cwd(), '.plugger.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    if (config.oracle && config.oracle.url) {
      return { url: config.oracle.url, key: config.oracle.apiKey || null };
    }
  } catch { /* no config file */ }

  return null;
}

/** Minimal HTTP JSON request (zero dependencies) */
function request(method, fullUrl, body, apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(fullUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['Authorization'] = `ApiKey ${apiKey}`;

    let payload;
    if (body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = transport.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });

    if (payload) req.write(payload);
    req.end();
  });
}

/** Check if Oracle is reachable */
async function isOracleAvailable() {
  const config = getConfig();
  if (!config) return false;
  try {
    const result = await request('GET', `${config.url}/api/health`, undefined, config.key);
    return !!(result && result.status === 'healthy');
  } catch {
    return false;
  }
}

/**
 * Query the Oracle for a proven pattern (PULL/EVOLVE/GENERATE decision).
 * Returns the resolve result or null if unavailable.
 */
async function queryOracle({ description, tags, language }) {
  const config = getConfig();
  if (!config) return null;
  try {
    const result = await request('POST', `${config.url}/api/resolve`, {
      description,
      tags,
      language,
    }, config.key);
    return result;
  } catch {
    return null;
  }
}

/**
 * Register a pattern with the Oracle.
 * Returns the registration result or null if unavailable.
 */
async function registerWithOracle({ name, code, language, description, tags, testCode }) {
  const config = getConfig();
  if (!config) return null;
  try {
    const result = await request('POST', `${config.url}/api/register`, {
      name,
      code,
      language: language || 'javascript',
      description,
      tags,
      testCode,
    }, config.key);
    return result;
  } catch {
    return null;
  }
}

/**
 * Run a Covenant check on code via the Oracle.
 * Returns the check result or null if unavailable.
 */
async function covenantCheck(code, { description, tags, language } = {}) {
  const config = getConfig();
  if (!config) return null;
  try {
    const result = await request('POST', `${config.url}/api/covenant`, {
      code,
      description,
      tags,
      language,
    }, config.key);
    return result;
  } catch {
    return null;
  }
}

/**
 * Submit code for validation and storage.
 * Returns the submission result or null if unavailable.
 */
async function submitToOracle(code, { language, description, tags, testCode } = {}) {
  const config = getConfig();
  if (!config) return null;
  try {
    const result = await request('POST', `${config.url}/api/submit`, {
      code,
      language,
      description,
      tags,
      testCode,
    }, config.key);
    return result;
  } catch {
    return null;
  }
}

/**
 * Report feedback on a pulled pattern.
 */
async function feedbackToOracle(id, success) {
  const config = getConfig();
  if (!config) return null;
  try {
    return await request('POST', `${config.url}/api/feedback`, { id, success }, config.key);
  } catch {
    return null;
  }
}

/**
 * Try to load the oracle toolkit's coherency scorer locally
 * (src/unified/coherency) via oracle-link — the one canonical resolver
 * ($ORACLE_ROOT / vendor / node_modules / sibling clone). When
 * reachable, the Plugger scores patterns locally instead of
 * round-tripping over HTTP.
 *
 * Returns the computeCoherencyScore function, or null when unreachable.
 */
function localCoherencyScorer() {
  const m = requireOracle('src/unified/coherency');
  return (m && typeof m.computeCoherencyScore === 'function') ? m.computeCoherencyScore : null;
}

/**
 * Try to load the Remembrance lexicon locally
 * (src/core/remembrance-lexicon). Surfaced in `plugger status` so users
 * can see whether the canonical vocabulary is reachable.
 *
 * Returns the lexicon module, or null when unreachable.
 */
function localLexicon() {
  return requireOracle('src/core/remembrance-lexicon');
}

module.exports = {
  getConfig,
  isOracleAvailable,
  queryOracle,
  registerWithOracle,
  covenantCheck,
  submitToOracle,
  feedbackToOracle,
  localCoherencyScorer,
  localLexicon,
};
