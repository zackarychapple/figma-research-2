```typescript
import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children?: React.ReactNode
  className?: string
  breakpoint?: "desktop" | "mobile"
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ children, className, breakpoint = "desktop", ...props }, ref) => {
    const isDesktop = breakpoint === "desktop"
    
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white",
          isDesktop ? "w-[1280px] h-[364px]" : "w-[360px] h-[400px]",
          className
        )}
        {...props}
      >
        {/* Navbar */}
        <div
          className={cn(
            "bg-[rgb(10,10,10)] border-b border-white/10",
            isDesktop ? "h-16" : "h-14",
            "shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          )}
        />

        {/* Page Header */}
        <div
          className={cn(
            "bg-[rgb(10,10,10)] border-b border-white/10",
            isDesktop ? "h-[184px]" : "h-[228px]"
          )}
        >
          <div className={cn(isDesktop ? "px-6 py-2" : "px-4 py-2")}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-sm text-neutral-100 hover:bg-white/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mr-2"
                >
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Contact support
              </Button>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div
          className={cn(
            "bg-white",
            isDesktop ? "h-[116px] px-6" : "h-[116px] px-4",
            "py-6"
          )}
        >
          <div
            className={cn(
              "border border-purple-500/50 bg-purple-500/10 rounded",
              isDesktop ? "w-[1232px]" : "w-[328px]",
              "h-[68px]"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)

AppShell.displayName = "AppShell"

export { AppShell }
```