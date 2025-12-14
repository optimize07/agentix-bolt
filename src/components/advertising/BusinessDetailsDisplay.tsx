import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BusinessDetailsDisplayProps {
  business: any;
}

export const BusinessDetailsDisplay = ({ business }: BusinessDetailsDisplayProps) => {
  if (!business) return null;

  const socialIcons: Record<string, any> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-muted rounded-md flex-wrap">
      <TooltipProvider>
        {business.phone_number && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">{business.phone_number}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{business.phone_number}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {business.email && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1 text-sm">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">{business.email}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{business.email}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {business.full_address && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{business.full_address}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {business.social_media && Object.entries(business.social_media).map(([platform, url]) => {
          const Icon = socialIcons[platform.toLowerCase()];
          if (!Icon || !url) return null;

          return (
            <Tooltip key={platform}>
              <TooltipTrigger asChild>
                <a 
                  href={url as string} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{platform}: {url as string}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};
