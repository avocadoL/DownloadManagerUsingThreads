import React from 'react';
import clsx from 'clsx';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * A number from 0-100 representing the completion percentage.
   */
  value?: number;
  /** Height of the progress bar. Defaults to 0.5rem (h-2). */
  heightClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className, heightClassName = 'h-2', ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('w-full rounded-full bg-muted overflow-hidden', heightClassName, className)}
        {...rest}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress; 