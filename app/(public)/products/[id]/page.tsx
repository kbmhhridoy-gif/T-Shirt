'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingCart, Star, Heart, Share2, ChevronLeft, ChevronRight,
  Truck, Shield, RotateCcw, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { cn } from '@/lib/utils';

const CUT_DESCRIPTIONS: Record<string, string> = {
  'Regular': 'Classic straight fit. Not too tight, not too loose.',
  'Oversized': 'Dropped shoulders, relaxed body. Boxy silhouette.',
  'Slim Fit': 'Tailored close to the body. Clean lines.',
  'Boxy': 'Square cut, wide body. Fashion-forward silhouette.',
  'Cropped': 'Shorter length, hits above the hip.',
  'Athletic': 'Tapered torso, roomier shoulders. Active fit.',
  'Relaxed': 'Easy-going fit with a slight drop.',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCut, setSelectedCut] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    axios
      .get(`/api/products/${id}`)
      .then((res) => {
        const p = res.data.product;
        if (!p) {
          setProduct(null);
          setLoading(false);
          return;
        }
        setProduct(p);
        setSelectedSize(p.sizes?.[0] ?? 'M');
        setSelectedColor(p.colors?.[0] ?? '#000000');
        setSelectedCut(p.availableCuts?.[0] ?? 'Regular');
        setLoading(false);
      })
      .catch(() => {
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor || !selectedCut) {
      toast({ title: 'Please select all options', variant: 'destructive' });
      return;
    }

    dispatch(
      addToCart({
        id: `${product.id}-${selectedSize}-${selectedColor}-${selectedCut}-${Date.now()}`,
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
        selectedSize,
        selectedColor,
        selectedCut,
      })
    );

    toast({
      title: 'Added to cart! 🛍️',
      description: `${product.title} — ${selectedCut}, ${selectedSize}`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square shimmer-bg rounded-sm" />
          <div className="space-y-4">
            <div className="h-10 shimmer-bg rounded-sm w-3/4" />
            <div className="h-6 shimmer-bg rounded-sm w-1/2" />
            <div className="h-24 shimmer-bg rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg mb-6">Product not found or no longer available.</p>
        <Button variant="outline" onClick={() => router.push('/products')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>
      </div>
    );
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
        {/* Images */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-sm bg-secondary">
            <Image
              src={product.images?.[activeImage] || product.image}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
            {product.images?.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 rounded-full flex items-center justify-center"
                  onClick={() => setActiveImage((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 rounded-full flex items-center justify-center"
                  onClick={() => setActiveImage((i) => Math.min(product.images.length - 1, i + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 snap-x snap-mandatory">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  className={cn(
                    'w-14 h-14 sm:w-16 sm:h-16 relative rounded-sm overflow-hidden border-2 transition-colors flex-shrink-0 snap-center',
                    activeImage === i ? 'border-primary' : 'border-border'
                  )}
                  onClick={() => setActiveImage(i)}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Tags */}
          <div className="flex gap-2 mb-4">
            {product.isFeatured && (
              <Badge className="bg-primary/20 text-primary border-primary/30 rounded-sm">
                Featured
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="rounded-sm">
                {discount}% OFF
              </Badge>
            )}
          </div>

          <h1
            className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wider mb-3"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            {product.title}
          </h1>

          {/* Rating */}
          {product.reviews?.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn('h-4 w-4', s <= Math.round(product.avgRating) ? 'fill-primary text-primary' : 'text-muted-foreground')}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.avgRating?.toFixed(1)} ({product.reviews.length} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold">৳{product.price.toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-lg text-muted-foreground line-through">
                ৳{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            {product.description}
          </p>

          {/* ── CUSTOMIZER ── */}
          <div className="space-y-5 sm:space-y-6 border border-border rounded-sm p-4 sm:p-5 mb-6">
            <h3 className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Customize Your Tee
            </h3>

            {/* Color selection */}
            <div>
              <p className="text-sm font-medium mb-3">
                Color{' '}
                <span className="text-muted-foreground font-normal text-xs ml-1">
                  ({product.colors.length} options)
                </span>
              </p>
              <div className="flex gap-3 flex-wrap">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      selectedColor === color
                        ? 'border-primary scale-110 shadow-lg shadow-primary/30'
                        : 'border-border hover:border-primary/50'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Size selection */}
            <div>
              <p className="text-sm font-medium mb-3">Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    className={cn(
                      'px-4 py-2 text-sm border rounded-sm transition-all font-mono',
                      selectedSize === size
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Cut selection */}
            <div>
              <p className="text-sm font-medium mb-3">Cut Style</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.availableCuts.map((cut: string) => (
                  <button
                    key={cut}
                    className={cn(
                      'px-3 py-3 text-left border rounded-sm transition-all',
                      selectedCut === cut
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    )}
                    onClick={() => setSelectedCut(cut)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cut}</span>
                      {selectedCut === cut && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {CUT_DESCRIPTIONS[cut] || 'Classic fit'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  className="w-8 h-8 border border-border rounded-sm flex items-center justify-center hover:border-primary/50"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="font-mono w-8 text-center">{quantity}</span>
                <button
                  className="w-8 h-8 border border-border rounded-sm flex items-center justify-center hover:border-primary/50"
                  onClick={() => setQuantity((q) => Math.min(product.stock ?? 999, q + 1))}
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground ml-2">
                  {product.stock ?? 0} in stock
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 btn-primary gap-2"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Buy Now
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 pt-6 border-t border-border">
            {[
              { icon: Truck, label: 'Fast Delivery' },
              { icon: Shield, label: 'Secure Payment' },
              { icon: RotateCcw, label: 'Free Returns' },
            ].map((badge) => (
              <div key={badge.label} className="text-center">
                <badge.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">{badge.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <div className="mt-12 sm:mt-20 border-t border-border pt-8 sm:pt-12">
          <h2
            className="font-display text-3xl sm:text-4xl tracking-wider mb-6 sm:mb-8"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            Customer Reviews
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {product.reviews.map((review: any) => (
              <div key={review.id} className="border border-border rounded-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {review.user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.user.name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn('h-3 w-3', s <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground')}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
