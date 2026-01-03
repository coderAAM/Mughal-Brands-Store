import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import heroImage from "@/assets/hero-watch.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";
import { useEffect } from "react";
const Index = () => {
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(4);
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Update page title for SEO
  useEffect(() => {
    document.title = "MUGHAL BRAND'S - Premium Luxury Watches in Pakistan";
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Premium Luxury Watch - MUGHAL BRAND'S Collection" 
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <span className="inline-block text-primary font-medium tracking-widest uppercase text-sm mb-4 animate-fade-in">
              Premium Collection
            </span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Timeless <span className="text-primary">Elegance</span> Redefined
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Discover our exclusive collection of luxury timepieces. Each watch is a masterpiece of precision engineering and sophisticated design.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/products">
                <Button variant="hero" size="xl">
                  Shop Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="heroOutline" size="xl">
                  Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>


      {/* Featured Products */}
      <section className="py-20" aria-labelledby="featured-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Our Collection
            </span>
            <h2 id="featured-heading" className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2">
              Featured Timepieces
            </h2>
          </div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image_url={product.image_url}
                  category={product.category}
                  warranty_text={product.warranty_text}
                  shipping_text={product.shipping_text}
                  authenticity_text={product.authenticity_text}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Login as admin to add products.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center">
          <h2 id="cta-heading" className="font-serif text-4xl md:text-5xl font-bold text-secondary-foreground mb-6">
            Experience Luxury
          </h2>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
            Join thousands of satisfied customers who have chosen MUGHAL BRAND'S for their premium timepiece needs.
          </p>
          <Link to="/products">
            <Button variant="gold" size="xl">
              Explore Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
