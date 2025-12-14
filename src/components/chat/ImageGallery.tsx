import { Download, ZoomIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  className?: string;
  onPushToCreative?: (imageUrl: string) => void;
  showPushButton?: boolean;
}

export const ImageGallery = ({ images, className = "", onPushToCreative, showPushButton = false }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      // Handle base64 images
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image-${Date.now()}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle URL images
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `image-${Date.now()}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className={`grid gap-3 ${
        images.length === 1 ? 'grid-cols-1' : 
        images.length === 2 ? 'grid-cols-2' : 
        'grid-cols-2 md:grid-cols-3'
      } ${className}`}>
        {images.map((imgUrl, idx) => (
          <div 
            key={idx} 
            className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 hover:border-primary/50 transition-all"
          >
            <img 
              src={imgUrl}
              alt={`Generated image ${idx + 1}`}
              className="w-full h-full object-cover aspect-video cursor-pointer"
              onClick={() => setSelectedImage(imgUrl)}
            />
            
            {/* Overlay with buttons */}
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(imgUrl);
                }}
                className="h-8 gap-1"
              >
                <ZoomIn className="w-3 h-3" />
                View
              </Button>
              {showPushButton && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPushToCreative?.(imgUrl);
                  }}
                  className="h-8 gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Push
                </Button>
              )}
            </div>

            {/* Image number badge */}
            <div className="absolute top-2 left-2 bg-background/90 text-foreground text-xs px-2 py-0.5 rounded-full border border-border">
              {idx + 1}/{images.length}
            </div>
          </div>
        ))}
      </div>

      {/* Full-size image viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-2">
          <div className="relative">
            <img 
              src={selectedImage || ''}
              alt="Full size preview"
              className="w-full h-auto rounded"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => selectedImage && handleDownload(selectedImage, 0)}
              className="absolute top-2 right-2 gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

