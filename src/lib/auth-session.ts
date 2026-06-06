const SESSION_COOKIE_NAME = 'admin_session';
const JWT_SECRET = 'crochett_secret_session_key_2026';

function simpleSign(text: string, secret: string): string {
  let hash = 0;
  const combined = text + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a signed session token (Pure JS, safe for Edge/Proxy).
 */
export function createSessionToken(): string {
  const payload = { role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 };
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = typeof btoa !== 'undefined' 
    ? btoa(payloadStr) 
    : Buffer.from(payloadStr).toString('base64');
  
  const signature = simpleSign(payloadBase64, JWT_SECRET);
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a session token (Pure JS, safe for Edge/Proxy).
 */
export function verifySessionToken(token: string): boolean {
  if (!token) return false;
  
  // If the token is a full cookie string like "admin_session=xxxx; path=/", extract just the token
  let actualToken = token;
  if (token.includes('=')) {
    const parts = token.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(`${SESSION_COOKIE_NAME}=`)) {
        actualToken = trimmed.substring(SESSION_COOKIE_NAME.length + 1);
        break;
      }
    }
  }

  const parts = actualToken.split('.');
  if (parts.length !== 2) return false;

  const payloadBase64 = parts[0];
  const signature = parts[1];

  const expectedSignature = simpleSign(payloadBase64, JWT_SECRET);
  if (signature !== expectedSignature) return false;

  try {
    const payloadStr = typeof atob !== 'undefined' 
      ? atob(payloadBase64) 
      : Buffer.from(payloadBase64, 'base64').toString('utf8');
    
    const payload = JSON.parse(payloadStr);
    if (payload.role === 'admin' && payload.exp > Date.now()) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
