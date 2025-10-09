import { Route, Routes } from "react-router";

import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

import { useAuthStore } from "../store/useAuthStore.js";

function App() {
  const { authUser, isLoggedIn, login } = useAuthStore();
  console.log("Auth user: ", authUser);
  console.log("isLoggedIn: ", isLoggedIn);
  return (
    <div className="min-h-screen bg-slate-900 relative flex items-center justify-center p-4 overflow-hidden">
      {/* DECORATORS - GRID BG & GLOW SHAPES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Use deep purple and teal-ish dark glows instead of pink/cyan */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-900 opacity-30 blur-[100px] animate-drift rounded-full" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-teal-900 opacity-30 blur-[100px] animate-float rounded-full" />

      <button className="btn btn-primary z-10" onClick={login}></button>

      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </div>
  );
}

export default App;
