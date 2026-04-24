const ISSUE_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;
const PR_NUMBER_PATTERN = /\b(?:PR|pull\s*request)\s*#?(\d+)\b/i;

export function parseWatchInstruction(instruction, agent = "watcher", now = new Date()) {
  const text = instruction.trim();

  if (!text) {
    throw new Error("Enter an instruction.");
  }

  const subject = parseSubject(text, agent);
  const dueAt = parseDueAt(text, now) || new Date(now.getTime() + 60 * 60 * 1000);

  return {
    agent,
    subject,
    instruction: text,
    dueAt: dueAt.toISOString(),
  };
}

function parseSubject(text, agent) {
  if (agent === "linear" || agent === "watcher") {
    const issueMatch = text.match(ISSUE_PATTERN);
    if (issueMatch) return issueMatch[0];
  }

  if (agent === "pr") {
    const prMatch = text.match(PR_NUMBER_PATTERN);
    if (prMatch) return `PR #${prMatch[1]}`;

    const issueMatch = text.match(ISSUE_PATTERN);
    if (issueMatch) return issueMatch[0];
  }

  const onMatch = text.match(/\b(?:on|about)\s+(.+?)\s+(?:in|at|tomorrow|today)\b/i);
  if (onMatch?.[1]) {
    return cleanSubject(onMatch[1]);
  }

  return "general";
}

function parseDueAt(text, now) {
  const relativeMatch = text.match(
    /\bin\s+(\d+)\s*(minute|minutes|min|mins|hour|hours|hr|hrs|day|days)\b/i,
  );

  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    return addRelativeTime(now, amount, unit);
  }

  const tomorrowMatch = text.match(/\btomorrow(?:\s+(?:at\s+)?)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (tomorrowMatch) {
    return atClockTime(now, tomorrowMatch, 1);
  }

  const todayMatch = text.match(/\b(?:today\s+)?(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (todayMatch) {
    const due = atClockTime(now, todayMatch, 0);
    if (due.getTime() <= now.getTime()) {
      due.setDate(due.getDate() + 1);
    }
    return due;
  }

  return null;
}

function addRelativeTime(now, amount, unit) {
  const due = new Date(now);
  const normalized = unit.toLowerCase();

  if (["minute", "minutes", "min", "mins"].includes(normalized)) {
    due.setMinutes(due.getMinutes() + amount);
    return due;
  }

  if (["hour", "hours", "hr", "hrs"].includes(normalized)) {
    due.setHours(due.getHours() + amount);
    return due;
  }

  due.setDate(due.getDate() + amount);
  return due;
}

function atClockTime(now, match, daysToAdd) {
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  }

  if (meridiem === "am" && hour === 12) {
    hour = 0;
  }

  const due = new Date(now);
  due.setDate(due.getDate() + daysToAdd);
  due.setHours(hour, minute, 0, 0);
  return due;
}

function cleanSubject(subject) {
  return subject.trim().replace(/[.,!?]+$/, "") || "general";
}
