let logs = [];

export function addLog(message, level = "info") {
  const entry = {
    message,
    level,
    time: new Date().toISOString()
  };

  logs.push(entry);

  // prevent memory leak
  if (logs.length > 200) logs.shift();
}

export function getLogs() {
  return logs;
}

// 🔥 intercept console globally
export function initLogger() {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn
  };

  console.log = (...args) => {
    addLog(args.join(" "), "info");
    original.log(...args);
  };

  console.error = (...args) => {
    addLog(args.join(" "), "error");
    original.error(...args);
  };

  console.warn = (...args) => {
    addLog(args.join(" "), "warn");
    original.warn(...args);
  };
}