'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { useToast } from '@/components/ui/use-toast';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    comparePrice?: number | null;
    image: string;
    sizes: string[];
    colors: string[];
    availableCuts: string[];
    avgRating?: number;
    reviewCount?: number;
    isFeatured?: boolean;
    stock?: number;
    createdAt?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const isNew =
    product.createdAt &&
    new Date().getTime() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const defaultSize = product.sizes?.[0] ?? 'M';
  const defaultColor = product.colors?.[0] ?? '#000000';
  const defaultCut = product.availableCuts?.[0] ?? 'Regular';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(
      addToCart({
        id: `${product.id}-${defaultSize}-${defaultColor}-${defaultCut}`,
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1,
        selectedSize: defaultSize,
        selectedColor: defaultColor,
        selectedCut: defaultCut,
      })
    );

    toast({
      title: 'Added to cart',
      description: `${product.title} — ${defaultSize}, ${defaultCut}`,
    });
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="product-card rounded-sm group bg-card dark:bg-gray-900/50">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary dark:bg-gray-800/50">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.isFeatured && (
              <Badge className="bg-primary text-primary-foreground text-xs rounded-sm dark:bg-primary dark:text-primary-foreground">
                Featured
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-emerald-600 text-white text-xs rounded-sm dark:bg-emerald-500 dark:text-white border-0">
                New
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="text-xs rounded-sm">
                -{discount}%
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="text-xs rounded-sm">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button
              className="w-full btn-primary py-2 text-xs gap-2"
              onClick={handleQuickAdd}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Color swatches */}
          <div className="flex gap-1 mb-2">
            {product.colors.slice(0, 5).map((color) => (
              <div
                key={color}
                className="w-3 h-3 rounded-full border border-border/50"
                style={{ backgroundColor: color }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-muted-foreground">+{product.colors.length - 5}</span>
            )}
          </div>

          <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.title}
          </h3>

          {/* Rating */}
          {product.avgRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs text-muted-foreground">
                {product.avgRating.toFixed(1)} ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-semibold text-foreground dark:text-white">৳{product.price.toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-xs text-muted-foreground line-through">
                ৳{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Cuts preview */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {product.availableCuts.slice(0, 3).map((cut) => (
              <span key={cut} className="text-xs text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm">
                {cut}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
