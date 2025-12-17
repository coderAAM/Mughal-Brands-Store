import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, ArrowLeft, Shield, Truck, Award } from "lucide-react";
import type { Product } from "@/types/product";

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 animate-pulse">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/products">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-card">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {product.category && (
                <span className="text-primary font-medium tracking-widest uppercase text-sm mb-2">
                  {product.category}
                </span>
              )}
              
              <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>
              
              <p className="text-3xl font-bold text-primary mb-6">
                Rs. {product.price.toLocaleString()}
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {product.description || "Experience the perfect blend of precision engineering and timeless design. This exquisite timepiece features premium materials and meticulous craftsmanship."}
              </p>

              <div className="flex gap-4 mb-8">
                <Button variant="hero" size="xl" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-8">
                {product.warranty_text && (
                  <div className="flex flex-col items-center text-center">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">{product.warranty_text}</span>
                  </div>
                )}
                {product.shipping_text && (
                  <div className="flex flex-col items-center text-center">
                    <Truck className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">{product.shipping_text}</span>
                  </div>
                )}
                {product.authenticity_text && (
                  <div className="flex flex-col items-center text-center">
                    <Award className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">{product.authenticity_text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
