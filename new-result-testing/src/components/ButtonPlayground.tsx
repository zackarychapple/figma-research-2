import { Button } from "@/components/ui/button";
import { Send, ArrowRight, LoaderCircle } from "lucide-react";

interface ButtonPlaygroundProps {
  className?: string;
}

export function ButtonPlayground({ className }: ButtonPlaygroundProps) {
  return (
    <div className="flex flex-col gap-4 items-center p-4 bg-white min-h-screen w-full">
      {/* Light Mode - Default Size */}
      <div className="flex flex-col gap-8 items-center p-4 bg-white">
        <Button size="default">Button</Button>
        <Button size="default" variant="outline">Outline</Button>
        <Button size="default" variant="ghost">Ghost</Button>
        <Button size="default" variant="destructive">Destructive</Button>
        <Button size="default" variant="secondary">Secondary</Button>
        <Button size="default" variant="link">Link</Button>
        <Button size="default" variant="outline"><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="default" variant="outline"><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
        <Button size="default" variant="outline" className="opacity-50"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait</Button>
      </div>

      {/* Light Mode - Small Size */}
      <div className="flex flex-col gap-8 items-center p-4 bg-white">
        <Button size="sm">Button</Button>
        <Button size="sm" variant="outline">Outline</Button>
        <Button size="sm" variant="ghost">Ghost</Button>
        <Button size="sm" variant="destructive">Destructive</Button>
        <Button size="sm" variant="secondary">Secondary</Button>
        <Button size="sm" variant="link">Link</Button>
        <Button size="sm" variant="outline"><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="sm" variant="outline"><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
        <Button size="sm" variant="outline" className="opacity-50"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait</Button>
      </div>

      {/* Light Mode - Large Size */}
      <div className="flex flex-col gap-8 items-center p-4 bg-white">
        <Button size="lg">Button</Button>
        <Button size="lg" variant="outline">Outline</Button>
        <Button size="lg" variant="ghost">Ghost</Button>
        <Button size="lg" variant="destructive">Destructive</Button>
        <Button size="lg" variant="secondary">Secondary</Button>
        <Button size="lg" variant="link">Link</Button>
        <Button size="lg" variant="outline"><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="lg" variant="outline"><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
        <Button size="lg" variant="outline" className="opacity-50"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait</Button>
      </div>

      {/* Dark Mode - Default Size */}
      <div className="flex flex-col gap-8 items-center p-4 bg-slate-900 dark">
        <Button size="default">Button</Button>
        <Button size="default" variant="outline">Outline</Button>
        <Button size="default" variant="ghost">Ghost</Button>
        <Button size="default" variant="destructive">Destructive</Button>
        <Button size="default" variant="secondary">Secondary</Button>
        <Button size="default" variant="link">Link</Button>
        <Button size="default" variant="outline"><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="default" variant="outline"><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
        <Button size="default" variant="outline" className="opacity-50"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait</Button>
      </div>

      {/* Dark Mode - Small Size */}
      <div className="flex flex-col gap-8 items-center p-4 bg-slate-900 dark">
        <Button size="sm">Button</Button>
        <Button size="sm" variant="outline">Outline</Button>
        <Button size="sm" variant="ghost">Ghost</Button>
        <Button size="sm" variant="destructive">Destructive</Button>
        <Button size="sm" variant="secondary">Secondary</Button>
        <Button size="sm" variant="link">Link</Button>
        <Button size="sm" variant="outline"><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="sm" variant="outline"><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
        <Button size="sm" variant="outline" className="opacity-50"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait</Button>
      </div>

      {/* Dark Mode - Large Size */}
      <div className="flex flex-col gap-8 items-center p-4 bg-slate-900 dark">
        <Button size="lg">Button</Button>
        <Button size="lg" variant="outline">Outline</Button>
        <Button size="lg" variant="ghost">Ghost</Button>
        <Button size="lg" variant="destructive">Destructive</Button>
        <Button size="lg" variant="secondary">Secondary</Button>
        <Button size="lg" variant="link">Link</Button>
        <Button size="lg" variant="outline"><Send className="mr-2 h-4 w-4" />Send</Button>
        <Button size="lg" variant="outline"><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
        <Button size="lg" variant="outline" className="opacity-50"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Please wait</Button>
      </div>
    </div>
  );
}
