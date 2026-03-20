import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGame } from "../api";
import { Game } from "../types";
import { Scoreboard } from "./Scoreboard";

export const ScoreboardPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = gameId ? Number(gameId) : NaN;
    if (!Number.isFinite(id)) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    getGame(id)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (failed || (gameId && !Number.isFinite(Number(gameId)))) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-600">
        <p className="font-bold mb-4">게임을 불러올 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-blue-600 font-bold hover:underline"
        >
          목록으로
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <Scoreboard game={game} onBack={() => navigate("/")} />
  );
};
