import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CartItem } from "@/contexts/CartContext";
import { User, Mail, Phone, MapPin, FileText, ArrowLeft, CheckCircle, Copy } from "lucide-react";

interface CheckoutFormProps {
  items: CartItem[];
  total: number;
  onSuccess: () => void;
  onBack: () => void;
}

const CheckoutForm = ({ items, total, onSuccess, onBack }: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [trackingIds, setTrackingIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleCopyTrackingId = (trackingId: string) => {
    navigator.clipboard.writeText(trackingId);
    toast.success("Tracking ID copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create an order for each item in the cart
      const orders = items.map((item) => ({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: formData.address || null,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        product_image_url: item.image_url,
        quantity: item.quantity,
        total_amount: item.price * item.quantity,
        notes: formData.notes || null,
        status: "pending",
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert(orders as any)
        .select("tracking_id");

      if (error) throw error;

      // Get tracking IDs from the response
      const ids = data?.map((order: any) => order.tracking_id).filter(Boolean) || [];
      setTrackingIds(ids);
      setOrderSuccess(true);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success screen with tracking IDs
  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Order Placed Successfully!</h2>
        <p className="text-muted-foreground">
          Thank you for your order. We will contact you shortly to confirm your order.
        </p>
        
        {trackingIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Tracking ID{trackingIds.length > 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trackingIds.map((trackingId, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg">
                  <code className="font-mono text-sm text-primary font-bold">{trackingId}</code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCopyTrackingId(trackingId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-sm text-muted-foreground mt-4">
                Save this tracking ID to track your order status on our website.
              </p>
            </CardContent>
          </Card>
        )}

        <Button variant="hero" onClick={onSuccess}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cart
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customer Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Delivery Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full delivery address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Order Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions for your order..."
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Placing Order..."
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Place Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border border-border rounded-lg"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                  <p className="text-primary font-bold">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{total >= 10000 ? "Free" : "Rs. 500"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">
                  Rs. {(total >= 10000 ? total : total + 500).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutForm;