import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  name: string;
  description?: string | undefined;
}

interface FormProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string | undefined;
  onStepClick?: (stepIndex: number) => void | undefined;
}

export const FormProgress: React.FC<FormProgressProps> = ({
  steps,
  currentStep,
  className,
  onStepClick,
}) => {
  return (
    <nav aria-label='Progress' className={cn('mb-8', className)}>
      <ol role='list' className='flex items-center'>
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : '', 'relative')}
          >
            {stepIdx < currentStep ? (
              // Completed step
              <>
                <div className='absolute inset-0 flex items-center' aria-hidden='true'>
                  <div className='h-0.5 w-full bg-primary' />
                </div>
                <button
                  type='button'
                  onClick={() => onStepClick?.(stepIdx)}
                  disabled={!onStepClick}
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/90',
                    onStepClick && 'cursor-pointer'
                  )}
                  aria-label={`${step.name} (completed)`}
                >
                  <Check className='h-5 w-5 text-primary-foreground' aria-hidden='true' />
                  <span className='sr-only'>
                    Step {stepIdx + 1}: {step.name} (completed)
                  </span>
                </button>
              </>
            ) : stepIdx === currentStep ? (
              // Current step
              <>
                <div className='absolute inset-0 flex items-center' aria-hidden='true'>
                  <div className='h-0.5 w-full bg-muted' />
                </div>
                <div
                  className='relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background'
                  aria-current='step'
                >
                  <span className='h-2.5 w-2.5 rounded-full bg-primary' aria-hidden='true' />
                  <span className='sr-only'>
                    Step {stepIdx + 1}: {step.name} (current)
                  </span>
                </div>
              </>
            ) : (
              // Upcoming step
              <>
                <div className='absolute inset-0 flex items-center' aria-hidden='true'>
                  <div className='h-0.5 w-full bg-muted' />
                </div>
                <button
                  type='button'
                  onClick={() => onStepClick?.(stepIdx)}
                  disabled={!onStepClick || stepIdx > currentStep}
                  className={cn(
                    'group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background',
                    onStepClick &&
                      stepIdx < currentStep &&
                      'cursor-pointer hover:border-muted-foreground'
                  )}
                  aria-label={`${step.name} (upcoming)`}
                >
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full bg-transparent',
                      onStepClick && stepIdx < currentStep && 'group-hover:bg-muted-foreground'
                    )}
                    aria-hidden='true'
                  />
                  <span className='sr-only'>
                    Step {stepIdx + 1}: {step.name} (upcoming)
                  </span>
                </button>
              </>
            )}
          </li>
        ))}
      </ol>

      {/* Step labels */}
      <div className='mt-4'>
        <p className='text-sm font-medium'>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.name}
        </p>
        {steps[currentStep]?.description && (
          <p className='mt-1 text-sm text-muted-foreground'>{steps[currentStep].description}</p>
        )}
      </div>
    </nav>
  );
};
