'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Edit, Trash2, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function EditorProductsPage() {
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
    availableCuts: '',
    sizes: '',
    colors: '',
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
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await axios.patch(
        `/api/products/${editingProduct.id}`,
        {
          ...formData,
          availableCuts: formData.availableCuts.split(',').map((s) => s.trim()),
          sizes: formData.sizes.split(',').map((s) => s.trim()),
          colors: formData.colors.split(',').map((s) => s.trim()),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Product updated' });
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
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Delete failed';
      toast({ title: 'Cannot delete', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="font-display text-4xl tracking-wider"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          Editor Panel
        </h1>
        <p className="text-muted-foreground mt-1">Manage products — update and delete only</p>
      </div>

      {/* Editor notice */}
      <div className="border border-blue-800/30 bg-blue-400/5 rounded-sm p-4 mb-6 text-sm text-blue-300">
        ℹ️ As an editor, you can update and delete products. Product creation and user management requires Admin access.
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-border rounded-sm bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {['Product', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
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
                <td className="px-6 py-4 font-medium">৳{product.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-muted-foreground">{product.stock}</td>
                <td className="px-6 py-4">
                  {product.isActive ? (
                    <Badge className="bg-green-400/10 text-green-400 border-green-400/20 text-xs">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
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

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-input border border-input rounded-sm text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <Label>Price (৳)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Compare Price (৳)</Label>
              <Input
                type="number"
                value={formData.comparePrice}
                onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Available Cuts</Label>
              <Input
                value={formData.availableCuts}
                onChange={(e) => setFormData({ ...formData, availableCuts: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sizes</Label>
              <Input
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Colors (hex)</Label>
              <Input
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="btn-primary" onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
