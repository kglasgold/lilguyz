import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifyInstruction, extractAssignee, extractDescription, extractTitle } from "./classify.js";
import { fetchOpenPRs } from "./github.js";
import { createIssue, fetchMyIssues, isConfigured as linearConfigured } from "./linear.js";
import { parseWatchInstruction } from "./parseWatch.js";
import {
  countByAgent,
  createWatch,
  deleteWatch,
  listWatches,
  markDueWatches,
  resolveWatch,
  snoozeWatch,
} from "./watchStore.js";

const app = express();
const port = Number(process.env.PORT || 5184);
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, "dist");

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/issues", async (_request, response, next) => {
  try {
    if (!linearConfigured()) {
      response.json({ issues: [], configured: false });
      return;
    }
    const issues = await fetchMyIssues();
    response.json({ issues, configured: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/prs", async (_request, response, next) => {
  try {
    const prs = await fetchOpenPRs();
    response.json({ prs });
  } catch (error) {
    next(error);
  }
});

app.get("/api/watches", async (request, response, next) => {
  try {
    await markDueWatches();
    const agent = request.query.agent || undefined;
    const watches = await listWatches(agent);
    const counts = await countByAgent();
    response.json({ watches, counts });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", async (request, response, next) => {
  try {
    const instruction = request.body?.instruction;

    if (typeof instruction !== "string" || !instruction.trim()) {
      response.status(400).json({ error: "instruction is required" });
      return;
    }

    const agent = classifyInstruction(instruction);
    const parsed = parseWatchInstruction(instruction, agent);

    let linearIssue = null;
    if (agent === "linear" && linearConfigured()) {
      try {
        const title = extractTitle(instruction);
        const assignee = extractAssignee(instruction);
        const description = extractDescription(instruction);
        linearIssue = await createIssue(title, description, assignee);
      } catch (err) {
        console.error("Linear issue creation failed:", err.message);
      }
    } else if (agent === "linear" && !linearConfigured()) {
      console.warn("LINEAR_API_KEY not set — skipping issue creation");
    }

    if (linearIssue) {
      parsed.linearIssue = linearIssue;
      parsed.subject = linearIssue.identifier;
    }

    const watch = await createWatch(parsed);
    const watches = await listWatches();
    const counts = await countByAgent();
    const linearConfiguredFlag = linearConfigured();

    response.status(201).json({ watch, agent, linearConfigured: linearConfiguredFlag, watches, counts });
  } catch (error) {
    next(error);
  }
});

// Keep legacy endpoint working
app.post("/api/watches", async (request, response, next) => {
  try {
    const instruction = request.body?.instruction;

    if (typeof instruction !== "string") {
      response.status(400).json({ error: "instruction is required" });
      return;
    }

    const agent = classifyInstruction(instruction);
    const parsed = parseWatchInstruction(instruction, agent);

    let linearIssue = null;
    if (agent === "linear" && linearConfigured()) {
      try {
        const title = extractTitle(instruction);
        const assignee = extractAssignee(instruction);
        const description = extractDescription(instruction);
        linearIssue = await createIssue(title, description, assignee);
      } catch (err) {
        console.error("Linear issue creation failed:", err.message);
      }
    }

    if (linearIssue) {
      parsed.linearIssue = linearIssue;
      parsed.subject = linearIssue.identifier;
    }

    const watch = await createWatch(parsed);
    const watches = await listWatches();
    const counts = await countByAgent();

    response.status(201).json({ watch, agent, watches, counts });
  } catch (error) {
    next(error);
  }
});

app.post("/api/watches/:id/resolve", async (request, response, next) => {
  try {
    const watch = await resolveWatch(request.params.id);

    if (!watch) {
      response.status(404).json({ error: "watch not found" });
      return;
    }

    const watches = await listWatches();
    const counts = await countByAgent();
    response.json({ watch, watches, counts });
  } catch (error) {
    next(error);
  }
});

app.post("/api/watches/:id/snooze", async (request, response, next) => {
  try {
    const minutes = Number(request.body?.minutes ?? 60);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      response.status(400).json({ error: "minutes must be positive" });
      return;
    }

    const watch = await snoozeWatch(request.params.id, minutes);

    if (!watch) {
      response.status(404).json({ error: "watch not found" });
      return;
    }

    const watches = await listWatches();
    const counts = await countByAgent();
    response.json({ watch, watches, counts });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/watches/:id", async (request, response, next) => {
  try {
    const deleted = await deleteWatch(request.params.id);

    if (!deleted) {
      response.status(404).json({ error: "watch not found" });
      return;
    }

    const watches = await listWatches();
    const counts = await countByAgent();
    response.json({ deleted, watches, counts });
  } catch (error) {
    next(error);
  }
});

setInterval(() => {
  markDueWatches().catch((error) => {
    console.error("Failed to mark due watches", error);
  });
}, 15 * 1000).unref();

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_request, response) => {
    response.sendFile(join(distDir, "index.html"));
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    error: error instanceof Error ? error.message : "Unknown server error",
  });
});

export function startServer() {
  return new Promise((resolve) => {
    app.listen(port, "127.0.0.1", () => {
      console.log(`lilguyz listening on http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

const isMain = !process.argv[1]?.includes("electron");
if (isMain) {
  startServer();
}
