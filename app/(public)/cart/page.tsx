'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromCart, updateQuantity, clearCart } from '@/store/slices/cartSlice';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, total, itemCount } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const shippingCost = total >= 2000 ? 0 : 80;
  const finalTotal = total + shippingCost;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-30" />
        <h2
          className="font-display text-5xl tracking-wider mb-4"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          Your Cart Is Empty
        </h2>
        <p className="text-muted-foreground mb-8">
          Looks like you haven't added any pieces yet.
        </p>
        <Link href="/products">
          <Button className="btn-primary gap-2">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1
        className="font-display text-5xl tracking-wider mb-10"
        style={{ fontFamily: 'Bebas Neue, serif' }}
      >
        Your Cart ({itemCount} items)
      </h1>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 border border-border rounded-sm p-4 bg-card">
              <div className="relative w-20 h-24 flex-shrink-0 overflow-hidden rounded-sm">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.selectedCut} · {item.selectedSize} ·{' '}
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-border align-middle"
                        style={{ backgroundColor: item.selectedColor }}
                      />
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 border border-border rounded-sm">
                    <button
                      className="px-2 py-1 hover:bg-secondary transition-colors"
                      onClick={() =>
                        item.quantity === 1
                          ? dispatch(removeFromCart(item.id))
                          : dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                    <button
                      className="px-2 py-1 hover:bg-secondary transition-colors"
                      onClick={() =>
                        dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-semibold">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive text-sm"
            onClick={() => dispatch(clearCart())}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-sm p-6 bg-card sticky top-24">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-400' : ''}>
                  {shippingCost === 0 ? 'Free' : `৳${shippingCost}`}
                </span>
              </div>
              {total < 2000 && (
                <p className="text-xs text-muted-foreground">
                  Add ৳{(2000 - total).toLocaleString()} more for free shipping
                </p>
              )}
              <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <Link href="/checkout" className="block mt-6">
                <Button className="w-full btn-primary gap-2">
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="mt-6 space-y-3">
                <Link href="/login?redirect=/checkout">
                  <Button className="w-full btn-primary">Login to Checkout</Button>
                </Link>
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-primary hover:underline">
                    Register
                  </Link>
                </p>
              </div>
            )}

            {/* Payment logos */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">Secure payment via</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {['bKash', 'Nagad', 'Card'].map((m) => (
                  <span key={m} className="text-xs border border-border px-2 py-1 rounded-sm text-muted-foreground">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
