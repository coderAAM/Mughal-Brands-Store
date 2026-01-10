import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, GripVertical, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductImage {
  id?: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  file?: File;
  isNew?: boolean;
}

interface MultiImageUploadProps {
  productId?: string;
  existingImages?: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

const MultiImageUpload = ({ productId, existingImages = [], onImagesChange }: MultiImageUploadProps) => {
  const [images, setImages] = useState<ProductImage[]>(existingImages);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ProductImage = {
          image_url: reader.result as string,
          is_primary: images.length === 0,
          display_order: images.length,
          file,
          isNew: true,
        };
        setImages((prev) => {
          const updated = [...prev, newImage];
          onImagesChange(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Reorder and ensure there's always a primary
      const reordered = updated.map((img, i) => ({
        ...img,
        display_order: i,
        is_primary: i === 0 && !updated.some((im) => im.is_primary),
      }));
      if (reordered.length > 0 && !reordered.some((img) => img.is_primary)) {
        reordered[0].is_primary = true;
      }
      onImagesChange(reordered);
      return reordered;
    });
  };

  const handleSetPrimary = (index: number) => {
    setImages((prev) => {
      const updated = prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      onImagesChange(updated);
      return updated;
    });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setImages((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      
      const reordered = updated.map((img, i) => ({
        ...img,
        display_order: i,
      }));
      onImagesChange(reordered);
      return reordered;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4" />
          Product Images ({images.length})
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Images
        </Button>
      </div>

      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors text-center"
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to upload images or drag & drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max 5MB per image
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id || `new-${index}`}
              className={cn(
                "relative group rounded-lg overflow-hidden border-2 aspect-square",
                image.is_primary ? "border-primary" : "border-border"
              )}
            >
              <img
                src={image.image_url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  {!image.is_primary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetPrimary(index)}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  Primary
                </div>
              )}

              {/* Order number */}
              <div className="absolute bottom-1 right-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        The primary image will be shown on product cards. Drag to reorder.
      </p>
    </div>
  );
};

export default MultiImageUpload;
