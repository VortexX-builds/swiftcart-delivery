import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { Product } from '../../types/database';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;
  const outOfStock = product.stock <= 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={(!product.image_url || imgError) ? '/placeholder.png' : product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Category tag */}
        <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-gray-500 px-2.5 py-1 rounded-full border border-gray-100/50">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900">
            ₹{product.price}
          </span>

          {!outOfStock && (
            <>
              {quantity === 0 ? (
                <button
                  onClick={() => addItem(product)}
                  className="flex items-center gap-1.5 bg-brand/10 text-brand px-3.5 py-1.5 rounded-xl text-sm font-bold hover:bg-brand hover:text-white active:scale-95 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  ADD
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-brand rounded-xl overflow-hidden shadow-md shadow-brand/20">
                  <button
                    onClick={() =>
                      quantity === 1
                        ? removeItem(product.id)
                        : updateQuantity(product.id, quantity - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-brand-dark transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-brand-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
