import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsAS = await AsyncStorage.getItem('@GoMarketplace:products');

      if (productsAS) {
        setProducts(JSON.parse(productsAS));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExist = products.find(item => item.id === product.id);

      if (productExist) {
        setProducts(
          products.map(productFinded => {
            if (productFinded.id === productExist.id) {
              return { ...productFinded, quantity: productFinded.quantity + 1 };
            }
            return productFinded;
          }),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [products],
  );

  const updateStorage = useCallback(async (): Promise<void> => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }, [products]);

  useEffect(() => {
    updateStorage();
  }, [updateStorage]);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity + 1 };
          }

          return product;
        }),
      );
    },

    [products],
  );

  const decrement = useCallback(
    async id => {
      await setProducts(
        products
          .map(product => {
            if (product.id === id) {
              return { ...product, quantity: product.quantity - 1 };
            }
            return product;
          })
          .filter(product => product.quantity >= 1),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
