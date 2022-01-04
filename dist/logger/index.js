"use strict";

var path = require('path');

var pino = require('pino');

var fs = require('fs');

var logDir = process.env.LOG_DIR;

if (logDir && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, {
    recursive: true
  });
}

var logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    pid: process.pid
  },
  timestamp: function timestamp() {
    return ",\"time\":\"".concat(new Date().toISOString(), "\"");
  }
}, path.join(logDir || '', 'idena-bridge.log'));
module.exports = logger;