export default function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8" role="status" aria-live="polite">
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-slate-200 border-t-slate-900`}
        aria-label="Laden..."
      />
      {text && <p className="mt-3 md:mt-4 text-sm md:text-base text-slate-500 text-center">{text}</p>}
    </div>
  )
}
