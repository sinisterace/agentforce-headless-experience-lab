import { Fragment } from 'react';

/**
 * Lightweight staggered-text reveal — each word rises + fades in on a small
 * incremental delay. A native, dependency-free take on the React Bits
 * "Staggered Text" effect, matching this app's plain-CSS architecture (the
 * animation lives in employee.css). Words stay as real, breakable spans so the
 * headline still wraps normally; honors prefers-reduced-motion via CSS.
 */
export function StaggeredText({ text, delay = 0.05, step = 0.055 }: { text: string; delay?: number; step?: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.flatMap((word, i) => {
        const span = (
          <span key={i} className="stagger-word" style={{ animationDelay: `${delay + i * step}s` }}>
            {word}
          </span>
        );
        // A real (breakable) space between inline-block words so the line wraps.
        return i === 0 ? [span] : [<Fragment key={`s${i}`}> </Fragment>, span];
      })}
    </>
  );
}
