import { useEffect, useState } from 'react';
import type { Cart } from '../../types';

export type CartState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; cart: Cart }
  | { status: 'error'; message: string };

export function useCart(): CartState {
  const [state, setState] = useState<CartState>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    fetch('/api/cart')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Cart>;
      })
      .then((cart) => {
        if (!cancelled) setState({ status: 'ready', cart });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
