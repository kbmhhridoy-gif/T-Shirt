'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart } from '@/store/slices/cartSlice';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const checkoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(11).max(11),
  address: z.string().min(10),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

type PaymentMethod = 'BKASH' | 'NAGAD' | 'CARD';

const PAYMENT_OPTIONS = [
  {
    id: 'BKASH' as PaymentMethod,
    name: 'bKash',
    icon: '💳',
    color: '#E2136E',
    desc: 'Pay via bKash mobile banking',
  },
  {
    id: 'NAGAD' as PaymentMethod,
    name: 'Nagad',
    icon: '📱',
    color: '#F7941D',
    desc: 'Pay via Nagad mobile banking',
  },
  {
    id: 'CARD' as PaymentMethod,
    name: 'Card',
    icon: '💳',
    color: '#1A1F71',
    desc: 'Visa / MasterCard / Amex',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { items, total } = useAppSelector((s) => s.cart);
  const { token } = useAppSelector((s) => s.auth);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [isLoading, setIsLoading] = useState(false);

  const shippingCost = total >= 2000 ? 0 : 80;
  const finalTotal = total + shippingCost;

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (formData: CheckoutForm) => {
    if (!items.length) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const { data: orderData } = await axios.post(
        '/api/orders',
        {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            selectedCut: item.selectedCut,
          })),
          paymentMethod,
          shippingAddr: `${formData.name}, ${formData.phone}, ${formData.address}`,
          notes: formData.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderData.order.id;

      // Initiate payment
      if (paymentMethod === 'BKASH') {
        const { data: bkashData } = await axios.post(
          '/api/payments/bkash',
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(clearCart());
        window.location.href = bkashData.bkashURL;
      } else if (paymentMethod === 'NAGAD') {
        // Nagad redirect
        toast({ title: 'Redirecting to Nagad...' });
        dispatch(clearCart());
        router.push(`/order-confirmation/${orderId}?payment=pending`);
      } else if (paymentMethod === 'CARD') {
        const { data: stripeData } = await axios.post(
          '/api/payments/stripe',
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(clearCart());
        // In production, use Stripe Elements here
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (error: any) {
      toast({
        title: 'Checkout failed',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Link href="/products">
          <Button className="btn-primary">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/cart" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1
        className="font-display text-5xl tracking-wider mb-10"
        style={{ fontFamily: 'Bebas Neue, serif' }}
      >
        Checkout
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Delivery info */}
            <div className="border border-border rounded-sm p-6 bg-card">
              <h2 className="text-lg font-semibold mb-6">Delivery Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register('name')} placeholder="Your full name" className="mt-1" />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" {...register('phone')} placeholder="01XXXXXXXXX" className="mt-1" />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <textarea
                    id="address"
                    {...register('address')}
                    placeholder="House/Road, Area, District"
                    rows={3}
                    className="w-full mt-1 px-3 py-2 bg-input border border-input rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Input id="notes" {...register('notes')} placeholder="Special instructions..." className="mt-1" />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="border border-border rounded-sm p-6 bg-card">
              <h2 className="text-lg font-semibold mb-6">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 border rounded-sm text-left transition-all',
                      paymentMethod === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                    onClick={() => setPaymentMethod(option.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: option.color + '20', border: `1px solid ${option.color}40` }}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        paymentMethod === option.id ? 'border-primary' : 'border-border'
                      )}
                    >
                      {paymentMethod === option.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'BKASH' && (
                <div className="mt-4 p-3 bg-[#E2136E]/10 border border-[#E2136E]/20 rounded-sm text-xs text-muted-foreground">
                  You will be redirected to bKash to complete payment securely.
                </div>
              )}
              {paymentMethod === 'NAGAD' && (
                <div className="mt-4 p-3 bg-[#F7941D]/10 border border-[#F7941D]/20 rounded-sm text-xs text-muted-foreground">
                  You will be redirected to Nagad to complete payment securely.
                </div>
              )}
              {paymentMethod === 'CARD' && (
                <div className="mt-4 p-3 bg-blue-900/10 border border-blue-800/20 rounded-sm text-xs text-muted-foreground">
                  Secured by Stripe. Your card details are never stored.
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="border border-border rounded-sm p-6 bg-card sticky top-24">
              <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-14 flex-shrink-0 overflow-hidden rounded-sm">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.selectedCut} · {item.selectedSize} · ×{item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium flex-shrink-0">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-400' : ''}>
                    {shippingCost === 0 ? 'FREE' : `৳${shippingCost}`}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-primary">৳{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-primary mt-6 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Place Order · ৳{finalTotal.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
