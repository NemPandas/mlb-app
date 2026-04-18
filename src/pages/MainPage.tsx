import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeagueRecord {
  wins: number;
  losses: number;
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
  linescore?: {
    teams: {
      away: { runs: number };
      home: { runs: number };
    };
  };
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

// Dinamikusan lekért liganátlagok
interface LeagueAverages {
  runsPerGame: number; // átlagos futás/meccs csapatonként
  ops: number; // ligaátlag OPS
  era: number; // ligaátlag ERA (pitching)
  whip: number; // ligaátlag WHIP
}

// Fallback értékek, ha az API nem elérhető
const FALLBACK_AVERAGES: LeagueAverages = {
  runsPerGame: 4.6,
  ops: 0.715,
  era: 4.5,
  whip: 1.3,
};

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

// ─── League averages lekérés ──────────────────────────────────────────────────
//
// /teams/stats?stats=season&season=YYYY&group=hitting&sportId=1
// Visszaadja az összes csapat szezonstatját. Ebből számolunk liganátlagot.
//
// /teams/stats?stats=season&season=YYYY&group=pitching&sportId=1
// Ugyanez pitching oldalon ERA és WHIP átlaghoz.

interface TeamStatSplit {
  stat: Record<string, string>;
  team: { id: number; name: string };
}

interface TeamStatsResponse {
  teamStats?: Array<{ splits: TeamStatSplit[] }>;
  // néha más struktúra jön vissza
  stats?: Array<{ splits: TeamStatSplit[] }>;
}

async function fetchLeagueAverages(season: number): Promise<LeagueAverages> {
  try {
    const [hitData, pitData] = await Promise.all([
      mlbFetch<TeamStatsResponse>(
        `/teams/stats?stats=season&season=${season}&group=hitting&sportId=1`,
      ),
      mlbFetch<TeamStatsResponse>(
        `/teams/stats?stats=season&season=${season}&group=pitching&sportId=1`,
      ),
    ]);

    // hitting: OPS és runs/game átlag
    const hitSplits = (
      hitData.teamStats?.[0]?.splits ??
      hitData.stats?.[0]?.splits ??
      []
    ).filter((s) => s.stat);

    let totalOps = 0;
    let totalRpg = 0;
    let hitCount = 0;

    for (const s of hitSplits) {
      const ops = parseFloat(s.stat.ops);
      const runs = parseFloat(s.stat.runs);
      const games = parseFloat(s.stat.gamesPlayed);
      if (!isNaN(ops) && ops > 0) {
        totalOps += ops;
        hitCount++;
      }
      if (!isNaN(runs) && !isNaN(games) && games > 0) totalRpg += runs / games;
    }

    // pitching: ERA és WHIP átlag
    const pitSplits = (
      pitData.teamStats?.[0]?.splits ??
      pitData.stats?.[0]?.splits ??
      []
    ).filter((s) => s.stat);

    let totalEra = 0;
    let totalWhip = 0;
    let pitCount = 0;

    for (const s of pitSplits) {
      const era = parseFloat(s.stat.era);
      const whip = parseFloat(s.stat.whip);
      if (!isNaN(era) && era > 0 && era < 20) {
        totalEra += era;
        pitCount++;
      }
      if (!isNaN(whip) && whip > 0) totalWhip += whip;
    }

    const n = hitCount || 1;
    const m = pitCount || 1;

    const result: LeagueAverages = {
      ops: totalOps / n || FALLBACK_AVERAGES.ops,
      runsPerGame: totalRpg / n || FALLBACK_AVERAGES.runsPerGame,
      era: totalEra / m || FALLBACK_AVERAGES.era,
      whip: totalWhip / m || FALLBACK_AVERAGES.whip,
    };

    // Szanity check: ha valami abszurd értéket kapunk, fallback
    if (result.ops < 0.5 || result.ops > 1.0)
      result.ops = FALLBACK_AVERAGES.ops;
    if (result.runsPerGame < 3 || result.runsPerGame > 7)
      result.runsPerGame = FALLBACK_AVERAGES.runsPerGame;
    if (result.era < 2 || result.era > 8) result.era = FALLBACK_AVERAGES.era;
    if (result.whip < 0.8 || result.whip > 2.0)
      result.whip = FALLBACK_AVERAGES.whip;

    return result;
  } catch {
    return FALLBACK_AVERAGES;
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
  lg: LeagueAverages,
): ModelResult {
  const offenseIndex = (off: HittingStats) => {
    const opsIdx = off.ops / lg.ops;
    const rpg = off.games > 0 ? off.runs / off.games : lg.runsPerGame;
    return 0.6 * opsIdx + 0.4 * (rpg / lg.runsPerGame);
  };

const pitcherIndex = (pit: PitchingStats | null) => {
  if (!pit) return 1.0;

  const STABILIZATION_IP = 50;
  const weight = pit.inningsPitched / (pit.inningsPitched + STABILIZATION_IP);

  const regressedEra  = weight * pit.era  + (1 - weight) * lg.era;
  const regressedWhip = weight * pit.whip + (1 - weight) * lg.whip;

  const eraIdx  = lg.era  / Math.max(regressedEra,  0.5);
  const whipIdx = lg.whip / Math.max(regressedWhip, 0.5);

  const kPerBf  = pit.inningsPitched > 0 ? pit.strikeOuts  / (pit.inningsPitched * 3) : 0.2;
  const bbPerBf = pit.inningsPitched > 0 ? pit.baseOnBalls / (pit.inningsPitched * 3) : 0.08;
  const kbbIdx  = (kPerBf - bbPerBf + 0.12) / 0.12;

  return (
    0.45 * eraIdx +
    0.3  * Math.max(0.5, Math.min(1.5, kbbIdx)) +
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

  const erA = lg.runsPerGame * (awayOffIdx / homePitIdx) * awayRecordIdx;
  const erB =
    lg.runsPerGame * (homeOffIdx / awayPitIdx) * homeRecordIdx * 1.025;

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

// ─── League averages badge ────────────────────────────────────────────────────

function LeagueBadge({
  averages,
  loading,
}: {
  averages: LeagueAverages | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-400 animate-pulse">
          Liganátlagok betöltése...
        </div>
      </div>
    );
  }
  if (!averages) return null;

  const isFallback =
    averages.runsPerGame === FALLBACK_AVERAGES.runsPerGame &&
    averages.ops === FALLBACK_AVERAGES.ops;

  const items = [
    { label: "Lg R/G", value: averages.runsPerGame.toFixed(2) },
    { label: "Lg OPS", value: averages.ops.toFixed(3) },
    { label: "Lg ERA", value: averages.era.toFixed(2) },
    { label: "Lg WHIP", value: averages.whip.toFixed(2) },
  ];

  return (
    <div className="flex gap-2 mb-4 flex-wrap items-center">
      <span className="text-xs text-gray-400">
        {isFallback ? "Liganátlagok (fallback):" : "Liganátlagok (live):"}
      </span>
      {items.map(({ label, value }) => (
        <div
          key={label}
          className={`rounded-lg px-2.5 py-1 text-xs border ${
            isFallback
              ? "bg-amber-50 border-amber-100 text-amber-700"
              : "bg-blue-50 border-blue-100 text-blue-700"
          }`}
        >
          <span className="opacity-70">{label} </span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
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

function ResultPanel({
  result,
  game,
  averages,
}: {
  result: ModelResult;
  game: Game;
  averages: LeagueAverages;
}) {
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

      {/* League averages used */}
      <div className="mt-3 pt-2 border-t border-gray-200 flex gap-3 flex-wrap">
        {[
          { k: "Lg R/G", v: averages.runsPerGame.toFixed(2) },
          { k: "Lg OPS", v: averages.ops.toFixed(3) },
          { k: "Lg ERA", v: averages.era.toFixed(2) },
          { k: "Lg WHIP", v: averages.whip.toFixed(2) },
        ].map(({ k, v }) => (
          <span key={k} className="text-[11px] text-gray-400">
            {k}: <span className="text-gray-600 font-medium">{v}</span>
          </span>
        ))}
      </div>

      <p className="text-[11px] text-gray-300 mt-2">
        Adatok: MLB Stats API (statsapi.mlb.com). Modell: OPS/ERA alapú
        offense–prevention, Pythagorean győzelmi valószínűség.
      </p>
    </div>
  );
}

function GameCard({
  game,
  leagueAverages,
}: {
  game: Game;
  leagueAverages: LeagueAverages | null;
}) {
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
    isFinal && actualWinner && result ? predictedWinner === actualWinner : null;

  const badgeClass =
    state === "Live"
      ? "bg-green-100 text-green-700"
      : isFinal && predictionCorrect !== null
        ? predictionCorrect
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-500";
  const badgeText =
    state === "Live" ? "ÉLŐ" : isFinal ? "Befejezett" : "Tervezett";

  const season = new Date(game.gameDate).getFullYear();

  const handleCalculate = useCallback(async () => {
    setCalcState("loading");
    setErrorMsg("");
    try {
      const lg = leagueAverages ?? FALLBACK_AVERAGES;

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

      setResult(computeModel(awayOff, homeOff, awayPit, homePit, game, lg));
      setCalcState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Ismeretlen hiba");
      setCalcState("error");
    }
  }, [away, home, game, season, leagueAverages]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <span className="text-xs text-gray-400">{gameTime}</span>
        <span className="text-xs text-gray-400 truncate mx-2">
          {game.venue?.name}
        </span>
        {isFinal && awayRuns !== null && homeRuns !== null && (
          <span className="text-xs text-gray-500 font-medium shrink-0">
            {awayRuns} – {homeRuns}
          </span>
        )}
        <span
          className={`text-[11px] px-2 py-0.5 rounded-md font-medium ml-2 ${badgeClass}`}
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
        <ResultPanel
          result={result}
          game={game}
          averages={leagueAverages ?? FALLBACK_AVERAGES}
        />
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

  // Liganátlagok — szezonra egyszer töltjük le, cache-eljük
  const [leagueAverages, setLeagueAverages] = useState<LeagueAverages | null>(
    null,
  );
  const [lgLoading, setLgLoading] = useState(false);
  const lgCacheRef = useRef<Map<number, LeagueAverages>>(new Map());

  const loadLeagueAverages = useCallback(async (season: number) => {
    if (lgCacheRef.current.has(season)) {
      setLeagueAverages(lgCacheRef.current.get(season)!);
      return;
    }
    setLgLoading(true);
    const avg = await fetchLeagueAverages(season);
    lgCacheRef.current.set(season, avg);
    setLeagueAverages(avg);
    setLgLoading(false);
  }, []);

  const loadGames = useCallback(
    async (date: Date) => {
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

        // Liga átlagok betöltése a szezonra
        await loadLeagueAverages(date.getFullYear());
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Ismeretlen hiba");
        setLoadState("error");
      }
    },
    [loadLeagueAverages],
  );

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
    <div className="py-8 px-8 bg-neutral-100">
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
        <div className="flex gap-2 mb-3 flex-wrap">
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

      {/* League averages badge */}
      <LeagueBadge averages={leagueAverages} loading={lgLoading} />

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
            <GameCard
              key={game.gamePk}
              game={game}
              leagueAverages={leagueAverages}
            />
          ))}
        </div>
      )}
    </div>
  );
}
