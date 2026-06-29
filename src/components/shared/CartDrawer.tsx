import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
              {totalItems > 0 && (
                <span className="bg-brand/10 text-brand text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">Your cart is empty</p>
                <p className="text-sm text-gray-400">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border-2 border-gray-100 rounded-[20px] p-3 transition-all duration-200 hover:border-black"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1 min-w-0">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-xl bg-white flex-shrink-0 overflow-hidden border border-gray-100">
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm font-black text-black mt-0.5">₹{product.price}</p>
                        {quantity >= product.stock && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">Max stock reached</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex justify-end w-full sm:w-auto">
                      <div className="flex items-center gap-1 bg-black rounded-full p-1 shadow-lg shadow-black/10">
                        <button
                          onClick={() =>
                            quantity === 1
                              ? removeItem(product.id)
                              : updateQuantity(product.id, quantity - 1)
                          }
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          value={localQuantities[product.id] ?? quantity.toString()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setLocalQuantities(prev => ({ ...prev, [product.id]: raw }));
                            const val = parseInt(raw, 10);
                            if (!isNaN(val) && val >= 1) {
                              updateQuantity(product.id, val > product.stock ? product.stock : val);
                            }
                          }}
                          onBlur={() => {
                            const raw = localQuantities[product.id];
                            if (raw === undefined) return;
                            let val = parseInt(raw, 10);
                            if (isNaN(val) || val < 1) val = 1;
                            if (val > product.stock) val = product.stock;
                            updateQuantity(product.id, val);
                            setLocalQuantities(prev => ({ ...prev, [product.id]: val.toString() }));
                          }}
                          className="w-10 text-center text-base sm:text-xs font-bold text-white bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors ${
                            quantity >= product.stock ? 'opacity-50 cursor-not-allowed bg-gray-500 hover:bg-gray-500' : 'hover:bg-gray-800'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalPrice.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full text-sm font-bold active:scale-[0.98] transition-all duration-200 shadow-xl shadow-black/20"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
