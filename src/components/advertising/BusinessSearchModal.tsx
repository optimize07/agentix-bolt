import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Phone, Mail, ExternalLink } from "lucide-react";

// Add global styles for Google Maps autocomplete to appear above modal
const AUTOCOMPLETE_STYLES = `
  .pac-container {
    z-index: 10000 !important;
    background-color: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
  }
  .pac-item {
    padding: 0.5rem 1rem !important;
    color: hsl(var(--foreground)) !important;
    border-top: 1px solid hsl(var(--border)) !important;
    cursor: pointer !important;
  }
  .pac-item:hover {
    background-color: hsl(var(--accent)) !important;
  }
  .pac-item-query {
    color: hsl(var(--foreground)) !important;
  }
  .pac-matched {
    font-weight: 600 !important;
  }
`;

interface BusinessSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  onBusinessSelected: (business: any) => void;
}

export const BusinessSearchModal = ({ isOpen, onClose, companyName, onBusinessSelected }: BusinessSearchModalProps) => {
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !inputRef.current) return;

    // Add styles for autocomplete dropdown
    const styleId = 'google-maps-autocomplete-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = AUTOCOMPLETE_STYLES;
      document.head.appendChild(styleSheet);
    }

    const loadGoogleMaps = () => {
      if ((window as any).google?.maps?.places) {
        console.log('Google Maps already loaded, initializing autocomplete');
        setTimeout(() => initAutocomplete(), 100); // Small delay to ensure DOM is ready
        return;
      }

      const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not found');
        return;
      }

      console.log('Loading Google Maps API...');
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          console.log('Existing Google Maps script loaded');
          setTimeout(() => initAutocomplete(), 100);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        setTimeout(() => initAutocomplete(), 100);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup autocomplete listener
      if (autocompleteRef.current && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isOpen]);

  const initAutocomplete = () => {
    if (!inputRef.current || !(window as any).google?.maps?.places) return;

    try {
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['formatted_address']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          setLocation(place.formatted_address);
        }
      });

      console.log('Google Maps Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  };

  const handleSearch = async () => {
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a location",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Simple geocoding - just pass the location string
      const { data, error } = await supabase.functions.invoke('search-business', {
        body: {
          query: companyName,
          location: location
        }
      });

      if (error) throw error;

      if (data.businesses && data.businesses.length > 0) {
        setBusinesses(data.businesses);
      } else {
        toast({
          title: "No businesses found",
          description: "We couldn't find any businesses matching that name and location. Please try different search terms.",
        });
        // Close modal after short delay
        setTimeout(() => {
          onClose();
          setLocation("");
        }, 2000);
      }
    } catch (error) {
      console.error('Error searching business:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for business. Please try again.",
        variant: "destructive"
      });
      // Close modal on error too
      setTimeout(() => {
        onClose();
        setLocation("");
      }, 2000);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (business: any) => {
    onBusinessSelected(business);
    onClose();
    setBusinesses([]);
    setLocation("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search for "{companyName}"</DialogTitle>
        </DialogHeader>
        
        {businesses.length === 0 ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter your business location
              </label>
              <Input
                ref={inputRef}
                placeholder="e.g., San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !location}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {businesses.map((business, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSelect(business)}
              >
                <h3 className="font-semibold text-lg mb-2">{business.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {business.full_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{business.full_address}</span>
                    </div>
                  )}
                  {business.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{business.phone_number}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>{business.email}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{business.website}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
