'use strict';

// Variáveis: SMOKE_URL, STABLE_VERSION, CANARY_VERSION, SMOKE_REQUESTS, SMOKE_MIN, SMOKE_MAX, SMOKE_HOST, SMOKE_INSECURE
const http = require('node:http');
const https = require('node:https');

const url = new URL(process.env.SMOKE_URL ?? '');
const stable = process.env.STABLE_VERSION;
const canary = process.env.CANARY_VERSION;
const total = Number(process.env.SMOKE_REQUESTS ?? 400);
const min = Number(process.env.SMOKE_MIN ?? 0.45);
const max = Number(process.env.SMOKE_MAX ?? 0.55);
const insecure = process.env.SMOKE_INSECURE === 'true';

if (!stable || !canary) {
  console.error('STABLE_VERSION e CANARY_VERSION são obrigatórias');
  process.exit(2);
}

const mod = url.protocol === 'https:' ? https : http;
// Sem keep-alive, cada requisição é uma nova conexão e passa pelo sorteio de peso.
const agent = new mod.Agent({ keepAlive: false });

function get() {
  return new Promise((resolve, reject) => {
    const headers = { Connection: 'close' };
    if (process.env.SMOKE_HOST) headers.Host = process.env.SMOKE_HOST;
    const req = mod.request(
      url,
      { agent, headers, rejectUnauthorized: !insecure, servername: process.env.SMOKE_HOST },
      (res) => {
        res.resume();
        res.on('end', () => resolve({ status: res.statusCode, version: res.headers['x-app-version'] }));
      },
    );
    req.setTimeout(5000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const counts = {};
  let errors = 0;
  for (let i = 0; i < total; i++) {
    try {
      const r = await get();
      if (r.status !== 200) errors++;
      else counts[r.version] = (counts[r.version] ?? 0) + 1;
    } catch {
      errors++;
    }
  }
  const ok = (counts[stable] ?? 0) + (counts[canary] ?? 0);
  const ratio = ok ? (counts[canary] ?? 0) / ok : 0;
  console.log(JSON.stringify({ total, errors, counts, canaryRatio: Number(ratio.toFixed(3)) }));
  if (errors > 0 || ratio < min || ratio > max) {
    console.error(
      `Falha: proporção canary ${ratio.toFixed(3)} fora de [${min}, ${max}] ou houve ${errors} erros`,
    );
    process.exit(1);
  }
})();
