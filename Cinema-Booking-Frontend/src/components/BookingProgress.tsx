import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface BookingProgressProps {
  currentStep: 'selection' | 'payment' | 'finish';
}

const steps = [
  { id: 'selection', title: 'SEATING' },
  { id: 'payment', title: 'PAYMENT' },
  { id: 'finish', title: 'FINISH' },
];

export default function BookingProgress({ currentStep }: BookingProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.id} className="flex items-center gap-1.5">
            <div className={clsx(
              "flex items-center gap-2 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 transition-all duration-300",
              isCompleted && "bg-primary-500/15 text-primary-400 border border-primary-500/25",
              isCurrent && "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-950/40",
              !isCompleted && !isCurrent && "bg-white/[0.04] text-neutral-500 border border-white/[0.06]"
            )}>
              <span className={clsx(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                isCompleted && "bg-primary-500/30 text-primary-300",
                isCurrent && "bg-white/20 text-white",
                !isCompleted && !isCurrent && "bg-white/[0.06] text-neutral-500"
              )}>
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="hidden text-xs font-semibold sm:block tracking-wide">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={clsx(
                "hidden h-px w-6 sm:block transition-colors duration-300",
                index < currentStepIndex ? 'bg-primary-500/50' : 'bg-white/[0.08]'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
