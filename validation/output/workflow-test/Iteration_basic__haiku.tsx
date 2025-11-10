import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';

interface Iteration_basic__haikuProps {
  variant: 'default' | 'outline' | 'ghost';
  text: string;
}

const Iteration_basic__haiku: React.FC<Iteration_basic__haikuProps> = ({ variant, text }) => {
  return (
    <div className="flex flex-row gap-4 items-center">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
        <div className="flex flex-row gap-4 items-center">
          <Button variant={variant}>
            <Circle className="mr-2 h-4 w-4" />
            {text}
            <Circle className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="bg-gray-900 dark:bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-row gap-4 items-center">
          <Button variant={variant} className="text-white dark:text-gray-900">
            <Circle className="mr-2 h-4 w-4 text-white dark:text-gray-900" />
            {text}
            <Circle className="ml-2 h-4 w-4 text-white dark:text-gray-900" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Iteration_basic__haiku;