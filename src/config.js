'use strict';

const os = require('node:os');

function loadConfig(env = process.env) {
  const port = Number(env.PORT ?? 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT inválida: ${env.PORT}`);
  }
  const version = env.APP_VERSION ?? 'dev';
  if (!/^[\w.+-]{1,64}$/.test(version)) {
    throw new Error('APP_VERSION inválida');
  }
  return {
    port,
    version,
    application: env.APP_NAME ?? 'canary-demo',
    environment: env.APP_ENVIRONMENT ?? 'test',
    hostname: env.HOSTNAME ?? os.hostname(),
  };
}

module.exports = { loadConfig };
