const DEFAULT_REPO_URL = "https://github.com/anysphere/everysphere";
const DEFAULT_STARTING_REF = "main";
const DEFAULT_MODEL = "composer-2-fast";
const DISPATCH_COOLDOWN_MS = 10_000;
export const ALLOWED_MODELS = [
  "composer-2-fast",
  "gpt-5.5-medium-fast",
  "claude-4.6-opus-medium-thinking",
];
const MODEL_SELECTIONS = {
  "composer-2-fast": {
    id: "composer-2",
    params: [{ id: "fast", value: "true" }],
  },
  "gpt-5.5-medium-fast": {
    id: "gpt-5.5",
    params: [
      { id: "context", value: "272k" },
      { id: "reasoning", value: "medium" },
      { id: "fast", value: "true" },
    ],
  },
  "claude-4.6-opus-medium-thinking": {
    id: "claude-opus-4-6",
    params: [
      { id: "thinking", value: "true" },
      { id: "context", value: "1m" },
      { id: "effort", value: "medium" },
      { id: "fast", value: "false" },
    ],
  },
};
const MODEL_ALIASES = {
  "composer-2": "composer-2-fast",
  "gpt-5.5": "gpt-5.5-medium-fast",
  "claude-opus-4-6": "claude-4.6-opus-medium-thinking",
};
const DANGEROUS_REQUESTS = [
  { pattern: /\b(?:merge|auto-merge|automerge|land|ship)\b.*\b(?:pr|pull request|stack|branch|change|changes)\b/i, reason: "merging or landing changes" },
  { pattern: /\b(?:approve|rubber stamp)\b.*\b(?:pr|pull request|change|changes)\b/i, reason: "approving changes" },
  { pattern: /\bpush\b.*\b(?:main|master|release|prod|production|protected)\b/i, reason: "pushing to a protected branch" },
  { pattern: /\b(?:deploy|deployment|release|rollout|promote)\b/i, reason: "deploying or releasing" },
  { pattern: /\b(?:touch|change|modify|write|mutate|alter)\b.*\b(?:prod|production)\b/i, reason: "touching production" },
  { pattern: /\b(?:migration|migrate|backfill|write to|delete from|truncate)\b/i, reason: "running data-changing operations" },
  { pattern: /\b(?:secret|secrets|api key|token|credential|password|permission|permissions|branch protection)\b/i, reason: "changing secrets, permissions, or branch protection" },
];

const dispatches = [];
let lastDispatchAt = 0;

export function isConfigured() {
  return Boolean(process.env.CURSOR_API_KEY);
}

export function listWesleyDispatches() {
  return dispatches.slice(0, 20);
}

export function deleteWesleyDispatch(dispatchId) {
  const index = dispatches.findIndex((dispatch) => dispatch.id === dispatchId);
  if (index === -1) return false;
  dispatches.splice(index, 1);
  return true;
}

export function getWesleyDefaults() {
  const requestedModel = process.env.WESLEY_MODEL || process.env.CURSOR_AGENT_MODEL || DEFAULT_MODEL;
  return {
    allowedModels: ALLOWED_MODELS,
    model: normalizeModel(requestedModel) || DEFAULT_MODEL,
    repoUrl: resolveAllowedRepoUrl(),
    startingRef: resolveAllowedStartingRef(),
  };
}

export function prepareWesleyDispatch(instruction, options = {}) {
  const model = normalizeModel(options.model) || getWesleyDefaults().model;
  const repoUrl = resolveAllowedRepoUrl();
  const startingRef = resolveAllowedStartingRef();
  assertSafeDispatchRequest(instruction);
  const redactedInstruction = redactSecrets(instruction);
  const allowCodeChanges = options.allowCodeChanges === true;

  return {
    model,
    repoUrl,
    startingRef,
    allowCodeChanges,
    mode: allowCodeChanges ? "code_changes_allowed" : "investigate_only",
    promptPreview: truncate(redactedInstruction, 900),
    createdAt: new Date().toISOString(),
  };
}

export async function dispatchCursorAgent(instruction, options = {}) {
  if (!isConfigured()) {
    throw new Error("CURSOR_API_KEY is not configured");
  }

  const now = Date.now();
  if (now - lastDispatchAt < DISPATCH_COOLDOWN_MS) {
    throw new Error("Wesley is already dispatching. Try again in a few seconds.");
  }
  lastDispatchAt = now;

  const { Agent } = await import("@cursor/sdk");
  const preview = prepareWesleyDispatch(instruction, options);
  const prompt = buildDispatchPrompt(preview.promptPreview, { allowCodeChanges: preview.allowCodeChanges });

  const agent = await Agent.create({
    apiKey: process.env.CURSOR_API_KEY,
    model: modelSelectionFor(preview.model),
    cloud: {
      repos: [{ url: preview.repoUrl, startingRef: preview.startingRef }],
      workOnCurrentBranch: false,
      autoCreatePR: false,
    },
  });

  const run = await agent.send(prompt);
  const dispatch = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentId: agent.agentId,
    runId: run.id,
    status: run.status || "started",
    url: `https://cursor.com/agents?id=${agent.agentId}`,
    repoUrl: preview.repoUrl,
    startingRef: preview.startingRef,
    model: preview.model,
    allowCodeChanges: preview.allowCodeChanges,
    mode: preview.mode,
    prompt: preview.promptPreview,
    createdAt: new Date().toISOString(),
  };

  dispatches.unshift(dispatch);
  dispatches.splice(20);
  return dispatch;
}

function buildDispatchPrompt(instruction, options = {}) {
  const modeInstructions = options.allowCodeChanges
    ? "Mode: code changes allowed. You may make focused edits only on an isolated branch you create, and only when implementation is clearly requested."
    : "Mode: investigate only. Do not edit files, create commits, create branches, open PRs, or make repository changes. Inspect and report findings only. Read-only Databricks MCP or read-only SQL queries are allowed when they are needed to answer an analytics or finance question.";

  return `You are Wesley, the farm boy from The Princess Bride, acting as a Cursor cloud agent dispatched from lilguyz.

The user pasted messy context, often from Slack or chat. Treat it as source material for an engineering task.

${modeInstructions}

Your job:
- infer the requested outcome
- inspect the repository if needed
- use read-only Databricks MCP or read-only SQL for analytics and finance metric pulls when available
- summarize what you found
- propose concrete next steps
- make only local/cloud-agent workspace changes when implementation is explicitly requested and code changes are allowed
- never merge anything
- never run merge commands, enable auto-merge, approve a PR, land a stack, or mark a change as ready to merge
- never push to main, master, release branches, protected branches, or any branch you did not create
- never deploy, release, run migrations, touch production, change secrets, change permissions, or alter branch protection
- if a requested task requires any of those actions, stop and explain what a human must do

If implementation is clearly requested, make focused changes on an isolated branch and explain them. Do not create or update a PR unless the user explicitly requested that in the pasted context. If the request is ambiguous, investigate and report what clarification is needed.

Context from lilguyz:
${instruction.trim()}`;
}

function assertSafeDispatchRequest(instruction) {
  const text = String(instruction || "");
  const match = DANGEROUS_REQUESTS.find((request) => request.pattern.test(text));
  if (match) {
    throw new Error(`Wesley blocked this dispatch because it looks like it involves ${match.reason}.`);
  }
}

function normalizeModel(value) {
  if (typeof value !== "string") return null;
  const model = MODEL_ALIASES[value.trim()] || value.trim();
  if (!model) return null;
  if (!ALLOWED_MODELS.includes(model)) {
    throw new Error(`Wesley model must be one of: ${ALLOWED_MODELS.join(", ")}`);
  }
  return model;
}

function modelSelectionFor(model) {
  return MODEL_SELECTIONS[model] || { id: model };
}

function resolveAllowedRepoUrl() {
  const repoUrl = process.env.WESLEY_REPO_URL || process.env.CURSOR_AGENT_REPO_URL || DEFAULT_REPO_URL;
  const allowedRepos = splitEnvList(process.env.WESLEY_ALLOWED_REPOS || process.env.CURSOR_AGENT_ALLOWED_REPOS || DEFAULT_REPO_URL);
  if (!allowedRepos.includes(repoUrl)) {
    throw new Error(`Wesley repo is not allowed: ${repoUrl}`);
  }
  return repoUrl;
}

function resolveAllowedStartingRef() {
  const startingRef = process.env.WESLEY_STARTING_REF || process.env.CURSOR_AGENT_STARTING_REF || DEFAULT_STARTING_REF;
  const allowedRefs = splitEnvList(
    process.env.WESLEY_ALLOWED_REFS || process.env.CURSOR_AGENT_ALLOWED_REFS || DEFAULT_STARTING_REF,
  );
  if (!allowedRefs.includes(startingRef)) {
    throw new Error(`Wesley starting ref is not allowed: ${startingRef}`);
  }
  return startingRef;
}

function splitEnvList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function redactSecrets(value) {
  return String(value || "")
    .replace(/\b(?:xox[baprs]-|sk-[a-zA-Z0-9_-]*|gh[pousr]_[a-zA-Z0-9_]+)[a-zA-Z0-9_-]*/g, "[redacted-token]")
    .replace(/\b(api[_-]?key|token|secret|password|authorization)\s*[:=]\s*["']?[^"'\s]+/gi, "$1=[redacted]")
    .replace(/\bBearer\s+[a-zA-Z0-9._~+/=-]+/gi, "Bearer [redacted]");
}

function truncate(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
