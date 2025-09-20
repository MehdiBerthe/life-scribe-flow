import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NotebookPageProps {
  children: ReactNode;
  className?: string;
  showLines?: boolean;
}

export function NotebookPage({ children, className, showLines = false }: NotebookPageProps) {
  return (
    <div 
      className={cn(
        "bg-notebook border border-notebook-lines rounded-lg shadow-sm relative overflow-hidden",
        showLines && "bg-gradient-to-b from-transparent from-0% to-transparent",
        className
      )}
      style={showLines ? {
        backgroundImage: `repeating-linear-gradient(
          transparent,
          transparent 1.5rem,
          hsl(var(--notebook-lines)) 1.5rem,
          hsl(var(--notebook-lines)) calc(1.5rem + 1px)
        )`
      } : undefined}
    >
      {/* Red margin line for notebook effect */}
      <div className="absolute left-12 top-0 bottom-0 w-px bg-red-300/40" />
      
      {/* Three-hole punch effect */}
      <div className="absolute left-4 top-8 w-4 h-4 bg-background rounded-full shadow-inner opacity-60" />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-background rounded-full shadow-inner opacity-60" />
      <div className="absolute left-4 bottom-8 w-4 h-4 bg-background rounded-full shadow-inner opacity-60" />
      
      <div className="pl-16 pr-8 py-6">
        {children}
      </div>
    </div>
  );
}