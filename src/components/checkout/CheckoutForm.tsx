import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CartItem } from "@/contexts/CartContext";
import { User, Mail, Phone, MapPin, FileText, ArrowLeft, CheckCircle, Copy, CreditCard, Smartphone, Building2, ShieldCheck, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface CheckoutFormProps {
  items: CartItem[];
  total: number;
  onSuccess: () => void;
  onBack: () => void;
}

interface PaymentSettings {
  easypaisa_title: string;
  easypaisa_number: string;
  jazzcash_title: string;
  jazzcash_number: string;
  bank_name: string;
  bank_title: string;
  bank_account: string;
  bank_iban: string;
  whatsapp_number: string;
}

const PAYMENT_METHODS = {
  cod: { label: "Cash on Delivery", icon: CreditCard },
  easypaisa: { label: "Easypaisa", icon: Smartphone },
  jazzcash: { label: "JazzCash", icon: Smartphone },
  bank: { label: "Bank Transfer", icon: Building2 },
};

const CheckoutForm = ({ items, total, onSuccess, onBack }: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [trackingIds, setTrackingIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // OTP verification states
  const [otpStep, setOtpStep] = useState<'form' | 'verify'>('form');
  const [otpCode, setOtpCode] = useState("");
  const [displayedOtp, setDisplayedOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Fetch payment settings from database
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['easypaisa_title', 'easypaisa_number', 'jazzcash_title', 'jazzcash_number', 'bank_name', 'bank_title', 'bank_account', 'bank_iban', 'whatsapp_number']);
      
      if (error) throw error;
      
      const settings: PaymentSettings = {
        easypaisa_title: "",
        easypaisa_number: "",
        jazzcash_title: "",
        jazzcash_number: "",
        bank_name: "",
        bank_title: "",
        bank_account: "",
        bank_iban: "",
        whatsapp_number: "",
      };
      
      data?.forEach((item: { key: string; value: string | null }) => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value || "";
        }
      });
      
      return settings;
    }
  });

  const getPaymentDetails = (method: string) => {
    if (!paymentSettings) return null;
    
    switch (method) {
      case 'easypaisa':
        return paymentSettings.easypaisa_title && paymentSettings.easypaisa_number ? {
          accountTitle: paymentSettings.easypaisa_title,
          accountNumber: paymentSettings.easypaisa_number,
        } : null;
      case 'jazzcash':
        return paymentSettings.jazzcash_title && paymentSettings.jazzcash_number ? {
          accountTitle: paymentSettings.jazzcash_title,
          accountNumber: paymentSettings.jazzcash_number,
        } : null;
      case 'bank':
        return paymentSettings.bank_name && paymentSettings.bank_account ? {
          bankName: paymentSettings.bank_name,
          accountTitle: paymentSettings.bank_title,
          accountNumber: paymentSettings.bank_account,
          iban: paymentSettings.bank_iban,
        } : null;
      default:
        return null;
    }
  };

  const handleCopyTrackingId = (trackingId: string) => {
    navigator.clipboard.writeText(trackingId);
    toast.success("Tracking ID copied to clipboard!");
  };

  const handleCopyAccountNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast.success("Account number copied!");
  };

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSendOtp = async () => {
    if (!formData.email || !formData.phone || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Please wait ${cooldownSeconds} seconds before requesting a new code`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email: formData.email, phone: formData.phone, action: 'send' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Verification code sent!");
        setDisplayedOtp(data.otpCode || "");
        setOtpStep('verify');
        setCooldownSeconds(60); // Start 60 second cooldown
      } else if (data?.cooldownRemaining) {
        setCooldownSeconds(data.cooldownRemaining);
        toast.error(data.message);
      } else {
        throw new Error(data?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('OTP send error:', error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      // First verify OTP
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('send-otp', {
        body: { email: formData.email, phone: formData.phone, action: 'verify', otp: otpCode }
      });

      if (verifyError) throw verifyError;

      if (!verifyData?.success) {
        toast.error(verifyData?.message || "Invalid verification code");
        return;
      }

      toast.success("Verified! Placing your order...");
      
      // Create order server-side (after OTP verification)
      const { data: orderData, error: orderError } = await supabase.functions.invoke('send-otp', {
        body: { 
          email: formData.email, 
          action: 'create-order',
          orderData: {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes,
            paymentMethod: paymentMethod,
          },
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            quantity: item.quantity,
          }))
        }
      });

      if (orderError) throw orderError;

      if (!orderData?.success) {
        throw new Error(orderData?.message || 'Failed to create order');
      }

      const ids = orderData.trackingIds || [];
      setTrackingIds(ids);
      setOrderSuccess(true);
      toast.success("Order placed successfully!");

      // Send order confirmation email
      try {
        await supabase.functions.invoke('send-otp', {
          body: { 
            email: formData.email, 
            action: 'send-confirmation',
            orderItems: items,
            trackingIds: ids,
            paymentMethod: PAYMENT_METHODS[paymentMethod as keyof typeof PAYMENT_METHODS].label,
            customerName: formData.name,
            customerAddress: formData.address
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Start OTP verification flow
    await handleSendOtp();
  };

  const handleWhatsAppOrder = () => {
    const whatsappNumber = paymentSettings?.whatsapp_number || "923001234567";
    const itemsList = items.map(item => `- ${item.name} (Qty: ${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString()}`).join('\n');
    const message = encodeURIComponent(
      `🛒 *New Order Request*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${formData.name || 'Not provided'}\n` +
      `Phone: ${formData.phone || 'Not provided'}\n` +
      `Email: ${formData.email || 'Not provided'}\n` +
      `Address: ${formData.address || 'Not provided'}\n\n` +
      `*Order Items:*\n${itemsList}\n\n` +
      `*Total:* Rs. ${total.toLocaleString()}\n` +
      `*Payment Method:* ${PAYMENT_METHODS[paymentMethod as keyof typeof PAYMENT_METHODS].label}`
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const selectedPayment = PAYMENT_METHODS[paymentMethod as keyof typeof PAYMENT_METHODS];
  const currentPaymentDetails = getPaymentDetails(paymentMethod);

  // Show success screen with tracking IDs
  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Order Placed Successfully!</h2>
        <p className="text-muted-foreground">
          Thank you for your order. {paymentMethod !== "cod" && "Please complete your payment using the details provided below."}
        </p>
        
        {/* Show payment details if not COD */}
        {paymentMethod !== "cod" && currentPaymentDetails && (
          <Card className="text-left">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <selectedPayment.icon className="h-5 w-5 text-primary" />
                Payment Details - {selectedPayment.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethod === "bank" && (
                <>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">Bank Name:</span>
                    <span className="font-medium">{(currentPaymentDetails as any).bankName}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">Account Title:</span>
                    <span className="font-medium">{(currentPaymentDetails as any).accountTitle}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{(currentPaymentDetails as any).accountNumber}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyAccountNumber((currentPaymentDetails as any).accountNumber)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {(currentPaymentDetails as any).iban && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground">IBAN:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-xs">{(currentPaymentDetails as any).iban}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyAccountNumber((currentPaymentDetails as any).iban)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {(paymentMethod === "easypaisa" || paymentMethod === "jazzcash") && (
                <>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">Account Title:</span>
                    <span className="font-medium">{(currentPaymentDetails as any).accountTitle}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{(currentPaymentDetails as any).accountNumber}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyAccountNumber((currentPaymentDetails as any).accountNumber)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              <p className="text-sm text-muted-foreground mt-4 p-3 bg-primary/5 rounded-lg">
                ⚠️ Please send payment to the above account and share the payment screenshot on WhatsApp or mention your tracking ID in the transaction reference.
              </p>
            </CardContent>
          </Card>
        )}

        {paymentMethod !== "cod" && !currentPaymentDetails && (
          <Card className="text-left">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Payment details not configured. Please contact support for payment information.
              </p>
            </CardContent>
          </Card>
        )}
        
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

  // OTP Verification Step
  if (otpStep === 'verify') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button
          onClick={() => setOtpStep('form')}
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Form
        </button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">Verify Your Order</CardTitle>
            <p className="text-muted-foreground mt-2">
              Enter the verification code below to confirm your order
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display OTP Code */}
            {displayedOtp && (
              <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                <p className="text-sm text-muted-foreground mb-2">Your Verification Code:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-3xl font-bold font-mono tracking-widest text-primary">{displayedOtp}</code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(displayedOtp);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Code also sent to: {formData.email}</p>
              </div>
            )}

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleVerifyAndSubmit}
              disabled={isVerifying || otpCode.length !== 6}
            >
              {isVerifying ? "Verifying..." : "Verify & Place Order"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || cooldownSeconds > 0}
                className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingOtp 
                  ? "Sending..." 
                  : cooldownSeconds > 0 
                    ? `Resend in ${cooldownSeconds}s` 
                    : "Resend Code"}
              </button>
            </div>
          </CardContent>
        </Card>
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} id="checkout-form" className="space-y-4">
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
              </form>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <div key={key} className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex items-center gap-3 cursor-pointer flex-1">
                      <method.icon className={`h-5 w-5 ${paymentMethod === key ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{method.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Show account details when non-COD is selected */}
              {paymentMethod !== "cod" && currentPaymentDetails && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 mt-4">
                  <p className="text-sm font-medium text-foreground">Account Details:</p>
                  {paymentMethod === "bank" && (
                    <>
                      <p className="text-sm"><span className="text-muted-foreground">Bank:</span> {(currentPaymentDetails as any).bankName}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Title:</span> {(currentPaymentDetails as any).accountTitle}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Account:</span> {(currentPaymentDetails as any).accountNumber}</p>
                      {(currentPaymentDetails as any).iban && (
                        <p className="text-sm"><span className="text-muted-foreground">IBAN:</span> {(currentPaymentDetails as any).iban}</p>
                      )}
                    </>
                  )}
                  {(paymentMethod === "easypaisa" || paymentMethod === "jazzcash") && (
                    <>
                      <p className="text-sm"><span className="text-muted-foreground">Title:</span> {(currentPaymentDetails as any).accountTitle}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Number:</span> {(currentPaymentDetails as any).accountNumber}</p>
                    </>
                  )}
                </div>
              )}

              {paymentMethod !== "cod" && !currentPaymentDetails && (
                <div className="p-4 bg-destructive/10 rounded-lg mt-4">
                  <p className="text-sm text-destructive">
                    Payment details not configured. Please contact admin or choose Cash on Delivery.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="h-fit">
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
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Method</span>
                <span>{selectedPayment.label}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                form="checkout-form"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  "Sending Verification..."
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Verify & Place Order
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleWhatsAppOrder}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Order via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutForm;
