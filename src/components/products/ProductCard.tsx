import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Shield, Truck, CheckCircle, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category?: string;
  warranty_text?: string | null;
  shipping_text?: string | null;
  authenticity_text?: string | null;
}

const ProductCard = ({ 
  id, 
  name, 
  price, 
  image_url, 
  category,
  warranty_text,
  shipping_text,
  authenticity_text
}: ProductCardProps) => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Fetch WhatsApp number from settings
  const { data: whatsappNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle();
      return data?.value || "923001234567";
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id, name, price, image_url });
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id, name, price, image_url });
    navigate('/cart');
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const message = encodeURIComponent(
      `🛒 I want to order:\n\n` +
      `*${name}*\n` +
      `Price: Rs. ${price.toLocaleString()}\n\n` +
      `Please share details for checkout.`
    );
    window.open(`https://wa.me/${(whatsappNumber || "923001234567").replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl bg-card">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image_url || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Actions */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                variant="hero" 
                size="sm"
                onClick={handleOrderNow}
              >
                Order Now
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full bg-background/90 hover:bg-green-500 hover:text-white hover:border-green-500"
              onClick={handleWhatsAppOrder}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp Order
            </Button>
          </div>
          
          {category && (
            <span className="absolute top-4 left-4 bg-primary/90 text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
              {category}
            </span>
          )}
        </div>
        
        <CardContent className="p-6">
          <h3 className="font-serif text-lg font-semibold text-card-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xl font-bold text-primary mb-3">
            Rs. {price.toLocaleString()}
          </p>
          
          {/* Product Features */}
          <div className="flex flex-wrap gap-2">
            {warranty_text && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <CheckCircle className="h-3 w-3" />
                {warranty_text}
              </span>
            )}
            {shipping_text && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <Truck className="h-3 w-3" />
                {shipping_text}
              </span>
            )}
            {authenticity_text && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <Shield className="h-3 w-3" />
                {authenticity_text}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ProductCard;
