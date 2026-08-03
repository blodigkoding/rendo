import type { Chain } from '../data/types';

/**
 * Kjedens navnetrekk, satt i tekst. Byttes mot kjedens egen logofil når vi har
 * rettighetene – da er det bare denne komponenten som endres.
 */
export function Wordmark({ chain, large }: { chain: Chain; large?: boolean }) {
  return (
    <span
      className={`wordmark${large ? ' wordmark--lg' : ''}`}
      style={{
        color: chain.accent,
        fontWeight: chain.wordmark.weight,
        letterSpacing: chain.wordmark.letterSpacing,
        fontStyle: chain.wordmark.italic ? 'italic' : undefined,
      }}
    >
      {chain.wordmark.text}
    </span>
  );
}
