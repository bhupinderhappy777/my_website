const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const ENV_LEVEL = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ? LEVELS.info : LEVELS.debug;

function timestamp() {
  return new Date().toISOString();
}

function format(level, msg, meta) {
  const base = { time: timestamp(), level, message: msg };
  if (meta !== undefined) {
    try {
      base.meta = meta;
    } catch {
      base.meta = String(meta);
    }
  }
  return base;
}

function shouldLog(level) {
  return LEVELS[level] >= ENV_LEVEL;
}

function prettyOutput(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

const logger = {
  debug(msg, meta) {
    if (!shouldLog('debug')) return;
    console.debug('[debug]', timestamp(), msg, meta ? '\n' + prettyOutput(meta) : '');
  },
  info(msg, meta) {
    if (!shouldLog('info')) return;
    console.info('[info]', timestamp(), msg, meta ? '\n' + prettyOutput(meta) : '');
  },
  warn(msg, meta) {
    if (!shouldLog('warn')) return;
    console.warn('[warn]', timestamp(), msg, meta ? '\n' + prettyOutput(meta) : '');
  },
  error(msg, meta) {
    if (!shouldLog('error')) return;
    console.error('[error]', timestamp(), msg, meta ? '\n' + prettyOutput(meta) : '');
  },
};

export default logger;
