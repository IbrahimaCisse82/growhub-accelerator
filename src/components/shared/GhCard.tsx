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
      <div ref={ref} className={`bg-card border border-border rounded-xl overflow-hidden mb-4 ${className}`} {...props}>
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
            {title}
            {badge && (
              <span className="font-mono text-[10px] bg-muted text-muted-foreground px-[7px] py-px rounded-[5px]">
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
