'use strict';

/**
 * Field bridge.
 *
 * One canonical place that resolves the field-coupling helper and
 * contributes a Plugger observation to the unified Remembrance field.
 * Every key-manager producer routes through here, so the engine-path
 * resolution and the best-effort guard live in exactly one spot.
 *
 * Best-effort by construction: a field failure never blocks or breaks
 * a key operation.
 *
 * SECURITY: `source` is a coarse operation label only (e.g.
 * 'apikey:issue'). Never pass secret key material — service names,
 * keys, or values — into the source; it may be recorded/logged by the
 * field engine.
 */

/**
 * Contribute one Plugger observation to the Remembrance field.
 *
 * @param {object} obs
 * @param {number} obs.coherence — alignment reading 0..1 (clamped)
 * @param {string} obs.source    — coarse operation label, e.g. 'apikey:issue'
 * @param {number} [obs.cost=1]  — work units
 */
function fieldContribute({ coherence, source, cost = 1 } = {}) {
  if (typeof coherence !== 'number' || !isFinite(coherence)) return;
  const clamped = Math.max(0, Math.min(1, coherence));
  try {
    const { requireOracle } = require('./oracle-link');
    const fc = requireOracle('src/core/field-coupling');
    if (fc && typeof fc.contribute === 'function') {
      fc.contribute({ cost, coherence: clamped, source });
    }
  } catch (_e) { /* never block a key operation on field-coupling */ }
}

module.exports = { fieldContribute };
