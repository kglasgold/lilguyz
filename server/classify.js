import { callLLMJson, isLLMConfigured } from "./llm.js";

const ROUTER_PROMPT = `You are a router for a task management app called lilguyz. Given a user instruction, return JSON with these fields:

- "agent": one of "watcher", "linear", "pr", "notes", "granola", "wesley"
- "title": a clean, concise task title extracted from the instruction (NOT the raw instruction itself)
- "assignee": the person's name to assign to, or "me" if they said assign to me, or null
- "description": any description content they specified, or null
- "dueIn": a relative time expression like "2 hours", "30 minutes", "tomorrow 9am", or null if none given

Routing rules:
- "linear": tasks, tickets, issues, sprints, anything mentioning Linear or issue keys like FIN-3, or creating/tracking work items
- "pr": pull requests, reviews, CI, merging, code review, anything GitHub PR related
- "wesley": dispatching Cursor cloud agents, spinning up agents from pasted Slack/chat context, or prompts mentioning Wesley
- "granola": Granola meeting notes, transcripts, AI meeting summaries, recaps from Granola, or searching what was said in a meeting
- "notes": notes, docs, documents, meetings, standups, agendas, recaps, or memory/search questions like "what did I say about billing?"
- "watcher": only explicit reminders, timers, alarms, or watch prompts like "remind me to...", "set a timer...", or "watch this..."
- If a prompt is a general question, memory lookup, or ambiguous instruction, do not route it to watcher.

Return ONLY valid JSON, no explanation.`;

const VALID_AGENTS = new Set(["watcher", "linear", "pr", "notes", "granola", "wesley"]);

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
const WESLEY_KEYWORDS = /\b(?:wesley|as\s+you\s+wish|cursor\s+(?:cloud\s+)?agent|cloud\s+agent|spin\s+up\s+(?:a\s+)?(?:cursor\s+)?agent|dispatch\s+(?:a\s+)?(?:cursor\s+)?agent|slack\s+(?:chat|thread|context))\b/i;
const GRANOLA_KEYWORDS = /\b(?:granola|transcript|transcripts|meeting\s+notes?|ai\s+summary|meeting\s+summary|call\s+recap)\b/i;
const GRANOLA_MEMORY_PATTERN = /\b(?:what|where|find|search|show|tell)\b.*\b(?:meeting|call|transcript|granola|recap)\b/i;
const NOTES_KEYWORDS = /\b(?:note|notes|doc|docs|document|wiki|write.?up|meeting|standup|retro|recap|summary|agenda)\b/i;
const NOTES_MEMORY_PATTERN = /\b(?:what|where|find|search|show|tell)\b.*\b(?:say|said|mention|remember|wrote|know|love|loved|like|liked)\b/i;
const REMINDER_PATTERN = /\b(?:remind\s+me\s+to|remind\s+me\s+about|set\s+(?:a\s+)?timer|start\s+(?:a\s+)?timer|set\s+(?:an\s+)?alarm|watch\s+(?:this|for)|ping\s+me\s+(?:to|about|in|at))\b/i;

export function classifyRegex(text) {
  const trimmed = text.trim();

  if (PR_PATTERN.test(trimmed) || PR_KEYWORDS.test(trimmed)) return "pr";
  if (ISSUE_PATTERN.test(trimmed) || LINEAR_KEYWORDS.test(trimmed)) return "linear";
  if (WESLEY_KEYWORDS.test(trimmed)) return "wesley";
  if (GRANOLA_KEYWORDS.test(trimmed) || GRANOLA_MEMORY_PATTERN.test(trimmed)) return "granola";
  if (NOTES_KEYWORDS.test(trimmed) || NOTES_MEMORY_PATTERN.test(trimmed)) return "notes";
  if (isReminderInstruction(trimmed)) return "watcher";
  return null;
}

export function isReminderInstruction(text) {
  return REMINDER_PATTERN.test(text);
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
