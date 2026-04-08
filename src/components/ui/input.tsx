import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={errorId}
            aria-invalid={error ? true : undefined}
            aria-required={rest.required}
            className={cn(
              "w-full px-4 py-2.5 rounded-md bg-[#f8f9fb] border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas focus:ring-2 focus:ring-aulas/20 transition-colors",
              Icon && "pl-9",
              error &&
                "border-fora ring-2 ring-fora/20 focus:border-fora focus:ring-fora/20",
              className,
            )}
            {...rest}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-error mt-1">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
