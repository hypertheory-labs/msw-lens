import { useCart } from './useCart';

export function Cart() {
  const state = useCart();

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        {state.status === 'idle' || state.status === 'loading' ? (
          <p className="text-base-content/70" aria-busy="true">
            Loading cart…
          </p>
        ) : state.status === 'error' ? (
          <div role="alert" className="alert alert-error">
            Could not load your cart. {state.message}
          </div>
        ) : state.cart.items.length === 0 ? (
          <>
            <h2 className="card-title">Your cart is empty</h2>
            <div className="card-actions">
              <button className="btn btn-primary" disabled>
                Checkout
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="card-title">Cart</h2>
            <ul className="divide-y divide-base-300">
              {state.cart.items.map((item) => (
                <li key={item.id} className="py-2 flex justify-between">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="font-bold mt-2">Total: ${state.cart.total.toFixed(2)}</p>
            <div className="card-actions">
              <button className="btn btn-primary">Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
