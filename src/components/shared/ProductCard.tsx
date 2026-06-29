import { useState, useEffect } from 'react';
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

  const [localQuantity, setLocalQuantity] = useState(quantity.toString());
  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  return (
    <div className="group bg-white rounded-[24px] border border-gray-100/60 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-300 ease-out">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50/50 overflow-hidden">
        <img
          src={(!product.image_url || imgError) ? '/placeholder.png' : product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
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
                  className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-black/20 active:scale-[0.95] transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  ADD
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-black rounded-full overflow-hidden shadow-lg shadow-black/20">
                  <button
                    onClick={() =>
                      quantity === 1
                        ? removeItem(product.id)
                        : updateQuantity(product.id, quantity - 1)
                    }
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 transition-colors active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={localQuantity}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setLocalQuantity(raw);
                      const val = parseInt(raw, 10);
                      if (!isNaN(val) && val >= 1) {
                        updateQuantity(product.id, val > product.stock ? product.stock : val);
                      }
                    }}
                    onBlur={() => {
                      let val = parseInt(localQuantity, 10);
                      if (isNaN(val) || val < 1) val = 1;
                      if (val > product.stock) val = product.stock;
                      updateQuantity(product.id, val);
                      setLocalQuantity(val.toString());
                    }}
                    className="w-8 text-center text-base sm:text-sm font-bold text-white bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stock}
                    className={`w-10 h-10 flex items-center justify-center text-white transition-colors active:scale-90 ${
                      quantity >= product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {quantity >= product.stock && !outOfStock && quantity > 0 && (
          <p className="text-[10px] font-bold text-red-500 mt-2 text-right">
            Max stock reached
          </p>
        )}
      </div>
    </div>
  );
}
