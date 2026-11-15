export function redactDiagnostic(value) {
  let text = String(value ?? '');
  const secrets = [process.env.DATABASE_URL, process.env.DIRECT_URL, process.env.JWT_SECRET];
  for (const source of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    if (!source) continue;
    try {
      const url = new URL(source);
      for (const part of [url.username, url.password]) {
        if (part) {
          secrets.push(part);
          try { secrets.push(decodeURIComponent(part)); } catch {}
        }
      }
    } catch {}
  }
  for (const secret of secrets.filter(Boolean).sort((a,b)=>b.length-a.length)) text = text.split(secret).join('[REDACTED]');
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi,'[DATABASE_URL REDACTED]')
    .replace(/Bearer\s+[^\s"']+/gi,'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[JWT REDACTED]');
}

export function safeError(error) {
  return {
    name: String(error?.name || 'Error'),
    code: error?.code || error?.errorCode || null,
    message: redactDiagnostic(error?.message || error),
    ...(typeof error?.meta?.message === 'string' ? {databaseMessage: redactDiagnostic(error.meta.message)} : {})
  };
}
