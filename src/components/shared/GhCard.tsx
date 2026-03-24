import { forwardRef, ReactNode } from "react";

interface GhCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

const GhCard = forwardRef<HTMLDivElement, GhCardProps>(
  ({ title, badge, action, children, noPadding, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`bg-card border border-border rounded-xl overflow-hidden mb-4 shadow-[0_1px_0_hsl(var(--border)/0.35)] ${className}`} {...props}>
        <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between gap-3 bg-surface-2/40">
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            {title}
            {badge && (
              <span className="font-mono text-[10px] bg-muted/70 text-muted-foreground px-[7px] py-px rounded-[5px] border border-border/70">
                {badge}
              </span>
            )}
          </div>
          {action}
        </div>
        <div className={noPadding ? "" : "p-5"}>{children}</div>
      </div>
    );
  }
);
GhCard.displayName = "GhCard";

export default GhCard;
