# Future Agent Runtime

## Goal

Make lilguyz more useful by keeping the little guys fast for quick commands while giving them deeper agentic abilities for background work through Cursor, MCPs, and service APIs.

## Product Direction

- Keep the app as the cute control surface and safety layer.
- Let quick commands execute immediately through existing backend APIs.
- Route longer investigations into background jobs with visible agent status.
- Use Cursor for repo-aware or multi-step work where agentic behavior helps.
- Use explicit tools for Linear, GitHub, notes, reminders, and future MCP integrations.
- Keep risky mutations guarded by confirmation, clarification cards, or other user approval.

## Fast Lane

Use this for commands that should feel instant:

- Route a command to the right agent.
- Search notes and answer from retrieved snippets.
- Create, snooze, or resolve reminders.
- Update a Linear status or assignee when the target is clear.
- Pick candidate Linear issues for clickable clarification.
- Refresh PRs, issues, notes, and watches.

Target feel: usually 1-3 seconds.

## Background Agent Lane

Use this for work that may take longer or need tools:

- PR Boy investigates failing CI or review blockers.
- Mr. PM checks blocked issues, stale tasks, or project status.
- Notes Guy summarizes recent notes or turns notes into Linear tasks.
- Jared watches for a future condition and reports back.
- Cursor-powered agents inspect the repo or run multi-step analysis.

These should create visible jobs like:

```text
PR Boy is investigating failing CI...
Mr. PM is checking blocked issues...
Notes Guy is organizing recent notes...
Jared is watching for the next update...
```

## Architecture Sketch

```text
user command
  -> fast router
  -> agent planner
  -> quick action or background job
  -> explicit tool calls / MCPs / APIs
  -> result card + notification
```

The LLM should decide intent and produce structured plans. The app should own execution, permissions, and safety.

## Cursor Integration

Cursor should be used primarily for background agent work, not every tiny classification call.

Best candidates:

- Repo-aware PR investigation.
- Codebase questions.
- CI/debugging summaries.
- Multi-step workflows that benefit from tools.
- Longer agentic tasks with MCPs or APIs.

Preferred implementation path:

- Add an LLM provider abstraction so the app is not tied directly to `ANTHROPIC_API_KEY`.
- Add Cursor as a provider using the official Cursor TypeScript SDK or ACP.
- Keep fast local handlers for simple commands.
- Keep lilguyz as the execution and safety layer.

## Agent Tool Sets

### Mr. PM

- `linear.searchIssues`
- `linear.updateStatus`
- `linear.changeAssignee`
- `linear.addComment`
- `linear.listBlocked`
- `linear.createIssue`

### PR Boy

- `github.listPRs`
- `github.getChecks`
- `github.getReviewComments`
- `buildkite.getFailedJob`
- `cursor.investigateRepo`

### Notes Guy

- `notes.search`
- `notes.createTheme`
- `notes.addSubNote`
- `notes.summarize`
- `notes.convertToTask`

### Jared

- `reminders.create`
- `reminders.snooze`
- `reminders.resolve`
- `watchers.createBackgroundWatch`

## Phased Todo

1. Add an LLM provider abstraction so the app can switch between Anthropic, Cursor, local, or mock providers.
2. Replace ad hoc routing with structured agent intent results: agent, intent, confidence, entities, safety level, and background-job preference.
3. Create a background job store/API for longer agent work with statuses and result cards.
4. Show per-agent states in the UI: idle, thinking, working, needs input, done, failed.
5. Add Cursor SDK or ACP integration for background agent jobs.
6. Define explicit tools per agent for Linear, GitHub, notes, reminders, and future MCPs.
7. Add session memory for follow-ups like "move that to done" or "add this under that note."
