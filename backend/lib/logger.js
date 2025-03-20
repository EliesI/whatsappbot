// lib/logger.js
const EventEmitter = require('events');

class Logger extends EventEmitter {
  log(message) {
    console.log(message);
    this.emit('log', message);
  }
}

module.exports = new Logger();
