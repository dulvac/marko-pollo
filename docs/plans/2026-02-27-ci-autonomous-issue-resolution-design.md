# CI-Driven Autonomous Issue Resolution

**Status:** Milestone Plan (no implementation yet)
**Date:** 2026-02-27
**Author:** AI-assisted (Claude Code)

## Executive Summary

Evolve the current manual `/issue-swarm` workflow into a fully automated CI pipeline. When a GitHub issue is created or labeled, a GitHub Actions workflow automatically spins up Claude Code, which follows the project's agent team patterns to implement, review, and open a PR — all without human intervention.

**Current state:** `/issue-swarm` is invoked manually in the terminal. A human runs the command, Claude dispatches agents in worktrees, and PRs are created.

**Target state:** GitHub Issues trigger Claude Code automatically via GitHub Actions. The same implement-then-review pattern runs in CI. Humans review and merge the resulting PRs.

## Architecture Overview

```
                    ┌──────────────┐
                    │ GitHub Issue  │
                    │  (opened or  │
                    │   labeled)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  GitHub      │
                    │  Actions     │
                    │  Workflow    │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │  anthropics/            │
              │  claude-code-action@v1  │
              │                         │
              │  Reads: CLAUDE.md       │
              │  Reads: .claude/agents/ │
              │  Uses: gh CLI           │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Implementation Phase   │
              │  (branch, code, test,   │
              │   commit, push, PR)     │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Review Phase           │
              │  (architecture, security│
              │   frontend, QA checks)  │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  PR Ready for Human     │
              │  Review & Merge         │
              └─────────────────────────┘
```

## Technology Choice

**`anthropics/claude-code-action@v1`** — the official GitHub Action from Anthropic. This runs the full Claude Code CLI inside GitHub Actions with native GitHub integration (issue reading, PR creation, commit pushing). It already supports:

- Triggering on issue events (`issues: [opened, labeled]`)
- Reading `CLAUDE.md` for project standards
- Full access to `.claude/agents/` definitions and `.claude/commands/`
- Creating branches, committing code, opening PRs
- Custom prompts via the `prompt` parameter
- CLI argument passthrough via `claude_args`

No custom CLI installation or wrapper scripts needed.

---

## Milestone Phases

### Phase 1: Foundation — `@claude` Mention Support

**Goal:** Get Claude Code running in GitHub Actions with basic interactive capabilities.

**Deliverables:**
1. Install the [Claude GitHub App](https://github.com/apps/claude) on `dulvac/dekk`
2. Add `ANTHROPIC_API_KEY` as a repository secret
3. Create `.github/workflows/claude.yml`:
   - Triggers: `issue_comment`, `pull_request_review_comment`, `issues` (opened)
   - Filter: only runs when comment/body contains `@claude`
   - Action: `anthropics/claude-code-action@v1` with API key
   - Permissions: `contents: write`, `pull-requests: write`, `issues: write`, `id-token: write`
4. Test: Comment `@claude what files handle routing?` on an issue — verify Claude responds

**Workflow (simplified):**
```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Acceptance criteria:**
- Claude responds to `@claude` mentions in issues and PRs
- Claude can read the codebase and answer questions
- Claude follows `CLAUDE.md` guidelines in responses
- No unintended triggers or runaway workflows

---

### Phase 2: Auto-Implementation — Label-Triggered Issue Resolution

**Goal:** When a specific label is added to an issue, Claude automatically implements a fix and opens a PR.

**Deliverables:**
1. Create an `auto-fix` label in the repository
2. Add a new workflow `.github/workflows/claude-auto-fix.yml`:
   - Triggers: `issues: [labeled]`
   - Filter: only runs when the label `auto-fix` is added
   - Custom prompt instructs Claude to implement the fix following project standards
3. Custom prompt template that includes:
   - Read `CLAUDE.md` for project standards
   - Branch naming convention from labels (`bug` → `fix/`, `enhancement` → `feature/`)
   - TDD requirement, conventional commits, CSS Modules
   - PR body template with `Closes #N`
4. Configure `claude_args` with `--max-turns 30` to allow complex implementations
5. Test: Create an issue, add `auto-fix` label, verify PR is created

**Workflow:**
```yaml
name: Claude Auto-Fix

on:
  issues:
    types: [labeled]

jobs:
  auto-fix:
    if: github.event.label.name == 'auto-fix'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are an implementation agent for GitHub issue #${{ github.event.issue.number }}.

            ## Issue
            **Title:** ${{ github.event.issue.title }}
            **Body:** ${{ github.event.issue.body }}
            **Labels:** ${{ join(github.event.issue.labels.*.name, ', ') }}

            ## Instructions
            1. Read CLAUDE.md for project coding standards and brand identity
            2. Determine the branch prefix from labels:
               - bug → fix/
               - documentation → docs/
               - otherwise → feature/
            3. Create branch: {prefix}${{ github.event.issue.number }}-{slug-from-title}
            4. Implement the fix/feature following TDD, TypeScript strict mode, CSS Modules
            5. Run tests: npm run test:run
            6. Run build: npm run build
            7. Commit with conventional commit message
            8. Push and create a PR with body including "Closes #${{ github.event.issue.number }}"

            Do NOT modify files unrelated to this issue.
          claude_args: |
            --max-turns 30
            --model claude-sonnet-4-6
```

**Acceptance criteria:**
- Adding `auto-fix` label triggers Claude automatically
- Claude creates a correctly-named branch
- Implementation follows project standards (TDD, conventional commits)
- Tests and build pass before PR creation
- PR body includes `Closes #N` for auto-close on merge
- No interference with existing CI workflow

---

### Phase 3: Automated PR Review — Multi-Perspective Quality Gate

**Goal:** When Claude opens a PR, a second workflow reviews it from all five agent perspectives (Ada, Rex, Sage, Turing, Eliza).

**Deliverables:**
1. New workflow `.github/workflows/claude-review.yml`:
   - Triggers: `pull_request: [opened, synchronize]`
   - Filter: only runs on PRs created by Claude (check author or label)
2. Review prompt that covers all five agent perspectives:
   - **Ada:** Architecture, component boundaries, type safety, crash prevention
   - **Rex:** React patterns, CSS consistency, accessibility, visual coherence
   - **Sage:** XSS risks, injection vectors, dependency safety, OWASP top 10
   - **Turing:** Test coverage, edge cases, build correctness
   - **Eliza:** Commit conventions, PR linking, `CLAUDE.md` compliance
3. Review posted as PR review comments
4. If critical findings, Claude pushes fix commits to the same PR branch
5. Add `claude-reviewed` label after review completes

**Workflow:**
```yaml
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    if: contains(github.event.pull_request.body, 'Generated with Claude Code')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR from five specialist perspectives. Post a single
            structured review comment covering:

            ## Architecture (Ada)
            - Component boundaries and single-responsibility
            - TypeScript type safety (no `any`)
            - Unidirectional data flow
            - Potential crash paths

            ## Frontend (Rex)
            - React 19 patterns and hooks usage
            - CSS Modules scoping and brand color compliance
            - Accessibility (ARIA, keyboard nav)
            - Visual coherence with design doc

            ## Security (Sage)
            - XSS via markdown injection
            - Mermaid script injection
            - Dependency safety
            - Input sanitization

            ## QA (Turing)
            - Test coverage for changed code
            - Edge cases and error paths
            - Build verification

            ## AI Tooling (Eliza)
            - Conventional commit compliance
            - PR body includes Closes #N
            - No stale CLAUDE.md references

            Rate each area: PASS, ADVISORY (minor), or BLOCKED (must fix).
            If any area is BLOCKED, push fix commits to this PR branch.
          claude_args: |
            --max-turns 15
            --model claude-sonnet-4-6
```

**Acceptance criteria:**
- Every Claude-authored PR gets an automated review
- Review covers all five agent perspectives
- Critical findings trigger automatic fix commits
- Review is visible as a PR comment for human reviewers

---

### Phase 4: Multi-Issue Orchestration — Parallel Issue Processing

**Goal:** Handle multiple issues labeled `auto-fix` simultaneously with proper concurrency controls.

**Deliverables:**
1. Concurrency controls in the auto-fix workflow:
   - Group by issue number to prevent duplicate runs
   - Cancel in-progress runs for the same issue if re-labeled
   - Global concurrency limit (max 3 parallel issue workflows)
2. Branch conflict detection:
   - Before implementation, check if other auto-fix workflows are running
   - If two issues might touch the same files, serialize them
3. Sequential merge strategy:
   - After PRs are created, merge one at a time
   - Re-run CI after each merge to catch integration conflicts
4. Issue complexity estimation:
   - Analyze issue description before starting
   - Skip issues above a complexity threshold (comment with explanation)
   - Route complex issues to human attention

**Configuration additions:**
```yaml
concurrency:
  group: auto-fix-${{ github.event.issue.number }}
  cancel-in-progress: true
```

**Acceptance criteria:**
- Multiple issues process in parallel without conflicts
- Same issue doesn't spawn duplicate workflows
- Branch conflicts are detected and handled
- Complex issues are routed to humans, not attempted blindly

---

### Phase 5: Safeguards & Governance

**Goal:** Production-grade cost controls, security boundaries, and audit trails.

**Deliverables:**

#### Cost Controls
1. `--max-turns 30` cap on implementation workflows
2. `--max-turns 15` cap on review workflows
3. GitHub Actions workflow timeout: `timeout-minutes: 30`
4. Monthly budget alert via GitHub Actions billing API
5. Daily issue processing cap (max 10 auto-fixes per day via workflow condition)

#### Security Boundaries
1. `auto-fix` label can only be added by repository maintainers
2. Claude cannot modify `.github/workflows/`, `CLAUDE.md`, or `.claude/` (enforced via `--disallowedTools` or prompt instruction)
3. No secrets or credentials touched by auto-fix workflows
4. All changes require human PR approval before merge (branch protection rule)

#### Audit Trail
1. Every auto-fix action logs to a GitHub Actions summary
2. Issue gets a comment when auto-fix starts, completes, or fails
3. PR body includes: issue link, implementation approach, test results, review findings
4. Weekly digest of auto-fix activity (optional GitHub Action cron job)

#### Rollback
1. If CI fails on a Claude-authored PR, auto-close with explanation comment
2. If a merged Claude PR breaks master CI, auto-create a revert PR

**Acceptance criteria:**
- Runaway costs are impossible (hard caps at multiple levels)
- Claude cannot modify its own instructions or CI configuration
- Every automated action has a clear audit trail
- Broken PRs are automatically handled

---

### Phase 6: Feedback Loop & Metrics

**Goal:** Continuous improvement through metrics, error learning, and prompt tuning.

**Deliverables:**

#### Metrics Dashboard
1. GitHub Actions workflow to generate weekly metrics:
   - Issues auto-fixed vs. total issues opened
   - Time from label to PR
   - Review pass rate (first attempt vs. required fixes)
   - API token usage per issue (cost per fix)
   - CI pass rate on Claude-authored PRs

#### Learning Loop
1. When CI fails on a Claude PR, re-trigger with error context:
   - Include the failing test output in the prompt
   - Claude reads the CI log and pushes a fix commit
2. Track common review findings → update `CLAUDE.md` with new rules
3. Quarterly review of auto-fix effectiveness → tune prompts and thresholds

#### Self-Improving Pipeline
1. Eliza periodically reviews auto-fix outcomes and suggests prompt improvements
2. New agent checklist items discovered during review get added to `.claude/agents/`
3. Patterns that fail repeatedly get added to anti-patterns documentation

**Acceptance criteria:**
- Weekly metrics report generated automatically
- CI failures trigger intelligent retry (not blind retry)
- Project standards evolve based on automated findings
- Cost-per-fix trends downward over time

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Runaway API costs | HIGH | MEDIUM | Hard caps: max-turns, timeout, daily limit |
| Low-quality implementations | MEDIUM | MEDIUM | Automated review + human merge approval |
| Claude modifies its own config | HIGH | LOW | Disallow `.github/`, `.claude/` modifications |
| Merge conflicts between parallel PRs | MEDIUM | MEDIUM | Concurrency controls, sequential merging |
| Complex issues beyond Claude's ability | LOW | HIGH | Complexity estimation, human routing |
| GitHub Actions minutes exhaustion | MEDIUM | LOW | Timeout limits, concurrency caps |
| Flaky tests causing false failures | MEDIUM | MEDIUM | Re-run logic, known-flaky test list |

## Dependencies

- **`anthropics/claude-code-action@v1`** — must remain stable and supported
- **`ANTHROPIC_API_KEY`** — API access with sufficient quota
- **Branch protection rules** — human approval required for merge to master
- **Existing CI pipeline** — tests and build must continue to run on all PRs

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auto-fix success rate | >70% of `auto-fix` issues result in a mergeable PR | PRs merged / issues labeled |
| Time to PR | <15 minutes for simple bugs | Label timestamp → PR timestamp |
| Review pass rate | >80% pass first review | First-attempt PASS / total reviews |
| Cost per fix | <$5 API cost for simple bugs | API token tracking |
| CI reliability | <5% false-positive failures | Failed runs / total runs |
| Human time saved | >30 minutes per issue | Estimated vs. actual resolution time |

## Implementation Timeline

| Phase | Estimated Effort | Dependencies |
|-------|-----------------|--------------|
| Phase 1: Foundation | 1-2 hours | GitHub App install, API key |
| Phase 2: Auto-Implementation | 2-4 hours | Phase 1 |
| Phase 3: Automated Review | 2-3 hours | Phase 2 |
| Phase 4: Multi-Issue | 3-5 hours | Phase 3 |
| Phase 5: Safeguards | 4-6 hours | Phase 4 |
| Phase 6: Feedback Loop | 4-6 hours | Phase 5 |

**Total estimated effort: 16-26 hours across all phases.**

Phases 1-3 form the **minimum viable pipeline** — issues become PRs with review. Phases 4-6 add production-grade reliability and observability.
