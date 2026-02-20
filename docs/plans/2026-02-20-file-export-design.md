# File Export Feature — Design Spec

## Problem

Editor changes persist only to `localStorage`. If the user clears browser data, switches browsers, or wants to share their deck, the work is lost. There is no way to save a presentation as a `.md` file.

## Goal

Allow users to export their current presentation as a downloadable `.md` file from any view, and optionally save directly to disk via the File System Access API where supported.

## Requirements

### Must Have

1. **Download as .md** — A keyboard shortcut (`Ctrl+S` / `Cmd+S`) triggers a `.md` file download of the current `rawMarkdown` state. The browser's default save dialog is suppressed; instead the file downloads directly.

2. **Export button in editor** — A visible "Export" or "Save" button in the editor view's toolbar area that triggers the same download. The button exports `localMarkdown` (not `rawMarkdown` from the store) to avoid exporting stale content due to the 300ms debounce.

3. **Filename** — Derive from `deckMetadata.title` if available (slugified), otherwise default to `presentation.md`. Example: title "My Tech Talk" → `my-tech-talk.md`. Slugified filenames are truncated to 100 characters before appending `.md`. If the slug is empty after sanitization (e.g., all special chars or unicode-only), fall back to `presentation`.

4. **Export rawMarkdown as-is** — Since `deckMetadata` is always derived from `rawMarkdown`'s existing frontmatter via `extractFrontmatter()`, the exporter simply exports `rawMarkdown` verbatim. The frontmatter block is already included in the raw content when present. No frontmatter prepend/duplication logic needed.

5. **Re-entrant save guard** — The save action is guarded with a `saving` flag to prevent re-entrant calls. If a save is already in progress (e.g., user rapidly presses Ctrl+S), subsequent invocations are no-ops until the current save completes.

### Nice to Have

6. **File System Access API** — On browsers that support `window.showSaveFilePicker` (Chrome, Edge), use it for a native save-to-disk experience with a real file picker. Fall back to blob download on unsupported browsers (Firefox, Safari).

7. **Save indicator** — Brief visual feedback after save (e.g., "Saved" text that fades after 2 seconds).

### Dropped

- ~~**Dirty state indicator**~~ — Over-engineered for the current scope. Can be added later if needed.

## Non-Goals

- Auto-save to filesystem (too intrusive, requires permission on every page load)
- Cloud storage integration
- Multiple file format export (PDF, PPTX, HTML)

## Architecture

### New Files

- `src/core/exporter.ts` — Export logic: pure functions, no React dependency
- `src/core/exporter.test.ts` — Tests for filename derivation, blob creation, fallback logic

### Modified Files

- `src/App.tsx` — Add standalone `useEffect` for the Ctrl+S/Cmd+S global listener (separate from `createKeyboardHandler`)
- `src/views/EditorView.tsx` — Add export button that calls `exportMarkdown(localMarkdown, deckMetadata.title)` directly
- `src/styles/editor.module.css` — Style for the export button and save indicator
- `src/test-setup.ts` — Add `URL.createObjectURL` / `URL.revokeObjectURL` mocks for jsdom

### NOT Modified

- `src/core/keyboard.ts` — **Do NOT add `save` to `KeyboardActions`**. The existing handler bails out inside `.cm-editor` (line 24), so Ctrl+S would never fire during editing. The save shortcut uses a separate dedicated listener instead.

### Data Flow

```
Keyboard (any view):
  User presses Ctrl+S / Cmd+S
    → Standalone keydown listener in App.tsx (NOT createKeyboardHandler)
    → Calls exportMarkdown(state.rawMarkdown, state.deckMetadata.title)
    → exporter.ts creates Blob, triggers download (or showSaveFilePicker)

Export button (editor view only):
  User clicks Export button
    → EditorView calls exportMarkdown(localMarkdown, deckMetadata.title)
    → Same exporter flow — uses localMarkdown to avoid 300ms debounce staleness
```

### exporter.ts API

```typescript
/** Slugify a title for use as filename. Returns 'presentation' if result is empty. Truncates to 100 chars. */
export function slugify(title: string): string

/** Trigger a .md file download via blob URL. Blob type: 'text/markdown'. Returns true on success. */
export function downloadMarkdown(markdown: string, title?: string): boolean

/** Save via File System Access API (Chrome/Edge). Returns true if saved.
 *  Catches AbortError silently (user cancelled). Falls back to false on NotAllowedError. */
export async function saveMarkdownToFile(markdown: string, title?: string): Promise<boolean>

/** Smart save: tries File System Access first, falls back to download.
 *  Returns true if save succeeded. No-ops if markdown is empty/whitespace. */
export async function exportMarkdown(markdown: string, title?: string): Promise<boolean>
```

### Ctrl+S / Cmd+S Binding

The save shortcut is implemented as a **standalone `useEffect`** in `App.tsx`, separate from `createKeyboardHandler`:

```typescript
useEffect(() => {
  const handleSave = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      exportMarkdown(state.rawMarkdown, state.deckMetadata.title)
    }
  }
  window.addEventListener('keydown', handleSave)
  return () => window.removeEventListener('keydown', handleSave)
}, [state.rawMarkdown, state.deckMetadata.title])
```

This listener fires from ALL contexts — including inside `.cm-editor`, input fields, and textareas — because `Ctrl+S` is always "save presentation", never a text editing command. The existing `createKeyboardHandler` is unchanged and continues to suppress navigation keys inside the editor.

### Editor UI

A small button in the top-right corner of the editor pane:

```
┌─────────────────────┬──────────────────────────────┐
│ [Editor pane]  [⬇]  │ [Preview pane]               │
│                      │                              │
```

- Button uses brand styling: ghost button with `var(--mp-muted)` icon, `var(--mp-primary)` on hover
- Tooltip: "Export as .md (Ctrl+S)"
- After save: button text briefly shows "Saved" in `var(--mp-success)` for 2 seconds
- Button is disabled when `rawMarkdown` (or `localMarkdown`) is empty/whitespace

### Security Considerations

- No new external dependencies required
- **Blob MIME type:** Must be `text/markdown` (or `text/plain`). Must NEVER be `text/html` — that would allow XSS if the blob URL were opened in a browser tab
- **Blob URL revocation:** Use delayed revocation pattern — `setTimeout(() => URL.revokeObjectURL(url), 60_000)` — to ensure the browser has time to begin the download before the URL is revoked
- Filename is sanitized (only alphanumeric, hyphens, underscores; null bytes stripped; truncated to 100 chars)
- File System Access API requires user gesture (already satisfied by click/keydown)
- **CSP:** Add `blob:` to `default-src` or `connect-src` in the CSP meta tag in `index.html` — required for Firefox's stricter CSP enforcement of blob download links
- **File picker errors:** `saveMarkdownToFile` catches `AbortError` silently (user cancelled picker) and catches `NotAllowedError` by falling back to `downloadMarkdown`

### Testing

#### Test Setup (`src/test-setup.ts`)

Add jsdom mocks for browser download APIs:
```typescript
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalThis.URL.revokeObjectURL = vi.fn()
```

#### `exporter.test.ts` — Unit Tests

Slugify:
- `slugify('My Tech Talk')` → `'my-tech-talk'`
- `slugify('')` → `'presentation'`
- `slugify('!!!')` → `'presentation'` (all special chars)
- `slugify('日本語')` → `'presentation'` (all non-ASCII)
- `slugify('Über Special! @#$ Talk')` → `'ber-special-talk'` (or similar)
- `slugify('A'.repeat(200))` → truncated to 100 chars

Blob download:
- `downloadMarkdown` creates Blob with `type: 'text/markdown'`
- `downloadMarkdown` sets correct filename from title
- `downloadMarkdown` sets filename `presentation.md` when no title
- `downloadMarkdown` calls `URL.revokeObjectURL` after triggering download (delayed)
- `downloadMarkdown('')` handles empty markdown (no-op or returns false)

File System Access API:
- `saveMarkdownToFile` calls `showSaveFilePicker` and writes content
- `saveMarkdownToFile` returns `false` when user cancels (AbortError)
- `saveMarkdownToFile` returns `false` when `showSaveFilePicker` is undefined

Smart save:
- `exportMarkdown` uses `showSaveFilePicker` when available
- `exportMarkdown` falls back to `downloadMarkdown` when unavailable
- `exportMarkdown` falls back to `downloadMarkdown` when user cancels picker
- `exportMarkdown` no-ops on empty/whitespace markdown
- `exportMarkdown` is guarded against re-entrant calls

#### `App.test.tsx` / standalone test — Ctrl+S Tests

- `Ctrl+S` fires save from body (normal case)
- `Cmd+S` (metaKey) fires save from body
- `Ctrl+S` fires save even when target is inside `.cm-editor`
- `Ctrl+S` calls `preventDefault` on the event
- Bare `s` key does NOT trigger save (no modifier)

#### `EditorView.test.tsx` — Export Button Tests

- Export button renders in editor pane
- Click triggers `exportMarkdown` with `localMarkdown` (not `rawMarkdown`)
- Button is disabled when content is empty
- Save indicator appears after successful export
- Save indicator disappears after 2 seconds (use `vi.useFakeTimers()`)

#### E2E (`e2e/app.spec.ts`) — Download Flow

```typescript
test('Ctrl+S triggers .md file download', async ({ page }) => {
  await page.goto('/')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.keyboard.press('Control+s'),
  ])
  expect(download.suggestedFilename()).toMatch(/\.md$/)
})
```

- Test Ctrl+S from presentation view
- Test Ctrl+S from editor view (verifies the CodeMirror bypass works)
- Do NOT attempt to E2E test File System Access API (native OS file picker)
- Do NOT assert save indicator disappearance timing in E2E (flaky in CI)
