import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch site settings from database
  const { data: siteSettings } = useQuery({
    queryKey: ['contact-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['email', 'phone', 'address', 'whatsapp_number']);
      
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach((item: { key: string; value: string | null }) => {
        settings[item.key] = item.value || "";
      });
      return settings;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: { name?: string; email?: string; message?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as keyof typeof newErrors] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    
    try {
      const { error } = await (supabase as any).from('contact_messages').insert([{
        name: formData.name,
        email: formData.email,
        message: formData.message,
      }]);
      
      if (error) throw error;
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = siteSettings?.whatsapp_number || "";
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank');
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: siteSettings?.address ? [siteSettings.address] : ["Loading..."],
    },
    {
      icon: Phone,
      title: "Call Us",
      details: siteSettings?.phone ? [siteSettings.phone] : ["Loading..."],
      link: siteSettings?.phone ? `tel:${siteSettings.phone.replace(/\s/g, '')}` : undefined,
    },
    {
      icon: Mail,
      title: "Email Us",
      details: siteSettings?.email ? [siteSettings.email] : ["Loading..."],
      link: siteSettings?.email ? `mailto:${siteSettings.email}` : undefined,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      details: siteSettings?.whatsapp_number ? [siteSettings.whatsapp_number] : ["Loading..."],
      onClick: handleWhatsAppClick,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Get in Touch
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-secondary-foreground mt-4 mb-6">
              Contact Us
            </h1>
            <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                  Contact Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {contactInfo.map((info) => (
                    <div
                      key={info.title}
                      className={`p-6 bg-card rounded-lg border border-border ${info.onClick || info.link ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                      onClick={info.onClick}
                    >
                      <info.icon className="h-8 w-8 text-primary mb-4" />
                      <h3 className="font-semibold text-card-foreground mb-2">{info.title}</h3>
                      {info.details.map((detail, idx) => (
                        info.link ? (
                          <a 
                            key={idx} 
                            href={info.link} 
                            className="block text-muted-foreground text-sm hover:text-primary transition-colors"
                          >
                            {detail}
                          </a>
                        ) : (
                          <p key={idx} className="text-muted-foreground text-sm">
                            {detail}
                          </p>
                        )
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  
                  <Button type="submit" variant="hero" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
