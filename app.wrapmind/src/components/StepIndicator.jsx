export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="bg-white border-b border-slate-200 px-2 py-2.5 overflow-x-auto">
      <div className="flex items-center min-w-max mx-auto">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => onStepClick(index)}
              disabled={index > currentStep}
              className={`flex flex-col items-center gap-1 ${
                index > currentStep ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
              }`}
            >
              <div
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-all border ${
                  index < currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : index === currentStep
                      ? 'bg-blue-50 border-blue-500 text-blue-500'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  index === currentStep ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`w-3 h-px mx-0.5 rounded flex-shrink-0 ${
                  index < currentStep ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
