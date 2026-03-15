import { getDB } from './db';
import { saveDailyMeasurement, getDailyMeasurement } from './dataService';
import type { FitbitTokens, DailyMeasurement, SyncResult } from '../types';
import { roundToOneDecimal } from '../utils/validation';

// Fitbit OAuth 2.0 configuration — replace with your actual values
export const FITBIT_CLIENT_ID = '23V6MH';
export const FITBIT_REDIRECT_URI = 'https://toberpaul.github.io/fitness-app/callback';

const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_WEIGHT_URL = 'https://api.fitbit.com/1/user/-/body/log/weight/date';
const FITBIT_FAT_URL = 'https://api.fitbit.com/1/user/-/body/log/fat/date';

const ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

// Module-level cached connection state for synchronous isConnected()
let _connected = false;

/**
 * Generate a random 128-character code verifier for PKCE.
 * Uses crypto.getRandomValues for cryptographic randomness.
 * Characters drawn from [A-Za-z0-9-._~].
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(128);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => ALLOWED_CHARS[byte % ALLOWED_CHARS.length]).join('');
}

/**
 * Generate a PKCE code challenge from a code verifier.
 * Computes SHA-256 hash and base64url-encodes the result.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);

  // Base64 encode
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);

  // Convert to base64url: replace + with -, / with _, remove = padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Build the Fitbit OAuth 2.0 authorization URL with PKCE parameters.
 */
export function buildAuthorizationUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: FITBIT_CLIENT_ID,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'activity heartrate weight profile',
    redirect_uri: FITBIT_REDIRECT_URI,
    state,
  });

  return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
}

// --- Token persistence helpers ---

async function saveTokens(tokens: FitbitTokens): Promise<void> {
  const db = await getDB();
  await db.put('fitbitAuth', tokens, 'tokens');
  _connected = true;
}

async function getTokens(): Promise<FitbitTokens | undefined> {
  const db = await getDB();
  return db.get('fitbitAuth', 'tokens');
}

async function removeTokens(): Promise<void> {
  const db = await getDB();
  await db.delete('fitbitAuth', 'tokens');
  _connected = false;
}

/**
 * Initialize the cached connection state from IndexedDB.
 * Call this once at app startup.
 */
export async function initConnectionState(): Promise<void> {
  const tokens = await getTokens();
  _connected = tokens != null;
}

// --- OAuth flow ---

/**
 * Initiate the Fitbit OAuth 2.0 Authorization Code flow with PKCE.
 * Generates PKCE params, stores the verifier in sessionStorage, and redirects.
 */
export async function initiateAuth(): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = crypto.randomUUID();

  localStorage.setItem('fitbit_code_verifier', verifier);
  localStorage.setItem('fitbit_oauth_state', state);

  const url = buildAuthorizationUrl(challenge, state);
  window.location.href = url;
}

/**
 * Handle the OAuth callback: exchange the authorization code for tokens.
 */
export async function handleCallback(code: string, state: string): Promise<void> {
  const savedState = localStorage.getItem('fitbit_oauth_state');
  if (state !== savedState) {
    throw new Error('OAuth state mismatch — possible CSRF attack');
  }

  const verifier = localStorage.getItem('fitbit_code_verifier');
  if (!verifier) {
    throw new Error('Missing PKCE code verifier');
  }

  const body = new URLSearchParams({
    client_id: FITBIT_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: FITBIT_REDIRECT_URI,
  });

  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(FITBIT_CLIENT_ID + ':'),
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Token exchange failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();

  const tokens: FitbitTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user_id,
  };

  await saveTokens(tokens);

  // Clean up localStorage
  localStorage.removeItem('fitbit_code_verifier');
  localStorage.removeItem('fitbit_oauth_state');
}

/**
 * Refresh the access token using the stored refresh token.
 */
export async function refreshToken(): Promise<void> {
  const tokens = await getTokens();
  if (!tokens) {
    throw new Error('No Fitbit tokens found — please reconnect');
  }

  const body = new URLSearchParams({
    client_id: FITBIT_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
  });

  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(FITBIT_CLIENT_ID + ':'),
    },
    body: body.toString(),
  });

  if (!response.ok) {
    // Refresh failed — tokens are likely revoked
    await removeTokens();
    throw new Error('Token refresh failed — please reconnect Fitbit');
  }

  const data = await response.json();

  const newTokens: FitbitTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user_id,
  };

  await saveTokens(newTokens);
}

/**
 * Check if a Fitbit connection is active (synchronous, uses cached state).
 */
export function isConnected(): boolean {
  return _connected;
}

/**
 * Disconnect from Fitbit by removing all stored tokens.
 */
export async function disconnect(): Promise<void> {
  await removeTokens();
}

// --- Authenticated API helper ---

async function fitbitFetch(url: string, retry = true): Promise<Response> {
  let tokens = await getTokens();
  if (!tokens) {
    throw new Error('Not connected to Fitbit');
  }

  // Auto-refresh if token is expired
  if (Date.now() >= tokens.expiresAt) {
    await refreshToken();
    tokens = await getTokens();
    if (!tokens) throw new Error('Token refresh failed');
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  if (response.status === 401 && retry) {
    // Token might have been revoked server-side — try one refresh
    await refreshToken();
    return fitbitFetch(url, false);
  }

  if (response.status === 429) {
    // Rate limited — wait and retry once
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return fitbitFetch(url, false);
  }

  if (response.status >= 500) {
    throw new Error('Fitbit server is currently unavailable — please try again later');
  }

  if (!response.ok) {
    throw new Error(`Fitbit API error: ${response.status}`);
  }

  return response;
}

// --- Fitbit data types ---

interface FitbitWeightEntry {
  date: string;
  weight: number;
  fat?: number;
}

interface FitbitFatEntry {
  date: string;
  fat: number;
}

// --- Data transformation ---

/**
 * Transform a Fitbit weight log entry into a DailyMeasurement.
 */
export function transformFitbitEntry(
  weightEntry: FitbitWeightEntry,
  fatByDate: Map<string, number>
): DailyMeasurement {
  const fat = weightEntry.fat ?? fatByDate.get(weightEntry.date);
  return {
    date: weightEntry.date,
    weight: roundToOneDecimal(weightEntry.weight),
    bodyFat: fat != null ? roundToOneDecimal(fat) : undefined,
    source: 'fitbit',
    updatedAt: new Date().toISOString(),
  };
}

// --- Data sync ---

function formatDateForApi(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Sync the last 30 days of weight and body fat data from Fitbit.
 */
export async function syncData(): Promise<SyncResult> {
  const errors: string[] = [];
  let newEntries = 0;
  let updatedEntries = 0;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startStr = formatDateForApi(startDate);
  const endStr = formatDateForApi(endDate);

  // Fetch weight logs
  let weightEntries: FitbitWeightEntry[] = [];
  try {
    const weightRes = await fitbitFetch(`${FITBIT_WEIGHT_URL}/${startStr}/${endStr}.json`);
    const weightData = await weightRes.json();
    weightEntries = weightData.weight ?? [];
  } catch (err) {
    errors.push(`Weight sync failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Fetch body fat logs
  const fatByDate = new Map<string, number>();
  try {
    const fatRes = await fitbitFetch(`${FITBIT_FAT_URL}/${startStr}/${endStr}.json`);
    const fatData = await fatRes.json();
    const fatEntries: FitbitFatEntry[] = fatData.fat ?? [];
    for (const entry of fatEntries) {
      fatByDate.set(entry.date, entry.fat);
    }
  } catch (err) {
    errors.push(`Body fat sync failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Transform and save each entry
  for (const entry of weightEntries) {
    try {
      const measurement = transformFitbitEntry(entry, fatByDate);
      const existing = await getDailyMeasurement(measurement.date);

      await saveDailyMeasurement(measurement);

      if (existing) {
        updatedEntries++;
      } else {
        newEntries++;
      }
    } catch (err) {
      errors.push(
        `Failed to save entry for ${entry.date}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { newEntries, updatedEntries, errors };
}
