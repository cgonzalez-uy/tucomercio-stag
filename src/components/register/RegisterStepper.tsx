import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RegisterStepperProps {
  currentStep: number;
  steps: {
    title: string;
    description: string;
  }[];
}

export function RegisterStepper({ currentStep, steps }: RegisterStepperProps) {
  return (
    <div className="px-4 py-6">
      {/* Versión móvil - solo muestra el paso actual */}
      <div className="md:hidden">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
            Paso {currentStep + 1} de {steps.length}
          </div>
        </div>
        <div className="border-l-4 border-primary pl-4 py-2">
          <span className="text-sm font-medium text-primary">
            {steps[currentStep].title}
          </span>
          <p className="text-sm text-gray-500">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Versión desktop - muestra todos los pasos */}
      <nav aria-label="Progress" className="hidden md:block">
        <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
          {steps.map((step, index) => (
            <li key={step.title} className="md:flex-1">
              <div 
                className={cn(
                  "flex flex-col border-l-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                  index <= currentStep ? "border-primary" : "border-gray-200"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  index <= currentStep ? "text-primary" : "text-gray-500"
                )}>
                  Paso {index + 1}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  index <= currentStep ? "text-gray-900" : "text-gray-500"
                )}>
                  {step.title}
                </span>
                <span className="text-sm text-gray-500">
                  {step.description}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}