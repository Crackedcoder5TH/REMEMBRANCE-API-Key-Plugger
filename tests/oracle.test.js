'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

describe('Oracle Bridge', () => {
  let server;
  let port;

  before(async () => {
    // Mock Oracle server
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        const url = new URL(req.url, `http://localhost:${port}`);

        if (url.pathname === '/api/health') {
          res.end(JSON.stringify({ status: 'healthy' }));
        } else if (url.pathname === '/api/resolve') {
          const parsed = JSON.parse(body);
          res.end(JSON.stringify({ decision: 'pull', confidence: 0.85, description: parsed.description }));
        } else if (url.pathname === '/api/register') {
          const parsed = JSON.parse(body);
          res.end(JSON.stringify({ success: true, registered: true, name: parsed.name }));
        } else if (url.pathname === '/api/covenant') {
          res.end(JSON.stringify({ passes: true, score: 0.9 }));
        } else if (url.pathname === '/api/submit') {
          res.end(JSON.stringify({ success: true, accepted: true }));
        } else if (url.pathname === '/api/feedback') {
          const parsed = JSON.parse(body);
          res.end(JSON.stringify({ success: true, id: parsed.id }));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });
    });

    await new Promise(resolve => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });

    // Set env vars for the oracle bridge
    process.env.ORACLE_URL = `http://localhost:${port}`;
    process.env.ORACLE_API_KEY = 'test-key';
  });

  after(() => {
    server.close();
    delete process.env.ORACLE_URL;
    delete process.env.ORACLE_API_KEY;
  });

  it('isOracleAvailable() returns true when server is up', async () => {
    const { isOracleAvailable } = require('../src/oracle');
    const result = await isOracleAvailable();
    assert.strictEqual(result, true);
  });

  it('queryOracle() returns resolve result', async () => {
    const { queryOracle } = require('../src/oracle');
    const result = await queryOracle({
      description: 'test utility',
      tags: ['util'],
      language: 'javascript',
    });
    assert.ok(result);
    assert.strictEqual(result.decision, 'pull');
    assert.strictEqual(result.confidence, 0.85);
  });

  it('registerWithOracle() returns registration result', async () => {
    const { registerWithOracle } = require('../src/oracle');
    const result = await registerWithOracle({
      name: 'test-pattern',
      code: 'function x() {}',
      language: 'javascript',
      description: 'test',
      tags: ['test'],
    });
    assert.ok(result);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.name, 'test-pattern');
  });

  it('covenantCheck() returns check result', async () => {
    const { covenantCheck } = require('../src/oracle');
    const result = await covenantCheck('function x() {}', { language: 'javascript' });
    assert.ok(result);
    assert.strictEqual(result.passes, true);
  });

  it('submitToOracle() returns submission result', async () => {
    const { submitToOracle } = require('../src/oracle');
    const result = await submitToOracle('function x() {}', { language: 'javascript' });
    assert.ok(result);
    assert.strictEqual(result.success, true);
  });

  it('feedbackToOracle() returns feedback result', async () => {
    const { feedbackToOracle } = require('../src/oracle');
    const result = await feedbackToOracle('test-id', true);
    assert.ok(result);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.id, 'test-id');
  });

  it('graceful degradation — returns null when Oracle unreachable', async () => {
    const savedUrl = process.env.ORACLE_URL;
    process.env.ORACLE_URL = 'http://localhost:1'; // bad port

    // Clear module cache to pick up new env
    delete require.cache[require.resolve('../src/oracle')];
    const { queryOracle: qo, isOracleAvailable: ioa } = require('../src/oracle');

    const available = await ioa();
    assert.strictEqual(available, false);

    const result = await qo({ description: 'test', tags: [], language: 'js' });
    assert.strictEqual(result, null);

    // Restore
    process.env.ORACLE_URL = savedUrl;
    delete require.cache[require.resolve('../src/oracle')];
  });

  it('graceful degradation — returns null when no config', async () => {
    const savedUrl = process.env.ORACLE_URL;
    const savedKey = process.env.ORACLE_API_KEY;
    delete process.env.ORACLE_URL;
    delete process.env.ORACLE_API_KEY;

    delete require.cache[require.resolve('../src/oracle')];
    const { queryOracle: qo, isOracleAvailable: ioa } = require('../src/oracle');

    const available = await ioa();
    assert.strictEqual(available, false);

    const result = await qo({ description: 'test', tags: [], language: 'js' });
    assert.strictEqual(result, null);

    // Restore
    process.env.ORACLE_URL = savedUrl;
    process.env.ORACLE_API_KEY = savedKey;
    delete require.cache[require.resolve('../src/oracle')];
  });
});
