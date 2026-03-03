import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";

interface GhButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110 hover:shadow-[0_0_16px_hsl(var(--primary)/0.3)]",
  secondary: "bg-surface-2 text-foreground border border-border hover:bg-surface-3 hover:border-border/80",
  ghost: "bg-transparent text-text-secondary border border-border hover:bg-surface-2 hover:text-foreground",
  accent: "bg-gh-blue text-foreground hover:brightness-110",
};

const sizeClasses = {
  sm: "px-[11px] py-[5px] text-[11px]",
  md: "px-3.5 py-[7px] text-xs",
};

export default function GhButton({ variant = "primary", size = "sm", className = "", children, ...props }: GhButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg font-body font-semibold cursor-pointer transition-all whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
