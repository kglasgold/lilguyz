import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DANCE_PATTERN = /\bdance\s*party\b/i;
const GROVE_PATTERN = /\bbohemian\s*grove\b/i;
const MURDER_PATTERN = /\bmurder\s*scene\b/i;
const FIGHT_CLUB_PATTERN = /\bfight\s*club\b/i;
const EASTER_EGG_DURATION = 30_000;

const AGENTS = [
  {
    id: "wesley",
    name: "Wesley",
    description: "Dispatches Cursor cloud agents.",
    pixel: "wesley",
  },
  {
    id: "watcher",
    name: "Jared",
    description: "Generic reminders and timers.",
    pixel: "watcher",
  },
  {
    id: "linear",
    name: "Mr. PM",
    description: "Tracks issues and task status.",
    pixel: "linear",
  },
  {
    id: "pr",
    name: "PR Boy",
    description: "Review, CI, and merge blockers.",
    pixel: "pr",
  },
  {
    id: "notes",
    name: "Notes Guy",
    description: "Stores themes with sub notes.",
    pixel: "notes",
  },
  {
    id: "granola",
    name: "Granola Goblin",
    description: "Finds meeting notes and transcripts.",
    pixel: "granola",
  },
];

function PixelSprite({ type, size = 24 }) {
  const s = size;

  const sprites = {
    boss: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="2" y="0" width="4" height="1" fill="#e4e4e7" />
        <rect x="1" y="1" width="6" height="1" fill="#d4d4d8" />
        <rect x="1" y="2" width="6" height="1" fill="#f4f4f5" />
        <rect x="1" y="3" width="1" height="1" fill="#f4f4f5" />
        <rect x="2" y="3" width="1" height="1" fill="#18181b" />
        <rect x="3" y="3" width="2" height="1" fill="#f4f4f5" />
        <rect x="5" y="3" width="1" height="1" fill="#18181b" />
        <rect x="6" y="3" width="1" height="1" fill="#f4f4f5" />
        <rect x="1" y="4" width="6" height="1" fill="#e4e4e7" />
        <rect x="2" y="5" width="4" height="1" fill="#d4d4d8" />
        <rect x="0" y="4" width="1" height="2" fill="#a1a1aa" />
        <rect x="7" y="4" width="1" height="2" fill="#a1a1aa" />
        <rect x="2" y="6" width="4" height="1" fill="#a1a1aa" />
        <rect x="2" y="7" width="1" height="1" fill="#a1a1aa" />
        <rect x="5" y="7" width="1" height="1" fill="#a1a1aa" />
      </svg>
    ),
    watcher: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="2" y="0" width="4" height="1" fill="#a78bfa" />
        <rect x="1" y="1" width="6" height="1" fill="#a78bfa" />
        <rect x="1" y="2" width="6" height="1" fill="#c4b5fd" />
        <rect x="1" y="3" width="1" height="1" fill="#c4b5fd" />
        <rect x="2" y="3" width="1" height="1" fill="#1e1b4b" />
        <rect x="3" y="3" width="2" height="1" fill="#c4b5fd" />
        <rect x="5" y="3" width="1" height="1" fill="#1e1b4b" />
        <rect x="6" y="3" width="1" height="1" fill="#c4b5fd" />
        <rect x="1" y="4" width="6" height="1" fill="#c4b5fd" />
        <rect x="2" y="5" width="4" height="1" fill="#a78bfa" />
        <rect x="1" y="6" width="2" height="1" fill="#a78bfa" />
        <rect x="5" y="6" width="2" height="1" fill="#a78bfa" />
        <rect x="1" y="7" width="1" height="1" fill="#a78bfa" />
        <rect x="6" y="7" width="1" height="1" fill="#a78bfa" />
      </svg>
    ),
    linear: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="3" y="0" width="2" height="1" fill="#60a5fa" />
        <rect x="2" y="1" width="4" height="1" fill="#3b82f6" />
        <rect x="1" y="2" width="6" height="1" fill="#93c5fd" />
        <rect x="1" y="3" width="1" height="1" fill="#93c5fd" />
        <rect x="2" y="3" width="1" height="1" fill="#1e3a5f" />
        <rect x="3" y="3" width="2" height="1" fill="#93c5fd" />
        <rect x="5" y="3" width="1" height="1" fill="#1e3a5f" />
        <rect x="6" y="3" width="1" height="1" fill="#93c5fd" />
        <rect x="1" y="4" width="2" height="1" fill="#93c5fd" />
        <rect x="3" y="4" width="2" height="1" fill="#60a5fa" />
        <rect x="5" y="4" width="2" height="1" fill="#93c5fd" />
        <rect x="2" y="5" width="4" height="1" fill="#3b82f6" />
        <rect x="0" y="5" width="2" height="1" fill="#60a5fa" />
        <rect x="6" y="5" width="2" height="1" fill="#60a5fa" />
        <rect x="1" y="6" width="6" height="1" fill="#3b82f6" />
        <rect x="2" y="7" width="1" height="1" fill="#3b82f6" />
        <rect x="5" y="7" width="1" height="1" fill="#3b82f6" />
      </svg>
    ),
    pr: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="1" y="0" width="2" height="1" fill="#34d399" />
        <rect x="5" y="0" width="2" height="1" fill="#34d399" />
        <rect x="1" y="1" width="6" height="1" fill="#6ee7b7" />
        <rect x="1" y="2" width="6" height="1" fill="#a7f3d0" />
        <rect x="1" y="3" width="1" height="1" fill="#a7f3d0" />
        <rect x="2" y="3" width="2" height="1" fill="#064e3b" />
        <rect x="4" y="3" width="1" height="1" fill="#a7f3d0" />
        <rect x="5" y="3" width="2" height="1" fill="#064e3b" />
        <rect x="1" y="4" width="6" height="1" fill="#6ee7b7" />
        <rect x="3" y="4" width="2" height="1" fill="#34d399" />
        <rect x="2" y="5" width="4" height="1" fill="#34d399" />
        <rect x="2" y="6" width="4" height="1" fill="#6ee7b7" />
        <rect x="3" y="7" width="2" height="1" fill="#6ee7b7" />
      </svg>
    ),
    notes: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="3" y="0" width="2" height="1" fill="#fbbf24" />
        <rect x="2" y="1" width="4" height="1" fill="#f59e0b" />
        <rect x="1" y="2" width="6" height="1" fill="#fcd34d" />
        <rect x="1" y="3" width="1" height="1" fill="#fcd34d" />
        <rect x="2" y="3" width="1" height="1" fill="#78350f" />
        <rect x="3" y="3" width="2" height="1" fill="#fcd34d" />
        <rect x="5" y="3" width="1" height="1" fill="#78350f" />
        <rect x="6" y="3" width="1" height="1" fill="#fcd34d" />
        <rect x="1" y="4" width="6" height="1" fill="#fbbf24" />
        <rect x="2" y="5" width="4" height="1" fill="#f59e0b" />
        <rect x="1" y="5" width="1" height="2" fill="#fbbf24" />
        <rect x="6" y="5" width="1" height="2" fill="#fbbf24" />
        <rect x="2" y="6" width="4" height="1" fill="#f59e0b" />
        <rect x="3" y="7" width="1" height="1" fill="#fbbf24" />
        <rect x="4" y="7" width="1" height="1" fill="#fbbf24" />
      </svg>
    ),
    granola: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="2" y="0" width="4" height="1" fill="#84cc16" />
        <rect x="1" y="1" width="6" height="1" fill="#65a30d" />
        <rect x="1" y="2" width="6" height="1" fill="#bef264" />
        <rect x="1" y="3" width="1" height="1" fill="#bef264" />
        <rect x="2" y="3" width="1" height="1" fill="#1a2e05" />
        <rect x="3" y="3" width="2" height="1" fill="#bef264" />
        <rect x="5" y="3" width="1" height="1" fill="#1a2e05" />
        <rect x="6" y="3" width="1" height="1" fill="#bef264" />
        <rect x="1" y="4" width="6" height="1" fill="#a3e635" />
        <rect x="2" y="5" width="1" height="1" fill="#65a30d" />
        <rect x="3" y="5" width="2" height="1" fill="#bef264" />
        <rect x="5" y="5" width="1" height="1" fill="#65a30d" />
        <rect x="0" y="6" width="2" height="1" fill="#84cc16" />
        <rect x="6" y="6" width="2" height="1" fill="#84cc16" />
        <rect x="2" y="6" width="4" height="1" fill="#65a30d" />
        <rect x="3" y="7" width="2" height="1" fill="#84cc16" />
      </svg>
    ),
    wesley: (
      <svg width={s} height={s} viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="2" y="0" width="4" height="1" fill="#f8fafc" />
        <rect x="1" y="1" width="6" height="1" fill="#e2e8f0" />
        <rect x="1" y="2" width="6" height="1" fill="#f8fafc" />
        <rect x="1" y="3" width="1" height="1" fill="#f8fafc" />
        <rect x="2" y="3" width="1" height="1" fill="#1e293b" />
        <rect x="3" y="3" width="2" height="1" fill="#f8fafc" />
        <rect x="5" y="3" width="1" height="1" fill="#1e293b" />
        <rect x="6" y="3" width="1" height="1" fill="#f8fafc" />
        <rect x="1" y="4" width="6" height="1" fill="#cbd5e1" />
        <rect x="2" y="5" width="4" height="1" fill="#475569" />
        <rect x="0" y="5" width="2" height="1" fill="#94a3b8" />
        <rect x="6" y="5" width="2" height="1" fill="#94a3b8" />
        <rect x="2" y="6" width="4" height="1" fill="#334155" />
        <rect x="2" y="7" width="1" height="1" fill="#64748b" />
        <rect x="5" y="7" width="1" height="1" fill="#64748b" />
      </svg>
    ),
  };

  return (
    <span className="pixelSprite" data-agent={type} style={{ width: s, height: s }}>
      {sprites[type] || sprites.boss}
    </span>
  );
}

const AGENT_COLORS = {
  watcher: "var(--accent)",
  linear: "#3b82f6",
  pr: "#34d399",
  notes: "#f59e0b",
  granola: "#84cc16",
  wesley: "#cbd5e1",
};

const PR_STATUS_LABELS = {
  ready: "Ready to merge",
  approved: "Approved",
  pending: "Review pending",
  changes: "Changes requested",
  failing: "CI failing",
  draft: "Draft",
  open: "Open",
};

const PR_STATUS_COLORS = {
  ready: "#34d399",
  approved: "#34d399",
  pending: "#f59e0b",
  changes: "#ef4444",
  failing: "#ef4444",
  draft: "#5a5a63",
  open: "#8b8b93",
};

const WESLEY_MODEL_LABELS = {
  "composer-2-fast": "Composer 2 fast",
  "gpt-5.5-medium-fast": "GPT 5.5 medium fast",
  "claude-4.6-opus-medium-thinking": "Opus 4.6 medium",
};

export default function App() {
  const [instruction, setInstruction] = useState("");
  const [watches, setWatches] = useState([]);
  const [counts, setCounts] = useState({});
  const [prs, setPrs] = useState([]);
  const [prsLoaded, setPrsLoaded] = useState(false);
  const [prsSyncing, setPrsSyncing] = useState(false);
  const [prsSyncedAt, setPrsSyncedAt] = useState(null);
  const [issues, setIssues] = useState([]);
  const [issuesLoaded, setIssuesLoaded] = useState(false);
  const [issuesSyncing, setIssuesSyncing] = useState(false);
  const [issuesSyncedAt, setIssuesSyncedAt] = useState(null);
  const [issueStatusCounts, setIssueStatusCounts] = useState({});
  const [notes, setNotes] = useState([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [noteSearch, setNoteSearch] = useState(null);
  const [granolaNotes, setGranolaNotes] = useState([]);
  const [granolaLoaded, setGranolaLoaded] = useState(false);
  const [granolaSyncing, setGranolaSyncing] = useState(false);
  const [granolaSyncedAt, setGranolaSyncedAt] = useState(null);
  const [granolaSearch, setGranolaSearch] = useState(null);
  const [granolaConfigured, setGranolaConfigured] = useState(true);
  const [wesleyDispatches, setWesleyDispatches] = useState([]);
  const [wesleyLoaded, setWesleyLoaded] = useState(false);
  const [wesleyConfigured, setWesleyConfigured] = useState(true);
  const [wesleySyncedAt, setWesleySyncedAt] = useState(null);
  const [wesleyModel, setWesleyModel] = useState("composer-2-fast");
  const [wesleyAllowedModels, setWesleyAllowedModels] = useState(["composer-2-fast"]);
  const [wesleyPreview, setWesleyPreview] = useState(null);
  const [wesleyDraft, setWesleyDraft] = useState("");
  const [wesleyAllowCodeChanges, setWesleyAllowCodeChanges] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [message, setMessage] = useState("");
  const [lastAgent, setLastAgent] = useState(null);
  const [agentReaction, setAgentReaction] = useState(null);
  const [linearClarification, setLinearClarification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [agentFilter, setAgentFilter] = useState(null);
  const [forceLanding, setForceLanding] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const prevDueIds = useRef(new Set());
  const [danceParty, setDanceParty] = useState(false);
  const [bohemianGrove, setBohemianGrove] = useState(false);
  const [murderScene, setMurderScene] = useState(false);
  const [fightClub, setFightClub] = useState(false);

  const startDanceParty = useCallback(() => {
    setDanceParty(true);
    setInstruction("");
    setMessage("");
    setTimeout(() => setDanceParty(false), EASTER_EGG_DURATION);
  }, []);

  const startBohemianGrove = useCallback(() => {
    setBohemianGrove(true);
    setInstruction("");
    setMessage("");
    setTimeout(() => setBohemianGrove(false), EASTER_EGG_DURATION);
  }, []);

  const startMurderScene = useCallback(() => {
    setMurderScene(true);
    setInstruction("");
    setMessage("");
    setTimeout(() => setMurderScene(false), EASTER_EGG_DURATION);
  }, []);

  const startFightClub = useCallback(() => {
    setFightClub(true);
    setInstruction("");
    setMessage("");
    setTimeout(() => setFightClub(false), EASTER_EGG_DURATION);
  }, []);

  function triggerAgentReaction(agent, type = "success") {
    if (!agent) return;
    setAgentReaction({ agent, type, key: Date.now() });
    setTimeout(() => setAgentReaction(null), 900);
  }

  const filteredWatches = useMemo(() => {
    if (!agentFilter || agentFilter === "today") return watches;
    return watches.filter((w) => w.agent === agentFilter);
  }, [watches, agentFilter]);

  const dueWatches = useMemo(
    () => filteredWatches.filter((w) => w.status === "due"),
    [filteredWatches],
  );
  const dueWatcherWatches = useMemo(
    () => watches.filter((w) => (w.agent || "watcher") === "watcher" && w.status === "due"),
    [watches],
  );
  const activeWatches = useMemo(
    () => filteredWatches.filter((w) => w.status === "pending"),
    [filteredWatches],
  );
  const resolvedWatches = useMemo(
    () => filteredWatches.filter((w) => w.status === "resolved"),
    [filteredWatches],
  );

  useEffect(() => {
    function refreshAfterWake() {
      void refreshWatches();
      void fetchPRs();
      void fetchIssues({ force: true });
      void fetchNotes();
      void fetchGranolaNotes({ force: true });
      void fetchWesleyDispatches();
      void fetchGreeting();
    }

    refreshAfterWake();
    const interval = setInterval(() => {
      void refreshWatches({ quiet: true });
    }, 10_000);
    const prInterval = setInterval(() => {
      void fetchPRs();
    }, 60_000);
    const issueInterval = setInterval(() => {
      void fetchIssues();
    }, 60_000);
    const granolaInterval = setInterval(() => {
      void fetchGranolaNotes();
    }, 120_000);
    const removeResumeListener = window.lilguyz?.onSystemResume?.(refreshAfterWake);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshAfterWake();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      clearInterval(prInterval);
      clearInterval(issueInterval);
      clearInterval(granolaInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      removeResumeListener?.();
    };
  }, []);

  async function fetchPRs(options = {}) {
    if (options.force) setPrsSyncing(true);
    try {
      const path = options.force ? `/api/prs?refresh=1&t=${Date.now()}` : "/api/prs";
      const payload = await apiGet(path, options.force ? { cache: "no-store" } : undefined);
      setPrs(payload.prs || []);
      setPrsSyncedAt(payload.syncedAt || new Date().toISOString());
      setPrsLoaded(true);
    } catch (err) {
      console.error("Failed to fetch PRs:", err.message);
      if (options.force) setMessage(err.message);
    } finally {
      if (options.force) setPrsSyncing(false);
    }
  }

  async function fetchGreeting() {
    try {
      const payload = await apiGet("/api/greeting");
      if (payload.greeting) setGreeting(payload.greeting);
    } catch {}
  }

  async function fetchIssues(options = {}) {
    if (options.force) setIssuesSyncing(true);
    try {
      const path = options.force ? `/api/issues?refresh=1&t=${Date.now()}` : "/api/issues";
      const payload = await apiGet(path, options.force ? { cache: "no-store" } : undefined);
      setIssues(payload.issues || []);
      setIssuesLoaded(true);
      setIssuesSyncedAt(payload.syncedAt || new Date().toISOString());
      setIssueStatusCounts(payload.statusCounts || {});
    } catch (err) {
      console.error("Failed to fetch issues:", err.message);
      if (options.force) setMessage(err.message);
    } finally {
      if (options.force) setIssuesSyncing(false);
    }
  }

  async function fetchNotes() {
    try {
      const payload = await apiGet("/api/notes");
      setNotes(payload.themes || []);
      setNotesLoaded(true);
    } catch (err) {
      console.error("Failed to fetch notes:", err.message);
    }
  }

  async function fetchGranolaNotes(options = {}) {
    if (options.force) setGranolaSyncing(true);
    try {
      const path = options.force ? `/api/granola/notes?refresh=1&t=${Date.now()}` : "/api/granola/notes";
      const payload = await apiGet(path, options.force ? { cache: "no-store" } : undefined);
      setGranolaNotes(payload.notes || []);
      setGranolaConfigured(payload.configured !== false);
      setGranolaLoaded(true);
      setGranolaSyncedAt(payload.syncedAt || new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch Granola notes:", err.message);
      if (options.force) setMessage(err.message);
    } finally {
      if (options.force) setGranolaSyncing(false);
    }
  }

  async function fetchWesleyDispatches() {
    try {
      const payload = await apiGet("/api/wesley/dispatches");
      setWesleyDispatches(payload.dispatches || []);
      setWesleyConfigured(payload.configured !== false);
      if (payload.allowedModels) setWesleyAllowedModels(payload.allowedModels);
      if (payload.model) setWesleyModel(payload.model);
      setWesleyLoaded(true);
      setWesleySyncedAt(payload.syncedAt || new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch Wesley dispatches:", err.message);
    }
  }

  async function refreshWatches(options = {}) {
    try {
      const payload = await apiGet("/api/watches");
      setWatches(payload.watches);
      setCounts(payload.counts || {});

      const currentDue = payload.watches.filter((w) => w.status === "due");
      const newlyDue = currentDue.filter((w) => !prevDueIds.current.has(w.id));
      prevDueIds.current = new Set(currentDue.map((w) => w.id));

      if (!initialLoad && newlyDue.length > 0) {
        const newNotifs = newlyDue.map((w) => ({
          id: w.id,
          subject: w.subject,
          instruction: w.instruction,
          agent: w.agent,
        }));
        setNotifications((prev) => [...prev, ...newNotifs]);
        newlyDue
          .filter((w) => (w.agent || "watcher") === "watcher")
          .forEach((w) => {
            window.lilguyz?.notifyJared?.({
              title: "Jared reminder",
              body: w.instruction || w.subject || "Reminder due",
            });
          });
      }

      setInitialLoad(false);
      if (!options.quiet) setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    if (!instruction.trim()) return;

    if (DANCE_PATTERN.test(instruction)) {
      startDanceParty();
      return;
    }

    if (GROVE_PATTERN.test(instruction)) {
      startBohemianGrove();
      return;
    }

    if (MURDER_PATTERN.test(instruction)) {
      startMurderScene();
      return;
    }

    if (FIGHT_CLUB_PATTERN.test(instruction)) {
      startFightClub();
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const requestBody = { instruction: instruction.trim() };
      if (wesleyModel.trim()) requestBody.model = wesleyModel.trim();
      const payload = await apiPost("/api/tasks", requestBody);
      if (payload.notes) {
        setNotes(payload.notes);
        setNotesLoaded(true);
      }
      if (payload.granolaNotes) {
        setGranolaNotes(payload.granolaNotes);
        setGranolaLoaded(true);
        setGranolaSyncedAt(new Date().toISOString());
      }
      if (payload.granolaConfigured !== undefined) {
        setGranolaConfigured(payload.granolaConfigured);
      }
      if (payload.wesleyDispatches) {
        setWesleyDispatches(payload.wesleyDispatches);
        setWesleyLoaded(true);
        setWesleySyncedAt(new Date().toISOString());
      }
      if (payload.wesleyAllowedModels) setWesleyAllowedModels(payload.wesleyAllowedModels);
      if (payload.wesleyModel) setWesleyModel(payload.wesleyModel);
      if (payload.wesleyConfigured !== undefined) {
        setWesleyConfigured(payload.wesleyConfigured);
      }
      if (payload.wesleyPreview) {
        setWesleyPreview({ ...payload.wesleyPreview, instruction: instruction.trim() });
      } else if (payload.agent === "wesley" && payload.wesleyDispatch) {
        setWesleyPreview(null);
      }
      if (payload.granolaResult?.action === "search_granola_notes") {
        setGranolaSearch(payload.granolaResult);
      } else if (payload.agent === "granola") {
        setGranolaSearch(null);
      }
      if (payload.noteResult?.action === "search_notes") {
        setNoteSearch(payload.noteResult);
      } else if (payload.agent === "notes") {
        setNoteSearch(null);
      }
      if (payload.issues) {
        setIssues(payload.issues);
        setIssuesLoaded(true);
        setIssuesSyncedAt(new Date().toISOString());
      }
      if (payload.issueStatusCounts) {
        setIssueStatusCounts(payload.issueStatusCounts);
      }
      setWatches(payload.watches);
      setCounts(payload.counts || {});
      setInstruction("");
      setForceLanding(false);
      const agentName = AGENTS.find((a) => a.id === payload.agent)?.name || payload.agent;
      setLastAgent(payload.agent);
      if (payload.agent === "linear" && payload.watch?.linearIssue) {
        setMessage(`${agentName} created ${payload.watch.linearIssue.identifier}`);
        setLinearClarification(null);
      } else if (payload.agent === "linear" && payload.linearAction) {
        setAgentFilter("linear");
        if (payload.linearAction.action === "clarify_issue") {
          setLinearClarification(payload.linearAction);
        } else {
          setLinearClarification(null);
        }
        setMessage(formatLinearActionMessage(agentName, payload.linearAction));
      } else if (payload.agent === "linear" && !payload.linearConfigured) {
        setMessage(`${agentName} picked this up (no Linear key)`);
      } else if (payload.agent === "notes") {
        setAgentFilter("notes");
        setMessage(formatNoteMessage(agentName, payload.noteResult));
      } else if (payload.agent === "granola") {
        setAgentFilter("granola");
        setMessage(formatGranolaMessage(agentName, payload));
      } else if (payload.agent === "wesley") {
        setAgentFilter("wesley");
        setMessage(formatWesleyMessage(agentName, payload));
      } else {
        setMessage(`${agentName} picked this up`);
      }
      triggerAgentReaction(payload.agent, "success");
      setTimeout(() => {
        setMessage("");
        setLastAgent(null);
      }, 3000);
    } catch (error) {
      setMessage(error.message);
      triggerAgentReaction(lastAgent, "failure");
    } finally {
      setLoading(false);
    }
  }

  async function confirmWesleyDispatch(preview) {
    setLoading(true);
    setMessage("");
    try {
      const payload = await apiPost("/api/tasks", {
        allowCodeChanges: preview.allowCodeChanges === true,
        instruction: preview.instruction,
        model: preview.model,
        confirmDispatch: true,
      });
      if (payload.wesleyDispatches) {
        setWesleyDispatches(payload.wesleyDispatches);
        setWesleyLoaded(true);
        setWesleySyncedAt(new Date().toISOString());
      }
      if (payload.wesleyAllowedModels) setWesleyAllowedModels(payload.wesleyAllowedModels);
      if (payload.wesleyModel) setWesleyModel(payload.wesleyModel);
      setWesleyConfigured(payload.wesleyConfigured !== false);
      setWesleyPreview(null);
      setAgentFilter("wesley");
      setLastAgent("wesley");
      setMessage(formatWesleyMessage("Wesley", payload));
      triggerAgentReaction("wesley", "success");
    } catch (error) {
      setMessage(error.message);
      triggerAgentReaction("wesley", "failure");
    } finally {
      setLoading(false);
    }
  }

  async function prepareWesleyDispatch(event) {
    event.preventDefault();
    const context = wesleyDraft.trim();
    if (!context) return;

    setLoading(true);
    setMessage("");
    try {
      const payload = await apiPost("/api/tasks", {
        allowCodeChanges: wesleyAllowCodeChanges,
        instruction: `wesley dispatch this context:\n${context}`,
        model: wesleyModel,
      });
      if (payload.wesleyDispatches) {
        setWesleyDispatches(payload.wesleyDispatches);
        setWesleyLoaded(true);
        setWesleySyncedAt(new Date().toISOString());
      }
      if (payload.wesleyAllowedModels) setWesleyAllowedModels(payload.wesleyAllowedModels);
      if (payload.wesleyModel) setWesleyModel(payload.wesleyModel);
      setWesleyConfigured(payload.wesleyConfigured !== false);
      if (payload.wesleyPreview) {
        setWesleyPreview({ ...payload.wesleyPreview, instruction: `wesley dispatch this context:\n${context}` });
        setWesleyDraft("");
        setWesleyAllowCodeChanges(false);
      }
      setAgentFilter("wesley");
      setLastAgent("wesley");
      setMessage(formatWesleyMessage("Wesley", payload));
      triggerAgentReaction("wesley", "success");
    } catch (error) {
      setMessage(error.message);
      triggerAgentReaction("wesley", "failure");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(watch) {
    await mutateWatch(`/api/watches/${watch.id}/resolve`, {});
  }

  async function handleSnooze(watch, minutes) {
    await mutateWatch(`/api/watches/${watch.id}/snooze`, { minutes });
  }

  async function handleDelete(watch) {
    setLoading(true);
    try {
      const payload = await apiDelete(`/api/watches/${watch.id}`);
      setWatches(payload.watches);
      setCounts(payload.counts || {});
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWesleyDispatch(dispatch) {
    setLoading(true);
    try {
      const payload = await apiDelete(`/api/wesley/dispatches/${dispatch.id}`);
      setWesleyDispatches(payload.dispatches || []);
      setWesleyLoaded(true);
      setWesleySyncedAt(payload.syncedAt || new Date().toISOString());
      setMessage("Dismissed Wesley dispatch");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNoteTheme(theme) {
    setLoading(true);
    try {
      const payload = await apiDelete(`/api/notes/${theme.id}`);
      setNotes(payload.themes || []);
      setMessage(`Deleted ${theme.title}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNoteTheme({ title, body }) {
    setLoading(true);
    try {
      const payload = await apiPost("/api/notes", { title, body });
      setNotes(payload.themes || []);
      setNotesLoaded(true);
      setNoteSearch(null);
      setMessage(`Created ${payload.theme?.title || title}`);
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSubNote(theme, body) {
    setLoading(true);
    try {
      const payload = await apiPost(`/api/notes/${theme.id}/notes`, { body });
      setNotes(payload.themes || []);
      setNotesLoaded(true);
      setMessage(`Added note to ${payload.theme?.title || theme.title}`);
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSubNote(theme, note) {
    setLoading(true);
    try {
      const payload = await apiDelete(`/api/notes/${theme.id}/notes/${note.id}`);
      setNotes(payload.themes || []);
      setMessage(`Deleted note from ${theme.title}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueStatus(issue, status) {
    await mutateIssue(`/api/issues/${issue.identifier}/status`, { status });
  }

  async function handleAssignIssueToMe(issue) {
    await mutateIssue(`/api/issues/${issue.identifier}/assignee`, { assignee: "me" });
  }

  async function handleCreateIssue({ title, description, status }) {
    setLoading(true);
    try {
      const payload = await apiPost("/api/issues", { title, description, status });
      setIssues(payload.issues || []);
      setIssuesLoaded(true);
      setIssuesSyncedAt(payload.syncedAt || new Date().toISOString());
      setIssueStatusCounts(payload.statusCounts || {});
      setMessage(`Mr. PM created ${payload.issue.identifier}`);
      setLastAgent("linear");
      triggerAgentReaction("linear", "success");
    } catch (error) {
      setMessage(error.message);
      triggerAgentReaction("linear", "failure");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function handleLinearClarificationChoice(candidate) {
    if (!linearClarification) return;

    if (linearClarification.requestedAction === "update_status") {
      await mutateIssue(`/api/issues/${candidate.identifier}/status`, { status: linearClarification.statusName });
      return;
    }

    if (linearClarification.requestedAction === "change_assignee") {
      await mutateIssue(`/api/issues/${candidate.identifier}/assignee`, { assignee: linearClarification.assigneeName });
    }
  }

  async function mutateIssue(path, body) {
    setLoading(true);
    try {
      const payload = await apiPost(path, body);
      setIssues(payload.issues || []);
      setIssuesLoaded(true);
      setIssuesSyncedAt(payload.syncedAt || new Date().toISOString());
      setIssueStatusCounts(payload.statusCounts || {});
      setLinearClarification(null);
      if (payload.linearAction) {
        setLastAgent("linear");
        setMessage(formatLinearActionMessage("Mr. PM", payload.linearAction));
        triggerAgentReaction("linear", "success");
      }
    } catch (error) {
      setMessage(error.message);
      triggerAgentReaction("linear", "failure");
    } finally {
      setLoading(false);
    }
  }

  async function mutateWatch(path, body) {
    setLoading(true);
    try {
      const payload = await apiPost(path, body);
      setWatches(payload.watches);
      setCounts(payload.counts || {});
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function agentCount(agentId) {
    const c = counts[agentId];
    if (!c) return 0;
    return (c.due || 0) + (c.pending || 0);
  }

  function agentDueCount(agentId) {
    const c = counts[agentId];
    return c?.due || 0;
  }

  function agentDisplayCount(agentId) {
    if (agentId === "pr") return prs.length;
    if (agentId === "linear") return issues.filter((i) => i.statusType !== "completed").length;
    if (agentId === "notes") return notes.length;
    if (agentId === "granola") return granolaNotes.length;
    if (agentId === "wesley") return wesleyDispatches.length;
    return agentCount(agentId);
  }

  function todayCount() {
    return dueWatcherWatches.length + issues.filter((i) => i.statusType === "started").length + prs.length;
  }

  function agentMood(agentId) {
    if (agentId === "watcher" && agentDueCount(agentId) > 0) return "alert";
    if (agentId === "linear" && (issueStatusCounts.started || 0) >= 3) return "busy";
    if (agentId === "pr" && prs.some((pr) => pr.status === "changes" || pr.status === "failing")) return "stressed";
    if (agentId === "notes" && noteSearch) return "curious";
    if (agentId === "granola" && granolaSearch) return "curious";
    if (agentId === "wesley" && wesleyDispatches.length > 0) return "busy";
    return "calm";
  }

  const totalActive = watches.filter((w) => w.status !== "resolved").length;
  const activeView = agentFilter || "today";
  const showLanding = forceLanding;

  const composerEl = (
    <form onSubmit={createTask} className="composer">
      <input
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        placeholder={greeting}
        disabled={loading}
      />
      <button
        type="submit"
        className="submitBtn"
        disabled={loading || !instruction.trim()}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );

  const toastEl = message && (
    <p className="toast">
      {lastAgent && <PixelSprite type={lastAgent} size={14} />}
      {message}
    </p>
  );

  return (
    <main className={`shell ${showLanding ? "landing" : ""}`}>
      <header className="topbar">
        <button type="button" className="brand" onClick={() => { setForceLanding(true); fetchGreeting(); }}>
          <PixelSprite type="boss" size={20} />
          <span>lilguyz</span>
        </button>
      </header>

      {showLanding ? (
        <section className="landingView">
          <div className="landingHero">
            <PixelSprite type="boss" size={56} />
            <h1 className="landingTitle">What can I help you track?</h1>
            <p className="landingSubtitle">I'll route it to the right agent.</p>
          </div>

          <div className="landingAgents">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                type="button"
                className="landingAgent"
                style={{ "--agent-color": AGENT_COLORS[agent.id] }}
                onClick={() => { setForceLanding(false); setAgentFilter(agent.id); }}
              >
                <PixelSprite type={agent.pixel} size={32} />
                <div className="landingAgentInfo">
                  <span className="landingAgentName">{agent.name}</span>
                  <span className="landingAgentDesc">{agent.description}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="landingComposer">
            {composerEl}
            {toastEl}
          </div>
        </section>
      ) : (
        <section className="workspace">
          {composerEl}
          {toastEl}

          <section className="agentGrid">
            <button
              type="button"
              className={`agentChip todayChip ${activeView === "today" ? "active" : ""}`}
              onClick={() => setAgentFilter("today")}
            >
              <span className="chipLabel">Today</span>
              {todayCount() > 0 && <span className="chipCount">{todayCount()}</span>}
            </button>
            {AGENTS.map((agent) => {
              const count = agentDisplayCount(agent.id);
              const hasDue = agentDueCount(agent.id) > 0;
              const mood = agentMood(agent.id);
              const reaction = agentReaction?.agent === agent.id ? `react-${agentReaction.type}` : "";
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={`agentChip mood-${mood} ${reaction} ${activeView === agent.id ? "active" : ""} ${hasDue ? "hasDue" : ""}`}
                  onClick={() => setAgentFilter(activeView === agent.id ? "today" : agent.id)}
                  style={{ "--agent-color": AGENT_COLORS[agent.id] }}
                  title={`${agent.name} is ${mood}`}
                >
                  <span className="chipSpriteWrap">
                    <PixelSprite type={agent.pixel} size={18} />
                    {hasDue && <span className="dueDot" />}
                  </span>
                  <span className="chipLabel">{agent.name}</span>
                  {count > 0 && <span className="chipCount">{count}</span>}
                </button>
              );
            })}
          </section>

          {activeView === "today" ? (
            <TodayView
              dueWatches={dueWatcherWatches}
              inProgressIssues={issues.filter((issue) => issue.statusType === "started")}
              prs={prs}
            />
          ) : activeView === "pr" ? (
            <PRList
              prs={prs}
              loaded={prsLoaded}
              onRefresh={() => fetchPRs({ force: true })}
              syncedAt={prsSyncedAt}
              syncing={prsSyncing}
            />
          ) : activeView === "linear" ? (
            <IssueList
              issues={issues}
              clarification={linearClarification}
              loaded={issuesLoaded}
              onAssignMe={handleAssignIssueToMe}
              onClarify={handleLinearClarificationChoice}
              onCreateIssue={handleCreateIssue}
              onStatusChange={handleIssueStatus}
              onSync={() => fetchIssues({ force: true })}
              saving={loading}
              statusCounts={issueStatusCounts}
              syncedAt={issuesSyncedAt}
              syncing={issuesSyncing}
            />
          ) : activeView === "notes" ? (
            <NotesList
              themes={notes}
              loaded={notesLoaded}
              search={noteSearch}
              saving={loading}
              onAddSubNote={handleAddSubNote}
              onClearSearch={() => setNoteSearch(null)}
              onCreateTheme={handleCreateNoteTheme}
              onDeleteTheme={handleDeleteNoteTheme}
              onDeleteSubNote={handleDeleteSubNote}
            />
          ) : activeView === "granola" ? (
            <GranolaList
              configured={granolaConfigured}
              loaded={granolaLoaded}
              notes={granolaNotes}
              onClearSearch={() => setGranolaSearch(null)}
              onRefresh={() => fetchGranolaNotes({ force: true })}
              search={granolaSearch}
              syncedAt={granolaSyncedAt}
              syncing={granolaSyncing}
            />
          ) : activeView === "wesley" ? (
            <WesleyList
              allowedModels={wesleyAllowedModels}
              configured={wesleyConfigured}
              draft={wesleyDraft}
              dispatches={wesleyDispatches}
              loaded={wesleyLoaded}
              model={wesleyModel}
              allowCodeChanges={wesleyAllowCodeChanges}
              onConfirmDispatch={confirmWesleyDispatch}
              onAllowCodeChangesChange={setWesleyAllowCodeChanges}
              onDraftChange={setWesleyDraft}
              onDeleteDispatch={handleDeleteWesleyDispatch}
              onDismissPreview={() => setWesleyPreview(null)}
              onModelChange={setWesleyModel}
              onPrepare={prepareWesleyDispatch}
              onRefresh={fetchWesleyDispatches}
              preview={wesleyPreview}
              saving={loading}
              syncedAt={wesleySyncedAt}
            />
          ) : activeView === "watcher" && !initialLoad && (
            <div className="watchesLayout">
              <WatchSection
                title="Needs attention"
                watches={dueWatches}
                variant="due"
                onDelete={handleDelete}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
              />
              <WatchSection
                title="Active"
                watches={activeWatches}
                onDelete={handleDelete}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
              />
              {resolvedWatches.length > 0 && (
                <WatchSection
                  title="Resolved"
                  watches={resolvedWatches.slice(0, 6)}
                  compact
                  onDelete={handleDelete}
                  onResolve={handleResolve}
                  onSnooze={handleSnooze}
                />
              )}
            </div>
          )}
        </section>
      )}

      {notifications.length > 0 && (
        <div className="notifStack">
          {notifications.map((n) => (
            <Notification
              key={n.id}
              notification={n}
              onDismiss={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
            />
          ))}
        </div>
      )}

      {danceParty && <DancePartyOverlay onEnd={() => setDanceParty(false)} />}
      {bohemianGrove && <BohemianGroveOverlay onEnd={() => setBohemianGrove(false)} />}
      {murderScene && <MurderSceneOverlay onEnd={() => setMurderScene(false)} />}
      {fightClub && <FightClubOverlay onEnd={() => setFightClub(false)} />}
    </main>
  );
}

function DancePartyOverlay({ onEnd }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dancers = [
    { type: "boss", delay: 0 },
    { type: "watcher", delay: 0.15 },
    { type: "linear", delay: 0.3 },
    { type: "pr", delay: 0.45 },
    { type: "notes", delay: 0.6 },
    { type: "granola", delay: 0.75 },
    { type: "wesley", delay: 0.9 },
  ];

  return (
    <div className="danceOverlay" onClick={onEnd}>
      <div className="danceFloor">
        {dancers.map((d) => (
          <div
            key={d.type}
            className="dancer"
            style={{ animationDelay: `${d.delay}s` }}
          >
            <PixelSprite type={d.type} size={56} />
            <span className="dancerName">
              {d.type === "boss" ? "Boss" : AGENTS.find((a) => a.pixel === d.type)?.name || d.type}
            </span>
          </div>
        ))}
      </div>
      <p className="danceTimer">{seconds}s</p>
      <p className="danceHint">click anywhere to stop</p>
    </div>
  );
}

function FightClubOverlay({ onEnd }) {
  const [seconds, setSeconds] = useState(30);
  const lineup = useMemo(() => {
    const shuffled = [...AGENTS]
      .map((agent) => ({ agent, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ agent }) => agent);

    return {
      fighters: shuffled.slice(0, 2),
      cheerers: shuffled.slice(2),
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fightOverlay" onClick={onEnd}>
      <div className="fightScene">
        <div className="cheerSide">
          <FightCheerer agent={lineup.cheerers[0]} side="left" />
        </div>

        <div className="fightRing">
          <div className="fightTitle">Fight Club</div>
          <div className="fighter fighter-left">
            <span className="fightBurst">pow</span>
            <PixelSprite type={lineup.fighters[0].pixel} size={58} />
            <span className="fighterName">{lineup.fighters[0].name}</span>
          </div>
          <div className="fightCloud">
            <span />
            <span />
            <span />
          </div>
          <div className="fighter fighter-right">
            <span className="fightBurst">bam</span>
            <PixelSprite type={lineup.fighters[1].pixel} size={58} />
            <span className="fighterName">{lineup.fighters[1].name}</span>
          </div>
        </div>

        <div className="cheerSide">
          <FightCheerer agent={lineup.cheerers[1]} side="right" />
        </div>
      </div>

      <p className="fightTimer">{seconds}s</p>
      <p className="fightHint">click anywhere to break it up</p>
    </div>
  );
}

function FightCheerer({ agent, side }) {
  return (
    <div className={`fightCheerer cheer-${side}`}>
      <span className="cheerText">{side === "left" ? "get him!" : "let's go!"}</span>
      <PixelSprite type={agent.pixel} size={46} />
      <span className="cheererName">{agent.name}</span>
    </div>
  );
}

function PixelFire({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" className="pixelFire">
      <rect x="3" y="0" width="2" height="1" fill="#fbbf24" />
      <rect x="2" y="1" width="1" height="1" fill="#f59e0b" />
      <rect x="3" y="1" width="2" height="1" fill="#fbbf24" />
      <rect x="5" y="1" width="1" height="1" fill="#f59e0b" />
      <rect x="1" y="2" width="1" height="1" fill="#ef4444" />
      <rect x="2" y="2" width="1" height="1" fill="#f59e0b" />
      <rect x="3" y="2" width="2" height="1" fill="#fbbf24" />
      <rect x="5" y="2" width="1" height="1" fill="#f59e0b" />
      <rect x="6" y="2" width="1" height="1" fill="#ef4444" />
      <rect x="1" y="3" width="1" height="1" fill="#ef4444" />
      <rect x="2" y="3" width="4" height="1" fill="#f59e0b" />
      <rect x="6" y="3" width="1" height="1" fill="#ef4444" />
      <rect x="1" y="4" width="1" height="1" fill="#dc2626" />
      <rect x="2" y="4" width="4" height="1" fill="#ef4444" />
      <rect x="6" y="4" width="1" height="1" fill="#dc2626" />
      <rect x="2" y="5" width="4" height="1" fill="#dc2626" />
      <rect x="2" y="6" width="4" height="1" fill="#7f1d1d" />
      <rect x="3" y="7" width="2" height="1" fill="#451a03" />
    </svg>
  );
}

function OwlJared({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" shapeRendering="crispEdges">
      {/* Horned ears */}
      <rect x="1" y="0" width="1" height="1" fill="#78716c" />
      <rect x="2" y="0" width="1" height="1" fill="#a8a29e" />
      <rect x="7" y="0" width="1" height="1" fill="#a8a29e" />
      <rect x="8" y="0" width="1" height="1" fill="#78716c" />
      <rect x="1" y="1" width="2" height="1" fill="#a8a29e" />
      <rect x="7" y="1" width="2" height="1" fill="#a8a29e" />
      {/* Head */}
      <rect x="2" y="2" width="6" height="1" fill="#78716c" />
      <rect x="1" y="3" width="8" height="1" fill="#a8a29e" />
      {/* Eyes — big owl eyes with Jared's purple peeking through */}
      <rect x="1" y="4" width="1" height="1" fill="#a8a29e" />
      <rect x="2" y="4" width="2" height="1" fill="#fbbf24" />
      <rect x="4" y="4" width="2" height="1" fill="#a8a29e" />
      <rect x="6" y="4" width="2" height="1" fill="#fbbf24" />
      <rect x="8" y="4" width="1" height="1" fill="#a8a29e" />
      <rect x="3" y="4" width="1" height="1" fill="#1e1b4b" />
      <rect x="7" y="4" width="1" height="1" fill="#1e1b4b" />
      {/* Beak */}
      <rect x="1" y="5" width="8" height="1" fill="#a8a29e" />
      <rect x="4" y="5" width="2" height="1" fill="#f59e0b" />
      {/* Body — owl feathers with hint of purple */}
      <rect x="1" y="6" width="8" height="1" fill="#78716c" />
      <rect x="3" y="6" width="4" height="1" fill="#a78bfa" opacity="0.3" />
      <rect x="1" y="7" width="8" height="1" fill="#a8a29e" />
      <rect x="2" y="7" width="6" height="1" fill="#78716c" />
      <rect x="1" y="8" width="8" height="1" fill="#a8a29e" />
      {/* Wings */}
      <rect x="0" y="6" width="1" height="3" fill="#78716c" />
      <rect x="9" y="6" width="1" height="3" fill="#78716c" />
      {/* Feet */}
      <rect x="2" y="9" width="2" height="1" fill="#f59e0b" />
      <rect x="6" y="9" width="2" height="1" fill="#f59e0b" />
    </svg>
  );
}

function PixelStage() {
  return (
    <svg width="160" height="24" viewBox="0 0 20 3" shapeRendering="crispEdges" className="pixelStage">
      <rect x="0" y="0" width="20" height="1" fill="#44403c" />
      <rect x="0" y="1" width="20" height="1" fill="#292524" />
      <rect x="0" y="2" width="20" height="1" fill="#1c1917" />
    </svg>
  );
}

function BohemianGroveOverlay({ onEnd }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const worshippers = [
    { type: "boss", delay: 0 },
    { type: "linear", delay: 0.2 },
    { type: "pr", delay: 0.4 },
    { type: "notes", delay: 0.1 },
    { type: "granola", delay: 0.3 },
    { type: "wesley", delay: 0.5 },
  ];

  return (
    <div className="groveOverlay" onClick={onEnd}>
      <div className="groveScene">
        <div className="worshippers">
          {worshippers.map((w) => (
            <div
              key={w.type}
              className="worshipper"
              style={{ animationDelay: `${w.delay}s` }}
            >
              <PixelSprite type={w.type} size={44} />
              <span className="worshipperName">
                {w.type === "boss" ? "Boss" : AGENTS.find((a) => a.pixel === w.type)?.name || w.type}
              </span>
            </div>
          ))}
        </div>

        <div className="shrine">
          <div className="fireLeft"><PixelFire size={32} /></div>
          <div className="altarArea">
            <OwlJared size={72} />
            <PixelStage />
          </div>
          <div className="fireRight"><PixelFire size={32} /></div>
        </div>
      </div>

      <p className="groveTimer">{seconds}s</p>
      <p className="groveHint">click anywhere to leave the grove</p>
    </div>
  );
}

function PixelGun({ size = 20 }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 10 5" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
      <rect x="0" y="1" width="7" height="2" fill="#71717a" />
      <rect x="7" y="0" width="3" height="1" fill="#a1a1aa" />
      <rect x="7" y="1" width="3" height="2" fill="#52525b" />
      <rect x="3" y="3" width="2" height="2" fill="#71717a" />
    </svg>
  );
}

function FallenJared({ size = 56 }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 10 5.5" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
      {/* Body on its side */}
      <rect x="3" y="0" width="4" height="1" fill="#a78bfa" />
      <rect x="2" y="1" width="6" height="1" fill="#c4b5fd" />
      {/* Eyes — X X */}
      <rect x="3" y="1" width="1" height="1" fill="#1e1b4b" />
      <rect x="6" y="1" width="1" height="1" fill="#1e1b4b" />
      <rect x="2" y="2" width="6" height="1" fill="#a78bfa" />
      {/* Legs out */}
      <rect x="1" y="3" width="2" height="1" fill="#a78bfa" />
      <rect x="7" y="3" width="2" height="1" fill="#a78bfa" />
      <rect x="0" y="4" width="1" height="1" fill="#a78bfa" />
      <rect x="9" y="4" width="1" height="1" fill="#a78bfa" />
      {/* X eyes detail */}
      <rect x="3.3" y="0.7" width="0.4" height="0.4" fill="#c4b5fd" />
      <rect x="6.3" y="0.7" width="0.4" height="0.4" fill="#c4b5fd" />
    </svg>
  );
}

function BloodPool() {
  return (
    <svg width="80" height="20" viewBox="0 0 16 4" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }} className="bloodPool">
      <rect x="4" y="0" width="8" height="1" fill="#991b1b" />
      <rect x="3" y="1" width="11" height="1" fill="#dc2626" />
      <rect x="2" y="2" width="12" height="1" fill="#b91c1c" />
      <rect x="4" y="3" width="9" height="1" fill="#7f1d1d" />
    </svg>
  );
}

function MurderSceneOverlay({ onEnd }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const bystanders = [
    { type: "linear", name: "Mr. PM" },
    { type: "pr", name: "PR Boy" },
    { type: "notes", name: "Notes Guy" },
    { type: "granola", name: "Granola Goblin" },
    { type: "wesley", name: "Wesley" },
  ];

  return (
    <div className="murderOverlay" onClick={onEnd}>
      <div className="murderScene">
        <div className="bystanders">
          {bystanders.map((b) => (
            <div key={b.type} className="bystander">
              <PixelSprite type={b.type} size={40} />
              <span className="bystanderReaction">!!</span>
              <span className="bystanderName">{b.name}</span>
            </div>
          ))}
        </div>

        <div className="crimeScene">
          <div className="shooter">
            <PixelSprite type="boss" size={52} />
            <div className="gunArm">
              <PixelGun size={24} />
              <span className="smokeTrail" />
            </div>
          </div>

          <div className="victim">
            <FallenJared size={64} />
            <BloodPool />
            <span className="victimLabel">Jared</span>
          </div>
        </div>
      </div>

      <p className="murderTimer">{seconds}s</p>
      <p className="murderHint">click anywhere to leave the scene</p>
    </div>
  );
}

function NotesList({ loaded, onAddSubNote, onClearSearch, onCreateTheme, onDeleteSubNote, onDeleteTheme, saving, search, themes }) {
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [themeTitle, setThemeTitle] = useState("");
  const [themeBody, setThemeBody] = useState("");
  const [entryThemeId, setEntryThemeId] = useState(null);
  const [entryBody, setEntryBody] = useState("");

  async function handleCreateTheme(event) {
    event.preventDefault();
    const title = themeTitle.trim();
    const body = themeBody.trim();
    if (!title) return;

    await onCreateTheme({ title, body });
    setThemeTitle("");
    setThemeBody("");
    setShowThemeForm(false);
  }

  async function handleAddEntry(event, theme) {
    event.preventDefault();
    const body = entryBody.trim();
    if (!body) return;

    await onAddSubNote(theme, body);
    setEntryBody("");
    setEntryThemeId(null);
  }

  const createThemeCard = (
    <section className="noteCreateCard">
      {showThemeForm ? (
        <form className="noteForm" onSubmit={handleCreateTheme}>
          <div className="noteFormHead">
            <PixelSprite type="notes" size={22} />
            <div>
              <h2>New notes theme</h2>
              <span>Create a bucket for related notes.</span>
            </div>
          </div>
          <input
            value={themeTitle}
            onChange={(event) => setThemeTitle(event.target.value)}
            placeholder="theme title"
            disabled={saving}
            autoFocus
          />
          <textarea
            value={themeBody}
            onChange={(event) => setThemeBody(event.target.value)}
            placeholder="optional first note"
            disabled={saving}
            rows={3}
          />
          <div className="noteFormActions">
            <button type="button" className="actionBtn" onClick={() => setShowThemeForm(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="noteSubmitBtn" disabled={saving || !themeTitle.trim()}>
              Create theme
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="noteCreateButton" onClick={() => setShowThemeForm(true)}>
          <PixelSprite type="notes" size={22} />
          <span>New notes theme</span>
        </button>
      )}
    </section>
  );

  if (!loaded) {
    return (
      <div className="emptyState">
        <PixelSprite type="notes" size={48} />
        <p>Loading notes...</p>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="emptyState">
        <PixelSprite type="notes" size={48} />
        <p>No note themes yet. Ask Notes Guy to start one.</p>
        {createThemeCard}
      </div>
    );
  }

  return (
    <div className="notesLayout">
      {createThemeCard}

      {search && (
        <section className="noteSearchResults">
          <div className="noteSearchHead">
            <div className="noteSearchTitle">
              <PixelSprite type="notes" size={22} />
              <div>
                <h2>Notes about {search.query}</h2>
                <span>{search.results.length} matching themes</span>
              </div>
            </div>
            <button
              type="button"
              className="actionBtn delete noteDeleteBtn"
              aria-label="Close note search results"
              onClick={onClearSearch}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {search.answer && <p className="noteAnswer">{search.answer}</p>}
          {search.results.length > 0 ? (
            <div className="subNoteList">
              {search.results.map((result) => (
                <article key={result.themeId} className="noteSearchTheme">
                  <h3>{result.themeTitle}</h3>
                  {result.notes.length > 0 ? (
                    result.notes.map((note) => (
                      <p key={note.id}>{note.body}</p>
                    ))
                  ) : (
                    <p>No sub notes in this theme yet.</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="emptySubNotes">Nothing saved about that yet.</p>
          )}
        </section>
      )}

      {themes.map((theme) => (
        <article key={theme.id} className="noteTheme">
          <div className="noteThemeHead">
            <div>
              <h2>{theme.title}</h2>
              <span>{theme.notes.length} sub notes</span>
            </div>
            <div className="noteThemeActions">
              <PixelSprite type="notes" size={28} />
              <button
                type="button"
                className="actionBtn delete noteDeleteBtn"
                aria-label={`Delete ${theme.title}`}
                onClick={() => onDeleteTheme(theme)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {theme.notes.length > 0 ? (
            <div className="subNoteList">
              {theme.notes.map((note) => (
                <div key={note.id} className="subNote">
                  <div>
                    <p>{note.body}</p>
                    <span>{formatRelative(note.createdAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="actionBtn delete noteDeleteBtn"
                    aria-label="Delete note"
                    onClick={() => onDeleteSubNote(theme, note)}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="emptySubNotes">Theme created. Add a sub note whenever you are ready.</p>
          )}

          <div className="noteThemeFooter">
            {entryThemeId === theme.id ? (
              <form className="noteForm noteEntryForm" onSubmit={(event) => handleAddEntry(event, theme)}>
                <textarea
                  value={entryBody}
                  onChange={(event) => setEntryBody(event.target.value)}
                  placeholder={`new note for ${theme.title}`}
                  disabled={saving}
                  rows={3}
                  autoFocus
                />
                <div className="noteFormActions">
                  <button
                    type="button"
                    className="actionBtn"
                    onClick={() => {
                      setEntryThemeId(null);
                      setEntryBody("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="noteSubmitBtn" disabled={saving || !entryBody.trim()}>
                    Add note
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="actionBtn noteAddBtn"
                onClick={() => {
                  setEntryThemeId(theme.id);
                  setEntryBody("");
                }}
              >
                + Note
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function GranolaList({ configured, loaded, notes, onClearSearch, onRefresh, search, syncedAt, syncing }) {
  if (!loaded) {
    return (
      <div className="emptyState">
        <PixelSprite type="granola" size={48} />
        <p>Loading Granola notes...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="emptyState">
        <PixelSprite type="granola" size={48} />
        <p>Granola Goblin needs GRANOLA_API_KEY.</p>
        <button type="button" className="syncBtn granolaSyncBtn" onClick={onRefresh} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Granola"}
        </button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="emptyState">
        <PixelSprite type="granola" size={48} />
        <p>No Granola notes found yet.</p>
        {syncedAt && <span className="syncDetail">synced {formatRelative(syncedAt)}</span>}
        <button type="button" className="syncBtn granolaSyncBtn" onClick={onRefresh} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Granola"}
        </button>
      </div>
    );
  }

  return (
    <div className="granolaLayout">
      <div className="syncBar">
        <span>{notes.length} recent notes{syncedAt ? ` · synced ${formatRelative(syncedAt)}` : ""}</span>
        <button type="button" className="syncBtn granolaSyncBtn" onClick={onRefresh} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Granola"}
        </button>
      </div>

      {search && (
        <section className="granolaSearchResults">
          <div className="noteSearchHead">
            <div className="noteSearchTitle">
              <PixelSprite type="granola" size={22} />
              <div>
                <h2>Meetings about {search.query}</h2>
                <span>{search.results.length} matching notes</span>
              </div>
            </div>
            <button
              type="button"
              className="actionBtn delete noteDeleteBtn"
              aria-label="Close Granola search results"
              onClick={onClearSearch}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {search.answer && <p className="granolaAnswer">{search.answer}</p>}
          {search.results.length > 0 ? (
            <div className="granolaNoteList">
              {search.results.map((note) => (
                <GranolaNoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <p className="emptySubNotes">Nothing in recent Granola notes matched that.</p>
          )}
        </section>
      )}

      <section className="watchSection">
        <div className="sectionHead">
          <h2>Recent meetings</h2>
          <span className="badge">{notes.length}</span>
        </div>
        <div className="granolaNoteList">
          {notes.map((note) => (
            <GranolaNoteCard key={note.id} note={note} />
          ))}
        </div>
      </section>
    </div>
  );
}

function GranolaNoteCard({ note }) {
  return (
    <article className="watchCard granolaCard">
      <PixelSprite type="granola" size={22} />
      <div className="watchBody">
        <div className="watchMeta">
          <span className="watchSubject granolaId">{note.id}</span>
          {note.ownerName && <span className="granolaOwner">{note.ownerName}</span>}
        </div>
        <p className="watchInstruction">{note.title}</p>
        {note.summary && <p className="granolaSummary">{note.summary}</p>}
        {note.excerpt && !note.summary && <p className="granolaSummary">{note.excerpt}</p>}
        <span className="watchDue">{formatRelative(note.updatedAt || note.createdAt)}</span>
      </div>
    </article>
  );
}

function WesleyModelControl({ allowedModels, model, onModelChange }) {
  return (
    <label className="wesleyModelControl">
      <span>Model</span>
      <select
        value={model}
        onChange={(event) => onModelChange(event.target.value)}
      >
        {allowedModels.map((modelId) => (
          <option key={modelId} value={modelId}>
            {WESLEY_MODEL_LABELS[modelId] || modelId}
          </option>
        ))}
      </select>
    </label>
  );
}

function WesleyDispatchForm({ allowCodeChanges, allowedModels, draft, model, onAllowCodeChangesChange, onDraftChange, onModelChange, onPrepare, saving }) {
  return (
    <form className="wesleyDispatchForm" onSubmit={onPrepare}>
      <div className="noteFormHead">
        <PixelSprite type="wesley" size={22} />
        <div>
          <h2>Dispatch Wesley</h2>
          <span>Paste Slack context, a thread, or a messy ask.</span>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="paste the context Wesley should turn into a cloud agent quest"
        disabled={saving}
        rows={5}
      />
      <div className="wesleyDispatchActions">
        <WesleyModelControl allowedModels={allowedModels} model={model} onModelChange={onModelChange} />
        <label className="wesleyCodeMode">
          <input
            type="checkbox"
            checked={allowCodeChanges}
            onChange={(event) => onAllowCodeChangesChange(event.target.checked)}
            disabled={saving}
          />
          <span>Allow branch edits</span>
        </label>
        <button type="submit" className="wesleyDispatchBtn" disabled={saving || !draft.trim()}>
          {saving ? "Preparing..." : "Prepare dispatch"}
        </button>
      </div>
    </form>
  );
}

function WesleyList({ allowCodeChanges, allowedModels, configured, draft, dispatches, loaded, model, onAllowCodeChangesChange, onConfirmDispatch, onDeleteDispatch, onDismissPreview, onDraftChange, onModelChange, onPrepare, onRefresh, preview, saving, syncedAt }) {
  if (!loaded) {
    return (
      <div className="emptyState">
        <PixelSprite type="wesley" size={48} />
        <p>Loading Wesley dispatches...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="emptyState">
        <PixelSprite type="wesley" size={48} />
        <p>Wesley needs CURSOR_API_KEY.</p>
        <span className="syncDetail">He does as you wish.</span>
        <WesleyDispatchForm
          allowCodeChanges={allowCodeChanges}
          allowedModels={allowedModels}
          draft={draft}
          model={model}
          onAllowCodeChangesChange={onAllowCodeChangesChange}
          onDraftChange={onDraftChange}
          onModelChange={onModelChange}
          onPrepare={onPrepare}
          saving={saving}
        />
        <button type="button" className="syncBtn wesleySyncBtn" onClick={onRefresh}>
          Refresh Wesley
        </button>
      </div>
    );
  }

  if (dispatches.length === 0) {
    return (
      <div className="emptyState">
        <PixelSprite type="wesley" size={48} />
        <p>He does as you wish.</p>
        {syncedAt && <span className="syncDetail">synced {formatRelative(syncedAt)}</span>}
        {preview ? (
          <WesleyPreviewCard
            preview={preview}
            saving={saving}
            onConfirm={() => onConfirmDispatch(preview)}
            onDismiss={onDismissPreview}
          />
        ) : (
          <WesleyDispatchForm
            allowCodeChanges={allowCodeChanges}
            allowedModels={allowedModels}
            draft={draft}
            model={model}
            onAllowCodeChangesChange={onAllowCodeChangesChange}
            onDraftChange={onDraftChange}
            onModelChange={onModelChange}
            onPrepare={onPrepare}
            saving={saving}
          />
        )}
        <button type="button" className="syncBtn wesleySyncBtn" onClick={onRefresh}>
          Refresh Wesley
        </button>
      </div>
    );
  }

  return (
    <div className="wesleyLayout">
      <div className="syncBar">
        <span>{dispatches.length} dispatches{syncedAt ? ` · synced ${formatRelative(syncedAt)}` : ""}</span>
        <div className="syncActions">
          <button type="button" className="syncBtn wesleySyncBtn" onClick={onRefresh}>
            Refresh Wesley
          </button>
        </div>
      </div>
      {preview ? (
        <WesleyPreviewCard
          preview={preview}
          saving={saving}
          onConfirm={() => onConfirmDispatch(preview)}
          onDismiss={onDismissPreview}
        />
      ) : (
        <WesleyDispatchForm
          allowCodeChanges={allowCodeChanges}
          allowedModels={allowedModels}
          draft={draft}
          model={model}
          onAllowCodeChangesChange={onAllowCodeChangesChange}
          onDraftChange={onDraftChange}
          onModelChange={onModelChange}
          onPrepare={onPrepare}
          saving={saving}
        />
      )}
      <section className="watchSection">
        <div className="sectionHead">
          <h2>Cloud quests</h2>
          <span className="badge">{dispatches.length}</span>
        </div>
        <div className="wesleyDispatchList">
          {dispatches.map((dispatch) => (
            <WesleyDispatchCard key={dispatch.id} dispatch={dispatch} onDelete={onDeleteDispatch} />
          ))}
        </div>
      </section>
    </div>
  );
}

function WesleyPreviewCard({ onConfirm, onDismiss, preview, saving }) {
  const modelLabel = WESLEY_MODEL_LABELS[preview.model] || preview.model;
  const modeLabel = preview.allowCodeChanges ? "branch edits allowed" : "investigate only";

  return (
    <section className="wesleyPreviewCard">
      <div className="noteSearchHead">
        <div className="noteSearchTitle">
          <PixelSprite type="wesley" size={22} />
          <div>
            <h2>As you wish?</h2>
            <span>{modelLabel} · {preview.startingRef}</span>
          </div>
        </div>
        <button
          type="button"
          className="actionBtn delete noteDeleteBtn"
          aria-label="Dismiss Wesley dispatch preview"
          onClick={onDismiss}
          disabled={saving}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="wesleyPreviewText">{preview.promptPreview}</p>
      <div className="wesleyPreviewMeta">
        <span>{preview.repoUrl}</span>
        <span>{modeLabel}</span>
        <span>secrets redacted before dispatch</span>
      </div>
      <button type="button" className="wesleyDispatchBtn" onClick={onConfirm} disabled={saving}>
        {saving ? "Dispatching..." : "Dispatch agent"}
      </button>
    </section>
  );
}

function WesleyDispatchCard({ dispatch, onDelete }) {
  return (
    <a className="watchCard wesleyCard" href={dispatch.url} target="_blank" rel="noopener noreferrer">
      <PixelSprite type="wesley" size={22} />
      <div className="watchBody">
        <div className="watchMeta">
          <span className="watchSubject wesleyStatus">{dispatch.status}</span>
          <span className="wesleyRepo">{dispatch.startingRef}</span>
          <span className="wesleyModel">{dispatch.allowCodeChanges ? "branch edits" : "investigate only"}</span>
          {dispatch.model && <span className="wesleyModel">{WESLEY_MODEL_LABELS[dispatch.model] || dispatch.model}</span>}
        </div>
        <p className="watchInstruction">{dispatch.prompt}</p>
        <span className="watchDue">{formatRelative(dispatch.createdAt)}</span>
      </div>
      <button
        type="button"
        className="actionBtn delete wesleyDeleteBtn"
        aria-label="Dismiss Wesley dispatch"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete(dispatch);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </a>
  );
}

function TodayView({ dueWatches, inProgressIssues, prs }) {
  return (
    <div className="todayLayout">
      <TodaySection title="Jared" count={dueWatches.length} empty="No reminders need attention." area="jared">
        {dueWatches.map((watch) => (
          <div key={watch.id} className="todayItem">
            <PixelSprite type={watch.agent || "watcher"} size={18} />
            <div>
              <strong>{watch.instruction}</strong>
              <span>{watch.subject} · {formatRelative(watch.dueAt)}</span>
            </div>
          </div>
        ))}
      </TodaySection>

      <TodaySection title="Mr. PM" count={inProgressIssues.length} empty="No tasks in progress." area="pm">
        {inProgressIssues.map((issue) => (
          <a key={issue.id} className="todayItem" href={issue.url} target="_blank" rel="noopener noreferrer">
            <PixelSprite type="linear" size={18} />
            <div>
              <strong>{issue.title}</strong>
              <span>{issue.identifier} · {issue.status}</span>
            </div>
          </a>
        ))}
      </TodaySection>

      <TodaySection title="PR Boy" count={prs.length} empty="No open PRs. Nice." area="prs">
        {prs.map((pr) => (
          <a key={pr.number} className="todayItem" href={pr.url} target="_blank" rel="noopener noreferrer">
            <PixelSprite type="pr" size={18} />
            <div>
              <strong>{pr.title}</strong>
              <span>#{pr.number} · {PR_STATUS_LABELS[pr.status]}</span>
            </div>
          </a>
        ))}
      </TodaySection>
    </div>
  );
}

function TodaySection({ area, children, count, empty, title }) {
  return (
    <section className={`todaySection today-${area}`}>
      <div className="todaySectionHead">
        <h2>{title}</h2>
        <span className="badge">{count}</span>
      </div>
      {count > 0 ? children : <p className="todayEmpty">{empty}</p>}
    </section>
  );
}

const STATUS_TYPE_ORDER = ["backlog", "unstarted", "started", "completed", "urgent"];
const STATUS_TYPE_LABELS = {
  urgent: "Urgent",
  started: "In Progress",
  unstarted: "Todo",
  backlog: "Backlog",
  completed: "Done",
};
const STATUS_TYPE_COLORS = {
  urgent: "#ef4444",
  started: "#f59e0b",
  unstarted: "#8b8b93",
  backlog: "#5a5a63",
  completed: "#34d399",
};

function IssueList({ clarification, issues, loaded, onAssignMe, onClarify, onCreateIssue, onStatusChange, onSync, saving, statusCounts, syncedAt, syncing }) {
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueStatus, setIssueStatus] = useState("Todo");
  const syncDetail = `In Progress: ${statusCounts.started || 0}${syncedAt ? ` · synced ${formatRelative(syncedAt)}` : ""}`;

  async function handleCreateIssue(event) {
    event.preventDefault();
    const title = issueTitle.trim();
    const description = issueDescription.trim();
    if (!title) return;

    await onCreateIssue({ title, description, status: issueStatus });
    setIssueTitle("");
    setIssueDescription("");
    setIssueStatus("Todo");
    setShowCreateForm(false);
  }

  const createIssueCard = (
    <section className="issueCreateCard">
      {showCreateForm ? (
        <form className="issueForm" onSubmit={handleCreateIssue}>
          <div className="issueFormHead">
            <PixelSprite type="linear" size={22} />
            <div>
              <h2>New Mr. PM task</h2>
              <span>Assigned to you automatically.</span>
            </div>
          </div>
          <input
            value={issueTitle}
            onChange={(event) => setIssueTitle(event.target.value)}
            placeholder="title"
            disabled={saving}
            autoFocus
          />
          <textarea
            value={issueDescription}
            onChange={(event) => setIssueDescription(event.target.value)}
            placeholder="description"
            disabled={saving}
            rows={4}
          />
          <select
            value={issueStatus}
            onChange={(event) => setIssueStatus(event.target.value)}
            disabled={saving}
          >
            <option value="Backlog">Backlog</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <div className="issueFormActions">
            <button type="button" className="actionBtn" onClick={() => setShowCreateForm(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="issueSubmitBtn" disabled={saving || !issueTitle.trim()}>
              Create task
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="issueCreateButton" onClick={() => setShowCreateForm(true)}>
          <PixelSprite type="linear" size={22} />
          <span>New task</span>
        </button>
      )}
    </section>
  );

  if (!loaded) {
    return (
      <div className="emptyState">
        <PixelSprite type="linear" size={48} />
        <p>Loading issues...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="emptyState">
        <PixelSprite type="linear" size={48} />
        <p>No issues assigned to you.</p>
        <span className="syncDetail">{syncDetail}</span>
        <button type="button" className="syncBtn" onClick={onSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Mr. PM"}
        </button>
        {createIssueCard}
      </div>
    );
  }

  const grouped = {};
  for (const issue of issues) {
    const type = issue.statusType || "unstarted";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(issue);
  }

  const statusTypes = [
    ...STATUS_TYPE_ORDER.filter((type) => grouped[type]?.length > 0),
    ...Object.keys(grouped).filter((type) => !STATUS_TYPE_ORDER.includes(type)),
  ];

  function toggleStatus(type) {
    setCollapsedStatuses((prev) => ({ ...prev, [type]: !(prev[type] ?? true) }));
  }

  return (
    <div className="watchesLayout">
      {clarification && (
        <LinearClarificationCard clarification={clarification} onChoose={onClarify} />
      )}
      <div className="syncBar">
        <span>{issues.length} assigned issues · {syncDetail}</span>
        <div className="syncActions">
          <button type="button" className="syncBtn" onClick={() => setShowCreateForm(true)}>
            New task
          </button>
          <button type="button" className="syncBtn" onClick={onSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Mr. PM"}
          </button>
        </div>
      </div>
      {showCreateForm && createIssueCard}
      {statusTypes.map((type) => {
        const isCollapsed = collapsedStatuses[type] ?? true;

        return (
          <section key={type} className={`watchSection ${type === "urgent" ? "due" : ""}`}>
            <button
              type="button"
              className="sectionHead sectionToggle"
              aria-expanded={!isCollapsed}
              onClick={() => toggleStatus(type)}
            >
              <span className={`chevron ${isCollapsed ? "collapsed" : ""}`}>⌄</span>
              <h2>{STATUS_TYPE_LABELS[type] || type}</h2>
              <span className="badge">{grouped[type].length}</span>
            </button>
            {!isCollapsed && (
              <div className="watchList">
                {grouped[type].map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onAssignMe={onAssignMe}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function LinearClarificationCard({ clarification, onChoose }) {
  return (
    <section className="clarificationCard">
      <div>
        <h2>Which task did you mean?</h2>
        <p>{formatClarificationIntent(clarification)}</p>
      </div>
      <div className="clarificationChoices">
        {clarification.candidates.map((candidate) => (
          <button key={candidate.identifier} type="button" onClick={() => onChoose(candidate)}>
            <span>{candidate.identifier}</span>
            <strong>{candidate.title}</strong>
            <em>{candidate.status}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatClarificationIntent(clarification) {
  if (clarification.requestedAction === "update_status") {
    return `Move "${clarification.issueTitle}" to ${clarification.statusName}.`;
  }
  if (clarification.requestedAction === "change_assignee") {
    return `Change the assignee for "${clarification.issueTitle}".`;
  }
  return `I found multiple matches for "${clarification.issueTitle}".`;
}

function IssueCard({ issue, onAssignMe, onStatusChange }) {
  function handleCardAction(event, action) {
    event.preventDefault();
    event.stopPropagation();
    action();
  }

  return (
    <a className="watchCard issueCard" href={issue.url} target="_blank" rel="noopener noreferrer">
      <PixelSprite type="linear" size={22} />
      <div className="watchBody">
        <div className="watchMeta">
          <span className="watchSubject linearLink">{issue.identifier}</span>
          <span className="issueTeam">{issue.teamName}</span>
          <span className="issueStatus" style={{ color: STATUS_TYPE_COLORS[issue.statusType] }}>
            {issue.status}
          </span>
        </div>
        <p className="watchInstruction">{issue.title}</p>
        <span className="watchDue">{formatRelative(issue.updatedAt)}</span>
        <div className="issueQuickActions">
          <button type="button" onClick={(event) => handleCardAction(event, () => onStatusChange(issue, "Todo"))}>
            Todo
          </button>
          <button type="button" onClick={(event) => handleCardAction(event, () => onStatusChange(issue, "In Progress"))}>
            In Progress
          </button>
          <button type="button" onClick={(event) => handleCardAction(event, () => onStatusChange(issue, "Done"))}>
            Done
          </button>
          <button type="button" onClick={(event) => handleCardAction(event, () => onAssignMe(issue))}>
            Assign me
          </button>
        </div>
      </div>
    </a>
  );
}

function PRList({ loaded, onRefresh, prs, syncedAt, syncing }) {
  if (!loaded) {
    return (
      <div className="emptyState">
        <PixelSprite type="pr" size={48} />
        <p>Loading PRs...</p>
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="emptyState">
        <PixelSprite type="pr" size={48} />
        <p>No open PRs. Nice.</p>
        <button type="button" className="syncBtn prSyncBtn" onClick={onRefresh} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync PR Boy"}
        </button>
      </div>
    );
  }

  const needsAttention = prs.filter((p) => p.status === "changes" || p.status === "failing");
  const ready = prs.filter((p) => p.status === "ready" || p.status === "approved");
  const rest = prs.filter((p) => !needsAttention.includes(p) && !ready.includes(p));

  return (
    <div className="watchesLayout">
      <div className="syncBar">
        <span>{prs.length} open PRs{syncedAt ? ` · synced ${formatRelative(syncedAt)}` : ""}</span>
        <button type="button" className="syncBtn prSyncBtn" onClick={onRefresh} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync PR Boy"}
        </button>
      </div>
      {needsAttention.length > 0 && (
        <section className="watchSection due">
          <div className="sectionHead">
            <h2>Needs attention</h2>
            <span className="badge">{needsAttention.length}</span>
          </div>
          <div className="watchList">
            {needsAttention.map((pr) => <PRCard key={pr.number} pr={pr} />)}
          </div>
        </section>
      )}

      {ready.length > 0 && (
        <section className="watchSection">
          <div className="sectionHead">
            <h2>Ready to merge</h2>
            <span className="badge">{ready.length}</span>
          </div>
          <div className="watchList">
            {ready.map((pr) => <PRCard key={pr.number} pr={pr} />)}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="watchSection">
          <div className="sectionHead">
            <h2>In progress</h2>
            <span className="badge">{rest.length}</span>
          </div>
          <div className="watchList">
            {rest.map((pr) => <PRCard key={pr.number} pr={pr} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function PRCard({ pr }) {
  const repoShort = pr.repo.split("/").pop();

  return (
    <a className="watchCard prCard" href={pr.url} target="_blank" rel="noopener noreferrer">
      <PixelSprite type="pr" size={22} />
      <div className="watchBody">
        <div className="watchMeta">
          <span className="watchSubject">#{pr.number}</span>
          <span className="prRepo">{repoShort}</span>
          <span className="prStatusBadge" style={{ color: PR_STATUS_COLORS[pr.status] }}>
            {PR_STATUS_LABELS[pr.status]}
          </span>
        </div>
        <p className="watchInstruction">{pr.title}</p>
        <div className="prMeta">
          <span className="prDiff">
            <span className="prAdd">+{pr.additions}</span>
            <span className="prDel">-{pr.deletions}</span>
          </span>
          <span className="prBranch">{pr.branch}</span>
          <span className="watchDue">{formatRelative(pr.createdAt)}</span>
        </div>
      </div>
    </a>
  );
}

function Notification({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="notif" onClick={onDismiss}>
      <div className="notifIcon">
        <PixelSprite type={notification.agent || "watcher"} size={28} />
      </div>
      <div className="notifBody">
        <span className="notifSubject">{notification.subject}</span>
        <p className="notifText">{notification.instruction}</p>
      </div>
      <span className="notifTime">now</span>
    </div>
  );
}

function WatchSection({
  compact = false,
  onDelete,
  onResolve,
  onSnooze,
  title,
  variant,
  watches,
}) {
  return (
    <section className={`watchSection ${variant === "due" ? "due" : ""}`}>
      <div className="sectionHead">
        <h2>{title}</h2>
        <span className="badge">{watches.length}</span>
      </div>

      <div className={compact ? "watchList compact" : "watchList"}>
        {watches.map((watch) => (
          <WatchCard
            key={watch.id}
            compact={compact}
            onDelete={onDelete}
            onResolve={onResolve}
            onSnooze={onSnooze}
            watch={watch}
          />
        ))}
      </div>
    </section>
  );
}

function WatchCard({ compact, onDelete, onResolve, onSnooze, watch }) {
  const agentName = AGENTS.find((a) => a.id === watch.agent)?.name;

  return (
    <article className={`watchCard ${watch.status}`}>
      <PixelSprite type={watch.agent || "watcher"} size={22} />
      <div className="watchBody">
        <div className="watchMeta">
          {watch.linearIssue ? (
            <a
              className="watchSubject linearLink"
              href={watch.linearIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {watch.linearIssue.identifier}
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M6 3h7v7M13 3L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ) : (
            <span className="watchSubject">{watch.subject}</span>
          )}
          {agentName && <span className="watchAgent" style={{ color: AGENT_COLORS[watch.agent] }}>{agentName}</span>}
        </div>
        <p className="watchInstruction">{watch.instruction}</p>
        {!watch.linearIssue && <span className="watchDue">{formatRelative(watch.dueAt)}</span>}
      </div>

      {watch.linearIssue ? (
        <div className="watchActions">
          <button type="button" className="actionBtn delete" onClick={() => onDelete(watch)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : !compact ? (
        <div className="watchActions">
          {watch.status !== "resolved" && (
            <button type="button" className="actionBtn resolve" onClick={() => onResolve(watch)}>
              Done
            </button>
          )}
          <button type="button" className="actionBtn" onClick={() => onSnooze(watch, 15)}>
            15m
          </button>
          <button type="button" className="actionBtn" onClick={() => onSnooze(watch, 60)}>
            1h
          </button>
          <button type="button" className="actionBtn delete" onClick={() => onDelete(watch)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="watchActions">
          <button type="button" className="actionBtn delete" onClick={() => onDelete(watch)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </article>
  );
}

function formatRelative(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  const now = new Date();
  const diff = date - now;

  if (diff < 0) {
    const mins = Math.round(Math.abs(diff) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }

  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.round(hrs / 24)}d`;
}

function formatNoteMessage(agentName, noteResult) {
  if (noteResult?.action === "search_notes") {
    return `${agentName} found ${noteResult.results.length} note matches for ${noteResult.query}`;
  }

  const themeTitle = noteResult?.theme?.title || "notes";
  if (noteResult?.action === "add_note") {
    return `${agentName} added a sub note to ${themeTitle}`;
  }

  return `${agentName} created ${themeTitle}`;
}

function formatGranolaMessage(agentName, payload) {
  if (payload.granolaConfigured === false) {
    return `${agentName} needs a Granola API key`;
  }

  const result = payload.granolaResult;
  if (result?.action === "search_granola_notes") {
    return `${agentName} found ${result.results.length} meeting matches for ${result.query}`;
  }

  if (result?.action === "list_granola_notes") {
    return `${agentName} synced ${result.notes.length} Granola notes`;
  }

  return `${agentName} picked this up`;
}

function formatWesleyMessage(agentName, payload) {
  if (payload.wesleyConfigured === false) {
    return `${agentName} needs a Cursor API key`;
  }

  if (payload.wesleyDispatch?.url) {
    return `${agentName} dispatched a cloud agent`;
  }

  if (payload.wesleyPreview) {
    return `${agentName} prepared a dispatch`;
  }

  return "As you wish.";
}

function formatLinearActionMessage(agentName, linearAction) {
  if (linearAction.action === "clarify_issue") {
    const candidates = (linearAction.candidates || [])
      .map((issue) => `${issue.identifier} (${issue.title})`)
      .join(", ");
    return `${agentName} found multiple matches for "${linearAction.issueTitle}": ${candidates}`;
  }

  if (linearAction.action === "update_status") {
    return `${agentName} moved ${linearAction.identifier} to ${linearAction.status}`;
  }

  if (linearAction.action === "change_assignee") {
    return linearAction.assignee
      ? `${agentName} assigned ${linearAction.identifier} to ${linearAction.assignee}`
      : `${agentName} unassigned ${linearAction.identifier}`;
  }

  return `${agentName} updated ${linearAction.identifier}`;
}

async function apiGet(path, options) {
  const response = await fetch(path, options);
  return parseResponse(response);
}

async function apiPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}

async function apiDelete(path) {
  const response = await fetch(path, { method: "DELETE" });
  return parseResponse(response);
}

async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}
