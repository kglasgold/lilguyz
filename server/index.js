import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifyWithLLM, classifyRegex, extractAssignee, extractDescription, extractTitle, isReminderInstruction } from "./classify.js";
import { callLLM, isLLMConfigured } from "./llm.js";
import { fetchOpenPRs } from "./github.js";
import { fetchGranolaNotes, handleGranolaInstruction, isConfigured as granolaConfigured } from "./granola.js";
import { createIssue, fetchMyIssues, isConfigured as linearConfigured, updateIssueAssignee, updateIssueStatus } from "./linear.js";
import { handleLinearAction } from "./linearActions.js";
import { handleNoteInstruction } from "./notesGuy.js";
import { parseWatchInstruction } from "./parseWatch.js";
import { addSubNote, createNoteTheme, deleteNoteTheme, deleteSubNote, listNoteThemes } from "./noteStore.js";
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

app.get("/api/greeting", async (_request, response, next) => {
  try {
    if (!isLLMConfigured()) {
      response.json({ greeting: null, llm: false });
      return;
    }
    const seed = Math.floor(Math.random() * 99999);
    const greeting = await callLLM(
      `You generate fun, quirky placeholder text for a task input field. Each must be wildly different in tone, style, and vocabulary. Under 8 words. No quotes. No period at the end. Lowercase.

Never repeat these — they're already used:
- what's cooking in that brain of yours
- tell me what to track
- drop a task on me boss
- what needs wrangling today
- what are you noodling on

Go weird. Be funny. Surprise me.`,
      `seed: ${seed} — generate one completely new placeholder`,
    );
    response.json({ greeting: greeting?.trim() || null, llm: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/issues", async (request, response, next) => {
  try {
    response.set("Cache-Control", "no-store");

    if (!linearConfigured()) {
      response.json({ issues: [], configured: false, syncedAt: new Date().toISOString(), statusCounts: {} });
      return;
    }
    const issues = await fetchMyIssues({ force: request.query.refresh === "1" });
    response.json({ issues, configured: true, syncedAt: new Date().toISOString(), statusCounts: countIssueStatuses(issues) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/issues", async (request, response, next) => {
  try {
    if (!linearConfigured()) {
      response.status(400).json({ error: "LINEAR_API_KEY is not configured" });
      return;
    }

    const title = request.body?.title;
    const description = request.body?.description;
    const status = request.body?.status;

    if (typeof title !== "string" || !title.trim()) {
      response.status(400).json({ error: "title is required" });
      return;
    }

    if (description !== undefined && typeof description !== "string") {
      response.status(400).json({ error: "description must be a string" });
      return;
    }

    if (status !== undefined && typeof status !== "string") {
      response.status(400).json({ error: "status must be a string" });
      return;
    }

    const issue = await createIssue(title.trim(), description?.trim() || null, "me", status?.trim() || "Todo");
    if (!issue) {
      response.status(500).json({ error: "Linear issue creation failed" });
      return;
    }

    const issues = await fetchMyIssues({ force: true });
    response.status(201).json({ issue, issues, statusCounts: countIssueStatuses(issues), syncedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/issues/:identifier/status", async (request, response, next) => {
  try {
    if (!linearConfigured()) {
      response.status(400).json({ error: "LINEAR_API_KEY is not configured" });
      return;
    }

    const status = request.body?.status;
    if (typeof status !== "string" || !status.trim()) {
      response.status(400).json({ error: "status is required" });
      return;
    }

    const linearAction = await updateIssueStatus(request.params.identifier, status);
    const issues = await fetchMyIssues({ force: true });
    response.json({ linearAction, issues, statusCounts: countIssueStatuses(issues), syncedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/issues/:identifier/assignee", async (request, response, next) => {
  try {
    if (!linearConfigured()) {
      response.status(400).json({ error: "LINEAR_API_KEY is not configured" });
      return;
    }

    const assignee = request.body?.assignee;
    if (assignee !== null && typeof assignee !== "string") {
      response.status(400).json({ error: "assignee must be a string or null" });
      return;
    }

    const linearAction = await updateIssueAssignee(request.params.identifier, assignee);
    const issues = await fetchMyIssues({ force: true });
    response.json({ linearAction, issues, statusCounts: countIssueStatuses(issues), syncedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/prs", async (request, response, next) => {
  try {
    response.set("Cache-Control", "no-store");
    const prs = await fetchOpenPRs({ force: request.query.refresh === "1" });
    response.json({ prs, syncedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/granola/notes", async (request, response, next) => {
  try {
    response.set("Cache-Control", "no-store");

    if (!granolaConfigured()) {
      response.json({ notes: [], configured: false, syncedAt: new Date().toISOString() });
      return;
    }

    const notes = await fetchGranolaNotes({ force: request.query.refresh === "1", pageSize: 20 });
    response.json({ notes, configured: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/notes", async (_request, response, next) => {
  try {
    const themes = await listNoteThemes();
    response.json({ themes });
  } catch (error) {
    next(error);
  }
});

app.post("/api/notes", async (request, response, next) => {
  try {
    const title = request.body?.title;
    const body = request.body?.body;

    if (typeof title !== "string" || !title.trim()) {
      response.status(400).json({ error: "title is required" });
      return;
    }

    if (body !== undefined && typeof body !== "string") {
      response.status(400).json({ error: "body must be a string" });
      return;
    }

    const theme = await createNoteTheme(title, body?.trim() || null);
    const themes = await listNoteThemes();
    response.status(201).json({ theme, themes });
  } catch (error) {
    next(error);
  }
});

app.post("/api/notes/:themeId/notes", async (request, response, next) => {
  try {
    const body = request.body?.body;

    if (typeof body !== "string" || !body.trim()) {
      response.status(400).json({ error: "note body is required" });
      return;
    }

    const theme = await addSubNote(request.params.themeId, body);
    if (!theme) {
      response.status(404).json({ error: "note theme not found" });
      return;
    }

    const themes = await listNoteThemes();
    response.status(201).json({ theme, themes });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/notes/:themeId", async (request, response, next) => {
  try {
    const deleted = await deleteNoteTheme(request.params.themeId);

    if (!deleted) {
      response.status(404).json({ error: "note theme not found" });
      return;
    }

    const themes = await listNoteThemes();
    response.json({ deleted, themes });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/notes/:themeId/notes/:noteId", async (request, response, next) => {
  try {
    const deleted = await deleteSubNote(request.params.themeId, request.params.noteId);

    if (!deleted) {
      response.status(404).json({ error: "note not found" });
      return;
    }

    const themes = await listNoteThemes();
    response.json({ deleted, themes });
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

    const llmResult = await classifyWithLLM(instruction);
    const agent = llmResult?.agent || classifyRegex(instruction);
    if (!agent || (agent === "watcher" && !isReminderInstruction(instruction))) {
      response.status(400).json({ error: "I can only send Jared explicit reminders like \"remind me to...\"." });
      return;
    }
    const title = llmResult?.title || extractTitle(instruction);
    const assignee = llmResult?.assignee || extractAssignee(instruction);
    const description = llmResult?.description || extractDescription(instruction);

    if (agent === "granola") {
      const watches = await listWatches();
      const counts = await countByAgent();
      const usedLLM = Boolean(llmResult);

      if (!granolaConfigured()) {
        response.status(201).json({
          agent,
          granolaConfigured: false,
          granolaNotes: [],
          granolaResult: null,
          usedLLM,
          watches,
          counts,
          watch: null,
        });
        return;
      }

      const granolaResult = await handleGranolaInstruction(instruction);
      const granolaNotes = granolaResult.notes || await fetchGranolaNotes();
      response.status(201).json({
        agent,
        granolaConfigured: true,
        granolaNotes,
        granolaResult,
        usedLLM,
        watches,
        counts,
        watch: null,
      });
      return;
    }

    if (agent === "notes") {
      const noteResult = await handleNoteInstruction(instruction);
      const notes = await listNoteThemes();
      const watches = await listWatches();
      const counts = await countByAgent();
      const usedLLM = Boolean(llmResult);

      response.status(201).json({ noteResult, agent, usedLLM, notes, watches, counts, watch: null });
      return;
    }

    if (agent === "linear" && linearConfigured()) {
      const linearAction = await handleLinearAction(instruction);
      if (linearAction) {
        const issues = await fetchMyIssues({ force: true });
        const watches = await listWatches();
        const counts = await countByAgent();

        response.status(200).json({
          linearAction,
          agent,
          linearConfigured: true,
          issues,
          issueStatusCounts: countIssueStatuses(issues),
          watches,
          counts,
          watch: null,
        });
        return;
      }
    }

    const parsed = parseWatchInstruction(instruction, agent);

    let linearIssue = null;
    if (agent === "linear" && linearConfigured()) {
      try {
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
    const usedLLM = Boolean(llmResult);

    response.status(201).json({ watch, agent, linearConfigured: linearConfiguredFlag, usedLLM, watches, counts });
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

    const llmResult = await classifyWithLLM(instruction);
    const agent = llmResult?.agent || classifyRegex(instruction);
    if (!agent || (agent === "watcher" && !isReminderInstruction(instruction))) {
      response.status(400).json({ error: "I can only send Jared explicit reminders like \"remind me to...\"." });
      return;
    }
    const title = llmResult?.title || extractTitle(instruction);
    const assignee = llmResult?.assignee || extractAssignee(instruction);
    const description = llmResult?.description || extractDescription(instruction);

    if (agent === "granola") {
      const watches = await listWatches();
      const counts = await countByAgent();

      if (!granolaConfigured()) {
        response.status(201).json({
          agent,
          granolaConfigured: false,
          granolaNotes: [],
          granolaResult: null,
          watches,
          counts,
          watch: null,
        });
        return;
      }

      const granolaResult = await handleGranolaInstruction(instruction);
      const granolaNotes = granolaResult.notes || await fetchGranolaNotes();
      response.status(201).json({
        agent,
        granolaConfigured: true,
        granolaNotes,
        granolaResult,
        watches,
        counts,
        watch: null,
      });
      return;
    }

    if (agent === "notes") {
      const noteResult = await handleNoteInstruction(instruction);
      const notes = await listNoteThemes();
      const watches = await listWatches();
      const counts = await countByAgent();

      response.status(201).json({ noteResult, agent, notes, watches, counts, watch: null });
      return;
    }

    if (agent === "linear" && linearConfigured()) {
      const linearAction = await handleLinearAction(instruction);
      if (linearAction) {
        const issues = await fetchMyIssues({ force: true });
        const watches = await listWatches();
        const counts = await countByAgent();

        response.status(200).json({
          linearAction,
          agent,
          issues,
          issueStatusCounts: countIssueStatuses(issues),
          watches,
          counts,
          watch: null,
        });
        return;
      }
    }

    const parsed = parseWatchInstruction(instruction, agent);

    let linearIssue = null;
    if (agent === "linear" && linearConfigured()) {
      try {
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

function countIssueStatuses(issues) {
  return issues.reduce((counts, issue) => {
    const type = issue.statusType || "unknown";
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
}

setInterval(() => {
  markDueWatches().catch((error) => {
    console.error("Failed to mark due watches", error);
  });
}, 15 * 1000).unref();

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((_request, response, next) => {
    if (_request.method !== "GET" || _request.path.startsWith("/api")) return next();
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
