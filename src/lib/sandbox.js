import vm from 'node:vm';

export const SANDBOX = {
  serverEval: false,
  isolate: 'browser',
  timeoutMs: 800,
  maxArgsJson: 20_000,
};

export function runFunction({ source, functionName, args, timeoutMs = SANDBOX.timeoutMs }) {
  if (typeof source !== 'string' || typeof functionName !== 'string') {
    throw new Error('source and functionName are required');
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(functionName)) {
    throw new Error('Invalid function name');
  }
  const encoded = JSON.stringify(args);
  if (encoded.length > SANDBOX.maxArgsJson) {
    throw new Error('Arguments too large');
  }
  const context = vm.createContext({ args, actual: undefined });
  const script = new vm.Script(
    `${source}\nif (typeof ${functionName} !== "function") throw new Error("Define function ${functionName}");\nactual = ${functionName}(...args);`,
  );
  try {
    script.runInContext(context, { timeout: timeoutMs });
    return { actual: context.actual, timedOut: false };
  } catch (error) {
    if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(error.message)) {
      return { actual: undefined, timedOut: true, error: `Timed out after ${timeoutMs}ms` };
    }
    throw error;
  }
}
