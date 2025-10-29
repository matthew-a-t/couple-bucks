interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
}

export const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      {/* Progress bar container */}
      <div className="relative w-full h-2 bg-border rounded-full overflow-hidden">
        {/* Filled progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step indicator text */}
      <div className="mt-3 text-center">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  )
}
