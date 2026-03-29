import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-bg-card border border-border rounded-[var(--radius-md)] shadow-sm",
          hoverable &&
            "hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ children, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-6 py-4 border-b border-border", className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ children, className, ...rest }, ref) => {
    return (
      <div ref={ref} className={cn("px-6 py-4", className)} {...rest}>
        {children}
      </div>
    );
  },
);

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ children, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-6 py-4 border-t border-border", className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

CardFooter.displayName = "CardFooter";
