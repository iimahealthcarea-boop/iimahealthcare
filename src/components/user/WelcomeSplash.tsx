import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useGreeting } from '@/hooks/useGreeting';

interface WelcomeSplashProps {
  firstName?: string | null;
  /** Total time on screen before the fade-out begins (ms). */
  duration?: number;
  onFinish: () => void;
}

const FADE_MS = 450;

/**
 * Brief branded welcome shown once per session right after landing on the
 * dashboard, so the user gets an acknowledgement instead of an abrupt render.
 * Respects prefers-reduced-motion by skipping the animation entirely.
 */
export default function WelcomeSplash({
  firstName,
  duration = 1900,
  onFinish,
}: WelcomeSplashProps) {
  const greeting = useGreeting();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      onFinish();
      return;
    }

    const fadeTimer = setTimeout(() => setLeaving(true), duration);
    const doneTimer = setTimeout(onFinish, duration + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 px-6 transition-opacity duration-[450ms] ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Soft blooming rings behind the mark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="splash-ring absolute h-40 w-40 rounded-full bg-blue-400/20" />
        <span
          className="splash-ring absolute h-40 w-40 rounded-full bg-blue-300/15"
          style={{ animationDelay: '0.45s' }}
        />
        <span
          className="splash-ring absolute h-40 w-40 rounded-full bg-sky-200/10"
          style={{ animationDelay: '0.9s' }}
        />
      </div>

      <div className="relative flex min-w-0 flex-col items-center text-center">
        {/* Logo mark */}
        <div className="splash-pop mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur-sm sm:h-24 sm:w-24">
          <GraduationCap className="h-10 w-10 text-white sm:h-12 sm:w-12" />
        </div>

        <p className="splash-rise text-sm font-medium uppercase tracking-[0.2em] text-blue-200 sm:text-base">
          IIMA Healthcare SIG
        </p>

        <h1
          className="splash-rise mt-2 max-w-full break-words text-2xl font-bold leading-tight text-white sm:text-4xl"
          style={{ animationDelay: '0.12s' }}
        >
          {greeting.text}
          {firstName ? `, ${firstName}` : ''}!
        </h1>

        <p
          className="splash-rise mt-2 max-w-xs break-words text-sm text-blue-100/90 sm:max-w-md sm:text-base"
          style={{ animationDelay: '0.22s' }}
        >
          Setting up your alumni dashboard…
        </p>

        {/* Progress sweep */}
        <div
          className="splash-rise mt-7 h-1 w-40 overflow-hidden rounded-full bg-white/15 sm:w-56"
          style={{ animationDelay: '0.3s' }}
        >
          <span className="splash-bar block h-full w-1/3 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
