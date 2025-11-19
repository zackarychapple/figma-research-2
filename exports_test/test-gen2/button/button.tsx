```typescript
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, FileText, ExternalLink } from "lucide-react"

interface ButtonComponentProps {
  className?: string
}

export default function ButtonComponent({ className }: ButtonComponentProps) {
  return (
    <div className={className}>
      <div className="w-full">
        <div className="w-full">
          <div className="w-full border-b">
            <div className="container mx-auto px-4 py-8">
              <div className="mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span className="font-semibold text-foreground">Typography</span>
                  <span>/</span>
                  <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <FileText className="w-3 h-3" />
                    <span>Developer</span>
                  </a>
                  <span>/</span>
                  <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    <span>Designer</span>
                  </a>
                  <span>/</span>
                  <span>Components</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">
                  Styles for typography elements such as headings, paragraphs, lists that are used within the rich text.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="container mx-auto px-4 py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Playground</h2>
              </div>
              <div className="w-full">
                <div className="space-y-8">
                  <div className="relative rounded-lg border bg-background p-8">
                    <div className="grid grid-cols-6 gap-4">
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="link">Button</Button>
                      <Button variant="link">Button</Button>
                      <Button variant="link">Button</Button>
                      <Button variant="destructive">Button</Button>
                      <Button variant="destructive">Button</Button>
                      <Button variant="destructive">Button</Button>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Sun className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="relative rounded-lg border bg-slate-950 p-8">
                    <div className="grid grid-cols-6 gap-4">
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="default">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="secondary">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="outline">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="ghost">Button</Button>
                      <Button variant="link">Button</Button>
                      <Button variant="link">Button</Button>
                      <Button variant="link">Button</Button>
                      <Button variant="destructive">Button</Button>
                      <Button variant="destructive">Button</Button>
                      <Button variant="destructive">Button</Button>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Moon className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t mt-12">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>© 2025 shadcndesign.com</span>
                <div className="flex items-center gap-6">
                  <a href="#" className="hover:text-foreground transition-colors">Docs</a>
                  <a href="#" className="hover:text-foreground transition-colors">Licensing</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-px bg-border" />
    </div>
  )
}
```