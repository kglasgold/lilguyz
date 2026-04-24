import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DANCE_PATTERN = /\bdance\s*party\b/i;
const GROVE_PATTERN = /\bbohemian\s*grove\b/i;
const MURDER_PATTERN = /\bmurder\s*scene\b/i;
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
    name: "PM-Bot",
    description: "Tracks issues and task status.",
    pixel: "linear",
  },
  {
    id: "pr",
    name: "PR Shepherd",
    description: "Review, CI, and merge blockers.",
    pixel: "pr",
  },
  {
    id: "notes",
    name: "Notes Scout",
    description: "Finds relevant notes and docs.",
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
  const [prSummary, setPrSummary] = useState(null);
  const [issues, setIssues] = useState([]);
  const [issuesLoaded, setIssuesLoaded] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [message, setMessage] = useState("");
  const [lastAgent, setLastAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [agentFilter, setAgentFilter] = useState(null);
  const [forceLanding, setForceLanding] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const prevDueIds = useRef(new Set());
  const [danceParty, setDanceParty] = useState(false);
  const [bohemianGrove, setBohemianGrove] = useState(false);
  const [murderScene, setMurderScene] = useState(false);

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

  const filteredWatches = useMemo(() => {
    if (!agentFilter) return watches;
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
    void refreshWatches();
    void fetchPRs();
    void fetchIssues();
    void fetchGreeting();
    const interval = setInterval(() => {
      void refreshWatches({ quiet: true });
    }, 10_000);
    const prInterval = setInterval(() => {
      void fetchPRs();
    }, 60_000);
    const issueInterval = setInterval(() => {
      void fetchIssues();
    }, 60_000);
    return () => { clearInterval(interval); clearInterval(prInterval); clearInterval(issueInterval); };
  }, []);

  async function fetchPRs() {
    try {
      const payload = await apiGet("/api/prs");
      setPrs(payload.prs || []);
      setPrSummary(payload.summary || null);
      setPrsLoaded(true);
    } catch (err) {
      console.error("Failed to fetch PRs:", err.message);
    }
  }

  async function fetchGreeting() {
    try {
      const payload = await apiGet("/api/greeting");
      if (payload.greeting) setGreeting(payload.greeting);
    } catch {}
  }

  async function fetchIssues() {
    try {
      const payload = await apiGet("/api/issues");
      setIssues(payload.issues || []);
      setIssuesLoaded(true);
    } catch (err) {
      console.error("Failed to fetch issues:", err.message);
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

    setLoading(true);
    setMessage("");

    try {
      const payload = await apiPost("/api/tasks", {
        instruction: instruction.trim(),
      });
      setWatches(payload.watches);
      setCounts(payload.counts || {});
      setInstruction("");
      setForceLanding(false);
      const agentName = AGENTS.find((a) => a.id === payload.agent)?.name || payload.agent;
      setLastAgent(payload.agent);
      if (payload.agent === "linear" && payload.watch?.linearIssue) {
        setMessage(`${agentName} created ${payload.watch.linearIssue.identifier}`);
      } else if (payload.agent === "linear" && !payload.linearConfigured) {
        setMessage(`${agentName} picked this up (no Linear key)`);
      } else {
        setMessage(`${agentName} picked this up`);
      }
      setTimeout(() => {
        setMessage("");
        setLastAgent(null);
      }, 3000);
    } catch (error) {
      setMessage(error.message);
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
    return agentCount(agentId);
  }

  const totalActive = watches.filter((w) => w.status !== "resolved").length;
  const showLanding = forceLanding || (!initialLoad && totalActive === 0 && !agentFilter);

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
              className={`agentChip ${agentFilter === null ? "active" : ""}`}
              onClick={() => setAgentFilter(null)}
            >
              <span className="chipLabel">All</span>
              <span className="chipCount">{totalActive}</span>
            </button>
            {AGENTS.map((agent) => {
              const count = agentDisplayCount(agent.id);
              const hasDue = agentDueCount(agent.id) > 0;
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={`agentChip ${agentFilter === agent.id ? "active" : ""} ${hasDue ? "hasDue" : ""}`}
                  onClick={() => setAgentFilter(agentFilter === agent.id ? null : agent.id)}
                  style={{ "--agent-color": AGENT_COLORS[agent.id] }}
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

          {agentFilter === "pr" ? (
            <PRList prs={prs} loaded={prsLoaded} summary={prSummary} onRefresh={fetchPRs} />
          ) : agentFilter === "linear" ? (
            <IssueList issues={issues} loaded={issuesLoaded} />
          ) : !initialLoad && (
            <div className="watchesLayout">
              {dueWatches.length > 0 && (
                <WatchSection
                  title="Needs attention"
                  watches={dueWatches}
                  variant="due"
                  onDelete={handleDelete}
                  onResolve={handleResolve}
                  onSnooze={handleSnooze}
                />
              )}

              {activeWatches.length > 0 && (
                <WatchSection
                  title="Active"
                  watches={activeWatches}
                  onDelete={handleDelete}
                  onResolve={handleResolve}
                  onSnooze={handleSnooze}
                />
              )}

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

              {filteredWatches.length === 0 && (
                <div className="emptyState">
                  <PixelSprite type={agentFilter || "boss"} size={48} />
                  <p>
                    {agentFilter
                      ? `No tasks for ${AGENTS.find((a) => a.id === agentFilter)?.name || agentFilter}.`
                      : "No tasks yet. Tell me what to track."}
                  </p>
                </div>
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
    { type: "linear", name: "PM-Bot" },
    { type: "pr", name: "PR Shepherd" },
    { type: "notes", name: "Notes Scout" },
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

function IssueList({ issues, loaded }) {
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
      </div>
    );
  }

  const grouped = {};
  for (const issue of issues) {
    const type = issue.statusType || "unstarted";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(issue);
  }

  return (
    <div className="watchesLayout">
      {STATUS_TYPE_ORDER.filter((t) => grouped[t]?.length > 0).map((type) => (
        <section key={type} className={`watchSection ${type === "urgent" ? "due" : ""}`}>
          <div className="sectionHead">
            <h2>{STATUS_TYPE_LABELS[type] || type}</h2>
            <span className="badge">{grouped[type].length}</span>
          </div>
          <div className="watchList">
            {grouped[type].map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IssueCard({ issue }) {
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
      </div>
    </a>
  );
}

function PRList({ prs, loaded, summary, onRefresh }) {
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
      </div>
    );
  }

  const needsAttention = prs.filter((p) => p.status === "changes" || p.status === "failing");
  const ready = prs.filter((p) => p.status === "ready" || p.status === "approved");
  const rest = prs.filter((p) => !needsAttention.includes(p) && !ready.includes(p));

  return (
    <div className="watchesLayout">
      {summary && (
        <div className="llmSummary">
          <PixelSprite type="pr" size={18} />
          <p>{summary}</p>
        </div>
      )}
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

async function apiGet(path) {
  const response = await fetch(path);
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
