import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeagueRecord {
  wins: number;
  losses: number;
}

interface Game {
  gamePk: number;
  gameDate: string;
  status: { abstractGameState: string };
  venue?: { name: string };
  teams: { away: TeamData; home: TeamData };
  linescore?: {
    teams: {
      away: { runs: number };
      home: { runs: number };
    };
  };
}

interface ProbablePitcher {
  id: number;
  fullName: string;
}

interface TeamData {
  team: { id: number; name: string };
  leagueRecord?: LeagueRecord;
  probablePitcher?: ProbablePitcher;
}

interface Game {
  gamePk: number;
  gameDate: string;
  status: { abstractGameState: string };
  venue?: { name: string };
  teams: { away: TeamData; home: TeamData };
}

interface HittingStats {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  runs: number;
  games: number;
  strikeOuts: number;
  baseOnBalls: number;
  atBats: number;
  homeRuns: number;
}

interface PitchingStats {
  era: number;
  whip: number;
  strikeOuts: number;
  baseOnBalls: number;
  inningsPitched: number;
  wins: number;
  losses: number;
}

interface ModelResult {
  awayER: number;
  homeER: number;
  awayWP: number;
  homeWP: number;
  awayOffIdx: number;
  homeOffIdx: number;
  awayPitIdx: number;
  homePitIdx: number;
  awayRecordIdx: number;
  homeRecordIdx: number;
  awayOff: HittingStats;
  homeOff: HittingStats;
  awayPit: PitchingStats | null;
  homePit: PitchingStats | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MLB_BASE = "https://statsapi.mlb.com/api/v1";
const PROXY = "https://corsproxy.io/?url=";

// ─── API helpers ──────────────────────────────────────────────────────────────

async function mlbFetch<T>(path: string): Promise<T> {
  const url = MLB_BASE + path;
  try {
    const r = await fetch(PROXY + encodeURIComponent(url));
    if (!r.ok) throw new Error("proxy failed");
    return (await r.json()) as T;
  } catch {
    const r2 = await fetch(url);
    return (await r2.json()) as T;
  }
}

// ─── Stat extractors ──────────────────────────────────────────────────────────

function extractHitting(data: Record<string, unknown>): HittingStats {
  const stats =
    (data.stats as Array<{
      splits?: Array<{ stat?: Record<string, string> }>;
    }>) || [];
  const s = stats[0]?.splits?.[0]?.stat || {};
  return {
    avg: parseFloat(s.avg) || 0.245,
    obp: parseFloat(s.obp) || 0.315,
    slg: parseFloat(s.slg) || 0.4,
    ops: parseFloat(s.ops) || 0.715,
    runs: parseFloat(s.runs) || 0,
    games: parseFloat(s.gamesPlayed) || 1,
    strikeOuts: parseFloat(s.strikeOuts) || 0,
    baseOnBalls: parseFloat(s.baseOnBalls) || 0,
    atBats: parseFloat(s.atBats) || 1,
    homeRuns: parseFloat(s.homeRuns) || 0,
  };
}

function extractPitching(data: Record<string, unknown>): PitchingStats {
  const stats =
    (data.stats as Array<{
      splits?: Array<{ stat?: Record<string, string> }>;
    }>) || [];
  const s = stats[0]?.splits?.[0]?.stat || {};
  return {
    era: parseFloat(s.era) || 4.5,
    whip: parseFloat(s.whip) || 1.3,
    strikeOuts: parseFloat(s.strikeOuts) || 0,
    baseOnBalls: parseFloat(s.baseOnBalls) || 0,
    inningsPitched: parseFloat(s.inningsPitched) || 1,
    wins: parseFloat(s.wins) || 0,
    losses: parseFloat(s.losses) || 0,
  };
}

// ─── Model ────────────────────────────────────────────────────────────────────

function computeModel(
  awayOff: HittingStats,
  homeOff: HittingStats,
  awayPit: PitchingStats | null,
  homePit: PitchingStats | null,
  game: Game,
): ModelResult {
  const LEAGUE_RUNS = 4.6;
  const LEAGUE_OPS = 0.715;
  const LEAGUE_ERA = 4.5;

  const offenseIndex = (off: HittingStats) => {
    const opsIdx = off.ops / LEAGUE_OPS;
    const rpg = off.games > 0 ? off.runs / off.games : 4.6;
    return 0.6 * opsIdx + 0.4 * (rpg / LEAGUE_RUNS);
  };

  const pitcherIndex = (pit: PitchingStats | null) => {
    if (!pit) return 1.0;
    const eraIdx = LEAGUE_ERA / Math.max(pit.era, 0.5);
    const kPerBf =
      pit.inningsPitched > 0 ? pit.strikeOuts / (pit.inningsPitched * 3) : 0.2;
    const bbPerBf =
      pit.inningsPitched > 0
        ? pit.baseOnBalls / (pit.inningsPitched * 3)
        : 0.08;
    const kbbIdx = (kPerBf - bbPerBf + 0.12) / 0.12;
    const whipIdx = 1.3 / Math.max(pit.whip, 0.5);
    return (
      0.45 * eraIdx +
      0.3 * Math.max(0.5, Math.min(1.5, kbbIdx)) +
      0.25 * whipIdx
    );
  };

  const awayOffIdx = offenseIndex(awayOff);
  const homeOffIdx = offenseIndex(homeOff);
  const awayPitIdx = pitcherIndex(awayPit);
  const homePitIdx = pitcherIndex(homePit);

  const awayW = game.teams.away.leagueRecord?.wins || 0;
  const awayL = game.teams.away.leagueRecord?.losses || 1;
  const homeW = game.teams.home.leagueRecord?.wins || 0;
  const homeL = game.teams.home.leagueRecord?.losses || 1;
  const awayRecordIdx = 0.9 + (awayW / (awayW + awayL)) * 0.2;
  const homeRecordIdx = 0.9 + (homeW / (homeW + homeL)) * 0.2;

  const erA = LEAGUE_RUNS * (awayOffIdx / homePitIdx) * awayRecordIdx;
  const erB = LEAGUE_RUNS * (homeOffIdx / awayPitIdx) * homeRecordIdx * 1.025;

  const gamma = 1.83;
  const erAg = Math.pow(erA, gamma);
  const erBg = Math.pow(erB, gamma);

  return {
    awayER: erA,
    homeER: erB,
    awayWP: erAg / (erAg + erBg),
    homeWP: erBg / (erAg + erBg),
    awayOffIdx,
    homeOffIdx,
    awayPitIdx,
    homePitIdx,
    awayRecordIdx,
    homeRecordIdx,
    awayOff,
    homeOff,
    awayPit,
    homePit,
  };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function displayDate(d: Date): string {
  return d.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IndexBadge({ value }: { value: number }) {
  const pct = Math.round((value - 1) * 100);
  const good = value >= 1;
  return (
    <span
      className={`text-xs font-medium ${good ? "text-green-700" : "text-red-700"}`}
    >
      {value.toFixed(2)} ({pct >= 0 ? "+" : ""}
      {pct}%)
    </span>
  );
}

function FactorRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function ResultPanel({ result, game }: { result: ModelResult; game: Game }) {
  const awayName = game.teams.away.team.name;
  const homeName = game.teams.home.team.name;
  const awayPct = (result.awayWP * 100).toFixed(1);
  const homePct = (result.homeWP * 100).toFixed(1);

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-[11px] font-medium tracking-wider uppercase text-gray-400 mb-3">
        Modell eredmény — Pythagorean (γ=1.83)
      </p>

      {/* Win probability bars */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          { name: awayName, pct: awayPct, colorClass: "bg-blue-500" },
          { name: `${homeName} 🏠`, pct: homePct, colorClass: "bg-orange-500" },
        ].map(({ name, pct, colorClass }) => (
          <div key={name}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="truncate mr-1">{name}</span>
              <span className="font-medium text-gray-700 shrink-0">{pct}%</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-gray-200">
              <div
                className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Expected runs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          {
            label: `${awayName} várható futás`,
            value: result.awayER.toFixed(2),
          },
          {
            label: `${homeName} várható futás`,
            value: result.homeER.toFixed(2),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center"
          >
            <p className="text-[11px] text-gray-400 truncate">{label}</p>
            <p className="text-lg font-medium text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Factor grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
            Vendég faktorok
          </p>
          <FactorRow label="Offense index">
            <IndexBadge value={result.awayOffIdx} />
          </FactorRow>
          <FactorRow label="Pitcher index">
            <IndexBadge value={result.awayPitIdx} />
          </FactorRow>
          <FactorRow label="Record index">
            <IndexBadge value={result.awayRecordIdx} />
          </FactorRow>
          <FactorRow label="OPS">
            <span className="text-xs font-medium text-gray-700">
              {result.awayOff.ops.toFixed(3)}
            </span>
          </FactorRow>
          {result.awayPit && (
            <>
              <FactorRow label="ERA">
                <span className="text-xs font-medium text-gray-700">
                  {result.awayPit.era.toFixed(2)}
                </span>
              </FactorRow>
              <FactorRow label="WHIP">
                <span className="text-xs font-medium text-gray-700">
                  {result.awayPit.whip.toFixed(2)}
                </span>
              </FactorRow>
            </>
          )}
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
            Hazai faktorok
          </p>
          <FactorRow label="Offense index">
            <IndexBadge value={result.homeOffIdx} />
          </FactorRow>
          <FactorRow label="Pitcher index">
            <IndexBadge value={result.homePitIdx} />
          </FactorRow>
          <FactorRow label="Record index">
            <IndexBadge value={result.homeRecordIdx} />
          </FactorRow>
          <FactorRow label="OPS">
            <span className="text-xs font-medium text-gray-700">
              {result.homeOff.ops.toFixed(3)}
            </span>
          </FactorRow>
          {result.homePit && (
            <>
              <FactorRow label="ERA">
                <span className="text-xs font-medium text-gray-700">
                  {result.homePit.era.toFixed(2)}
                </span>
              </FactorRow>
              <FactorRow label="WHIP">
                <span className="text-xs font-medium text-gray-700">
                  {result.homePit.whip.toFixed(2)}
                </span>
              </FactorRow>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-300 mt-3">
        Adatok: MLB Stats API (statsapi.mlb.com). Modell: OPS/ERA alapú
        offense–prevention, Pythagorean győzelmi valószínűség.
      </p>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const [calcState, setCalcState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [result, setResult] = useState<ModelResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const away = game.teams.away;
  const home = game.teams.home;
  const awayRecord = away.leagueRecord
    ? `${away.leagueRecord.wins}-${away.leagueRecord.losses}`
    : "";
  const homeRecord = home.leagueRecord
    ? `${home.leagueRecord.wins}-${home.leagueRecord.losses}`
    : "";
  const awayPitcher = away.probablePitcher?.fullName ?? "TBD";
  const homePitcher = home.probablePitcher?.fullName ?? "TBD";

  const gameTime = new Date(game.gameDate).toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const state = game.status.abstractGameState;

  const badgeText =
    state === "Live" ? "ÉLŐ" : state === "Final" ? "Befejezett" : "Tervezett";

  const season = new Date(game.gameDate).getFullYear();

  const isFinal = state === "Final";

  const awayRuns = game.linescore?.teams.away.runs ?? null;
  const homeRuns = game.linescore?.teams.home.runs ?? null;

  const actualWinner =
    awayRuns !== null && homeRuns !== null
      ? awayRuns > homeRuns
        ? "away"
        : "home"
      : null;

  const predictedWinner =
    result && result.awayWP > result.homeWP ? "away" : "home";

  const predictionCorrect =
    isFinal && actualWinner && predictedWinner === actualWinner;

  let badgeClass = "bg-gray-100 text-gray-500";

  if (state === "Live") {
    badgeClass = "bg-green-100 text-green-700";
  }

  if (isFinal && result) {
    badgeClass = predictionCorrect
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  }

  const handleCalculate = useCallback(async () => {
    setCalcState("loading");
    setErrorMsg("");
    try {
      const [awayHit, homeHit, awayPitData, homePitData] = await Promise.all([
        mlbFetch<Record<string, unknown>>(
          `/teams/${away.team.id}/stats?stats=season&season=${season}&group=hitting`,
        ),
        mlbFetch<Record<string, unknown>>(
          `/teams/${home.team.id}/stats?stats=season&season=${season}&group=hitting`,
        ),
        away.probablePitcher
          ? mlbFetch<Record<string, unknown>>(
              `/people/${away.probablePitcher.id}/stats?stats=season&season=${season}&group=pitching`,
            )
          : Promise.resolve(null),
        home.probablePitcher
          ? mlbFetch<Record<string, unknown>>(
              `/people/${home.probablePitcher.id}/stats?stats=season&season=${season}&group=pitching`,
            )
          : Promise.resolve(null),
      ]);

      const awayOff = extractHitting(awayHit);
      const homeOff = extractHitting(homeHit);
      const awayPit = awayPitData ? extractPitching(awayPitData) : null;
      const homePit = homePitData ? extractPitching(homePitData) : null;

      setResult(computeModel(awayOff, homeOff, awayPit, homePit, game));
      setCalcState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Ismeretlen hiba");
      setCalcState("error");
    }
  }, [away, home, game, season]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <span className="text-xs text-gray-400">{gameTime}</span>
        <span className="text-xs text-gray-400 truncate mx-2">
          {game.venue?.name}
        </span>
        {isFinal && awayRuns !== null && homeRuns !== null && (
          <div className="px-4 pb-3 text-sm font-medium text-center">
            <span className="text-gray-500">Végeredmény: </span>
            <span className="text-gray-800">
              {away.team.name} {awayRuns} – {homeRuns} {home.team.name}
            </span>
          </div>
        )}
        <span
          className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${badgeClass}`}
        >
          {badgeText}
        </span>
      </div>

      {/* Matchup row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Away team */}
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <p className="text-base font-medium text-gray-800 leading-tight truncate">
            {away.team.name}
          </p>
          <p className="text-xs text-gray-400">{awayRecord}</p>
          <p className="text-xs text-gray-400">
            P: <span className="font-medium text-gray-700">{awayPitcher}</span>
          </p>
        </div>

        <span className="text-sm font-medium text-gray-300 px-1 shrink-0">
          @
        </span>

        {/* Home team */}
        <div className="flex-1 flex flex-col gap-0.5 text-right min-w-0">
          <p className="text-base font-medium text-gray-800 leading-tight truncate">
            {home.team.name}
          </p>
          <p className="text-xs text-gray-400">{homeRecord}</p>
          <p className="text-xs text-gray-400">
            P: <span className="font-medium text-gray-700">{homePitcher}</span>
          </p>
        </div>

        {/* Calc button */}
        <button
          onClick={handleCalculate}
          disabled={calcState === "loading"}
          className="shrink-0 text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
        >
          {calcState === "loading"
            ? "Számítás..."
            : calcState === "done"
              ? "Újraszámít"
              : "Számítás ↗"}
        </button>
      </div>

      {/* Error */}
      {calcState === "error" && (
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-red-600">
          Hiba: {errorMsg}
        </div>
      )}

      {/* Result */}
      {calcState === "done" && result && (
        <ResultPanel result={result} game={game} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MLBMatchPredictor() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [games, setGames] = useState<Game[]>([]);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const loadGames = useCallback(async (date: Date) => {
    setLoadState("loading");
    setGames([]);
    setErrorMsg("");
    try {
      const dateStr = formatDate(date);
      const data = await mlbFetch<{ dates?: Array<{ games: Game[] }> }>(
        `/schedule?sportId=1&date=${dateStr}&hydrate=team,probablePitcher,linescore`,
      );
      const fetched = data.dates?.[0]?.games ?? [];
      setGames(fetched);
      setLoadState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Ismeretlen hiba");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    loadGames(currentDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setCurrentDate(next);
    loadGames(next);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = new Date(e.target.value + "T12:00:00");
    setCurrentDate(next);
    loadGames(next);
  };

  const navBtnClass =
    "text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors";

  return (
    <div className="py-4">
      {/* Header */}
      <h1 className="text-xl font-medium text-gray-800 mb-5">
        MLB Meccs Predikció
      </h1>

      {/* Date navigation */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <input
          type="date"
          value={formatDate(currentDate)}
          onChange={handleDateInput}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <button className={navBtnClass} onClick={() => changeDate(-1)}>
          ← Előző
        </button>
        <button className={navBtnClass} onClick={() => changeDate(1)}>
          Következő →
        </button>
        <button className={navBtnClass} onClick={() => loadGames(currentDate)}>
          ↻ Frissít
        </button>
      </div>

      {/* Summary chips */}
      {loadState === "done" && games.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { label: "Dátum", value: displayDate(currentDate) },
            { label: "Meccsek", value: String(games.length) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400"
            >
              {label}:{" "}
              <span className="font-medium text-gray-700">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* States */}
      {loadState === "loading" && (
        <p className="text-sm text-gray-400 text-center py-12">
          Meccsek betöltése...
        </p>
      )}
      {loadState === "error" && (
        <p className="text-sm text-red-500 text-center py-12">
          Hiba a betöltés során: {errorMsg}
        </p>
      )}
      {loadState === "done" && games.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">
          Ezen a napon nincs MLB meccs.
        </p>
      )}

      {/* Games list */}
      {games.length > 0 && (
        <div className="flex flex-col gap-3">
          {games.map((game) => (
            <GameCard key={game.gamePk} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
