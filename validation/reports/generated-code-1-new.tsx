```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export interface H1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

const H1 = React.forwardRef<HTMLHeadingElement, H1Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(
          "text-4xl font-bold tracking-tight text-black",
          className
        )}
        {...props}
      >
        {children}
      </h1>
    );
  }
);

H1.displayName = "H1";

export default H1;
```