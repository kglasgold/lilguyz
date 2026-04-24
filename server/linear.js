import { LinearClient } from "@linear/sdk";

const DEFAULT_TEAM = "Finance Analytics";

let client = null;
let teamCache = null;
let usersCache = null;
let meCache = null;

function getClient() {
  if (client) return client;

  const key = process.env.LINEAR_API_KEY;
  if (!key) return null;

  client = new LinearClient({ apiKey: key });
  return client;
}

export function isConfigured() {
  return Boolean(process.env.LINEAR_API_KEY);
}

async function resolveTeam(teamName = DEFAULT_TEAM) {
  if (teamCache) return teamCache;

  const c = getClient();
  if (!c) return null;

  const teams = await c.teams();
  const match = teams.nodes.find(
    (t) => t.name.toLowerCase() === teamName.toLowerCase(),
  );

  if (!match) {
    console.warn(`Linear team "${teamName}" not found. Available: ${teams.nodes.map((t) => t.name).join(", ")}`);
    return null;
  }

  teamCache = match;
  return match;
}

async function resolveUserId(assigneeName) {
  if (!assigneeName) return undefined;

  const c = getClient();
  if (!c) return undefined;

  if (assigneeName === "me") {
    if (meCache) return meCache;
    const me = await c.viewer;
    meCache = me.id;
    return me.id;
  }

  if (!usersCache) {
    const users = await c.users();
    usersCache = users.nodes;
  }

  const lower = assigneeName.toLowerCase();
  const match = usersCache.find(
    (u) =>
      u.name.toLowerCase() === lower ||
      u.displayName.toLowerCase() === lower ||
      u.name.toLowerCase().includes(lower) ||
      lower.includes(u.name.toLowerCase().split(" ")[0]),
  );

  if (!match) {
    console.warn(`Linear user "${assigneeName}" not found`);
    return undefined;
  }

  return match.id;
}

let myIssuesCache = null;
let myIssuesLastFetch = 0;
const ISSUES_CACHE_TTL = 30_000;

export async function fetchMyIssues() {
  const now = Date.now();
  if (myIssuesCache && now - myIssuesLastFetch < ISSUES_CACHE_TTL) {
    return myIssuesCache;
  }

  const c = getClient();
  if (!c) return [];

  try {
    const me = await c.viewer;
    const assigned = await me.assignedIssues({
      first: 50,
      orderBy: "updatedAt",
      filter: {
        state: { type: { nin: ["canceled"] } },
      },
    });

    const issues = await Promise.all(
      assigned.nodes.map(async (issue) => {
        const state = await issue.state;
        const team = await issue.team;
        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          priority: issue.priority,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          status: state?.name || "Unknown",
          statusType: state?.type || "unstarted",
          teamName: team?.name || "",
        };
      }),
    );

    myIssuesCache = issues;
    myIssuesLastFetch = now;
    return issues;
  } catch (err) {
    console.error("Linear issues fetch failed:", err.message);
    return myIssuesCache || [];
  }
}

export async function createIssue(title, description, assigneeName) {
  const c = getClient();
  if (!c) return null;

  const team = await resolveTeam();
  if (!team) return null;

  const assigneeId = await resolveUserId(assigneeName);

  const result = await c.createIssue({
    teamId: team.id,
    title,
    description: description || undefined,
    assigneeId,
  });

  const issue = await result.issue;
  if (!issue) return null;

  return {
    id: issue.id,
    identifier: issue.identifier,
    url: issue.url,
    title: issue.title,
  };
}
