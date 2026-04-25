import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = process.env.ASSISTANT_BOT_DATA || `${rootDir}/data`;
const storePath = `${dataDir}/notes.json`;

export async function listNoteThemes() {
  const state = await readState();
  return sortThemes(state.themes);
}

export async function createNoteTheme(title, body) {
  const now = new Date().toISOString();
  const theme = {
    id: crypto.randomUUID(),
    title: cleanTitle(title),
    createdAt: now,
    updatedAt: now,
    notes: [],
  };

  if (body) {
    theme.notes.push(createSubNote(body, now));
  }

  const state = await readState();
  state.themes.push(theme);
  await writeState(state);
  return theme;
}

export async function addSubNote(themeId, body) {
  const state = await readState();
  const now = new Date().toISOString();
  let updatedTheme = null;

  state.themes = state.themes.map((theme) => {
    if (theme.id !== themeId) {
      return theme;
    }

    updatedTheme = {
      ...theme,
      updatedAt: now,
      notes: [...theme.notes, createSubNote(body, now)],
    };
    return updatedTheme;
  });

  if (!updatedTheme) {
    return null;
  }

  await writeState(state);
  return updatedTheme;
}

export async function deleteNoteTheme(themeId) {
  const state = await readState();
  const nextThemes = state.themes.filter((theme) => theme.id !== themeId);

  if (nextThemes.length === state.themes.length) {
    return null;
  }

  state.themes = nextThemes;
  await writeState(state);
  return { id: themeId };
}

export async function deleteSubNote(themeId, noteId) {
  const state = await readState();
  const now = new Date().toISOString();
  let deleted = null;

  state.themes = state.themes.map((theme) => {
    if (theme.id !== themeId) {
      return theme;
    }

    const nextNotes = theme.notes.filter((note) => note.id !== noteId);
    if (nextNotes.length === theme.notes.length) {
      return theme;
    }

    deleted = { id: noteId };
    return {
      ...theme,
      notes: nextNotes,
      updatedAt: now,
    };
  });

  if (!deleted) {
    return null;
  }

  await writeState(state);
  return deleted;
}

export function findThemeByTitle(themes, title) {
  if (!title) return null;
  const normalizedTitle = normalize(title);

  return (
    themes.find((theme) => normalize(theme.title) === normalizedTitle) ||
    themes.find((theme) => normalize(theme.title).includes(normalizedTitle)) ||
    themes.find((theme) => normalizedTitle.includes(normalize(theme.title))) ||
    null
  );
}

function createSubNote(body, now) {
  return {
    id: crypto.randomUUID(),
    body: cleanBody(body),
    createdAt: now,
  };
}

function cleanTitle(title) {
  return String(title || "General notes").trim().replace(/[.!?]+$/, "") || "General notes";
}

function cleanBody(body) {
  return String(body || "").trim();
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function readState() {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      themes: Array.isArray(parsed.themes)
        ? parsed.themes.map((theme) => ({ ...theme, notes: Array.isArray(theme.notes) ? theme.notes : [] }))
        : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { themes: [] };
    }

    throw error;
  }
}

async function writeState(state) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function sortThemes(themes) {
  return [...themes].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
