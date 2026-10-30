"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Filter,
  Grid2X2,
  List,
  Moon,
  Plus,
  Minus,
  Search,
  Sparkles,
  Sun,
  Tv,
  X,
  Play,
  MoreHorizontal,
  Trash2,
  Pencil,
  Palette,
  ListVideo,
  ArrowUpDown,
  Keyboard,
  Bot,
  MessageCircle,
  Send,
  Menu,
} from "lucide-react";

type ShortcutMap = Record<string, string>;

const defaultShortcuts: ShortcutMap = {
  add: "a",
  dashboard: "d",
  library: "l",
  watching: "w",
  completed: "c",
  search: "/",
  help: "Shift+?",
};

type Status =
  | "Plan to Watch"
  | "Watching"
  | "On Hold"
  | "Dropped"
  | "Completed";
type Episode = {
  number: number;
  title: string;
  watched: boolean;
  watchedAt?: string;
};
type Season = { number: number; episodes: Episode[] };
type Series = {
  id: string;
  title: string;
  type: "Anime" | "Donghua" | "TV Series";
  status: Status;
  totalSeasons: number;
  totalEpisodes: number;
  seasons: Season[];
  currentSeason: number;
  currentEpisode: number;
  genre: string;
  year: number;
  accent: string;
  lastWatched?: string;
};

const statuses: Status[] = [
  "Watching",
  "Plan to Watch",
  "On Hold",
  "Dropped",
  "Completed",
];
const palette = [
  "#a78bfa",
  "#38bdf8",
  "#fb7185",
  "#fbbf24",
  "#34d399",
  "#f472b6",
];
const statusClass: Record<Status, string> = {
  Watching: "watching",
  "Plan to Watch": "planned",
  "On Hold": "hold",
  Dropped: "dropped",
  Completed: "completed",
};
const posterBackgrounds: Record<string, string> = {
  "Solo Leveling": "linear-gradient(145deg,#11152b,#343c70 48%,#10121f)",
  "The King's Avatar": "linear-gradient(145deg,#0d273c,#14799b 55%,#101827)",
  "Demon Slayer": "linear-gradient(145deg,#3c171e,#c44c45 52%,#20131f)",
  "Attack on Titan": "linear-gradient(145deg,#222d25,#8c7550 52%,#1b2222)",
  "Link Click": "linear-gradient(145deg,#172b55,#547dc5 50%,#111b35)",
  "Jujutsu Kaisen": "linear-gradient(145deg,#191b39,#6554a8 52%,#171329)",
};

function countWatched(s: Series) {
  return s.seasons.reduce(
    (n, season) => n + season.episodes.filter((e) => e.watched).length,
    0,
  );
}
function countEpisodes(s: Series) {
  return s.seasons.reduce((n, season) => n + season.episodes.length, 0);
}
function Poster({
  series,
  large = false,
}: {
  series: Series;
  large?: boolean;
}) {
  return (
    <div
      className={`poster ${large ? "poster-large" : ""}`}
      style={{
        background:
          posterBackgrounds[series.title] ||
          `linear-gradient(145deg,${series.accent},#141522)`,
      }}
    >
      <div className="poster-glow" style={{ background: series.accent }} />
      <span className="poster-kicker">
        {series.type === "TV Series"
          ? "ORIGINAL SERIES"
          : series.type.toUpperCase()}
      </span>
      <div className="poster-art">
        <Clapperboard size={large ? 56 : 38} strokeWidth={1.1} />
      </div>
      <div className="poster-title">{series.title}</div>
      <span className="poster-year">{series.year}</span>
    </div>
  );
}

type ChatMessage = { id: string; role: "assistant" | "user"; content: string };

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [series, setSeries] = useState<Series[]>([]);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accent, setAccent] = useState<
    "violet" | "blue" | "rose" | "emerald" | "amber" | "cyan"
  >("violet");
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [capturingAction, setCapturingAction] = useState<string | null>(null);
  const shortcutCaptureInputRef = useRef<HTMLInputElement>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(defaultShortcuts);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [sort, setSort] = useState("Recently updated");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEpisode, setShowEpisode] = useState(false);
  const [seasonChoice, setSeasonChoice] = useState(1);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<Series["type"]>("Anime");
  const [newSeasons, setNewSeasons] = useState("1");
  const [newGenre, setNewGenre] = useState("");
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newStatus, setNewStatus] = useState<Status>("Plan to Watch");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedActivityDate, setSelectedActivityDate] = useState(() =>
    localDateKey(new Date()),
  );
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I’m your EPIXIO assistant. I can help you add a series, track episodes, understand statuses, search your library, and change your appearance. What would you like to do?",
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("episode-tracker-data");

      if (saved) {
        const parsed = JSON.parse(saved) as Series[];

        const demoIds = new Set(["s1", "s2", "s3", "s4", "s5", "s6"]);

        const demoTitles = new Set([
          "Solo Leveling",
          "The King's Avatar",
          "Demon Slayer",
          "Attack on Titan",
          "Link Click",
          "Jujutsu Kaisen",
        ]);

        setSeries(
          parsed.filter(
            (item) => !demoIds.has(item.id) && !demoTitles.has(item.title),
          ),
        );
      }

      const savedTheme = localStorage.getItem("episode-tracker-theme");

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }

      const savedAccent = localStorage.getItem("episode-tracker-accent");
      const accents = ["violet", "blue", "rose", "emerald", "amber", "cyan"];
      if (savedAccent && accents.includes(savedAccent)) {
        setAccent(savedAccent as typeof accent);
      }
    } catch {
      // Ignore invalid saved data.
    }

    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem("episode-tracker-data", JSON.stringify(series));
  }, [series, ready]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (ready) localStorage.setItem("episode-tracker-theme", theme);
  }, [theme, ready]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    if (ready) localStorage.setItem("episode-tracker-accent", accent);
  }, [accent, ready]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("episode-tracker-shortcuts");
      if (saved)
        setShortcuts({
          ...defaultShortcuts,
          ...(JSON.parse(saved) as ShortcutMap),
        });
    } catch {
      // Keep the default shortcuts if saved settings are invalid.
    }
  }, []);

  useEffect(() => {
    if (
      capturingAction &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      shortcutCaptureInputRef.current?.focus();
    }
  }, [capturingAction]);

  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "episode-tracker-shortcuts",
        JSON.stringify(shortcuts),
      );
  }, [shortcuts, ready]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (capturingAction) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Escape") {
          setCapturingAction(null);
          return;
        }
        if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) return;
        const combo = [
          event.ctrlKey && "Ctrl",
          event.altKey && "Alt",
          event.shiftKey && "Shift",
          event.metaKey && "Meta",
          event.key.length === 1 ? event.key.toLowerCase() : event.key,
        ]
          .filter(Boolean)
          .join("+");
        setShortcuts((current) => ({
          ...Object.fromEntries(
            Object.entries(current).filter(
              ([id, value]) =>
                id === capturingAction ||
                value.toLowerCase() !== combo.toLowerCase(),
            ),
          ),
          [capturingAction]: combo,
        }));
        setCapturingAction(null);
        return;
      }

      if (event.key === "Escape") {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (showShortcuts) setShowShortcuts(false);
        else if (showAdd) setShowAdd(false);
        else if (showEpisode) setShowEpisode(false);
        else if (showAccentPicker) setShowAccentPicker(false);
        return;
      }
      if (typing) return;

      const pressed = [
        event.ctrlKey && "Ctrl",
        event.altKey && "Alt",
        event.shiftKey && "Shift",
        event.metaKey && "Meta",
        event.key.length === 1 ? event.key.toLowerCase() : event.key,
      ]
        .filter(Boolean)
        .join("+");
      const action = Object.entries(shortcuts).find(
        ([, combo]) => combo.toLowerCase() === pressed.toLowerCase(),
      )?.[0];
      if (!action) return;
      event.preventDefault();
      if (action === "add") setShowAdd(true);
      if (action === "dashboard") {
        setActiveTab("Dashboard");
        setSelected(null);
      }
      if (action === "library") {
        setActiveTab("Library");
        setSelected(null);
      }
      if (action === "watching") {
        setActiveTab("Watching");
        setSelected(null);
      }
      if (action === "completed") {
        setActiveTab("Completed");
        setSelected(null);
      }
      if (action === "search")
        document.querySelector<HTMLInputElement>(".search-box input")?.focus();
      if (action === "help") setShowShortcuts(true);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    capturingAction,
    shortcuts,
    showShortcuts,
    showAdd,
    showEpisode,
    showAccentPicker,
    mobileMenuOpen,
  ]);

  const selectedSeries = series.find((s) => s.id === selected) || null;
  const activityByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        items: { title: string; season: number; episode: number }[];
      }
    >();
    series.forEach((item) =>
      item.seasons.forEach((season) =>
        season.episodes.forEach((episode) => {
          if (!episode.watched || !episode.watchedAt) return;
          const date = episode.watchedAt.slice(0, 10);
          const entry = map.get(date) || { count: 0, items: [] };
          entry.count += 1;
          entry.items.push({
            title: item.title,
            season: season.number,
            episode: episode.number,
          });
          map.set(date, entry);
        }),
      ),
    );
    return map;
  }, [series]);
  const activityMonthDate = new Date(`${activityMonth}-01T12:00:00`);
  const activityMonthLabel = activityMonthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const monthStart = new Date(
    activityMonthDate.getFullYear(),
    activityMonthDate.getMonth(),
    1,
  );
  const monthDays = new Date(
    activityMonthDate.getFullYear(),
    activityMonthDate.getMonth() + 1,
    0,
  ).getDate();
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const monthActivity = Array.from({ length: monthDays }, (_, index) => {
    const date = localDateKey(
      new Date(
        activityMonthDate.getFullYear(),
        activityMonthDate.getMonth(),
        index + 1,
      ),
    );
    return {
      date,
      day: index + 1,
      count: activityByDate.get(date)?.count || 0,
    };
  });
  const selectedDayActivity = activityByDate.get(selectedActivityDate);
  const monthlyEpisodeCount = monthActivity.reduce(
    (sum, day) => sum + day.count,
    0,
  );
  const monthlyActiveDays = monthActivity.filter((day) => day.count > 0).length;
  const heatLevel = (count: number) =>
    count === 0
      ? "level-0"
      : count === 1
        ? "level-1"
        : count <= 3
          ? "level-2"
          : count <= 5
            ? "level-3"
            : "level-4";
  const watching = series.filter((s) => s.status === "Watching");
  const completed = series.filter((s) => s.status === "Completed");
  const watchedEpisodes = series.reduce((n, s) => n + countWatched(s), 0);
  const allEpisodes = series.reduce((n, s) => n + countEpisodes(s), 0);
  const filtered = useMemo(
    () =>
      series
        .filter((s) =>
          activeTab === "Library" || activeTab === "Dashboard"
            ? true
            : activeTab === "Watching"
              ? s.status === "Watching"
              : activeTab === "Completed"
                ? s.status === "Completed"
                : true,
        )
        .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
        .filter(
          (s) => statusFilter === "All statuses" || s.status === statusFilter,
        )
        .filter((s) => typeFilter === "All types" || s.type === typeFilter)
        .sort((a, b) =>
          sort === "Title A–Z"
            ? a.title.localeCompare(b.title)
            : sort === "Episodes watched"
              ? countWatched(b) - countWatched(a)
              : sort === "Recently updated"
                ? (b.lastWatched || "").localeCompare(a.lastWatched || "")
                : a.title.localeCompare(b.title),
        ),
    [series, activeTab, search, statusFilter, typeFilter, sort],
  );

  function patchSeries(id: string, fn: (s: Series) => Series) {
    setSeries((old) => old.map((s) => (s.id === id ? fn(s) : s)));
  }
  function toggleEpisode(id: string, seasonNo: number, epNo: number) {
    patchSeries(id, (s) => {
      const seasons = s.seasons.map((season) =>
        season.number !== seasonNo
          ? season
          : {
              ...season,
              episodes: season.episodes.map((ep) =>
                ep.number !== epNo
                  ? ep
                  : {
                      ...ep,
                      watched: !ep.watched,
                      watchedAt: !ep.watched
                        ? localDateKey(new Date())
                        : undefined,
                    },
              ),
            },
      );
      let cs = s.currentSeason,
        ce = s.currentEpisode;
      const flat = seasons.flatMap((sea) =>
        sea.episodes.map((ep) => ({
          season: sea.number,
          episode: ep.number,
          watched: ep.watched,
        })),
      );
      const next = flat.find((ep) => !ep.watched);
      if (next) {
        cs = next.season;
        ce = next.episode;
      } else {
        cs = seasons.at(-1)?.number || 1;
        ce = seasons.at(-1)?.episodes.length || 1;
      }
      return {
        ...s,
        seasons,
        currentSeason: cs,
        currentEpisode: ce,
        status: s.status === "Completed" ? "Watching" : s.status,
        lastWatched: "Just now",
      };
    });
  }
  function addEpisode(id: string, seasonNo: number) {
    patchSeries(id, (s) => {
      const seasons = s.seasons.map((season) => {
        if (season.number !== seasonNo) return season;
        const nextNumber =
          season.episodes.reduce(
            (max, episode) => Math.max(max, episode.number),
            0,
          ) + 1;
        return {
          ...season,
          episodes: [
            ...season.episodes,
            {
              number: nextNumber,
              title: `Episode ${nextNumber}`,
              watched: false,
            },
          ],
        };
      });

      const addedSeason = seasons.find((season) => season.number === seasonNo);
      const nextEpisode = addedSeason?.episodes.length ?? 0;
      return {
        ...s,
        seasons,
        totalEpisodes: countEpisodes({ ...s, seasons }),
        currentSeason: seasonNo,
        currentEpisode: nextEpisode || 1,
        lastWatched: "Just now",
      };
    });
  }

  function removeEpisode(id: string, seasonNo: number) {
    patchSeries(id, (s) => {
      const seasons = s.seasons.map((season) => {
        if (season.number !== seasonNo || season.episodes.length === 0) {
          return season;
        }

        const latestEpisodeNumber = Math.max(
          ...season.episodes.map((episode) => episode.number),
        );
        return {
          ...season,
          episodes: season.episodes.filter(
            (episode) => episode.number !== latestEpisodeNumber,
          ),
        };
      });

      const currentSeason = seasons.find(
        (season) => season.number === seasonNo,
      );
      const remainingEpisodes = currentSeason?.episodes ?? [];
      const latestRemainingEpisode = remainingEpisodes.reduce(
        (max, episode) => Math.max(max, episode.number),
        0,
      );

      return {
        ...s,
        seasons,
        totalEpisodes: countEpisodes({ ...s, seasons }),
        currentSeason: seasonNo,
        currentEpisode: Math.max(1, latestRemainingEpisode),
        lastWatched: "Just now",
      };
    });
  }

  function adjustWatchedEpisodes(id: string, seasonNo: number, change: 1 | -1) {
    patchSeries(id, (s) => {
      const seasons = s.seasons.map((season) => {
        if (season.number !== seasonNo) return season;

        const episodes = [...season.episodes].sort(
          (a, b) => a.number - b.number,
        );

        if (change === 1) {
          const nextUnwatched = episodes.findIndex(
            (episode) => !episode.watched,
          );
          if (nextUnwatched >= 0) {
            episodes[nextUnwatched] = {
              ...episodes[nextUnwatched],
              watched: true,
              watchedAt: localDateKey(new Date()),
            };
          } else {
            const nextNumber =
              episodes.reduce(
                (max, episode) => Math.max(max, episode.number),
                0,
              ) + 1;
            episodes.push({
              number: nextNumber,
              title: `Episode ${nextNumber}`,
              watched: true,
              watchedAt: localDateKey(new Date()),
            });
          }
        } else {
          const lastWatchedIndex = episodes
            .map((episode) => episode.watched)
            .lastIndexOf(true);
          if (lastWatchedIndex >= 0) {
            episodes[lastWatchedIndex] = {
              ...episodes[lastWatchedIndex],
              watched: false,
              watchedAt: undefined,
            };
          }
        }

        return { ...season, episodes };
      });

      const next = seasons
        .flatMap((season) =>
          season.episodes.map((episode) => ({
            season: season.number,
            episode: episode.number,
            watched: episode.watched,
          })),
        )
        .find((episode) => !episode.watched);

      return {
        ...s,
        seasons,
        totalEpisodes: countEpisodes({ ...s, seasons }),
        currentSeason: next?.season ?? seasonNo,
        currentEpisode:
          next?.episode ??
          seasons.find((season) => season.number === seasonNo)?.episodes
            .length ??
          1,
        status: s.status === "Completed" ? "Watching" : s.status,
        lastWatched: "Just now",
      };
    });
  }

  function markSeriesCompleted(id: string) {
    patchSeries(id, (s) => ({ ...s, status: "Completed" }));
  }

  function addSeries() {
    if (!newTitle.trim()) return;
    const ns = Math.max(1, Math.min(20, Number(newSeasons) || 1));
    const seasons = Array.from({ length: ns }, (_, i) => ({
      number: i + 1,
      episodes: [],
    }));
    const item: Series = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      type: newType,
      status: newStatus,
      totalSeasons: ns,
      totalEpisodes: 0,
      seasons,
      currentSeason: 1,
      currentEpisode: 1,
      genre: newGenre.trim() || "Uncategorized",
      year: Number(newYear) || new Date().getFullYear(),
      accent: palette[series.length % palette.length],
    };
    setSeries((old) => [item, ...old]);
    setShowAdd(false);
    setNewTitle("");
    setNewGenre("");
    setActiveTab("Library");
  }
  function deleteSeries(id: string) {
    setSeries((old) => old.filter((s) => s.id !== id));
    setMenuId(null);
    if (selected === id) setSelected(null);
  }
  function updateStatus(id: string, status: Status) {
    patchSeries(id, (s) => ({ ...s, status }));
  }

  function getChatReply(rawMessage: string) {
    const message = rawMessage.toLowerCase();
    const watchingCount = series.filter(
      (item) => item.status === "Watching",
    ).length;
    const completedCount = series.filter(
      (item) => item.status === "Completed",
    ).length;
    const plannedCount = series.filter(
      (item) => item.status === "Plan to Watch",
    ).length;
    const holdCount = series.filter((item) => item.status === "On Hold").length;
    const droppedCount = series.filter(
      (item) => item.status === "Dropped",
    ).length;

    if (/\b(hello|hi|hey|hello there)\b/.test(message)) {
      return "Hey! 👋 Ready to organise your watchlist? Ask me about adding a series, episode progress, statuses, search, or themes.";
    }
    if (
      message.includes("add") ||
      message.includes("new series") ||
      message.includes("create series")
    ) {
      return "To add a series, select the **Add** button in the top bar. Enter its title, type, status, season count, and optional genre/year, then choose **Add to library**. You can add episodes to each season later from the series page.";
    }
    if (
      message.includes("episode") ||
      message.includes("track") ||
      message.includes("progress") ||
      message.includes("watched")
    ) {
      return "Open a series from your Library and use its episode list to mark episodes as watched. You can also use **Update episode** to choose a season and episode, or use the quick update controls on a series card. Your current progress is calculated from the watched episodes.";
    }
    if (
      message.includes("status") ||
      message.includes("hold") ||
      message.includes("dropped") ||
      message.includes("completed") ||
      message.includes("plan to watch")
    ) {
      return `EPIXIO has five statuses:
• Watching — currently following the series
• Plan to Watch — saved for later
• On Hold — paused for now
• Dropped — no longer continuing
• Completed — finished

Your library currently has ${watchingCount} Watching, ${plannedCount} Plan to Watch, ${holdCount} On Hold, ${droppedCount} Dropped, and ${completedCount} Completed.`;
    }
    if (
      message.includes("search") ||
      message.includes("find") ||
      message.includes("filter")
    ) {
      return "Use the search field in the top bar to find a series by title. Search works across your collection and takes you to matching Library results. In the Library, you can also narrow results by status or series type and change the sort order.";
    }
    if (
      message.includes("theme") ||
      message.includes("dark") ||
      message.includes("light") ||
      message.includes("colour") ||
      message.includes("color") ||
      message.includes("accent")
    ) {
      return `You can switch between Dark and Light mode using the sun/moon button. To change the accent, open the palette button and choose Violet, Blue, Rose, Emerald, Amber, or Cyan. The chat follows your selected theme and accent automatically. Current setting: ${theme} mode with ${accent} accent.`;
    }
    if (
      message.includes("how many") ||
      message.includes("my library") ||
      message.includes("collection") ||
      message.includes("stats") ||
      message.includes("overview")
    ) {
      return `Here’s your collection at a glance:
• ${series.length} series in your library
• ${watchingCount} currently watching
• ${completedCount} completed
• ${watchedEpisodes} episodes watched
• ${allEpisodes} episodes listed in total.`;
    }
    if (
      message.includes("help") ||
      message.includes("what can you do") ||
      message.includes("features")
    ) {
      return "I can explain how to add a series, update watched episodes, use the five tracking statuses, search and filter your library, and switch Dark/Light mode or accent colours. I’m a local demo assistant right now, so I explain the steps but don’t change your library for you.";
    }
    return "I can help with adding series, tracking episodes, statuses, searching your library, and theme or accent settings. Try asking “How do I add a donghua?”, “How do I mark an episode watched?”, or “How do I change the accent colour?”";
  }

  function sendChatMessage(message = chatInput) {
    const trimmed = message.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: getChatReply(trimmed),
    };
    setChatMessages((current) => [...current, userMessage, assistantMessage]);
    setChatInput("");
  }

  useEffect(() => {
    if (chatOpen)
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, chatOpen]);

  const nav = [
    { label: "Dashboard", icon: Grid2X2 },
    { label: "Library", icon: Bookmark },
    { label: "Watching", icon: CirclePlay },
    { label: "Completed", icon: CheckCircle2 },
  ];

  return (
    <main className="app-shell ft relative min-h-dvh">
      <aside className="sidebar">
        <div
          className="brand"
          role="button"
          tabIndex={0}
          aria-label="Go to EPIXIO home dashboard"
          title="Go to home"
          onClick={() => {
            setActiveTab("Dashboard");
            setSelected(null);
            setSearch("");
            setStatusFilter("All statuses");
            setTypeFilter("All types");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("Dashboard");
              setSelected(null);
              setSearch("");
              setStatusFilter("All statuses");
              setTypeFilter("All types");
            }
          }}
        >
          <div className="brand-mark">
            <Activity size={21} />
          </div>
          <div>
            <strong>
              EPI<span>XIO</span>
            </strong>
            <small>MY UNIVERSE</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeTab === item.label ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.label);
                setSelected(null);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.label === "Library" && <small>{series.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">YOUR COLLECTION</div>
        <div className="collection-stat">
          <span className="dot dot-purple" />
          <span>Watching</span>
          <b>{watching.length}</b>
        </div>
        <div className="collection-stat">
          <span className="dot dot-green" />
          <span>Completed</span>
          <b>{completed.length}</b>
        </div>
        <div className="collection-stat">
          <span className="dot dot-blue" />
          <span>Episodes watched</span>
          <b>{watchedEpisodes}</b>
        </div>
        <div className="sidebar-bottom">
          <div className="profile-avatar">V</div>
          <div className="profile-text">
            <strong>My Watchlist</strong>
            <span>Personal collection</span>
          </div>
          <button
            className="icon-button small"
            title="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>
      <section className="main-area min-w-0">
        <header className="topbar">
          <div className="mobile-header">
            <div className="mobile-header-leading">
              <div className="mobile-header-brand">
                <span className="mobile-header-icon">
                  <Clapperboard size={25} />
                </span>
                <div className="mobile-header-copy">
                  <strong>EPIXIO</strong>
                  <span>
                    {selectedSeries ? selectedSeries.title : activeTab}
                  </span>
                </div>
              </div>
            </div>
            <div className="mobile-header-actions">
              <button
                className="add-button"
                onClick={() => setShowAdd(true)}
                aria-label="Add series"
              >
                <Plus size={17} /> <span>Add</span>
              </button>
              <div className="mobile-menu-wrap">
                <button
                  className="icon-button mobile-menu-trigger"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  title="Open settings menu"
                  aria-label="Open settings menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
                </button>
                {mobileMenuOpen && (
                  <div className="mobile-settings-menu">
                    <div className="mobile-menu-section">
                      <div className="mobile-menu-label">
                        <Palette size={15} /> Accent colour
                      </div>
                      <div className="mobile-menu-swatches">
                        {(
                          [
                            ["violet", "#8b7cf6", "Violet"],
                            ["blue", "#3b82f6", "Blue"],
                            ["rose", "#f43f5e", "Rose"],
                            ["emerald", "#10b981", "Emerald"],
                            ["amber", "#f59e0b", "Amber"],
                            ["cyan", "#06b6d4", "Cyan"],
                          ] as const
                        ).map(([value, color, label]) => (
                          <button
                            key={value}
                            className={`accent-swatch ${accent === value ? "selected" : ""}`}
                            style={{ "--swatch": color } as React.CSSProperties}
                            onClick={() => setAccent(value)}
                            aria-label={`${label} accent`}
                            aria-pressed={accent === value}
                            title={label}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      className="mobile-menu-action"
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                    >
                      {theme === "dark" ? (
                        <Sun size={17} />
                      ) : (
                        <Moon size={17} />
                      )}
                      <span>
                        {theme === "dark"
                          ? "Switch to light mode"
                          : "Switch to dark mode"}
                      </span>
                    </button>
                    <button
                      className="mobile-menu-action"
                      onClick={() => {
                        setShowShortcuts(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Keyboard size={17} />
                      <span>Keyboard shortcuts</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{selectedSeries ? selectedSeries.title : activeTab}</strong>
          </div>
          <div className="top-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearch(query);

                  // Search globally from every page and show matches in Library.
                  if (query.trim()) {
                    setActiveTab("Library");
                    setSelected(null);
                    setStatusFilter("All statuses");
                    setTypeFilter("All types");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();

                    const query = search.trim().toLowerCase();
                    const match =
                      series.find(
                        (item) => item.title.toLowerCase() === query,
                      ) ||
                      series.find((item) =>
                        item.title.toLowerCase().startsWith(query),
                      ) ||
                      series.find((item) =>
                        item.title.toLowerCase().includes(query),
                      );

                    setActiveTab("Library");
                    setStatusFilter("All statuses");
                    setTypeFilter("All types");

                    // Open the matching series directly; otherwise show Library results.
                    if (match) {
                      setSelected(match.id);
                      setSeasonChoice(match.currentSeason);
                    } else {
                      setSelected(null);
                    }
                  }
                }}
                placeholder="Search all your series..."
                aria-label="Search all series"
              />
              <kbd>⌘ K</kbd>
            </div>
            <div className="accent-picker-wrap desktop-accent-picker">
              <button
                className="icon-button accent-trigger"
                onClick={() => setShowAccentPicker((open) => !open)}
                title="Choose accent color"
                aria-label="Choose accent color"
                aria-expanded={showAccentPicker}
              >
                <Palette size={17} />
              </button>
              {showAccentPicker && (
                <div
                  className="accent-picker"
                  role="group"
                  aria-label="Accent colors"
                >
                  <strong>Accent color</strong>
                  {(
                    [
                      ["violet", "#8b7cf6", "Violet"],
                      ["blue", "#3b82f6", "Blue"],
                      ["rose", "#f43f5e", "Rose"],
                      ["emerald", "#10b981", "Emerald"],
                      ["amber", "#f59e0b", "Amber"],
                      ["cyan", "#06b6d4", "Cyan"],
                    ] as const
                  ).map(([value, color, label]) => (
                    <button
                      key={value}
                      className={`accent-swatch ${accent === value ? "selected" : ""}`}
                      style={{ "--swatch": color } as React.CSSProperties}
                      onClick={() => {
                        setAccent(value);
                        setShowAccentPicker(false);
                      }}
                      aria-label={`${label} accent`}
                      aria-pressed={accent === value}
                      title={label}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              className="icon-button theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="icon-button shortcuts-trigger"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard size={17} />
            </button>
            <button
              className="add-button desktop-add"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={17} /> Add series
            </button>
          </div>
        </header>
        {selectedSeries ? (
          <div className="detail-page flex w-full min-w-0 flex-col">
            <button className="back-link" onClick={() => setSelected(null)}>
              <ChevronLeft size={16} /> Back to{" "}
              {activeTab === "Dashboard" ? "dashboard" : "library"}
            </button>
            <div className="detail-hero">
              <Poster series={selectedSeries} large />
              <div className="detail-info">
                <div className="eyebrow">
                  {selectedSeries.type} <span>·</span> {selectedSeries.year}
                </div>
                <h1>{selectedSeries.title}</h1>
                <p>{selectedSeries.genre}</p>
                <div className="detail-tags">
                  <span
                    className={`status-pill ${statusClass[selectedSeries.status]}`}
                  >
                    {selectedSeries.status}
                  </span>
                  <span>{selectedSeries.totalSeasons} seasons</span>
                  <span>{countEpisodes(selectedSeries)} episodes added</span>
                </div>
                <p className="watched-count">
                  {countWatched(selectedSeries)} episodes watched ·{" "}
                  {countEpisodes(selectedSeries)} episodes added
                </p>
                <div className="detail-buttons">
                  <button
                    className="add-button watched-increment-button"
                    onClick={() =>
                      adjustWatchedEpisodes(selectedSeries.id, seasonChoice, 1)
                    }
                    aria-label={`Mark next episode in season ${seasonChoice} as watched`}
                    title={`Mark next episode in season ${seasonChoice} as watched`}
                  >
                    <Plus size={17} />
                  </button>
                  <button
                    className="secondary-button watched-decrement-button"
                    onClick={() =>
                      adjustWatchedEpisodes(selectedSeries.id, seasonChoice, -1)
                    }
                    aria-label={`Mark latest watched episode in season ${seasonChoice} as unwatched`}
                    title={`Mark latest watched episode in season ${seasonChoice} as unwatched`}
                  >
                    <Minus size={17} />
                  </button>
                  {selectedSeries.status !== "Completed" && (
                    <button
                      className="secondary-button wide"
                      onClick={() => markSeriesCompleted(selectedSeries.id)}
                    >
                      <CheckCircle2 size={16} /> Mark as completed
                    </button>
                  )}
                  <select
                    value={selectedSeries.status}
                    onChange={(e) =>
                      updateStatus(selectedSeries.id, e.target.value as Status)
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="section-heading">
              <div>
                <h2>Episodes</h2>
                <p>
                  Mark episodes as watched to keep your progress up to date.
                </p>
              </div>
              <div className="episode-heading-actions">
                <button
                  className="secondary-button remove-episode-button"
                  onClick={() => removeEpisode(selectedSeries.id, seasonChoice)}
                  disabled={
                    (selectedSeries.seasons.find(
                      (s) => s.number === seasonChoice,
                    )?.episodes.length ?? 0) === 0
                  }
                  title="Remove the latest episode from this season"
                >
                  <Trash2 size={15} /> Remove episode
                </button>
                <button
                  className="secondary-button add-episode-button"
                  onClick={() => addEpisode(selectedSeries.id, seasonChoice)}
                >
                  <Plus size={15} /> Add episode
                </button>
                <select
                  className="select-control"
                  value={seasonChoice}
                  onChange={(e) => setSeasonChoice(Number(e.target.value))}
                >
                  {selectedSeries.seasons.map((s) => (
                    <option key={s.number} value={s.number}>
                      Season {s.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="episode-list">
              {[
                ...(selectedSeries.seasons.find(
                  (s) => s.number === seasonChoice,
                )?.episodes || []),
              ]
                .sort((a, b) => b.number - a.number)
                .map((ep) => (
                  <div
                    className={`episode-row ${ep.watched ? "episode-watched" : ""}`}
                    key={ep.number}
                  >
                    <div className="episode-number">
                      {String(ep.number).padStart(2, "0")}
                    </div>
                    <div className="episode-copy">
                      <strong>{ep.title}</strong>
                      <span>
                        Season {seasonChoice} · Episode {ep.number}
                      </span>
                    </div>
                    <span
                      className={`episode-state ${ep.watched ? "state-watched" : ""}`}
                    >
                      {ep.watched ? (
                        <>
                          <Check size={13} /> Watched
                        </>
                      ) : (
                        "Unwatched"
                      )}
                    </span>
                    <button
                      className={`check-episode ${ep.watched ? "checked" : ""}`}
                      onClick={() =>
                        toggleEpisode(
                          selectedSeries.id,
                          seasonChoice,
                          ep.number,
                        )
                      }
                      aria-label={
                        ep.watched ? "Mark unwatched" : "Mark watched"
                      }
                    >
                      {ep.watched ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="content flex w-full min-w-0 flex-col">
            {activeTab === "Dashboard" && (
              <>
                <div className="welcome-row">
                  <div>
                    <div className="eyebrow">
                      <Sparkles size={14} /> YOUR PERSONAL WATCH HUB
                    </div>
                    <h1>
                      Keep your story <span>going.</span>
                    </h1>
                    <p>Every episode, every world, right where you left off.</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setActiveTab("Library")}
                  >
                    <ListVideo size={16} /> View all series{" "}
                    <ChevronRight size={15} />
                  </button>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Total series</span>
                      <div className="stat-icon purple">
                        <Tv size={18} />
                      </div>
                    </div>
                    <div className="stat-number">
                      {series.length.toString().padStart(2, "0")}
                    </div>
                    <div className="stat-foot">
                      <span className="stat-accent">
                        Across your collection
                      </span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Currently watching</span>
                      <div className="stat-icon blue">
                        <CirclePlay size={18} />
                      </div>
                    </div>
                    <div className="stat-number">
                      {watching.length.toString().padStart(2, "0")}
                    </div>
                    <div className="stat-foot">
                      <span className="tiny-dot blue-dot" />
                      Your ongoing stories
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Episodes watched</span>
                      <div className="stat-icon pink">
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <div className="stat-number">
                      {watchedEpisodes.toString().padStart(2, "0")}
                      <small> / {allEpisodes}</small>
                    </div>
                    <div className="mini-progress">
                      <span
                        style={{
                          width: `${allEpisodes ? (watchedEpisodes / allEpisodes) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Completed series</span>
                      <div className="stat-icon green">
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <div className="stat-number">
                      {completed.length.toString().padStart(2, "0")}
                    </div>
                    <div className="stat-foot">
                      <span className="stat-accent">
                        {series.length
                          ? Math.round((completed.length / series.length) * 100)
                          : 0}
                        % of your collection
                      </span>
                    </div>
                  </div>
                </div>
                <section className="continue-section">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Pick up where you left off{" "}
                        <span className="heading-spark">✦</span>
                      </h2>
                      <p>Your next episode is just a click away.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActiveTab("Watching")}
                    >
                      See all watching <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="continue-grid">
                    {watching.slice(0, 3).map((s) => (
                      <div className="continue-card" key={s.id}>
                        <button
                          className="poster-button"
                          onClick={() => {
                            setSelected(s.id);
                            setSeasonChoice(s.currentSeason);
                          }}
                        >
                          <Poster series={s} />
                          <span className="poster-play">
                            <Play size={18} fill="currentColor" />
                          </span>
                        </button>
                        <div className="continue-info">
                          <div className="continue-title-row">
                            <button
                              className="title-link"
                              onClick={() => {
                                setSelected(s.id);
                                setSeasonChoice(s.currentSeason);
                              }}
                            >
                              {s.title}
                            </button>
                            <span className="percent">
                              {countWatched(s)} watched
                            </span>
                          </div>
                          <span className="episode-meta">
                            S{s.currentSeason} · E{s.currentEpisode}{" "}
                            <span>•</span> {s.type}
                          </span>
                          <div className="episode-meta">
                            {countEpisodes(s)} episodes added ·{" "}
                            {countWatched(s)} watched
                          </div>
                          <button
                            className="next-episode"
                            onClick={() =>
                              toggleEpisode(
                                s.id,
                                s.currentSeason,
                                s.currentEpisode,
                              )
                            }
                          >
                            <Check size={14} /> Mark episode watched
                          </button>
                        </div>
                      </div>
                    ))}
                    {watching.length === 0 && (
                      <div className="empty-state">
                        Nothing in progress yet. Add a series and start
                        watching.
                      </div>
                    )}
                  </div>
                </section>
                <section className="watch-activity-section">
                  <div className="section-heading activity-heading">
                    <div>
                      <h2>
                        <Activity size={19} /> Watch activity{" "}
                        <span className="heading-spark">✦</span>
                      </h2>
                      <p>Your viewing history, month by month.</p>
                    </div>
                    <span className="activity-total">
                      {monthlyEpisodeCount} episodes this month
                    </span>
                  </div>
                  <div className="activity-heatmap-card activity-month-card">
                    <div className="activity-month-header">
                      <div>
                        <strong>{activityMonthLabel}</strong>
                        <span>
                          {monthlyEpisodeCount} episodes · {monthlyActiveDays}{" "}
                          active days
                        </span>
                      </div>
                      <div className="activity-month-nav">
                        <button
                          type="button"
                          className="icon-button small"
                          aria-label="Previous month"
                          onClick={() => {
                            const d = new Date(
                              activityMonthDate.getFullYear(),
                              activityMonthDate.getMonth() - 1,
                              1,
                            );
                            setActivityMonth(
                              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                            );
                            setSelectedActivityDate(localDateKey(d));
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button small"
                          aria-label="Next month"
                          disabled={
                            activityMonth >=
                            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
                          }
                          onClick={() => {
                            const d = new Date(
                              activityMonthDate.getFullYear(),
                              activityMonthDate.getMonth() + 1,
                              1,
                            );
                            setActivityMonth(
                              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                            );
                            setSelectedActivityDate(localDateKey(d));
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                    <div
                      className="activity-calendar heatmap-month-grid"
                      role="group"
                      aria-label={`Watch activity for ${activityMonthLabel}`}
                    >
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day) => (
                          <span className="calendar-weekday" key={day}>
                            {day}
                          </span>
                        ),
                      )}
                      {Array.from({ length: monthOffset }, (_, i) => (
                        <span className="calendar-empty" key={`empty-${i}`} />
                      ))}
                      {monthActivity.map((day) => (
                        <button
                          type="button"
                          key={day.date}
                          className={`calendar-day ${heatLevel(day.count)} ${selectedActivityDate === day.date ? "selected" : ""}`}
                          onClick={() => setSelectedActivityDate(day.date)}
                          aria-label={`${day.date}, ${day.count} episodes watched`}
                          title={`${day.count} episodes watched`}
                        >
                          {day.day}
                          {day.count > 0 && <i />}
                        </button>
                      ))}
                    </div>
                    <div className="heatmap-legend">
                      <span>Less</span>
                      {[0, 1, 2, 3, 4].map((level) => (
                        <i
                          key={level}
                          className={`heatmap-cell level-${level}`}
                        />
                      ))}
                      <span>More</span>
                    </div>
                    <div className="activity-day-detail">
                      <div className="activity-detail-date">
                        <strong>
                          {new Date(
                            `${selectedActivityDate}T12:00:00`,
                          ).toLocaleDateString(undefined, {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </strong>
                        <span>
                          {selectedDayActivity?.count || 0} episodes watched
                        </span>
                      </div>
                      {selectedDayActivity?.items.length ? (
                        <ul>
                          {selectedDayActivity.items.map((item, index) => (
                            <li
                              key={`${item.title}-${item.season}-${item.episode}-${index}`}
                            >
                              <span>{item.title}</span>
                              <small>
                                Season {item.season} · Episode {item.episode}
                              </small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="activity-empty-day">
                          No episodes recorded for this date.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
            {activeTab !== "Dashboard" && (
              <div className="library-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      {activeTab === "Dashboard"
                        ? "Your library"
                        : activeTab === "Library"
                          ? "Series library"
                          : activeTab === "Watching"
                            ? "Currently watching"
                            : "Completed series"}{" "}
                      <span className="count-badge">{filtered.length}</span>
                    </h2>
                    <p>
                      {activeTab === "Dashboard"
                        ? "All your worlds, neatly organised."
                        : "Find a series, update its status, or jump back into an episode."}
                    </p>
                  </div>
                  {activeTab === "Dashboard" && (
                    <button
                      className="text-button"
                      onClick={() => setActiveTab("Library")}
                    >
                      Explore library <ChevronRight size={15} />
                    </button>
                  )}
                </div>
                <div className="filter-bar">
                  <div className="filter-left">
                    <div className="filter-label">
                      <Filter size={15} /> Filters
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option>All statuses</option>
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option>All types</option>
                      <option>Anime</option>
                      <option>Donghua</option>
                      <option>TV Series</option>
                    </select>
                  </div>
                  <div className="filter-right">
                    <ArrowUpDown size={14} />
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option>Recently updated</option>
                      <option>Title A–Z</option>
                      <option>Episodes watched</option>
                    </select>
                    <div className="view-toggle">
                      <button
                        className={view === "grid" ? "selected" : ""}
                        onClick={() => setView("grid")}
                        title="Grid view"
                      >
                        <Grid2X2 size={15} />
                      </button>
                      <button
                        className={view === "list" ? "selected" : ""}
                        onClick={() => setView("list")}
                        title="List view"
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  className={`series-grid ${view === "list" ? "list-view" : ""}`}
                >
                  {filtered
                    .slice(0, activeTab === "Dashboard" ? 6 : undefined)
                    .map((s) => (
                      <article className="series-card" key={s.id}>
                        <button
                          className="card-poster"
                          onClick={() => {
                            setSelected(s.id);
                            setSeasonChoice(s.currentSeason);
                          }}
                        >
                          <Poster series={s} />
                          <span
                            className={`status-pill card-status ${statusClass[s.status]}`}
                          >
                            {s.status}
                          </span>
                          <span className="card-open">
                            <ChevronRight size={17} />
                          </span>
                        </button>
                        <div className="card-content">
                          <div className="card-title-row">
                            <button
                              className="title-link"
                              onClick={() => {
                                setSelected(s.id);
                                setSeasonChoice(s.currentSeason);
                              }}
                            >
                              {s.title}
                            </button>
                            <div className="menu-wrap">
                              <button
                                className="icon-button tiny"
                                onClick={() =>
                                  setMenuId(menuId === s.id ? null : s.id)
                                }
                                aria-label="Series actions"
                              >
                                <MoreHorizontal size={17} />
                              </button>
                              {menuId === s.id && (
                                <div className="action-menu">
                                  <button
                                    onClick={() => {
                                      setSelected(s.id);
                                      setSeasonChoice(s.currentSeason);
                                      setMenuId(null);
                                    }}
                                  >
                                    <Pencil size={14} /> View / edit
                                  </button>
                                  <button
                                    className="danger"
                                    onClick={() => deleteSeries(s.id)}
                                  >
                                    <Trash2 size={14} /> Remove series
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="card-subtitle">
                            {s.type} <span>·</span> {s.year} <span>·</span>{" "}
                            {s.genre}
                          </div>
                          <div className="card-progress-label">
                            <span>
                              {countWatched(s)} watched · {countEpisodes(s)}{" "}
                              added
                            </span>
                          </div>
                          <div className="card-footer">
                            <span
                              className={`footer-status ${statusClass[s.status]}`}
                            >
                              <span className="tiny-dot" /> {s.status}
                            </span>
                            <button
                              className="quick-update"
                              onClick={() => {
                                setSelected(s.id);
                                setSeasonChoice(s.currentSeason);
                              }}
                            >
                              View episodes <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  {filtered.length === 0 && (
                    <div className="empty-state">
                      <Search size={22} />
                      <strong>No series found</strong>
                      <span>Try changing your search or filters.</span>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("All statuses");
                          setTypeFilter("All types");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      {showShortcuts && (
        <div
          className="modal-backdrop shortcut-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowShortcuts(false);
              setCapturingAction(null);
            }
          }}
        >
          <div
            className="modal shortcuts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  <Keyboard size={13} /> PERSONALIZE
                </span>
                <h2 id="shortcuts-title">Keyboard shortcuts</h2>
                <p>
                  Choose an action, then press the key or key combination you
                  want.
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setShowShortcuts(false);
                  setCapturingAction(null);
                }}
                aria-label="Close shortcuts"
              >
                <X size={18} />
              </button>
            </div>
            <input
              ref={shortcutCaptureInputRef}
              className="shortcut-capture-input"
              aria-label="Type a key for the selected shortcut"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              onChange={(event) => {
                if (!capturingAction) return;
                const typed = event.target.value.trim();
                if (!typed) return;
                const key = typed.slice(-1).toLowerCase();
                setShortcuts((current) => ({
                  ...Object.fromEntries(
                    Object.entries(current).filter(
                      ([id, value]) =>
                        id === capturingAction || value.toLowerCase() !== key,
                    ),
                  ),
                  [capturingAction]: key,
                }));
                setCapturingAction(null);
                event.target.value = "";
              }}
            />
            <div className="shortcut-list">
              {[
                ["add", "Add series"],
                ["dashboard", "Go to Dashboard"],
                ["library", "Open Library"],
                ["watching", "Open Watching"],
                ["completed", "Open Completed"],
                ["search", "Focus search"],
                ["help", "Show shortcuts"],
              ].map(([id, label]) => (
                <div className="shortcut-row" key={id}>
                  <span>{label}</span>
                  <button
                    className={`shortcut-key ${capturingAction === id ? "recording" : ""}`}
                    onClick={() => setCapturingAction(id)}
                    aria-label={`Change shortcut for ${label}`}
                  >
                    {capturingAction === id
                      ? "Press a key…"
                      : shortcuts[id] || "Not set"}
                  </button>
                </div>
              ))}
            </div>
            <p className="shortcut-hint pt-3 pb-1">
              Shortcuts work outside text fields. Press Escape to cancel key
              recording.
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setShortcuts(defaultShortcuts);
                  setCapturingAction(null);
                }}
              >
                Reset defaults
              </button>
              <button
                className="add-button"
                onClick={() => {
                  setShowShortcuts(false);
                  setCapturingAction(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {showAdd && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  <Plus size={13} /> COLLECTION
                </span>
                <h2>Add a new series</h2>
                <p>Set up a title to start tracking your progress.</p>
              </div>
              <button className="icon-button" onClick={() => setShowAdd(false)}>
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSeries();
              }}
            >
              <label>
                Series title
                <input
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Frieren: Beyond Journey's End"
                />
              </label>
              <div className="form-row">
                <label>
                  Type
                  <select
                    value={newType}
                    onChange={(e) =>
                      setNewType(e.target.value as Series["type"])
                    }
                  >
                    <option>Anime</option>
                    <option>Donghua</option>
                    <option>TV Series</option>
                  </select>
                </label>
                <label>
                  Initial status
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as Status)}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Seasons
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newSeasons}
                    onChange={(e) => setNewSeasons(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Genre (optional)
                  <input
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="Action · Fantasy"
                  />
                </label>
                <label>
                  Release year
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                  />
                </label>
              </div>
              <p className="form-note">
                Episodes are unlimited. Add them to each season as you watch,
                and mark the series completed when it ends.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-button">
                  <Plus size={16} /> Add to library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEpisode && selectedSeries && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowEpisode(false);
          }}
        >
          <div className="modal compact-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  <CirclePlay size={13} /> WATCH PROGRESS
                </span>
                <h2>Update episode</h2>
                <p>{selectedSeries.title}</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowEpisode(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="episode-update">
              <label>
                Season
                <select
                  value={seasonChoice}
                  onChange={(e) => setSeasonChoice(Number(e.target.value))}
                >
                  {selectedSeries.seasons.map((s) => (
                    <option key={s.number} value={s.number}>
                      Season {s.number}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Episode
                <select
                  id="episode-select"
                  defaultValue={selectedSeries.currentEpisode}
                >
                  {(
                    selectedSeries.seasons.find(
                      (s) => s.number === seasonChoice,
                    )?.episodes || []
                  ).map((ep) => (
                    <option key={ep.number} value={ep.number}>
                      Episode {ep.number}
                      {ep.watched ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowEpisode(false)}
              >
                Cancel
              </button>
              <button
                className="add-button"
                onClick={() => {
                  const el = document.getElementById(
                    "episode-select",
                  ) as HTMLSelectElement | null;
                  if (el)
                    toggleEpisode(
                      selectedSeries.id,
                      seasonChoice,
                      Number(el.value),
                    );
                  setShowEpisode(false);
                }}
              >
                <Check size={16} /> Toggle watched
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="chat-widget">
        {chatOpen && (
          <section
            className="chat-panel"
            role="dialog"
            aria-label="EPIXIO assistant"
            aria-modal="false"
          >
            <header className="chat-header">
              <div className="chat-assistant-identity">
                <span className="chat-avatar">
                  <Bot size={20} />
                </span>
                <div className="chat-heading-copy">
                  <strong>EPIXIO Assistant</strong>
                  <span>
                    <i /> Here to help with your watchlist
                  </span>
                </div>
              </div>
              <button
                className="chat-close"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </header>

            <div className="chat-messages" aria-live="polite">
              <div className="chat-day-label">YOUR WATCHLIST ASSISTANT</div>
              {chatMessages.map((message) => (
                <div
                  className={`chat-message-row ${message.role === "user" ? "from-user" : "from-assistant"}`}
                  key={message.id}
                >
                  {message.role === "assistant" && (
                    <span className="chat-message-avatar">
                      <Bot size={14} />
                    </span>
                  )}
                  <div className="chat-bubble">
                    {message.content.split("\n").map((line, index) => (
                      <span
                        className="chat-line"
                        key={`${message.id}-${index}`}
                      >
                        {line.startsWith("• ") ? (
                          <>
                            <b>•</b>
                            {line.slice(1)}
                          </>
                        ) : (
                          line
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {chatMessages.length === 1 && (
              <div className="chat-suggestions">
                <button
                  onClick={() => sendChatMessage("How do I add a series?")}
                >
                  ＋ Add a series
                </button>
                <button
                  onClick={() => sendChatMessage("How do I track episodes?")}
                >
                  ◷ Track episodes
                </button>
                <button
                  onClick={() => sendChatMessage("How do I change the theme?")}
                >
                  ◐ Change theme
                </button>
              </div>
            )}

            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendChatMessage();
              }}
            >
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about your watchlist..."
                aria-label="Message the EPIXIO assistant"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                aria-label="Send message"
                title="Send message"
              >
                <Send size={17} />
              </button>
            </form>
            <p className="chat-disclaimer">
              Demo assistant · Replies are generated locally
            </p>
          </section>
        )}
        <button
          className={`chat-launcher ${chatOpen ? "is-open" : ""}`}
          onClick={() => setChatOpen((open) => !open)}
          aria-label={chatOpen ? "Close assistant" : "Open assistant"}
          aria-expanded={chatOpen}
          title="Chat with EPIXIO"
        >
          {chatOpen ? (
            <X size={23} />
          ) : (
            <>
              <MessageCircle size={23} />
              <span className="chat-launcher-spark">✦</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}
