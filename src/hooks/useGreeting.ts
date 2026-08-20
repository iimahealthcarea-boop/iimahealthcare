import { useEffect, useState } from 'react';

export interface Greeting {
  /** e.g. "Good morning" */
  text: string;
  /** Emoji matching the time of day. */
  emoji: string;
  /** Short supporting line shown under the greeting. */
  subtitle: string;
  /** 0-23, in IST. */
  hour: number;
}

/**
 * Current hour in Asia/Kolkata, independent of the device's own timezone, so
 * every user sees the greeting for Indian local time.
 */
export const getISTHour = (now: Date = new Date()): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  // "24" can appear for midnight in some ICU versions; normalise it to 0.
  return Number.isFinite(hour) ? hour % 24 : now.getHours();
};

export const getGreeting = (hour: number): Greeting => {
  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good morning',
      emoji: '☀️',
      subtitle: 'Here’s what’s happening in your alumni network today',
      hour,
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      text: 'Good afternoon',
      emoji: '👋',
      subtitle: 'Connect with fellow alumni and explore the directory',
      hour,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      text: 'Good evening',
      emoji: '🌆',
      subtitle: 'Catch up on your network and discover new alumni',
      hour,
    };
  }
  return {
    text: 'Good night',
    emoji: '🌙',
    subtitle: 'Winding down? Explore the alumni directory at your own pace',
    hour,
  };
};

/**
 * Time-of-day greeting based on IST. Re-evaluates on the hour boundary so a
 * long-open tab doesn't keep showing a stale greeting.
 */
export function useGreeting(): Greeting {
  const [greeting, setGreeting] = useState<Greeting>(() => getGreeting(getISTHour()));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextTick = () => {
      const now = new Date();
      // Milliseconds remaining until the next wall-clock hour (+1s of slack).
      const msToNextHour =
        (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000 - now.getMilliseconds() + 1000;

      timeoutId = setTimeout(() => {
        setGreeting(getGreeting(getISTHour()));
        scheduleNextTick();
      }, msToNextHour);
    };

    scheduleNextTick();
    return () => clearTimeout(timeoutId);
  }, []);

  return greeting;
}
