'use strict';

const { buildCustomProvider } = require('./registry');

/**
 * Validate custom OIDC provider inputs.
 * @param {string} name
 * @param {object} flags - { 'client-id', 'client-secret', 'issuer' }
 */
function validateCustomProvider(name, flags) {
  const errors = [];
  if (!name || name.length < 2) {
    errors.push('Custom provider name must be at least 2 characters');
  }
  if (name && /[^a-zA-Z0-9_-]/.test(name)) {
    errors.push('Provider name can only contain letters, numbers, hyphens, and underscores');
  }
  if (flags.issuer) {
    try {
      new URL(flags.issuer);
    } catch {
      errors.push('Issuer must be a valid URL (e.g. https://accounts.example.com)');
    }
  }
  return errors;
}

module.exports = { validateCustomProvider, buildCustomProvider };
