'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Star, Zap, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import axios from 'axios';

interface Product {
  id: string;
  title: string;
  price: number;
  comparePrice?: number;
  image: string;
  sizes: string[];
  colors: string[];
  availableCuts: string[];
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  stock: number;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  useEffect(() => {
    axios
      .get('/api/products?featured=true&limit=4')
      .then((res) => {
        setFeatured(res.data.products ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios
      .get('/api/products?limit=8&sortBy=createdAt&sortOrder=desc')
      .then((res) => {
        setNewArrivals(res.data.products ?? []);
        setLoadingNew(false);
      })
      .catch(() => setLoadingNew(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1516826957135-700dedea698c?w=1920&q=80"
            alt="Hero"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        </div>

        {/* Decorative lines */}
        <div className="absolute left-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
        <div className="absolute right-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 border border-primary/30 rounded-sm px-4 py-2 mb-8">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
              New Collection 2025
            </span>
          </div>

          <h1
            className="font-display text-[clamp(4rem,15vw,14rem)] leading-none tracking-wider text-foreground mb-6"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            <span className="block">THREAD</span>
            <span className="block text-primary">HAUS</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium T-shirts crafted for the bold. Each piece designed with intention — 
            heavyweight fabrics, custom cuts, curated for those who dare to stand out.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="btn-primary gap-2 text-sm">
                Explore Collection
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/products?featured=true">
              <Button size="lg" variant="outline" className="gap-2 text-sm border-border hover:border-primary/50">
                Featured Pieces
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { value: '20+', label: 'Products' },
              { value: '280gsm', label: 'Premium Weight' },
              { value: '100%', label: 'Organic Cotton' },
              { value: '4', label: 'Cut Styles' },
              { value: 'Free', label: 'Returns Always' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl text-primary" style={{ fontFamily: 'Bebas Neue, serif' }}>
                  {stat.value}
                </div>
                <div className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Handpicked</p>
            <h2
              className="font-display text-5xl md:text-6xl tracking-wider"
              style={{ fontFamily: 'Bebas Neue, serif' }}
            >
              Featured
              <br />
              Collection
            </h2>
          </div>
          <Link href="/products?featured=true">
            <Button variant="ghost" className="gap-2 text-sm hidden md:flex">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] shimmer-bg rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Just Dropped</p>
            <h2
              className="font-display text-5xl md:text-6xl tracking-wider"
              style={{ fontFamily: 'Bebas Neue, serif' }}
            >
              New
              <br />
              Arrivals
            </h2>
          </div>
          <Link href="/products?new=true">
            <Button variant="ghost" className="gap-2 text-sm hidden md:flex">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {loadingNew ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] shimmer-bg rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Shop by Cut */}
      <section className="border-y border-border bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4 text-center">
            Shop by Cut
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Regular', 'Oversized', 'Slim Fit', 'Boxy', 'Cropped', 'Athletic'].map((cut) => (
              <Link key={cut} href="/products">
                <span className="inline-block border border-border px-5 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors rounded-sm">
                  {cut}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* T-Shirt Customizer CTA */}
      <section className="relative overflow-hidden py-24 bg-card border-y border-border">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">Personalize</p>
            <h2
              className="font-display text-5xl md:text-7xl tracking-wider mb-6"
              style={{ fontFamily: 'Bebas Neue, serif' }}
            >
              Cut It
              <br />
              Your Way
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl">
              Choose your cut — Regular, Oversized, Slim Fit, Boxy, Cropped, or Athletic. 
              Your T-shirt should fit your vision, not the other way around.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Regular', 'Oversized', 'Slim Fit', 'Boxy', 'Cropped', 'Athletic'].map((cut) => (
                <span
                  key={cut}
                  className="border border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-default rounded-sm"
                >
                  {cut}
                </span>
              ))}
            </div>
            <Link href="/products">
              <Button size="lg" className="btn-primary gap-2">
                Start Customizing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Premium Quality',
              desc: '280gsm heavyweight organic cotton. Pre-washed, pre-shrunk. Built to last.',
            },
            {
              icon: Truck,
              title: 'Free Shipping',
              desc: 'Free delivery on orders over ৳2,000. Same-day dispatch from Dhaka.',
            },
            {
              icon: Star,
              title: 'Made to Order',
              desc: 'Every cut selected by you. Your style, your fabric, your statement.',
            },
          ].map((feature) => (
            <div key={feature.title} className="border border-border p-8 rounded-sm hover:border-primary/30 transition-colors group">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-sm flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Payment methods banner */}
      <section className="border-t border-border bg-card/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Secure Payment via
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {[
              { name: 'bKash', color: '#E2136E' },
              { name: 'Nagad', color: '#F7941D' },
              { name: 'Visa', color: '#1A1F71' },
              { name: 'MasterCard', color: '#EB001B' },
            ].map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-2 border border-border px-4 py-2 rounded-sm"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: method.color }}
                />
                <span className="text-sm font-medium">{method.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
