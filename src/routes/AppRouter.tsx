import { HashRouter, Routes, Route } from "react-router-dom";
import MLBMatchPredictor from "../pages/MainPage";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <MLBMatchPredictor />
              </SignedIn>

              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </HashRouter>
  );
}