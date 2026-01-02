import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/types/product";

const TrackOrder = () => {
  const [trackingId, setTrackingId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingId.trim()) {
      toast.error("Please enter a tracking ID");
      return;
    }

    setIsLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_id', trackingId.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder(data as Order);
      } else {
        setOrder(null);
        toast.error("No order found with this tracking ID");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search order");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'confirmed':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Package className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'shipped':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'delivered':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Track Your Order
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enter your tracking ID to see the current status of your order
            </p>
          </div>

          {/* Search Form */}
          <Card className="max-w-xl mx-auto mb-12">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Tracking ID (e.g., MG-20251219-abc12345)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button type="submit" variant="hero" disabled={isLoading} className="h-12 px-6">
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? "Searching..." : "Track"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Result */}
          {searched && order && (
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Order Details</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tracking ID: <span className="font-mono bg-muted px-2 py-1 rounded">{order.tracking_id}</span>
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Progress Steps */}
                {order.status !== 'cancelled' && (
                  <div className="relative">
                    <div className="flex justify-between">
                      {statusSteps.map((step, index) => (
                        <div key={step} className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            index <= currentStepIndex 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'bg-background border-border text-muted-foreground'
                          }`}>
                            {index <= currentStepIndex ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs mt-2 capitalize ${
                            index <= currentStepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-0">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Product Info */}
                <div className="flex gap-6 p-4 bg-muted/50 rounded-lg">
                  <div className="w-24 h-24 rounded-lg bg-background overflow-hidden flex-shrink-0">
                    <img
                      src={order.product_image_url || "/placeholder.svg"}
                      alt={order.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{order.product_name}</h3>
                    <p className="text-primary font-bold text-xl">Rs. {order.product_price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Information
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Method</p>
                        <p className="font-medium capitalize">{order.payment_method || 'Cash on Delivery'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Status</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize ${
                          order.payment_status === 'paid' ? 'bg-green-500/10 text-green-600' :
                          order.payment_status === 'failed' ? 'bg-red-500/10 text-red-600' :
                          'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {order.payment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Customer Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {order.customer_name}</p>
                      <p><span className="text-muted-foreground">Email:</span> {order.customer_email}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {order.customer_phone}</p>
                      {order.customer_address && (
                        <p><span className="text-muted-foreground">Address:</span> {order.customer_address}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Order Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                      <p><span className="text-muted-foreground">Last Updated:</span> {new Date(order.updated_at).toLocaleDateString()}</p>
                      <p className="text-lg font-bold">
                        <span className="text-muted-foreground font-normal">Total:</span>{" "}
                        <span className="text-primary">Rs. {order.total_amount.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Order Found */}
          {searched && !order && !isLoading && (
            <Card className="max-w-xl mx-auto">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find an order with that tracking ID. Please check and try again.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
