# Marko Pollo - Project Context

## What is this?

Marko Pollo is a static single-page web application for presenting markdown-authored slides with a branded dark cinematic visual identity. It targets developer talks at tech conferences, meetups, and internal engineering presentations.

## Key Documents

- **Design Document:** `docs/plans/2026-02-20-marko-pollo-design.md` - Full specification including requirements, architecture, visual identity, and component tree
- **Implementation Plan:** `docs/plans/2026-02-20-marko-pollo-implementation.md` - 16-task step-by-step build plan with TDD approach

## Technology Stack

- **Build:** Vite + React 18 + TypeScript
- **Markdown:** unified/remark/rehype pipeline with custom remark-slides plugin
- **Rendering:** react-markdown with custom component mappings
- **Code Highlighting:** Shiki with @shikijs/transformers (diff, focus, highlight)
- **Diagrams:** Mermaid.js v11 (client-side, lazy)
- **Editor:** CodeMirror 6 (@uiw/react-codemirror)
- **Styling:** CSS Modules + CSS custom properties (no runtime CSS-in-JS)
- **State:** React Context + useReducer (no external state library)
- **Testing:** Vitest + @testing-library/react

## Architecture

Three views: PresentationView (`/#/{n}`), EditorView (`/#/edit`), OverviewGrid (`/#/overview`). Hash-based routing. Markdown is split into slides on `---` separators by a custom remark plugin. State flows through React Context.

## Coding Standards

- TypeScript strict mode, no `any` types
- CSS Modules for scoped styling, CSS custom properties for brand tokens
- Small, focused component files (one component per file)
- Tests written before implementation (TDD)
- No external state management libraries
- Prefer named exports
- No light mode - dark theme is the brand identity

## Brand Colors

| Role | Hex |
|------|-----|
| Background | #0B0D17 |
| Surface | #141829 |
| Primary (purple) | #6C5CE7 |
| Secondary (teal) | #00CEC9 |
| Text | #E8E8F0 |
| Muted | #6B7394 |

## Team

This project uses a team of specialized agents. See `.claude/agents/` for their definitions:

- **Ada** (Architect) - Architecture, clean code, refactoring, crash prevention
- **Rex** (Frontend) - React components, CSS, modern patterns, UI implementation
- **Sage** (Security) - Vulnerability review, security scanning, input sanitization
- **Turing** (QA/Infra) - Testing, CI/CD, deployment, end-to-end verification
- **Eliza** (AI-native) - Claude Code instrumentation, agents, skills, hooks optimization

## Team Workflow

**Always delegate implementation tasks to the appropriate agent.** The team lead coordinates and dispatches work but should not write application code directly. Use the agents for their specialties:

- **Code changes** (features, bug fixes, refactoring): Dispatch to **Rex**
- **Architecture decisions and code reviews**: Dispatch to **Ada**
- **Security reviews and vulnerability fixes**: Dispatch to **Sage**
- **Testing, CI, infrastructure**: Dispatch to **Turing**
- **Agent/skill/hook configuration, AI journal updates**: Dispatch to **Eliza**

After reviewers identify issues, dispatch Rex (or the relevant specialist) to implement the fixes -- do not fix them yourself. Rex should also review code changes before they are committed to verify React patterns, component quality, and visual fidelity.
