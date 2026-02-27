const STORAGE_KEY = 'dekk-github-token'

/** Token TTL: 7 days in milliseconds */
export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface StoredTokenData {
  token: string
  savedAt: number
}

/**
 * Parse a localStorage value into StoredTokenData.
 * Returns null if the value is missing, malformed, or represents a legacy bare token
 * (which is treated as expired for security).
 */
function parseStoredToken(raw: string | null): StoredTokenData | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'token' in parsed &&
      'savedAt' in parsed &&
      typeof (parsed as StoredTokenData).token === 'string' &&
      typeof (parsed as StoredTokenData).savedAt === 'number'
    ) {
      return parsed as StoredTokenData
    }
  } catch {
    // Not JSON — legacy bare-string token; treat as expired
  }

  return null
}

/**
 * Check whether a stored token has exceeded the TTL.
 */
function isExpired(data: StoredTokenData): boolean {
  return Date.now() - data.savedAt > TOKEN_TTL_MS
}

export function getToken(): string | null {
  try {
    // Session tokens are ephemeral — no TTL needed
    const sessionToken = sessionStorage.getItem(STORAGE_KEY)
    if (sessionToken) return sessionToken

    // localStorage tokens carry a TTL envelope
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = parseStoredToken(raw)

    if (!data) {
      // Legacy bare-string token or corrupted data — clear it
      if (raw !== null) {
        localStorage.removeItem(STORAGE_KEY)
      }
      return null
    }

    if (isExpired(data)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return data.token
  } catch {
    return null
  }
}

export function setToken(token: string, storage: 'session' | 'local'): void {
  try {
    if (storage === 'session') {
      sessionStorage.setItem(STORAGE_KEY, token)
    } else {
      const envelope: StoredTokenData = { token, savedAt: Date.now() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    }
  } catch {
    // Storage may be disabled
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage may be disabled
  }
}

export function hasToken(): boolean {
  return getToken() !== null
}
