import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
  FITBIT_CLIENT_ID,
  FITBIT_REDIRECT_URI,
} from './fitbitService';

describe('generateCodeVerifier', () => {
  it('returns a 128-character string', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(128);
  });

  it('only contains allowed characters [A-Za-z0-9-._~]', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it('generates different values on successive calls', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe('generateCodeChallenge', () => {
  it('returns a non-empty base64url string', async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge.length).toBeGreaterThan(0);
    // base64url: only [A-Za-z0-9_-], no + / =
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces a 43-character challenge for SHA-256 (256 bits = 32 bytes → 43 base64url chars)', async () => {
    const challenge = await generateCodeChallenge('test-verifier');
    expect(challenge).toHaveLength(43);
  });

  it('produces deterministic output for the same input', async () => {
    const verifier = 'deterministic-test-verifier';
    const a = await generateCodeChallenge(verifier);
    const b = await generateCodeChallenge(verifier);
    expect(a).toBe(b);
  });

  it('produces different output for different inputs', async () => {
    const a = await generateCodeChallenge('verifier-one');
    const b = await generateCodeChallenge('verifier-two');
    expect(a).not.toBe(b);
  });
});

describe('buildAuthorizationUrl', () => {
  const challenge = 'test-code-challenge';
  const state = 'random-state-value';

  it('starts with the Fitbit authorization base URL', () => {
    const url = buildAuthorizationUrl(challenge, state);
    expect(url).toMatch(/^https:\/\/www\.fitbit\.com\/oauth2\/authorize\?/);
  });

  it('includes response_type=code', () => {
    const url = new URL(buildAuthorizationUrl(challenge, state));
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('includes the client_id', () => {
    const url = new URL(buildAuthorizationUrl(challenge, state));
    expect(url.searchParams.get('client_id')).toBe(FITBIT_CLIENT_ID);
  });

  it('includes the code_challenge and method S256', () => {
    const url = new URL(buildAuthorizationUrl(challenge, state));
    expect(url.searchParams.get('code_challenge')).toBe(challenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('includes the required scopes', () => {
    const url = new URL(buildAuthorizationUrl(challenge, state));
    const scope = url.searchParams.get('scope')!;
    expect(scope).toContain('activity');
    expect(scope).toContain('heartrate');
    expect(scope).toContain('weight');
    expect(scope).toContain('profile');
  });

  it('includes redirect_uri', () => {
    const url = new URL(buildAuthorizationUrl(challenge, state));
    expect(url.searchParams.get('redirect_uri')).toBe(FITBIT_REDIRECT_URI);
  });

  it('includes the state parameter', () => {
    const url = new URL(buildAuthorizationUrl(challenge, state));
    expect(url.searchParams.get('state')).toBe(state);
  });
});
