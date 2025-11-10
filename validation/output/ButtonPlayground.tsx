import { Button } from "@/components/ui/button";
import { Send, ArrowRight, LoaderCircle, Sun, Moon } from "lucide-react";

interface ButtonPlaygroundProps {
  className?: string;
}

export function ButtonPlayground({ className }: ButtonPlaygroundProps) {
  return (
<div className="flex flex-col gap-4 items-center p-4 bg-white min-h-screen w-full">
  <div className="flex flex-col gap-8 items-center p-4 bg-white">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Desctructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <Button><Send className="mr-2 h-4 w-4" />Send</Button>
      <Button><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
      <Button><LoaderCircle className="mr-2 h-4 w-4" />Please wait</Button>
      <Button>Small</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Desctructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <Button><Send className="mr-2 h-4 w-4" />Send</Button>
      <Button><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
      <Button><LoaderCircle className="mr-2 h-4 w-4" />Please wait</Button>
      <Button>Large</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Desctructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <Button><Send className="mr-2 h-4 w-4" />Send</Button>
      <Button><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
      <Button><LoaderCircle className="mr-2 h-4 w-4" />Please wait</Button>
  </div>
  <div className="flex flex-col gap-8 items-center p-4 bg-slate-900">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Desctructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <Button><Send className="mr-2 h-4 w-4" />Send</Button>
      <Button><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
      <Button><LoaderCircle className="mr-2 h-4 w-4" />Please wait</Button>
      <Button>Small</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Desctructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <Button><Send className="mr-2 h-4 w-4" />Send</Button>
      <Button><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
      <Button><LoaderCircle className="mr-2 h-4 w-4" />Please wait</Button>
      <Button>Large</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Desctructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <Button><Send className="mr-2 h-4 w-4" />Send</Button>
      <Button><ArrowRight className="mr-2 h-4 w-4" />Learn more</Button>
      <Button><LoaderCircle className="mr-2 h-4 w-4" />Please wait</Button>
  </div>
</div>
  );
}
