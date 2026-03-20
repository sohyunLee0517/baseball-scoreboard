import { useEffect, useState } from "react";

/** 새 id 목록에 맞춰 이전 순서를 최대한 유지하고, 새 id는 끝에 붙인다. */
export function mergeEntryOrder(prevOrder: number[], nextIds: number[]): number[] {
  const nextSet = new Set(nextIds);
  const kept = prevOrder.filter((id) => nextSet.has(id));
  for (const id of nextIds) {
    if (!kept.includes(id)) kept.push(id);
  }
  return kept;
}

export function useTeamEntryOrder(playerIds: number[]) {
  const [orderedIds, setOrderedIds] = useState<number[]>(() => [...playerIds]);

  useEffect(() => {
    setOrderedIds((prev) => mergeEntryOrder(prev, playerIds));
  }, [playerIds.join(",")]);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setOrderedIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  return { orderedIds, moveUp, moveDown };
}
