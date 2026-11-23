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

// The backend is deployed but model access (Bedrock) is pending, so the public UI keeps
// AI explanations off. Owners can preview the real flow with ?ai-preview=1 (stored locally;
// ?ai-preview=0 clears it). Flip aiExplanationLive once real inference is verified.
export const aiExplanationLive = false;
export function aiExplanationEnabled(location = globalThis.location, storage = globalThis.localStorage) {
  if (aiExplanationLive) return true;
  try {
    const flag = new URLSearchParams(location?.search ?? '').get('ai-preview');
    if (flag === '1') storage?.setItem('ai-preview', '1');
    if (flag === '0') storage?.removeItem('ai-preview');
    return storage?.getItem('ai-preview') === '1';
  } catch { return false; }
}
