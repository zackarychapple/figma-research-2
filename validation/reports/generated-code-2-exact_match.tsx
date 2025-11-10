```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function FeatureCard({
  icon = <Rocket className="h-5 w-5" />,
  title = "Benefit driven feature title",
  description = "Shortly describe how this feature solves a specific user problem. Focus on benefits rather than technical details.",
  buttonText = "Learn more",
  onButtonClick
}: FeatureCardProps) {
  return (
    <Card className="w-[394.67px] p-6">
      <div className="flex flex-col gap-6">
        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
          {icon}
        </div>
        
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base font-semibold leading-6 text-[rgb(10,10,10)]">
            {title}
          </CardTitle>
          <CardDescription className="text-base font-normal leading-6 text-[rgb(115,115,115)]">
            {description}
          </CardDescription>
        </div>
        
        <Button 
          variant="link" 
          className="w-fit h-5 p-0 text-base font-normal"
          onClick={onButtonClick}
        >
          {buttonText}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
```