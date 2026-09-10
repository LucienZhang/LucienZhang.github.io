import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../client/session.mjs';

function setup(fetchImpl, now = () => 1000000) {
  const map = new Map();
  const storage = { getItem: k => map.get(k), setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
  const session = createSession({ domain: 'https://login.example.test', clientId: 'site-client', redirectUri: 'https://site.example.test/', apiBase: 'https://api.example.test', storage, fetchImpl, now });
  return { session, map };
}
test('PKCE is S256, callback is bound to state and verifier, tokens are memory only', async () => {
  let calls = 0, cleared = false;
  const { session, map } = setup(async (url, options) => {
    calls++; assert.equal(cleared, true); assert.equal(url, 'https://login.example.test/oauth2/token');
    assert.equal(options.body.get('grant_type'), 'authorization_code');
    assert.equal(options.body.get('client_id'), 'site-client');
    assert.equal(options.body.has('client_secret'), false);
    return Response.json({ access_token: 'synthetic-access', token_type: 'Bearer', expires_in: 900, refresh_token: 'discarded', id_token: 'discarded' });
  });
  const url = new URL(await session.loginUrl());
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  const txn = JSON.parse([...map.values()][0]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txn.verifier));
  assert.equal(url.searchParams.get('code_challenge'), Buffer.from(digest).toString('base64url'));
  await session.callback(`https://site.example.test/?code=synthetic&state=${txn.state}`, () => { cleared = true; });
  assert.equal(await session.accessToken(), 'synthetic-access'); assert.equal(session.mode, 'user');
  assert.equal(map.size, 0); assert.equal(calls, 1);
});
test('wrong/replayed/expired state never exchanges a code', async () => {
  const { session } = setup(() => { throw new Error('No network allowed'); });
  await session.loginUrl();
  await assert.rejects(session.callback('https://site.example.test/?code=fake&state=wrong', () => {}), { code: 'AUTH_STATE_INVALID' });
  await assert.rejects(session.callback('https://site.example.test/?code=fake&state=wrong', () => {}));
  assert.equal(session.mode, 'expired');
});
test('signed-out, expired and cleared sessions cannot obtain credentials or make anonymous requests',async()=>{
  let clock=1000000,calls=0;
  const {session,map}=setup(async()=>{calls++;return Response.json({token_type:'Bearer',access_token:'synthetic-access',expires_in:900});},()=>clock);
  await assert.rejects(session.accessToken(),{code:'LOGIN_REQUIRED'});assert.equal(calls,0);
  await session.loginUrl();const txn=JSON.parse([...map.values()][0]);
  await session.callback(`https://site.example.test/?code=synthetic&state=${txn.state}`,()=>{});
  assert.equal(await session.accessToken(),'synthetic-access');
  clock+=900000;await assert.rejects(session.accessToken(),{code:'SESSION_EXPIRED'});
  session.clear();await assert.rejects(session.accessToken(),{code:'LOGIN_REQUIRED'});
  session.rejectCredential();await assert.rejects(session.accessToken(),{code:'SESSION_EXPIRED'});
  assert.equal(calls,1);
});

test('malformed or empty credential responses cannot establish a session', async () => {
  for (const response of [null, {}, {token_type: 1, access_token: 'x', expires_in: 900}, {token_type: 'Bearer', access_token: '', expires_in: 900}]) {
    const {session, map} = setup(async () => Response.json(response));
    await session.loginUrl();
    const txn = JSON.parse([...map.values()][0]);
    await assert.rejects(session.callback(`https://site.example.test/?code=synthetic&state=${txn.state}`, () => {}), {code: 'AUTH_EXCHANGE_FAILED'});
    assert.equal(session.mode, 'expired');
    await assert.rejects(session.accessToken(), {code: 'SESSION_EXPIRED'});
  }
});

test('static-host callback slash redirect preserves the exact OAuth redirect URI', async () => {
  const map = new Map();
  const storage = { getItem: k => map.get(k), setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) };
  const session = createSession({ domain: 'https://login.example.test', clientId: 'site-client', redirectUri: 'https://site.example.test/callback', storage,
    fetchImpl: async (url, options) => {
      assert.equal(options.body.get('redirect_uri'), 'https://site.example.test/callback');
      return Response.json({ token_type: 'Bearer', access_token: 'synthetic', expires_in: 900 });
    } });
  const login = new URL(await session.loginUrl());
  assert.equal(login.searchParams.get('redirect_uri'), 'https://site.example.test/callback');
  await session.callback(`https://site.example.test/callback/?code=fake&state=${login.searchParams.get('state')}`, () => {});
  assert.equal(session.mode, 'user');
});
