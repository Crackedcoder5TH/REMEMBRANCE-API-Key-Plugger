'use strict';

/**
 * Oracle toolkit link.
 *
 * The Plugger reaches a few oracle-toolkit core modules at runtime —
 * chiefly the field-coupling helper, so key-manager operations can
 * contribute to the unified Remembrance field. They are optional:
 * without the toolkit the Plugger still manages keys; it just runs
 * without field coupling.
 *
 * This resolver makes the toolkit's *location* configurable so the
 * Plugger is self-hostable — it no longer assumes a fixed sibling
 * checkout. Resolution order (first hit wins):
 *
 *   1. $ORACLE_ROOT             — the ecosystem-standard env var
 *   2. $REMEMBRANCE_ORACLE_PATH — explicit alias
 *   3. vendor/remembrance-oracle-toolkit — bootstrap target
 *   4. node_modules/remembrance-oracle-toolkit — installed as a dep
 *   5. ../remembrance-oracle-toolkit — sibling checkout (dev layout)
 *
 * Modules are required by absolute file path. That is deliberate: the
 * toolkit's package `exports` map does not list these deep core
 * modules, so a bare-specifier import would be blocked — a file-path
 * require is not.
 */

const fs = require('fs');
const path = require('path');

function candidateRoots() {
  const roots = [];
  if (process.env.ORACLE_ROOT) roots.push(process.env.ORACLE_ROOT);
  if (process.env.REMEMBRANCE_ORACLE_PATH) roots.push(process.env.REMEMBRANCE_ORACLE_PATH);
  roots.push(path.join(__dirname, '..', 'vendor', 'remembrance-oracle-toolkit'));
  roots.push(path.join(__dirname, '..', 'node_modules', 'remembrance-oracle-toolkit'));
  roots.push(path.join(__dirname, '..', '..', 'remembrance-oracle-toolkit'));
  return roots;
}

let _root;

/**
 * Absolute path to the oracle toolkit root, or null if not found.
 * Resolved once and cached.
 *
 * @returns {string|null}
 */
function oracleRoot() {
  if (_root !== undefined) return _root;
  _root = null;
  for (const r of candidateRoots()) {
    try {
      if (r && fs.existsSync(path.join(r, 'src', 'core'))) {
        _root = path.resolve(r);
        break;
      }
    } catch (_e) { /* unreadable candidate — skip */ }
  }
  return _root;
}

/**
 * Require an oracle-toolkit module by its repo-relative path
 * (e.g. 'src/core/field-coupling'). Best-effort: returns null if the
 * toolkit is not found or the module fails to load.
 *
 * @param {string} relPath
 * @returns {*|null}
 */
function requireOracle(relPath) {
  const root = oracleRoot();
  if (!root) return null;
  try {
    return require(path.join(root, relPath));
  } catch (_e) {
    return null;
  }
}

/** Drop the cached root — for tests that flip the env vars. */
function _resetCache() { _root = undefined; }

module.exports = { oracleRoot, requireOracle, _resetCache };
