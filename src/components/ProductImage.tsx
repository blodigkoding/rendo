import { useState } from 'react';
import type { Product } from '../data/types';
import { ProductArt } from './ProductArt';

/**
 * Viser produktfoto når vi har det, og faller tilbake til strektegningen av
 * emballasjen når bildet mangler eller ikke lar seg laste.
 */
/**
 * Bare bilder vi selv har lagt inn, eller vanlige http(s)-adresser, slipper
 * gjennom. Kommer bildene fra et API senere, skal ikke en tilfeldig streng i
 * dataene kunne bli en `javascript:`- eller `data:`-adresse.
 */
function safeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/') || url.startsWith('./')) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

export function ProductImage({ product, size = 30 }: { product: Product; size?: number }) {
  const [failed, setFailed] = useState(false);
  const source = safeImageUrl(product.imageUrl);

  if (source && !failed) {
    return (
      <img
        src={source}
        alt={product.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return <ProductArt product={product} size={size} />;
}
