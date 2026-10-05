self.onmessage = (event) => {
  const { source, functionName, args } = event.data;
  try {
    if (typeof source !== 'string' || typeof functionName !== 'string') {
      throw new Error('source and functionName are required');
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(functionName)) {
      throw new Error('Invalid function name');
    }
    const impl = new Function(
      `${source}\nif (typeof ${functionName} !== "function") throw new Error("Define function ${functionName}");\nreturn ${functionName};`,
    )();
    self.postMessage({ ok: true, actual: impl(...args) });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
