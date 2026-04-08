import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, rows = 4, ...rest }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          aria-required={rest.required}
          className={cn(
            "w-full px-4 py-2.5 rounded-md bg-input-bg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas focus:ring-2 focus:ring-aulas/20 transition-colors resize-y",
            error &&
              "border-fora ring-2 ring-fora/20 focus:border-fora focus:ring-fora/20",
            className,
          )}
          {...rest}
        />
        {error && (
          <p id={errorId} className="text-xs text-error mt-1">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
