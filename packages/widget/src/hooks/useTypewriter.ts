import { useCallback, useEffect, useRef, useState } from "react";

interface UseTypewriterOptions {
  // When false the full text is shown immediately (e.g. reduced motion, or a
  // message that is not the newest assistant answer).
  enabled?: boolean;
  charsPerTick?: number;
  tickMs?: number;
  onDone?: () => void;
}

interface UseTypewriterResult {
  displayed: string;
  isDone: boolean;
  skip: () => void;
}

// Presentational-only reveal: it types out an already-complete string. There is
// no real streaming here — the full answer is in the store before this runs.
//
// Defaults reveal ~3 chars every 20ms (~150 chars/s), which reads as natural
// "typing" without feeling sluggish on a typical FAQ answer.
export function useTypewriter(
  fullText: string,
  options: UseTypewriterOptions = {},
): UseTypewriterResult {
  const { enabled = true, charsPerTick = 3, tickMs = 20, onDone } = options;

  // Number of characters currently revealed. Seeded so the very first paint is
  // correct (empty when animating, full when disabled) — no flash of the wrong
  // state before the effect runs.
  const [count, setCount] = useState(() => (enabled ? 0 : fullText.length));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the newest onDone callback without letting it restart the timer.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const skip = useCallback(() => {
    clear();
    setCount(fullText.length);
  }, [clear, fullText.length]);

  // Start / restart the reveal. Re-runs (and cleans up the old timer) whenever
  // the text changes or `enabled` toggles, so switching answers never leaks an
  // interval or animates stale text.
  useEffect(() => {
    clear();

    if (!enabled) {
      setCount(fullText.length);
      return;
    }

    setCount(0);
    if (fullText.length === 0) return;

    intervalRef.current = setInterval(() => {
      setCount((prev) => Math.min(prev + charsPerTick, fullText.length));
    }, tickMs);

    // Cleanup on unmount / before the next run — prevents setState-after-unmount.
    return clear;
  }, [fullText, enabled, charsPerTick, tickMs, clear]);

  const isDone = count >= fullText.length;

  // Stop ticking once we've reached the end (kept out of the setState updater so
  // the updater stays side-effect free and StrictMode-safe).
  useEffect(() => {
    if (isDone) clear();
  }, [isDone, clear]);

  // Fire onDone exactly once per completed reveal.
  const doneFiredRef = useRef(false);
  useEffect(() => {
    if (isDone && !doneFiredRef.current) {
      doneFiredRef.current = true;
      onDoneRef.current?.();
    } else if (!isDone) {
      doneFiredRef.current = false;
    }
  }, [isDone]);

  return { displayed: fullText.slice(0, count), isDone, skip };
}

// Tracks the OS "reduce motion" preference and reacts to live changes. Used to
// disable the typewriter entirely for users who ask for reduced motion.
export function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";

  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Sync once in case the preference changed between the initial render and
    // this effect, then subscribe to future changes.
    setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
