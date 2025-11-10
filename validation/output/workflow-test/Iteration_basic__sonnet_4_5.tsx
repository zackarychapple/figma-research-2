import { Button } from "@/components/ui/button"

interface Iteration_basic__sonnet_4_5Props {}

export default function Iteration_basic__sonnet_4_5({}: Iteration_basic__sonnet_4_5Props) {
  return (
    <div className="w-full min-h-screen">
      <div className="bg-white p-8">
        <div className="flex flex-row gap-4 items-center">
          <Button variant="default">Button</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
      
      <div className="bg-slate-950 p-8">
        <div className="flex flex-row gap-4 items-center">
          <Button variant="default">Button</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
    </div>
  )
}