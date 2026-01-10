import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface ProductImageGalleryProps {
  productId: string;
  mainImageUrl?: string | null;
  productName: string;
}

const ProductImageGallery = ({ productId, mainImageUrl, productName }: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: additionalImages } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId
  });

  // Combine main image with additional images
  const allImages = [
    ...(mainImageUrl ? [{ id: 'main', image_url: mainImageUrl, is_primary: true, display_order: 0 }] : []),
    ...(additionalImages || [])
  ];

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleThumbnailClick = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (allImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg overflow-hidden bg-card">
        <img
          src="/placeholder.svg"
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-card group">
        <div
          className={cn(
            "absolute inset-0 transition-all duration-300",
            isAnimating ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}
        >
          <img
            src={allImages[currentIndex]?.image_url || "/placeholder.svg"}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200",
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <img
                src={image.image_url}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
