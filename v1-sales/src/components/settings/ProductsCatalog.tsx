import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  currency: string | null;
  is_active: boolean | null;
  variations_count?: number;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  billing_cycle: string | null;
  is_default: boolean | null;
  features: any;
}

export const ProductsCatalog = () => {
  const { organization, getLabel } = useOrganization();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    currency: 'USD',
    is_active: true
  });

  useEffect(() => {
    if (organization) {
      loadProducts();
    }
  }, [organization]);

  const loadProducts = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variations (count)
        `)
        .eq('organization_id', organization.id)
        .order('name');

      if (error) throw error;

      const formattedProducts = data.map((product: any) => ({
        ...product,
        variations_count: product.product_variations[0]?.count || 0
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error loading products',
        description: 'Failed to load product catalog',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVariations = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .order('name');

      if (error) throw error;
      setVariations(data || []);
    } catch (error) {
      console.error('Error loading variations:', error);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        base_price: product.base_price?.toString() || '',
        currency: product.currency || 'USD',
        is_active: product.is_active ?? true
      });
      loadVariations(product.id);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        base_price: '',
        currency: 'USD',
        is_active: true
      });
      setVariations([]);
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!organization) return;

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        currency: formData.currency,
        is_active: formData.is_active,
        organization_id: organization.id
      };

      if (editingProduct) {
        // Update existing
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: 'Product updated',
          description: 'Product has been updated successfully'
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: 'Product created',
          description: 'New product has been added to catalog'
        });
      }

      setIsDialogOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error saving product',
        description: 'Failed to save product',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Product deleted',
        description: 'Product has been removed from catalog'
      });

      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error deleting product',
        description: 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products Catalog</h2>
          <p className="text-muted-foreground">Manage your product offerings</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Product
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading products...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {product.variations_count} variations
                    </CardDescription>
                  </div>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}
                {product.base_price && (
                  <p className="text-2xl font-bold mb-4">
                    {product.currency} {product.base_price.toFixed(2)}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price">Base Price</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {variations.length > 0 && (
              <div>
                <Label>Variations</Label>
                <div className="mt-2 space-y-2">
                  {variations.map((variation) => (
                    <div key={variation.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{variation.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.currency} {variation.price.toFixed(2)}
                          {variation.billing_cycle && ` / ${variation.billing_cycle}`}
                        </p>
                      </div>
                      {variation.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={!formData.name}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};