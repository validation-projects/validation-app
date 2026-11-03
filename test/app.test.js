'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config');

async function withServer(env, fn) {
  const config = loadConfig({ PORT: '8080', HOSTNAME: 'pod-x', ...env });
  const { server, state } = createApp(config);
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base, state);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

test('/version retorna versão e cabeçalhos', async () => {
  await withServer({ APP_VERSION: '1.2.3' }, async (base) => {
    const res = await fetch(`${base}/version`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-app-version'), '1.2.3');
    const body = await res.json();
    assert.strictEqual(body.version, '1.2.3');
    assert.strictEqual(body.hostname, 'pod-x');
    assert.strictEqual(body.application, 'canary-demo');
  });
});

test('/ inclui timestamp', async () => {
  await withServer({}, async (base) => {
    const body = await (await fetch(`${base}/`)).json();
    assert.ok(body.timestamp);
  });
});

test('health live e ready', async () => {
  await withServer({}, async (base, state) => {
    assert.strictEqual((await fetch(`${base}/health/live`)).status, 200);
    assert.strictEqual((await fetch(`${base}/health/ready`)).status, 200);
    state.ready = false;
    assert.strictEqual((await fetch(`${base}/health/ready`)).status, 503);
  });
});

test('rota inexistente retorna 404', async () => {
  await withServer({}, async (base) => {
    assert.strictEqual((await fetch(`${base}/nada`)).status, 404);
  });
});

test('configuração inválida é rejeitada', () => {
  assert.throws(() => loadConfig({ PORT: 'abc' }));
  assert.throws(() => loadConfig({ APP_VERSION: 'a b;c' }));
});
