import { useCart } from './useCart';

export function Cart() {
  const state = useCart();

  if (state.status === 'idle' || state.status === 'loading') {
    return <div aria-busy="true">Loading cart…</div>;
  }

  if (state.status === 'error') {
    return (
      <div role="alert">
        Could not load your cart. {state.message}
      </div>
    );
  }

  const { cart } = state;

  if (cart.items.length === 0) {
    return (
      <div>
        <h2>Your cart is empty</h2>
        <button disabled>Checkout</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Cart</h2>
      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>
            {item.name} × {item.quantity} — ${(item.price * item.quantity).toFixed(2)}
          </li>
        ))}
      </ul>
      <p>Total: ${cart.total.toFixed(2)}</p>
      <button>Checkout</button>
    </div>
  );
}
