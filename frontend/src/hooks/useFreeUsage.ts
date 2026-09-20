import { useState } from "react";

interface UsageRecord {
  date: string; // YYYY-MM-DD, local browser date
  count: number;
}

function storageKey(tileId: string): string {
  return `arc402:usage:${tileId}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function readTodayCount(tileId: string): number {
  const raw = localStorage.getItem(storageKey(tileId));
  if (!raw) return 0;
  try {
    const record: UsageRecord = JSON.parse(raw);
    return record.date === todayString() ? record.count : 0;
  } catch {
    return 0;
  }
}

export function useFreeUsage(tileId: string, limit: number) {
  const [count, setCount] = useState<number>(() => readTodayCount(tileId));

  function recordUse() {
    const next = readTodayCount(tileId) + 1;
    localStorage.setItem(storageKey(tileId), JSON.stringify({ date: todayString(), count: next }));
    setCount(next);
  }

  const remaining = Math.max(0, limit - count);
  const isExhausted = remaining === 0;

  return { count, remaining, isExhausted, recordUse };
}
