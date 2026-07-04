import { useCallback, useEffect, useMemo, useState } from "react";
import type { PutioFile } from "@/lib/putio";
import { getResumeIndex, setResumeIndex } from "@/lib/storage";

export type RepeatMode = "off" | "all" | "one";

export function usePlaylist(files: PutioFile[], folderId: string | null) {
  const [index, setIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [order, setOrder] = useState<number[]>([]);

  // Build order (identity or shuffled)
  useEffect(() => {
    const base = files.map((_, i) => i);
    if (shuffle) {
      for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
      }
    }
    setOrder(base);
  }, [files, shuffle]);

  // Resume position
  useEffect(() => {
    if (!folderId || files.length === 0) return;
    const resumed = Math.min(getResumeIndex(folderId), files.length - 1);
    setIndex(resumed);
  }, [folderId, files.length]);

  useEffect(() => {
    if (folderId) setResumeIndex(folderId, index);
  }, [folderId, index]);

  const current = files[index];

  const next = useCallback(() => {
    if (files.length === 0) return;
    if (repeat === "one") {
      setIndex((i) => i);
      return;
    }
    const posInOrder = order.indexOf(index);
    const nextPos = posInOrder + 1;
    if (nextPos >= order.length) {
      if (repeat === "all") setIndex(order[0] ?? 0);
      // otherwise stay at last (playback ended overlay handled by caller)
      return;
    }
    setIndex(order[nextPos]);
  }, [files.length, order, index, repeat]);

  const prev = useCallback(() => {
    if (files.length === 0) return;
    const posInOrder = order.indexOf(index);
    const prevPos = posInOrder - 1;
    if (prevPos < 0) return;
    setIndex(order[prevPos]);
  }, [files.length, order, index]);

  const jump = useCallback((i: number) => setIndex(i), []);

  const upcoming = useMemo(() => {
    const posInOrder = order.indexOf(index);
    return order.slice(posInOrder + 1).map((i) => files[i]).filter(Boolean);
  }, [order, index, files]);

  const isLast = order.length > 0 && order.indexOf(index) === order.length - 1;

  return {
    index,
    current,
    next,
    prev,
    jump,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    upcoming,
    isLast,
  };
}
