import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { GameList } from "./components/GameList";
import { useOwnerId } from "./ownerId-store";

const NewGameForm = lazy(() =>
  import("./components/NewGameForm").then((m) => ({ default: m.NewGameForm })),
);
const ScoreboardPage = lazy(() =>
  import("./components/ScoreboardPage").then((m) => ({
    default: m.ScoreboardPage,
  })),
);
const PlayerRecordsPage = lazy(() =>
  import("./components/PlayerRecordsPage").then((m) => ({
    default: m.PlayerRecordsPage,
  })),
);

function App() {
  const { ownerId } = useOwnerId();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="font-black tracking-tighter text-xl text-slate-900">
              BASEBALL<span className="text-blue-600">HUB</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {ownerId ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                연결: {ownerId}
              </div>
            ) : null}
            <a
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              홈으로 나가기
            </a>
          </div>
        </div>
      </header>

      <main className="py-12">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<GameList />} />
            <Route
              path="/games/new"
              element={<NewGameForm ownerId={ownerId} />}
            />
            <Route path="/games/:gameId" element={<ScoreboardPage />} />
            <Route path="/players/:playerId" element={<PlayerRecordsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-400 text-xs font-bold tracking-widest">
            © 2026 야구 기록 플랫폼
          </div>
          <div className="flex gap-8">
            <span className="text-slate-300 text-[10px] font-bold tracking-widest cursor-default">
              개인정보
            </span>
            <span className="text-slate-300 text-[10px] font-bold tracking-widest cursor-default">
              이용약관
            </span>
            <span className="text-slate-300 text-[10px] font-bold tracking-widest cursor-default">
              고객지원
            </span>
          </div>
        </div>
      </footer> */}
    </div>
  );
}

export default App;
