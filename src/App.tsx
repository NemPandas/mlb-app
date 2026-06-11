import MLBMatchPredictor from "./pages/MainPage";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { HashRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
  ].join(" ");

export default function App() {
  return (
    <HashRouter>
      <SignedIn>
        <div className="min-h-screen bg-neutral-100">
          <div className="px-8 pt-6">
            <nav className="flex gap-2 flex-wrap">
              <NavLink to="/" end className={tabClass}>
                Basic
              </NavLink>
              <NavLink to="/reduce-pitcher" className={tabClass}>
                Reduce Pitcher
              </NavLink>
            </nav>
          </div>
          <Routes>
            <Route path="/" element={<MLBMatchPredictor variant="basic" />} />
            <Route
              path="/reduce-pitcher"
              element={<MLBMatchPredictor variant="reducedPitcher" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </HashRouter>
  );
}
