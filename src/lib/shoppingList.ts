import { useCallback, useEffect, useState } from 'react';

/**
 * Handlelista, lagret per butikk i nettleseren. Den overlever at appen lukkes,
 * som er hele poenget – man skriver lista hjemme og handler i butikken.
 */

export interface ListItem {
  productId: string;
  /** Huket av i butikken. */
  done: boolean;
  addedAt: number;
}

const key = (storeId: string) => `rendo:list:${storeId}`;

function read(storeId: string): ListItem[] {
  try {
    const raw = localStorage.getItem(key(storeId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Innholdet kan være tuklet med utenfra appen, så alt valideres.
    return parsed
      .filter(
        (v): v is ListItem =>
          typeof v === 'object' && v !== null && typeof (v as ListItem).productId === 'string',
      )
      .map((item) => ({
        productId: item.productId,
        done: item.done === true,
        addedAt: typeof item.addedAt === 'number' ? item.addedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function write(storeId: string, items: ListItem[]) {
  try {
    localStorage.setItem(key(storeId), JSON.stringify(items));
  } catch {
    // Privat modus – da lever lista bare i denne økten.
  }
}

export function useShoppingList(storeId: string) {
  const [items, setItems] = useState<ListItem[]>(() => read(storeId));

  useEffect(() => {
    setItems(read(storeId));
  }, [storeId]);

  const update = useCallback(
    (next: ListItem[]) => {
      setItems(next);
      write(storeId, next);
    },
    [storeId],
  );

  const add = useCallback(
    (productId: string) => {
      if (items.some((i) => i.productId === productId)) return;
      update([...items, { productId, done: false, addedAt: Date.now() }]);
    },
    [items, update],
  );

  const remove = useCallback(
    (productId: string) => update(items.filter((i) => i.productId !== productId)),
    [items, update],
  );

  const toggle = useCallback(
    (productId: string) =>
      update(items.map((i) => (i.productId === productId ? { ...i, done: !i.done } : i))),
    [items, update],
  );

  const clear = useCallback(() => update([]), [update]);

  const has = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  return { items, add, remove, toggle, clear, has };
}
