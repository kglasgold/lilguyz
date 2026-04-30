const GRANOLA_API_URL = "https://public-api.granola.ai";
const NOTES_CACHE_TTL = 30_000;
const NOTE_DETAIL_CACHE_TTL = 5 * 60_000;

let notesCache = null;
let notesLastFetch = 0;
const noteDetailCache = new Map();

export function isConfigured() {
  return Boolean(process.env.GRANOLA_API_KEY);
}

export async function fetchGranolaNotes(options = {}) {
  const now = Date.now();
  if (!options.force && notesCache && now - notesLastFetch < NOTES_CACHE_TTL) {
    return notesCache;
  }

  const params = new URLSearchParams();
  params.set("page_size", String(options.pageSize || 10));
  if (options.createdAfter) params.set("created_after", options.createdAfter);
  if (options.createdBefore) params.set("created_before", options.createdBefore);
  if (options.updatedAfter) params.set("updated_after", options.updatedAfter);
  if (options.cursor) params.set("cursor", options.cursor);

  const payload = await requestGranola(`/v1/notes?${params.toString()}`);
  const notes = (payload.notes || []).map(normalizeNoteSummary);

  notesCache = notes;
  notesLastFetch = now;
  return notes;
}

export async function getGranolaNote(noteId, options = {}) {
  const cacheKey = `${noteId}:${options.includeTranscript ? "transcript" : "summary"}`;
  const cached = noteDetailCache.get(cacheKey);
  const now = Date.now();
  if (!options.force && cached && now - cached.fetchedAt < NOTE_DETAIL_CACHE_TTL) {
    return cached.note;
  }

  const params = new URLSearchParams();
  if (options.includeTranscript) params.set("include", "transcript");

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const payload = await requestGranola(`/v1/notes/${encodeURIComponent(noteId)}${suffix}`);
  const note = normalizeNoteDetail(payload);
  noteDetailCache.set(cacheKey, { note, fetchedAt: now });
  return note;
}

export async function handleGranolaInstruction(instruction) {
  const query = extractGranolaSearchQuery(instruction);
  const notes = await fetchGranolaNotes({ force: true, pageSize: 20 });

  if (!query) {
    return {
      action: "list_granola_notes",
      notes,
      answer: notes.length
        ? `I found ${notes.length} recent Granola notes.`
        : "I did not find any Granola notes yet.",
    };
  }

  const details = await Promise.all(
    notes.slice(0, 15).map(async (note) => {
      try {
        return await getGranolaNote(note.id, { includeTranscript: true });
      } catch (error) {
        return { ...note, summary: "", transcript: [], transcriptText: "" };
      }
    }),
  );
  const results = searchGranolaDetails(details, query);

  return {
    action: "search_granola_notes",
    query,
    results,
    answer: answerGranolaSearch(query, results),
  };
}

function normalizeNoteSummary(note) {
  return {
    id: note.id,
    title: note.title || "Untitled meeting",
    ownerName: note.owner?.name || null,
    ownerEmail: note.owner?.email || null,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

function normalizeNoteDetail(note) {
  const transcript = Array.isArray(note.transcript)
    ? note.transcript.map((item, index) => ({
        id: `${note.id}-transcript-${index}`,
        speaker: item.speaker?.name || item.speaker?.diarization_label || item.speaker?.source || "Speaker",
        text: item.text || "",
      }))
    : [];

  return {
    ...normalizeNoteSummary(note),
    summary: note.summary || "",
    transcript,
    transcriptText: transcript.map((item) => item.text).join("\n"),
  };
}

async function requestGranola(path) {
  const key = process.env.GRANOLA_API_KEY;
  if (!key) {
    throw new Error("GRANOLA_API_KEY is not configured");
  }

  const response = await fetch(`${GRANOLA_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(granolaErrorMessage(response.status, payload));
  }

  return payload || {};
}

function granolaErrorMessage(status, payload) {
  const detail = payload?.error?.message || payload?.message || payload?.error;
  if (status === 401) return "Granola API key was rejected";
  if (status === 404) return "Granola note was not found";
  if (status === 429) return "Granola API rate limit hit";
  return detail || "Granola API request failed";
}

function extractGranolaSearchQuery(instruction) {
  const text = instruction.trim();
  const aboutMatch = text.match(/\babout\s+(.+?)\??$/i);
  if (aboutMatch?.[1]) return cleanQuery(aboutMatch[1]);

  const quotedMatch = text.match(/["“](.+?)["”]/);
  if (quotedMatch?.[1]) return cleanQuery(quotedMatch[1]);

  const cleaned = text.replace(
    /\b(?:granola|goblin|gremlin|find|search|show|tell|what|where|when|did|do|i|we|meeting|meetings|note|notes|transcript|summary|recap|say|said|mention|mentioned|discuss|discussed|talk|talked|about|for|me|the|a|an)\b/gi,
    " ",
  );
  return cleanQuery(cleaned);
}

function searchGranolaDetails(notes, query) {
  const queryWords = searchWords(query);
  if (queryWords.length === 0) return [];

  return notes
    .map((note) => {
      const haystack = [
        note.title,
        note.summary,
        note.transcriptText,
        note.ownerName,
        note.ownerEmail,
      ].join("\n");
      const score = scoreText(haystack, queryWords);
      return {
        ...note,
        score,
        excerpt: excerptFor(note, queryWords),
      };
    })
    .filter((note) => note.score > 0)
    .sort((a, b) => b.score - a.score || dateValue(b.updatedAt) - dateValue(a.updatedAt))
    .slice(0, 5)
    .map(({ score, transcriptText, ...note }) => note);
}

function answerGranolaSearch(query, results) {
  if (results.length === 0) return `I did not find a Granola note about ${query}.`;
  const first = results[0];
  if (first.summary) return first.summary;
  if (first.excerpt) return first.excerpt;
  return `Best match: ${first.title}`;
}

function excerptFor(note, queryWords) {
  const transcriptLine = note.transcript.find((item) => scoreText(item.text, queryWords) > 0);
  if (transcriptLine?.text) return transcriptLine.text;
  if (note.summary) return note.summary;
  return "";
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

function cleanQuery(query) {
  return String(query || "").trim().replace(/\s+/g, " ").replace(/[?.!]+$/, "");
}

function dateValue(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
