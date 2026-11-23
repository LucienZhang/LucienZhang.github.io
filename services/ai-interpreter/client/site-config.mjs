// Keep these public URLs aligned with the dev Cognito client in aws_infrastructure.
export const siteOrigin = 'https://ziliang.red';
export const supportedSiteOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://lucienzhang.github.io",
  "https://ziliang.red",
  "https://www.ziliang.red"
];
export function authUrls(origin = siteOrigin) {
  if (!supportedSiteOrigins.includes(origin)) throw new Error('Unsupported site origin');
  return { callbackUrl: `${origin}/callback`, logoutUrl: `${origin}/logout` };
}
export const { callbackUrl, logoutUrl } = authUrls();

// Public application configuration; no credentials or client secret.
export const cognitoDomain = 'https://bitinker-dev.auth.ap-northeast-1.amazoncognito.com';
export const cognitoClientId = '44vib0bmejkp82ghvfsvffiio1';
export const apiBase = 'https://api.ziliang.ninja'; // /v1 is added by the transport and mapped by API Gateway.

// Live since 2026-11-23 (Claude API via workload identity federation, verified end to end).
// Set to false to hide AI explanations publicly; ?ai-preview=1 then still previews the flow
// for the current browser (?ai-preview=0 clears it).
export const aiExplanationLive = true;
export function aiExplanationEnabled(location = globalThis.location, storage = globalThis.localStorage) {
  if (aiExplanationLive) return true;
  try {
    const flag = new URLSearchParams(location?.search ?? '').get('ai-preview');
    if (flag === '1') storage?.setItem('ai-preview', '1');
    if (flag === '0') storage?.removeItem('ai-preview');
    return storage?.getItem('ai-preview') === '1';
  } catch { return false; }
}
