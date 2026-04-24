import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const GH_PATHS = [
  "/opt/homebrew/bin/gh",
  "/usr/local/bin/gh",
  "/usr/bin/gh",
];

function findGh() {
  for (const p of GH_PATHS) {
    if (existsSync(p)) return p;
  }
  return "gh";
}

const ghBin = findGh();

const PR_QUERY = `
{
  search(query: "is:pr is:open author:@me", type: ISSUE, first: 20) {
    nodes {
      ... on PullRequest {
        number
        title
        url
        createdAt
        updatedAt
        isDraft
        additions
        deletions
        headRefName
        repository { nameWithOwner }
        reviewDecision
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
              }
            }
          }
        }
        reviewRequests(first: 5) {
          nodes {
            requestedReviewer {
              ... on User { login }
              ... on Team { name }
            }
          }
        }
      }
    }
  }
}`;

let cachedPrs = null;
let lastFetch = 0;
const CACHE_TTL = 30_000;

export async function fetchOpenPRs() {
  const now = Date.now();
  if (cachedPrs && now - lastFetch < CACHE_TTL) {
    return cachedPrs;
  }

  try {
    const { stdout } = await execFileAsync(ghBin, [
      "api", "graphql", "-f", `query=${PR_QUERY}`,
    ], { timeout: 15_000, env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:${process.env.PATH || ""}` } });

    const data = JSON.parse(stdout);
    const nodes = data?.data?.search?.nodes || [];

    cachedPrs = nodes.map(normalizePR);
    lastFetch = now;
    return cachedPrs;
  } catch (err) {
    console.error("GitHub PR fetch failed:", err.message);
    return cachedPrs || [];
  }
}

function normalizePR(node) {
  const ciState = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state || null;
  const reviewers = (node.reviewRequests?.nodes || [])
    .map((r) => r.requestedReviewer?.login || r.requestedReviewer?.name)
    .filter(Boolean);

  let status = "open";
  if (node.isDraft) status = "draft";
  else if (node.reviewDecision === "APPROVED" && ciState === "SUCCESS") status = "ready";
  else if (node.reviewDecision === "CHANGES_REQUESTED") status = "changes";
  else if (ciState === "FAILURE" || ciState === "ERROR") status = "failing";
  else if (node.reviewDecision === "APPROVED") status = "approved";
  else if (ciState === "PENDING") status = "pending";

  return {
    number: node.number,
    title: node.title,
    url: node.url,
    repo: node.repository?.nameWithOwner || "",
    branch: node.headRefName,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    isDraft: node.isDraft,
    additions: node.additions,
    deletions: node.deletions,
    reviewDecision: node.reviewDecision || null,
    ciState,
    reviewers,
    status,
  };
}

import { callLLM, isLLMConfigured } from "./llm.js";

let summaryCache = null;
let summaryLastFetch = 0;
const SUMMARY_CACHE_TTL = 60_000;

export async function summarizePRs(prs) {
  if (!isLLMConfigured() || !prs?.length) return null;

  const now = Date.now();
  if (summaryCache && now - summaryLastFetch < SUMMARY_CACHE_TTL) {
    return summaryCache;
  }

  const prList = prs.map((p) =>
    `#${p.number} "${p.title}" — ${p.status}, +${p.additions}/-${p.deletions}, branch: ${p.branch}`
  ).join("\n");

  const summary = await callLLM(
    "You are PR Shepherd, a helpful assistant that summarizes open pull requests. Be concise and actionable. Use 2-3 short sentences max. Mention which PRs need attention and which are ready to merge. Don't use bullet points.",
    `Here are my open PRs:\n${prList}`,
  );

  if (summary) {
    summaryCache = summary;
    summaryLastFetch = now;
  }

  return summary;
}
