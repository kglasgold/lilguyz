import { callLLMJson, isLLMConfigured } from "./llm.js";
import { addSubNote, createNoteTheme, findThemeByTitle, listNoteThemes } from "./noteStore.js";

const NOTES_PROMPT = `You help Notes Guy decide how to store a user's note instruction.

Existing note themes are provided in the user message. Return JSON with:
- "action": either "create_theme", "add_note", or "search_notes"
- "themeTitle": the note theme title to create or add to
- "noteText": the note body to store, or null if the user is only creating an empty theme
- "searchQuery": the topic to search saved notes for, or null unless action is "search_notes"

Rules:
- A theme is a broad bucket, project, topic, person, or recurring area.
- A sub note is a detail, update, reminder, fact, link, decision, or observation inside an existing theme.
- If the prompt asks what the user said, remembered, wrote, noted, or knows about a topic, use "search_notes".
- If the prompt asks to start, create, open, set up, or track a new area, use "create_theme".
- If the prompt mentions adding, appending, noting, remembering, or recording a detail under an existing theme, use "add_note".
- Prefer an existing theme when the prompt clearly refers to one by exact or close name.
- Return ONLY valid JSON, no explanation.`;

export async function handleNoteInstruction(instruction) {
  const themes = await listNoteThemes();
  const decision = (await classifyNoteInstruction(instruction, themes)) || classifyNoteFallback(instruction, themes);
  if (decision.action === "search_notes") {
    const query = decision.searchQuery || decision.themeTitle || extractSearchQuery(instruction);
    const results = searchNotes(themes, query);
    return { action: "search_notes", query, results, answer: answerSearch(query, results) };
  }

  const themeTitle = decision.themeTitle || extractThemeTitle(instruction) || "General notes";
  const noteText =
    decision.noteText ||
    (decision.action === "add_note" ? extractNoteText(instruction, themeTitle) : extractExplicitNoteText(instruction));

  if (decision.action === "add_note") {
    const existingTheme = findThemeByTitle(themes, themeTitle);
    if (existingTheme) {
      const theme = await addSubNote(existingTheme.id, noteText || instruction.trim());
      return { action: "add_note", theme, createdTheme: false };
    }

    const theme = await createNoteTheme(themeTitle, noteText || instruction.trim());
    return { action: "create_theme", theme, createdTheme: true };
  }

  const theme = await createNoteTheme(themeTitle, noteText);
  return { action: "create_theme", theme, createdTheme: true };
}

async function classifyNoteInstruction(instruction, themes) {
  if (!isLLMConfigured()) return null;

  const existingThemes = themes.length
    ? themes.map((theme) => `- ${theme.title}`).join("\n")
    : "(none)";

  let result = null;
  try {
    result = await callLLMJson(
      NOTES_PROMPT,
      `Existing themes:\n${existingThemes}\n\nPrompt:\n${instruction}`,
    );
  } catch (error) {
    console.error("Notes Guy classify failed:", error.message);
    return null;
  }

  if (!result || !["create_theme", "add_note", "search_notes"].includes(result.action)) {
    return null;
  }

  return {
    action: result.action,
    themeTitle: typeof result.themeTitle === "string" ? result.themeTitle.trim() : null,
    noteText: typeof result.noteText === "string" ? result.noteText.trim() : null,
    searchQuery: typeof result.searchQuery === "string" ? result.searchQuery.trim() : null,
  };
}

function classifyNoteFallback(instruction, themes) {
  const themeTitle = extractThemeTitle(instruction);
  const existingTheme = findThemeByTitle(themes, themeTitle);
  const searchPattern = /\b(?:what|where|find|search|show|tell)\b.*\b(?:say|said|note|notes|remember|wrote|know|mention|love|loved|like|liked|about)\b/i;
  const createPattern = /\b(?:create|start|open|make|set\s*up|track)\b.*\b(?:theme|topic|note|notes|doc|docs)\b/i;
  const addPattern = /\b(?:add|append|note|remember|record|save)\b/i;

  if (searchPattern.test(instruction)) {
    return {
      action: "search_notes",
      searchQuery: extractSearchQuery(instruction),
    };
  }

  if (!existingTheme && createPattern.test(instruction)) {
    return {
      action: "create_theme",
      themeTitle,
      noteText: extractExplicitNoteText(instruction),
    };
  }

  if (existingTheme || addPattern.test(instruction)) {
    return {
      action: "add_note",
      themeTitle: existingTheme?.title || themeTitle,
      noteText: extractNoteText(instruction, existingTheme?.title || themeTitle),
    };
  }

  return {
    action: "create_theme",
    themeTitle,
    noteText: extractExplicitNoteText(instruction),
  };
}

function extractThemeTitle(instruction) {
  const text = instruction.trim();
  const titleMatch = text.match(/\b(?:theme|topic|note|notes|doc|docs)\s+(?:for|about|called|named)\s+(.+?)(?:\s+(?:with|and|that|to)\b|$)/i);
  if (titleMatch?.[1]) return cleanTitle(titleMatch[1]);

  const underMatch = text.match(/\b(?:to|under|in|into|for)\s+(.+?)(?:\s*[:.-]\s*|\s+(?:that|with)\b|$)/i);
  if (underMatch?.[1]) return cleanTitle(underMatch[1]);

  return cleanTitle(text.replace(/^(?:create|start|add|open|make|save|note|remember|record)\s+(?:a\s+)?(?:new\s+)?/i, ""));
}

function extractNoteText(instruction, themeTitle) {
  const text = instruction.trim();
  const explicitText = extractExplicitNoteText(instruction);
  if (explicitText) return explicitText;

  const withoutTheme = themeTitle ? text.replace(new RegExp(escapeRegExp(themeTitle), "i"), "").trim() : text;
  return withoutTheme.replace(/^(?:add|append|note|remember|record|save)\s+/i, "").trim() || null;
}

function extractExplicitNoteText(instruction) {
  const text = instruction.trim();
  const afterSeparator = text.match(/[:.-]\s+(.+)$/);
  if (afterSeparator?.[1]) return afterSeparator[1].trim();

  const withMatch = text.match(/\b(?:with|that|saying)\s+(.+)$/i);
  if (withMatch?.[1]) return withMatch[1].trim();

  return null;
}

function extractSearchQuery(instruction) {
  const text = instruction.trim();
  const aboutMatch = text.match(/\babout\s+(.+?)\??$/i);
  if (aboutMatch?.[1]) return cleanSearchQuery(aboutMatch[1]);

  return cleanSearchQuery(
    text.replace(/\b(?:what|did|do|i|we|say|said|note|notes|remember|wrote|know|find|search|show|tell|me|about)\b/gi, ""),
  );
}

function searchNotes(themes, query) {
  const queryWords = searchWords(query);
  if (queryWords.length === 0) return [];

  return themes
    .map((theme) => {
      const themeWords = searchWords(theme.title);
      const matchingNotes = theme.notes
        .map((note) => ({ note, score: scoreText(note.body, queryWords) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      const themeScore = scoreWords(themeWords, queryWords) + matchingNotes.reduce((total, match) => total + match.score, 0);

      return {
        theme,
        score: themeScore,
        matchingNotes,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ theme, matchingNotes }) => ({
      themeId: theme.id,
      themeTitle: theme.title,
      notes: matchingNotes.length
        ? matchingNotes.map(({ note }) => note)
        : theme.notes.slice(0, 3),
    }));
}

function answerSearch(query, results) {
  const firstNote = results[0]?.notes?.[0]?.body;
  if (firstNote) return firstNote;
  return `I do not have anything saved about ${query} yet.`;
}

function scoreText(text, queryWords) {
  return scoreWords(searchWords(text), queryWords);
}

function scoreWords(words, queryWords) {
  if (words.length === 0) return 0;
  const wordSet = new Set(words);
  return queryWords.reduce((score, word) => score + (wordSet.has(word) ? 1 : 0), 0);
}

function searchWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 2);
}

function cleanSearchQuery(query) {
  return String(query || "").trim().replace(/[?.!]+$/, "");
}

function cleanTitle(title) {
  return String(title || "General notes")
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(/^(?:a|an|the)\s+/i, "") || "General notes";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
