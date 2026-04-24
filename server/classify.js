import { callLLMJson, isLLMConfigured } from "./llm.js";

const ROUTER_PROMPT = `You are a router for a task management app called lilguyz. Given a user instruction, return JSON with these fields:

- "agent": one of "watcher", "linear", "pr", "notes"
- "title": a clean, concise task title extracted from the instruction (NOT the raw instruction itself)
- "assignee": the person's name to assign to, or "me" if they said assign to me, or null
- "description": any description content they specified, or null
- "dueIn": a relative time expression like "2 hours", "30 minutes", "tomorrow 9am", or null if none given

Routing rules:
- "linear": tasks, tickets, issues, sprints, anything mentioning Linear or issue keys like FIN-3, or creating/tracking work items
- "pr": pull requests, reviews, CI, merging, code review, anything GitHub PR related
- "notes": notes, docs, documents, meetings, standups, agendas, recaps
- "watcher": generic reminders, timers, or anything that doesn't clearly fit above

Return ONLY valid JSON, no explanation.`;

const VALID_AGENTS = new Set(["watcher", "linear", "pr", "notes"]);

export async function classifyWithLLM(text) {
  if (!isLLMConfigured()) return null;

  try {
    const result = await callLLMJson(ROUTER_PROMPT, text);
    if (!result || !VALID_AGENTS.has(result.agent)) return null;
    return {
      agent: result.agent,
      title: result.title || text.trim(),
      assignee: result.assignee || null,
      description: result.description || null,
      dueIn: result.dueIn || null,
    };
  } catch (err) {
    console.error("LLM classify failed:", err.message);
    return null;
  }
}

// ── Regex fallback ──

const ISSUE_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;
const PR_PATTERN = /\b(?:PR|pull\s*request|merge)\s*#?\d*/i;
const PR_KEYWORDS = /\b(?:review|CI|merge|merged|approve|approval|blocker|conflict|rebase|cherry.?pick)\b/i;
const LINEAR_KEYWORDS = /\b(?:task|ticket|issue|sprint|backlog|status|update|assign|priority|milestone|roadmap|epic)\b/i;
const NOTES_KEYWORDS = /\b(?:note|notes|doc|docs|document|wiki|write.?up|meeting|standup|retro|recap|summary|agenda)\b/i;

export function classifyRegex(text) {
  const trimmed = text.trim();

  if (PR_PATTERN.test(trimmed) || PR_KEYWORDS.test(trimmed)) return "pr";
  if (ISSUE_PATTERN.test(trimmed) || LINEAR_KEYWORDS.test(trimmed)) return "linear";
  if (NOTES_KEYWORDS.test(trimmed)) return "notes";
  return "watcher";
}

const PREAMBLE = /^(?:create|make|add|open|file|set\s*up|start)\s+(?:a\s+)?(?:new\s+)?(?:linear\s+)?(?:task|ticket|issue)\s*(?:to|for|about|that|called|named)?\s*/i;
const TIME_SUFFIX = /\s+(?:in\s+\d+\s*(?:min(?:ute)?s?|hours?|hrs?|days?)|(?:today|tomorrow)(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*$/i;
const ASSIGN_PATTERN = /\s*[-,.]?\s*(?:and\s+)?assign\s+(?:it\s+)?to\s+(.+?)\s*$/i;
const DESCRIPTION_PATTERN = /\s*[-,.]?\s*(?:and\s+)?(?:add|put|set|with)\s+(?:in\s+)?(?:the\s+)?(?:description|desc|body)\s*[:.]?\s*(.+)/i;

export function extractTitle(text) {
  let title = text.trim();
  title = title.replace(PREAMBLE, "");
  title = title.replace(TIME_SUFFIX, "");
  title = title.replace(ASSIGN_PATTERN, "");
  title = title.replace(DESCRIPTION_PATTERN, "");
  title = title.trim().replace(/^[-,.\s]+|[-,.\s]+$/g, "");
  if (!title) return text.trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function extractAssignee(text) {
  const match = text.match(ASSIGN_PATTERN);
  if (!match) return null;
  const name = match[1].trim().replace(/\s+(?:in\s+\d+.*|tomorrow.*|today.*|at\s+\d+.*)$/i, "").trim();
  if (!name || name.toLowerCase() === "me") return "me";
  return name;
}

export function extractDescription(text) {
  const match = text.match(DESCRIPTION_PATTERN);
  if (!match) return null;
  let desc = match[1].trim();
  desc = desc.replace(TIME_SUFFIX, "").replace(ASSIGN_PATTERN, "").trim();
  return desc || null;
}
