"use client";

import * as React from "react";

const now = () => Date.now();

export function useResendTimer(opts: {
  storageKey: string;
  cooldownSeconds?: number;
}) {
  const cooldown = opts.cooldownSeconds ?? 120;
  const key = opts.storageKey;

  const [secondsLeft, setSecondsLeft] = React.useState(0);

  const getUntil = React.useCallback(() => {
    const raw = localStorage.getItem(key);
    const until = raw ? Number(raw) : 0;
    return Number.isFinite(until) ? until : 0;
  }, [key]);

  const setUntil = React.useCallback(
    (untilMs: number) => localStorage.setItem(key, String(untilMs)),
    [key]
  );

  const start = React.useCallback(() => {
    const untilMs = now() + cooldown * 1000;
    setUntil(untilMs);
    setSecondsLeft(cooldown);
  }, [cooldown, setUntil]);

  const reset = React.useCallback(() => {
    localStorage.removeItem(key);
    setSecondsLeft(0);
  }, [key]);

  React.useEffect(() => {
    const tick = () => {
      const until = getUntil();
      const left = Math.max(0, Math.ceil((until - now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && until !== 0) localStorage.removeItem(key);
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [getUntil, key]);

  return {
    secondsLeft,
    canSend: secondsLeft <= 0,
    startCooldown: start,
    resetCooldown: reset,
  };
}
