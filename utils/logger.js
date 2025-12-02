// Consistent logging utility

(function(global) {
  'use strict';

  /**
   * Logger with module prefixes and log levels
   */
  class Logger {
    constructor(module = 'App') {
      this.module = module;
      this.enabled = true;
    }

    /**
     * Format log message with module prefix
     */
    _format(level, message, ...args) {
      const prefix = `[${this.module}]`;
      const levelPrefix = level ? `${level}:` : '';
      return [prefix, levelPrefix, message, ...args].filter(Boolean);
    }

    /**
     * Info level log
     */
    info(message, ...args) {
      if (!this.enabled) return;
      console.log(...this._format('', message, ...args));
    }

    /**
     * Success level log (info with emoji)
     */
    success(message, ...args) {
      if (!this.enabled) return;
      console.log(...this._format('✓', message, ...args));
    }

    /**
     * Warning level log
     */
    warn(message, ...args) {
      if (!this.enabled) return;
      console.warn(...this._format('⚠', message, ...args));
    }

    /**
     * Error level log
     */
    error(message, ...args) {
      if (!this.enabled) return;
      console.error(...this._format('✗', message, ...args));
    }

    /**
     * Debug level log (only in development)
     */
    debug(message, ...args) {
      if (!this.enabled) return;
      console.debug(...this._format('DEBUG', message, ...args));
    }

    /**
     * Create child logger with sub-module name
     */
    child(subModule) {
      return new Logger(`${this.module}:${subModule}`);
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
      this.enabled = enabled;
    }
  }

  /**
   * Create logger instance
   * @param {string} module - Module name
   * @returns {Logger} Logger instance
   */
  function createLogger(module) {
    return new Logger(module);
  }

  // Expose to global namespace
  global.Logger = Logger;
  global.createLogger = createLogger;

})(window);