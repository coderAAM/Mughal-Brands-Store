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
import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import StaggeredList from "@/components/animations/StaggeredList";

// Lazy load 3D component for performance
const LuxuryWatch3D = lazy(() => import("@/components/3d/LuxuryWatch3D"));

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / (maxScroll * 0.5), 1);
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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

      {/* 3D Watch Section */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fade-right" className="order-2 lg:order-1">
              <span className="text-primary font-medium tracking-widest uppercase text-sm">
                Craftsmanship
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-6">
                Precision <span className="text-primary">Engineering</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Each MUGHAL timepiece is a testament to our dedication to perfection. 
                From the intricate dial work to the premium materials, every detail 
                is meticulously crafted to create watches that stand the test of time.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Swiss-quality movement mechanisms
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Sapphire crystal glass protection
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Premium leather & stainless steel
                </li>
              </ul>
            </AnimatedSection>
            
            <div className="order-1 lg:order-2 h-[400px] md:h-[500px] lg:h-[600px]">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading 3D Model...</p>
                  </div>
                </div>
              }>
                <LuxuryWatch3D scrollProgress={scrollProgress} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20" aria-labelledby="featured-heading">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Our Collection
            </span>
            <h2 id="featured-heading" className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2">
              Featured Timepieces
            </h2>
          </AnimatedSection>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={150}>
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
            </StaggeredList>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Login as admin to add products.</p>
            </div>
          )}
          
          <AnimatedSection animation="fade-up" delay={400} className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection animation="scale-up">
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
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
