export interface SlideMetadata {
  bg?: string
  class?: string
  layout?: string
  transition?: string
  [key: string]: string | undefined
}

export interface SlideData {
  metadata: SlideMetadata
  rawContent: string
}

export interface DeckMetadata {
  title?: string
  author?: string
  date?: string
  aspectRatio?: string
  [key: string]: string | undefined
}

export interface ParseResult {
  slides: SlideData[]
  deckMetadata: DeckMetadata
}

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype']

/**
 * Matches a single line that is a markdown thematic break:
 * 3+ of the same character (-, *, _), optionally with spaces between,
 * and nothing else on the line.
 */
export const THEMATIC_BREAK_LINE = /^\s*(?:(-\s*){3,}|(\*\s*){3,}|(_\s*){3,})\s*$/

const COMMENT_DIRECTIVE_PATTERN = /^<!--\s*(\w+)\s*:\s*(.+?)\s*-->$/

function extractFrontmatter(markdown: string): {
  deckMetadata: DeckMetadata
  body: string
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { deckMetadata: {}, body: markdown }

  const deckMetadata: DeckMetadata = {}
  const lines = match[1].split('\n')
  let hasValidKeyValue = false

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim()

      // Skip dangerous keys that could cause prototype pollution
      if (DANGEROUS_KEYS.includes(key)) {
        continue
      }

      deckMetadata[key] = value
      hasValidKeyValue = true
    }
  }

  // If no valid key:value pairs were found, treat the entire input as body
  if (!hasValidKeyValue) {
    return { deckMetadata: {}, body: markdown }
  }

  const body = markdown.slice(match[0].length)
  return { deckMetadata, body }
}

function extractSlideMetadata(content: string): {
  metadata: SlideMetadata
  rawContent: string
} {
  const metadata: SlideMetadata = {}
  const lines = content.split('\n')
  let contentStartLine = 0

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    // Skip empty lines at the beginning
    if (trimmed === '') {
      contentStartLine = i + 1
      continue
    }

    // Check for HTML comment directives
    const match = trimmed.match(COMMENT_DIRECTIVE_PATTERN)
    if (match) {
      if (!DANGEROUS_KEYS.includes(match[1])) {
        metadata[match[1]] = match[2]
      }
      contentStartLine = i + 1
      continue
    }

    // Non-empty, non-directive line -- stop scanning
    break
  }

  const rawContent = lines.slice(contentStartLine).join('\n').trim()
  return { metadata, rawContent: rawContent || content.trim() }
}

/**
 * Split the body text into raw slide strings by detecting thematic break lines.
 * A thematic break is a line containing only 3+ of -, *, or _ (with optional spaces).
 */
function splitSlides(body: string): string[] {
  const lines = body.split('\n')
  const chunks: string[] = []
  let currentLines: string[] = []

  for (const line of lines) {
    if (THEMATIC_BREAK_LINE.test(line)) {
      // Thematic break found -- finalize the current chunk
      chunks.push(currentLines.join('\n'))
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  // Push the remaining lines as the last chunk
  chunks.push(currentLines.join('\n'))

  return chunks
}

/**
 * Given a markdown string, find the character offset where the given slide
 * section (0-indexed) begins, after the frontmatter.
 */
export function findSlideOffset(text: string, slideIndex: number): number {
  // Skip frontmatter
  let bodyStart = 0
  const fmMatch = text.match(/^---\n[\s\S]*?\n---\n/)
  if (fmMatch) {
    bodyStart = fmMatch[0].length
  }

  if (slideIndex <= 0) return bodyStart

  const body = text.slice(bodyStart)
  const lines = body.split('\n')
  let slideCount = 0
  let offset = bodyStart

  for (const line of lines) {
    if (THEMATIC_BREAK_LINE.test(line)) {
      slideCount++
      if (slideCount === slideIndex) {
        // Return the position right after this separator line
        return offset + line.length + 1
      }
    }
    offset += line.length + 1
  }

  return bodyStart
}

/**
 * Given a markdown string and a cursor position, determine which slide
 * section (0-indexed) the cursor is in.
 */
export function getSlideIndexAtPosition(text: string, pos: number): number {
  // Skip frontmatter
  let bodyStart = 0
  const fmMatch = text.match(/^---\n[\s\S]*?\n---\n/)
  if (fmMatch) {
    bodyStart = fmMatch[0].length
  }

  if (pos < bodyStart) return 0

  const body = text.slice(bodyStart, pos)
  const lines = body.split('\n')
  let slideIndex = 0

  for (const line of lines) {
    if (THEMATIC_BREAK_LINE.test(line)) {
      slideIndex++
    }
  }

  return slideIndex
}

export function parseMarkdown(markdown: string): ParseResult {
  if (!markdown.trim()) {
    return { slides: [], deckMetadata: {} }
  }

  const { deckMetadata, body } = extractFrontmatter(markdown)

  if (!body.trim()) {
    return { slides: [], deckMetadata }
  }

  const rawSlides = splitSlides(body)

  const slides: SlideData[] = []
  for (const raw of rawSlides) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    const { metadata, rawContent } = extractSlideMetadata(trimmed)
    slides.push({ metadata, rawContent })
  }

  return { slides, deckMetadata }
}
