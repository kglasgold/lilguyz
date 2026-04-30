import { LinearClient } from "@linear/sdk";

const DEFAULT_TEAM = "Finance Analytics";
const LINEAR_API_URL = "https://api.linear.app/graphql";

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

export async function resolveUserId(assigneeName) {
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
      u.displayName?.toLowerCase() === lower ||
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

export async function fetchMyIssues(options = {}) {
  const now = Date.now();
  if (!options.force && myIssuesCache && now - myIssuesLastFetch < ISSUES_CACHE_TTL) {
    return myIssuesCache;
  }

  const c = getClient();
  if (!c) return [];

  try {
    const me = await c.viewer;
    const assigned = await requestLinear(
      `query MyAssignedIssues($assigneeId: ID!) {
        issues(
          first: 50
          orderBy: updatedAt
          filter: {
            assignee: { id: { eq: $assigneeId } }
            state: { type: { nin: ["canceled"] } }
          }
        ) {
          nodes {
            id
            identifier
            title
            url
            priority
            createdAt
            updatedAt
            state { name type }
            team { name }
          }
        }
      }`,
      { assigneeId: me.id },
    );

    const issues = await Promise.all(
      assigned.issues.nodes.map(async (issue) => {
        const state = issue.state;
        const team = issue.team;
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

export async function createIssue(title, description, assigneeName, statusName) {
  const c = getClient();
  if (!c) return null;

  const team = await resolveTeam();
  if (!team) return null;

  const assigneeId = await resolveUserId(assigneeName);
  const states = await team.states();
  const state = statusName ? resolveWorkflowState(states.nodes, statusName) : null;

  const result = await c.createIssue({
    teamId: team.id,
    title,
    description: description || undefined,
    assigneeId,
    stateId: state?.id,
  });

  const issue = await result.issue;
  if (!issue) return null;
  clearIssueCache();

  return {
    id: issue.id,
    identifier: issue.identifier,
    url: issue.url,
    title: issue.title,
  };
}

export async function updateIssueStatus(identifier, statusName) {
  const issue = await findIssueByIdentifier(identifier);
  const state = resolveWorkflowState(issue.team.states.nodes, statusName);
  const updated = await updateIssue(issue.id, { stateId: state.id });
  clearIssueCache();

  return {
    action: "update_status",
    identifier: updated.identifier,
    title: updated.title,
    url: updated.url,
    status: updated.state?.name || state.name,
    statusType: updated.state?.type || state.type,
  };
}

export async function updateIssueAssignee(identifier, assigneeName) {
  const issue = await findIssueByIdentifier(identifier);
  const assigneeId = assigneeName === null ? null : await resolveUserId(assigneeName);

  if (assigneeName !== null && !assigneeId) {
    throw new Error(`Could not find Linear user "${assigneeName}"`);
  }

  const updated = await updateIssue(issue.id, { assigneeId });
  clearIssueCache();

  return {
    action: "change_assignee",
    identifier: updated.identifier,
    title: updated.title,
    url: updated.url,
    assignee: updated.assignee?.displayName || updated.assignee?.name || null,
  };
}

async function findIssueByIdentifier(identifier) {
  const issueKey = String(identifier || "").trim().toUpperCase();
  const data = await requestLinear(
    `query IssueById($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
        url
        team {
          id
          name
          states {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    }`,
    { id: issueKey },
  );
  const issue = data.issue;
  if (!issue) {
    throw new Error(`Could not find Linear issue ${issueKey}`);
  }
  return issue;
}

function resolveWorkflowState(states, statusName) {
  const desired = normalize(statusName);
  const desiredType = statusTypeAlias(desired);
  const state =
    states.find((s) => normalize(s.name) === desired) ||
    states.find((s) => desiredType && s.type === desiredType) ||
    states.find((s) => normalize(s.name).includes(desired));

  if (!state) {
    throw new Error(`Could not find status "${statusName}". Available: ${states.map((s) => s.name).join(", ")}`);
  }

  return state;
}

async function updateIssue(issueId, input) {
  const data = await requestLinear(
    `mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          title
          url
          state { name type }
          assignee { name displayName }
        }
      }
    }`,
    { id: issueId, input },
  );

  if (!data.issueUpdate?.success || !data.issueUpdate.issue) {
    throw new Error("Linear issue update failed");
  }

  return data.issueUpdate.issue;
}

async function requestLinear(query, variables = {}) {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    throw new Error("LINEAR_API_KEY is not configured");
  }

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: key,
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();

  if (!response.ok || payload.errors) {
    const message = payload.errors?.[0]?.message || payload.error || "Linear request failed";
    throw new Error(message);
  }

  return payload.data;
}

function clearIssueCache() {
  myIssuesCache = null;
  myIssuesLastFetch = 0;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function statusTypeAlias(value) {
  if (["done", "complete", "completed"].includes(value)) return "completed";
  if (["in progress", "started", "doing"].includes(value)) return "started";
  if (["todo", "to do", "unstarted", "not started"].includes(value)) return "unstarted";
  if (["backlog"].includes(value)) return "backlog";
  if (["canceled", "cancelled"].includes(value)) return "canceled";
  return null;
}
