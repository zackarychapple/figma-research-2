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
        <div className="container mx-auto">
          <div className="border-b">
            <div className="py-8">
              <div className="mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Typography</span>
                  <span>/</span>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <FileText className="w-4 h-4" />
                    <span>Developer</span>
                  </button>
                  <span>/</span>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    <span>Designer</span>
                  </button>
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

          <div className="py-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Playground</h2>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 divide-x">
                <div className="p-8 bg-background relative">
                  <div className="grid grid-cols-4 gap-4">
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="link" size="default">Button</Button>
                    <Button variant="link" size="default">Button</Button>
                    <Button variant="link" size="default">Button</Button>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="p-8 bg-slate-950 relative">
                  <div className="grid grid-cols-4 gap-4">
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="default" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="secondary" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="outline" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="ghost" size="default">Button</Button>
                    <Button variant="link" size="default">Button</Button>
                    <Button variant="link" size="default">Button</Button>
                    <Button variant="link" size="default">Button</Button>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Moon className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t py-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>© 2025 shadcndesign.com</span>
              <div className="flex items-center gap-6">
                <button className="hover:text-foreground transition-colors">Docs</button>
                <button className="hover:text-foreground transition-colors">Licensing</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t" />
    </div>
  )
}
```