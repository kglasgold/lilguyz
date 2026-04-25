import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DANCE_PATTERN = /\bdance\s*party\b/i;
const GROVE_PATTERN = /\bbohemian\s*grove\b/i;
const MURDER_PATTERN = /\bmurder\s*scene\b/i;
const FIGHT_CLUB_PATTERN = /\bfight\s*club\b/i;
const EASTER_EGG_DURATION = 30_000;

const AGENTS = [
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
    const removeResumeListener = window.lilguyz?.onSystemResume?.(refreshAfterWake);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshAfterWake();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      clearInterval(prInterval);
      clearInterval(issueInterval);
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
      const payload = await apiPost("/api/tasks", {
        instruction: instruction.trim(),
      });
      if (payload.notes) {
        setNotes(payload.notes);
        setNotesLoaded(true);
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
    return agentCount(agentId);
  }

  function todayCount() {
    return dueWatches.length + issues.filter((i) => i.statusType === "started").length + prs.length;
  }

  function agentMood(agentId) {
    if (agentId === "watcher" && agentDueCount(agentId) > 0) return "alert";
    if (agentId === "linear" && (issueStatusCounts.started || 0) >= 3) return "busy";
    if (agentId === "pr" && prs.some((pr) => pr.status === "changes" || pr.status === "failing")) return "stressed";
    if (agentId === "notes" && noteSearch) return "curious";
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
              dueWatches={dueWatches}
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
              onStatusChange={handleIssueStatus}
              onSync={() => fetchIssues({ force: true })}
              statusCounts={issueStatusCounts}
              syncedAt={issuesSyncedAt}
              syncing={issuesSyncing}
            />
          ) : activeView === "notes" ? (
            <NotesList
              themes={notes}
              loaded={notesLoaded}
              search={noteSearch}
              onClearSearch={() => setNoteSearch(null)}
              onDeleteTheme={handleDeleteNoteTheme}
              onDeleteSubNote={handleDeleteSubNote}
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

function NotesList({ loaded, onClearSearch, onDeleteSubNote, onDeleteTheme, search, themes }) {
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
      </div>
    );
  }

  return (
    <div className="notesLayout">
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
        </article>
      ))}
    </div>
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

const STATUS_TYPE_ORDER = ["urgent", "started", "unstarted", "backlog", "completed"];
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

function IssueList({ clarification, issues, loaded, onAssignMe, onClarify, onStatusChange, onSync, statusCounts, syncedAt, syncing }) {
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const syncDetail = `In Progress: ${statusCounts.started || 0}${syncedAt ? ` · synced ${formatRelative(syncedAt)}` : ""}`;

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
    setCollapsedStatuses((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  return (
    <div className="watchesLayout">
      {clarification && (
        <LinearClarificationCard clarification={clarification} onChoose={onClarify} />
      )}
      <div className="syncBar">
        <span>{issues.length} assigned issues · {syncDetail}</span>
        <button type="button" className="syncBtn" onClick={onSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Mr. PM"}
        </button>
      </div>
      {statusTypes.map((type) => (
        <section key={type} className={`watchSection ${type === "urgent" ? "due" : ""}`}>
          <button
            type="button"
            className="sectionHead sectionToggle"
            aria-expanded={!collapsedStatuses[type]}
            onClick={() => toggleStatus(type)}
          >
            <span className={`chevron ${collapsedStatuses[type] ? "collapsed" : ""}`}>⌄</span>
            <h2>{STATUS_TYPE_LABELS[type] || type}</h2>
            <span className="badge">{grouped[type].length}</span>
          </button>
          {!collapsedStatuses[type] && (
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
      ))}
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
