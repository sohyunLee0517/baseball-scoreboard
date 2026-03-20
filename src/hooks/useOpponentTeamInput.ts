import { useCallback, useState } from "react";

export function useOpponentTeamInput(initialOpponentName = "") {
  const [opponentName, setOpponentName] = useState(initialOpponentName);

  const trimmedOpponentName = opponentName.trim();
  const isValid = trimmedOpponentName.length > 0;

  const reset = useCallback(() => {
    setOpponentName("");
  }, []);

  return {
    opponentName,
    setOpponentName,
    trimmedOpponentName,
    isValid,
    reset,
  };
}
