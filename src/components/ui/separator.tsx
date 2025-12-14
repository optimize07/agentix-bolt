import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, style, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn("shrink-0", orientation === "horizontal" ? "w-full" : "h-full", className)}
    style={{
      backgroundColor: 'var(--divider-color)',
      height: orientation === "horizontal" ? 'var(--divider-width)' : undefined,
      width: orientation === "vertical" ? 'var(--divider-width)' : undefined,
      borderStyle: 'var(--divider-style)',
      ...style,
    }}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
