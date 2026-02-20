let saving = false

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
  return slug || 'presentation'
}

export function downloadMarkdown(
  markdown: string,
  title?: string,
  deckId?: string
): boolean {
  if (!markdown.trim()) return false

  const filename = `${deckId || (title ? slugify(title) : 'presentation')}.md`
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}

export async function saveMarkdownToFile(
  markdown: string,
  title?: string,
  deckId?: string
): Promise<boolean> {
  if (!('showSaveFilePicker' in window)) return false

  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${deckId || (title ? slugify(title) : 'presentation')}.md`,
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
    })
    const writable = await handle.createWritable()
    await writable.write(markdown)
    await writable.close()
    return true
  } catch (err: any) {
    if (err?.name === 'AbortError') return false // user cancelled
    return false
  }
}

export async function exportMarkdown(
  markdown: string,
  title?: string,
  deckId?: string
): Promise<boolean> {
  if (!markdown.trim() || saving) return false
  saving = true
  try {
    const saved = await saveMarkdownToFile(markdown, title, deckId)
    if (!saved) return downloadMarkdown(markdown, title, deckId)
    return true
  } finally {
    saving = false
  }
}
