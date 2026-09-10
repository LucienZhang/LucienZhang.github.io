import { callbackUrl } from './site-config.mjs';
import { ApiError, requireThat } from '../lib/errors.mjs';

const key = 'ai-interpreter.pkce.v1';
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const random = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

// Only redirect transaction data uses sessionStorage. Access/ID/refresh tokens are never persisted.
export function createSession({ domain, clientId, redirectUri = callbackUrl, storage, fetchImpl = fetch, now = Date.now }) {
  let credentials, mode = 'signed-out', generation = 0;
  const config = () => {
    requireThat(/^https:\/\/[^/?#]+$/.test(domain) && (new URL(redirectUri).protocol === 'https:' || ['http://localhost:3000', 'http://localhost:5173'].includes(new URL(redirectUri).origin)) && !!clientId, 'AUTH_CONFIG_INVALID');
  };
  return {
    get mode() { return mode; },
    async loginUrl() {
      config();
      const verifier = random(), state = random();
      const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
      storage.setItem(key, JSON.stringify({ verifier, state, issuedAt: now(), redirectUri, clientId, domain }));
      const url = new URL('/oauth2/authorize', domain);
      url.search = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, scope: 'openid email', state, code_challenge_method: 'S256', code_challenge: challenge });
      return url.href;
    },
    async callback(href, removeQuery) {
      config();
      const url = new URL(href);
      if (!url.searchParams.has('code') && !url.searchParams.has('error')) return false;
      const saved = storage.getItem(key);
      storage.removeItem(key);
      const code = url.searchParams.get('code'), state = url.searchParams.get('state');
      removeQuery(); // Clear authorization code before any further request or UI rendering.
      credentials = undefined; mode = 'expired';
      const current = ++generation;
      let txn;
      try { txn = JSON.parse(saved); } catch { throw new ApiError('AUTH_STATE_INVALID', 401); }
      requireThat(txn && txn.state === state && txn.clientId === clientId && txn.domain === domain && txn.redirectUri === redirectUri && now() - txn.issuedAt >= 0 && now() - txn.issuedAt < 600000 && /^[A-Za-z0-9_-]{43}$/.test(txn.verifier), 'AUTH_STATE_INVALID', 401);
      requireThat(url.origin === new URL(redirectUri).origin && url.pathname.replace(/\/$/, '') === new URL(redirectUri).pathname.replace(/\/$/, '') && url.searchParams.getAll('code').length === 1 && url.searchParams.getAll('state').length === 1 && !url.searchParams.has('error') && code && code.length <= 2048, 'AUTH_STATE_INVALID', 401);
      const response = await fetchImpl(`${domain}/oauth2/token`, {
        method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirectUri, code, code_verifier: txn.verifier }),
      });
      requireThat(response.ok, 'AUTH_EXCHANGE_FAILED', 401);
      const token = await response.json();
      requireThat(typeof token?.token_type === 'string' && token.token_type.toLowerCase() === 'bearer' && typeof token.access_token === 'string' && token.access_token.length > 0 && token.access_token.length <= 16384 && Number.isFinite(token.expires_in) && token.expires_in > 0 && token.expires_in <= 86400, 'AUTH_EXCHANGE_FAILED', 401);
      requireThat(current === generation, 'SESSION_EXPIRED', 401);
      credentials = { token: token.access_token, expires: now() + token.expires_in * 1000 };
      mode = 'user';
      return true;
    },
    clear() { generation++; credentials = undefined; mode = 'signed-out'; storage.removeItem(key); },
    rejectCredential() { generation++; credentials = undefined; mode = 'expired'; },
    async accessToken(signal) {
      signal?.throwIfAborted();
      requireThat(mode !== 'expired', 'SESSION_EXPIRED', 401);
      requireThat(mode === 'user' && credentials, 'LOGIN_REQUIRED', 401);
      if (credentials && credentials.expires <= now() + 1000) {
        credentials = undefined;
        mode = 'expired';
        throw new ApiError('SESSION_EXPIRED', 401);
      }
      return credentials.token;
    },
  };
}
