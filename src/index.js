'use strict';

const { loadConfig } = require('./config');
const { createApp } = require('./app');

const config = loadConfig();
const { server, state } = createApp(config);

server.listen(config.port, () => {
  console.log(`${config.application} ${config.version} escutando na porta ${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} recebido, encerrando`);
  state.ready = false;
  // Aguarda o desvio de tráfego antes de fechar as conexões.
  setTimeout(() => {
    server.close(() => process.exit(0));
    server.closeIdleConnections();
  }, 5000).unref();
  setTimeout(() => process.exit(1), 20000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
