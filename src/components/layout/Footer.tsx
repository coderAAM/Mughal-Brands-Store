import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Instagram, Twitter, Youtube, MessageCircle, Mail, Phone, MapPin } from "lucide-react";

type SiteSettings = Record<string, string>;

const Footer = () => {
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      
      const settingsObj: SiteSettings = {};
      data?.forEach((item: { key: string; value: string | null }) => {
        settingsObj[item.key] = item.value || "";
      });
      return settingsObj;
    }
  });

  const hasSocialLinks = settings?.facebook_url || settings?.instagram_url || settings?.twitter_url || settings?.youtube_url || settings?.whatsapp_number;

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">
              MUGHAL BRAND'S
            </h3>
            <p className="text-secondary-foreground/80 mb-6">
              Premium timepieces crafted with precision and elegance. Experience luxury redefined.
            </p>
            {hasSocialLinks && (
              <div className="flex gap-4">
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {settings?.twitter_url && (
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {settings?.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
                {settings?.whatsapp_number && (
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  All Watches
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Warranty
                </a>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {settings?.address && (
                <li className="flex items-center gap-3 text-secondary-foreground/80">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings?.phone && (
                <li className="flex items-center gap-3 text-secondary-foreground/80">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-primary transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3 text-secondary-foreground/80">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-primary transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-12 pt-8 text-center text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} MUGHAL BRAND'S. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;