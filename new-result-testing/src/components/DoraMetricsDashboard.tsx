import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

interface DoraMetricsDashboardProps {
  className?: string;
}

export function DoraMetricsDashboard({ className }: DoraMetricsDashboardProps) {
  return (
<div className="flex flex-col items-center gap-1 w-auto h-auto bg-white min-h-screen w-full">
  <div className="flex flex-row items-end gap-4 h-auto bg-white">
      <div className="flex flex-col gap-2">
    <label className="text-sm font-medium">Time range</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>Pick a date</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" />
      </PopoverContent>
    </Popover>
  </div>
    <div className="flex flex-row items-center gap-4 flex-1 w-full h-auto bg-white">
        <div className="flex flex-col gap-2">
    <label className="sr-only">Project</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="All projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  </div>
    </div>
    <div className="flex flex-row items-center gap-4 flex-1 w-full h-auto bg-white">
        <div className="flex flex-col gap-2">
    <label className="sr-only">Application</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="All applications" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  </div>
    </div>
    <div className="flex flex-row items-center gap-4 flex-1 w-full h-auto bg-white">
        <div className="flex flex-col gap-2">
    <label className="sr-only">Environment</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="All environments" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  </div>
    </div>
  </div>
  <div className="flex flex-row items-end gap-4 h-auto bg-white">
    <div className="flex flex-row items-center gap-4 h-auto bg-white">
        <div className="flex flex-col gap-2">
    <label className="sr-only">Team</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="All teams" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  </div>
    </div>
    <div className="flex flex-row items-center gap-4 h-auto bg-white">
        <div className="flex flex-col gap-2">
    <label className="sr-only">People</label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="All people" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  </div>
    </div>
      <Button>Clear all</Button>
  </div>
</div>
  );
}
