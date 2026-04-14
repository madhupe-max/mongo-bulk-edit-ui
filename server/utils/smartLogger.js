import os from 'node:os';
import util from 'node:util';

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export class SmartLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'mongo-bulk-edit-ui-server';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.elasticsearchUrl = options.elasticsearchUrl || '';
    this.indexName = options.indexName || 'app-logs';
    this.apiKey = options.apiKey || '';
    this.username = options.username || '';
    this.password = options.password || '';
    this.captureConsole = toBoolean(options.captureConsole, true);
    this.enableHttpLogging = toBoolean(options.enableHttpLogging, true);
    this.flushIntervalMs = toNumber(options.flushIntervalMs, 2000);
    this.batchSize = toNumber(options.batchSize, 50);
    this.maxQueueSize = toNumber(options.maxQueueSize, 1000);
    this.requestTimeoutMs = toNumber(options.requestTimeoutMs, 4000);

    this.hostname = os.hostname();
    this.pid = process.pid;
    this.queue = [];
    this.flushTimer = null;
    this.flushInProgress = false;
    this.captureInstalled = false;
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };
  }

  installConsoleCapture() {
    if (!this.captureConsole || this.captureInstalled) {
      return;
    }

    const levels = ['log', 'info', 'warn', 'error', 'debug'];

    levels.forEach((level) => {
      const original = this.originalConsole[level];
      console[level] = (...args) => {
        original(...args);

        const { message, meta } = this.formatConsoleArgs(args);
        this.enqueue({
          level: level === 'log' ? 'info' : level,
          message,
          meta,
          source: 'console'
        });
      };
    });

    this.captureInstalled = true;
  }

  start() {
    if (!this.elasticsearchUrl || this.flushTimer) {
      return;
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.flushIntervalMs);

    if (typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }

    this.writeToStdout(`[SmartLogger] Streaming logs to ${this.elasticsearchUrl} (index: ${this.indexName})\n`);
  }

  async stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush(true);
  }

  info(message, meta) {
    this.enqueue({ level: 'info', message, meta, source: 'app' });
  }

  warn(message, meta) {
    this.enqueue({ level: 'warn', message, meta, source: 'app' });
  }

  error(message, meta) {
    this.enqueue({ level: 'error', message, meta, source: 'app' });
  }

  createHttpMiddleware() {
    if (!this.enableHttpLogging) {
      return (_req, _res, next) => next();
    }

    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        this.info('HTTP request completed', {
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          userAgent: req.get('user-agent') || '',
          ip: req.ip
        });
      });

      next();
    };
  }

  enqueue({ level, message, meta = {}, source = 'app' }) {
    const doc = {
      '@timestamp': new Date().toISOString(),
      level,
      message,
      source,
      service: this.serviceName,
      environment: this.environment,
      host: this.hostname,
      pid: this.pid,
      ...meta
    };

    this.queue.push(doc);

    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
      this.writeToStderr('[SmartLogger] Queue overflow. Oldest log entry dropped.\n');
    }

    if (this.queue.length >= this.batchSize) {
      this.flush().catch(() => {});
    }
  }

  async flush(force = false) {
    if (!this.elasticsearchUrl || this.flushInProgress || this.queue.length === 0) {
      return;
    }

    if (!force && this.queue.length < this.batchSize) {
      return;
    }

    this.flushInProgress = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.sendToElasticsearch(batch);
    } catch (error) {
      this.queue.unshift(...batch);
      this.writeToStderr(`[SmartLogger] Failed to ship logs: ${error.message}\n`);
    } finally {
      this.flushInProgress = false;
    }
  }

  async sendToElasticsearch(logs) {
    if (!logs.length) {
      return;
    }

    const ndjson = logs
      .map((log) => `${JSON.stringify({ index: { _index: this.indexName } })}\n${JSON.stringify(log)}`)
      .join('\n') + '\n';

    const headers = {
      'Content-Type': 'application/x-ndjson'
    };

    if (this.apiKey) {
      headers.Authorization = `ApiKey ${this.apiKey}`;
    } else if (this.username && this.password) {
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(`${this.elasticsearchUrl.replace(/\/$/, '')}/_bulk`, {
        method: 'POST',
        headers,
        body: ndjson,
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Elasticsearch bulk API failed (${response.status}): ${body}`);
      }

      const body = await response.json();
      if (body.errors) {
        this.writeToStderr('[SmartLogger] Elasticsearch accepted request with item errors.\n');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  formatConsoleArgs(args) {
    if (!args || args.length === 0) {
      return { message: '', meta: {} };
    }

    if (typeof args[0] === 'string') {
      const message = util.format(...args);
      return { message, meta: {} };
    }

    const [first, ...rest] = args;
    const message = util.inspect(first, { depth: 4, breakLength: 120, compact: true });
    const restText = rest.map((item) => util.inspect(item, { depth: 4, breakLength: 120, compact: true }));
    return {
      message: [message, ...restText].join(' '),
      meta: {}
    };
  }

  writeToStdout(text) {
    process.stdout.write(text);
  }

  writeToStderr(text) {
    process.stderr.write(text);
  }
}

export const createSmartLogger = (options = {}) => {
  const logger = new SmartLogger(options);
  logger.start();
  logger.installConsoleCapture();
  return logger;
};