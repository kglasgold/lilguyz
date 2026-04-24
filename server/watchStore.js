import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = process.env.ASSISTANT_BOT_DATA || `${rootDir}/data`;
const storePath = `${dataDir}/watches.json`;

export async function listWatches(agentFilter) {
  const state = await readState();
  const watches = agentFilter
    ? state.watches.filter((w) => w.agent === agentFilter)
    : state.watches;
  return sortWatches(watches);
}

export async function countByAgent() {
  const state = await readState();
  const counts = {};
  for (const w of state.watches) {
    const agent = w.agent || "watcher";
    if (!counts[agent]) counts[agent] = { total: 0, due: 0, pending: 0, resolved: 0 };
    counts[agent].total++;
    counts[agent][w.status] = (counts[agent][w.status] || 0) + 1;
  }
  return counts;
}

export async function createWatch(input) {
  const now = new Date().toISOString();
  const watch = {
    id: crypto.randomUUID(),
    agent: input.agent || "watcher",
    subject: input.subject,
    instruction: input.instruction,
    dueAt: input.dueAt,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    lastNotifiedAt: null,
    resolvedAt: null,
    linearIssue: input.linearIssue || null,
  };

  const state = await readState();
  state.watches.push(watch);
  await writeState(state);
  return watch;
}

export async function markDueWatches() {
  const now = Date.now();
  const state = await readState();
  let changed = false;

  state.watches = state.watches.map((watch) => {
    if (watch.status !== "pending") {
      return watch;
    }

    if (Date.parse(watch.dueAt) > now) {
      return watch;
    }

    changed = true;
    return {
      ...watch,
      status: "due",
      lastNotifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  if (changed) {
    await writeState(state);
  }

  return sortWatches(state.watches);
}

export async function resolveWatch(id) {
  return updateWatch(id, (watch) => ({
    ...watch,
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function snoozeWatch(id, minutes) {
  const dueAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  return updateWatch(id, (watch) => ({
    ...watch,
    status: "pending",
    dueAt,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteWatch(id) {
  const state = await readState();
  const nextWatches = state.watches.filter((watch) => watch.id !== id);

  if (nextWatches.length === state.watches.length) {
    return null;
  }

  state.watches = nextWatches;
  await writeState(state);
  return { id };
}

async function updateWatch(id, updater) {
  const state = await readState();
  let updated = null;

  state.watches = state.watches.map((watch) => {
    if (watch.id !== id) {
      return watch;
    }

    updated = updater(watch);
    return updated;
  });

  if (updated === null) {
    return null;
  }

  await writeState(state);
  return updated;
}

async function readState() {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      watches: Array.isArray(parsed.watches) ? parsed.watches : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { watches: [] };
    }

    throw error;
  }
}

async function writeState(state) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function sortWatches(watches) {
  return [...watches].sort((a, b) => {
    if (a.status !== b.status) {
      return statusRank(a.status) - statusRank(b.status);
    }

    return Date.parse(a.dueAt) - Date.parse(b.dueAt);
  });
}

function statusRank(status) {
  if (status === "due") {
    return 0;
  }

  if (status === "pending") {
    return 1;
  }

  return 2;
}
