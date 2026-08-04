import type { Chain, Product } from '../data/types';
import { ScanIcon } from './icons';

/**
 * Knapp inn til kjedens egen selvskanning.
 *
 * rendo finner varen i hylla; kjedens app tar skanningen og betalingen. Bare
 * kjeder som faktisk har en slik funksjon får knappen – i dag REMA 1000 med
 * Skann og Betal i Æ-appen.
 *
 * Lenken går til kjedens side om tjenesten. Skal knappen åpne appen direkte,
 * må vi ha en universell lenke fra kjeden; da er det bare `scanApp.url` som
 * byttes.
 */
export function ScanButton({
  chain,
  product,
  compact,
}: {
  chain: Chain | null;
  product?: Product;
  compact?: boolean;
}) {
  if (!chain?.scanApp) return null;
  const { name, app, url } = chain.scanApp;

  return (
    <a
      className={`scanbtn${compact ? ' scanbtn--compact' : ''}`}
      style={{ background: chain.accent, color: chain.onAccent }}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={
        product ? `Skann ${product.name} med ${name} i ${app}` : `Åpne ${name} i ${app}`
      }
    >
      <ScanIcon size={compact ? 16 : 18} />
      <span className="scanbtn__text">
        <strong>{name}</strong>
        {!compact && <span>Skann varen i {app}</span>}
      </span>
    </a>
  );
}
