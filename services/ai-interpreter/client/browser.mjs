import { createSession } from './session.mjs';
import { createTransport } from './transport.mjs';
import { authUrls, cognitoDomain, cognitoClientId, apiBase } from './site-config.mjs';

const returnKey = 'ai-interpreter.return.v1';
let client;
export function getBrowserClient() {
  if (client) return client;
  const urls = authUrls(location.origin);
  const session = createSession({ domain: cognitoDomain, clientId: cognitoClientId, redirectUri: urls.callbackUrl, storage: sessionStorage });
  client = {
    session,
    configured: Boolean(apiBase),
    transport: createTransport({ apiBase, session }),
    async login(input, locale) {
      sessionStorage.setItem(returnKey, JSON.stringify({ input, locale }));
      location.assign(await session.loginUrl());
    },
    logout(locale) {
      sessionStorage.setItem(returnKey, JSON.stringify({ locale }));
      session.clear();
      const url = new URL('/logout', cognitoDomain);
      url.search = new URLSearchParams({ client_id: cognitoClientId, logout_uri: urls.logoutUrl });
      location.assign(url.href);
    },
    returnLocale() {
      try { return JSON.parse(sessionStorage.getItem(returnKey))?.locale; } catch { return undefined; }
    },
    takeReturn() {
      let saved;
      try { saved = JSON.parse(sessionStorage.getItem(returnKey)); } catch { /* Missing/invalid saved state uses homepage defaults. */ }
      sessionStorage.removeItem(returnKey);
      return saved && typeof saved === 'object' ? saved : {};
    },
  };
  return client;
}
