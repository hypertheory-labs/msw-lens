import { Cart } from './features/cart/Cart';

export function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow">
        <div className="container mx-auto">
          <span className="text-xl font-bold">msw-lens demo</span>
        </div>
      </nav>
      <main className="container mx-auto p-6">
        <Cart />
      </main>
    </div>
  );
}
