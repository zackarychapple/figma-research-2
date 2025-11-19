```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, ArrowRight, Loader2, Sun, Moon, FileText } from 'lucide-react';

interface ButtonShowcaseProps {
  className?: string;
}

export const ButtonShowcase: React.FC<ButtonShowcaseProps> = ({ className }) => {
  return (
    <div className={className}>
      <div className="w-full">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Typography</h1>
                  <a href="#" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <FileText className="w-4 h-4" />
                    Developer
                  </a>
                  <a href="#" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <FileText className="w-4 h-4" />
                    Designer
                  </a>
                  <span className="text-sm text-muted-foreground">Components</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Styles for typography elements such as headings, paragraphs, lists that are used within the rich text.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Playground</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-8">
                <div className="relative rounded-lg border bg-background p-8">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                      <Button size="sm">Button</Button>
                      <Button variant="outline" size="sm">Outline</Button>
                      <Button variant="ghost" size="sm">Ghost</Button>
                      <Button variant="destructive" size="sm">Desctructive</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                      <Button variant="link" size="sm">Link</Button>
                      <Button size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button size="sm">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button size="sm">Small</Button>
                      <Button variant="outline" size="sm">Outline</Button>
                      <Button variant="ghost" size="sm">Ghost</Button>
                      <Button variant="destructive" size="sm">Desctructive</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                      <Button variant="link" size="sm">Link</Button>
                      <Button size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button size="sm">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button>Large</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Desctructive</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="link">Link</Button>
                      <Button>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button>
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Sun className="w-4 h-4" />
                  </div>
                </div>

                <div className="relative rounded-lg border bg-slate-950 p-8">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                      <Button size="sm">Button</Button>
                      <Button variant="outline" size="sm">Outline</Button>
                      <Button variant="ghost" size="sm">Ghost</Button>
                      <Button variant="destructive" size="sm">Desctructive</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                      <Button variant="link" size="sm">Link</Button>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button variant="outline" size="sm">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button size="sm">Small</Button>
                      <Button variant="outline" size="sm">Outline</Button>
                      <Button variant="ghost" size="sm">Ghost</Button>
                      <Button variant="destructive" size="sm">Desctructive</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                      <Button variant="link" size="sm">Link</Button>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button variant="outline" size="sm">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button>Large</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Desctructive</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="link">Link</Button>
                      <Button variant="outline">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button variant="outline">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Moon className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">© 2025 shadcndesign.com</p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Docs</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Licensing</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t" />
    </div>
  );
};
```