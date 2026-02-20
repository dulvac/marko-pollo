import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  STORAGE_KEY,
} from './loader'

beforeEach(() => {
  localStorage.clear()
})

describe('loader', () => {
  it('saveToLocalStorage stores markdown', () => {
    saveToLocalStorage('# Test')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('# Test')
  })

  it('loadFromLocalStorage returns stored markdown', () => {
    localStorage.setItem(STORAGE_KEY, '# Stored')
    expect(loadFromLocalStorage()).toBe('# Stored')
  })

  it('loadFromLocalStorage returns null if empty', () => {
    expect(loadFromLocalStorage()).toBeNull()
  })
})
