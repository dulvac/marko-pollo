import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getToken, setToken, clearToken, hasToken, TOKEN_TTL_MS } from './token-store'

describe('token-store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when no token stored', () => {
    expect(getToken()).toBeNull()
  })

  it('stores in sessionStorage as a plain string (no TTL envelope)', () => {
    setToken('ghp_test123', 'session')
    expect(sessionStorage.getItem('dekk-github-token')).toBe('ghp_test123')
    expect(localStorage.getItem('dekk-github-token')).toBeNull()
  })

  it('stores in localStorage with a JSON TTL envelope', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T00:00:00Z'))

    setToken('ghp_test123', 'local')

    const raw = localStorage.getItem('dekk-github-token')
    expect(raw).not.toBeNull()

    const parsed = JSON.parse(raw!)
    expect(parsed.token).toBe('ghp_test123')
    expect(parsed.savedAt).toBe(new Date('2026-02-27T00:00:00Z').getTime())
  })

  it('getToken checks sessionStorage first then localStorage', () => {
    setToken('ghp_local', 'local')
    expect(getToken()).toBe('ghp_local')

    sessionStorage.setItem('dekk-github-token', 'ghp_session')
    expect(getToken()).toBe('ghp_session')
  })

  it('clearToken removes from both storages', () => {
    setToken('ghp_test', 'local')
    setToken('ghp_test', 'session')
    clearToken()
    expect(getToken()).toBeNull()
    expect(hasToken()).toBe(false)
  })

  it('hasToken returns true when token exists', () => {
    setToken('ghp_test', 'session')
    expect(hasToken()).toBe(true)
  })

  describe('TTL expiry', () => {
    it('returns token when within TTL', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-27T00:00:00Z'))

      setToken('ghp_valid', 'local')

      // Advance 6 days (within 7-day TTL)
      vi.setSystemTime(new Date('2026-03-05T00:00:00Z'))

      expect(getToken()).toBe('ghp_valid')
    })

    it('returns null and clears token when TTL exceeded', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-27T00:00:00Z'))

      setToken('ghp_expired', 'local')

      // Advance 8 days (beyond 7-day TTL)
      vi.setSystemTime(new Date('2026-03-07T00:00:00Z'))

      expect(getToken()).toBeNull()
      // Token should be cleared from localStorage
      expect(localStorage.getItem('dekk-github-token')).toBeNull()
    })

    it('returns null exactly at TTL boundary (edge case)', () => {
      vi.useFakeTimers()
      const startTime = new Date('2026-02-27T00:00:00Z').getTime()
      vi.setSystemTime(startTime)

      setToken('ghp_boundary', 'local')

      // Advance exactly TOKEN_TTL_MS + 1ms (just past expiry)
      vi.setSystemTime(startTime + TOKEN_TTL_MS + 1)

      expect(getToken()).toBeNull()
    })

    it('returns token exactly at TTL boundary (not yet expired)', () => {
      vi.useFakeTimers()
      const startTime = new Date('2026-02-27T00:00:00Z').getTime()
      vi.setSystemTime(startTime)

      setToken('ghp_boundary', 'local')

      // Advance exactly TOKEN_TTL_MS (at boundary, not past)
      vi.setSystemTime(startTime + TOKEN_TTL_MS)

      expect(getToken()).toBe('ghp_boundary')
    })

    it('TOKEN_TTL_MS is 7 days', () => {
      expect(TOKEN_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000)
    })
  })

  describe('backward compatibility', () => {
    it('treats legacy bare-string tokens as expired and clears them', () => {
      // Simulate a token stored by the old code (plain string, no JSON envelope)
      localStorage.setItem('dekk-github-token', 'ghp_legacy_token')

      expect(getToken()).toBeNull()
      // Legacy token should be cleaned up
      expect(localStorage.getItem('dekk-github-token')).toBeNull()
    })

    it('treats corrupted JSON data as expired and clears it', () => {
      localStorage.setItem('dekk-github-token', '{"bad": "data"}')

      expect(getToken()).toBeNull()
      expect(localStorage.getItem('dekk-github-token')).toBeNull()
    })

    it('treats malformed JSON as expired and clears it', () => {
      localStorage.setItem('dekk-github-token', '{not-json')

      expect(getToken()).toBeNull()
      expect(localStorage.getItem('dekk-github-token')).toBeNull()
    })
  })

  describe('session tokens have no TTL', () => {
    it('session tokens are returned regardless of time elapsed', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

      setToken('ghp_session_token', 'session')

      // Advance 30 days — session tokens should still work
      vi.setSystemTime(new Date('2026-01-31T00:00:00Z'))

      expect(getToken()).toBe('ghp_session_token')
    })
  })

  it('hasToken returns false for expired localStorage token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T00:00:00Z'))

    setToken('ghp_test', 'local')

    // Advance 8 days
    vi.setSystemTime(new Date('2026-03-07T00:00:00Z'))

    expect(hasToken()).toBe(false)
  })
})
