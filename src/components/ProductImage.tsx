import { useState } from 'react';
import type { Product } from '../data/types';
import { ProductArt } from './ProductArt';

/**
 * Viser produktfoto når vi har det, og faller tilbake til strektegningen av
 * emballasjen når bildet mangler eller ikke lar seg laste.
 */
export function ProductImage({ product, size = 30 }: { product: Product; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (product.imageUrl && !failed) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return <ProductArt product={product} size={size} />;
}
