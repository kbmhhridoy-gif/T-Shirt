'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart } from '@/store/slices/cartSlice';
import { getMe } from '@/store/slices/authSlice';
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

const ALL_PAYMENT_OPTIONS: { id: PaymentMethod; name: string; icon: string; color: string; desc: string }[] = [
  { id: 'BKASH', name: 'bKash', icon: '💳', color: '#E2136E', desc: 'Pay via bKash (OTP verification)' },
  { id: 'NAGAD', name: 'Nagad', icon: '📱', color: '#F7941D', desc: 'Pay via Nagad (OTP verification)' },
  { id: 'CARD', name: 'Card', icon: '💳', color: '#1A1F71', desc: 'Visa / MasterCard / Amex (Stripe)' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { items, total } = useAppSelector((s) => s.cart);
  const { token, user } = useAppSelector((s) => s.auth);
  const isEditor = user?.role === 'EDITOR';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [paymentOptions, setPaymentOptions] = useState(ALL_PAYMENT_OPTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<'idle' | 'mobile' | 'otp'>('idle');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);

  useEffect(() => {
    if (token && !user) dispatch(getMe());
  }, [token, user, dispatch]);
  useEffect(() => {
    axios.get('/api/settings/public').then((res) => {
      const d = res.data;
      setPaymentOptions(
        ALL_PAYMENT_OPTIONS.filter((o) => {
          if (o.id === 'BKASH') return d.paymentBkashOn !== false;
          if (o.id === 'NAGAD') return d.paymentNagadOn !== false;
          if (o.id === 'CARD') return d.paymentCardOn !== false;
          return true;
        })
      );
      if (d.paymentBkashOn !== false) setPaymentMethod('BKASH');
      else if (d.paymentNagadOn !== false) setPaymentMethod('NAGAD');
      else if (d.paymentCardOn !== false) setPaymentMethod('CARD');
    }).catch(() => {});
  }, []);

  const shippingCost = total >= 2000 ? 0 : 80;
  const finalTotal = total + shippingCost;
  const useOtpFlow = paymentMethod === 'BKASH' || paymentMethod === 'NAGAD';

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (formData: CheckoutForm) => {
    if (isEditor) {
      toast({ title: 'Editors cannot place orders. Checkout is only for customers.', variant: 'destructive' });
      return;
    }
    if (!items.length) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
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

      if (useOtpFlow) {
        setPendingOrderId(orderId);
        setOtpStep('mobile');
        setMobileNumber(formData.phone || '');
        setIsLoading(false);
        return;
      }

      if (paymentMethod === 'CARD') {
        await axios.post('/api/payments/stripe', { orderId }, { headers: { Authorization: `Bearer ${token}` } });
        dispatch(clearCart());
        router.push(`/order-confirmation/${orderId}`);
        return;
      }
      setIsLoading(false);
    } catch (error: any) {
      toast({ title: 'Checkout failed', description: error.response?.data?.message || 'Please try again', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const phone = mobileNumber.replace(/\D/g, '').slice(-11);
    if (phone.length < 11) {
      toast({ title: 'Enter a valid 11-digit phone number', variant: 'destructive' });
      return;
    }
    setOtpSending(true);
    try {
      const res = await axios.post('/api/payments/otp/send', { phone: phone, orderId: pendingOrderId }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'OTP sent to your phone.', description: res.data?.message });
      setOtpStep('otp');
      setOtpValue('');
    } catch (e: any) {
      toast({ title: e.response?.data?.message || 'Failed to send OTP', variant: 'destructive' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim() || !pendingOrderId) return;
    setIsLoading(true);
    try {
      await axios.post(
        '/api/payments/otp/verify',
        { phone: mobileNumber.replace(/\D/g, '').slice(-11), otp: otpValue.trim(), orderId: pendingOrderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(clearCart());
      toast({ title: 'Payment successful!' });
      router.push(`/order-confirmation/${pendingOrderId}`);
    } catch (e: any) {
      toast({ title: e.response?.data?.message || 'Invalid OTP', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  if (isEditor) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h1 className="font-display text-3xl tracking-wider mb-4" style={{ fontFamily: 'Bebas Neue, serif' }}>Checkout Restricted</h1>
        <p className="text-muted-foreground mb-6">
          Editors cannot place orders. Checkout is only available for customers and admins.
        </p>
        <Link href="/products"><Button className="btn-primary">Continue Shopping</Button></Link>
      </div>
    );
  }

  if (items.length === 0 && otpStep === 'idle') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Link href="/products"><Button className="btn-primary">Continue Shopping</Button></Link>
      </div>
    );
  }

  if (otpStep === 'mobile' || otpStep === 'otp') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <h2 className="font-display text-2xl tracking-wider mb-6" style={{ fontFamily: 'Bebas Neue, serif' }}>
          {paymentMethod === 'BKASH' ? 'bKash' : 'Nagad'} Payment
        </h2>
        <div className="border border-border rounded-sm p-6 bg-card space-y-4">
          {otpStep === 'mobile' ? (
            <>
              <Label>Mobile Number</Label>
              <Input
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
              />
              <Button className="w-full btn-primary gap-2" onClick={handleSendOtp} disabled={otpSending}>
                {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <Label>Enter OTP</Label>
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">OTP is sent to your phone only (not email). Dev: check server console or use 123456</p>
              <Button className="w-full btn-primary gap-2" onClick={handleVerifyOtp} disabled={isLoading || otpValue.length < 4}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify & Pay ৳{finalTotal.toLocaleString()}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpStep('mobile')}>
                Change number
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/cart" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Cart
      </Link>
      <h1 className="font-display text-5xl tracking-wider mb-10" style={{ fontFamily: 'Bebas Neue, serif' }}>Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-8">
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
            <div className="border border-border rounded-sm p-6 bg-card">
              <h2 className="text-lg font-semibold mb-6">Payment Method</h2>
              <div className="space-y-3">
                {paymentOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 border rounded-sm text-left transition-all',
                      paymentMethod === option.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}
                    onClick={() => setPaymentMethod(option.id)}
                  >
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: option.color + '20', border: `1px solid ${option.color}40` }}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', paymentMethod === option.id ? 'border-primary' : 'border-border')}>
                      {paymentMethod === option.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
              {paymentMethod === 'BKASH' && (
                <div className="mt-4 p-3 bg-[#E2136E]/10 border border-[#E2136E]/20 rounded-sm text-xs text-muted-foreground">
                  Enter your bKash mobile number. We&apos;ll send an OTP to verify payment.
                </div>
              )}
              {paymentMethod === 'NAGAD' && (
                <div className="mt-4 p-3 bg-[#F7941D]/10 border border-[#F7941D]/20 rounded-sm text-xs text-muted-foreground">
                  Enter your Nagad mobile number. We&apos;ll send an OTP to verify payment.
                </div>
              )}
              {paymentMethod === 'CARD' && (
                <div className="mt-4 p-3 bg-blue-900/10 border border-blue-800/20 rounded-sm text-xs text-muted-foreground">
                  Secured by Stripe. Your card details are never stored.
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="border border-border rounded-sm p-6 bg-card sticky top-24">
              <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-14 flex-shrink-0 overflow-hidden rounded-sm">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.selectedCut} · {item.selectedSize} · ×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium flex-shrink-0">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-400' : ''}>{shippingCost === 0 ? 'FREE' : `৳${shippingCost}`}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
                  <span>Total</span><span className="text-primary">৳{finalTotal.toLocaleString()}</span>
                </div>
              </div>
              <Button type="submit" className="w-full btn-primary mt-6 gap-2" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><CheckCircle className="h-4 w-4" />Place Order · ৳{finalTotal.toLocaleString()}</>}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
