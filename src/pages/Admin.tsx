import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, Pencil, Trash2, Package, AlertTriangle, 
  TrendingUp, Settings, LayoutDashboard, Mail, Phone, 
  MapPin, Facebook, Instagram, Twitter, Youtube, MessageCircle,
  ShoppingCart, Eye, Shield, Truck, CheckCircle, Upload, ImageIcon,
  CreditCard, Smartphone, Building2
} from "lucide-react";
import { toast } from "sonner";
import type { Product, Order, ContactMessage } from "@/types/product";

type SiteSettings = Record<string, string>;

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    featured: false,
    stock: "0",
    warranty_text: "2 Year Warranty",
    shipping_text: "Free Shipping",
    authenticity_text: "Authentic",
  });
  const [settingsData, setSettingsData] = useState<SiteSettings>({
    email: "",
    phone: "",
    address: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    whatsapp_number: "",
    // Payment settings
    easypaisa_title: "",
    easypaisa_number: "",
    jazzcash_title: "",
    jazzcash_number: "",
    bank_name: "",
    bank_title: "",
    bank_account: "",
    bank_iban: "",
  });

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to access admin panel");
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        navigate('/');
      }
    };

    checkAdmin();
  }, [navigate]);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    }
  });

  // Fetch contact messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContactMessage[];
    }
  });

  // Fetch site settings
  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      
      const settings: SiteSettings = {};
      data?.forEach((item: { key: string; value: string | null }) => {
        settings[item.key] = item.value || "";
      });
      return settings;
    }
  });

  // Update settings state when fetched
  useEffect(() => {
    if (siteSettings) {
      setSettingsData(prev => ({ ...prev, ...siteSettings }));
    }
  }, [siteSettings]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('products').insert([product] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success("Product added successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...product }: { id: string } & Partial<Product>) => {
      const { error } = await supabase
        .from('products')
        .update(product as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success("Product updated successfully");
      setEditingProduct(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      toast.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Order status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Order deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Payment status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SiteSettings) => {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMessageStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('contact_messages')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success("Message status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success("Message deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
      featured: false,
      stock: "0",
      warranty_text: "2 Year Warranty",
      shipping_text: "Free Shipping",
      authenticity_text: "Authentic",
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if a new file was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const product = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: imageUrl,
        featured: formData.featured,
        stock: parseInt(formData.stock) || 0,
        warranty_text: formData.warranty_text,
        shipping_text: formData.shipping_text,
        authenticity_text: formData.authenticity_text,
      };

      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, ...product });
      } else {
        addMutation.mutate(product);
      }
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      image_url: product.image_url || "",
      featured: product.featured || false,
      stock: product.stock?.toString() || "0",
      warranty_text: product.warranty_text || "2 Year Warranty",
      shipping_text: product.shipping_text || "Free Shipping",
      authenticity_text: product.authenticity_text || "Authentic",
    });
    setImagePreview(product.image_url || "");
    setImageFile(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(settingsData);
  };

  // Stats calculations
  const totalProducts = products?.length || 0;
  const outOfStock = products?.filter(p => (p.stock || 0) <= 0).length || 0;
  const totalValue = products?.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0) || 0;
  const featuredCount = products?.filter(p => p.featured).length || 0;
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

  const stats = [
    { icon: Package, label: "Total Products", value: totalProducts, color: "text-primary" },
    { icon: AlertTriangle, label: "Out of Stock", value: outOfStock, color: "text-destructive" },
    { icon: TrendingUp, label: "Featured", value: featuredCount, color: "text-primary" },
    { icon: Package, label: "Total Value", value: `Rs. ${totalValue.toLocaleString()}`, color: "text-primary" },
    { icon: ShoppingCart, label: "Total Orders", value: totalOrders, color: "text-primary" },
    { icon: AlertTriangle, label: "Pending Orders", value: pendingOrders, color: "text-destructive" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600';
      case 'shipped': return 'bg-purple-500/10 text-purple-600';
      case 'delivered': return 'bg-green-500/10 text-green-600';
      case 'cancelled': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Manage your store, products, orders and settings</p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-[625px]">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <p className="text-xl font-bold text-card-foreground">
                          {typeof stat.value === 'number' ? stat.value : stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                              <img
                                src={order.product_image_url || "/placeholder.svg"}
                                alt={order.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{order.product_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">Rs. {order.total_amount.toLocaleString()}</p>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => {
                  if (!open) {
                    setIsAddDialogOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? "Edit Product" : "Add New Product"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingProduct ? "Update the product details below" : "Fill in the details to add a new product"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Luxury Watch Model X"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (Rs.) *</Label>
                          <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="25000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock">Stock</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            placeholder="10"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Luxury, Sports, Classic..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" /> Product Image
                        </Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {imagePreview || formData.image_url ? (
                            <div className="relative">
                              <img 
                                src={imagePreview || formData.image_url} 
                                alt="Preview" 
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-background/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <p className="text-sm font-medium">Click to change</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                              <Upload className="h-8 w-8 mb-2" />
                              <p className="text-sm">Click to upload image</p>
                              <p className="text-xs">Max 5MB</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Product description..."
                          rows={3}
                        />
                      </div>

                      {/* Product Features */}
                      <div className="border border-border rounded-lg p-4 space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Product Features
                        </h4>
                        <div className="space-y-2">
                          <Label htmlFor="warranty_text" className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Warranty Text
                          </Label>
                          <Input
                            id="warranty_text"
                            value={formData.warranty_text}
                            onChange={(e) => setFormData({ ...formData, warranty_text: e.target.value })}
                            placeholder="2 Year Warranty"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipping_text" className="flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Shipping Text
                          </Label>
                          <Input
                            id="shipping_text"
                            value={formData.shipping_text}
                            onChange={(e) => setFormData({ ...formData, shipping_text: e.target.value })}
                            placeholder="Free Shipping"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="authenticity_text" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Authenticity Text
                          </Label>
                          <Input
                            id="authenticity_text"
                            value={formData.authenticity_text}
                            onChange={(e) => setFormData({ ...formData, authenticity_text: e.target.value })}
                            placeholder="Authentic"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch
                          id="featured"
                          checked={formData.featured}
                          onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                        />
                        <Label htmlFor="featured">Featured Product</Label>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button type="submit" variant="hero" className="flex-1" disabled={isUploading}>
                          {isUploading ? "Uploading..." : editingProduct ? "Update Product" : "Add Product"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false);
                            setEditingProduct(null);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : products && products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                                  <img
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category || "-"}</TableCell>
                              <TableCell>Rs. {product.price.toLocaleString()}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  (product.stock || 0) > 0 
                                    ? "bg-primary/10 text-primary" 
                                    : "bg-destructive/10 text-destructive"
                                }`}>
                                  {product.stock || 0}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  product.featured 
                                    ? "bg-primary/10 text-primary" 
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {product.featured ? "Yes" : "No"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(product)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this product?")) {
                                        deleteMutation.mutate(product.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No products yet</p>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Product
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : orders && orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tracking ID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                  {(order as any).tracking_id || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                                    <img
                                      src={order.product_image_url || "/placeholder.svg"}
                                      alt={order.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium">{order.product_name}</p>
                                    <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{order.customer_name}</p>
                                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                              </TableCell>
                              <TableCell>
                                <p>{order.customer_phone}</p>
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                Rs. {order.total_amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-xs capitalize">{order.payment_method || 'COD'}</p>
                                  <select
                                    value={order.payment_status || 'pending'}
                                    onChange={(e) => updatePaymentStatusMutation.mutate({ id: order.id, payment_status: e.target.value })}
                                    className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer ${
                                      order.payment_status === 'paid' ? 'bg-green-500/10 text-green-600' :
                                      order.payment_status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                      'bg-yellow-500/10 text-yellow-600'
                                    }`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                  </select>
                                </div>
                              </TableCell>
                              <TableCell>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatusMutation.mutate({ id: order.id, status: e.target.value })}
                                  className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer ${getStatusColor(order.status)}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </TableCell>
                              <TableCell>
                                {new Date(order.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewingOrder(order)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Order Details</DialogTitle>
                                        <DialogDescription>View complete order information</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="flex gap-4">
                                          <div className="w-24 h-24 rounded bg-muted overflow-hidden">
                                            <img
                                              src={order.product_image_url || "/placeholder.svg"}
                                              alt={order.product_name}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <div>
                                            <h4 className="font-bold">{order.product_name}</h4>
                                            <p className="text-primary font-bold">Rs. {order.product_price.toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                                          </div>
                                        </div>
                                        <div className="border-t border-border pt-4 space-y-2">
                                          <p><strong>Tracking ID:</strong> <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{(order as any).tracking_id || '-'}</span></p>
                                          <p><strong>Customer:</strong> {order.customer_name}</p>
                                          <p><strong>Email:</strong> {order.customer_email}</p>
                                          <p><strong>Phone:</strong> {order.customer_phone}</p>
                                          {order.customer_address && (
                                            <p><strong>Address:</strong> {order.customer_address}</p>
                                          )}
                                          {order.notes && (
                                            <p><strong>Notes:</strong> {order.notes}</p>
                                          )}
                                          <p><strong>Payment Method:</strong> <span className="capitalize">{order.payment_method || 'COD'}</span></p>
                                          <p><strong>Payment Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${
                                            order.payment_status === 'paid' ? 'bg-green-500/10 text-green-600' :
                                            order.payment_status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                            'bg-yellow-500/10 text-yellow-600'
                                          }`}>{order.payment_status || 'pending'}</span></p>
                                          <p><strong>Total:</strong> <span className="text-primary font-bold">Rs. {order.total_amount.toLocaleString()}</span></p>
                                          <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>{order.status}</span></p>
                                          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this order?")) {
                                        deleteOrderMutation.mutate(order.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : messages && messages.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {messages.map((msg) => (
                            <TableRow key={msg.id}>
                              <TableCell className="font-medium">{msg.name}</TableCell>
                              <TableCell>{msg.email}</TableCell>
                              <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                              <TableCell>
                                <select
                                  value={msg.status}
                                  onChange={(e) => updateMessageStatusMutation.mutate({ id: msg.id, status: e.target.value })}
                                  className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer ${
                                    msg.status === 'new' ? 'bg-blue-500/10 text-blue-600' :
                                    msg.status === 'read' ? 'bg-yellow-500/10 text-yellow-600' :
                                    'bg-green-500/10 text-green-600'
                                  }`}
                                >
                                  <option value="new">New</option>
                                  <option value="read">Read</option>
                                  <option value="replied">Replied</option>
                                </select>
                              </TableCell>
                              <TableCell>{new Date(msg.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Message Details</DialogTitle>
                                        <DialogDescription>View the full contact message</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground">From</p>
                                          <p className="font-medium">{msg.name}</p>
                                          <p className="text-sm">{msg.email}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Message</p>
                                          <p className="whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Received</p>
                                          <p>{new Date(msg.created_at).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this message?")) {
                                        deleteMessageMutation.mutate(msg.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No messages yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <form onSubmit={handleSaveSettings}>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={settingsData.email}
                          onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })}
                          placeholder="info@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone
                        </Label>
                        <Input
                          id="phone"
                          value={settingsData.phone}
                          onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
                          placeholder="+92 300 1234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Address
                        </Label>
                        <Input
                          id="address"
                          value={settingsData.address}
                          onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                          placeholder="City, Country"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Instagram className="h-5 w-5" />
                        Social Media Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" /> Facebook URL
                        </Label>
                        <Input
                          id="facebook"
                          value={settingsData.facebook_url}
                          onChange={(e) => setSettingsData({ ...settingsData, facebook_url: e.target.value })}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" /> Instagram URL
                        </Label>
                        <Input
                          id="instagram"
                          value={settingsData.instagram_url}
                          onChange={(e) => setSettingsData({ ...settingsData, instagram_url: e.target.value })}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" /> Twitter URL
                        </Label>
                        <Input
                          id="twitter"
                          value={settingsData.twitter_url}
                          onChange={(e) => setSettingsData({ ...settingsData, twitter_url: e.target.value })}
                          placeholder="https://twitter.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youtube" className="flex items-center gap-2">
                          <Youtube className="h-4 w-4" /> YouTube URL
                        </Label>
                        <Input
                          id="youtube"
                          value={settingsData.youtube_url}
                          onChange={(e) => setSettingsData({ ...settingsData, youtube_url: e.target.value })}
                          placeholder="https://youtube.com/@yourchannel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" /> WhatsApp Number
                        </Label>
                        <Input
                          id="whatsapp"
                          value={settingsData.whatsapp_number}
                          onChange={(e) => setSettingsData({ ...settingsData, whatsapp_number: e.target.value })}
                          placeholder="+923001234567"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Easypaisa Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        Easypaisa Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="easypaisa_title">Account Title</Label>
                        <Input
                          id="easypaisa_title"
                          value={settingsData.easypaisa_title}
                          onChange={(e) => setSettingsData({ ...settingsData, easypaisa_title: e.target.value })}
                          placeholder="Muhammad Ali"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="easypaisa_number">Account Number</Label>
                        <Input
                          id="easypaisa_number"
                          value={settingsData.easypaisa_number}
                          onChange={(e) => setSettingsData({ ...settingsData, easypaisa_number: e.target.value })}
                          placeholder="0300-1234567"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* JazzCash Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-red-600" />
                        JazzCash Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="jazzcash_title">Account Title</Label>
                        <Input
                          id="jazzcash_title"
                          value={settingsData.jazzcash_title}
                          onChange={(e) => setSettingsData({ ...settingsData, jazzcash_title: e.target.value })}
                          placeholder="Muhammad Ali"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jazzcash_number">Account Number</Label>
                        <Input
                          id="jazzcash_number"
                          value={settingsData.jazzcash_number}
                          onChange={(e) => setSettingsData({ ...settingsData, jazzcash_number: e.target.value })}
                          placeholder="0301-7654321"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Transfer Settings */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Bank Account Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="bank_name">Bank Name</Label>
                          <Input
                            id="bank_name"
                            value={settingsData.bank_name}
                            onChange={(e) => setSettingsData({ ...settingsData, bank_name: e.target.value })}
                            placeholder="HBL Bank"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank_title">Account Title</Label>
                          <Input
                            id="bank_title"
                            value={settingsData.bank_title}
                            onChange={(e) => setSettingsData({ ...settingsData, bank_title: e.target.value })}
                            placeholder="Muhammad Ali"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank_account">Account Number</Label>
                          <Input
                            id="bank_account"
                            value={settingsData.bank_account}
                            onChange={(e) => setSettingsData({ ...settingsData, bank_account: e.target.value })}
                            placeholder="1234567890123"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank_iban">IBAN</Label>
                          <Input
                            id="bank_iban"
                            value={settingsData.bank_iban}
                            onChange={(e) => setSettingsData({ ...settingsData, bank_iban: e.target.value })}
                            placeholder="PK00HABB0001234567890123"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <Button type="submit" variant="hero" disabled={saveSettingsMutation.isPending}>
                    {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
