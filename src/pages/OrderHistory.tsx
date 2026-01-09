import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Package, Calendar, CreditCard, Truck, Mail, Loader2 } from "lucide-react";
import type { Order } from "@/types/product";

const OrderHistory = () => {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          email,
          action: 'get-order-history'
        }
      });

      if (error) throw error;
      
      if (data.orders) {
        setOrders(data.orders);
        if (data.orders.length === 0) {
          toast.info("No orders found for this email");
        } else {
          toast.success(`Found ${data.orders.length} order(s)`);
        }
      }
    } catch (error: any) {
      toast.error("Failed to fetch orders. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Your Orders
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
              Order History
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Enter your email to view all your past orders and track their status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 border-border/50 overflow-hidden animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="bg-secondary/5">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Find Your Orders
              </CardTitle>
              <CardDescription>
                Enter the email address you used when placing your orders
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" disabled={isLoading} className="h-12">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Orders
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Orders List */}
          {hasSearched && (
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {orders.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Orders Found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find any orders associated with this email address.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order, index) => (
                  <Card 
                    key={order.id} 
                    className="border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Product Image */}
                        <div className="w-full md:w-48 h-48 md:h-auto bg-muted">
                          <img
                            src={order.product_image_url || "/placeholder.svg"}
                            alt={order.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Order Details */}
                        <div className="flex-1 p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="font-serif text-xl font-semibold text-foreground mb-1">
                                {order.product_name}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={getStatusColor(order.status)}>
                                <Truck className="h-3 w-3 mr-1" />
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                              <Badge className={getPaymentStatusColor(order.payment_status)}>
                                <CreditCard className="h-3 w-3 mr-1" />
                                {(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Quantity</p>
                              <p className="font-semibold text-foreground">{order.quantity}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-semibold text-primary">Rs. {order.total_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Payment</p>
                              <p className="font-semibold text-foreground">{order.payment_method || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tracking ID</p>
                              <p className="font-mono text-xs font-semibold text-foreground break-all">
                                {order.tracking_id || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderHistory;