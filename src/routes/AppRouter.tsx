import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import MainPage from "../pages/MainPage";
import MLBMatchPredictor from "../pages/MainPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MLBMatchPredictor />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
}
