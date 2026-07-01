import { useEffect, useState } from 'react';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;
const SECOND = 1_000;

function computeTimeLeft(targetMs: number): TimeLeft {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }
  return {
    days: Math.floor(diff / DAY),
    hours: Math.floor((diff % DAY) / HOUR),
    minutes: Math.floor((diff % HOUR) / MINUTE),
    seconds: Math.floor((diff % MINUTE) / SECOND),
    isComplete: false,
  };
}

/**
 * Live countdown to a target date/time. Ticks every second and cleans up on unmount.
 */
export function useCountdown(target: string | number | Date): TimeLeft {
  const targetMs = new Date(target).getTime();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(targetMs));

  useEffect(() => {
    // Resync immediately (in case props changed), then tick once per second.
    setTimeLeft(computeTimeLeft(targetMs));
    const id = setInterval(() => setTimeLeft(computeTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return timeLeft;
}
