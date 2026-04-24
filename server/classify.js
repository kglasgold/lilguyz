const ISSUE_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;
const PR_PATTERN = /\b(?:PR|pull\s*request|merge)\s*#?\d*/i;
const PR_KEYWORDS = /\b(?:review|CI|merge|merged|approve|approval|blocker|conflict|rebase|cherry.?pick)\b/i;
const LINEAR_KEYWORDS = /\b(?:task|ticket|issue|sprint|backlog|status|update|assign|priority|milestone|roadmap|epic)\b/i;
const NOTES_KEYWORDS = /\b(?:note|notes|doc|docs|document|wiki|write.?up|meeting|standup|retro|recap|summary|agenda)\b/i;

export function classifyInstruction(text) {
  const trimmed = text.trim();

  if (PR_PATTERN.test(trimmed) || PR_KEYWORDS.test(trimmed)) {
    return "pr";
  }

  if (ISSUE_PATTERN.test(trimmed) || LINEAR_KEYWORDS.test(trimmed)) {
    return "linear";
  }

  if (NOTES_KEYWORDS.test(trimmed)) {
    return "notes";
  }

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
