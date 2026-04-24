export type CartItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Cart = {
  items: CartItem[];
  total: number;
};
