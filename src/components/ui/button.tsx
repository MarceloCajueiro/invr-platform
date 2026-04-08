import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-aulas text-white btn-3d glow-aulas transition-all",
  secondary:
    "border-2 border-aulas text-aulas hover:bg-aulas-bg transition-colors",
  success:
    "bg-success text-white btn-3d glow-tarefas transition-all",
  danger:
    "bg-fora text-white hover:opacity-90 transition-all",
  ghost:
    "text-text-secondary hover:bg-gray-100 transition-colors",
} as const;

/** 3D box-shadow per variant (darker shade beneath the button) */
const variantShadow: Record<string, string> = {
  primary: "0 4px 0 var(--color-aulas-shadow)",
  success: "0 4px 0 var(--color-tarefas-shadow)",
  danger: "0 4px 0 var(--color-fora-shadow)",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      style,
      ...rest
    },
    ref,
  ) => {
    const shadow = variantShadow[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "rounded-md font-semibold flex items-center justify-center gap-2 cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          className,
        )}
        style={{
          ...(shadow ? { boxShadow: shadow } : {}),
          ...style,
        }}
        {...rest}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
