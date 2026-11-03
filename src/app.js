'use strict';

const http = require('node:http');

function createApp(config) {
  const state = { ready: true };

  const server = http.createServer((req, res) => {
    const send = (status, body) => {
      const payload = JSON.stringify(body);
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-App-Version': config.version,
        'X-Pod-Name': config.hostname,
      });
      res.end(payload);
    };

    if (req.method !== 'GET') {
      return send(405, { error: 'method not allowed' });
    }

    const { pathname } = new URL(req.url, 'http://localhost');
    switch (pathname) {
      case '/':
        return send(200, {
          application: config.application,
          version: config.version,
          hostname: config.hostname,
          timestamp: new Date().toISOString(),
        });
      case '/version':
        return send(200, {
          application: config.application,
          version: config.version,
          hostname: config.hostname,
          environment: config.environment,
        });
      case '/health/live':
        return send(200, { status: 'live' });
      case '/health/ready':
        return state.ready ? send(200, { status: 'ready' }) : send(503, { status: 'shutting-down' });
      default:
        return send(404, { error: 'not found' });
    }
  });

  return { server, state };
}

module.exports = { createApp };
