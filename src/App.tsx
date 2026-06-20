import { useCallback, useState } from "react";
import MLBMatchPredictor, {
  BacktestModal,
  runSevenDayBacktest,
} from "./pages/MainPage";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  HashRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
  ].join(" ");

function AppShell() {
  const location = useLocation();
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [backtestStatus, setBacktestStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [backtestResult, setBacktestResult] = useState<Awaited<
    ReturnType<typeof runSevenDayBacktest>
  > | null>(null);
  const [backtestError, setBacktestError] = useState("");
  const showBacktest = location.pathname === "/reduce-pitcher";

  const handleBacktest = useCallback(async () => {
    setBacktestOpen(true);
    setBacktestStatus("loading");
    setBacktestError("");
    try {
      setBacktestResult(
        await runSevenDayBacktest(new Date(), "reducedPitcher"),
      );
      setBacktestStatus("done");
    } catch (e) {
      setBacktestError(e instanceof Error ? e.message : "Ismeretlen hiba");
      setBacktestStatus("error");
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="px-8 pt-6">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex gap-2 flex-wrap">
            <NavLink to="/" end className={tabClass}>
              Basic
            </NavLink>
            <NavLink to="/reduce-pitcher" className={tabClass}>
              Reduce Pitcher
            </NavLink>
          </nav>

          {showBacktest && (
            <button
              type="button"
              onClick={handleBacktest}
              disabled={backtestStatus === "loading"}
              className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {backtestStatus === "loading" ? "Back tast..." : "Back tast"}
            </button>
          )}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<MLBMatchPredictor variant="basic" />} />
        <Route
          path="/reduce-pitcher"
          element={<MLBMatchPredictor variant="reducedPitcher" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BacktestModal
        open={backtestOpen}
        status={backtestStatus}
        result={backtestResult}
        errorMsg={backtestError}
        onClose={() => setBacktestOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SignedIn>
        <AppShell />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </HashRouter>
  );
}
