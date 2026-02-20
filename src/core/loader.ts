import defaultSlides from '../assets/slides.md?raw'

export const STORAGE_KEY = 'marko-pollo-slides'

export function saveToLocalStorage(markdown: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, markdown)
  } catch {
    // Storage full or unavailable
  }
}

export function loadFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export async function loadFromUrl(url: string): Promise<string> {
  // Only allow HTTPS URLs for security
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are supported')
  }
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
  return response.text()
}

export function getDefaultSlides(): string {
  return defaultSlides
}

export async function loadMarkdown(): Promise<string> {
  const stored = loadFromLocalStorage()
  if (stored) return stored

  const hash = window.location.hash
  const urlMatch = hash.match(/[?&]url=([^&]+)/)
  if (urlMatch) {
    try {
      return await loadFromUrl(decodeURIComponent(urlMatch[1]))
    } catch {
      // Fall through to default
    }
  }

  return getDefaultSlides()
}
