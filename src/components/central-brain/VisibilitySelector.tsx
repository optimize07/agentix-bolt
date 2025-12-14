import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Globe } from "lucide-react";

type Visibility = "internal_only" | "client_ready" | "published";

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  disabled?: boolean;
}

export const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="internal_only">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Internal Only
          </div>
        </SelectItem>
        <SelectItem value="client_ready">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Client Ready
          </div>
        </SelectItem>
        <SelectItem value="published">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Published
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
