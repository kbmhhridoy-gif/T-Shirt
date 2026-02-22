'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import Link from 'next/link';

export default function AdminProductsPage() {
  const { token } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    comparePrice: '',
    image: '',
    stock: '',
    availableCuts: 'Regular,Oversized,Slim Fit',
    sizes: 'XS,S,M,L,XL,XXL',
    colors: '#000000,#ffffff',
    isFeatured: false,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = search ? `&search=${search}` : '';
      const { data } = await axios.get(`/api/products?limit=50${params}`);
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      image: product.image,
      stock: product.stock.toString(),
      availableCuts: product.availableCuts.join(','),
      sizes: product.sizes.join(','),
      colors: product.colors.join(','),
      isFeatured: product.isFeatured,
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      comparePrice: '',
      image: '',
      stock: '',
      availableCuts: 'Regular,Oversized,Slim Fit,Boxy',
      sizes: 'XS,S,M,L,XL,XXL',
      colors: '#000000,#ffffff',
      isFeatured: false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        availableCuts: formData.availableCuts.split(',').map((s) => s.trim()),
        sizes: formData.sizes.split(',').map((s) => s.trim()),
        colors: formData.colors.split(',').map((s) => s.trim()),
      };

      if (editingProduct) {
        await axios.patch(`/api/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: 'Product updated' });
      } else {
        await axios.post('/api/products', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: 'Product created' });
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Product deleted' });
      fetchProducts();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      await axios.patch(
        `/api/products/${product.id}`,
        { isActive: !product.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProducts();
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="font-display text-4xl tracking-wider"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            Products
          </h1>
          <p className="text-muted-foreground mt-1">{products.length} products</p>
        </div>
        <Button className="btn-primary gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products table */}
      <div className="border border-border rounded-sm bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {['Product', 'Price', 'Stock', 'Featured', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-12 overflow-hidden rounded-sm flex-shrink-0">
                      <Image src={product.image} alt={product.title} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.availableCuts?.length} cuts · {product.sizes?.length} sizes
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">৳{product.price.toLocaleString()}</p>
                    {product.comparePrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        ৳{product.comparePrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={product.stock < 10 ? 'text-red-400 font-medium' : 'text-muted-foreground'}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.isFeatured && (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleToggleActive(product)}>
                    {product.isActive ? (
                      <Badge className="bg-green-400/10 text-green-400 border-green-400/20 text-xs cursor-pointer">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs cursor-pointer">
                        Inactive
                      </Badge>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && products.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No products found</div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Product title"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Product description"
                className="w-full mt-1 px-3 py-2 bg-input border border-input rounded-sm text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <Label>Price (৳)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1299"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Compare Price (৳)</Label>
              <Input
                type="number"
                value={formData.comparePrice}
                onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="50"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                id="featured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="featured">Featured Product</Label>
            </div>
            <div className="col-span-2">
              <Label>Available Cuts (comma-separated)</Label>
              <Input
                value={formData.availableCuts}
                onChange={(e) => setFormData({ ...formData, availableCuts: e.target.value })}
                placeholder="Regular,Oversized,Slim Fit"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sizes (comma-separated)</Label>
              <Input
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                placeholder="XS,S,M,L,XL,XXL"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Colors (hex, comma-separated)</Label>
              <Input
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                placeholder="#000000,#ffffff"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={handleSave}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
