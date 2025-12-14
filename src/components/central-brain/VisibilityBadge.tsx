import React from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Globe } from "lucide-react";

type Visibility = "internal_only" | "client_ready" | "published";

interface VisibilityBadgeProps {
  visibility: Visibility;
  className?: string;
}

const visibilityConfig: Record<Visibility, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
  internal_only: {
    label: "Internal",
    icon: EyeOff,
    variant: "secondary",
  },
  client_ready: {
    label: "Client Ready",
    icon: Eye,
    variant: "outline",
  },
  published: {
    label: "Published",
    icon: Globe,
    variant: "default",
  },
};

export const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({
  visibility,
  className,
}) => {
  const config = visibilityConfig[visibility] || visibilityConfig.internal_only;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
