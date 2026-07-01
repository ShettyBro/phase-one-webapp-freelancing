// ─── Smooth Scroll Utility ────────────────────────────────────────────────
// A controlled, eased scroll (requestAnimationFrame based) so navigation feels
// cinematic rather than the abrupt native jump. Honours the fixed navbar
// height and the user's reduced-motion preference.

const NAVBAR_OFFSET = 84; // height of the fixed navbar (+ small breathing room)

/** easeInOutCubic — gentle acceleration then deceleration. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

let activeFrame: number | null = null;

interface ScrollOptions {
  /** Pixels to leave above the target (defaults to the navbar height). */
  offset?: number;
  /** Override the auto-computed duration (ms). */
  duration?: number;
}

/**
 * Smoothly scroll to a target — either the string `'top'`, a CSS selector
 * (e.g. `'#about'`), or an element. Cancels any in-flight scroll first.
 */
export function smoothScrollTo(
  target: 'top' | string | HTMLElement,
  options: ScrollOptions = {},
): void {
  let destination: number;

  if (target === 'top') {
    destination = 0;
  } else {
    const el =
      typeof target === 'string'
        ? (document.querySelector(target) as HTMLElement | null)
        : target;
    if (!el) return; // target not in the DOM — bail quietly
    const offset = options.offset ?? NAVBAR_OFFSET;
    destination = el.getBoundingClientRect().top + window.scrollY - offset;
  }

  const startY = window.scrollY;
  const distance = destination - startY;
  if (Math.abs(distance) < 2) return;

  // Respect users who prefer reduced motion — jump instantly.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, destination);
    return;
  }

  // Duration scales with distance so short hops aren't sluggish and long
  // hops aren't a blur — clamped to a pleasant 550–1150ms range.
  const duration =
    options.duration ??
    Math.min(1150, Math.max(550, Math.abs(distance) * 0.4));

  if (activeFrame !== null) cancelAnimationFrame(activeFrame);

  let startTime: number | null = null;
  const step = (now: number) => {
    if (startTime === null) startTime = now;
    const progress = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) {
      activeFrame = requestAnimationFrame(step);
    } else {
      activeFrame = null;
    }
  };
  activeFrame = requestAnimationFrame(step);
}
