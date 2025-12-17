import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import CheckoutForm from "@/components/checkout/CheckoutForm";

const Cart = () => {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckoutSuccess = () => {
    clearCart();
    setShowCheckout(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-muted-foreground mb-8">
                Discover our collection and add your favorite timepieces
              </p>
              <Link to="/products">
                <Button variant="hero" size="lg">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {showCheckout ? (
            <>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
                Checkout
              </h1>
              <CheckoutForm
                items={items}
                total={total}
                onSuccess={handleCheckoutSuccess}
                onBack={() => setShowCheckout(false)}
              />
            </>
          ) : (
            <>
              <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>

              <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
                Shopping Cart
              </h1>

              <div className="grid lg:grid-cols-3 gap-12">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-6 p-6 bg-card rounded-lg border border-border"
                    >
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-card-foreground mb-1">
                          {item.name}
                        </h3>
                        <p className="text-primary font-bold">
                          Rs. {item.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                    <h2 className="font-serif text-xl font-bold text-card-foreground mb-6">
                      Order Summary
                    </h2>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>Rs. {total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span>{total >= 10000 ? "Free" : "Rs. 500"}</span>
                      </div>
                      <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          Rs. {(total >= 10000 ? total : total + 500).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="hero" 
                      size="lg" 
                      className="w-full"
                      onClick={() => setShowCheckout(true)}
                    >
                      Proceed to Checkout
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Free shipping on orders over Rs. 10,000
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
