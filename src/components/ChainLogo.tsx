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
    const logo = (
      <img
        className="chain-logo"
        src={file}
        alt={chain.name}
        style={{ height: size }}
        onError={() => setFailed(true)}
      />
    );

    /*
      Kjedelogoene er laget for lys bakgrunn – Rema er blå på hvitt. Står de rett
      på kjedefargen forsvinner de. Derfor får de en hvit brikke, slik kjedenes
      egne apper gjør det.
    */
    return onColor ? <span className="chain-logo__chip">{logo}</span> : logo;
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
