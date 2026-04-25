import { callLLMJson, isLLMConfigured } from "./llm.js";
import { fetchMyIssues, updateIssueAssignee, updateIssueStatus } from "./linear.js";

const ISSUE_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/i;
const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "change",
  "issue",
  "linear",
  "mark",
  "move",
  "set",
  "task",
  "tasks",
  "the",
  "ticket",
  "to",
  "update",
]);

const LINEAR_ACTION_PROMPT = `You parse Linear issue commands for Mr. PM.

You will receive the user's prompt and a list of assigned Linear issues. Prefer selecting an issueKey from the provided list when the user's title phrase clearly refers to one of those issues.

Return JSON with:
- "action": one of "update_status", "change_assignee", or "none"
- "issueKey": the Linear issue key like FIN-12, or null
- "issueTitle": the user's plain-language issue title/reference when no issue key is provided, or null
- "statusName": target status for update_status, or null
- "assigneeName": target assignee for change_assignee, "me" for the current user, null to unassign, or null when not changing assignee

Only use update_status for commands that clearly move, mark, set, or change an issue status.
Only use change_assignee for commands that clearly assign, reassign, or unassign an issue.
When the user refers to an issue by title instead of key, choose a matching issueKey from the assigned issue list if one is clear.
If no assigned issue is a clear match, leave issueKey null and put the user's title phrase in issueTitle.
Treat words like "update", "task", "tasks", "issue", and "ticket" as command/filler words, not necessarily title words.
If the user is creating a new task, return "none".
Return ONLY valid JSON.`;

export async function handleLinearAction(instruction) {
  const issues = await fetchMyIssues({ force: true });
  const action = (await parseLinearActionWithLLM(instruction, issues)) || parseLinearActionFallback(instruction);
  if (!action || action.action === "none") {
    return null;
  }

  const issueResolution = resolveIssue(action, issues);
  if (issueResolution?.needsClarification) {
    return issueResolution;
  }

  if (!issueResolution?.identifier) {
    throw new Error("Which Linear issue should I update?");
  }

  if (action.action === "update_status") {
    if (!action.statusName) {
      throw new Error("What status should I move it to?");
    }
    return updateIssueStatus(issueResolution.identifier, action.statusName);
  }

  if (action.action === "change_assignee") {
    return updateIssueAssignee(issueResolution.identifier, action.assigneeName);
  }

  return null;
}

async function parseLinearActionWithLLM(instruction, issues) {
  if (!isLLMConfigured()) return null;

  try {
    const assignedIssues = issues
      .map((issue) => `- ${issue.identifier}: ${issue.title} (${issue.status})`)
      .join("\n");
    const result = await callLLMJson(
      LINEAR_ACTION_PROMPT,
      `Assigned issues:\n${assignedIssues || "(none)"}\n\nPrompt:\n${instruction}`,
    );
    if (!result || !["update_status", "change_assignee", "none"].includes(result.action)) {
      return null;
    }

    return {
      action: result.action,
      issueKey: normalizeIssueKey(result.issueKey, issues),
      issueTitle: typeof result.issueTitle === "string" ? result.issueTitle.trim() : null,
      statusName: typeof result.statusName === "string" ? result.statusName.trim() : null,
      assigneeName: parseAssigneeName(result.assigneeName),
    };
  } catch (error) {
    console.error("Linear action parse failed:", error.message);
    return null;
  }
}

function parseLinearActionFallback(instruction) {
  const text = instruction.trim();
  const issueKey = text.match(ISSUE_PATTERN)?.[0]?.toUpperCase();

  const unassignMatch = text.match(/\b(?:unassign|remove\s+assignee\s+from)\b/i);
  if (unassignMatch) {
    const issueTitle = issueKey ? null : cleanIssueTitle(text.replace(unassignMatch[0], ""));
    return { action: "change_assignee", issueKey, issueTitle, assigneeName: null };
  }

  const assignMatch = issueKey
    ? text.match(/\b(?:assign|reassign)\s+[A-Z][A-Z0-9]+-\d+\s+(?:to\s+)?(.+?)\s*$/i)
    : text.match(/\b(?:assign|reassign)\s+(.+?)\s+to\s+(.+?)\s*$/i);
  if (assignMatch?.[1]) {
    return {
      action: "change_assignee",
      issueKey,
      issueTitle: issueKey ? null : cleanIssueTitle(assignMatch[1]),
      assigneeName: cleanAssignee(issueKey ? assignMatch[1] : assignMatch[2]),
    };
  }

  const statusMatch = issueKey
    ? (
        text.match(/\b(?:move|mark|set|change)\s+[A-Z][A-Z0-9]+-\d+\s+(?:to|as)\s+(.+?)\s*$/i) ||
        text.match(/\b[A-Z][A-Z0-9]+-\d+\s+(?:to|as)\s+(.+?)\s*$/i)
      )
    : text.match(/\b(?:move|mark|set|change)\s+(.+?)\s+(?:to|as)\s+(.+?)\s*$/i);

  if (statusMatch?.[1]) {
    return {
      action: "update_status",
      issueKey,
      issueTitle: issueKey ? null : cleanIssueTitle(statusMatch[1]),
      statusName: (issueKey ? statusMatch[1] : statusMatch[2]).trim(),
    };
  }

  return null;
}

function resolveIssue(action, issues) {
  if (action.issueKey) {
    return { identifier: action.issueKey };
  }

  if (!action.issueTitle) {
    return null;
  }

  const matches = matchIssuesByTitle(issues, action.issueTitle);

  if (matches.length === 1) {
    return { identifier: matches[0].identifier };
  }

  if (matches.length > 1) {
    return {
      action: "clarify_issue",
      needsClarification: true,
      issueTitle: action.issueTitle,
      requestedAction: action.action,
      statusName: action.statusName || null,
      assigneeName: action.assigneeName,
      candidates: matches.slice(0, 5).map((issue) => ({
        identifier: issue.identifier,
        title: issue.title,
        status: issue.status,
      })),
    };
  }

  throw new Error(`Could not find an assigned Linear issue matching "${action.issueTitle}"`);
}

function matchIssuesByTitle(issues, title) {
  const query = normalize(title);
  if (!query) return [];

  const exact = issues.filter((issue) => normalize(issue.title) === query);
  if (exact.length > 0) return exact;

  const contains = issues.filter((issue) => normalize(issue.title).includes(query));
  if (contains.length > 0) return contains;

  const queryWords = titleWords(query);
  if (queryWords.length === 0) return [];

  const scored = issues
    .map((issue) => {
      const issueWords = titleWords(issue.title);
      const issueWordSet = new Set(issueWords);
      const matchingWords = queryWords.filter((word) => issueWordSet.has(word) || issueWords.some((issueWord) => fuzzyWordMatch(word, issueWord)));
      const score = matchingWords.length / queryWords.length;
      return { issue, score, matchingWords };
    })
    .filter(({ score, matchingWords }) => score >= 0.6 && matchingWords.length >= Math.min(2, queryWords.length))
    .sort((a, b) => b.score - a.score || b.matchingWords.length - a.matchingWords.length);

  if (scored.length === 0) return [];

  const bestScore = scored[0].score;
  return scored
    .filter(({ score }) => score === bestScore)
    .map(({ issue }) => issue);
}

function parseAssigneeName(value) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return cleanAssignee(value);
}

function cleanAssignee(value) {
  const cleaned = value.trim().replace(/^@/, "");
  if (!cleaned || /\b(?:none|nobody|unassigned)\b/i.test(cleaned)) return null;
  if (cleaned.toLowerCase() === "me") return "me";
  return cleaned;
}

function normalizeIssueKey(value, issues) {
  if (typeof value !== "string") return null;
  const issueKey = value.trim().toUpperCase();
  if (!ISSUE_PATTERN.test(issueKey)) return null;
  return issues.some((issue) => issue.identifier === issueKey) ? issueKey : null;
}

function cleanIssueTitle(value) {
  return String(value || "")
    .trim()
    .replace(/^the\s+/i, "")
    .replace(/\s+issue$/i, "")
    .trim();
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleWords(value) {
  return normalize(value)
    .split(" ")
    .filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word))
    .map(singularize);
}

function singularize(word) {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

function fuzzyWordMatch(queryWord, issueWord) {
  return queryWord.includes(issueWord) || issueWord.includes(queryWord);
}
