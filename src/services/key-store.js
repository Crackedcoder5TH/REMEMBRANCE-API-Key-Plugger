'use strict';

/**
 * Encrypted API key storage — stores keys for any service (Oracle, Stripe, OpenAI, etc.).
 * Uses node:crypto only (zero dependencies).
 *
 * Storage: ~/.plugger/keys.json (personal) or .plugger.json (project-level).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

const PLUGGER_DIR = path.join(os.homedir(), '.plugger');
const MASTER_KEY_PATH = path.join(PLUGGER_DIR, '.master');
const KEYS_PATH = path.join(PLUGGER_DIR, 'keys.json');

/** Ensure ~/.plugger directory exists */
function ensureDir() {
  fs.mkdirSync(PLUGGER_DIR, { recursive: true });
}

/** Get or create the master encryption key */
function getMasterKey() {
  // Allow override via env
  if (process.env.PLUGGER_MASTER_KEY) {
    return crypto.scryptSync(process.env.PLUGGER_MASTER_KEY, 'plugger-salt', KEY_LENGTH);
  }

  ensureDir();
  if (fs.existsSync(MASTER_KEY_PATH)) {
    const raw = fs.readFileSync(MASTER_KEY_PATH, 'utf8').trim();
    return crypto.scryptSync(raw, 'plugger-salt', KEY_LENGTH);
  }

  // Auto-generate master key
  const passphrase = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(MASTER_KEY_PATH, passphrase, { mode: 0o600 });
  return crypto.scryptSync(passphrase, 'plugger-salt', KEY_LENGTH);
}

/** Encrypt a string value */
function encrypt(plaintext) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

/** Decrypt a string value */
function decrypt(ciphertext) {
  const key = getMasterKey();
  const [ivHex, tagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** Load the keys store */
function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/** Save the keys store */
function saveStore(store) {
  ensureDir();
  fs.writeFileSync(KEYS_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
}

/** Save a key for a service */
function saveKey(service, { key, url, metadata } = {}) {
  const store = loadStore();
  store[service] = {
    key: encrypt(key),
    url: url || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return true;
}

/** Retrieve a key for a service (decrypted) */
function getKey(service) {
  const store = loadStore();
  const entry = store[service];
  if (!entry) return null;
  try {
    return {
      key: decrypt(entry.key),
      url: entry.url,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  } catch {
    return null; // decryption failed (master key changed?)
  }
}

/** List all stored services (keys are masked) */
function listKeys() {
  const store = loadStore();
  return Object.entries(store).map(([service, entry]) => {
    let masked = '***';
    try {
      const plain = decrypt(entry.key);
      masked = plain.length > 8
        ? plain.slice(0, 4) + '...' + plain.slice(-4)
        : '****';
    } catch { /* keep masked */ }
    return {
      service,
      key: masked,
      url: entry.url,
      createdAt: entry.createdAt,
    };
  });
}

/** Remove a service key */
function removeKey(service) {
  const store = loadStore();
  if (!store[service]) return false;
  delete store[service];
  saveStore(store);
  return true;
}

/** Replace a service key */
function rotateKey(service, newKey) {
  const store = loadStore();
  if (!store[service]) return false;
  store[service].key = encrypt(newKey);
  store[service].updatedAt = new Date().toISOString();
  saveStore(store);
  return true;
}

module.exports = { saveKey, getKey, listKeys, removeKey, rotateKey, encrypt, decrypt };
