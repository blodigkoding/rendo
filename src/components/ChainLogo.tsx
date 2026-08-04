import { useState } from 'react';
import type { Chain } from '../data/types';
import { logoFor } from '../data/chainLogos';

/**
 * Kjedens logo.
 *
 * Vi har ikke kjedenes offisielle logofiler – de er varemerker vi ikke kan
 * hente inn på egen hånd. Legg SVG eller PNG i `src/assets/logoer/` med
 * kjede-id som filnavn (rema.svg, extra.svg, europris.svg, biltema.svg,
 * clas-ohlson.svg), så brukes den i stedet for navnetrekket under.
 */
export function ChainLogo({
  chain,
  onColor,
  size = 20,
}: {
  chain: Chain;
  /** Står logoen oppå kjedefargen? Da settes den i hvitt. */
  onColor?: boolean;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const file = logoFor(chain.id);

  if (file && !failed) {
    return (
      <img
        className="chain-logo"
        src={file}
        alt={chain.name}
        style={{ height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="wordmark"
      style={{
        color: onColor ? chain.onAccent : chain.accent,
        fontSize: size * 0.85,
        fontWeight: chain.wordmark.weight,
        letterSpacing: chain.wordmark.letterSpacing,
        fontStyle: chain.wordmark.italic ? 'italic' : undefined,
      }}
    >
      {chain.wordmark.text}
    </span>
  );
}
