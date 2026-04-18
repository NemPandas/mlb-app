import MLBMatchPredictor from "./pages/MainPage";
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

export default function App() {
  return (
    <div className="">
      <SignedIn>
        <MLBMatchPredictor />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}
