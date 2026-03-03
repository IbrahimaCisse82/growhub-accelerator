import { ReactNode } from "react";

interface GhCardProps {
  title: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

export default function GhCard({ title, badge, action, children, noPadding }: GhCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          {title}
          {badge && (
            <span className="font-mono text-[10px] bg-surface-3 text-text-secondary px-[7px] py-px rounded-[5px]">
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
