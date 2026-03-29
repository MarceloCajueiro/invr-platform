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
            className={cn(
              "w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors",
              Icon && "pl-9",
              error && "border-error focus:border-error",
              className,
            )}
            {...rest}
          />
        </div>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
